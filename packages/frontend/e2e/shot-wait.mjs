import { chromium } from 'playwright';
const [,,url,out,wait='2500',mode='desktop']=process.argv;
const vp = mode==='mobile'?{width:390,height:844}:{width:1440,height:900};
const b=await chromium.launch();const ctx=await b.newContext({viewport:vp,deviceScaleFactor:2});const p=await ctx.newPage();
await p.goto(url,{waitUntil:'networkidle'}).catch(()=>{});
await p.evaluate(()=>document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in')));
await p.waitForTimeout(+wait);
await p.screenshot({path:out,fullPage:true});await b.close();console.log('shot',out);
