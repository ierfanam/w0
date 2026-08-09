#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root=path.resolve(process.argv[2]||process.cwd());
const planFile=process.argv[3];
const maxCycles=Math.max(1,Math.min(Number(process.argv[4]||3),10));
if(!planFile){console.error('Plan JSON required');process.exit(2)}
const dir=path.join(root,'.w0','self-heal'); await mkdir(dir,{recursive:true});
const plan=JSON.parse(await readFile(path.resolve(root,planFile),'utf8'));
const events=[];
function run(command){return new Promise(resolve=>{const p=spawn(command,{cwd:root,shell:true,env:process.env});let stdout='',stderr='';p.stdout.on('data',d=>stdout+=d);p.stderr.on('data',d=>stderr+=d);p.on('close',code=>resolve({code:code??1,stdout,stderr}));})}
function record(type,data={}){events.push({ts:new Date().toISOString(),type,...data})}
for(let cycle=1;cycle<=maxCycles;cycle++){
  record('cycle:start',{cycle});
  const verify=await run(plan.verifyCommand||'pnpm test');
  record('verify',{cycle,code:verify.code,stdout:verify.stdout.slice(-8000),stderr:verify.stderr.slice(-8000)});
  if(verify.code===0){record('cycle:success',{cycle});break}
  if(cycle===maxCycles) break;
  const diagnostic=await run(plan.diagnoseCommand||'git diff --check');
  record('diagnose',{cycle,code:diagnostic.code,stdout:diagnostic.stdout.slice(-8000),stderr:diagnostic.stderr.slice(-8000)});
  const patch=plan.patchCommands?.[cycle-1];
  if(!patch){record('cycle:blocked',{cycle,reason:'No explicit patch command supplied'});break}
  const patchResult=await run(patch);
  record('patch',{cycle,command:patch,code:patchResult.code,stdout:patchResult.stdout.slice(-8000),stderr:patchResult.stderr.slice(-8000)});
  if(patchResult.code!==0){record('cycle:patch-failed',{cycle});break}
  record('cycle:end',{cycle});
}
const success=events.some(e=>e.type==='cycle:success');
const report={ok:success,cycles:events,generatedAt:new Date().toISOString()};
await writeFile(path.join(dir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
process.exitCode=success?0:1;
