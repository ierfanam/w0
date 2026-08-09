export type ToolContext = { projectRoot?: string; signal?: AbortSignal; metadata?: Record<string, unknown> };
export type ToolDefinition<T = unknown, R = unknown> = {
  id: string; name: string; description: string; inputSchema: Record<string, unknown>;
  execute: (input: T, context: ToolContext) => Promise<R>;
};

const registry = new Map<string, ToolDefinition<any, any>>();

export function registerTool<T, R>(tool: ToolDefinition<T, R>) { registry.set(tool.id, tool); return tool; }
export function getTool(id: string) { return registry.get(id); }
export function listTools() { return [...registry.values()].map(({ execute: _execute, ...publicTool }) => publicTool); }

registerTool({
  id: "project.inspect", name: "Project Inspector", description: "Analyze a project snapshot without modifying files.",
  inputSchema: { type: "object", properties: { files: { type: "array" } }, required: ["files"] },
  async execute(input: { files: Array<{ path: string; content: string }> }) {
    const extensions = new Map<string, number>();
    let lines = 0;
    for (const file of input.files) { const ext = file.path.includes(".") ? file.path.slice(file.path.lastIndexOf(".")) : "(none)"; extensions.set(ext, (extensions.get(ext) || 0) + 1); lines += file.content.split(/\r?\n/).length; }
    return { files: input.files.length, lines, extensions: Object.fromEntries(extensions) };
  }
});

registerTool({
  id: "project.search", name: "Project Search", description: "Search project text for a term.",
  inputSchema: { type: "object", properties: { files: { type: "array" }, query: { type: "string" } }, required: ["files", "query"] },
  async execute(input: { files: Array<{ path: string; content: string }>; query: string }) {
    const q = input.query.toLowerCase();
    return input.files.filter(f => f.content.toLowerCase().includes(q)).map(f => f.path);
  }
});

registerTool({
  id: "patch.validate", name: "Patch Validator", description: "Validate proposed patches before applying them.",
  inputSchema: { type: "object", properties: { patches: { type: "array" } }, required: ["patches"] },
  async execute(input: { patches: Array<{ path: string; content: string }> }) {
    const findings: string[] = [];
    for (const p of input.patches) { if (!p.path || p.path.startsWith("/") || p.path.includes("..")) findings.push(`مسیر ناامن: ${p.path}`); if (p.content.length > 2_000_000) findings.push(`فایل بسیار بزرگ: ${p.path}`); }
    return { passed: findings.length === 0, findings };
  }
});
