export type MemoryItem = { id: string; projectId: string; kind: "decision" | "constraint" | "architecture" | "bug" | "preference"; text: string; tags: string[]; createdAt: string; updatedAt: string };

const store = new Map<string, MemoryItem[]>();

export function remember(item: Omit<MemoryItem, "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const list = store.get(item.projectId) || [];
  const value = { ...item, createdAt: now, updatedAt: now };
  list.push(value); store.set(item.projectId, list); return value;
}
export function recall(projectId: string, query?: string, limit = 20) {
  const list = store.get(projectId) || [];
  if (!query) return list.slice(-limit).reverse();
  const q = query.toLowerCase();
  return list.filter(x => `${x.text} ${x.tags.join(" ")}`.toLowerCase().includes(q)).slice(-limit).reverse();
}
export function forgetProject(projectId: string) { store.delete(projectId); }
