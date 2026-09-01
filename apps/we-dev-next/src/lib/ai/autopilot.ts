import type { AgentResult, AgentTask, AutopilotPlan, ProjectSnapshot } from "./types";

const ROLES: AgentTask["role"][] = ["architect", "analysis", "ui", "code", "bug", "qa", "security", "build", "deploy", "release"];

export function createAutopilotPlan(objective: string, project: ProjectSnapshot): AutopilotPlan {
  const context = `پروژه ${project.name} با ${Object.keys(project.files).length} فایل`;
  const tasks: AgentTask[] = ROLES.map((role, i) => ({
    id: `auto-${i + 1}-${role}`,
    role,
    goal: objective,
    input: context,
    dependencies: i === 0 ? [] : [`auto-1-architect`],
  }));
  return {
    objective,
    tasks,
    acceptance: [
      { id: "build", description: "Build موفق باشد", passed: false },
      { id: "tests", description: "آزمون‌های اصلی موفق باشند", passed: false },
      { id: "regression", description: "Regression جدید ایجاد نشده باشد", passed: false },
      { id: "security", description: "بازبینی امنیتی بدون خطای بحرانی باشد", passed: false },
    ],
  };
}

export interface HealingIteration { iteration: number; diagnosis: string; patch: string; verification: string; passed: boolean; }

export async function selfHealingLoop(
  diagnose: (failure: string) => Promise<string>,
  patch: (diagnosis: string) => Promise<string>,
  verify: () => Promise<{ passed: boolean; output: string }>,
  maxIterations = 5,
): Promise<HealingIteration[]> {
  const history: HealingIteration[] = [];
  for (let i = 1; i <= maxIterations; i++) {
    const check = await verify();
    if (check.passed) { history.push({ iteration: i, diagnosis: "", patch: "", verification: check.output, passed: true }); break; }
    const diagnosis = await diagnose(check.output);
    const patchText = await patch(diagnosis);
    const after = await verify();
    history.push({ iteration: i, diagnosis, patch: patchText, verification: after.output, passed: after.passed });
    if (after.passed) break;
  }
  return history;
}

export function summarizeExecution(results: AgentResult[]): { success: number; failed: number; total: number; ready: boolean } {
  const success = results.filter(r => r.status === "success").length;
  const failed = results.filter(r => r.status === "failed").length;
  return { success, failed, total: results.length, ready: failed === 0 && success === results.length };
}
