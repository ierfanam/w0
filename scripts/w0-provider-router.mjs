#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());
const configPath = path.join(root, ".w0", "providers.json");
const statePath = path.join(root, ".w0", "provider-health.json");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function readJson(file, fallback) { try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return fallback; } }
async function writeJson(file, value) { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, JSON.stringify(value, null, 2)); }
function env(name, fallback = "") { return process.env[name] || fallback; }

async function loadProviders() {
  const cfg = await readJson(configPath, { providers: [] });
  return (cfg.providers || []).filter(p => p.enabled !== false && p.baseUrl && (p.public === true || p.apiKeyEnv));
}

async function health() {
  const providers = await loadProviders();
  const state = await readJson(statePath, {});
  return providers.map(p => ({ id:p.id, name:p.name || p.id, capabilities:p.capabilities || [], score:Number(state[p.id]?.score ?? p.score ?? 50), failures:Number(state[p.id]?.failures || 0), cooldownUntil:state[p.id]?.cooldownUntil || null }));
}

function eligible(p, required) { const caps = new Set(p.capabilities || []); return required.every(c => caps.has(c)); }
function ranked(list, required) {
  const now = Date.now();
  return list.filter(p => eligible(p, required)).filter(p => !p.cooldownUntil || new Date(p.cooldownUntil).getTime() <= now).sort((a,b) => b.score-a.score);
}

async function record(id, ok, latencyMs, error = "") {
  const state = await readJson(statePath, {}); const s = state[id] || {score:50, failures:0, successes:0};
  if (ok) { s.successes++; s.failures=0; s.score=Math.min(100,s.score+Math.max(1,Math.round(8-latencyMs/1000))); s.cooldownUntil=null; }
  else { s.failures++; s.score=Math.max(0,s.score-Math.min(30,8*s.failures)); if(s.failures>=3)s.cooldownUntil=new Date(Date.now()+Math.min(300000,s.failures*15000)).toISOString(); s.lastError=String(error).slice(0,1000); }
  s.lastLatencyMs=latencyMs; s.updatedAt=new Date().toISOString(); state[id]=s; await writeJson(statePath,state);
}

async function callProvider(p, payload) {
  const started=Date.now(); const key=p.apiKeyEnv ? env(p.apiKeyEnv) : "";
  const headers={"content-type":"application/json",...(p.headers||{})}; if(key)headers.authorization=`Bearer ${key}`;
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),Number(p.timeoutMs||45000));
  try {
    const response=await fetch(p.baseUrl.replace(/\/$/,"")+"/chat/completions",{method:"POST",headers,body:JSON.stringify(payload),signal:controller.signal});
    const text=await response.text(); let body; try{body=JSON.parse(text)}catch{body={raw:text}}; const latency=Date.now()-started;
    if(!response.ok){const e=new Error(`${p.id}: HTTP ${response.status}`);e.status=response.status;e.retryable=[408,409,425,429,500,502,503,504].includes(response.status);e.body=body;await record(p.id,false,latency,e.message);throw e;}
    await record(p.id,true,latency); return {provider:p.id,latencyMs:latency,data:body};
  } catch(e) { if(!e.body)await record(p.id,false,Date.now()-started,e.message); throw e; } finally { clearTimeout(timer); }
}

async function route(payload, required=[]) {
  const candidates=ranked(await health(),required); if(!candidates.length)throw new Error(`No eligible configured provider for: ${required.join(",")||"none"}`);
  const attempts=[];
  for(const p of candidates){try{const result=await callProvider(p,payload);attempts.push({provider:p.id,ok:true,latencyMs:result.latencyMs});return {...result,attempts};}catch(e){attempts.push({provider:p.id,ok:false,status:e.status||null,retryable:e.retryable!==false,error:String(e.message||e)});if(e.retryable===false)break;await sleep(100);}}
  throw new Error(`All eligible providers failed: ${JSON.stringify(attempts)}`);
}

async function main(){const command=process.argv[3]||"health";if(command==="health"){console.log(JSON.stringify(await health(),null,2));return;}if(command==="route"){const payload=JSON.parse(await fs.readFile(path.resolve(root,process.argv[4]),"utf8"));console.log(JSON.stringify(await route(payload,process.argv.slice(5)),null,2));return;}throw new Error(`Unknown command: ${command}`)}
main().catch(e=>{console.error(e.message);process.exitCode=1});
