#!/usr/bin/env node
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

export function createLogger(root) {
  const dir = path.join(root, ".w0", "observability");
  const file = path.join(dir, "events.jsonl");
  async function emit(type, payload = {}) {
    await mkdir(dir, { recursive: true });
    const event = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ts: new Date().toISOString(), type, ...payload };
    await appendFile(file, JSON.stringify(event) + "\n", "utf8");
    return event;
  }
  async function list(limit = 200) {
    try {
      const lines = (await readFile(file, "utf8")).trim().split("\n").filter(Boolean);
      return lines.slice(-limit).map(line => JSON.parse(line));
    } catch { return []; }
  }
  return { emit, list, file };
}

if (process.argv[1] && process.argv[1].endsWith("w0-observability.mjs")) {
  const root = path.resolve(process.argv[2] || process.cwd());
  const logger = createLogger(root);
  if (process.argv[3] === "list") console.log(JSON.stringify(await logger.list(), null, 2));
  else console.log(JSON.stringify(await logger.emit(process.argv[3] || "runtime", { message: process.argv.slice(4).join(" ") }), null, 2));
}
