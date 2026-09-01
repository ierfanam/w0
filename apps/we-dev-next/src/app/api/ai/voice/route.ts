import { NextResponse } from "next/server";
import { getVoiceSessionConfig } from "@/lib/ai/voice";

export async function GET() {
  return NextResponse.json({ config: getVoiceSessionConfig(), provider: process.env.VOICE_PROVIDER || "browser-adapter" });
}
