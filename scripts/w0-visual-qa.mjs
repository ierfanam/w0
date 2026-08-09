#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] || process.cwd());
const url = process.argv[3];
const out = path.join(root, ".w0", "artifacts", "visual-qa");
if (!url) { console.error("URL required"); process.exit(2); }
await mkdir(out, { recursive: true });
const script = `import { chromium } from 'playwright';
const b=await chromium.launch({headless:true});
const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const started=Date.now();
await p.goto(${JSON.stringify(url)},{waitUntil:'networkidle',timeout:60000});
const consoleErrors=[]; p.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
const title=await p.title();
const body=await p.locator('body').innerText();
const screenshot=${JSON.stringify(path.join(out,'page.png'))};
await p.screenshot({path:screenshot,fullPage:true});
const metrics=await p.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,viewportWidth:innerWidth,viewportHeight:innerHeight,buttons:document.querySelectorAll('button').length,links:document.querySelectorAll('a').length,images:document.images.length,emptyImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).length}));
await b.close();
console.log(JSON.stringify({ok:consoleErrors.length===0,title,url,metrics,consoleErrors,durationMs:Date.now()-started,bodyPreview:body.slice(0,4000),screenshot},null,2));`;
const { spawn } = await import('node:child_process');
const child = spawn(process.execPath,['--input-type=module','-e',script],{cwd:root,stdio:['ignore','pipe','pipe']});
let stdout='',stderr=''; child.stdout.on('data',d=>stdout+=d); child.stderr.on('data',d=>stderr+=d);
await new Promise(resolve=>child.on('close',resolve));
if (stderr) console.error(stderr);
let result; try { result=JSON.parse(stdout); } catch { result={ok:false,error:'Playwright output was not JSON',raw:stdout}; }
await writeFile(path.join(out,'report.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
process.exitCode=result.ok?0:1;
