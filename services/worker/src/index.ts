import { PgBoss } from "pg-boss";
import { evaluateMargin, evaluateSentinel } from "@agesoma/core";
import { executeWithHermes } from "./hermes";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const boss = new PgBoss(process.env.DATABASE_URL);
boss.on("error", (error) => console.error("pg-boss", error));
await boss.start();
await boss.createQueue("agesoma.execute");

await boss.work("agesoma.execute", async ([job]) => {
  const data = job.data as {
    taskId: string;
    tenantId: string;
    action: string;
    riskClass: "R0" | "R1" | "R2" | "R3" | "R4";
    reversible: boolean;
    external: boolean;
    hasScopedGrant: boolean;
    expectedValueCents: number;
    expectedCostCents: number;
    expectedLossCents: number;
    confidence: number;
    payload: Record<string, unknown>;
  };

  const policy = evaluateSentinel(data);
  if (policy.decision === "DENY") return { status: "denied", reason: policy.reason };
  if (policy.decision === "REVIEW") return { status: "awaiting_approval", reason: policy.reason };

  const margin = evaluateMargin(data);
  if (margin.decision !== "EXECUTE") return { status: "replan", reason: margin.reason };

  return executeWithHermes({
    taskId: data.taskId,
    tenantId: data.tenantId,
    action: data.action,
    payload: data.payload
  });
});

console.log("AGESOMA worker listening on agesoma.execute");
