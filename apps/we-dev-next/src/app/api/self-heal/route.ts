import { NextResponse } from "next/server";
import { streamTextFn } from "../chat/action";
import { routeModel } from "../../../lib/agentic/model-router";

export async function POST(request: Request) {
  const body = await request.json();
  const error = String(body.error || "").trim();
  const project = String(body.project || "").slice(0, 180000);
  if (!error) return NextResponse.json({ error: "error الزامی است" }, { status: 400 });
  const model = routeModel(["debugging", "coding", "testing"], body.model).id;
  const diagnosis = await streamTextFn([{ id: crypto.randomUUID(), role: "user", content: `خطای زیر را ریشه‌یابی کن.\n${error}\n\nکد پروژه:\n${project}\nخروجی: علت، reproduction، فایل/خط تقریبی و patch پیشنهادی.` }], undefined, model);
  const diagnosisText = await diagnosis.text;
  const verification = await streamTextFn([{ id: crypto.randomUUID(), role: "user", content: `این diagnosis را خصمانه بررسی کن و test/verification برای اثبات رفع خطا پیشنهاد بده:\n${diagnosisText}` }], undefined, model);
  return NextResponse.json({ ok: true, model, diagnosis: diagnosisText, verification: await verification.text, loop: ["detect", "diagnose", "patch", "verify", "retry-or-escalate"], maxIterations: 3 });
}
