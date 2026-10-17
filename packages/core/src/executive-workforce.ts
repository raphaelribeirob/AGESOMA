import type { AgentTemplateKey } from "./agent-registry";

/**
 * Ownership is not an authorization grant. Legacy specialist execution remains
 * unchanged until a tenant-safe database migration and real sandbox runtime
 * are shipped and verified separately.
 */
export type ExecutiveWorkerKey = "executive" | "finance" | "growth" | "product";
export type ExecutiveTitle = "CEO" | "COO" | "CFO" | "CMO" | "CRO" | "CTO" | "CPO";

export type ExecutiveOwner = {
  readonly key: ExecutiveWorkerKey;
  readonly titles: readonly ExecutiveTitle[];
  readonly capabilities: readonly AgentTemplateKey[];
};

export const EXECUTIVE_OWNERSHIP: Readonly<Record<ExecutiveWorkerKey, ExecutiveOwner>> = Object.freeze({
  executive: Object.freeze({
    key: "executive",
    titles: ["CEO", "COO"] as const,
    capabilities: ["operations", "service", "research"] as const
  }),
  finance: Object.freeze({
    key: "finance",
    titles: ["CFO"] as const,
    capabilities: ["finance"] as const
  }),
  growth: Object.freeze({
    key: "growth",
    titles: ["CMO", "CRO"] as const,
    capabilities: ["marketing", "paid_media", "sales"] as const
  }),
  product: Object.freeze({
    key: "product",
    titles: ["CTO", "CPO"] as const,
    capabilities: [] as const
  })
});

export const EXECUTIVE_KEYS: readonly ExecutiveWorkerKey[] = [
  "executive", "finance", "growth", "product"
] as const;

export const EXECUTIVE_TITLES: readonly ExecutiveTitle[] = [
  "CEO", "CFO", "CMO", "CTO", "CPO", "COO", "CRO"
] as const;

/**
 * Fail closed: an unknown capability MUST NOT be mapped to another worker.
 * This function only returns accountable ownership, never permission.
 */
export function executiveOwnerForCapability(capability: string): ExecutiveWorkerKey | null {
  for (const key of EXECUTIVE_KEYS) {
    if (EXECUTIVE_OWNERSHIP[key].capabilities.some((item) => item === capability)) return key;
  }
  return null;
}
