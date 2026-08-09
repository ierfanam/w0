import { NextResponse } from "next/server";
import { streamTextFn } from "../chat/action";
import { buildPlan } from "../../../lib/agentic/planner";
import { AGENT_ROLES } from "../../../lib/agentic/roles";
import { routeModel } from "../../../lib/agentic/model-router";
import { qualityGate } from "../../../lib/agentic/quality";
import type { AgentResult, ProjectSnapshot } from "../../../lib/agentic/types";

const MAX_FILES = 400;
const MAX_FILE_CHARS = 30000;

function normalizeProject(input: any): ProjectSnapshot {
  const files = Array.isArray(input?.files)
    ? input.files.slice(0, MAX_FILES)
        .map((f: any) => ({ path: String(f.path || ""), content: String(f.content || "").slice(0, MAX_FILE_CHARS), language: f.language ? String(f.language) : undefined }))
        .filter((f: any) => f.path)
    : [];
  return { root: input?.root ? String(input.root) : undefined, files };
}

function commandFor(files: ProjectSnapshot["files"], kind: "test" | "build" | "lint") {
  const names = new Set(files.map(f => f.path));
  if (names.has("pnpm-lock.yaml") || names.has("package.json")) {
    if (kind === "lint") return "pnpm lint";
    if (kind === "test") return "pnpm test";
    return "pnpm build";
  }
  if ([...names].some(n => n.endsWith(".py"))) {
    if (kind === "test") return "python -m pytest";
    return "python -m compileall .";
  }
  if ([...names].some(n => n.endsWith(".csproj"))) return "dotnet build";
  if ([...names].some(n => n.endsWith(".sln"))) return "dotnet build";
  if ([...names].some(n => n.endsWith(".go"))) return kind === "test" ? "go test ./..." : "go build ./...";
  return null;
}

function executableWorkflow(project: ProjectSnapshot, goal: string, plan: any) {
  const steps: Array<{id: string; command: string; failFast?: boolean; sensitive?: boolean}> = [
    { id: "snapshot", command: "node scripts/w0-agent-runtime.mjs . inspect" },
  ];
  const lint = commandFor(project.files, "lint");
  const test = commandFor(project.files, "test");
  const build = commandFor(project.files, "build");
  if (lint) steps.push({ id: "lint", command: lint, failFast: false });
  if (test) steps.push({ id: "test", command: test, failFast: false });
  if (build) steps.push({ id: "build", command: build });
  steps.push({ id: "final-status", command: "git status --short --branch" });
  return {
    version: 1,
    name: "W0 Autopilot — executable verification",
    goal,
    plan,
    approvalPolicy: "sensitive git/deploy/destructive commands require explicit approval unless runtime is invoked with --auto/--yes",
    steps,
  };
}

async function ask(role: typeof AGENT_ROLES[number], project: ProjectSnapshot, goal: string, model?: string): Promise<AgentResult> {
  const started = Date.now();
  try {
    const selected = routeModel(role.capabilities, model);
    const context = project.files.map(f => `--- ${f.path}\n${f.content}`).join("\n");
    const prompt = `نقش: ${role.name}\nدستور تخصصی: ${role.system}\n\nهدف پروژه: ${goal}\n\nکد پروژه:\n${context.slice(0, 180000)}\n\nخروجی را به فارسی و ساختاریافته ارائه کن. اگر اصلاح لازم است، دقیقاً path فایل، دلیل، و patch پیشنهادی را مشخص کن. هرگز secret واقعی تولید نکن.`;
    const result = await streamTextFn([{ id: crypto.randomUUID(), role: "user", content: prompt }], undefined, selected.id);
    const text = await result.text;
    return { taskId: crypto.randomUUID(), roleId: role.id, model: selected.id, status: "success", summary: text.slice(0, 12000), recommendations: [], durationMs: Date.now() - started };
  } catch (error) {
    return { taskId: crypto.randomUUID(), roleId: role.id, model: model || "auto", status: "failed", summary: "", recommendations: [], durationMs: Date.now() - started, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const goal = String(body.goal || body.request || "").trim();
    if (!goal) return NextResponse.json({ error: "goal الزامی است" }, { status: 400 });
    const project = normalizeProject(body.project);
    const requestedRoles = Array.isArray(body.roles) && body.roles.length
      ? AGENT_ROLES.filter(r => body.roles.includes(r.id))
      : AGENT_ROLES.filter(r => ["architect","ui","coder","analyst","bug-hunter","debugger","qa","build","deploy","reverse","localization","security","reviewer","release"].includes(r.id));
    const plan = buildPlan(goal, project, requestedRoles);
    const qualityBefore = qualityGate(project);
    const concurrency = Math.max(1, Math.min(8, Number(body.concurrency) || 6));
    const results: AgentResult[] = [];
    for (let i = 0; i < requestedRoles.length; i += concurrency) {
      const batch = requestedRoles.slice(i, i + concurrency);
      results.push(...await Promise.all(batch.map(role => ask(role, project, goal, body.model))));
    }
    const reports = results.map(r => `### ${r.roleId} (${r.model})\n${r.summary || r.error}`).join("\n\n");
    const leader = AGENT_ROLES.find(r => r.id === "leader")!;
    const final = await ask(leader, project, `${goal}\n\nPLAN:\n${JSON.stringify(plan)}\n\nگزارش متخصصان:\n${reports}`, body.model);
    const reviewer = AGENT_ROLES.find(r => r.id === "reviewer")!;
    const adversarial = await ask(reviewer, project, `${goal}\n\nبرنامه نهایی رهبر:\n${final.summary}\n\nعمداً آن را به چالش بکش و regressionهای احتمالی را پیدا کن.`, body.model);
    const runtimePlan = executableWorkflow(project, goal, plan);
    return NextResponse.json({ ok: true, goal, plan, runtimePlan, qualityBefore, results, final, adversarial, generatedAt: new Date().toISOString(), capabilities: { autopilot: true, swarm: true, adversarialReview: true, selfHealingLoop: true, modelRouting: true, qualityGate: true, executableRuntime: true, browserRuntime: true, gitRuntime: true, buildRuntime: true, deployRuntime: true } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ enabled: true, roles: AGENT_ROLES, description: "W0 Project Autopilot — executable workflow generation" });
}
