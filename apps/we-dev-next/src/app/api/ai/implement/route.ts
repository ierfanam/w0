import { NextResponse } from "next/server";
import { z } from "zod";
import { generateStructuredObjectFn } from "@/app/api/chat/action";
import { analyzeProject, buildContextPack } from "@/lib/ai/projectIntelligence";
const Patch = z.object({ path: z.string(), content: z.string(), reason: z.string() });
const Schema = z.object({ summary: z.string(), patches: z.array(Patch).max(100), tests: z.array(z.string()), risks: z.array(z.string()) });
export async function POST(request: Request) { try { const body = await request.json(); const objective = String(body?.objective || ""); const files = (body?.files || {}) as Record<string, string>; if (!objective) return NextResponse.json({ error: "objective الزامی است" }, { status: 400 }); const intel = analyzeProject(String(body?.name || "project"), files); const prompt = `وظیفه: ${objective}\n\n${buildContextPack(intel)}\n\nفقط تغییرات لازم را پیشنهاد بده. مسیرها نسبی به ریشه پروژه باشند. secret تولید نکن. پاسخ باید JSON مطابق schema باشد.`; const result = await generateStructuredObjectFn([{ id: crypto.randomUUID(), role: "user", content: prompt }], Schema); return NextResponse.json(result.object); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 }); } }
