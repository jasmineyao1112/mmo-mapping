const assert=require('node:assert/strict');require('./model.js');const M=globalThis.Mapping;let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name)}
function draft(db,text=M.DEMO){const d=M.extract(text,db);db.drafts.push(d);return d;}
test('待审核不进入正式检索',()=>{const db=M.seed();draft(db);assert.equal(db.people.length,2);assert.equal(M.query(db,{combat:true,chief:true}).length,1)});
test('人工确认前禁止发布',()=>{const db=M.seed();assert.throws(()=>M.publish(db,draft(db)),/人工确认/);assert.equal(db.jobs.length,3)});
test('主闭环 / 统一数据 / 证据 / 版本',()=>{const db=M.seed(),d=draft(db);d.identityConfirmed=true;const p=M.publish(db,d);assert.equal(db.people.length,3);assert.equal(db.jobs.length,5);assert.equal(M.query(db,{combat:true,chief:true}).length,2);assert.equal(db.logs[0].after.person.id,p.id);assert.equal(db.revision,1);assert.equal(db.evidence.at(-1).status,'单一来源');assert.equal(db.relationships[0].type,'同项目');assert.equal(db.relationships[0].projectId,null);assert.throws(()=>M.publish(db,d),/已处理/)});
test('JSON 持久化后保留关联',()=>{const db=M.seed(),d=draft(db);d.identityConfirmed=true;M.publish(db,d);const saved=JSON.parse(JSON.stringify(db));assert.equal(M.query(saved,{combat:true,chief:true}).length,2)});
test('拒绝标签后不命中战斗组合',()=>{const db=M.seed(),d=draft(db);d.identityConfirmed=true;d.jobs[0].capability='';M.publish(db,d);assert.equal(M.query(db,{combat:true,chief:true}).length,1)});
test('重复时间冲突不覆盖已有记录',()=>{const db=M.seed(),d=draft(db);d.identityConfirmed=true;const p=M.publish(db,d);const next=draft(db,M.DEMO+'补充。');next.personId=p.id;next.identityConfirmed=true;assert.throws(()=>M.publish(db,next),/重叠或重复/);assert.equal(db.people.length,3);assert.equal(db.jobs.length,5)});
test('同名可单独建档，不能自动合并',()=>{const db=M.seed(),d=draft(db,M.DEMO.replace('林澈','周岚'));assert.equal(d.candidates[0],'P002');assert.equal(d.identityConfirmed,false);d.personId='';d.identityConfirmed=true;M.publish(db,d);assert.equal(db.people.filter(p=>p.name==='周岚').length,2)});
test('不支持 / 未知项目 / 时间冲突被明确拒绝',()=>{const db=M.seed();assert.throws(()=>M.extract('今天好天气',db),/模拟模式/);assert.throws(()=>M.extract(M.DEMO.replace('星河战纪','未知项目'),db),/未建档/);assert.throws(()=>M.extract(M.DEMO.replace('2021至2023','2025至2023'),db),/时间/)});
test('撤销恢复正式数据并保留证据和审计',()=>{const db=M.seed(),d=draft(db);d.identityConfirmed=true;M.publish(db,d);M.undo(db);assert.equal(db.people.length,2);assert.equal(db.jobs.length,3);assert.equal(db.evidence.length,5);assert.equal(db.logs.length,2);assert.equal(db.drafts[0].status,'已撤销');assert.equal(M.query(db,{combat:true,chief:true}).length,1)});
test('空查询结果与重置',()=>{assert.equal(M.query(M.seed(),{text:'没有这个人'}).length,0);assert.equal(M.seed().revision,0)});
console.log(`${passed} domain tests passed`);
