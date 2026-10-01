const {test}=require('node:test'),a=require('node:assert/strict');
require('./load-current.cjs');
const M=globalThis.Mapping;

const FACT_KEYS=['jobs','fieldClaims','relationships','capabilities','people'];
const facts=db=>JSON.stringify(Object.fromEntries(FACT_KEYS.map(k=>[k,db[k]])));
const publish=(db)=>{const d=M.extract(M.DEMO,db);d.identityConfirmed=true;db.drafts.push(d);M.publish(db,d);return d;};
const cell=(db,pid,domain)=>M.bench(db).find(r=>r.project.id===pid).cells.find(c=>c.domain===domain);
const layer=(py,rank)=>py.find(x=>x.rank===rank);
const ids=list=>list.map(x=>x.id);
// 依次调用全部派生分析，用于副作用检查。
function runAll(db){
 const out=[M.bench(db),M.singlePoints(db),M.coverage(db),M.pyramid(db),M.concurrentJobs(db),M.homonyms(db),M.secondhandSources(db),M.orgDiagnosis(db),M.playbook(db)];
 for(const p of db.people)out.push(M.persona(db,p.id));
 return out;
}
// 递归收集对象里的全部字符串，用于红线正则扫描。
function strings(o,acc=[]){
 if(typeof o==='string')acc.push(o);
 else if(Array.isArray(o))for(const v of o)strings(v,acc);
 else if(o&&typeof o==='object')for(const [k,v] of Object.entries(o)){acc.push(k);strings(v,acc);}
 return acc;
}
/* 手工追加一段「已发布任职 + 已发布能力」。复用已有 J-D11 / E-J-D11 的结构与元数据，
   引文即证据原文本身，因此一定能在原文中定位；写入后调用 buildClaims 重建字段主张。 */
function addPublishedLead(db,{id,personId,projectId,domain,scope='带领小组 / 模块',role='系统策划组长',start=2024,end=2025}){
 const eid='E-'+id,p=db.people.find(x=>x.id===personId),g=db.projects.find(x=>x.id===projectId);
 const text=`【虚构测试材料】${p.name}（人员ID ${personId}）于${start}—${end}年在《${g.name}》担任${role}，责任范围为${scope}，负责${domain}方向。`;
 const job={...M.clone(db.jobs.find(j=>j.id==='J-D11')),id,personId,projectId,role,rawRole:role,start,end,module:domain,scope,evidenceIds:[eid],roleHistory:[]};
 delete job.pathology;
 db.jobs.push(job);
 db.evidence.push({...M.clone(db.evidence.find(e=>e.id==='E-J-D11')),id:eid,text,claims:[{objectId:id,personId,projectId,role,start,end,module:domain,scope,quote:text}]});
 db.capabilities.push({id:'CAP-'+id,jobId:id,domain,details:[domain],scope,scenario:g.genre,evidenceIds:[eid],quote:text,factStatus:M.SINGLE,processStatus:'已发布'});
 M.buildClaims(db);
 M.validateDatabase(db);
 return job;
}

test('V3.3 组织层样本：能力域由4扩到7，新增云澜互娱与《沧溟》系列8人',()=>{
 const db=M.seed();M.validateDatabase(db);
 a.equal(M.VERSION,'3.4.0');
 a.deepEqual(M.EXTRA_DOMAINS,['关卡与副本','商业化与付费','玩法与系统']);
 a.equal(M.DOMAINS.length,7);
 a.deepEqual(M.DOMAINS.slice(0,4),['战斗体系','经济系统','世界与内容','社交与帮会']);
 a.deepEqual(M.DOMAINS.slice(4),M.EXTRA_DOMAINS);
 a.equal(new Set(M.DOMAINS).size,7);
 a.deepEqual(Object.keys(M.PATHOLOGY).sort(),['boomerang','concurrent','homonym','inflation','secondhand','vendor']);
 a.equal(M.PATHOLOGY.homonym,'同名不同人');
 a.equal(db.companies.find(c=>c.id==='C-D').name,'云澜互娱');
 const g1=db.projects.find(p=>p.id==='G-D1'),g2=db.projects.find(p=>p.id==='G-D2');
 a.equal(g1.name,'沧溟');a.match(g1.alias,/项目 O/);a.equal(g1.companyId,'C-D');
 a.equal(g2.name,'沧溟·归乡');a.equal(g2.companyId,'C-D');
 a.deepEqual([['P-D01','罗砚'],['P-D02','裴安'],['P-D03','岑野'],['P-D04','温叙'],['P-D05','卫楚'],['P-D06','卫楚'],['P-D07','尉迟朗'],['P-D08','阮清']]
  .map(([id])=>db.people.find(p=>p.id===id).name),['罗砚','裴安','岑野','温叙','卫楚','卫楚','尉迟朗','阮清']);
 // 新增项目也必须进入全部结构指标的分母。
 a.deepEqual(M.bench(db).map(r=>r.project.id).filter(id=>id.startsWith('G-D')),['G-D1','G-D2']);
 for(const r of M.bench(db))a.deepEqual(r.cells.map(c=>c.domain),M.DOMAINS);
});

