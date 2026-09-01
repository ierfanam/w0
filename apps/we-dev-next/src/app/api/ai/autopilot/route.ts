import { NextResponse } from "next/server";
import { createAutopilotPlan } from "@/lib/ai/autopilot";
import { getAvailableModels } from "@/app/api/model/config";
import { runSwarm, buildReviewPrompt } from "@/lib/ai/agentTeam";
import { streamTextFn } from "@/app/api/chat/action";
import { analyzeProject, buildContextPack } from "@/lib/ai/projectIntelligence";
import { createApprovalPlan } from "@/lib/ai/executionPolicy";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const objective = String(body.objective ?? body.request ?? "");
    const project = body.project ?? { name: "project", files: {} };
    if (!objective) return NextResponse.json({ error: "objective الزامی است" }, { status: 400 });
    const intelligence = analyzeProject(String(project.name), project.files || {});
    const plan = createAutopilotPlan(objective, intelligence.snapshot);
    const configs = await getAvailableModels();
    const models = configs.map(m => ({ id: m.modelKey, provider: m.provider, label: m.modelName, capabilities: ["coding" as const, "reasoning" as const, ...(m.useImage ? ["vision" as const] : []), ...(m.functionCall ? ["tools" as const] : [])], free: m.free, enabled: true }));
    const enrichedTasks = plan.tasks.map(t => ({ ...t, input: `${t.input}\n\n${buildContextPack(intelligence)}` }));
    const results = await runSwarm(enrichedTasks, models);
    const leaderModel = models[0]?.id;
    let final = "";
    if (leaderModel) {
      const response = await streamTextFn([{ id: crypto.randomUUID(), role: "user", content: buildReviewPrompt(results, objective) }], undefined, leaderModel);
      final = await response.text;
    }
    const approval = createApprovalPlan((body.actions || []).map((action: any) => ({ ...action, risk: action.risk || "medium" })));
    return NextResponse.json({ plan, intelligence, results, final, approval, execution: { applied: false, note: "این endpoint برنامه و تغییرات پیشنهادی را تولید می‌کند؛ اعمال فایل/دستور باید از executor میزبان و پس از policy approval انجام شود." }, status: results.every(r => r.status === "success") ? "ready" : "needs-retry" });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
