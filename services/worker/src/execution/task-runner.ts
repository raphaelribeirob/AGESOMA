import { createHash } from "node:crypto";
import {
  buildCapabilityScope,
  evaluateMargin,
  evaluateSentinel,
  getActionPolicy,
  serializeCapabilityScope
} from "@agesoma/core";
import { sql } from "@agesoma/db";
import { loadAutonomy } from "../autonomy";
import { brainQueryForTask, recallCompanyContext, rememberCompanyEpisode } from "../company-brain";
import { executeWithHermes } from "../hermes";
import { persistProductOutput } from "../product-output";
import type { QueuedTask } from "../types";

export type ExecuteJob = {
  taskId: string;
  tenantId: string;
};

export async function executeQueuedTask(queued: ExecuteJob) {
  const [task] = await sql<QueuedTask>(`
    select id, tenant_id, workflow_id, action_type, risk_class, reversible, external,
      expected_value_cents, expected_cost_cents, expected_loss_cents, confidence, payload
    from tasks
    where id=$1 and tenant_id=$2 and status='queued'
    limit 1
  `, [queued.taskId, queued.tenantId]);

  if (!task) return { status: "stale", reason: "Task is no longer queued" };

  const data = {
    taskId: task.id,
    tenantId: task.tenant_id,
    action: task.action_type,
    riskClass: task.risk_class,
    reversible: task.reversible,
    external: task.external,
    expectedValueCents: Number(task.expected_value_cents),
    expectedCostCents: Number(task.expected_cost_cents),
    expectedLossCents: Number(task.expected_loss_cents),
    confidence: Number(task.confidence),
    payload: task.payload
  };

  const capabilityScope = buildCapabilityScope({
    taskId: data.taskId,
    action: data.action,
    payload: data.payload
  });
  const capabilityHash = createHash("sha256")
    .update(serializeCapabilityScope(capabilityScope))
    .digest("hex");
  const registeredAction = getActionPolicy(data.action);

  if (!registeredAction) {
    await sql(
      `update tasks set status='denied', failure_reason='Unknown action', updated_at=now()
       where id=$1 and tenant_id=$2`,
      [data.taskId, data.tenantId]
    );
    return { status: "denied", reason: "Unknown action" };
  }

  const consequential = registeredAction.riskClass === "R2" || registeredAction.riskClass === "R3";
  const incompleteScope = consequential &&
    (!capabilityScope.destination || !capabilityScope.operation || !capabilityScope.resource);
  const missingCommitAmount =
    registeredAction.riskClass === "R3" && capabilityScope.amountCents === null;

  if (incompleteScope || missingCommitAmount) {
    const reason = missingCommitAmount
      ? "Consequential commitment is missing an explicit amount"
      : "Consequential capability is unresolved";

    await sql(
      `insert into policy_decisions
       (tenant_id, task_id, action_class, risk_class, decision, reason, metadata)
       values ($1,$2,$3,$4,'DENY',$5,$6::jsonb)`,
      [
        data.tenantId,
        data.taskId,
        data.action,
        data.riskClass,
        reason,
        JSON.stringify({
          capabilityHash,
          destination: capabilityScope.destination,
          operation: capabilityScope.operation,
          resource: capabilityScope.resource
        })
      ]
    );

    await sql(
      `update tasks set status='denied', failure_reason=$3, updated_at=now()
       where id=$1 and tenant_id=$2`,
      [data.taskId, data.tenantId, reason]
    );
    return { status: "denied", reason };
  }

  const grants = await sql<{ id: string }>(`
    select id from approval_grants
    where tenant_id=$1 and task_id=$2 and action_class=$3 and scope_hash=$4
      and revoked_at is null and consumed_at is null and expires_at > now()
    order by created_at desc limit 1
  `, [data.tenantId, data.taskId, data.action, capabilityHash]);

  const autonomy = await loadAutonomy({
    tenantId: data.tenantId,
    taskId: data.taskId,
    action: data.action,
    payload: data.payload
  });

  if (autonomy.resolution.decision === "DENY") {
    await sql(
      `insert into policy_decisions
       (tenant_id, task_id, action_class, risk_class, decision, reason, metadata)
       values ($1,$2,$3,$4,'DENY','Owner autonomy rule denies this action',$5::jsonb)`,
      [
        data.tenantId,
        data.taskId,
        data.action,
        data.riskClass,
        JSON.stringify({
          autonomyRuleId: autonomy.resolution.ruleId,
          capabilityHash
        })
      ]
    );

    await sql(
      `update tasks
       set status='denied', failure_reason='Owner autonomy rule denies this action', updated_at=now()
       where id=$1 and tenant_id=$2`,
      [data.taskId, data.tenantId]
    );
    return { status: "denied", reason: "Owner autonomy rule denies this action" };
  }

  const hasAuthority = grants.length > 0 || autonomy.resolution.decision === "ALLOW";
  const policy = evaluateSentinel({ ...data, type: data.action, hasScopedGrant: hasAuthority });

  await sql(
    `insert into policy_decisions
     (tenant_id, task_id, action_class, risk_class, decision, reason, metadata)
     values ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
    [
      data.tenantId,
      data.taskId,
      data.action,
      data.riskClass,
      policy.decision,
      policy.reason,
      JSON.stringify({
        autonomyRuleId: autonomy.resolution.ruleId,
        capabilityHash,
        destination: capabilityScope.destination,
        operation: capabilityScope.operation,
        resource: capabilityScope.resource
      })
    ]
  );

  if (policy.decision === "DENY") {
    await sql(
      `update tasks set status='denied', failure_reason=$3, updated_at=now()
       where id=$1 and tenant_id=$2`,
      [data.taskId, data.tenantId, policy.reason]
    );
    return { status: "denied", reason: policy.reason };
  }

  if (policy.decision === "REVIEW") {
    await sql(
      `update tasks set status='awaiting_approval', dispatched_at=null, updated_at=now()
       where id=$1 and tenant_id=$2`,
      [data.taskId, data.tenantId]
    );
    return { status: "awaiting_approval", reason: policy.reason };
  }

  const margin = evaluateMargin(data);
  if (margin.decision !== "EXECUTE") {
    await sql(
      `update tasks set status='failed', failure_reason=$3, updated_at=now()
       where id=$1 and tenant_id=$2`,
      [data.taskId, data.tenantId, margin.reason]
    );
    return { status: "replan", reason: margin.reason };
  }

  let grantRef: string | undefined;

  if (registeredAction.riskClass === "R2" || registeredAction.riskClass === "R3") {
    if (autonomy.resolution.decision === "ALLOW" && autonomy.resolution.ruleId) {
      grantRef = `autonomy:${autonomy.resolution.ruleId}`;
    } else {
      const grantId = grants[0]?.id;
      if (!grantId) {
        await sql(
          `update tasks set status='awaiting_approval', dispatched_at=null, updated_at=now()
           where id=$1 and tenant_id=$2`,
          [data.taskId, data.tenantId]
        );
        return { status: "awaiting_approval", reason: "Exact approval grant missing" };
      }

      const consumed = await sql<{ id: string }>(`
        update approval_grants set consumed_at=now()
        where id=$1 and tenant_id=$2 and task_id=$3 and action_class=$4 and scope_hash=$5
          and revoked_at is null and consumed_at is null and expires_at > now()
        returning id
      `, [grantId, data.tenantId, data.taskId, data.action, capabilityHash]);

      if (!consumed[0]) {
        await sql(
          `update tasks set status='awaiting_approval', dispatched_at=null, updated_at=now()
           where id=$1 and tenant_id=$2`,
          [data.taskId, data.tenantId]
        );
        return {
          status: "awaiting_approval",
          reason: "Approval grant expired, consumed or scope changed"
        };
      }
      grantRef = consumed[0].id;
    }
  }

  if (data.external) {
    await sql(
      `insert into egress_decisions
       (tenant_id, task_id, destination, operation, action_class, decision, reason, capability_hash)
       values ($1,$2,$3,$4,$5,'ALLOW',$6,$7)`,
      [
        data.tenantId,
        data.taskId,
        capabilityScope.destination ?? "authorized-read",
        capabilityScope.operation,
        data.action,
        grantRef
          ? `Sentinel allowed execution with scoped authority ${grantRef}`
          : policy.reason,
        capabilityHash
      ]
    );
  }

  await sql(
    `update tasks
     set status='running', execution_started_at=now(), failure_reason=null, updated_at=now()
     where id=$1 and tenant_id=$2`,
    [data.taskId, data.tenantId]
  );

  try {
    let executionPayload = data.payload;

    if (data.action === "business.observe" || data.action === "business.work") {
      const brainFacts = await recallCompanyContext({
        tenantId: data.tenantId,
        query: brainQueryForTask(data.action, data.payload),
        limit: 10
      }).catch((error) => {
        console.error("Company Brain recall failed", error);
        return [];
      });

      if (brainFacts.length) {
        executionPayload = {
          ...data.payload,
          businessMemory: {
            source: "agesoma-company-brain",
            trust: "context-only-not-authorization-or-proof",
            facts: brainFacts.map((item) => ({
              fact: item.fact,
              validAt: item.valid_at ?? null,
              invalidAt: item.invalid_at ?? null
            }))
          }
        };
      }
    }

    const result = await executeWithHermes({
      taskId: data.taskId,
      tenantId: data.tenantId,
      action: data.action,
      payload: executionPayload,
      grantRef
    });

    await sql(
      `update tasks
       set status='completed', execution_finished_at=now(), execution_result=$3::jsonb, updated_at=now()
       where id=$1 and tenant_id=$2`,
      [data.taskId, data.tenantId, JSON.stringify(result)]
    );

    await persistProductOutput(task, result);

    if (typeof data.payload.watcherId === "string") {
      await sql(
        `update watchers set last_checked_at=now(), updated_at=now()
         where id=$1 and tenant_id=$2`,
        [data.payload.watcherId, data.tenantId]
      );
    }

    const objective = typeof data.payload.objective === "string"
      ? data.payload.objective
      : null;
    const resultSnapshot = JSON.stringify(result).slice(0, 12_000);

    await rememberCompanyEpisode({
      tenantId: data.tenantId,
      name: `task.completed:${data.action}`,
      sourceDescription: "Verified AGESOMA task completion record after product persistence",
      content: {
        event: "task.completed",
        taskId: data.taskId,
        workflowId: task.workflow_id,
        action: data.action,
        objective,
        operation: typeof data.payload.operation === "string"
          ? data.payload.operation
          : null,
        resource: typeof data.payload.resource === "string"
          ? data.payload.resource
          : null,
        destination: typeof data.payload.destination === "string"
          ? data.payload.destination
          : null,
        completedAt: new Date().toISOString(),
        executionResultSnapshot: resultSnapshot
      }
    }).catch((error) => console.error("Company Brain ingestion failed", error));

    return result;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Execution failed";

    await sql(
      `update tasks
       set status='failed', execution_finished_at=now(), failure_reason=$3, updated_at=now()
       where id=$1 and tenant_id=$2`,
      [data.taskId, data.tenantId, reason]
    );

    if (typeof data.payload.watcherId === "string") {
      await sql(
        `update watchers set last_checked_at=now(), updated_at=now()
         where id=$1 and tenant_id=$2`,
        [data.payload.watcherId, data.tenantId]
      );
    }
    throw error;
  }
}
