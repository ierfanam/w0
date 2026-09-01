import { NextResponse } from "next/server";
import { getAvailableModels } from "@/app/api/model/config";
import { runArena, rankArena } from "@/lib/ai/benchmark";
import { streamTextFn } from "@/app/api/chat/action";

export async function POST(request: Request) {
  const body = await request.json();
  const cases = Array.isArray(body.cases) ? body.cases : [];
  if (!cases.length) return NextResponse.json({ error: "cases الزامی است" }, { status: 400 });
  const configs = await getAvailableModels();
  const requested = Array.isArray(body.models) && body.models.length ? body.models.map(String) : configs.map(m => m.modelKey);
  const models = configs.map(m => m.modelKey).filter(m => requested.includes(m));
  const results = await runArena(models, cases, async (model, prompt) => (await streamTextFn([{ id: crypto.randomUUID(), role: "user", content: prompt }], undefined, model)).text);
  return NextResponse.json({ results, ranking: rankArena(results) });
}
