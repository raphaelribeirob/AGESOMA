import {SUPPORT_OFFER} from "./support-offer";

/**
 * Discovery only. Deliberately does NOT grant identities, scopes, tokens,
 * authorization, or access to a tenant's messages and payment records.
 * Delegated agent authorization is a future security-reviewed feature.
 */
export const AGESOMA_AGENT_DISCOVERY={
 schemaVersion:"agesoma.agent-capabilities.v1",
 platform:"AGESOMA",
 capabilities:[{
  id:SUPPORT_OFFER.sku,
  label:SUPPORT_OFFER.title,
  status:"candidate" as const,
  interface:"hosted_web_chat",
  businessCustomer:true,
  externallyCallable:false as const,
  delegatedAgentAccess:false as const,
  actions:[] as readonly string[],
  description:SUPPORT_OFFER.promise
 }],
 security:{
  personalAgentIdentity:"not_implemented",
  userConsent:"not_implemented",
  delegatedScopes:[] as readonly string[],
  tokensIssued:false as const
 }
} as const;
