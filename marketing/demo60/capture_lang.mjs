import { chromium } from 'playwright'; import fs from 'fs';
const LANG=process.argv[2]||'ar';
const WEB='http://localhost:5173'; const WID='4796f89c-9180-42aa-bcd2-cf576d5bb766'; const NEWIMG='/Users/yousef/Desktop/mumotor/packages/frontend/public/img/hero-drive.jpg';
const DIR=new URL('./shots_'+LANG+'/', import.meta.url).pathname;
fs.mkdirSync(DIR,{recursive:true});
const CF=new URL('./coords_'+LANG+'.json', import.meta.url).pathname;
const coords={};
const HEADLINE={ar:'انجح من أول مرة، في كل مرة',he:'תעבור בפעם הראשונה, בכל פעם',en:'Pass first time, every time'}[LANG];
const NAME={ar:'مايا خليل',he:'מאיה לוי',en:'Maya Levi'}[LANG];
const BIZ={ar:'مدرسة الطريق للقيادة',he:'בית הספר לנהיגה של אלי',en:"Eli's Driving School"}[LANG];
const b=await chromium.launch();
const ctr=async(l)=>{try{const bb=await l.boundingBox();return bb?{x:Math.round(bb.x+bb.width/2),y:Math.round(bb.y+bb.height/2)}:null;}catch(e){return null;}};
const S=async(p,n,o={})=>{await p.screenshot({path:DIR+n+'.png',...o});};

// ===== DESKTOP =====
const d=await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2});
await d.addInitScript((L)=>localStorage.setItem('mumotor_lang',L),LANG);
const p=await d.newPage();
await p.goto(`${WEB}/login`,{waitUntil:'networkidle'});
await p.fill('input[type=email]','teacher@mumotor.local'); await p.fill('input[type=password]','password123');
await p.click('button:has-text("Sign in"),button:has-text("تسجيل"),button:has-text("התחבר")').catch(async()=>{await p.locator('button[type=submit]').click();});
await p.waitForURL('**/dashboard').catch(()=>{}); await p.waitForTimeout(800);

// wizard
await p.goto(`${WEB}/builder`,{waitUntil:'networkidle'}); await p.waitForTimeout(500);
const start=p.locator('button,a').filter({hasText:/Start building|ابدأ|התחל/}).first();
if(await start.count()){ await start.click().catch(()=>{}); await p.waitForTimeout(800); }
await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(300);
const nameF=p.locator('input').first(), descF=p.locator('textarea').first(), tagF=p.locator('input').nth(1);
coords.wizard_name=await ctr(nameF); coords.wizard_desc=await ctr(descF); coords.wizard_tag=await ctr(tagF);
await S(p,'wz_0');
await nameF.fill(BIZ); await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(200); await S(p,'wz_1');
await descF.fill(LANG==='ar'?'دروس فردية هادئة بنسبة نجاح 96% من أول مرة.':LANG==='he'?'שיעורים אישיים ורגועים עם 96% הצלחה בפעם הראשונה.':'Calm one-to-one lessons with a 96% first-time pass rate.'); await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(200); await S(p,'wz_2');
await tagF.fill(LANG==='ar'?'طريقك إلى الثقة':LANG==='he'?'הדרך שלך לביטחון':'Your road to confidence'); await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(200); await S(p,'wz_3');
console.log('wizard done', JSON.stringify(coords.wizard_name));

// templates flip (localized via TemplatePreview)
for(const [slug,nm] of [['mumotor','t_mumotor'],['bezel','t_bezel'],['solari','t_solari'],['reel','t_reel'],['gilt','t_gilt'],['open-road','t_openroad'],['gallery','t_gallery']]){
  await p.goto(`${WEB}/templates/${slug}`,{waitUntil:'networkidle'}); await p.waitForSelector('[class^="tmpl-"]'); await p.waitForTimeout(900); await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(300);
  await S(p,nm+'_hero'); }
// switcher coords from gallery preview
const cand=await p.locator('button,a').evaluateAll(els=>els.map(e=>({t:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,14),r:e.getBoundingClientRect()})).filter(o=>o.r.top>760&&o.r.width>0).map(o=>({t:o.t,x:Math.round(o.r.left+o.r.width/2),y:Math.round(o.r.top+o.r.height/2)})));
coords._switcher=cand; coords.use_this=await ctr(p.locator('button,a').filter({hasText:/Use this|استخدم|بحر|בחر|השתמש/}).first());
console.log('switcher', JSON.stringify(cand));

