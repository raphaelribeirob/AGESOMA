import { NextResponse } from "next/server";
import { z } from "zod";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../lib/auth-workspace";

const cadenceSchema = z.enum(["15m", "1h", "6h", "1d", "7d"]);
const interruptSchema = z.enum(["silent", "only_if_actionable", "always"]);

const preferencesSchema = z.object({
  enabled: z.boolean(),
  timezone: z.string().min(1).max(80),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  maxInterruptionsPerDay: z.number().int().min(0).max(24),
  allowedKinds: z.array(z.string().min(1).max(80)).max(30)
});

const watcherSchema = z.object({
  objective: z.string().min(3).max(2000),
  cadence: cadenceSchema.default("6h"),
  resource: z.string().max(120).optional(),
  kind: z.string().min(1).max(80).default("general"),
  connectedServiceId: z.string().uuid().optional(),
  interruptPolicy: interruptSchema.default("only_if_actionable")
});

export async function GET() {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const [preferences] = await tenantSql(authenticated.tenantId, `
    select enabled,timezone,quiet_hours_start,quiet_hours_end,max_interruptions_per_day,
      allowed_kinds,updated_at
    from proactivity_preferences
    where tenant_id=$1
  `, [authenticated.tenantId]);

  const watchers = await tenantSql(authenticated.tenantId, `
    select id,kind,status,cadence,config,connected_service_id,interrupt_policy,
      last_checked_at,next_check_at,created_at,updated_at
    from watchers
    where tenant_id=$1
    order by created_at desc
  `, [authenticated.tenantId]);

  return NextResponse.json({
    preferences: preferences ?? {
      enabled: false,
      timezone: "UTC",
      quiet_hours_start: null,
      quiet_hours_end: null,
      max_interruptions_per_day: 3,
      allowed_kinds: ["calendar", "communication", "paid_media", "general"]
    },
    watchers
  });
}

export async function PATCH(req: Request) {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const parsed = preferencesSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Preferências inválidas." }, { status: 400 });
  const input = parsed.data;

  const [preferences] = await tenantSql(authenticated.tenantId, `
    insert into proactivity_preferences (
      tenant_id,enabled,timezone,quiet_hours_start,quiet_hours_end,
      max_interruptions_per_day,allowed_kinds,updated_by
    ) values ($1,$2,$3,$4::time,$5::time,$6,$7::jsonb,$8)
    on conflict (tenant_id) do update set
      enabled=excluded.enabled,
      timezone=excluded.timezone,
      quiet_hours_start=excluded.quiet_hours_start,
      quiet_hours_end=excluded.quiet_hours_end,
      max_interruptions_per_day=excluded.max_interruptions_per_day,
      allowed_kinds=excluded.allowed_kinds,
      updated_by=excluded.updated_by,
      updated_at=now()
    returning enabled,timezone,quiet_hours_start,quiet_hours_end,max_interruptions_per_day,allowed_kinds,updated_at
  `, [
    authenticated.tenantId,
    input.enabled,
    input.timezone,
    input.quietHoursStart ?? null,
    input.quietHoursEnd ?? null,
    input.maxInterruptionsPerDay,
    JSON.stringify(input.allowedKinds),
    authenticated.actorId
  ]);

  return NextResponse.json(preferences);
}

export async function POST(req: Request) {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const parsed = watcherSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Monitoramento inválido." }, { status: 400 });
  const input = parsed.data;

  if (input.connectedServiceId) {
    const [service] = await tenantSql<{ id: string }>(authenticated.tenantId, `
      select id from connected_services
      where tenant_id=$1 and id=$2 and status='active'
      limit 1
    `, [authenticated.tenantId, input.connectedServiceId]);
    if (!service) return NextResponse.json({ error: "Conexão ativa não encontrada." }, { status: 400 });
  }

  const [watcher] = await tenantSql(authenticated.tenantId, `
    insert into watchers (
      tenant_id,kind,status,cadence,config,next_check_at,connected_service_id,interrupt_policy
    ) values ($1,'watch','active',$2,$3::jsonb,now(),$4,$5)
    returning id,kind,status,cadence,config,connected_service_id,interrupt_policy,next_check_at,created_at
  `, [
    authenticated.tenantId,
    input.cadence,
    JSON.stringify({
      objective: input.objective,
      resource: input.resource ?? null,
      proactivityKind: input.kind
    }),
    input.connectedServiceId ?? null,
    input.interruptPolicy
  ]);

  return NextResponse.json(watcher, { status: 201 });
}

export async function DELETE(req: Request) {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Monitoramento inválido." }, { status: 400 });
  }

  const [watcher] = await tenantSql(authenticated.tenantId, `
    update watchers set status='paused',updated_at=now()
    where tenant_id=$1 and id=$2 and status='active'
    returning id,status
  `, [authenticated.tenantId, id]);

  if (!watcher) return NextResponse.json({ error: "Monitoramento ativo não encontrado." }, { status: 404 });
  return NextResponse.json(watcher);
}
