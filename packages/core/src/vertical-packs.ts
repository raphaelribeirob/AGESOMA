export type VerticalWorkPackId = "consorcio_sales_v1";

export type VerticalWorkPack = {
  id: VerticalWorkPackId;
  market: string;
  job: string;
  stages: string[];
  successSignals: string[];
};

const CONSORCIO_SALES: VerticalWorkPack = {
  id: "consorcio_sales_v1",
  market: "consorcio",
  job: "sales_followup",
  stages: [
    "organize_leads",
    "qualify_interest",
    "prioritize_next_action",
    "prepare_followup",
    "contact_when_authorized",
    "schedule_meeting",
    "verify_result",
    "learn_from_result"
  ],
  successSignals: [
    "qualified_lead",
    "reply_received",
    "meeting_booked",
    "proposal_requested",
    "sale_confirmed"
  ]
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function resolveVerticalWorkPack(request: string): VerticalWorkPack | null {
  const text = normalize(request);
  if (!text.includes("consorcio")) return null;
  const salesContext = ["lead", "cliente", "venda", "vender", "whatsapp", "reuniao", "proposta", "contato", "recuperar", "qualificar"]
    .some((term) => text.includes(term));
  return salesContext ? CONSORCIO_SALES : null;
}
