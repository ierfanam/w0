import { NextResponse } from "next/server";
import { streamTextFn } from "../chat/action";

const DEFAULT_ROLES = [
  { id: "ui", name: "متخصص طراحی رابط و گرافیک", instruction: "روی UX، UI، دسترس‌پذیری، طراحی بصری و حفظ گرافیک موجود تمرکز کن." },
  { id: "code", name: "متخصص ارشد کدنویسی", instruction: "معماری، TypeScript/React/Next.js، کیفیت کد و پیاده‌سازی قابل نگهداری را بررسی کن." },
  { id: "analysis", name: "متخصص تحلیل و توسعه", instruction: "نیازمندی‌ها، معماری، وابستگی‌ها، ریسک‌ها و نقشه اجرای مرحله‌ای را تحلیل کن." },
  { id: "bug", name: "متخصص خطایابی و باگ‌یابی", instruction: "خطاهای محتمل، race condition، edge case و مسیرهای شکست را پیدا و راه‌حل بده." },
  { id: "debug", name: "متخصص دیباگ", instruction: "برای خطاها روش بازتولید، instrumentation، logging و اصلاح دقیق پیشنهاد کن." },
  { id: "build", name: "متخصص کامپایل و Build", instruction: "TypeScript، bundling، Electron/Vite/Next و وابستگی‌ها را برای build پایدار بررسی کن." },
  { id: "deploy", name: "متخصص استقرار", instruction: "Deployment، environment variables، health check، rollback و portability را طراحی کن." },
  { id: "reverse", name: "متخصص مهندسی معکوس و سازگاری", instruction: "ساختار سیستم را تحلیل کن و فقط روش‌های مجاز، مستند و قابل‌استفاده برای interoperability را پیشنهاد بده." },
  { id: "localization", name: "متخصص بومی‌سازی و دسترسی منطقه‌ای", instruction: "RTL، فارسی، تاریخ/اعداد، encoding، endpoint fallback و سازگاری شبکه را بررسی کن؛ راهکارهای دور زدن کنترل دسترسی یا محدودیت‌های ارائه‌دهنده پیشنهاد نده." },
];

async function runAgent(model: string, role: typeof DEFAULT_ROLES[number], project: string, request: string) {
  const prompt = `تو ${role.name} هستی.\nوظیفه تخصصی: ${role.instruction}\n\nپروژه:\n${project.slice(0, 120000)}\n\nدرخواست:\n${request}\n\nخروجی را دقیق، اجرایی و کوتاه‌گویی غیرضروری نداشته باش. اگر کدی پیشنهاد می‌کنی، مسیر فایل و دلیل تغییر را مشخص کن.`;
  const result = await streamTextFn([{ id: crypto.randomUUID(), role: "user", content: prompt }], undefined, model);
  return result.text;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const model = String(body.model || "openrouter/free");
    const project = String(body.project || "");
    const requestText = String(body.request || "");
    const selectedIds = Array.isArray(body.roles) && body.roles.length ? body.roles : DEFAULT_ROLES.map((r) => r.id);
    const roles = DEFAULT_ROLES.filter((role) => selectedIds.includes(role.id));

    if (!project || !requestText) {
      return NextResponse.json({ error: "project و request الزامی هستند" }, { status: 400 });
    }

    const results = await Promise.all(roles.map(async (role) => ({
      role: role.name,
      output: await runAgent(model, role, project, requestText),
    })));

    const synthesisPrompt = `تو رهبر تیم توسعه هستی. خروجی متخصصان زیر را ادغام کن و یک برنامه اجرایی نهایی بساز. تناقض‌ها را حل کن. نتیجه باید شامل معماری، فایل‌های موردنیاز، ترتیب تغییرات، تست‌ها، معیار پذیرش و ریسک‌ها باشد.\n\nدرخواست: ${requestText}\n\nگزارش متخصصان:\n${results.map((r) => `### ${r.role}\n${r.output}`).join("\n\n")}`;
    const finalResult = await streamTextFn([{ id: crypto.randomUUID(), role: "user", content: synthesisPrompt }], undefined, model);

    return NextResponse.json({
      model,
      roles: results,
      final: await finalResult.text,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(DEFAULT_ROLES);
}
