export type RequestDomain =
  | "sales"
  | "marketing"
  | "service"
  | "operations"
  | "finance"
  | "general";

export type RequestMode = "observe" | "work" | "act" | "commit";
export type WatchCadence = "15m" | "1h" | "6h" | "1d" | "7d";

export type LegacyWorkMethod = {
  stages: string[];
  successSignals: string[];
};

export type RequestPlan = {
  title: string;
  originalRequest: string;
  domain: RequestDomain;
  mode: RequestMode;
  action: "business.observe" | "business.work" | "business.act" | "business.commit";
  operation: "discover" | "prepare" | "act" | "commit";
  resource: string | null;
  requiresApproval: boolean;
  watch: boolean;
  cadence: WatchCadence | null;
  steps: string[];
  workMethod: LegacyWorkMethod | null;
};

export type TeamMemberForCoordination = {
  id: string;
  name: string;
  roleTitle: string;
  department?: string | null;
  responsibilities?: string[];
  skills?: string[];
  availability?: string;
};

export type ExecutorDecision = {
  executorType: "human" | "hermes";
  teamMemberId: string | null;
  teamMemberName: string | null;
  reason: string;
  confidence: number;
};