test('派生层只读：跑完全部分析后事实与查询逐字节不变',()=>{
 const db=M.seed(),before=facts(db),whole=JSON.stringify(db);
 const queries=[{},{combat:true,chief:true},{capability:'关卡与副本'},{capability:'商业化与付费'},{company:'C-D'},{project:'G-D1'},{project:'G-D2',year:2025}];
 const q0=queries.map(q=>JSON.stringify(M.queryMatches(db,q)));
 runAll(db);runAll(db);
 a.equal(facts(db),before);
 a.equal(JSON.stringify(db),whole);
 a.deepEqual(queries.map(q=>JSON.stringify(M.queryMatches(db,q))),q0);
 // 输出必须是可序列化纯数据，不含函数或循环引用。
 for(const out of runAll(db))a.deepEqual(JSON.parse(JSON.stringify(out)),out);
 a.equal(JSON.stringify(db),whole);
 // 待审提案同样不得渗入派生层。
 const snapshot=JSON.stringify(runAll(db));
 db.drafts.push(M.extract(M.DEMO,db));
 a.equal(JSON.stringify(runAll(db)),snapshot);
});

test('只用已发布事实：待核验任职 J-D01 / J-D07 不进入任何分析结果',()=>{
 const db=M.seed();
 for(const jid of ['J-D01','J-D07']){
  const j=db.jobs.find(x=>x.id===jid);
  a.equal(j.processStatus,'待核验');
  a.ok(!M.publishedJobs(db).some(x=>x.id===jid));
  a.ok(!db.capabilities.some(c=>c.jobId===jid));
 }
 // bench / pyramid / concurrentJobs 只按项目与人员聚合，这两位只有待核验任职，不得出现在任何格子或层级里。
 const scan=JSON.stringify([M.bench(db),M.pyramid(db),M.concurrentJobs(db)]);
 for(const token of ['J-D01','J-D07','P-D01','P-D04'])a.ok(!scan.includes(token),token);
 // persona 只允许把待核验任职放进 pendingJobs 这一处，其余字段一律不得引用。
 for(const p of db.people){
  const {pendingJobs,person,personId,...derived}=M.persona(db,p.id);
  const text=JSON.stringify(derived);
  for(const token of ['J-D01','J-D07'])a.ok(!text.includes(token),token+' @ '+p.id);
 }
 for(const p of db.people){
  const pe=M.persona(db,p.id);
  const jobIds=[...pe.domains.flatMap(d=>d.jobIds),...(pe.growth?pe.growth.jobIds:[])];
  a.ok(!jobIds.includes('J-D01'));a.ok(!jobIds.includes('J-D07'));
  a.ok(jobIds.every(id=>M.publishedJobs(db).some(j=>j.id===id&&j.personId===p.id)));
 }
 const luo=M.persona(db,'P-D01');
 a.equal(luo.jobCount,0);a.deepEqual(luo.pendingJobs,['J-D01']);
 a.deepEqual(luo.domains,[]);a.equal(luo.shape,'尚无能力职责证据');
 a.equal(luo.companyCount,0);a.equal(luo.growth,null);a.equal(luo.tenure,null);
 a.ok(luo.limits.some(l=>l.includes('库内没有已发布任职')));
 a.ok(luo.limits.some(l=>l.includes('待核验任职未计入画像')));
 const wen=M.persona(db,'P-D04');
 a.equal(wen.jobCount,0);a.deepEqual(wen.pendingJobs,['J-D07']);
 // 职级冲突的自述来源可见，但不会把待核验任职升级为事实。
 a.ok(M.secondhandSources(db).some(s=>s.evidenceId==='E-D01B'&&s.jobIds.includes('J-D01')));
 a.ok(!M.pyramid(db).some(l=>l.personIds.includes('P-D01')));
});

