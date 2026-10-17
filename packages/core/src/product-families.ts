/**
 * Instant / Dots product family registry.
 *
 * This shared contract is a routing/catalog boundary, NOT a merger of app
 * databases, user identities, monetization or mobile binaries.
 * Canonical design and product releases remain in each independent repo.
 */
export type ProductFamilyId = "instant" | "dots";
export type PlatformProductId =
  | "instantspeak" | "instantstudy" | "instantbible" | "dotspeak";
export type ProductRuntime = "flutter" | "web" | "mixed";
export type ProductReleaseStatus = "unverified_external_repository";

export type FamilyDefinition = Readonly<{
  id: ProductFamilyId;
  displayName: string;
  thesis: string;
  designPolicy: "independent_product_design";
  sharedInfrastructurePolicy: "opt_in_versioned_adapters";
  dataSharingPolicy: "no_implicit_cross_product_access";
  billingPolicy: "separate_verified_entitlements";
  agePolicy: "product_specific";
  availability: "catalog_only";
}>;

export type PlatformProduct = Readonly<{
  id: PlatformProductId;
  family: ProductFamilyId;
  title: string;
  promise: string;
  repo: string;
  designSource: "DESIGN.md";
  runtime: ProductRuntime;
  releaseStatus: ProductReleaseStatus;
  /** Identity differs between apps (Firebase Auth or individual auth stacks). */
  authIntegration: "separate_until_explicit_link";
  entitlementNamespace: string;
  dataNamespace: string;
  recommendedSharedCapabilities: readonly ("model_gateway" | "usage_metering" |
    "safe_workflows" | "observability" | "permission_policy")[];
}>;

export const PRODUCT_FAMILIES: Readonly<Record<ProductFamilyId, FamilyDefinition>> = Object.freeze({
  instant: Object.freeze({
    id: "instant",
    displayName: "Instant",
    thesis: "Aplicativos de aprendizagem e experiências úteis desde a primeira interação.",
    designPolicy: "independent_product_design",
    sharedInfrastructurePolicy: "opt_in_versioned_adapters",
    dataSharingPolicy: "no_implicit_cross_product_access",
    billingPolicy: "separate_verified_entitlements",
    agePolicy: "product_specific",
    availability: "catalog_only"
  }),
  dots: Object.freeze({
    id: "dots",
    displayName: "Dots",
    thesis: "Companheiros com personalidade, voz e segurança próprias.",
    designPolicy: "independent_product_design",
    sharedInfrastructurePolicy: "opt_in_versioned_adapters",
    dataSharingPolicy: "no_implicit_cross_product_access",
    billingPolicy: "separate_verified_entitlements",
    agePolicy: "product_specific",
    availability: "catalog_only"
  })
});

export const PLATFORM_PRODUCTS: readonly PlatformProduct[] = Object.freeze([
  Object.freeze({
    id: "instantspeak", family: "instant", title: "InstantSpeak",
    promise: "Prática de idiomas com tutor de IA e voz.",
    repo: "raphaelribeirob/InstantSpeak", designSource: "DESIGN.md",
    runtime: "flutter", releaseStatus: "unverified_external_repository",
    authIntegration: "separate_until_explicit_link",
    entitlementNamespace: "instant.speak", dataNamespace: "instant.speak",
    recommendedSharedCapabilities: ["model_gateway","usage_metering","observability","permission_policy"] as const
  }),
  Object.freeze({
    id: "instantstudy", family: "instant", title: "InstantStudy",
    promise: "Estudo ativo, perguntas adaptativas e revisão.",
    repo: "raphaelribeirob/InstantStudy", designSource: "DESIGN.md",
    runtime: "mixed", releaseStatus: "unverified_external_repository",
    authIntegration: "separate_until_explicit_link",
    entitlementNamespace: "instant.study", dataNamespace: "instant.study",
    recommendedSharedCapabilities: ["model_gateway","usage_metering","safe_workflows","observability"] as const
  }),
  Object.freeze({
    id: "instantbible", family: "instant", title: "InstantBible",
    promise: "Leitura, reflexão e aplicação diária das Escrituras.",
    repo: "raphaelribeirob/InstantBible", designSource: "DESIGN.md",
    runtime: "flutter", releaseStatus: "unverified_external_repository",
    authIntegration: "separate_until_explicit_link",
    entitlementNamespace: "instant.bible", dataNamespace: "instant.bible",
    recommendedSharedCapabilities: ["model_gateway","usage_metering","safe_workflows","permission_policy"] as const
  }),
  Object.freeze({
    id: "dotspeak", family: "dots", title: "DotSpeak",
    promise: "Aprendizado de idiomas com companheiros e controles responsáveis.",
    repo: "raphaelribeirob/DotSpeak", designSource: "DESIGN.md",
    runtime: "mixed", releaseStatus: "unverified_external_repository",
    authIntegration: "separate_until_explicit_link",
    entitlementNamespace: "dots.speak", dataNamespace: "dots.speak",
    recommendedSharedCapabilities: ["model_gateway","usage_metering","observability","permission_policy"] as const
  })
]);

export function productsForFamily(family: ProductFamilyId): readonly PlatformProduct[] {
  return PLATFORM_PRODUCTS.filter(p => p.family === family);
}

export function getPlatformProduct(id: string): PlatformProduct | null {
  return PLATFORM_PRODUCTS.find(product => product.id === id) ?? null;
}

/**
 * This is a validation contract, not an entitlement check. Identity, consent,
 * role, subscription and tenant must still be verified by the destination app.
 */
export function isValidFamilyProductScope(
  family: ProductFamilyId,
  productId: PlatformProductId,
  tenantProductId: PlatformProductId,
  entitlementNamespace: string
): boolean {
  const product = getPlatformProduct(productId);
  return product?.family === family &&
    product.id === tenantProductId &&
    product.entitlementNamespace === entitlementNamespace;
}
