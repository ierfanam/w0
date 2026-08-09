import { NextResponse } from "next/server";
import { getAvailableModels } from "../model/config";

export async function GET() {
  const models = await getAvailableModels();
  return NextResponse.json({ models, count: models.length, policy: "free-first" });
}