test('persona：成长间隔、跨公司回流、平均任期与恒定的意向未知声明',()=>{
 const db=M.seed();
 // 阮清 2021 参与 → 2023 带组，间隔 2 年。
 const ruan=M.persona(db,'P-D08');
 a.deepEqual(ruan.growth,{fromYear:2021,toYear:2023,years:2,fromScope:'参与',toScope:'带领小组 / 模块',jobIds:['J-D11','J-D12']});
 a.equal(ruan.growth.toYear-ruan.growth.fromYear,2);
 a.equal(ruan.domains[0].topScope,'领域负责');
 // 平均任期只按已结束任职计算，且任职时间精度为年。
 const closed=db.jobs.filter(j=>j.personId==='P-D08'&&j.processStatus==='已发布'&&j.end!==null);
 a.deepEqual(ids(closed),['J-D11','J-D12']);
 a.deepEqual(ruan.tenure,{closed:2,avgYears:+(closed.reduce((s,j)=>s+(j.end-j.start+1),0)/closed.length).toFixed(1)});
 a.equal(ruan.tenure.avgYears,2);
 a.equal(ruan.jobCount,3);
 a.ok(db.jobs.filter(j=>j.personId==='P-D08').every(j=>j.precision==='年'));
 a.ok(ruan.limits.some(l=>l.includes('结束时间未知只代表最近已知')));
 // 顾航没有 rank1（参与）证据，成长链条不成立，不得编造起点。
 const gu=M.persona(db,'P-A07');
 a.equal(gu.growth,null);
 const guRanks=M.publishedJobs(db).filter(j=>j.personId==='P-A07').flatMap(j=>M.capabilitiesFor(db,j).map(c=>M.scopeRank(c.scope)));
 a.ok(guRanks.length);a.ok(!guRanks.includes(1));a.ok(guRanks.some(r=>r>=2));
 // 岑野跨公司回流：公司去重计 2 家，但任职有 3 段。
 const cen=M.persona(db,'P-D03');
 a.equal(cen.companyCount,2);
 a.deepEqual(cen.companyIds.slice().sort(),['C-A','C-D']);
 a.equal(cen.jobCount,3);
 a.deepEqual(cen.domains[0].jobIds,['J-D06','J-D05','J-D04']);
 a.deepEqual(cen.tenure,{closed:2,avgYears:2});
 // 求职意向未知的声明对所有人恒定存在。
 for(const p of db.people){
  const pe=M.persona(db,p.id);
  a.ok(pe.limits.some(l=>l.includes('求职意向未知')),p.id);
  a.equal(pe.limits[0].includes('求职意向未知'),true);
 }
 // 无任职者返回 jobCount 0 且不抛错；未知 ID 才抛错。
 db.people.push({id:'P-V33-NONE',name:'虚构无任职样本',aliases:[],identity:'虚构测试样本；非现实人物',updated:db.observationDate});
 let none;
 a.doesNotThrow(()=>{none=M.persona(db,'P-V33-NONE');});
 a.equal(none.jobCount,0);a.deepEqual(none.pendingJobs,[]);a.deepEqual(none.domains,[]);
 a.deepEqual(none.quality,{total:0,singleSource:0,inferredEnd:0,openEnd:0});
 a.ok(none.limits.some(l=>l.includes('缺证不等于没有经历')));
 a.throws(()=>M.persona(db,'P-NOT-EXIST'),/未知人员/);
});

