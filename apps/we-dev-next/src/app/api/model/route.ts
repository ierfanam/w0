import { NextResponse } from "next/server";
import { getAvailableModels } from "./config";

export async function POST() {
    const models = await getAvailableModels();
    return NextResponse.json(models.map((item) => ({
        label: item.modelName,
        value: item.modelKey,
        useImage: item.useImage,
        description: item.description,
        icon: item.iconUrl,
        provider: item.provider,
        functionCall: item.functionCall,
        free: item.free === true,
    })));
}
