export interface ModelConfig {
    modelName: string;
    modelKey: string;
    useImage: boolean;
    description?: string;
    iconUrl?: string;
    provider: string;
    apiKey?: string;
    apiUrl?: string;
    functionCall: boolean;
    free?: boolean;
}

export const modelConfig: ModelConfig[] = [
    {
        modelName: "OpenRouter Free Router",
        modelKey: "openrouter/free",
        useImage: false,
        provider: "openrouter",
        apiKey: process.env.OPENROUTER_API_KEY,
        apiUrl: "https://openrouter.ai/api/v1",
        description: "انتخاب خودکار از مدل‌های رایگان موجود؛ مناسب برای اجرای پیش‌فرض",
        functionCall: true,
        free: true,
    },
    {
        modelName: "GLM-4.7-Flash (رایگان)",
        modelKey: "glm-4.7-flash",
        useImage: false,
        provider: "zhipu",
        apiKey: process.env.ZHIPU_API_KEY,
        apiUrl: "https://open.bigmodel.cn/api/paas/v4",
        description: "مدل رایگان زپیو؛ مناسب کدنویسی، عامل‌ها و پروژه‌های طولانی",
        functionCall: true,
        free: true,
    },
    {
        modelName: "GLM-4.1V-Thinking-Flash (رایگان)",
        modelKey: "glm-4.1v-thinking-flash",
        useImage: true,
        provider: "zhipu",
        apiKey: process.env.ZHIPU_API_KEY,
        apiUrl: "https://open.bigmodel.cn/api/paas/v4",
        description: "مدل رایگان بینایی/استدلال برای تصویر، رابط کاربری و کدنویسی",
        functionCall: true,
        free: true,
    },
];

export async function getAvailableModels() {
    const result = [...modelConfig];
    if (process.env.OPENROUTER_API_KEY) {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/models", {
                headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
                cache: "no-store",
            });
            if (response.ok) {
                const data = await response.json();
                for (const item of data.data ?? []) {
                    const prompt = Number(item.pricing?.prompt ?? 1);
                    const completion = Number(item.pricing?.completion ?? 1);
                    if (prompt === 0 && completion === 0) {
                        result.push({
                            modelName: `${item.name ?? item.id} (رایگان)`,
                            modelKey: `openrouter/${item.id}`,
                            useImage: Boolean(item.architecture?.input_modalities?.includes("image")),
                            provider: "openrouter",
                            apiKey: process.env.OPENROUTER_API_KEY,
                            apiUrl: "https://openrouter.ai/api/v1",
                            description: "مدل رایگان شناسایی‌شده به‌صورت پویا",
                            functionCall: Boolean(item.supported_parameters?.includes("tools")),
                            free: true,
                        });
                    }
                }
            }
        } catch (error) {
            console.warn("OpenRouter model discovery failed", error);
        }
    }
    return result;
}
