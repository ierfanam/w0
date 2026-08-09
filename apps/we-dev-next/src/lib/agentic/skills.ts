export type Skill = { id: string; name: string; version: string; description: string; capabilities: string[]; instructions: string };
const skills = new Map<string, Skill>();
export function registerSkill(skill: Skill) { skills.set(skill.id, skill); return skill; }
export function listSkills() { return [...skills.values()]; }
export function getSkill(id: string) { return skills.get(id); }
registerSkill({ id: "web-research", name: "پژوهش وب", version: "1.0.0", description: "جمع‌آوری و مقایسه اطلاعات وب با استناد", capabilities: ["web","research"], instructions: "منبع، تاریخ و سطح اطمینان هر یافته را ثبت کن." });
registerSkill({ id: "visual-qa", name: "بازبینی بصری", version: "1.0.0", description: "تحلیل screenshot و UI regression", capabilities: ["vision","ui","testing"], instructions: "تغییرات بصری را نسبت به baseline مقایسه و severity بده." });
registerSkill({ id: "release-engineering", name: "مهندسی انتشار", version: "1.0.0", description: "Build, smoke test و rollback", capabilities: ["build","deploy","testing"], instructions: "artifact قابل تکرار و rollback plan تولید کن." });
