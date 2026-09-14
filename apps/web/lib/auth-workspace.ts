import { headers } from "next/headers";
import { provisionAuthenticatedTenant } from "@agesoma/db";
import { auth } from "./auth";

function workspaceSlug(userId: string) {
  return `agesoma-${userId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 18)}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function resolveAuthenticatedWorkspace() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return null;

  let organizations = await auth.api.listOrganizations({ headers: requestHeaders });
  let organization = organizations[0];

  if (!organization) {
    try {
      organization = await auth.api.createOrganization({
        headers: requestHeaders,
        body: {
          name: "Minha empresa",
          slug: workspaceSlug(session.user.id),
          keepCurrentActiveOrganization: false
        }
      });
    } catch {
      organizations = await auth.api.listOrganizations({ headers: requestHeaders });
      organization = organizations[0];
    }
  }

  if (!organization) throw new Error("Unable to provision authenticated organization");

  const fullOrganization = await auth.api.getFullOrganization({
    headers: requestHeaders,
    query: { organizationId: organization.id }
  });
  const member = fullOrganization?.members?.find((candidate) => candidate.userId === session.user.id);

  const tenantId = await provisionAuthenticatedTenant({
    authOrganizationId: organization.id,
    actorId: session.user.id,
    companyName: organization.name,
    role: member?.role ?? "member"
  });

  return {
    tenantId,
    actorId: session.user.id,
    user: session.user,
    organization,
    role: member?.role ?? "member"
  };
}
