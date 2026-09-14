export type RiverThreeOnboardingMode =
  | "consumerGuided"
  | "consumerFast"
  | "businessConsumerized"
  | "professionalWorkspace"
  | "agentVoice";

export type RiverThreeExpressionLevel = "off" | "subtle" | "selective" | "elevated";
export type RiverThreeAdvanceMode = "auto" | "explicit";
export type RiverThreeHomeMode = "trackerProgress" | "actionAgent" | "jarvisConversation";

export type RiverThreeStep = {
  id: string;
  type: "welcome" | "single" | "multi" | "numeric" | "slider" | "text" | "date" | "reinforcement" | "proof" | "featureRecap" | "permission" | "connection" | "generating" | "result" | "account" | "paywall" | "firstAction";
  required: boolean;
  advanceMode: RiverThreeAdvanceMode;
};

export const agesomaPackage = {
  authority: "RIVERTHREE_DESIGN.md",
  designContractVersion: "4.18.0",
  product: {
    id: "agesoma",
    name: "AGESOMA",
    category: "smb-operating-intelligence",
    audience: "small and medium business owners",
    onboardingMode: "businessConsumerized" as RiverThreeOnboardingMode
  },
  identity: {
    wordmark: "/agesoma-wordmark.jpeg",
    intelligenceOrb: "contextual" as const,
    displayFont: "Space Grotesk Variable",
    uiFont: "Geist Sans Variable",
    technicalFont: "Geist Mono"
  },
  expression: {
    genZ: "subtle" as RiverThreeExpressionLevel,
    targetRange: "5-10",
    preferredSurfaces: ["welcome", "resultPreview", "success", "marketing", "jarvis"] as const,
    grain: "contextual" as const,
    gradient: "contextual" as const,
    editorialAsymmetry: "off" as const,
    humanTexture: "contextual" as const,
    motionPersonality: "contextual" as const
  },
  promise: {
    headline: "Converse com a inteligência da sua empresa.",
    outcome: "A AGESOMA entende a empresa, coordena pessoas e agentes, faz o trabalho avançar e relata naturalmente o que mudou.",
    firstValueDefinition: "O dono consegue perguntar o que está acontecendo ou pedir trabalho em linguagem natural, sem navegar por um sistema."
  },
  onboarding: {
    progressModel: "fixedKnownPath" as const,
    steps: [
      { id: "welcome", type: "welcome", required: true, advanceMode: "explicit" },
      { id: "company_context", type: "text", required: true, advanceMode: "explicit" },
      { id: "team_size", type: "numeric", required: true, advanceMode: "explicit" },
      { id: "team_structure", type: "text", required: true, advanceMode: "explicit" },
      { id: "coordination_problem", type: "single", required: true, advanceMode: "auto" },
      { id: "desired_outcome", type: "text", required: true, advanceMode: "explicit" },
      { id: "coordination_preview", type: "result", required: true, advanceMode: "explicit" },
      { id: "first_execution", type: "firstAction", required: true, advanceMode: "explicit" }
    ] satisfies RiverThreeStep[]
  },
  permissions: {
    notifications: "just-in-time" as const,
    contacts: "just-in-time" as const,
    microphone: "just-in-time" as const,
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
    note: "Billing remains disabled until a real entitlement boundary is wired."
  },
  home: {
    mode: "jarvisConversation" as RiverThreeHomeMode,
    primaryOutcome: "natural_company_conversation_and_verified_results",
    nextBestAction: "answer_or_act_without_exposing_system_complexity",
    supportingMetricsMax: 0
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
    activationEvent: "first_jarvis_request_accepted",
    commonEvents: true
  }
} as const;

export function isExpressiveSurface(surface: string) {
  return (agesomaPackage.expression.preferredSurfaces as readonly string[]).includes(surface);
}
