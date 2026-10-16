import { redirect } from "next/navigation";
import { resolveAuthenticatedWorkspace } from "../../lib/auth-workspace";
import WorkforcePreview from "./workforce-preview";

export const dynamic = "force-dynamic";

export default async function WorkforcePage() {
  const workspace = await resolveAuthenticatedWorkspace();
  if (!workspace) redirect("/sign-in");

  return (
    <WorkforcePreview
      workspaceName={workspace.organization.name}
    />
  );
}
