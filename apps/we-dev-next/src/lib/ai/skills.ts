export interface Skill { id: string; name: string; description: string; version: string; capabilities: string[]; run: (input: unknown) => Promise<unknown>; }
const registry = new Map<string, Skill>();
export function registerSkill(skill: Skill): void { registry.set(skill.id, skill); }
export function unregisterSkill(id: string): boolean { return registry.delete(id); }
export function getSkill(id: string): Skill | undefined { return registry.get(id); }
export function listSkills(): Omit<Skill, "run">[] { return [...registry.values()].map(({ run, ...meta }) => meta); }
export async function executeSkill(id: string, input: unknown): Promise<unknown> { const skill = registry.get(id); if (!skill) throw new Error(`Skill not found: ${id}`); return skill.run(input); }
