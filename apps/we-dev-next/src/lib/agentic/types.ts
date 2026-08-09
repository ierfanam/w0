export type AgentCapability =
  | "architecture" | "coding" | "ui" | "vision" | "analysis" | "testing"
  | "debugging" | "build" | "deploy" | "reverse-engineering"
  | "localization" | "security" | "research" | "web" | "voice";

export type AgentRole = {
  id: string;
  name: string;
  capabilities: AgentCapability[];
  system: string;
  priority: number;
};

export type ModelProfile = {
  id: string;
  provider: string;
  label: string;
  capabilities: AgentCapability[];
  context?: number;
  free?: boolean;
  endpoint?: string;
};

export type ProjectFile = { path: string; content: string; language?: string };
export type ProjectSnapshot = { root?: string; files: ProjectFile[]; metadata?: Record<string, unknown> };

export type AgentTask = {
  id: string;
  role: AgentRole;
  request: string;
  project: ProjectSnapshot;
  preferredModel?: string;
};

export type AgentResult = {
  taskId: string;
  roleId: string;
  model: string;
  status: "success" | "failed";
  summary: string;
  recommendations: string[];
  patches?: Array<{ path: string; content: string; reason: string }>;
  tests?: string[];
  risks?: string[];
  durationMs: number;
  error?: string;
};

export type AutopilotPlan = {
  goal: string;
  phases: Array<{ id: string; title: string; tasks: string[]; roleIds: string[]; dependsOn?: string[] }>;
  acceptanceCriteria: string[];
  risks: string[];
};

export type QualityReport = {
  score: number;
  passed: boolean;
  findings: Array<{ severity: "info" | "low" | "medium" | "high" | "critical"; message: string; path?: string }>;
  nextActions: string[];
};
