import {
  getPlatformProduct,
  type PlatformProductId,
  type ProductFamilyId,
  type PlatformProduct
} from "./product-families.ts";

export type SharedCapability = PlatformProduct["recommendedSharedCapabilities"][number];
export type PlatformAdapterRequest = Readonly<{
  family: ProductFamilyId;
  productId: PlatformProductId;
  accountProductId: PlatformProductId;
  tenantId: string;
  verifiedTenantId: string;
  namespace: string;
  capability: SharedCapability;
  verifiedIdentity: boolean;
  verifiedEntitlement: boolean;
  /** Required for child-directed Dots; the destination app owns the evidence. */
  guardianConsentVerified: boolean;
}>;

export type AdapterDecision = Readonly<
  | { allowed: true; namespace: string; billTo: string; dataPartition: string }
  | { allowed: false; reason: string }
>;

/**
 * Provider-agnostic policy preflight for FUTURE server-side adapters.
 *
 * IMPORTANT: self-reported booleans are not proof. Only the destination app's
 * trusted server may construct this object after checking auth, entitlement,
 * tenant and required guardian consents. No existing AGESOMA API wires this
 * decision into authorization yet.
 */
export function evaluatePlatformAdapterRequest(request: PlatformAdapterRequest): AdapterDecision {
  const product = getPlatformProduct(request.productId);
  if (!product) return { allowed: false, reason: "unknown_product" };
  if (product.family !== request.family || request.accountProductId !== product.id)
    return { allowed: false, reason: "product_family_mismatch" };
  if (request.namespace !== product.entitlementNamespace)
    return { allowed: false, reason: "entitlement_namespace_mismatch" };
  if (!request.tenantId.trim() || !request.verifiedTenantId.trim() ||
      request.tenantId !== request.verifiedTenantId)
    return { allowed: false, reason: "tenant_mismatch" };
  if (!request.verifiedIdentity || !request.verifiedEntitlement)
    return { allowed: false, reason: "unverified_access" };
  if (!product.recommendedSharedCapabilities.includes(request.capability))
    return { allowed: false, reason: "capability_not_declared" };
  if (product.family === "dots" && !request.guardianConsentVerified)
    return { allowed: false, reason: "guardian_consent_required" };
  return {
    allowed: true,
    namespace: product.entitlementNamespace,
    billTo: product.entitlementNamespace + ":" + request.tenantId,
    dataPartition: product.dataNamespace + ":" + request.tenantId
  };
}
