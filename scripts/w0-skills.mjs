#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
const root=path.resolve(process.argv[2]||process.cwd()); const dir=path.join(root,".w0","skills"); const registry=path.join(dir,"registry.json"); await fs.mkdir(dir,{recursive:true});
async function load(){try{return JSON.parse(await fs.readFile(registry,"utf8"))}catch{return {skills:[]}}}
const op=process.argv[3]||"list";
if(op==="install"){
 const manifest=JSON.parse(await fs.readFile(path.resolve(root,process.argv[4]),"utf8"));
 if(!manifest.id||!manifest.version||!manifest.entry) throw new Error("Skill manifest requires id, version and entry");
 const data=await load(); data.skills=data.skills.filter(x=>x.id!==manifest.id); data.skills.push({...manifest,installedAt:new Date().toISOString()}); await fs.writeFile(registry,JSON.stringify(data,null,2)); console.log(JSON.stringify({ok:true,skill:manifest},null,2));
}else if(op==="remove"){
 const id=process.argv[4]; const data=await load(); data.skills=data.skills.filter(x=>x.id!==id); await fs.writeFile(registry,JSON.stringify(data,null,2)); console.log(JSON.stringify({ok:true,id},null,2));
}else console.log(JSON.stringify({ok:true,...await load()},null,2));
