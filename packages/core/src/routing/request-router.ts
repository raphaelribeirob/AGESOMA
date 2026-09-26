import {
  inferDomain,
  inferMode,
  inferResource,
  inferWatch,
  planSteps
} from "./classifiers";
import { normalizeText, titleFromRequest } from "./text";
import type { RequestPlan } from "./types";

export function routeBusinessRequest(request: string): RequestPlan {
  const originalRequest = request.replace(/\s+/g, " ").trim();
  if (originalRequest.length < 3) throw new Error("Business request is too short");
  if (originalRequest.length > 4000) throw new Error("Business request is too long");

  const text = normalizeText(originalRequest);
  const mode = inferMode(text);
  const domain = inferDomain(text);
  const monitoring = inferWatch(text);
  const action = domain === "paid_media" && mode === "observe"
    ? "paid_media.read"
    : mode === "commit"
      ? "business.commit"
      : mode === "act"
        ? "business.act"
        : mode === "work"
          ? "business.work"
          : "business.observe";

  return {
    title: titleFromRequest(originalRequest),
    originalRequest,
    domain,
    mode,
    action,
    operation: mode === "observe"
      ? "discover"
      : mode === "work"
        ? "prepare"
        : mode,
    resource: inferResource(text),
    requiresApproval: mode === "act" || mode === "commit",
    watch: monitoring.watch,
    cadence: monitoring.cadence,
    steps: planSteps(mode, monitoring.watch),
    workMethod: null
  };
}
