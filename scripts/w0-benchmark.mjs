#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||process.cwd());
const manifest=process.argv[3];
if(!manifest){console.error('Benchmark manifest required');process.exit(2)}
const input=JSON.parse(await fs.readFile(path.resolve(root,manifest),'utf8'));
const started=Date.now(); const results=[];
for(const model of input.models||[]){
  const checks=[];
  for(const test of input.tests||[]){
    const ok=typeof test.expected==='string' ? (String(test.outputByModel?.[model.id]||'').includes(test.expected)) : Boolean(test.outputByModel?.[model.id]);
    checks.push({id:test.id,ok});
  }
  const passed=checks.filter(x=>x.ok).length;
  results.push({model:model.id,passed,total:checks.length,score:checks.length?passed/checks.length:0,latencyMs:model.latencyMs||null});
}
results.sort((a,b)=>b.score-a.score||(a.latencyMs??Infinity)-(b.latencyMs??Infinity));
const report={generatedAt:new Date().toISOString(),durationMs:Date.now()-started,results,winner:results[0]?.model||null};
await fs.mkdir(path.join(root,'.w0','benchmarks'),{recursive:true});
await fs.writeFile(path.join(root,'.w0','benchmarks','latest.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
