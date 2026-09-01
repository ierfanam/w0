export interface MemoryEntry { id: string; projectId: string; kind: "decision" | "architecture" | "constraint" | "fact" | "result"; text: string; tags: string[]; createdAt: string; }

const memory = new Map<string, MemoryEntry[]>();

export function remember(entry: Omit<MemoryEntry, "id" | "createdAt">): MemoryEntry {
  const value: MemoryEntry = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  memory.set(entry.projectId, [...(memory.get(entry.projectId) ?? []), value]);
  return value;
}

export function recall(projectId: string, query?: string): MemoryEntry[] {
  const entries = memory.get(projectId) ?? [];
  if (!query) return entries;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return entries.filter(e => terms.some(t => `${e.text} ${e.tags.join(" ")}`.toLowerCase().includes(t)));
}

export function clearMemory(projectId: string): void { memory.delete(projectId); }
