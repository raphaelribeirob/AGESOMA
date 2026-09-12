export type RiverThreeOnboardingMode =
  | "consumerGuided"
  | "consumerFast"
  | "businessConsumerized"
  | "professionalWorkspace"
  | "agentVoice";

export type RiverThreeExpressionLevel = "off" | "subtle" | "selective" | "elevated";
export type RiverThreeAdvanceMode = "auto" | "explicit";
export type RiverThreeHomeMode = "trackerProgress" | "actionAgent";

export type RiverThreeStep = {
  id: string;
  type: "welcome" | "single" | "multi" | "numeric" | "slider" | "text" | "date" | "reinforcement" | "proof" | "featureRecap" | "permission" | "connection" | "generating" | "result" | "account" | "paywall" | "firstAction";
  required: boolean;
  advanceMode: RiverThreeAdvanceMode;
};

export const instantWorkPackage = {
  authority: "RIVERTHREE_DESIGN.md",
  product: {
    id: "instantwork",
    name: "InstantWork",
    category: "agentic-b2b",
    audience: "small and medium business owners",
    onboardingMode: "businessConsumerized" as RiverThreeOnboardingMode
  },
  identity: {
    intelligenceOrb: "contextual" as const,
    displayFont: "Space Grotesk",
    uiFont: "Geist Sans",
    technicalFont: "Geist Mono"
  },
  expression: {
    genZ: "subtle" as RiverThreeExpressionLevel,
    targetRange: "5-10",
    preferredSurfaces: ["welcome", "resultPreview", "success", "marketing"] as const,
    grain: "contextual" as const,
    gradient: "contextual" as const,
    editorialAsymmetry: "off" as const,
    humanTexture: "contextual" as const,
    motionPersonality: "contextual" as const
  },
  promise: {
    headline: "Diga o resultado. O InstantWork cuida do trabalho.",
    outcome: "Transformar pedidos de negócio em trabalho executado, decisões claras e resultados comprovados.",
    firstValueDefinition: "Um primeiro trabalho útil é preparado ou executado com evidência e sem expor agentes, prompts ou infraestrutura."
  },
  onboarding: {
    progressModel: "fixedKnownPath" as const,
    steps: [
      { id: "welcome", type: "welcome", required: true, advanceMode: "explicit" },
      { id: "business_goal", type: "single", required: true, advanceMode: "auto" },
      { id: "company_context", type: "text", required: true, advanceMode: "explicit" },
      { id: "desired_outcome", type: "text", required: true, advanceMode: "explicit" },
      { id: "work_style", type: "single", required: true, advanceMode: "auto" },
      { id: "workflow_value_preview", type: "result", required: true, advanceMode: "explicit" },
      { id: "connect_tools", type: "connection", required: true, advanceMode: "explicit" },
      { id: "first_action", type: "firstAction", required: true, advanceMode: "explicit" }
    ] satisfies RiverThreeStep[]
  },
  permissions: {
    notifications: "just-in-time" as const,
    contacts: "just-in-time" as const,
    microphone: "none" as const,
    camera: "none" as const,
    photos: "none" as const,
    health: "none" as const,
    tracking: "policy-gated" as const
  },
  result: {
    generationRequired: false,
    previewBeforePaywall: true,
    loadingMustRepresentRealWork: true,
    personalizationEvidence: {
      requiredWhenAnswersChangeResult: true,
      visibleMappings: "1-3"
    }
  },
  account: {
    timing: "after-first-value" as const,
    providers: ["neon-better-auth"] as const,
    guestMode: false
  },
  monetization: {
    model: "subscription" as const,
    paywall: "none" as const,
    paywallHeroProof: "personalizedResult" as const,
    note: "Billing remains disabled in the shell until a real entitlement boundary is wired."
  },
  home: {
    mode: "actionAgent" as RiverThreeHomeMode,
    primaryOutcome: "business_state_and_verified_impact",
    nextBestAction: "approve_or_run_next_action",
    supportingMetricsMax: 3
  },
  runtime: {
    loading: true,
    empty: true,
    error: true,
    offline: true,
    permissionDenied: true,
    subscriptionState: true
  },
  analytics: {
    activationEvent: "first_business_workflow_succeeded",
    commonEvents: true
  }
} as const;

export function isExpressiveSurface(surface: string) {
  return (instantWorkPackage.expression.preferredSurfaces as readonly string[]).includes(surface);
}
