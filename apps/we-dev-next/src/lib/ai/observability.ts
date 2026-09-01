export interface Trace { id: string; operation: string; startedAt: string; durationMs?: number; model?: string; status: "running" | "success" | "failed"; metadata?: Record<string, unknown>; }
const traces = new Map<string, Trace>();
export function startTrace(operation: string, metadata?: Record<string, unknown>): Trace { const t = { id: crypto.randomUUID(), operation, startedAt: new Date().toISOString(), status: "running" as const, metadata }; traces.set(t.id, t); return t; }
export function finishTrace(id: string, status: "success" | "failed", model?: string): Trace | undefined { const t = traces.get(id); if (!t) return; const done = { ...t, status, model, durationMs: Date.now() - Date.parse(t.startedAt) }; traces.set(id, done); return done; }
export function listTraces(limit = 100): Trace[] { return [...traces.values()].slice(-limit); }
