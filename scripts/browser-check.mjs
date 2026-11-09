// CI browser smoke/regression checks. Install the pinned Playwright version in ci.yml.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const server=spawn(process.execPath,['scripts/serve.mjs','--port','4173'],{stdio:'ignore'});
let browser;
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4173')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();
 let cases=0;
 for(const width of [360,390,768,1024,1440]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base='http://127.0.0.1:4173/kobun_kyotsu/';
  await page.goto(base);await page.locator('.filter-count').filter({hasText:'16章'}).waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`home overflow ${width}`);
  await page.locator('.search-open').click();await page.locator('#search-input').fill('なむ');
  await page.locator('#search-status').filter({hasText:'見つかりました'}).waitFor();
  await page.locator('.search-result').first().click();await page.waitForURL('**/06.html#section-5');
  await page.locator('.complete-btn').first().click();await page.locator('.bookmark-btn').click();await page.reload();
  assert.equal(await page.locator('.complete-btn').first().getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.bookmark-btn').getAttribute('aria-pressed'),'true');
  await page.goto(base);await page.locator('#progress-count').filter({hasText:'1'}).waitFor();
  await page.locator('[data-filter="しおり"]').click();assert.equal(await page.locator('[data-card]:visible').count(),1);
  await page.locator('.theme-toggle').click();await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  if(width<=850){await page.locator('.mobile-menu').click();await page.locator('[data-nav="04"]').click();}else{await page.locator('[data-nav="04"]').click();}
  await page.waitForURL('**/04.html');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`table overflow ${width}`);
  await page.goto(base+'lessons/16.html');await page.locator('[data-check="0"]').check();await page.reload();assert.ok(await page.locator('[data-check="0"]').isChecked());
  await page.locator('.search-open').click();await page.locator('#search-input').fill('<img src=x onerror=alert(1)>');await page.locator('#search-status').filter({hasText:'見つかりませんでした'}).waitFor();assert.equal(await page.locator('#search-results img').count(),0);
  await page.locator('#search-input').press('Escape');await page.locator('#search-dialog').waitFor({state:'hidden'});assert.equal(await page.locator('#search-dialog').isVisible(),false);
  assert.deepEqual(errors,[],`JS errors at ${width}`);await context.close();cases++;console.log(`PASS viewport ${width}: search, deep-link, saved state, filters, theme, navigation, table overflow, checklist, escaping, Escape`);
 }
 const blocked=await browser.newContext();await blocked.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError');};});
 const bp=await blocked.newPage();await bp.goto('http://127.0.0.1:4173/lessons/01.html');await bp.locator('.complete-btn').first().click();assert.equal(await bp.locator('.complete-btn').first().getAttribute('aria-pressed'),'true');assert.ok(await bp.locator('h1').isVisible());await blocked.close();cases++;
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const np=await nojs.newPage();await np.goto('http://127.0.0.1:4173/lessons/04.html');assert.ok(await np.getByRole('heading',{name:'助動詞のすべて',exact:true}).isVisible());assert.ok(await np.locator('table').count()>0);await nojs.close();cases++;
 const corrupt=await browser.newContext();await corrupt.addInitScript(()=>localStorage.setItem('kobun-kyotsu:v1','{broken'));const cp=await corrupt.newPage();await cp.goto('http://127.0.0.1:4173/');assert.equal(await cp.locator('#progress-count').innerText(),'0');await corrupt.close();cases++;
 const ac=await browser.newContext({viewport:{width:390,height:844}}),ap=await ac.newPage();
 await ap.goto('http://127.0.0.1:4173/lessons/01.html');
 await ap.locator('.account-open').click();await ap.locator('[name="uid"]').fill('alice');await ap.locator('[name="password"]').fill('password-a');await ap.locator('button[value="register"]').click();await ap.locator('#account-current').filter({hasText:'alice'}).waitFor();await ap.locator('.account-close').click();
 await ap.locator('.complete-btn').first().click();await ap.locator('.back-link').click();await ap.locator('#progress-count').filter({hasText:'1'}).waitFor();await ap.reload();await ap.locator('.account-open').filter({hasText:'alice'}).waitFor();
 await ap.locator('.account-open').click();await ap.locator('#account-logout').click();await ap.locator('#account-current').filter({hasText:'ゲスト'}).waitFor();assert.equal(await ap.locator('#progress-count').innerText(),'0');
 await ap.locator('[name="uid"]').fill('bob');await ap.locator('[name="password"]').fill('password-b');await ap.locator('button[value="register"]').click();await ap.locator('#account-current').filter({hasText:'bob'}).waitFor();assert.equal(await ap.locator('#progress-count').innerText(),'0');await ap.locator('#account-logout').click();
 await ap.locator('[name="uid"]').fill('alice');await ap.locator('[name="password"]').fill('wrong-password');await ap.locator('button[value="login"]').click();await ap.locator('#account-status').filter({hasText:'違う'}).waitFor();await ap.locator('[name="password"]').fill('password-a');await ap.locator('button[value="login"]').click();await ap.locator('#account-current').filter({hasText:'alice'}).waitFor();assert.equal(await ap.locator('#progress-count').innerText(),'1');await ac.close();cases++;console.log('PASS account registration, isolation, wrong password, login, persistence');
 console.log(`${cases} browser scenarios passed.`);
}finally{await browser?.close();server.kill();}
