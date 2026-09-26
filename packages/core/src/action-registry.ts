import type { RiskClass } from "./sentinel";

export type ActionPolicy = {
  type: string;
  riskClass: RiskClass;
  reversible: boolean;
  external: boolean;
  maxPayloadBytes: number;
};

export type CapabilityScope = {
  taskId: string;
  action: string;
  destination: string | null;
  operation: string | null;
  resource: string | null;
  amountCents: number | null;
  payload: Record<string, unknown>;
};

const ACTIONS: Record<string, ActionPolicy> = {
  "business.observe": { type: "business.observe", riskClass: "R0", reversible: true, external: true, maxPayloadBytes: 32_768 },
  "business.work": { type: "business.work", riskClass: "R1", reversible: true, external: false, maxPayloadBytes: 32_768 },
  "business.act": { type: "business.act", riskClass: "R2", reversible: false, external: true, maxPayloadBytes: 32_768 },
  "business.commit": { type: "business.commit", riskClass: "R3", reversible: false, external: true, maxPayloadBytes: 16_384 },

  "paid_media.read": { type: "paid_media.read", riskClass: "R0", reversible: true, external: true, maxPayloadBytes: 32_768 },
  "paid_media.create_campaign": { type: "paid_media.create_campaign", riskClass: "R2", reversible: false, external: true, maxPayloadBytes: 32_768 },
  "paid_media.create_adset": { type: "paid_media.create_adset", riskClass: "R2", reversible: false, external: true, maxPayloadBytes: 32_768 },
  "paid_media.create_ad": { type: "paid_media.create_ad", riskClass: "R2", reversible: false, external: true, maxPayloadBytes: 32_768 },
  "paid_media.update_ad_creative": { type: "paid_media.update_ad_creative", riskClass: "R2", reversible: false, external: true, maxPayloadBytes: 32_768 },
  "paid_media.pause_campaign": { type: "paid_media.pause_campaign", riskClass: "R2", reversible: true, external: true, maxPayloadBytes: 16_384 },
  "paid_media.pause_adset": { type: "paid_media.pause_adset", riskClass: "R2", reversible: true, external: true, maxPayloadBytes: 16_384 },
  "paid_media.pause_ad": { type: "paid_media.pause_ad", riskClass: "R2", reversible: true, external: true, maxPayloadBytes: 16_384 },
  "paid_media.enable_campaign": { type: "paid_media.enable_campaign", riskClass: "R3", reversible: false, external: true, maxPayloadBytes: 16_384 },
  "paid_media.set_campaign_budget": { type: "paid_media.set_campaign_budget", riskClass: "R3", reversible: false, external: true, maxPayloadBytes: 16_384 },
  "paid_media.set_adset_budget": { type: "paid_media.set_adset_budget", riskClass: "R3", reversible: false, external: true, maxPayloadBytes: 16_384 },

  "crm.read_leads": { type: "crm.read_leads", riskClass: "R0", reversible: true, external: false, maxPayloadBytes: 8_192 },
  "calendar.read_availability": { type: "calendar.read_availability", riskClass: "R0", reversible: true, external: false, maxPayloadBytes: 8_192 },
  "crm.update_lead": { type: "crm.update_lead", riskClass: "R1", reversible: true, external: false, maxPayloadBytes: 16_384 },
  "whatsapp.reactivate": { type: "whatsapp.reactivate", riskClass: "R2", reversible: false, external: true, maxPayloadBytes: 16_384 },
  "calendar.book_meeting": { type: "calendar.book_meeting", riskClass: "R2", reversible: true, external: true, maxPayloadBytes: 16_384 },
  "commercial.change_terms": { type: "commercial.change_terms", riskClass: "R3", reversible: false, external: true, maxPayloadBytes: 8_192 }
};

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, stable(item)])
    );
  }
  return value;
}

function textField(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function buildCapabilityScope(input: { taskId: string; action: string; payload: Record<string, unknown> }): CapabilityScope {
  const amount = input.payload.amountCents;
  return {
    taskId: input.taskId,
    action: input.action,
    destination: textField(input.payload, "destination"),
    operation: textField(input.payload, "operation"),
    resource: textField(input.payload, "resource"),
    amountCents: typeof amount === "number" && Number.isFinite(amount) ? Math.trunc(amount) : null,
    payload: stable(input.payload) as Record<string, unknown>
  };
}

export function serializeCapabilityScope(scope: CapabilityScope) {
  return JSON.stringify(stable(scope));
}

export function getActionPolicy(type: string): ActionPolicy | null {
  return ACTIONS[type] ?? null;
}

export function assertActionPayloadSize(policy: ActionPolicy, payload: Record<string, unknown>) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload)).byteLength;
  if (bytes > policy.maxPayloadBytes) throw new Error(`Payload exceeds ${policy.maxPayloadBytes} bytes for ${policy.type}`);
}
