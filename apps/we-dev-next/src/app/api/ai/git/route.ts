import { NextRequest, NextResponse } from "next/server";
import { summarizeGitChanges, releaseGate, type GitChange } from "@/lib/ai/gitIntelligence";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const changes = (body?.changes || []) as GitChange[];
    const summary = summarizeGitChanges(changes);
    return NextResponse.json({ summary, gate: releaseGate(summary, Number(body?.criticalFindings || 0)) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 }); }
}
