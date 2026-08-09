#!/usr/bin/env node
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";

const root = path.resolve(process.argv[2] || process.cwd());
const args = new Set(process.argv.slice(3));
const auto = args.has("--auto");
const yes = args.has("--yes");
const dry = args.has("--dry-run");
const approvalFile = path.join(root, ".w0", "approvals.json");
const stateFile = path.join(root, ".w0", "runtime-state.json");
const artifactDir = path.join(root, ".w0", "artifacts");

const blocked = new Set(["rm", "rmdir", "del", "format", "shutdown", "reboot", "mkfs", "diskpart"]);
const sensitive = new Set(["git commit", "git push", "git reset --hard", "git clean", "npm publish", "pnpm publish", "docker push"]);

async function ensure() { await fs.mkdir(artifactDir, { recursive: true }); }
async function run(command, options = {}) {
  const cwd = options.cwd || root;
  const printable = `${command}`;
  if (dry) return { code: 0, stdout: `[dry-run] ${printable}`, stderr: "" };
  return await new Promise(resolve => {
    const child = spawn(command, { cwd, shell: true, env: { ...process.env, ...(options.env || {}) } });
    let stdout = "", stderr = "";
    child.stdout.on("data", d => { stdout += d; process.stdout.write(d); });
    child.stderr.on("data", d => { stderr += d; process.stderr.write(d); });
    child.on("close", code => resolve({ code: code ?? 1, stdout, stderr }));
  });
}
async function approve(action) {
  if (yes || auto) return true;
  await ensure();
  let approvals = {};
  try { approvals = JSON.parse(await fs.readFile(approvalFile, "utf8")); } catch {}
  if (approvals[action] === true) return true;
  process.stdout.write(`\nW0 approval required for: ${action}\nType YES to continue: `);
  const answer = await new Promise(resolve => { process.stdin.setEncoding("utf8"); process.stdin.once("data", d => resolve(d.trim())); });
  return answer === "YES";
}
function guard(command) {
  const normalized = command.toLowerCase().replace(/\\s+/g, " ").trim();
  for (const b of blocked) if (normalized.startsWith(b + " ") || normalized === b) throw new Error(`Blocked destructive command: ${command}`);
}
async function execSafe(command) {
  guard(command);
  const normalized = command.toLowerCase().replace(/\\s+/g, " ").trim();
  const isSensitive = [...sensitive].some(x => normalized.includes(x));
  if (isSensitive && !(await approve(command))) throw new Error(`Approval denied: ${command}`);
  return run(command);
}
async function walk(dir, out = []) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", ".next", "dist", "build", ".w0"].includes(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(p, out); else out.push(p);
  }
  return out;
}
async function snapshot() {
  const files = await walk(root);
  const result = [];
  for (const file of files) {
    const stat = await fs.stat(file); if (stat.size > 1024 * 1024) continue;
    const content = await fs.readFile(file);
    result.push({ path: path.relative(root, file), bytes: stat.size, sha256: crypto.createHash("sha256").update(content).digest("hex") });
  }
  return result;
}
async function gitStatus() { return await run("git status --short --branch"); }
async function writeState(extra = {}) { await ensure(); await fs.writeFile(stateFile, JSON.stringify({ updatedAt: new Date().toISOString(), root, ...extra }, null, 2)); }

async function main() {
  await ensure();
  const command = process.argv[3] || "inspect";
  if (command === "inspect") {
    const files = await snapshot();
    const status = await gitStatus();
    await writeState({ files: files.length });
    console.log(JSON.stringify({ ok: true, root, fileCount: files.length, files, git: status.stdout }, null, 2));
    return;
  }
  if (command === "test") { const r = await execSafe(process.argv.slice(4).join(" ") || "pnpm test"); process.exitCode = r.code; return; }
  if (command === "build") { const r = await execSafe(process.argv.slice(4).join(" ") || "pnpm build"); process.exitCode = r.code; return; }
  if (command === "lint") { const r = await execSafe(process.argv.slice(4).join(" ") || "pnpm lint"); process.exitCode = r.code; return; }
  if (command === "git") { const r = await execSafe(`git ${process.argv.slice(4).join(" ")}`); process.exitCode = r.code; return; }
  if (command === "deploy") { const cmd = process.argv.slice(4).join(" ") || process.env.W0_DEPLOY_COMMAND; if (!cmd) throw new Error("Set W0_DEPLOY_COMMAND or pass a deployment command."); const r = await execSafe(cmd); process.exitCode = r.code; return; }
  if (command === "browser") {
    const url = process.argv[4]; if (!url) throw new Error("URL required");
    const script = `import('playwright').then(async ({chromium})=>{const b=await chromium.launch({headless:true});const p=await b.newPage();await p.goto(${JSON.stringify(url)},{waitUntil:'networkidle'});console.log(JSON.stringify({title:await p.title(),url:p.url(),html:(await p.content()).slice(0,20000)}));await p.screenshot({path:${JSON.stringify(path.join(artifactDir,'browser.png'))},fullPage:true});await b.close();}).catch(e=>{console.error(e);process.exit(1)})`;
    const r = await run(`node --input-type=module -e ${JSON.stringify(script)}`); process.exitCode = r.code; return;
  }
  if (command === "workflow") {
    const planPath = process.argv[4]; if (!planPath) throw new Error("workflow JSON path required");
    const plan = JSON.parse(await fs.readFile(path.resolve(root, planPath), "utf8"));
    const results = [];
    for (const step of plan.steps || []) {
      if (!step.command) continue;
      const started = Date.now();
      try { const r = await execSafe(step.command); results.push({ id: step.id, ok: r.code === 0, code: r.code, durationMs: Date.now()-started }); if (r.code !== 0 && step.failFast !== false) break; }
      catch (e) { results.push({ id: step.id, ok:false, error:String(e) }); if (step.failFast !== false) break; }
    }
    await writeState({ workflow: plan.name || planPath, results });
    console.log(JSON.stringify({ ok: results.every(x=>x.ok), results }, null, 2));
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}
main().catch(e => { console.error(`W0 runtime error: ${e.message}`); process.exitCode = 1; });
