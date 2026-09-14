export const COMPANY_ENTITY_TYPES = [
  "company",
  "person",
  "customer",
  "account",
  "product",
  "service",
  "goal",
  "process",
  "work",
  "decision",
  "conversation",
  "transaction",
  "evidence",
  "outcome",
  "system",
  "resource"
] as const;

export type CompanyEntityType = (typeof COMPANY_ENTITY_TYPES)[number];

export const COMPANY_RELATION_TYPES = [
  "owns",
  "employs",
  "serves",
  "buys",
  "offers",
  "responsible_for",
  "contributes_to",
  "depends_on",
  "blocked_by",
  "decided_by",
  "discussed_in",
  "produced",
  "verifies",
  "caused",
  "used_by",
  "belongs_to",
  "related_to"
] as const;

export type CompanyRelationType = (typeof COMPANY_RELATION_TYPES)[number];

export type OntologySource = {
  provider: string;
  eventType: string;
  externalEventId?: string;
  observedAt?: string;
};

export type CanonicalEntityInput = {
  entityType: CompanyEntityType;
  canonicalName: string;
  attributes?: Record<string, unknown>;
  alias: {
    provider: string;
    externalType: string;
    externalId: string;
    label?: string;
    confidence?: number;
  };
  source: OntologySource;
};

export type CanonicalRelationInput = {
  sourceEntityId: string;
  targetEntityId: string;
  relationType: CompanyRelationType;
  confidence?: number;
  attributes?: Record<string, unknown>;
  source: OntologySource;
};

export function isCompanyEntityType(value: string): value is CompanyEntityType {
  return (COMPANY_ENTITY_TYPES as readonly string[]).includes(value);
}

export function isCompanyRelationType(value: string): value is CompanyRelationType {
  return (COMPANY_RELATION_TYPES as readonly string[]).includes(value);
}

export function normalizeExternalIdentity(provider: string, externalType: string, externalId: string) {
  const normalize = (value: string) => value.trim().toLowerCase();
  return `${normalize(provider)}:${normalize(externalType)}:${externalId.trim()}`;
}

export function ontologyEpisodeName(provider: string, eventType: string) {
  return `ontology.${provider.trim().toLowerCase()}.${eventType.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "_")}`;
}
