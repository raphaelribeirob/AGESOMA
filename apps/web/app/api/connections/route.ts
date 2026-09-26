import { NextResponse } from "next/server";
import { z } from "zod";
import { tenantSql } from "@agesoma/db";
import { resolveAuthenticatedWorkspace } from "../../../lib/auth-workspace";

const providerSchema = z.enum([
  "gmail",
  "google_calendar",
  "google_drive",
  "google_contacts",
  "meta_ads",
  "google_ads",
  "whatsapp"
]);

const registerSchema = z.object({
  provider: providerSchema,
  externalAccountId: z.string().min(1).max(240),
  displayName: z.string().max(240).optional(),
  credentialHandleId: z.string().uuid().optional(),
  capabilities: z.array(z.string().min(1).max(120)).max(50).default([]),
  permissions: z.record(z.string(), z.boolean()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({})
});

function authorizationUrl(provider: z.infer<typeof providerSchema>) {
  const key = {
    gmail: "AGESOMA_GMAIL_AUTH_URL",
    google_calendar: "AGESOMA_GOOGLE_CALENDAR_AUTH_URL",
    google_drive: "AGESOMA_GOOGLE_DRIVE_AUTH_URL",
    google_contacts: "AGESOMA_GOOGLE_CONTACTS_AUTH_URL",
    meta_ads: "AGESOMA_META_ADS_AUTH_URL",
    google_ads: "AGESOMA_GOOGLE_ADS_AUTH_URL",
    whatsapp: "AGESOMA_WHATSAPP_AUTH_URL"
  }[provider];
  return process.env[key]?.trim() || null;
}

export async function GET() {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const services = await tenantSql(authenticated.tenantId, `
    select id,provider,external_account_id,display_name,auth_mode,capabilities,permissions,
      status,metadata,connected_at,last_synced_at,created_at,updated_at
    from connected_services
    where tenant_id=$1
    order by case status when 'active' then 0 when 'pending' then 1 else 2 end, provider asc
  `, [authenticated.tenantId]);

  const providers = providerSchema.options.map((provider) => ({
    provider,
    authorizationAvailable: Boolean(authorizationUrl(provider))
  }));

  return NextResponse.json({ services, providers });
}

export async function POST(req: Request) {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (body?.action === "begin") {
    const parsed = z.object({ action: z.literal("begin"), provider: providerSchema }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Conector inválido." }, { status: 400 });
    const url = authorizationUrl(parsed.data.provider);
    if (!url) {
      return NextResponse.json({
        error: "A autorização desse conector ainda não foi configurada neste ambiente."
      }, { status: 409 });
    }
    return NextResponse.json({ authorizationUrl: url });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Conexão inválida." }, { status: 400 });

  // This registration endpoint never accepts raw credentials. It only binds an opaque
  // credential handle already created by the broker/OAuth callback to this tenant.
  const input = parsed.data;
  if (input.credentialHandleId) {
    const [handle] = await tenantSql<{ id: string }>(authenticated.tenantId, `
      select id from credential_handles
      where tenant_id=$1 and id=$2 and status='active'
      limit 1
    `, [authenticated.tenantId, input.credentialHandleId]);
    if (!handle) return NextResponse.json({ error: "Credencial autorizada não encontrada." }, { status: 400 });
  }

  const [service] = await tenantSql(authenticated.tenantId, `
    insert into connected_services (
      tenant_id,provider,external_account_id,display_name,credential_handle_id,
      capabilities,permissions,status,metadata,connected_at
    ) values ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9::jsonb,$10)
    on conflict (tenant_id,provider,external_account_id) do update set
      display_name=excluded.display_name,
      credential_handle_id=coalesce(excluded.credential_handle_id,connected_services.credential_handle_id),
      capabilities=excluded.capabilities,
      permissions=excluded.permissions,
      status=excluded.status,
      metadata=excluded.metadata,
      connected_at=coalesce(connected_services.connected_at,excluded.connected_at),
      updated_at=now()
    returning id,provider,external_account_id,display_name,capabilities,permissions,status,connected_at,updated_at
  `, [
    authenticated.tenantId,
    input.provider,
    input.externalAccountId,
    input.displayName ?? null,
    input.credentialHandleId ?? null,
    JSON.stringify(input.capabilities),
    JSON.stringify(input.permissions),
    input.credentialHandleId ? "active" : "pending",
    JSON.stringify(input.metadata),
    input.credentialHandleId ? new Date() : null
  ]);

  return NextResponse.json(service, { status: 201 });
}

export async function DELETE(req: Request) {
  const authenticated = await resolveAuthenticatedWorkspace();
  if (!authenticated) return NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Conexão inválida." }, { status: 400 });
  }

  const [service] = await tenantSql(authenticated.tenantId, `
    update connected_services
    set status='revoked',updated_at=now()
    where tenant_id=$1 and id=$2 and status <> 'revoked'
    returning id,provider,status
  `, [authenticated.tenantId, id]);

  if (!service) return NextResponse.json({ error: "Conexão não encontrada." }, { status: 404 });
  return NextResponse.json(service);
}
