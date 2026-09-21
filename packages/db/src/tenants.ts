import { sql } from "./client";

export async function provisionAuthenticatedTenant(input: {
  authOrganizationId: string;
  actorId: string;
  companyName: string;
  role?: string;
}) {
  // Provisioning is intentionally system-scoped because the tenant does not exist yet.
  const existing = await sql<{ tenant_id: string }>(
    "select tenant_id from auth_organization_tenants where auth_organization_id=$1 limit 1",
    [input.authOrganizationId]
  );

  let tenantId = existing[0]?.tenant_id;

  if (!tenantId) {
    const created = await sql<{ id: string }>(
      "insert into tenants(name) values ($1) returning id",
      [input.companyName]
    );
    tenantId = created[0].id;

    await sql(
      "insert into auth_organization_tenants(auth_organization_id, tenant_id) values ($1,$2)",
      [input.authOrganizationId, tenantId]
    );
  }

  await sql(
    `insert into tenant_memberships(tenant_id, actor_id, role)
     values ($1,$2,$3)
     on conflict (tenant_id, actor_id) do update set role=excluded.role`,
    [tenantId, input.actorId, input.role ?? "owner"]
  );

  return tenantId;
}
