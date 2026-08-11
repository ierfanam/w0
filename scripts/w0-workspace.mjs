#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());
function run(command) {
  return new Promise((resolve, reject) => {
    const p = spawn(command, { cwd: root, shell: true, stdio: "pipe" });
    let out = "", err = "";
    p.stdout.on("data", d => out += d); p.stderr.on("data", d => err += d);
    p.on("error", reject); p.on("close", code => resolve({ code: code ?? 1, stdout: out, stderr: err }));
  });
}
function name(value) { if (!/^[a-zA-Z0-9._/-]+$/.test(value)) throw new Error("Invalid workspace name"); return value; }
const op = process.argv[3];
const workspace = name(process.argv[4] || `w0/${Date.now()}`);

if (op === "create") {
  const r = await run(`git worktree add --detach ${JSON.stringify(path.join(root, ".w0", "workspaces", workspace))} HEAD`);
  console.log(JSON.stringify({ operation: op, workspace, ...r }, null, 2)); process.exitCode = r.code;
} else if (op === "list") {
  const r = await run("git worktree list --porcelain"); console.log(r.stdout); process.exitCode = r.code;
} else if (op === "remove") {
  const target = path.join(root, ".w0", "workspaces", workspace);
  const r = await run(`git worktree remove ${JSON.stringify(target)}`); console.log(JSON.stringify({ operation: op, workspace, ...r }, null, 2)); process.exitCode = r.code;
} else if (op === "restore") {
  const ref = name(process.argv[5] || "HEAD");
  const r = await run(`git restore --source ${ref} --staged --worktree -- .`); console.log(JSON.stringify({ operation: op, ref, ...r }, null, 2)); process.exitCode = r.code;
} else {
  console.error("Usage: w0-workspace.mjs <root> <create|list|remove|restore> [workspace] [ref]"); process.exitCode = 2;
}
