export type QueuedTask = {
  id: string;
  tenant_id: string;
  workflow_id: string | null;
  action_type: string;
  risk_class: "R0" | "R1" | "R2" | "R3" | "R4";
  reversible: boolean;
  external: boolean;
  expected_value_cents: string | number;
  expected_cost_cents: string | number;
  expected_loss_cents: string | number;
  confidence: string | number;
  payload: Record<string, unknown>;
};

export type DueWatcher = {
  id: string;
  tenant_id: string;
  goal_id: string | null;
  cadence: string | null;
  config: Record<string, unknown>;
};
