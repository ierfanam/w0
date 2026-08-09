import { NextResponse } from "next/server";
import { streamTextFn } from "../chat/action";
import { listModels } from "../../../lib/agentic/model-router";

export async function POST(request: Request) {
  const body = await request.json();
  const prompt = String(body.prompt || "").trim();
  if (!prompt) return NextResponse.json({ error: "prompt الزامی است" }, { status: 400 });
  const models = listModels().filter(m => m.free).slice(0, Math.max(1, Math.min(12, Number(body.limit) || 6)));
  const started = Date.now();
  const results = await Promise.all(models.map(async model => {
    const t = Date.now();
    try { const r = await streamTextFn([{ id: crypto.randomUUID(), role: "user", content: prompt }], undefined, model.id); return { model: model.id, ok: true, text: (await r.text).slice(0, 10000), latencyMs: Date.now() - t }; }
    catch (e) { return { model: model.id, ok: false, error: e instanceof Error ? e.message : String(e), latencyMs: Date.now() - t }; }
  }));
  return NextResponse.json({ prompt, results, totalMs: Date.now() - started, selection: "free-first" });
}
