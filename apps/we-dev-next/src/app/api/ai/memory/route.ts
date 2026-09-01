import { NextResponse } from "next/server";
import { clearMemory, recall, remember } from "@/lib/ai/projectMemory";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.json(recall(url.searchParams.get("projectId") ?? "", url.searchParams.get("q") ?? undefined));
}
export async function POST(request: Request) {
  const body = await request.json();
  if (!body.projectId || !body.text) return NextResponse.json({ error: "projectId و text الزامی هستند" }, { status: 400 });
  return NextResponse.json(remember({ projectId: String(body.projectId), kind: body.kind ?? "fact", text: String(body.text), tags: Array.isArray(body.tags) ? body.tags.map(String) : [] }));
}
export async function DELETE(request: Request) {
  const { projectId } = await request.json();
  clearMemory(String(projectId ?? ""));
  return NextResponse.json({ ok: true });
}
