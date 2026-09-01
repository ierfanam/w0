export type AgentRole = | "architect" | "ui" | "code" | "analysis" | "bug" | "debug" | "build" | "deploy" | "reverse" | "localization" | "qa" | "security" | "reviewer" | "research" | "integrator" | "release";
export type Capability = "coding" | "reasoning" | "vision" | "long_context" | "tools" | "json" | "web" | "persian" | "agentic" | "speed";
export interface ModelProfile { id: string; provider: string; label: string; capabilities: Capability[]; contextWindow?: number; free?: boolean; enabled?: boolean; priority?: number; }
export interface AgentTask { id: string; role: AgentRole; goal: string; input: string; dependencies?: string[]; }
export interface AgentResult { taskId: string; role: AgentRole; status: "success" | "failed" | "skipped"; output: string; model?: string; durationMs?: number; error?: string; }
export interface ProjectSnapshot { name: string; files: Record<string, string>; metadata?: Record<string, unknown>; summary?: string; }
export interface AcceptanceCriterion { id: string; description: string; passed: boolean; evidence?: string; }
export interface AutopilotPlan { objective: string; tasks: AgentTask[]; acceptance: AcceptanceCriterion[]; }
