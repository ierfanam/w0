import { NextRequest, NextResponse } from "next/server";
import { createApprovalPlan, type ExecutionAction } from "@/lib/ai/executionPolicy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const actions = (body?.actions || []) as ExecutionAction[];
    return NextResponse.json({ plan: createApprovalPlan(actions) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
