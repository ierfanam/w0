import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { streamText as _streamText, convertToCoreMessages, generateObject } from "ai";
import type { LanguageModel, Message } from "ai";
import { modelConfig } from "../model/config";
import { createDeepSeek } from "@ai-sdk/deepseek";

export const MAX_TOKENS = 16000;
export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], "model">;
let initOptions: Record<string, unknown> = {};

const LEGACY_FREE_FALLBACKS = new Set([
  "claude-3-7-sonnet-20250219",
  "claude-3-5-sonnet-20240620",
  "gpt-4o-mini",
  "DeepSeek-R1",
  "deepseek-chat",
]);

function resolveModel(modelKey: string) {
  const configured = modelConfig.find((item) => item.modelKey === modelKey);
  if (configured) return { provider: configured.provider, model: configured.modelKey, apiKey: configured.apiKey, apiUrl: configured.apiUrl };

  if (modelKey.startsWith("openrouter/")) {
    return { provider: "openrouter", model: modelKey.slice("openrouter/".length), apiKey: process.env.OPENROUTER_API_KEY, apiUrl: "https://openrouter.ai/api/v1" };
  }

  // The original client can still submit legacy model IDs. Do not invoke a paid
  // endpoint behind the user's back; transparently use the legitimate free router.
  if (LEGACY_FREE_FALLBACKS.has(modelKey)) {
    return { provider: "openrouter", model: "free", apiKey: process.env.OPENROUTER_API_KEY, apiUrl: "https://openrouter.ai/api/v1" };
  }

  throw new Error(`مدل ناشناخته یا غیرفعال: ${modelKey}`);
}

export function getOpenAIModel(baseURL: string, apiKey: string, model: string) {
  const resolved = resolveModel(model);
  const provider = resolved.provider;
  const key = apiKey || resolved.apiKey;
  const url = baseURL || resolved.apiUrl;
  if (!key) throw new Error(`API key برای ${provider} تنظیم نشده است`);

  if (provider === "deepseek") {
    initOptions = {};
    return createDeepSeek({ apiKey: key, baseURL: url })(resolved.model);
  }
  if (provider === "zhipu") {
    initOptions = { maxTokens: 65536 };
    return createOpenAI({ apiKey: key, baseURL: url, compatibility: "compatible" })(resolved.model);
  }
  if (provider === "openrouter") {
    initOptions = {};
    return createOpenAI({ apiKey: key, baseURL: url, compatibility: "compatible", headers: { "HTTP-Referer": process.env.APP_BASE_URL || "http://localhost:3000", "X-Title": "We0 Free AI" } })(resolved.model);
  }
  initOptions = {};
  return createOpenAI({ apiKey: key, baseURL: url })(resolved.model);
}

export type Messages = Message[];
const defaultModel = "openrouter/free";

export async function generateObjectFn(messages: Messages) {
  return generateObject({
    model: getOpenAIModel("", "", defaultModel) as LanguageModel,
    schema: z.object({ files: z.array(z.string()) }),
    messages: convertToCoreMessages(messages),
  });
}

export function streamTextFn(messages: Messages, options?: StreamingOptions, modelKey?: string) {
  const selectedModel = modelKey || defaultModel;
  const model = getOpenAIModel("", "", selectedModel) as LanguageModel;
  const newMessages = messages.map((item) => {
    if (item.role === "assistant") delete item.parts;
    return item;
  });
  return _streamText({ model, messages: convertToCoreMessages(newMessages), maxTokens: MAX_TOKENS, ...initOptions, ...options });
}