// customize
await p.goto(`${WEB}/customize/${WID}`,{waitUntil:'networkidle'}); await p.waitForTimeout(1600);
coords.cz_headline=await ctr(p.locator('[data-edit="hero.headline"]').first());
coords.cz_hero_img=await ctr(p.locator('[data-edit="hero.image"]').first());
const tb=await p.locator('header button, [class*="toolbar"] button, button').evaluateAll(els=>els.map(e=>({t:(e.innerText||'').trim().slice(0,10),r:e.getBoundingClientRect()})).filter(o=>o.r.top<70&&o.r.width>0).map(o=>({t:o.t,x:Math.round(o.r.left+o.r.width/2),y:Math.round(o.r.top+o.r.height/2)})));
coords._toolbar=tb;
await S(p,'cz_orig');
const hl=p.locator('[data-edit="hero.headline"]').first(); await hl.click(); await p.waitForTimeout(450); await S(p,'cz_text_editing');
await hl.evaluate(el=>{el.focus();const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r);}); await p.waitForTimeout(150);
await p.keyboard.type(HEADLINE,{delay:18}); await p.waitForTimeout(400); await p.mouse.click(250,470); await p.waitForTimeout(500); await S(p,'cz_text_new');
const img=p.locator('[data-edit="hero.image"]').first(); await p.evaluate(()=>scrollTo(0,0)); await img.click(); await p.waitForTimeout(600); await S(p,'cz_img_picker');
const fi=p.locator('input[type=file]').first(); if(await fi.count()){await fi.setInputFiles(NEWIMG).catch(()=>{}); await p.waitForTimeout(2800);}
await p.mouse.click(250,470); await p.waitForTimeout(600); await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(300); await S(p,'cz_img_new');
console.log('customize done', JSON.stringify(coords.cz_headline), JSON.stringify(tb));

// publishing + code
await p.goto(`${WEB}/dashboard/publishing`,{waitUntil:'networkidle'}); await p.waitForTimeout(900);
coords.pub_visit=await ctr(p.locator('a,button').filter({hasText:/Visit|زيارة|צפه|ביקור(?!ות)/}).first()); await S(p,'dash_publishing');
await p.goto(`${WEB}/dashboard/driving-school`,{waitUntil:'networkidle'}); await p.waitForTimeout(900);
coords.copy_code=await ctr(p.locator('button').filter({hasText:/Copy|نسخ|העתק/}).first());
const CODE=await p.evaluate(()=>{const m=document.body.innerText.match(/\b[A-Z0-9]{6}\b/);return m?m[0]:'130FF6';});
await S(p,'dash_code'); console.log('code',CODE);

// live sections
await p.goto(`${WEB}/p/davids-driving`,{waitUntil:'networkidle'}); await p.waitForTimeout(1400);
const secs=await p.evaluate(()=>[...document.querySelectorAll('main section, section')].map(e=>({top:Math.round(e.getBoundingClientRect().top+scrollY),h:Math.round(e.getBoundingClientRect().height),id:e.id||e.className.slice(0,14)})).filter(o=>o.h>200));
for(let i=0;i<secs.length;i++){ await p.evaluate(y=>scrollTo(0,y-30),secs[i].top); await p.waitForTimeout(600); await S(p,'sec_'+i); }
console.log('sections',secs.length);
await d.close();

// ===== PHONE =====
const pc=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:3});
await pc.addInitScript((L)=>localStorage.setItem('mumotor_lang',L),LANG);
const ph=await pc.newPage();
await ph.goto(`${WEB}/p/davids-driving/enroll`,{waitUntil:'networkidle'}); await ph.waitForTimeout(900);
coords.ph_enroll=await ctr(ph.locator('button').filter({hasText:/Enroll|سجّل|تسجيل|הרשמ/}).first()); await S(ph,'ph_enroll');
await ph.locator('input').nth(0).fill(NAME);
await ph.locator('input').nth(1).fill('maya'+Date.now()+'@example.com');
await ph.locator('input').nth(2).fill('+972 50 123 4567');
await ph.locator('input').nth(3).fill(CODE);
await S(ph,'ph_enroll_filled');
await ph.locator('button').filter({hasText:/Enroll|سجّل|تسجيل|הרשמ/}).first().click(); await ph.waitForTimeout(1800);
coords.ph_book=await ctr(ph.locator('a,button').filter({hasText:/Book a lesson|احجز|قبل|קבע|הזמנ/}).first()); await S(ph,'ph_enrolled');
await ph.locator('a,button').filter({hasText:/Book a lesson|احجز|قبل|קבע|הזמנ/}).first().click().catch(()=>{}); await ph.waitForTimeout(1600);
coords.ph_slot=await ctr(ph.locator('button').filter({hasText:/:/}).first()); await S(ph,'ph_book');
await ph.locator('button').filter({hasText:/:/}).first().click().catch(()=>{}); await ph.waitForTimeout(700);
coords.ph_confirm=await ctr(ph.locator('button').filter({hasText:/Book|Confirm|احجز|تأكيد|قبل|קבע|אשר|הזמנ|אישור/}).last()); await S(ph,'ph_book_slot');
await ph.locator('button').filter({hasText:/Book|Confirm|احجز|تأكيد|قبل|קבע|אשר|הזמנ|אישור/}).last().click().catch(()=>{}); await ph.waitForTimeout(1800); await S(ph,'ph_booked');
await pc.close(); await b.close();
fs.writeFileSync(CF,JSON.stringify(coords,null,2));
console.log('DONE',LANG,'coords keys',Object.keys(coords).length);
