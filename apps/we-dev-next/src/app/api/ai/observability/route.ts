import { NextResponse } from "next/server";
import { listTraces } from "@/lib/ai/observability";
export async function GET() { return NextResponse.json(listTraces()); }