test('数据病理检出：同名、同期兼任、二手转述',()=>{
 const db=M.seed();
 const hom=M.homonyms(db);
 a.equal(hom.length,1);
 a.equal(hom[0].name,'卫楚');
 a.deepEqual(hom[0].personIds.slice().sort(),['P-D05','P-D06']);
 // 同名两人必须保持独立 ID：项目、能力域都不同，不能按姓名合并。
 const [x,y]=hom[0].personIds.map(id=>M.persona(db,id));
 a.notEqual(x.personId,y.personId);
 a.notDeepEqual(x.domains.map(d=>d.domain),y.domains.map(d=>d.domain));
 a.notDeepEqual(x.companyIds,y.companyIds);
 const con=M.concurrentJobs(db);
 a.equal(con.length,1);
 a.equal(con[0].personId,'P-D02');
 a.equal(db.people.find(p=>p.id==='P-D02').name,'裴安');
 a.deepEqual(con[0].jobIds.slice().sort(),['J-D02','J-D03']);
 a.deepEqual(con[0].projectIds.slice().sort(),['G-B1','G-D1']);
 a.deepEqual(con[0].years,[2022,2023]);
 a.deepEqual(con[0].evidenceIds.slice().sort(),['E-J-D02','E-J-D03']);
 a.notEqual(con[0].projectIds[0],con[0].projectIds[1]);
 // 同期区间必须是两段任职的真实交集，且不超过观察年。
 const [ja,jb]=con[0].jobIds.map(id=>db.jobs.find(j=>j.id===id));
 a.equal(con[0].years[0],Math.max(ja.start,jb.start));
 a.ok(con[0].years[1]<=+db.observationDate.slice(0,4));
 const sec=M.secondhandSources(db);
 a.deepEqual(sec.map(s=>s.evidenceId).sort(),['E-D01B','E-J-D10']);
 const d10=sec.find(s=>s.evidenceId==='E-J-D10');
 a.match(d10.independence,/二手转述/);
 a.deepEqual(d10.jobIds,['J-D10']);
 const d01=sec.find(s=>s.evidenceId==='E-D01B');
 a.match(d01.independence,/自述/);
 a.deepEqual(d01.jobIds,['J-D01']);
});

test('pyramid：按每人最高责任层级归一层，不重复计人；当前样本层级倒挂',()=>{
 const db=M.seed(),py=M.pyramid(db);
 a.deepEqual(py.map(l=>l.rank),[4,3,2,1]);
 for(const l of py){a.equal(l.label,M.SCOPE_LABEL[l.rank]);a.equal(l.people,l.personIds.length);}
 const all=py.flatMap(l=>l.personIds);
 a.equal(new Set(all).size,all.length);
 const expected=new Map();
 for(const j of M.publishedJobs(db))for(const c of M.capabilitiesFor(db,j)){
  const r=M.scopeRank(c.scope);
  if(r>(expected.get(j.personId)??0))expected.set(j.personId,r);
 }
 a.equal(all.length,expected.size);
 for(const l of py)for(const pid of l.personIds)a.equal(expected.get(pid),l.rank,pid);
 // 阮清与岑野各有 3 段任职、多个层级证据，但只按最高层计一次。
 for(const pid of ['P-D08','P-D03']){
  a.ok(M.publishedJobs(db).filter(j=>j.personId===pid).length>1);
  a.equal(py.filter(l=>l.personIds.includes(pid)).length,1);
  a.ok(layer(py,3).personIds.includes(pid));
 }
 a.equal(layer(py,4).people,0);
 a.ok(layer(py,3).people>layer(py,2).people);
 const diag=M.orgDiagnosis(db);
 a.equal(diag.pyramidInverted,true);
 a.deepEqual(diag.pyramid,py);
 a.match(diag.notice,/不涉及任何求职意向判断/);
 a.match(diag.notice,/“未收录证据”不等于该项目没有此类岗位/);
});

test('bench / coverage / singlePoints 三者口径一致，人数按人去重',()=>{
 const db=M.seed(),b=M.bench(db),cov=M.coverage(db),sp=M.singlePoints(db);
 a.equal(b.length,db.projects.length);
 for(const r of b)for(const c of r.cells){
  a.equal(c.people,c.personIds.length);
  a.equal(c.leads,c.leadIds.length);
  a.equal(new Set(c.personIds).size,c.people);
  a.ok(c.leadIds.every(id=>c.personIds.includes(id)));
  a.ok(c.leads<=c.people);
  // 层级文案只由带组以上人数决定；0 位时即使已收录参与者也只说“未收录证据”。
  a.equal(c.level,['未收录证据','样本内单点'][c.leads]??'样本内有厚度');
 }
 for(const c of cov){
  const row=b.find(r=>r.project.id===c.projectId);
  a.deepEqual(c.covered,row.cells.filter(x=>x.people>0).map(x=>x.domain));
  a.deepEqual(c.missing,row.cells.filter(x=>!x.people).map(x=>x.domain));
  a.equal(c.covered.length+c.missing.length,M.DOMAINS.length);
  a.equal(c.pct,Math.round(c.covered.length/M.DOMAINS.length*100));
 }
 // 沧溟系列覆盖的是新增能力域，缺口是原有四域。
 a.deepEqual(cov.find(c=>c.projectId==='G-D1').missing,['战斗体系','经济系统','社交与帮会']);
 a.ok(cov.find(c=>c.projectId==='G-D1').covered.includes('玩法与系统'));
 // 每个单点都必须能回溯到一段已发布任职与可用来源。
 a.equal(sp.length,b.flatMap(r=>r.cells).filter(c=>c.leads===1).length);
 for(const s of sp){
  a.equal(cell(db,s.projectId,s.domain).leads,1);
  a.deepEqual(cell(db,s.projectId,s.domain).leadIds,[s.personId]);
  const j=M.publishedJobs(db).find(x=>x.id===s.jobId);
  a.ok(j&&j.personId===s.personId&&j.projectId===s.projectId);
  a.ok(M.capabilitiesFor(db,j).some(c=>c.domain===s.domain&&M.scopeRank(c.scope)>=2));
  a.ok(s.evidenceIds.length);
  a.ok(s.evidenceIds.every(id=>M.sourceUsable(db,db.evidence.find(e=>e.id===id))));
 }
});

