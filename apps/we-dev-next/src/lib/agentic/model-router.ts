import type { AgentCapability, ModelProfile } from "./types";

export const MODEL_PROFILES: ModelProfile[] = [
  { id: "openrouter/free", provider: "openrouter", label: "OpenRouter Free Router", capabilities: ["coding","reasoning" as AgentCapability,"analysis","research"], context: 128000, free: true },
  { id: "glm-4.7-flash", provider: "zhipu", label: "GLM-4.7-Flash", capabilities: ["coding","analysis","architecture","tool-calling" as AgentCapability], context: 128000, free: true },
  { id: "glm-4.5-flash", provider: "zhipu", label: "GLM-4.5-Flash", capabilities: ["coding","analysis","tool-calling" as AgentCapability], context: 128000, free: true },
  { id: "glm-4v-flash", provider: "zhipu", label: "GLM-4V-Flash", capabilities: ["vision","coding","analysis"], context: 128000, free: true },
  { id: "glm-4.1v-thinking-flash", provider: "zhipu", label: "GLM-4.1V-Thinking-Flash", capabilities: ["vision","analysis","reasoning" as AgentCapability], context: 128000, free: true },
];

const ALIASES: Record<string, string> = {
  "gpt-4o": "openrouter/free", "gpt-4o-mini": "openrouter/free", "claude-3.5-sonnet": "openrouter/free",
  "deepseek-chat": "openrouter/free", "deepseek-reasoner": "openrouter/free",
};

export function listModels() { return MODEL_PROFILES; }

export function routeModel(required: AgentCapability[] = [], preferred?: string): ModelProfile {
  const requested = preferred && MODEL_PROFILES.some(m => m.id === preferred) ? preferred : preferred ? ALIASES[preferred] : undefined;
  const candidates = MODEL_PROFILES.filter(m => m.free !== false);
  if (requested) {
    const exact = candidates.find(m => m.id === requested);
    if (exact) return exact;
  }
  const ranked = candidates.map(model => ({ model, score: required.reduce((s, c) => s + (model.capabilities.includes(c) ? 10 : 0), 0) + (model.free ? 2 : 0) })).sort((a,b) => b.score-a.score);
  return ranked[0]?.model || candidates[0];
}

export function normalizeModel(id?: string) { return id && ALIASES[id] ? ALIASES[id] : id || "openrouter/free"; }
