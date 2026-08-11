#!/usr/bin/env node
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
const root=path.resolve(process.argv[2]||process.cwd()); const goal=process.argv.slice(3).join(" ")||"Inspect, test, repair and build this project.";
const out=path.join(root,".w0","autopilot"); await fs.mkdir(out,{recursive:true});
function run(cmd,args=[]){return new Promise(resolve=>{const p=spawn(cmd,args,{cwd:root,shell:false,env:process.env});let stdout="",stderr="";p.stdout.on("data",d=>stdout+=d);p.stderr.on("data",d=>stderr+=d);p.on("close",code=>resolve({code:code??1,stdout,stderr}))})}
async function step(id,cmd,args=[]){const started=Date.now();const r=await run(cmd,args);const result={id,command:[cmd,...args].join(" "),ok:r.code===0,code:r.code,durationMs:Date.now()-started,stdout:r.stdout.slice(-12000),stderr:r.stderr.slice(-12000)};await fs.writeFile(path.join(out,`${id}.json`),JSON.stringify(result,null,2));return result}
const results=[];
results.push(await step("inspect","node",["scripts/w0-agent-runtime.mjs",".","inspect"]));
results.push(await step("memory","node",["scripts/w0-memory.mjs",".","add",`Autopilot goal: ${goal}`]));
results.push(await step("lint","node",["scripts/w0-agent-runtime.mjs",".","lint"]));
results.push(await step("test","node",["scripts/w0-agent-runtime.mjs",".","test"]));
if(!results.at(-1).ok){
 results.push(await step("self-heal","node",["scripts/w0-self-heal.mjs",".",JSON.stringify({name:"autopilot-repair",maxCycles:2,steps:[{id:"test",command:"pnpm test",failFast:false},{id:"lint",command:"pnpm lint",failFast:false}]}))]);
 results.push(await step("retest","node",["scripts/w0-agent-runtime.mjs",".","test"]));
}
results.push(await step("visual","node",["scripts/w0-visual-qa.mjs",".",process.env.W0_VISUAL_QA_URL||"about:blank"]));
results.push(await step("build","node",["scripts/w0-agent-runtime.mjs",".","build"]));
results.push(await step("git-status","node",["scripts/w0-agent-runtime.mjs",".","git","status","--short","--branch"]));
const ok=results.every(r=>r.ok||["visual","memory"].includes(r.id));
const report={ok,goal,generatedAt:new Date().toISOString(),results}; await fs.writeFile(path.join(out,"report.json"),JSON.stringify(report,null,2)); console.log(JSON.stringify(report,null,2)); process.exitCode=ok?0:1;
