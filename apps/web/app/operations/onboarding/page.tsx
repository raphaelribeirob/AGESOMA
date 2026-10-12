import { redirect } from "next/navigation";
import { resolveAuthenticatedWorkspace } from "../../../lib/auth-workspace";
import EnterpriseOnboarding from "./enterprise-onboarding";

export const dynamic = "force-dynamic";

export default async function OperationsOnboardingPage() {
  const workspace = await resolveAuthenticatedWorkspace();
  if (!workspace) redirect("/sign-in");
  return <EnterpriseOnboarding canCreate={workspace.role === "owner" || workspace.role === "admin"} />;
}
