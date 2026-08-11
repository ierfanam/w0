#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
const root=path.resolve(process.argv[2]||process.cwd());
const tools=[
 {name:"w0.inspect",description:"Inspect project files and Git status",inputSchema:{type:"object",properties:{},additionalProperties:false}},
 {name:"w0.memory.search",description:"Search project memory",inputSchema:{type:"object",properties:{query:{type:"string"}},required:["query"],additionalProperties:false}},
 {name:"w0.git.status",description:"Read Git status",inputSchema:{type:"object",properties:{},additionalProperties:false}}
];
async function run(command,args=[]){return await new Promise(resolve=>{const {spawn}=await import("node:child_process");const p=spawn(command,args,{cwd:root});let o="",e="";p.stdout.on("data",d=>o+=d);p.stderr.on("data",d=>e+=d);p.on("close",code=>resolve({code,stdout:o,stderr:e}))})}
async function handle(req){
 if(req.method==="initialize") return {jsonrpc:"2.0",id:req.id,result:{protocolVersion:"2024-11-05",capabilities:{tools:{}},serverInfo:{name:"w0-mcp",version:"1.0.0"}}};
 if(req.method==="notifications/initialized") return null;
 if(req.method==="tools/list") return {jsonrpc:"2.0",id:req.id,result:{tools}};
 if(req.method!=="tools/call") return {jsonrpc:"2.0",id:req.id,error:{code:-32601,message:"Method not found"}};
 const name=req.params?.name; let result;
 if(name==="w0.inspect") result=await run("node",["scripts/w0-agent-runtime.mjs",".","inspect"]);
 else if(name==="w0.git.status") result=await run("git",["status","--short","--branch"]);
 else if(name==="w0.memory.search") result=await run("node",["scripts/w0-memory.mjs",".","search",String(req.params?.arguments?.query||"")]);
 else return {jsonrpc:"2.0",id:req.id,error:{code:-32602,message:"Unknown tool"}};
 return {jsonrpc:"2.0",id:req.id,result:{content:[{type:"text",text:result.stdout||result.stderr}],isError:result.code!==0}};
}
let buffer="";process.stdin.setEncoding("utf8");process.stdin.on("data",chunk=>{buffer+=chunk;let lines=buffer.split("\n");buffer=lines.pop()||"";for(const line of lines){if(!line.trim())continue;try{const req=JSON.parse(line);Promise.resolve(handle(req)).then(r=>{if(r)process.stdout.write(JSON.stringify(r)+"\n")}).catch(e=>process.stdout.write(JSON.stringify({jsonrpc:"2.0",id:req.id,error:{code:-32000,message:String(e.message||e)}})+"\n"))}catch(e){process.stdout.write(JSON.stringify({jsonrpc:"2.0",id:null,error:{code:-32700,message:"Parse error"}})+"\n")}}});
