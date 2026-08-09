import type { ProjectSnapshot, QualityReport } from "./types";

const SECRET_PATTERNS = [/(sk-[A-Za-z0-9_-]{20,})/, /(api[_-]?key\s*[:=]\s*["'][^"']+["'])/i, /(password\s*[:=]\s*["'][^"']+["'])/i];

export function qualityGate(project: ProjectSnapshot): QualityReport {
  const findings: QualityReport["findings"] = [];
  for (const file of project.files) {
    for (const pattern of SECRET_PATTERNS) if (pattern.test(file.content)) findings.push({ severity: "critical", message: "احتمال وجود secret سخت‌کدشده", path: file.path });
    if (/TODO|FIXME|XXX/.test(file.content)) findings.push({ severity: "low", message: "نشانه کار ناتمام یا نیازمند بازبینی", path: file.path });
    if (file.content.length > 500_000) findings.push({ severity: "medium", message: "فایل بسیار بزرگ و دشوار برای نگهداری", path: file.path });
  }
  const critical = findings.filter(f => f.severity === "critical").length;
  const high = findings.filter(f => f.severity === "high").length;
  const score = Math.max(0, 100 - critical * 30 - high * 15 - findings.filter(f => f.severity === "medium").length * 5 - findings.filter(f => f.severity === "low").length);
  return { score, passed: critical === 0 && high === 0, findings, nextActions: findings.slice(0, 10).map(f => `${f.path || "پروژه"}: ${f.message}`) };
}

export function adversarialChecklist() { return ["آیا تغییر بدون test باقی مانده است؟", "آیا fallback باعث regression می‌شود؟", "آیا ورودی کاربر به shell/SQL/URL بدون اعتبارسنجی می‌رسد؟", "آیا secret یا token در log/response قرار گرفته است؟", "آیا خطای provider باعث crash کل برنامه می‌شود؟", "آیا RTL یا encoding خراب می‌شود؟", "آیا patch فقط فایل‌های لازم را تغییر داده است؟", "آیا rollback امکان‌پذیر است؟"]; }
