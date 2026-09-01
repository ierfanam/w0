import { NextResponse } from "next/server";
import { getAvailableModels } from "@/app/api/model/config";
import { inferCapabilities, selectModel } from "@/lib/ai/modelRouter";
import type { ModelProfile } from "@/lib/ai/types";

export async function GET() {
  const configs = await getAvailableModels();
  const models: ModelProfile[] = configs.map(m => ({
    id: m.modelKey, provider: m.provider, label: m.modelName,
    capabilities: ["coding", "reasoning", ...(m.useImage ? ["vision" as const] : []), ...(m.functionCall ? ["tools" as const] : []), ...(m.free ? ["agentic" as const] : [])],
    free: m.free, enabled: true,
  }));
  return NextResponse.json(models);
}

export async function POST(request: Request) {
  const { goal, preferredProvider } = await request.json();
  const models = (await getAvailableModels()).map(m => ({ id: m.modelKey, provider: m.provider, label: m.modelName, capabilities: ["coding", "reasoning", ...(m.useImage ? ["vision" as const] : []), ...(m.functionCall ? ["tools" as const] : [])], free: m.free, enabled: true }));
  return NextResponse.json({ required: inferCapabilities(String(goal ?? "")), selected: selectModel(models, inferCapabilities(String(goal ?? "")), preferredProvider) });
}
