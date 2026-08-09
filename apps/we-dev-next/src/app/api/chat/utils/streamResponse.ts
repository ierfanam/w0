import {v4 as uuidv4} from "uuid";
import {Messages, StreamingOptions, streamTextFn} from "../action";
import {CONTINUE_PROMPT, ToolInfo} from "../prompt";
import {estimateTokens} from "@/utils/tokens";
import SwitchableStream from "../switchable-stream";
import {tool} from "ai";
import {jsonSchemaToZodSchema} from "@/app/api/chat/utils/json2zod";

const MAX_RESPONSE_SEGMENTS = 2;

export async function streamResponse(messages: Messages, model: string, userId: string | null, tools?: ToolInfo[]): Promise<Response> {
    let toolList = {};
    if (tools && tools.length > 0) {
        toolList = tools.reduce((obj, {name, ...args}) => {
            obj[name] = tool({ id: args.id, description: args.description, parameters: jsonSchemaToZodSchema(args.parameters) });
            return obj;
        }, {});
    }
    const stream = new SwitchableStream();
    const options: StreamingOptions = {
        tools: toolList,
        toolCallStreaming: true,
        onError: (err: any) => {
            const errorCause = err?.cause?.message || err?.cause || err?.error?.message;
            const msg = errorCause || err?.errors?.[0]?.responseBody || JSON.stringify(err);
            throw new Error(msg || JSON.stringify(err));
        },
        onFinish: async (response) => {
            const {text: content, finishReason} = response;
            if (finishReason !== "length") {
                // Free mode deliberately has no application-side token debit.
                estimateTokens(content);
                return stream.close();
            }
            if (stream.switches >= MAX_RESPONSE_SEGMENTS) throw Error("Cannot continue message: Maximum segments reached");
            messages.push({id: uuidv4(), role: "assistant", content});
            messages.push({id: uuidv4(), role: "user", content: CONTINUE_PROMPT});
        },
    };

    try {
        const result = streamTextFn(messages, options, model);
        return result.toDataStreamResponse({ sendReasoning: true });
    } catch (error: any) {
        stream.close();
        if (error.cause) {
            const newError = new Error(error.cause);
            newError.cause = error.cause;
            throw newError;
        }
        throw error;
    }
}
