export type ModelProvider = "openai" | "anthropic" | "nous";

export const MODEL_PROVIDER_HOSTS: Record<ModelProvider,string> = {
  openai: "api.openai.com",
  anthropic: "api.anthropic.com",
  nous: "inference-api.nousresearch.com"
};

export const MODEL_PROVIDER_PATHS: Record<ModelProvider,RegExp[]> = {
  openai: [
    /^\/v1\/chat\/completions$/,
    /^\/v1\/responses$/,
    /^\/v1\/models(?:\/[^/]+)?$/,
    /^\/v1\/embeddings$/
  ],
  anthropic: [
    /^\/v1\/messages$/,
    /^\/v1\/models(?:\/[^/]+)?$/
  ],
  nous: [
    /^\/v1\/chat\/completions$/,
    /^\/v1\/responses$/,
    /^\/v1\/messages$/,
    /^\/v1\/models(?:\/[^/]+)?$/,
    /^\/v1\/embeddings$/
  ]
};

export function parseModelRoute(rawUrl:string){
  const url=new URL(rawUrl,"http://model-gateway.internal");
  const match=/^\/(openai|anthropic|nous)(\/.*)$/.exec(url.pathname);
  if(!match) throw new Error("unknown_provider_route");
  const provider=match[1] as ModelProvider;
  const path=match[2];
  if(!MODEL_PROVIDER_PATHS[provider].some((pattern)=>pattern.test(path))){
    throw new Error("provider_path_denied");
  }
  return {
    provider,
    host:MODEL_PROVIDER_HOSTS[provider],
    path,
    upstreamPath:`${path}${url.search}`
  };
}
