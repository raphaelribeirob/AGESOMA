export type RiverThreeOnboardingMode =
  | "consumerGuided"
  | "consumerFast"
  | "businessConsumerized"
  | "professionalWorkspace"
  | "agentVoice";

export type RiverThreeExpressionLevel = "off" | "subtle" | "selective" | "elevated";
export type RiverThreeAdvanceMode = "auto" | "explicit";
export type RiverThreeHomeMode = "trackerProgress" | "actionAgent" | "agesomaConversation";

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
    category: "personal-executive-assistant",
    audience: "people who want to delegate digital work and personal administration",
    onboardingMode: "consumerFast" as RiverThreeOnboardingMode
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
    preferredSurfaces: ["welcome", "resultPreview", "success", "marketing", "agesoma"] as const,
    grain: "contextual" as const,
    gradient: "contextual" as const,
    editorialAsymmetry: "off" as const,
    humanTexture: "contextual" as const,
    motionPersonality: "contextual" as const
  },
  promise: {
    headline: "Your life, handled.",
    outcome: "AGESOMA remembers context, organizes what matters and executes authorized digital work for you.",
    firstValueDefinition: "The user delegates one real task in ordinary language and understands that AGESOMA will own the coordination."
  },
  onboarding: {
    progressModel: "fixedKnownPath" as const,
    steps: [
      { id: "welcome", type: "welcome", required: true, advanceMode: "explicit" },
      { id: "personal_context", type: "text", required: true, advanceMode: "explicit" },
      { id: "priority_area", type: "single", required: true, advanceMode: "auto" },
      { id: "first_request", type: "text", required: true, advanceMode: "explicit" },
      { id: "assistant_preview", type: "result", required: true, advanceMode: "explicit" },
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
    mode: "agesomaConversation" as RiverThreeHomeMode,
    primaryOutcome: "personal_delegation_and_verified_completion",
    nextBestAction: "handle_the_next_useful_task_without_exposing_system_complexity",
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
    activationEvent: "first_agesoma_request_accepted",
    commonEvents: true
  }
} as const;

export function isExpressiveSurface(surface: string) {
  return (agesomaPackage.expression.preferredSurfaces as readonly string[]).includes(surface);
}
