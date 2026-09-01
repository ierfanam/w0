import { NextResponse } from "next/server";
import { checkProvider, getProviderHealth } from "@/lib/ai/providerHealth";

export async function GET() { return NextResponse.json(getProviderHealth()); }

export async function POST() {
  const results = [];
  if (process.env.OPENROUTER_API_KEY) results.push(await checkProvider("openrouter", "https://openrouter.ai/api/v1", process.env.OPENROUTER_API_KEY));
  if (process.env.ZHIPU_API_KEY) results.push(await checkProvider("zhipu", "https://open.bigmodel.cn/api/paas/v4", process.env.ZHIPU_API_KEY));
  if (process.env.CUSTOM_AI_API_KEY && process.env.CUSTOM_AI_BASE_URL) results.push(await checkProvider("custom", process.env.CUSTOM_AI_BASE_URL, process.env.CUSTOM_AI_API_KEY));
  return NextResponse.json(results);
}