test('来源隔离后 bench / pyramid / persona 同步下降且 playbook 变化，恢复后回到原值',()=>{
 const db=M.seed();
 const b0=JSON.stringify(M.bench(db)),py0=JSON.stringify(M.pyramid(db)),pe0=JSON.stringify(M.persona(db,'P-D08')),pb0=JSON.stringify(M.playbook(db)),sp0=JSON.stringify(M.singlePoints(db));
 a.deepEqual(cell(db,'G-D2','世界与内容'),{domain:'世界与内容',people:1,leads:1,level:'样本内单点',personIds:['P-D08'],leadIds:['P-D08']});
 a.ok(layer(M.pyramid(db),3).personIds.includes('P-D08'));
 a.equal(M.persona(db,'P-D08').jobCount,3);
 const rank3Before=layer(M.pyramid(db),3).people,rank2Before=layer(M.pyramid(db),2).people;

 M.setSourceStatus(db,'E-J-D13',true,'测试：领域负责来源待核验','测试审核人');
 // 对应格子消失。
 const after=cell(db,'G-D2','世界与内容');
 a.equal(after.people,0);a.equal(after.leads,0);a.equal(after.level,'未收录证据');
 a.ok(!M.singlePoints(db).some(s=>s.projectId==='G-D2'&&s.domain==='世界与内容'));
 a.ok(M.coverage(db).find(c=>c.projectId==='G-D2').missing.includes('世界与内容'));
 // 金字塔层级下降：领域负责少一人，带组多一人。
 a.equal(layer(M.pyramid(db),3).people,rank3Before-1);
 a.equal(layer(M.pyramid(db),2).people,rank2Before+1);
 a.ok(!layer(M.pyramid(db),3).personIds.includes('P-D08'));
 a.ok(layer(M.pyramid(db),2).personIds.includes('P-D08'));
 // 画像同步下降，且不回退到已隔离来源支撑的历史最高范围。
 const pe=M.persona(db,'P-D08');
 a.equal(pe.jobCount,2);
 a.equal(pe.domains[0].topScope,'带领小组 / 模块');
 a.deepEqual(pe.domains[0].jobIds,['J-D12','J-D11']);
 a.ok(!JSON.stringify(pe).includes('J-D13'));
 a.ok(!JSON.stringify(pe).includes('E-J-D13'));
 a.notEqual(JSON.stringify(M.playbook(db)),pb0);
 a.equal(M.health(db).find(h=>h.key==='quarantine').value,1);

 M.setSourceStatus(db,'E-J-D13',false,'测试：恢复来源','测试审核人');
 a.equal(JSON.stringify(M.bench(db)),b0);
 a.equal(JSON.stringify(M.pyramid(db)),py0);
 a.equal(JSON.stringify(M.persona(db,'P-D08')),pe0);
 a.equal(JSON.stringify(M.playbook(db)),pb0);
 a.equal(JSON.stringify(M.singlePoints(db)),sp0);
});

