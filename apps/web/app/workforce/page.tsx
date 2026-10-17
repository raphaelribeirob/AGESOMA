import { redirect } from "next/navigation";
import { resolveAuthenticatedWorkspace } from "../../lib/auth-workspace";
import WorkforcePreview from "./workforce-preview";
import { probeExecutiveExecutor } from "../../lib/executive-executor-readiness";

export const dynamic = "force-dynamic";

export default async function WorkforcePage() {
  const workspace = await resolveAuthenticatedWorkspace();
  if (!workspace) redirect("/sign-in");
  const runtime = await probeExecutiveExecutor(process.env.AGESOMA_EXECUTOR_URL, process.env.AGESOMA_EXECUTOR_ATTEST_SECRET);

  return (
    <WorkforcePreview
      workspaceName={workspace.organization.name}
      runtimeStatus={runtime.ready ? "attested" : "unavailable"}
      diagnosticsEnabled={runtime.ready && process.env.AGESOMA_EXECUTOR_DIAGNOSTIC_ENABLED === "true" && process.env.VERCEL_ENV !== "production" && (workspace.role === "owner" || workspace.role === "admin")}
    />
  );
}
