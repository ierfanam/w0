import { NextRequest, NextResponse } from "next/server";
import { analyzeProject, buildContextPack } from "@/lib/ai/projectIntelligence";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body?.name || "project");
    const files = body?.files as Record<string, string>;
    if (!files || typeof files !== "object") return NextResponse.json({ error: "files is required" }, { status: 400 });
    const intelligence = analyzeProject(name, files);
    return NextResponse.json({ ...intelligence, contextPack: buildContextPack(intelligence) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
