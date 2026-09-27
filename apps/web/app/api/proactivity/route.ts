import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sql, tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../lib/auth-workspace";
import { ensurePersistentWorkerByTemplate, workerTemplateForRoutine } from "../../../lib/persistent-worker";

const cadenceSchema = z.enum(["15m", "1h", "6h", "1d", "7d"]);
const interruptSchema = z.enum(["silent", "only_if_actionable", "always"]);
const triggerSchema = z.enum(["cadence","webhook","event"]);

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
  cadence: cadenceSchema.optional(),
  resource: z.string().max(120).optional(),
  kind: z.string().min(1).max(80).default("general"),
  connectedServiceId: z.string().uuid().optional(),
  interruptPolicy: interruptSchema.default("only_if_actionable"),
  triggerKind: triggerSchema.default("cadence"),
  triggerConfig: z.record(z.string(), z.unknown()).default({})
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
      worker_id,trigger_kind,trigger_config,last_checked_at,next_check_at,created_at,updated_at
    from watchers
    where tenant_id=$1
    order by created_at desc
  `, [authenticated.tenantId]);

  const interruptions = await tenantSql(authenticated.tenantId, `
    select id,watcher_id,source_task_id,attention_decision_id,kind,summary,status,delivery_mode,created_at,read_at
    from proactive_interruptions
    where tenant_id=$1
    order by created_at desc
    limit 50
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
    watchers,
    routines: watchers,
    interruptions
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

  if (input.triggerKind === "event") {
    const eventKind = input.triggerConfig.eventKind;
    if (typeof eventKind !== "string" || eventKind.trim().length < 2 || eventKind.length > 120) {
      return NextResponse.json({ error: "Routine de evento exige triggerConfig.eventKind." }, { status: 400 });
    }
  }

  const workerTemplate = workerTemplateForRoutine(input.kind, input.resource);
  const worker = await ensurePersistentWorkerByTemplate(authenticated.tenantId, workerTemplate);
  const cadence = input.triggerKind === "cadence" ? (input.cadence ?? "6h") : null;
  const webhookSecret = input.triggerKind === "webhook" ? randomBytes(32).toString("hex") : null;
  const webhookSecretHash = webhookSecret
    ? createHash("sha256").update(webhookSecret).digest("hex")
    : null;

  const [watcher] = await tenantSql(authenticated.tenantId, `
    insert into watchers (
      tenant_id,kind,status,cadence,config,next_check_at,connected_service_id,interrupt_policy,
      worker_id,trigger_kind,trigger_config
    ) values (
      $1,'watch','active',$2,$3::jsonb,
      case when $6='cadence' then now() else null end,
      $4,$5,$7,$6,$8::jsonb
    )
    returning id,kind,status,cadence,config,connected_service_id,interrupt_policy,
      worker_id,trigger_kind,trigger_config,next_check_at,created_at
  `, [
    authenticated.tenantId,
    cadence,
    JSON.stringify({
      objective: input.objective,
      resource: input.resource ?? null,
      proactivityKind: input.kind
    }),
    input.connectedServiceId ?? null,
    input.interruptPolicy,
    input.triggerKind,
    worker?.id ?? null,
    JSON.stringify(input.triggerConfig)
  ]);

  if (webhookSecretHash) {
    try {
      await sql(`
        insert into routine_webhook_secrets (tenant_id,watcher_id,secret_hash)
        values ($1,$2,$3)
        on conflict (tenant_id,watcher_id) do update set
          secret_hash=excluded.secret_hash,
          revoked_at=null,
          last_used_at=null,
          created_at=now()
      `, [authenticated.tenantId,(watcher as { id:string }).id,webhookSecretHash]);
    } catch (error) {
      await tenantSql(authenticated.tenantId, `
        update watchers set status='failed',updated_at=now()
        where tenant_id=$1 and id=$2
      `, [authenticated.tenantId,(watcher as { id:string }).id]).catch(()=>undefined);
      throw error;
    }
  }

  return NextResponse.json({
    ...watcher,
    webhook: webhookSecret ? {
      path: `/api/routines/webhook/${(watcher as { id:string }).id}`,
      secret: webhookSecret,
      shownOnce: true
    } : null
  }, { status: 201 });
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

  if (watcher) {
    await sql(`
      update routine_webhook_secrets
      set revoked_at=now()
      where tenant_id=$1 and watcher_id=$2 and revoked_at is null
    `, [authenticated.tenantId,id]).catch(()=>undefined);
  }

  if (!watcher) return NextResponse.json({ error: "Monitoramento ativo não encontrado." }, { status: 404 });
  return NextResponse.json(watcher);
}


export async function PUT(req: Request) {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const parsed = z.object({
    id: z.string().uuid(),
    status: z.enum(["read", "dismissed"])
  }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Atualização inválida." }, { status: 400 });

  const [interruption] = await tenantSql(authenticated.tenantId, `
    update proactive_interruptions
    set status=$3,read_at=case when $3='read' then now() else read_at end
    where tenant_id=$1 and id=$2
    returning id,status,read_at
  `, [authenticated.tenantId, parsed.data.id, parsed.data.status]);

  if (!interruption) return NextResponse.json({ error: "Aviso não encontrado." }, { status: 404 });
  return NextResponse.json(interruption);
}
