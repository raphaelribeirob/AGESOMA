import type { RiskClass } from "./sentinel";

export type ActionPolicy = {
  type: string;
  riskClass: RiskClass;
  reversible: boolean;
  external: boolean;
  maxPayloadBytes: number;
};

const ACTIONS: Record<string, ActionPolicy> = {
  "crm.read_leads": {
    type: "crm.read_leads",
    riskClass: "R0",
    reversible: true,
    external: false,
    maxPayloadBytes: 8_192
  },
  "calendar.read_availability": {
    type: "calendar.read_availability",
    riskClass: "R0",
    reversible: true,
    external: false,
    maxPayloadBytes: 8_192
  },
  "crm.update_lead": {
    type: "crm.update_lead",
    riskClass: "R1",
    reversible: true,
    external: false,
    maxPayloadBytes: 16_384
  },
  "whatsapp.reactivate": {
    type: "whatsapp.reactivate",
    riskClass: "R2",
    reversible: false,
    external: true,
    maxPayloadBytes: 16_384
  },
  "calendar.book_meeting": {
    type: "calendar.book_meeting",
    riskClass: "R2",
    reversible: true,
    external: true,
    maxPayloadBytes: 16_384
  },
  "commercial.change_terms": {
    type: "commercial.change_terms",
    riskClass: "R3",
    reversible: false,
    external: true,
    maxPayloadBytes: 8_192
  }
};

export function getActionPolicy(type: string): ActionPolicy | null {
  return ACTIONS[type] ?? null;
}

export function assertActionPayloadSize(policy: ActionPolicy, payload: Record<string, unknown>) {
  const bytes = Buffer.byteLength(JSON.stringify(payload), "utf8");
  if (bytes > policy.maxPayloadBytes) {
    throw new Error(`Payload exceeds ${policy.maxPayloadBytes} bytes for ${policy.type}`);
  }
}
