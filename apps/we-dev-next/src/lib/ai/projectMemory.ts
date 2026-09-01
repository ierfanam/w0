import mongoose, { Schema, type Model } from "mongoose";

export interface MemoryEntry { id: string; projectId: string; kind: "decision" | "architecture" | "constraint" | "fact" | "result"; text: string; tags: string[]; createdAt: string; }
const memory = new Map<string, MemoryEntry[]>();
const MemorySchema = new Schema({ id: String, projectId: { type: String, index: true }, kind: String, text: String, tags: [String], createdAt: String }, { versionKey: false });
let MemoryModel: Model<any> | null = null;
async function model() {
  if (!process.env.MONGODB_URI) return null;
  if (mongoose.connection.readyState === 0) await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || undefined });
  MemoryModel ||= mongoose.models.AIMemory || mongoose.model("AIMemory", MemorySchema);
  return MemoryModel;
}

export function remember(entry: Omit<MemoryEntry, "id" | "createdAt">): MemoryEntry {
  const value: MemoryEntry = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  memory.set(entry.projectId, [...(memory.get(entry.projectId) ?? []), value]);
  void model().then(m => m?.create(value)).catch(() => undefined);
  return value;
}

export function recall(projectId: string, query?: string): MemoryEntry[] {
  const entries = memory.get(projectId) ?? [];
  if (!query) return entries;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return entries.filter(e => terms.some(t => `${e.text} ${e.tags.join(" ")}`.toLowerCase().includes(t)));
}

export function clearMemory(projectId: string): void { memory.delete(projectId); void model().then(m => m?.deleteMany({ projectId })).catch(() => undefined); }

export async function hydrateMemory(projectId: string) {
  const m = await model();
  if (!m) return recall(projectId);
  const docs = await m.find({ projectId }).sort({ createdAt: 1 }).lean();
  const entries = docs as MemoryEntry[];
  memory.set(projectId, entries);
  return entries;
}