test('playbook 判别规则：整体均匀薄只出 1 条 P2 聚合建议；出现厚度后其余薄域才转 P1 定向研究',()=>{
 const db=M.seed(),base=M.playbook(db),b=M.bench(db);
 // 基线：每个项目都没有任何 leads>=2 的能力域。
 for(const row of b)a.equal(row.cells.filter(c=>c.leads>=2).length,0,row.project.id);
 // 因此一条单点告警都不该出现，取而代之是每个项目一条聚合的扩样建议。
 a.equal(base.items.filter(i=>i.kind==='定向研究').length,0);
 a.ok(M.singlePoints(db).length>=10);
 const thin=base.items.filter(i=>i.id.startsWith('thin:'));
 a.equal(thin.length,db.projects.length);
 a.equal(new Set(ids(thin)).size,thin.length);
 for(const row of b){
  const recorded=row.cells.filter(c=>c.people>0),thinCells=recorded.filter(c=>c.leads===1);
  a.ok(thinCells.length>=2,row.project.id);
  const item=base.items.filter(i=>i.id==='thin:'+row.project.id);
  a.equal(item.length,1);
  a.equal(item[0].kind,'扩样 mapping');
  a.equal(item[0].priority,'P2');
  a.ok(item[0].finding.includes(`${recorded.length} 个能力域`));
  a.match(item[0].why,/收录深度/);
  a.match(item[0].why,/放大成多条虚假告警/);
  a.equal(item[0].basis.projectId,row.project.id);
  a.ok(!base.items.some(i=>i.id.startsWith('single:'+row.project.id+':')));
 }

 // 构造：给《沧溟》的「玩法与系统」补一位带组以上人员，使该域 leads 变 2。
 const deep=M.seed();
 a.equal(cell(deep,'G-D1','玩法与系统').leads,1);
 addPublishedLead(deep,{id:'J-V33-DEEP',personId:'P-D05',projectId:'G-D1',domain:'玩法与系统'});
 const d1=cell(deep,'G-D1','玩法与系统');
 a.equal(d1.leads,2);a.equal(d1.people,2);a.equal(d1.level,'样本内有厚度');
 a.deepEqual(d1.leadIds.slice().sort(),['P-D02','P-D05']);
 const after=M.playbook(deep);
 // 规则翻转：聚合建议消失，其余薄领域逐一转为 P1 定向研究。
 a.ok(!after.items.some(i=>i.id==='thin:G-D1'));
 const dir=after.items.filter(i=>i.kind==='定向研究');
 a.deepEqual(ids(dir).sort(),['single:G-D1:关卡与副本','single:G-D1:世界与内容'].sort());
 for(const i of dir){
  a.equal(i.priority,'P1');
  a.ok(i.finding.includes('《沧溟》'));
  a.match(i.finding,/只有 1 位带组及以上人员/);
  a.ok(i.finding.includes('另有 1 个能力域已收录到 2 人以上'));
  a.match(i.why,/内部对比可帮助选择下一轮补录顺序/);
  a.ok(i.basis.personIds.length===1&&i.basis.jobIds.length===1&&i.basis.evidenceIds.length);
  const s=M.singlePoints(deep).find(x=>x.projectId==='G-D1'&&i.id.endsWith(':'+x.domain));
  a.deepEqual(i.basis.personIds,[s.personId]);
  a.deepEqual(i.basis.jobIds,[s.jobId]);
  a.deepEqual(i.basis.evidenceIds,s.evidenceIds);
 }
 // 已有厚度的领域本身不再报警；其余项目仍保持聚合口径。
 a.ok(!after.items.some(i=>i.id==='single:G-D1:玩法与系统'));
 a.ok(!after.items.some(i=>i.id==='single:G-D1:商业化与付费'));
 for(const pid of db.projects.map(p=>p.id).filter(id=>id!=='G-D1'))a.ok(after.items.some(i=>i.id==='thin:'+pid),pid);
 a.equal(after.items.filter(i=>i.id.startsWith('thin:')).length,db.projects.length-1);
 a.equal(after.items.length,base.items.length-1+dir.length);
 // 构造只改变这一处判别，不影响病理类结论。
 a.deepEqual(M.homonyms(deep),M.homonyms(db));
 a.deepEqual(M.concurrentJobs(deep),M.concurrentJobs(db));
 a.deepEqual(M.secondhandSources(deep),M.secondhandSources(db));
});

