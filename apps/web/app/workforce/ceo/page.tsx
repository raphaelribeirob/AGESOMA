import { redirect } from "next/navigation";
import { resolveAuthenticatedWorkspace } from "../../../lib/auth-workspace";
import CeoIntake from "./ceo-intake";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "CEO — Conhecendo a empresa | AGESOMA",
  description: "Primeira etapa da equipe AGESOMA: descrição da empresa com revisão e confirmação do responsável."
};

export default async function CeoOnboardingPage() {
  const workspace = await resolveAuthenticatedWorkspace();
  if (!workspace) redirect("/sign-in");
  return <CeoIntake workspaceName={workspace.organization.name} />;
}
