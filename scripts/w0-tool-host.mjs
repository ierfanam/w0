#!/usr/bin/env node
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import path from 'node:path';

const root=path.resolve(process.argv[2]||process.cwd());
const allow=new Map([
 ['project.inspect',()=>spawn(process.execPath,['scripts/w0-agent-runtime.mjs',root,'inspect'],{cwd:root})],
 ['project.test',()=>spawn(process.execPath,['scripts/w0-agent-runtime.mjs',root,'test'],{cwd:root})],
 ['project.build',()=>spawn(process.execPath,['scripts/w0-agent-runtime.mjs',root,'build'],{cwd:root})],
 ['project.lint',()=>spawn(process.execPath,['scripts/w0-agent-runtime.mjs',root,'lint'],{cwd:root})],
 ['git.status',()=>spawn('git',['status','--short','--branch'],{cwd:root})],
]);
function execute(name){return new Promise((resolve,reject)=>{const factory=allow.get(name);if(!factory)return reject(new Error(`Tool not allowed: ${name}`));const p=factory();let stdout='',stderr='';p.stdout.on('data',d=>stdout+=d);p.stderr.on('data',d=>stderr+=d);p.on('error',reject);p.on('close',code=>resolve({code:code??1,stdout,stderr}));})}
const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
for await(const line of rl){if(!line.trim())continue;let req;try{req=JSON.parse(line)}catch{console.log(JSON.stringify({jsonrpc:'2.0',error:{code:-32700,message:'Invalid JSON'}}));continue}
 try{if(req.method==='tools/list'){console.log(JSON.stringify({jsonrpc:'2.0',id:req.id,result:{tools:[...allow.keys()].map(name=>({name,inputSchema:{type:'object'}}))}}));continue} if(req.method!=='tools/call'){throw new Error(`Unsupported method: ${req.method}`)} const name=req.params?.name;const result=await execute(name);console.log(JSON.stringify({jsonrpc:'2.0',id:req.id,result:{isError:result.code!==0,content:[{type:'text',text:result.stdout||result.stderr||''}],exitCode:result.code}}));}catch(e){console.log(JSON.stringify({jsonrpc:'2.0',id:req.id,error:{code:-32000,message:String(e.message||e)}}))}}
