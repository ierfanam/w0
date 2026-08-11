#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
const root=path.resolve(process.argv[2]||process.cwd());
const dir=path.join(root,".w0","memory"); const file=path.join(dir,"entries.jsonl");
await fs.mkdir(dir,{recursive:true});
async function read(){try{return (await fs.readFile(file,"utf8")).trim().split("\n").filter(Boolean).map(JSON.parse)}catch{return []}}
async function write(entry){await fs.appendFile(file,JSON.stringify(entry)+"\n")}
function tokens(s){return String(s).toLowerCase().split(/[^\p{L}\p{N}_-]+/u).filter(x=>x.length>2)}
const op=process.argv[3]||"list";
if(op==="add"){
 const text=process.argv.slice(4).join(" "); if(!text) throw new Error("memory text required");
 const entry={id:crypto.randomUUID(),createdAt:new Date().toISOString(),text,tags:[...new Set(tokens(text))].slice(0,30)}; await write(entry); console.log(JSON.stringify({ok:true,entry},null,2));
}else if(op==="search"){
 const q=tokens(process.argv.slice(4).join(" ")); const items=await read();
 const ranked=items.map(x=>({...x,score:q.filter(t=>x.tags?.includes(t)||x.text.toLowerCase().includes(t)).length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,20);
 console.log(JSON.stringify({ok:true,results:ranked},null,2));
}else{console.log(JSON.stringify({ok:true,entries:await read()},null,2))}
