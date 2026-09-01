import { streamTextFn } from "@/app/api/chat/action";
import type { AgentResult, AgentRole, AgentTask, ModelProfile } from "./types";
import { inferCapabilities, selectModel } from "./modelRouter";

export const SPECIALIST_ROLES: Array<{ role: AgentRole; label: string; instruction: string }> = [
  { role: "architect", label: "معمار ارشد", instruction: "معماری، مرزبندی ماژول‌ها، وابستگی‌ها و نقشه اجرا را طراحی کن." },
  { role: "ui", label: "طراح ارشد UI/UX", instruction: "ظاهر، UX، RTL، دسترس‌پذیری و سازگاری بصری موجود را بررسی کن." },
  { role: "code", label: "مهندس ارشد کدنویسی", instruction: "پیاده‌سازی TypeScript/React/Next، کیفیت، امنیت و نگهداشت‌پذیری را بررسی کن." },
  { role: "analysis", label: "تحلیلگر سیستم", instruction: "نیازمندی‌ها، edge caseها، ریسک‌ها و معیار پذیرش را استخراج کن." },
  { role: "bug", label: "شکارچی خطا", instruction: "باگ، race condition، failure path و edge case را پیدا کن." },
  { role: "debug", label: "متخصص دیباگ", instruction: "روش بازتولید، instrumentation و اصلاح ریشه‌ای خطا را ارائه کن." },
  { role: "qa", label: "مهندس QA", instruction: "تست واحد، integration، E2E و regression را طراحی کن." },
  { role: "security", label: "بازبین امنیت", instruction: "ریسک‌های امنیتی و مدیریت secret، ورودی و مجوزها را بررسی کن." },
  { role: "build", label: "مهندس Build", instruction: "TypeScript، bundling، dependency و artifact قابل تکرار را بررسی کن." },
  { role: "deploy", label: "مهندس Deployment", instruction: "environment، health check، rollback و portability را طراحی کن." },
  { role: "reverse", label: "مهندس سازگاری", instruction: "interoperability و تحلیل ساختاری مجاز و مستند را بررسی کن." },
  { role: "localization", label: "مهندس بومی‌سازی", instruction: "RTL، فارسی، encoding، تاریخ، اعداد و endpoint fallback را بررسی کن." },
];

async function call(model: string, task: AgentTask): Promise<AgentResult> {
  const started = Date.now();
  try {
    const result = await streamTextFn([{ id: crypto.randomUUID(), role: "user", content: `نقش: ${task.role}\nهدف: ${task.goal}\nورودی:\n${task.input}\nخروجی دقیق و اجرایی ارائه کن.` }], undefined, model);
    return { taskId: task.id, role: task.role, status: "success", output: await result.text, model, durationMs: Date.now() - started };
  } catch (e) {
    return { taskId: task.id, role: task.role, status: "failed", output: "", model, durationMs: Date.now() - started, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function runSwarm(tasks: AgentTask[], models: ModelProfile[]): Promise<AgentResult[]> {
  return Promise.all(tasks.map((task) => {
    const model = selectModel(models, inferCapabilities(task.goal)) ?? models.find((m) => m.enabled !== false);
    if (!model) return Promise.resolve({ taskId: task.id, role: task.role, status: "failed", output: "مدل قابل استفاده وجود ندارد." } as AgentResult);
    return call(model.id, task);
  }));
}

export function buildReviewPrompt(results: AgentResult[], objective: string): string {
  return `تو Team Leader و Adversarial Reviewer هستی. هدف: ${objective}\nگزارش متخصصان:\n${results.map(r => `## ${r.role} (${r.status})\n${r.output}`).join("\n\n")}\n\nتناقض‌ها را حل کن، ادعاهای بدون شواهد را علامت بزن و خروجی نهایی را با معماری، تغییرات فایل، تست، معیار پذیرش و ریسک ارائه کن.`;
}
