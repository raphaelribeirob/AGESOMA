import { NextResponse } from "next/server";
import { z } from "zod";
import {
  compileEnterpriseDeployment,
  enterpriseIntakeHash,
  ENTERPRISE_TEMPLATE_VERSION
} from "@agesoma/core";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../lib/auth-workspace";

const sources = z.object({
  contract: z.string().trim().max(320).optional(),
  rateTable: z.string().trim().max(320).optional(),
  cte: z.string().trim().max(320).optional(),
  invoice: z.string().trim().max(320).optional()
}).strict();
const payload = z.object({
  idempotencyKey: z.string().uuid(),
  companyName: z.string().trim().min(2).max(160),
  outcome: z.string().trim().min(2).max(500),
  ownerRole: z.enum(["cfo", "controller", "logistics"]),
  monthlyFreightSpendCents: z.number().int().min(0).max(100_000_000_000).nullable(),
  sources
}).strict();

type DeploymentRow = {
  id: string;
  template_version: string;
  status: string;
  request_hash: string;
  plan: unknown;
  created_at: Date | string;
};

const error = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function GET() {
  const workspace = await resolveAuthenticatedWorkspace();
  if (!workspace) return error("Autenticação necessária.", 401);
  const entries = await tenantSql<DeploymentRow>(workspace.tenantId, [
    "select id,template_version,status,request_hash,plan,created_at",
    "from enterprise_deployment_plans where tenant_id=$1",
    "order by created_at desc limit 20"
  ].join(" "), [workspace.tenantId]);
  return NextResponse.json({
    deployments: entries.map(row => ({
      id: row.id,
      templateVersion: row.template_version,
      status: row.status,
      plan: row.plan,
      createdAt: new Date(row.created_at).toISOString()
    })),
    note: "Somente planos. Nenhum agente foi ativado por esta API."
  });
}

export async function POST(req: Request) {
  const workspace = await resolveAuthenticatedWorkspace();
  if (!workspace) return error("Autenticação necessária.", 401);
  if (!["owner", "admin"].includes(workspace.role)) return error("Somente owner/admin pode criar um plano.", 403);
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return error("Content-Type application/json obrigatório.", 415);
  }
  const parsed = payload.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return error("Dados do onboarding inválidos.", 400);
  const { idempotencyKey, ...intake } = parsed.data;
  const plan = compileEnterpriseDeployment(intake);
  const hash = enterpriseIntakeHash(intake);
  const rows = await tenantSql<{ id: string }>(workspace.tenantId, [
    "insert into enterprise_deployment_plans",
    "(tenant_id,created_by,idempotency_key,request_hash,template_version,intake,plan,status)",
    "values ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,'draft')",
    "on conflict (tenant_id,idempotency_key) do nothing",
    "returning id"
  ].join(" "), [
    workspace.tenantId, workspace.actorId, idempotencyKey,
    hash, ENTERPRISE_TEMPLATE_VERSION, JSON.stringify(intake), JSON.stringify(plan)
  ]);
  const id = rows[0]?.id;
  if (id) return NextResponse.json({ id, plan, status: "draft", created: true }, { status: 201 });
  const [old] = await tenantSql<DeploymentRow>(workspace.tenantId, [
    "select id,template_version,status,request_hash,plan,created_at",
    "from enterprise_deployment_plans where tenant_id=$1 and idempotency_key=$2 limit 1"
  ].join(" "), [workspace.tenantId, idempotencyKey]);
  if (!old || old.request_hash !== hash) return error("Chave de idempotência usada para outro escopo.", 409);
  return NextResponse.json({ id: old.id, plan: old.plan, status: old.status, created: false });
}