test('playbook 每条结构完整、可追溯，并按 P0<P1<P2 与类别次序排序',()=>{
 const db=M.seed(),pb=M.playbook(db);
 const KEYS=['id','kind','priority','finding','why','action','basis','limit'];
 const PRI={P0:0,P1:1,P2:2},KIND={'核验口径':0,'与业务对齐':1,'补充证据':2,'定向研究':3,'扩样 mapping':4};
 a.ok(pb.items.length>0);
 a.equal(new Set(ids(pb.items)).size,pb.items.length);
 for(const i of pb.items){
  a.deepEqual(Object.keys(i),KEYS);
  for(const k of ['id','kind','priority','finding','why','action','limit'])a.equal(typeof i[k],'string',k+' @ '+i.id);
  for(const k of ['id','finding','why','action','limit'])a.ok(i[k].trim().length,k+' @ '+i.id);
  a.ok(Object.hasOwn(PRI,i.priority),i.priority);
  a.ok(Object.hasOwn(KIND,i.kind),i.kind);
  a.equal(typeof i.basis,'object');a.ok(i.basis&&!Array.isArray(i.basis));
  a.ok(Object.keys(i.basis).length);
  for(const pid of i.basis.personIds||[])a.ok(db.people.some(p=>p.id===pid),pid);
  for(const jid of i.basis.jobIds||[])a.ok(db.jobs.some(j=>j.id===jid),jid);
  for(const eid of i.basis.evidenceIds||[])a.ok(db.evidence.some(e=>e.id===eid),eid);
  if(i.basis.projectId)a.ok(db.projects.some(p=>p.id===i.basis.projectId));
 }
 const keys=pb.items.map(i=>[PRI[i.priority],KIND[i.kind]]);
 for(let n=1;n<keys.length;n++){
  const [p1,k1]=keys[n-1],[p2,k2]=keys[n];
  a.ok(p1<p2||(p1===p2&&k1<=k2),`排序错乱 @ ${n}: ${pb.items[n-1].id} -> ${pb.items[n].id}`);
 }
 a.deepEqual([...new Set(pb.items.map(i=>i.priority))],['P0','P1','P2']);
 // 「核验口径」整体排在「扩样 mapping」之前（含同优先级情形下的比较次序）。
 a.ok(KIND['核验口径']<KIND['扩样 mapping']);
 const kinds=pb.items.map(i=>i.kind);
 a.ok(kinds.lastIndexOf('核验口径')<kinds.indexOf('扩样 mapping'));
 a.equal(kinds.indexOf('核验口径'),0);
 a.equal(pb.items[0].priority,'P0');
 a.equal(pb.items[0].id,'homonym:卫楚');
 a.ok(pb.items.some(i=>i.id==='concurrent:J-D02-J-D03'&&i.priority==='P1'&&i.kind==='核验口径'));
 a.ok(pb.items.some(i=>i.id==='pyramid'&&i.priority==='P1'&&i.kind==='与业务对齐'));
 a.ok(pb.items.some(i=>i.id==='source:E-J-D10'&&i.kind==='补充证据'));
 a.ok(pb.items.some(i=>i.id==='source:E-D01B'&&i.kind==='补充证据'));
 // notice 必须声明不调用模型、不涉及意向。
 a.match(pb.notice,/不调用任何模型/);
 a.match(pb.notice,/不涉及[^。]*意向/);
 a.match(pb.notice,/不是招聘承诺/);
 a.match(pb.notice,/固定规则/);
});

test('红线：playbook 与 persona 全部文本不含意向推断词，也不含联系方式',()=>{
 const db=M.seed();
 const INTENT=/强意向|可挖|想跳槽|在看机会|挖动|求职意向为|有意离职|跳槽意愿/;
 const CONTACT=/1[3-9]\d{9}|[\w.+-]+@[\w-]+\.[a-z]{2,}|微信号|手机号|联系电话|邮箱地址|QQ\s*[:：]?\s*\d/i;
 const collect=db=>{
  const out=strings(M.playbook(db));
  for(const p of db.people)out.push(...strings(M.persona(db,p.id)));
  return out;
 };
 const deep=M.seed();
 addPublishedLead(deep,{id:'J-V33-DEEP',personId:'P-D05',projectId:'G-D1',domain:'玩法与系统'});
 const published=M.seed();publish(published);
 const pool=[...collect(db),...collect(deep),...collect(published)];
 a.ok(pool.length>300);
 for(const t of pool){
  a.ok(!INTENT.test(t),'意向推断词: '+t);
  a.ok(!CONTACT.test(t),'联系方式: '+t);
 }
 // 反向自检：正则确实能抓到违规文本。
 a.ok(INTENT.test('该候选人强意向，可挖'));
 a.ok(CONTACT.test('邮箱地址 demo@example.com'));
 a.ok(CONTACT.test('13800138000'));
 // 意向只以「未知 / 不推断」的免责形式出现。
 for(const p of db.people)a.match(M.persona(db,p.id).limits[0],/求职意向未知：系统不推断，也不记录联系方式。/);
});

