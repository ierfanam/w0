#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const tmp=await mkdtemp(path.join(os.tmpdir(),'w0-smoke-'));
try{
  await spawnAsync(process.execPath,['scripts/w0-agent-runtime.mjs',tmp,'inspect']);
  await writeFile(path.join(tmp,'workflow.json'),JSON.stringify({name:'smoke',steps:[{id:'ok',command:`node -e "console.log('w0-smoke')"`}]}));
  const workflow=await spawnAsync(process.execPath,['scripts/w0-agent-runtime.mjs',tmp,'workflow','workflow.json']);
  const output=workflow.stdout+workflow.stderr;
  if(workflow.code!==0||!output.includes('w0-smoke'))throw new Error('workflow smoke test failed');
  const tools=await spawnAsync(process.execPath,['scripts/w0-tool-host.mjs',tmp],{input:'{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n'});
  if(tools.code!==0||!tools.stdout.includes('project.inspect'))throw new Error('tool host smoke test failed');
  console.log(JSON.stringify({ok:true,tests:['inspect','workflow','tool-host']},null,2));
}finally{await rm(tmp,{recursive:true,force:true})}
function spawnAsync(cmd,args,options={}){return new Promise((resolve,reject)=>{const p=spawn(cmd,args,{cwd:path.resolve('.'),...options});let stdout='',stderr='';p.stdout.on('data',d=>stdout+=d);p.stderr.on('data',d=>stderr+=d);if(options.input){p.stdin.end(options.input)}p.on('error',reject);p.on('close',code=>resolve({code:code??1,stdout,stderr}))})}
