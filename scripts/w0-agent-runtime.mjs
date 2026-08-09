#!/usr/bin/env node
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { createLogger } from "./w0-observability.mjs";

const root = path.resolve(process.argv[2] || process.cwd());
const args = new Set(process.argv.slice(3));
const yes = args.has("--yes");
const dry = args.has("--dry-run");
const approvalFile = path.join(root, ".w0", "approvals.json");
const stateFile = path.join(root, ".w0", "runtime-state.json");
const artifactDir = path.join(root, ".w0", "artifacts");
const logger = createLogger(root);
const blocked = new Set(["rm", "rmdir", "del", "format", "shutdown", "reboot", "mkfs", "diskpart"]);
const sensitive = ["git commit", "git push", "git reset --hard", "git clean", "npm publish", "pnpm publish", "docker push", "vercel --prod"];

async function ensure(){await fs.mkdir(artifactDir,{recursive:true});}
function normalize(s){return String(s).toLowerCase().replace(/\s+/g," ").trim();}
async function run(command,options={}){const cwd=options.cwd||root;if(dry)return{code:0,stdout:`[dry-run] ${command}`,stderr:""};await logger.emit("command:start",{command,cwd});return await new Promise(resolve=>{const child=spawn(command,{cwd,shell:true,env:{...process.env,...(options.env||{})}});let stdout="",stderr="";child.stdout.on("data",d=>{stdout+=d;process.stdout.write(d)});child.stderr.on("data",d=>{stderr+=d;process.stderr.write(d)});child.on("close",code=>{const result={code:code??1,stdout,stderr};logger.emit("command:end",{command,code:result.code,stdoutTail:stdout.slice(-2000),stderrTail:stderr.slice(-2000)});resolve(result)})})}
async function approve(action){if(yes)return true;await ensure();let approvals={};try{approvals=JSON.parse(await fs.readFile(approvalFile,"utf8"))}catch{}if(approvals[action]===true)return true;process.stdout.write(`\nW0 approval required for: ${action}\nType YES to continue: `);const answer=await new Promise(resolve=>{process.stdin.setEncoding("utf8");process.stdin.once("data",d=>resolve(d.trim()))});return answer==="YES"}
function guard(command){const n=normalize(command);for(const b of blocked)if(n===b||n.startsWith(`${b} `))throw new Error(`Blocked destructive command: ${command}`)}
async function execSafe(command){guard(command);const n=normalize(command);const isSensitive=sensitive.some(x=>n.includes(x));if(isSensitive&&!(await approve(command)))throw new Error(`Approval denied: ${command}`);return run(command)}
async function walk(dir,out=[]){for(const entry of await fs.readdir(dir,{withFileTypes:true})){if([".git","node_modules",".next","dist","build",".w0"].includes(entry.name))continue;const p=path.join(dir,entry.name);if(entry.isDirectory())await walk(p,out);else out.push(p)}return out}
async function snapshot(){const files=await walk(root),result=[];for(const file of files){const stat=await fs.stat(file);if(stat.size>1024*1024)continue;const content=await fs.readFile(file);result.push({path:path.relative(root,file),bytes:stat.size,sha256:crypto.createHash("sha256").update(content).digest("hex")})}return result}
async function gitStatus(){return run("git status --short --branch")}
async function writeState(extra={}){await ensure();await fs.writeFile(stateFile,JSON.stringify({updatedAt:new Date().toISOString(),root,...extra},null,2))}
async function main(){await ensure();const command=process.argv[3]||"inspect";await logger.emit("runtime:start",{command});
 if(command==="inspect"){const files=await snapshot(),status=await gitStatus();await writeState({files:files.length});console.log(JSON.stringify({ok:true,root,fileCount:files.length,files,git:status.stdout},null,2));return}
 if(["test","build","lint"].includes(command)){const defaults={test:"pnpm test",build:"pnpm build",lint:"pnpm lint"};const r=await execSafe(process.argv.slice(4).join(" ")||defaults[command]);process.exitCode=r.code;return}
 if(command==="git"){const sub=process.argv.slice(4).join(" ");if(!sub)throw new Error("git subcommand required");const r=await execSafe(`git ${sub}`);process.exitCode=r.code;return}
 if(command==="deploy"){const cmd=process.argv.slice(4).join(" ")||process.env.W0_DEPLOY_COMMAND;if(!cmd)throw new Error("Set W0_DEPLOY_COMMAND or pass a deployment command.");const r=await execSafe(cmd);process.exitCode=r.code;return}
 if(command==="browser"){const url=process.argv[4];if(!url)throw new Error("URL required");const r=await run(`node scripts/w0-visual-qa.mjs ${JSON.stringify(root)} ${JSON.stringify(url)}`);process.exitCode=r.code;return}
 if(command==="workspace"){const op=process.argv[4]||"list";const extra=process.argv.slice(5).map(x=>JSON.stringify(x)).join(" ");const r=await run(`node scripts/w0-workspace.mjs ${JSON.stringify(root)} ${op} ${extra}`);process.exitCode=r.code;return}
 if(command==="self-heal"){const plan=process.argv[4];if(!plan)throw new Error("Self-heal plan JSON required");const r=await run(`node scripts/w0-self-heal.mjs ${JSON.stringify(root)} ${JSON.stringify(plan)}`);process.exitCode=r.code;return}
 if(command==="tools"){const r=await run(`node scripts/w0-tool-host.mjs ${JSON.stringify(root)}`);process.exitCode=r.code;return}
 if(command==="benchmark"){const manifest=process.argv[4];if(!manifest)throw new Error("Benchmark manifest required");const r=await run(`node scripts/w0-benchmark.mjs ${JSON.stringify(root)} ${JSON.stringify(manifest)}`);process.exitCode=r.code;return}
 if(command==="observability"){const r=await run(`node scripts/w0-observability.mjs ${JSON.stringify(root)} list`);process.exitCode=r.code;return}
 if(command==="workflow"){const planPath=process.argv[4];if(!planPath)throw new Error("workflow JSON path required");const plan=JSON.parse(await fs.readFile(path.resolve(root,planPath),"utf8"));const results=[];for(const step of plan.steps||[]){if(!step.command)continue;const started=Date.now();try{const r=await execSafe(step.command);results.push({id:step.id,ok:r.code===0,code:r.code,durationMs:Date.now()-started});if(r.code!==0&&step.failFast!==false)break}catch(e){results.push({id:step.id,ok:false,error:String(e)});if(step.failFast!==false)break}}await writeState({workflow:plan.name||planPath,results});console.log(JSON.stringify({ok:results.every(x=>x.ok),results},null,2));return}
 throw new Error(`Unknown command: ${command}`)}
main().catch(async e=>{await logger.emit("runtime:error",{message:String(e.message||e)});console.error(`W0 runtime error: ${e.message}`);process.exitCode=1});
