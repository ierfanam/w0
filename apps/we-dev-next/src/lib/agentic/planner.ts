import type { AgentRole, AutopilotPlan, ProjectSnapshot } from "./types";

export function buildPlan(goal: string, project: ProjectSnapshot, roles: AgentRole[]): AutopilotPlan {
  const paths = project.files.map(f => f.path);
  const hasUI = paths.some(p => /\.(tsx|jsx|vue|css|scss|html)$/.test(p));
  const hasTests = paths.some(p => /(test|spec)\.(ts|tsx|js|jsx)$/.test(p));
  const hasBuild = paths.some(p => /(package\.json|vite\.config|next\.config|electron-builder)/.test(p));
  const phase = (id: string) => roles.filter(r => r.id === id).map(r => r.id);
  return {
    goal,
    phases: [
      { id: "understand", title: "شناخت پروژه", tasks: ["فهرست فایل‌ها، stack، entrypoint و dependencyها را تحلیل کن", "ریسک‌ها و محدودیت‌های فعلی را ثبت کن"], roleIds: ["architect", "analyst"] },
      ...(hasUI ? [{ id: "design", title: "بازبینی UI/UX", tasks: ["ساختار بصری موجود را حفظ و مشکلات UX/RTL را استخراج کن"], roleIds: phase("ui") }] : []),
      { id: "implement", title: "پیاده‌سازی", tasks: ["تغییرات را به کوچک‌ترین patchهای قابل بررسی تقسیم کن"], roleIds: ["coder", "debugger"] },
      { id: "verify", title: "آزمون و بازبینی خصمانه", tasks: [hasTests ? "تست‌های موجود را اجرا/گسترش بده" : "برای مسیرهای اصلی تست ایجاد کن", "Regression و edge caseها را بررسی کن"], roleIds: ["qa", "bug-hunter", "security", "reviewer"] },
      ...(hasBuild ? [{ id: "release", title: "Build و Release", tasks: ["Build reproducible و smoke test انجام بده", "artifact و rollback plan تولید کن"], roleIds: ["build", "deploy", "release"] }] : []),
    ],
    acceptanceCriteria: ["TypeScript بدون خطای type-check", "مسیرهای اصلی بدون regression", "عدم افشای secret", "تغییرات قابل rollback", "رابط فارسی در صورت فعال بودن بدون تغییر غیرضروری در گرافیک"],
    risks: ["محدودیت یا قطعی provider خارجی", "ناسازگاری dependencyها", "تغییر ناخواسته UI", "کاهش کیفیت در fallback مدل"]
  };
}
