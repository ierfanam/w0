import { NextResponse } from "next/server";
import { createAutopilotPlan } from "@/lib/ai/autopilot";
import { getAvailableModels } from "@/app/api/model/config";
import { runSwarm, buildReviewPrompt } from "@/lib/ai/agentTeam";
import { streamTextFn } from "@/app/api/chat/action";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const objective = String(body.objective ?? body.request ?? "");
    const project = body.project ?? { name: "project", files: {} };
    if (!objective) return NextResponse.json({ error: "objective الزامی است" }, { status: 400 });
    const plan = createAutopilotPlan(objective, project);
    const configs = await getAvailableModels();
    const models = configs.map(m => ({ id: m.modelKey, provider: m.provider, label: m.modelName, capabilities: ["coding", "reasoning", ...(m.useImage ? ["vision" as const] : []), ...(m.functionCall ? ["tools" as const] : [])], free: m.free, enabled: true }));
    const results = await runSwarm(plan.tasks, models);
    const leaderModel = models[0]?.id;
    let final = "";
    if (leaderModel) {
      const response = await streamTextFn([{ id: crypto.randomUUID(), role: "user", content: buildReviewPrompt(results, objective) }], undefined, leaderModel);
      final = await response.text;
    }
    return NextResponse.json({ plan, results, final, status: results.every(r => r.status === "success") ? "ready" : "needs-retry" });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
