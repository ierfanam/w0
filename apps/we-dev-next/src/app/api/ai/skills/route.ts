import { NextResponse } from "next/server";
import { listSkills } from "@/lib/ai/skills";
export async function GET() { return NextResponse.json(listSkills()); }
