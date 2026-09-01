import type { Capability, ModelProfile } from "./types";

export function scoreModel(model: ModelProfile, required: Capability[]): number {
  if (model.enabled === false) return Number.NEGATIVE_INFINITY;
  const hits = required.filter((c) => model.capabilities.includes(c)).length;
  const missing = required.length - hits;
  return hits * 100 - missing * 40 + (model.free ? 5 : 0) + (model.priority ?? 0);
}

export function selectModel(models: ModelProfile[], required: Capability[], preferredProvider?: string): ModelProfile | null {
  return [...models]
    .filter((m) => !preferredProvider || m.provider === preferredProvider)
    .sort((a, b) => scoreModel(b, required) - scoreModel(a, required))[0] ?? null;
}

export function inferCapabilities(goal: string): Capability[] {
  const text = goal.toLowerCase();
  const caps = new Set<Capability>(["reasoning", "coding"]);
  if (/تصویر|ui|ux|گرافیک|image|visual|design/.test(text)) caps.add("vision");
  if (/وب|browser|سایت|search|تحقیق|research/.test(text)) caps.add("web");
  if (/فارسی|persian|rtl|بومی/.test(text)) caps.add("persian");
  if (/ابزار|tool|mcp|function/.test(text)) caps.add("tools");
  if (/json|ساختار/.test(text)) caps.add("json");
  if (/سریع|realtime|real-time/.test(text)) caps.add("speed");
  if (/agent|تیمی|عامل/.test(text)) caps.add("agentic");
  if (/context|مخزن|repository|کل پروژه/.test(text)) caps.add("long_context");
  return [...caps];
}
