export type PersonalMemoryRecord = {
  lesson_type: string;
  content: Record<string, unknown>;
  created_at: string;
};

export type OwnerAwareContext = {
  owner: PersonalMemoryRecord[];
  business: PersonalMemoryRecord[];
  rules: PersonalMemoryRecord[];
  experience: PersonalMemoryRecord[];
};

const OWNER_TYPES = new Set(["owner_preference", "owner_decision", "owner_correction"]);
const BUSINESS_TYPES = new Set(["business_fact", "business_context"]);
const RULE_TYPES = new Set(["business_rule", "owner_rule"]);

export function buildOwnerAwareContext(records: PersonalMemoryRecord[]): OwnerAwareContext {
  const context: OwnerAwareContext = { owner: [], business: [], rules: [], experience: [] };

  for (const record of records) {
    if (OWNER_TYPES.has(record.lesson_type)) context.owner.push(record);
    else if (BUSINESS_TYPES.has(record.lesson_type)) context.business.push(record);
    else if (RULE_TYPES.has(record.lesson_type)) context.rules.push(record);
    else context.experience.push(record);
  }

  context.owner = context.owner.slice(0, 8);
  context.business = context.business.slice(0, 8);
  context.rules = context.rules.slice(0, 8);
  context.experience = context.experience.slice(0, 8);
  return context;
}
