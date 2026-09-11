import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@agesoma/db";

const schema = z.object({
  tenantId: z.string().uuid(),
  taskId: z.string().uuid(),
  actionClass: z.string().min(1),
  expiresAt: z.coerce.date().optional()
});

export async function POST(req: Request) {
  const input = schema.parse(await req.json());
  const [task] = await sql<{ id: string; status: string; tenant_id: string }>(
    `select id, status, tenant_id from tasks where id=$1 and tenant_id=$2 limit 1`,
    [input.taskId, input.tenantId]
  );
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  if (task.status !== "awaiting_approval") return NextResponse.json({ error: "Task is not awaiting approval" }, { status: 409 });

  const [grant] = await sql<{ id: string }>(`
    insert into approval_grants (tenant_id, task_id, action_class, expires_at)
    values ($1,$2,$3,$4)
    returning id
  `, [input.tenantId, input.taskId, input.actionClass, input.expiresAt ?? null]);

  await sql(`update tasks set status='queued', updated_at=now() where id=$1 and tenant_id=$2`, [input.taskId, input.tenantId]);
  return NextResponse.json({ grantId: grant.id, taskStatus: "queued" }, { status: 201 });
}
