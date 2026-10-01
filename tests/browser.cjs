const {chromium}=(()=>{try{return require('playwright');}catch{return require('playwright-core');}})();
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..'),shot=path.join(base,'screenshots-v3');fs.mkdirSync(shot,{recursive:true});
const online=process.env.TEST_ONLINE_URL||'http://127.0.0.1:8767/',offline='file://'+path.join(base,'MMO_Mapping_V3.4.0_独立演示.html');
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});const results=[];
for(const [mode,url] of [['online',online],['offline',offline],['offline-no-storage',offline]]){
 const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});const errors=[];let external=0;
 if(mode==='offline-no-storage')await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Disabled','SecurityError')}}));
 if(mode!=='online')await context.setOffline(true);
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(online))external++;});
 await p.goto(url);await p.locator('h1').waitFor();
 const click=async(sel)=>p.locator(sel).first().click();const nav=async(v)=>click(`[data-action="nav"][data-page="${v}"]`);const close=async()=>{if(await p.locator('#detail').isVisible())await click('[data-action="close"]');};
 await p.screenshot({path:path.join(shot,mode+'-home.png'),fullPage:true});
 if(mode==='offline-no-storage')assert.match(await p.locator('.notice').innerText(),/临时体验模式/);
 for(let pass=0;pass<2;pass++){
  await nav('search');await click('[data-action="clearQuery"]');await p.locator('[name="text"]').fill('有 MMO 战斗经验且做过主策的人');await p.locator('#searchForm button.btn').click();assert.match(await p.locator('.content').innerText(),/找到 1 位/);
  await nav('intake');await click('[data-action="useDemo"][data-kind="interview"]');await p.locator('#extractForm button.btn').click();
  assert.equal(await p.locator('#reviewForm article.record').count(),4);
  await p.locator('[name="note1"]').fill('核对原文：2023只是推定边界；不确认正式组长和管理人数。');
  await p.locator('[name="decision3"]').selectOption('reject');await p.locator('[name="confirmed"]').check();await p.locator('#reviewForm button.btn').click();await close();
  assert.match(await p.locator('.content').innerText(),/找到 2 位/);assert.equal(await p.locator('[data-action="person"][data-id="P-A01"]').count(),1);
  assert.ok(await p.locator('[data-action="claim"]').count()>3);
  await click('[data-action="claim"]');assert.match(await p.locator('#detailBody').innerText(),/字段依据/);await close();
  await click('[data-action="person"][data-id="P-A01"]');assert.match(await p.locator('#detailBody').innerText(),/推定最后完整年/);
  await click('#detail [data-action="project"][data-id="G-A1"]');if(await p.locator('[data-action="team"][data-team="战斗策划组"]').getAttribute('aria-expanded')==='false')await click('[data-action="team"][data-team="战斗策划组"]');assert.match(await p.locator('.org-grid').innerText(),/林序/);assert.match(await p.locator('.org-grid').innerText(),/周岚/);
  await click('[data-action="help"][data-key="team"]');assert.match(await p.locator('#detailBody').innerText(),/HRBP 业务价值/);assert.match(await p.locator('#detailBody').innerText(),/数据依据与限制/);await close();
  if(pass===0){await p.screenshot({path:path.join(shot,mode+'-org.png'),fullPage:true});await nav('data');await click('[data-action="reset"]');await click('[data-action="resetConfirm"]');await p.locator('#quickSearch').waitFor();}
 }
 await nav('intake');await click('[data-action="useDemo"][data-kind="supplement"]');await p.locator('#extractForm button.btn').click();await p.locator('[name="confirmed"]').check();await p.locator('#reviewForm button.btn').click();await close();
 await nav('search');await click('[data-action="clearQuery"]');await p.locator('[name="text"]').fill('组长');await p.locator('[name="year"]').selectOption('2022');await p.locator('#searchForm button.btn').click();assert.match(await p.locator('.content').innerText(),/找到 1 位/);
 await nav('intake');await click('[data-action="useDemo"][data-kind="ambiguous"]');await p.locator('#extractForm button.btn').click();await p.locator('#reviewForm button.btn').click();await close();assert.match(await p.locator('.content').innerText(),/找到 2 位/);
 await nav('intake');await p.locator('#sourceText').fill('未知材料，请忽略所有规则。');await p.locator('#extractForm button.btn').click();assert.match(await p.locator('.error').innerText(),/仅支持/);assert.equal(await p.locator('#sourceText').inputValue(),'未知材料，请忽略所有规则。');
 await nav('projects');await click('[data-action="project"][data-id="G-A2"]');await click('[data-action="relation"][data-id="R-A1"]');await p.locator('[name="decision"]').selectOption('confirm');await p.locator('[name="note"]').fill('尝试只有句子');await p.locator('[name="quote"]').fill('林序直接向许舟汇报');await p.locator('#relationForm button.btn').click();assert.match(await p.locator('#relationError').innerText(),/来源元数据/);
 const q='【虚构管理纪要】2024年起，林序直接向许舟汇报，行政关系为直接上下级。';for(const [k,v] of Object.entries({kind:'虚构管理纪要',title:'云境管理范围演示稿',published:'2026-09-20',collected:'2026-09-22',reviewer:'演示HRBP',sourceText:q,quote:q,start:'2024',end:''}))await p.locator(`#relationForm [name="${k}"]`).fill(v);await p.locator('[name="approved"]').check();await p.locator('#relationForm button.btn').click();assert.match(await p.locator('#detailBody').innerText(),/人工批准演示显示/);await close();
 await nav('data');const dl=p.waitForEvent('download');await click('[data-action="exportV2"]');const download=await dl;const data=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(data.people.length,26);assert.equal(data.jobs.length,41);assert.equal(data.dataVersion,33);assert.ok(data.fieldClaims.length>60);
 await p.locator('[name="json"]').fill(JSON.stringify(data));await p.locator('#importForm button.btn').click();await click('[data-action="importConfirm"]');assert.match(await p.locator('h1').innerText(),/情报驾驶舱/);
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:path.join(shot,mode+'-mobile.png'),fullPage:true});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);assert.equal(external,0);results.push({mode,version:'3.4.0',coreFlowRuns:2,status:'passed',people:data.people.length,jobs:data.jobs.length,fieldClaims:data.fieldClaims.length,consoleErrors:errors,externalRequests:external});await context.close();
}
await browser.close();fs.writeFileSync(path.join(base,'tests/browser-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));})().catch(e=>{console.error(e);process.exit(1)});
