import { refreshBusinessBrain } from "./brain-refresh";

const tenantId = process.env.INSTANTWORK_TENANT_ID?.trim();
if (!tenantId) throw new Error("INSTANTWORK_TENANT_ID is required");

const result = await refreshBusinessBrain(tenantId);
console.log(JSON.stringify({ states: result.states.length, interventions: result.ranked.length }));
