import { chromium } from 'playwright';
const LANG=process.argv[2]||'en'; const MODE=process.argv[3]||'preview';
const fsp=await import('fs');
const coords=JSON.parse(fsp.readFileSync(new URL('./coords'+(LANG==='en'?'':'_'+LANG)+'.json',import.meta.url)));
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1});
await ctx.addInitScript(c=>{window.__COORDS=c;},coords);
const page=await ctx.newPage();
page.on('pageerror',e=>console.log('PAGEERR',e.message));
await page.goto('file://'+new URL('./film_lang.html',import.meta.url).pathname+'?lang='+LANG,{waitUntil:'load'});
await page.waitForFunction('window.ready===true',{timeout:25000}).catch(()=>console.log('ready timeout'));
await page.waitForTimeout(500);
if(MODE==='preview'){
  const times=[1.5,4.2,7.5,15.0,22.1,26.6,34.8,39.9,45.5,52.6,60.8,67.5];
  let i=0;
  for(const t of times){ await page.evaluate(tt=>window.seek(tt),t); await page.waitForTimeout(120); await page.screenshot({path:`prev_${LANG}_${String(i).padStart(2,'0')}_t${t}.png`}); i++; }
  console.log('preview',LANG,'done');
} else {
  const FPS=30, DUR=68.5, N=Math.round(FPS*DUR);
  const fs=await import('fs'); const dir='frames_'+LANG; fs.mkdirSync(dir,{recursive:true});
  const t0=Date.now();
  for(let f=0;f<N;f++){ await page.evaluate(tt=>window.seek(tt),f/FPS);
    await page.evaluate(async()=>{const a=[document.getElementById('limg'),document.getElementById('pimg')];for(const im of a){if(im&&im.getAttribute('src')&&!im.complete){try{await im.decode()}catch(e){}}}});
    await page.screenshot({path:`${dir}/${String(f).padStart(4,'0')}.png`});
    if(f%200===0) console.log(LANG,'frame',f,'/',N,((Date.now()-t0)/1000).toFixed(0)+'s'); }
  console.log('RENDER_DONE',LANG,N);
}
await b.close();
