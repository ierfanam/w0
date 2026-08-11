#!/usr/bin/env node
import { promises as fs } from "node:fs";
import process from "node:process";

/**
 * OpenAI-compatible provider router.
 * W0_PROVIDER_ENDPOINTS is a JSON array of {id,baseUrl,apiKeyEnv,model,capabilities,priority}.
 * The router never removes provider-side quotas; it only fails over between configured providers.
 */
const root = process.argv[2] || process.cwd();
const task = process.argv[3] || "general";
const prompt = process.argv.slice(4).join(" ") || "Return a concise health response.";
const capabilityMap = {
  coding: ["coding","reasoning"],
  ui: ["vision","coding","reasoning"],
  image: ["vision"],
  research: ["web","longContext","reasoning"],
  voice: ["speech","realtime","persian"],
  general: ["reasoning"]
};
function envProviders(){
  try{return JSON.parse(process.env.W0_PROVIDER_ENDPOINTS || "[]");}
  catch(e){throw new Error(`Invalid W0_PROVIDER_ENDPOINTS JSON: ${e.message}`)}
}
function score(p,required){
  const caps=new Set(p.capabilities||[]); const matched=required.filter(x=>caps.has(x)).length;
  return matched*100-(Number(p.priority)||100);
}
function candidates(){
  const required=capabilityMap[task]||capabilityMap.general;
  return envProviders().filter(p=>p.baseUrl&&p.model&&process.env[p.apiKeyEnv||""]).sort((a,b)=>score(b,required)-score(a,required));
}
async function callProvider(p){
  const base=p.baseUrl.replace(/\/$/,"");
  const key=process.env[p.apiKeyEnv];
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),Number(process.env.W0_PROVIDER_TIMEOUT_MS||45000));
  try{
    const res=await fetch(`${base}/chat/completions`,{method:"POST",headers:{"content-type":"application/json","authorization":`Bearer ${key}`},body:JSON.stringify({model:p.model,messages:[{role:"user",content:prompt}],temperature:0.2}),signal:controller.signal});
    const text=await res.text(); if(!res.ok) throw new Error(`${res.status}: ${text.slice(0,500)}`);
    const data=JSON.parse(text); return {provider:p.id,model:p.model,content:data.choices?.[0]?.message?.content||"",usage:data.usage||null};
  } finally {clearTimeout(timer)}
}
async function main(){
  const providers=candidates(); if(!providers.length) throw new Error("No configured provider with a matching API key. Configure W0_PROVIDER_ENDPOINTS.");
  const attempts=[];
  for(const p of providers){try{const result=await callProvider(p);console.log(JSON.stringify({ok:true,task,attempts, ...result},null,2));return}catch(error){attempts.push({provider:p.id,error:String(error.message||error)})}}
  console.log(JSON.stringify({ok:false,task,attempts},null,2));process.exitCode=1;
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