test('责任范围字段失效时组织画像保留能力域但不虚增带组人数',()=>{
 const db=M.seed(),j=db.jobs.find(x=>x.id==='J-D13'),claim=db.fieldClaims.find(c=>c.jobId===j.id&&c.field==='capability.scope');
 a.ok(claim);
 a.equal(M.bench(db).find(r=>r.project.id==='G-D2').cells.find(c=>c.domain==='世界与内容').leads,1);
 claim.processStatus='已撤销';M.validateDatabase(db);
 const cell=M.bench(db).find(r=>r.project.id==='G-D2').cells.find(c=>c.domain==='世界与内容');
 a.equal(cell.people,1);a.equal(cell.leads,0);
 const dom=M.persona(db,'P-D08').domains.find(x=>x.domain==='世界与内容');
 a.equal(dom.rank,2);a.equal(dom.topScope,'带领小组 / 模块');
 const j2=db.jobs.find(x=>x.id==='J-D12'),claim2=db.fieldClaims.find(c=>c.jobId===j2.id&&c.field==='capability.scope');
 claim2.processStatus='已撤销';M.validateDatabase(db);
 a.equal(M.persona(db,'P-D08').domains.find(x=>x.domain==='世界与内容').topScope,'参与');
 a.equal(M.pyramid(db).find(x=>x.personIds.includes('P-D08'))?.rank,1);
});

test('公开行业背景与虚构人物事实隔离，且逐条注明来源和适用限制',()=>{
 const db=M.seed(),facts=JSON.stringify({people:db.people,jobs:db.jobs,claims:db.fieldClaims,evidence:db.evidence}),q=JSON.stringify(M.queryMatches(db,{combat:true,chief:true}));
 a.equal(M.INDUSTRY_CONTEXT.length,4);
 for(const x of M.INDUSTRY_CONTEXT){
  for(const key of ['source','published','finding','question','limit','url'])a.equal(typeof x[key],'string');
  a.match(x.url,/^https:\/\//);
  a.ok(x.limit.length>20);
 }
 a.equal(JSON.stringify({people:db.people,jobs:db.jobs,claims:db.fieldClaims,evidence:db.evidence}),facts);
 a.equal(JSON.stringify(M.queryMatches(db,{combat:true,chief:true})),q);
 a.ok(!JSON.stringify(db).includes('3507.89'));
});

test('V3.3 不破坏演示主线：审核前只命中顾航，发布后命中林序和顾航',()=>{
 const db=M.seed();
 a.deepEqual(M.query(db,{combat:true,chief:true}).map(p=>p.name),['顾航']);
 const pbBefore=M.playbook(db);
 publish(db);
 a.deepEqual(M.query(db,{combat:true,chief:true}).map(p=>p.name),['林序','顾航']);
 M.validateDatabase(db);
 // 发布后新事实进入组织层，但不改变同名 / 同期兼任 / 二手来源的判定。
 const pbAfter=M.playbook(db);
 a.notEqual(JSON.stringify(pbAfter),JSON.stringify(pbBefore));
 a.deepEqual(M.homonyms(db),[{name:'卫楚',personIds:['P-D05','P-D06']}]);
 a.deepEqual(M.concurrentJobs(db).map(c=>c.personId),['P-D02']);
 a.deepEqual(M.secondhandSources(db).map(s=>s.evidenceId).sort(),['E-D01B','E-J-D10']);
 a.equal(M.orgDiagnosis(db).pyramidInverted,true);
 const lin=M.persona(db,'P-A01');
 a.ok(lin.jobCount>0);
 a.ok(lin.limits.some(l=>l.includes('求职意向未知')));
 a.ok(lin.limits.some(l=>l.includes('推定边界')));
 // 长名单预设也随能力域扩充而扩充，且新预设可用。
 for(const id of ['level-lead','monetisation-lead','systems-lead']){
  const preset=M.LONGLIST_PRESETS.find(p=>p.id===id);
  a.ok(preset,id);
  a.doesNotThrow(()=>M.explainLonglist(db,M.clone(preset)));
 }
 a.deepEqual(M.longlist(db,M.LONGLIST_PRESETS.find(p=>p.id==='level-lead')).filter(r=>r.tier==='A').map(r=>r.person.name),['岑野']);
});
