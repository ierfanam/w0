export interface ModelConfig { modelName: string; modelKey: string; useImage: boolean; description?: string; iconUrl?: string; provider: string; apiKey?: string; apiUrl?: string; functionCall: boolean; free?: boolean; available?: boolean; }

const zhipu = (modelName: string, modelKey: string, useImage = false, description = "مدل رایگان Zhipu") => ({ modelName: `${modelName} (رایگان)`, modelKey, useImage, provider: "zhipu", apiKey: process.env.ZHIPU_API_KEY, apiUrl: "https://open.bigmodel.cn/api/paas/v4", description, functionCall: true, free: true, available: Boolean(process.env.ZHIPU_API_KEY) });

export const modelConfig: ModelConfig[] = [
  { modelName: "OpenRouter Free Router", modelKey: "openrouter/free", useImage: false, provider: "openrouter", apiKey: process.env.OPENROUTER_API_KEY, apiUrl: "https://openrouter.ai/api/v1", description: "انتخاب خودکار از مدل‌های رایگان موجود", functionCall: true, free: true, available: Boolean(process.env.OPENROUTER_API_KEY) },
  zhipu("GLM-4.7-Flash", "glm-4.7-flash", false, "مدل رایگان Coding/Agent با context تا 200K"),
  zhipu("GLM-4.5-Flash", "glm-4.5-flash", false, "مدل رایگان استدلال و ابزار"),
  zhipu("GLM-4V-Flash", "glm-4v-flash", true, "مدل رایگان درک تصویر"),
  zhipu("GLM-4.1V-Thinking-Flash", "glm-4.1v-thinking-flash", true, "مدل رایگان بینایی و استدلال"),
];

export async function getAvailableModels() {
  const result = [...modelConfig];
  if (process.env.CUSTOM_AI_API_KEY && process.env.CUSTOM_AI_BASE_URL) {
    const ids = (process.env.CUSTOM_AI_MODELS || "").split(",").map(x => x.trim()).filter(Boolean);
    for (const id of ids) result.push({ modelName: `${id} (سازگار)`, modelKey: `custom/${id}`, useImage: false, provider: "custom", apiKey: process.env.CUSTOM_AI_API_KEY, apiUrl: process.env.CUSTOM_AI_BASE_URL, description: "مدل OpenAI-compatible سفارشی", functionCall: true, free: false, available: true });
  }
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` }, cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        for (const item of data.data ?? []) {
          if (Number(item.pricing?.prompt ?? 1) === 0 && Number(item.pricing?.completion ?? 1) === 0) result.push({ modelName: `${item.name ?? item.id} (رایگان)`, modelKey: `openrouter/${item.id}`, useImage: Boolean(item.architecture?.input_modalities?.includes("image")), provider: "openrouter", apiKey: process.env.OPENROUTER_API_KEY, apiUrl: "https://openrouter.ai/api/v1", description: "مدل رایگان شناسایی‌شده به‌صورت پویا", functionCall: Boolean(item.supported_parameters?.includes("tools")), free: true, available: true });
        }
      }
    } catch (error) { console.warn("OpenRouter model discovery failed", error); }
  }
  return result.filter(m => m.available !== false);
}
