const {test}=require('node:test'),a=require('node:assert/strict');
require('./load-current.cjs');
const M=globalThis.Mapping;
const chiefCombat={domains:['战斗体系'],chief:true,minScope:2,genre:''};
const publish=(db)=>{const d=M.extract(M.DEMO,db);d.identityConfirmed=true;db.drafts.push(d);M.publish(db,d);return d;};
const row=(result,id)=>result.rows.find(r=>r.personId===id);
const codes=r=>r.reasons.map(x=>x.code);
const names=rows=>rows.map(r=>r.person.name).sort();
const withoutReasons=({reasons,...rest})=>rest;
function addJob(db,{id,personId='P-A16',projectId='G-A1',domain='战斗体系',scope='领域负责',role='战斗策划负责人',start=2026,end=null}){
 const p=db.people.find(p=>p.id===personId),project=db.projects.find(p=>p.id===projectId),eid='E-'+id;
 const text=`【虚构测试材料】${p.name}自${start}年在《${project.name}》担任${role}，${domain||'策划工作'}责任范围为${scope}；${end===null?'结束时间未知':'任职结束于'+end+'年'}。`;
 const j={...M.clone(db.jobs.find(j=>j.id==='J-C14')),id,personId,projectId,role,rawRole:role,start,end,module:domain||'策划整体统筹',scope,evidenceIds:[eid],roleHistory:[]};
 db.jobs.push(j);
 db.evidence.push({...M.clone(db.evidence.find(e=>e.id==='E-J-C14')),id:eid,text,claims:[{objectId:id,personId,projectId,role,start,end,module:j.module,scope,quote:text}]});
 if(domain)db.capabilities.push({id:'CAP-'+id,jobId:id,domain,details:[domain],scope,scenario:project.genre,evidenceIds:[eid],quote:text,factStatus:M.SINGLE,processStatus:'已发布'});
 M.buildClaims(db);
 M.validateDatabase(db);
 return j;
}
function splitScopeSource(db,jobId){
 const cap=db.capabilities.find(c=>c.jobId===jobId),source=db.evidence.find(e=>e.id===cap.evidenceIds[0]),id='E-SCOPE-'+jobId;
 db.evidence.push({...M.clone(source),id,source:'虚构责任范围补证',text:'【虚构独立补证材料】'+source.text,claims:[]});
 cap.evidenceIds.push(id);
 db.jobs.find(j=>j.id===jobId).evidenceIds.push(id);
 for(const c of db.fieldClaims.filter(c=>c.capabilityId===cap.id&&c.field==='capability.scope'))c.sourceId=id;
 M.validateDatabase(db);
 return id;
}
function assertTraceable(db,result){
 for(const r of result.rows)for(const h of r.hits){
  a.ok(M.publishedJobs(db).some(j=>j.id===h.jobId&&j.personId===r.personId));
  a.ok(h.claimIds.length);
  const claims=h.claimIds.map(id=>db.fieldClaims.find(c=>c.id===id));
  for(const c of claims){
   a.ok(c);
   a.equal(c.jobId,h.jobId);
   a.equal(c.personId,r.personId);
   a.equal(c.projectId,h.projectId);
   a.ok(M.fieldClaims(db,h.jobId,c.field).some(x=>x.id===c.id));
   const e=db.evidence.find(e=>e.id===c.sourceId);
   a.ok(M.sourceUsable(db,e));
   a.ok(c.quote&&e.text.includes(c.quote));
   if(h.label==='主策任职'){a.equal(c.field,'role');a.equal(c.value,'主策');}
   else{
    a.ok(['capability.domain','capability.scope'].includes(c.field));
    const cap=db.capabilities.find(x=>x.id===c.capabilityId);
    a.ok(cap&&cap.jobId===h.jobId);
    a.ok(h.label.startsWith(cap.domain+' · '));
   }
  }
  a.deepEqual(h.evidenceIds,[...new Set(claims.map(c=>c.sourceId))]);
  const scopes=claims.filter(c=>c.field==='capability.scope');
  a.deepEqual(h.scopeClaimIds,scopes.map(c=>c.id));
  a.deepEqual(h.scopeEvidenceIds,[...new Set(scopes.map(c=>c.sourceId))]);
 }
}
// 无项目偏好时，使用 V3.1 的分层、计分、取任职规则作为独立回归基准。
function legacySignature(db,need){
 const all=M.publishedJobs(db),out=[];
 for(const p of db.people){
  const js=all.filter(j=>j.personId===p.id);if(!js.length)continue;
  const best=need.domains.map(d=>js.flatMap(j=>M.capabilitiesFor(db,j).filter(c=>c.domain===d).map(c=>({j,rank:M.scopeRank(c.scope)}))).sort((a,b)=>b.rank-a.rank||b.j.start-a.j.start)[0]);
  const chiefJob=need.chief?js.find(j=>M.fieldClaims(db,j.id,'role').some(c=>c.value==='主策')):null;
  const met=best.filter(Boolean);
  if(need.domains.length?!met.length:!chiefJob)continue;
  const hard=best.every(b=>b&&b.rank>=need.minScope)&&(!need.chief||chiefJob);
  const latest=js.slice().sort((a,b)=>(b.end??9999)-(a.end??9999)||b.start-a.start)[0];
  out.push({personId:p.id,tier:hard?'A':'B',score:met.length*10+met.reduce((n,b)=>n+b.rank,0)+(chiefJob?5:0),latestJobId:latest.id,hitJobIds:[...met.map(b=>b.j.id),...(chiefJob?[chiefJob.id]:[])]});
 }
 return out.sort((a,b)=>a.tier.localeCompare(b.tier)||b.score-a.score||a.personId.localeCompare(b.personId));
}

test('V3.2：基线 A 仅顾航，26 人全部解释且 A/B 与原 longlist 契约一致',()=>{
 const db=M.seed(),r=M.explainLonglist(db,chiefCombat);
 a.equal(r.totalPeople,26);a.equal(r.evaluatedPeople,26);a.equal(r.rows.length,26);
 a.equal(new Set(r.rows.map(x=>x.personId)).size,26);
 a.deepEqual(names(r.tiers.A),['顾航']);
 a.deepEqual(M.query(db,{combat:true,chief:true}).map(p=>p.name),['顾航']);
 a.deepEqual(M.longlist(db,chiefCombat),r.rows.filter(x=>x.tier!=='C').map(withoutReasons));
 a.deepEqual([...r.tiers.A,...r.tiers.B,...r.tiers.C],r.rows);
 for(const x of r.rows){
  for(const k of ['person','personId','tier','hits','gaps','checks','latestJobId','genreHit','score','reasons'])a.ok(Object.hasOwn(x,k));
  a.deepEqual(x.gaps,x.reasons.map(g=>g.label));
  a.equal(x.person.id,x.personId);a.ok(x.checks.some(c=>c.includes('求职意向未知')));
  if(x.tier!=='A')a.ok(x.reasons.length);
 }
 a.equal(row(r,'P-A10').tier,'C');a.ok(codes(row(r,'P-A10')).includes('missing_domain:战斗体系'));
 a.ok(row(r,'P-A10').hits.some(h=>h.label==='主策任职'));
 assertTraceable(db,r);
});

test('发布后 A 为顾航和林序，保留主线、推定边界和字段原文回溯',()=>{
 const db=M.seed();publish(db);const r=M.explainLonglist(db,chiefCombat);
 a.deepEqual(names(r.tiers.A),['林序','顾航'].sort());
 a.deepEqual(M.query(db,{combat:true,chief:true}).map(p=>p.name),['林序','顾航']);
 a.equal(r.rows.length,26);a.equal(db.jobs.length,41);
 const lin=row(r,'P-A01');a.equal(lin.tier,'A');a.deepEqual(lin.reasons,[]);
 a.ok(lin.checks.some(c=>c.includes('推定')));a.equal(new Set(lin.hits.map(h=>h.jobId)).size,2);
 a.deepEqual(M.longlist(db,chiefCombat),r.rows.filter(x=>x.tier!=='C').map(withoutReasons));
 assertTraceable(db,r);
});

test('无有效任职者仍为 C 并有原因；人数和聚合分母不丢失',()=>{
 const db=M.seed();db.people.push({id:'P-NO-FACTS',name:'虚构无事实样本',aliases:[],identity:'虚构测试样本',updated:db.observationDate});
 const r=M.explainLonglist(db,chiefCombat),x=row(r,'P-NO-FACTS');
 a.equal(r.totalPeople,27);a.equal(r.evaluatedPeople,27);a.equal(r.rows.length,27);
 a.equal(x.tier,'C');a.deepEqual(x.hits,[]);a.equal(x.latestJobId,null);a.equal(x.score,0);
 a.deepEqual(codes(x),['no_published_jobs','missing_domain:战斗体系','missing_chief']);
 a.ok(x.reasons.every(g=>g.kind==='missing_evidence'));
 a.ok(!x.checks.some(c=>c.includes('最近任职已结束')));
 a.ok(r.gapDistribution.every(g=>g.denominator===27));
 a.ok(!M.longlist(db,chiefCombat).some(r=>r.personId===x.personId));
 a.match(r.notice,/缺证不等于没有能力/);a.match(r.notice,/C 层.*不代表能力不合格/);
});

test('缺域、缺主策、责任范围不足与项目偏好严格区分；偏好不淘汰',()=>{
 const db=M.seed(),r=M.explainLonglist(db,{domains:['战斗体系'],chief:true,minScope:3,genre:'开放世界'});
 const bai=row(r,'P-A16'),gu=row(r,'P-A07'),he=row(r,'P-A10');
 a.equal(bai.tier,'B');
 a.equal(bai.reasons.find(g=>g.code==='insufficient_scope:战斗体系').kind,'below_requirement');
 a.equal(bai.reasons.find(g=>g.code==='missing_chief').kind,'missing_evidence');
 a.equal(bai.reasons.find(g=>g.code==='genre_preference').kind,'preference');
 a.equal(he.reasons.find(g=>g.code==='missing_domain:战斗体系').kind,'missing_evidence');
 a.equal(gu.tier,'A');a.equal(gu.genreHit,false);a.deepEqual(codes(gu),['genre_preference']);
 const before=M.longlist(db,{domains:['战斗体系'],minScope:3}).map(x=>[x.personId,x.tier]).sort();
 const after=M.longlist(db,{domains:['战斗体系'],minScope:3,genre:'开放世界'}).map(x=>[x.personId,x.tier]).sort();
 a.deepEqual(after,before);
});

test('先选范围达标且命中项目偏好的任职，不被更高但非偏好任职遮蔽',()=>{
 const db=M.seed();
 addJob(db,{id:'J-V32-HIGH',projectId:'G-C1',scope:'整体统筹',start:2026});
 addJob(db,{id:'J-V32-PREFERRED',projectId:'G-A1',scope:'领域负责',start:2024});
 const need={domains:['战斗体系'],minScope:3,genre:'动作'},r=M.explainLonglist(db,need),x=row(r,'P-A16');
 a.equal(x.tier,'A');a.equal(x.genreHit,true);a.deepEqual(x.reasons,[]);
 a.equal(x.hits[0].jobId,'J-V32-PREFERRED');a.equal(x.score,15);
 a.equal(row(M.explainLonglist(db,{...need,genre:''}),'P-A16').hits[0].jobId,'J-V32-HIGH');
 assertTraceable(db,r);
});

test('偏好但范围不达标的任职不得挤掉范围达标的非偏好任职',()=>{
 const db=M.seed();
 addJob(db,{id:'J-V32-HIGH',projectId:'G-C1',scope:'整体统筹'});
 addJob(db,{id:'J-V32-LOW',projectId:'G-A1',scope:'参与'});
 const x=row(M.explainLonglist(db,{domains:['战斗体系'],minScope:3,genre:'动作'}),'P-A16');
 a.equal(x.tier,'A');a.equal(x.hits[0].jobId,'J-V32-HIGH');a.equal(x.genreHit,false);
 a.deepEqual(codes(x),['genre_preference']);
});

test('主策也优先选择偏好项目；minScope 不新增约束主策岗位的语义',()=>{
 const db=M.seed();addJob(db,{id:'J-V32-CHIEF',personId:'P-A10',projectId:'G-A1',domain:'',role:'主策',scope:'未知'});
 const need={domains:[],chief:true,minScope:4,genre:'动作'},r=M.explainLonglist(db,need),x=row(r,'P-A10');
 a.equal(x.tier,'A');a.equal(x.genreHit,true);a.equal(x.hits[0].jobId,'J-V32-CHIEF');
 a.deepEqual(x.hits[0].scopeClaimIds,[]);a.deepEqual(x.reasons,[]);
 const base=M.seed();a.equal(row(M.explainLonglist(base,need),'P-A01').tier,'A');
 assertTraceable(db,r);
});

test('hit 仅带能力域及对应范围字段来源，不混入任职头衔或其他字段来源',()=>{
 const db=M.seed(),jobId='J-C12',sid=splitScopeSource(db,jobId),cap=db.capabilities.find(c=>c.jobId===jobId);
 const unrelated='E-V32-UNRELATED',source=db.evidence.find(e=>e.id===cap.evidenceIds[0]);
 db.evidence.push({...M.clone(source),id:unrelated,claims:[]});
 cap.evidenceIds.push(unrelated);db.jobs.find(j=>j.id===jobId).evidenceIds.push(unrelated);
 M.validateDatabase(db);
 const r=M.explainLonglist(db,{domains:['战斗体系'],minScope:1}),h=row(r,'P-A16').hits[0];
 a.deepEqual(h.evidenceIds,['E-J-C12',sid]);a.deepEqual(h.scopeEvidenceIds,[sid]);
 a.ok(!h.evidenceIds.includes(unrelated));
 a.ok(h.claimIds.every(id=>db.fieldClaims.find(c=>c.id===id).field.startsWith('capability.')));
 assertTraceable(db,r);
});

test('隔离范围来源只产生缺证，不读取旧 scope，也不误报为低于要求',()=>{
 const db=M.seed(),sid=splitScopeSource(db,'J-C12');
 M.setSourceStatus(db,sid,true,'测试：范围来源待核验','测试审核人');
 const r=M.explainLonglist(db,{domains:['战斗体系'],minScope:1}),x=row(r,'P-A16'),h=x.hits[0];
 a.equal(db.capabilities.find(c=>c.jobId==='J-C12').scope,'参与');
 a.ok(M.fieldClaims(db,'J-C12','scope').length);
 a.equal(x.tier,'B');a.deepEqual(codes(x),['missing_scope:战斗体系']);
 a.equal(x.reasons[0].kind,'missing_evidence');a.equal(x.score,10);
 a.deepEqual(h.scopeClaimIds,[]);a.deepEqual(h.scopeEvidenceIds,[]);a.deepEqual(h.evidenceIds,['E-J-C12']);
 a.match(h.label,/责任范围待核验/);assertTraceable(db,r);
 M.setSourceStatus(db,sid,false,'测试：恢复范围来源','测试审核人');
 a.equal(row(M.explainLonglist(db,{domains:['战斗体系'],minScope:1}),'P-A16').tier,'A');
});

test('隔离职责来源后，剩余正式组长头衔不能污染战斗能力或原文来源',()=>{
 const db=M.seed();publish(db);
 const chief=row(M.explainLonglist(db,chiefCombat),'P-A01'),combat=chief.hits.find(h=>h.label.startsWith('战斗体系'));
 const draft=M.extract(M.SUPPLEMENT,db);draft.identityConfirmed=true;db.drafts.push(draft);M.publish(db,draft);
 const jobId=combat.jobId,titleSource=M.fieldClaims(db,jobId,'roleHistory')[0].sourceId;
 a.ok(titleSource&&!combat.evidenceIds.includes(titleSource));
 for(const id of combat.evidenceIds)M.setSourceStatus(db,id,true,'测试：职责来源待核验','测试审核人');
 a.ok(M.publishedJobs(db).some(j=>j.id===jobId));
 a.ok(M.fieldClaims(db,jobId,'roleHistory').length);a.equal(M.fieldClaims(db,jobId,'capability.domain').length,0);
 const r=M.explainLonglist(db,chiefCombat),lin=row(r,'P-A01');
 a.equal(lin.tier,'C');a.ok(codes(lin).includes('missing_domain:战斗体系'));
 a.ok(!lin.hits.some(h=>h.label.startsWith('战斗体系')));a.ok(!lin.hits.some(h=>h.evidenceIds.includes(titleSource)));
 a.deepEqual(names(r.tiers.A),['顾航']);assertTraceable(db,r);
});

test('职责来源隔离不回退到历史最高责任范围；任职来源全部失效仍解释 C',()=>{
 const db=M.seed(),need={domains:['战斗体系'],minScope:3};
 a.equal(row(M.explainLonglist(db,need),'P-A17').hits[0].jobId,'J-C14');
 M.setSourceStatus(db,'E-J-C14',true,'测试：来源隔离','测试审核人');
 let r=M.explainLonglist(db,need),x=row(r,'P-A17');
 a.equal(x.tier,'B');a.equal(x.hits[0].jobId,'J-C13');a.equal(x.latestJobId,'J-C13');
 a.ok(codes(x).includes('insufficient_scope:战斗体系'));assertTraceable(db,r);
 M.setSourceStatus(db,'E-J-C13',true,'测试：剩余来源隔离','测试审核人');
 r=M.explainLonglist(db,need);x=row(r,'P-A17');
 a.equal(x.tier,'C');a.equal(x.latestJobId,null);a.ok(codes(x).includes('no_published_jobs'));
 a.equal(r.totalPeople,26);a.equal(r.evaluatedPeople,26);
});

test('待审提案和判断层不影响解释；未发布任职、能力或失效字段不参与计算',()=>{
 const db=M.seed(),before=JSON.stringify(M.explainLonglist(db,chiefCombat));
 db.drafts.push(M.extract(M.DEMO,db));db.analyses=[];db.pool=['P-A16'];db.poolMeta={};
 a.equal(JSON.stringify(M.explainLonglist(db,chiefCombat)),before);
 for(const target of ['job','capability','domain','unknown','futureSource']){
  const copy=M.seed(),job=copy.jobs.find(j=>j.id==='J-C12'),cap=copy.capabilities.find(c=>c.jobId===job.id);
  if(target==='job')job.processStatus='待核验';
  if(target==='capability')cap.processStatus='待核验';
  if(target==='domain')for(const c of copy.fieldClaims.filter(c=>c.capabilityId===cap.id&&c.field==='capability.domain'))c.processStatus='已撤销';
  if(target==='unknown')for(const c of copy.fieldClaims.filter(c=>c.capabilityId===cap.id&&c.field==='capability.domain'))c.basis='未知';
  if(target==='futureSource')copy.evidence.find(e=>e.id==='E-J-C12').published='2027-01-01';
  const r=M.explainLonglist(copy,{domains:['战斗体系'],minScope:1}),x=row(r,'P-A16');
  a.equal(x.tier,'C',target);a.ok(codes(x).includes('missing_domain:战斗体系'),target);
  a.deepEqual(x.hits,[]);assertTraceable(copy,r);
 }
});

test('聚合按能力域区分、每原因按人去重，分母为总库去重人数而不是 A/B 人数',()=>{
 const db=M.seed();db.people.push(M.clone(db.people[0]));
 const need={domains:['战斗体系','经济系统','战斗体系'],chief:true,minScope:3,genre:'开放世界'},r=M.explainLonglist(db,need);
 a.equal(r.totalPeople,26);a.equal(r.rows.length,26);a.equal(r.evaluatedPeople,26);
 a.equal(new Set(r.gapDistribution.map(g=>g.code)).size,r.gapDistribution.length);
 a.ok(r.gapDistribution.some(g=>g.code==='missing_domain:战斗体系'));
 a.ok(r.gapDistribution.some(g=>g.code==='missing_domain:经济系统'));
 for(const g of r.gapDistribution){
  const expected=r.rows.filter(x=>x.reasons.some(v=>v.code===g.code)).map(x=>x.personId).sort();
  a.deepEqual(g.personIds,expected);a.equal(g.count,expected.length);a.equal(g.denominator,26);
  a.equal(new Set(g.personIds).size,g.count);a.ok(g.count<=g.denominator);
  if(g.domain)a.ok(g.code.endsWith(':'+g.domain));
 }
 for(const x of r.rows)a.equal(new Set(codes(x)).size,x.reasons.length);
 a.ok(r.gapDistribution.reduce((n,g)=>n+g.count,0)>r.totalPeople);
 a.match(r.notice,/多原因人数不可相加/);a.match(r.notice,/不能据此推断市场没人或 JD 过严/);
 const normalized=M.explainLonglist(db,{...need,domains:['战斗体系','经济系统']});a.deepEqual(r,normalized);
});

test('范围缺证与范围不足不混类；同域范围不足的聚合标签不冒用某人的最高范围',()=>{
 const db=M.seed();publish(db);splitScopeSource(db,'J-C12');
 M.setSourceStatus(db,'E-SCOPE-J-C12',true,'测试：范围待核验','测试审核人');
 const r=M.explainLonglist(db,{domains:['战斗体系'],minScope:3}),missing=r.gapDistribution.find(g=>g.code==='missing_scope:战斗体系'),below=r.gapDistribution.find(g=>g.code==='insufficient_scope:战斗体系');
 a.equal(missing.kind,'missing_evidence');a.equal(below.kind,'below_requirement');
 a.ok(missing.personIds.includes('P-A16'));a.ok(!below.personIds.includes('P-A16'));
 a.ok(below.personIds.includes('P-A01'));a.ok(!below.label.includes('最高责任范围'));
 a.match(below.label,/领域负责/);
});

test('任期与单来源核验只按有效字段和命中字段来源，不沿用失效记录',()=>{
 const db=M.seed(),job=db.jobs.find(j=>j.id==='J-C13'),cap=db.capabilities.find(c=>c.jobId===job.id),source=db.evidence.find(e=>e.id===job.evidenceIds[0]);
 const extra={...M.clone(source),id:'E-V32-TIME',claims:[]};db.evidence.push(extra);job.evidenceIds.push(extra.id);
 for(const c of db.fieldClaims.filter(c=>c.jobId===job.id&&['start','end'].includes(c.field)))c.sourceId=extra.id;
 M.validateDatabase(db);M.setSourceStatus(db,extra.id,true,'测试：任期字段来源失效','测试审核人');
 M.setSourceStatus(db,'E-J-C14',true,'测试：仅保留历史任职','测试审核人');
 const r=M.explainLonglist(db,{domains:[cap.domain],minScope:1}),x=row(r,'P-A17');
 a.equal(x.latestJobId,job.id);a.ok(x.checks.some(c=>c.includes('结束时间未知')));
 a.ok(!x.checks.some(c=>c.includes('最近任职已结束')));
 a.ok(x.checks.some(c=>c.includes('仅单一来源')));assertTraceable(db,r);
});

test('强校验未知字段、能力域、chief、minScope、genre；不静默过滤或类型转换',()=>{
 const invalid=[
  null,[],true,'战斗体系',new Date(),
  {...chiefCombat,unknownCondition:true},{...chiefCombat,domains:['战斗体系','未知域']},
  {...chiefCombat,domains:'战斗体系'},{...chiefCombat,domains:null},{...chiefCombat,domains:[1]},
  {...chiefCombat,domains:[undefined]},{...chiefCombat,domains:undefined},{...chiefCombat,chief:'false'},
  {...chiefCombat,chief:1},{...chiefCombat,chief:null},{...chiefCombat,chief:undefined},
  ...[0,5,-1,2.5,NaN,Infinity,'3','领域负责',null,undefined,true].map(minScope=>({...chiefCombat,minScope})),
  ...['未知项目类型','动作 ','MMO',[],{},true,null,undefined].map(genre=>({...chiefCombat,genre})),
  {...chiefCombat,title:()=>''},{...chiefCombat,title:'<b>需求</b>'},Object.assign(Object.create({chief:true}),{domains:['战斗体系']})
 ];
 for(const need of invalid)for(const fn of [M.longlist,M.explainLonglist])a.throws(()=>fn(M.seed(),need),undefined,JSON.stringify(need));
 for(const fn of [M.longlist,M.explainLonglist]){
  a.throws(()=>fn(M.seed()),/至少/);a.throws(()=>fn(M.seed(),{}),/至少/);
  a.throws(()=>fn(M.seed(),{...chiefCombat,[Symbol('条件')]:true}),/未知需求字段/);
  const accessor={...chiefCombat};Object.defineProperty(accessor,'chief',{get(){a.fail('不得执行需求访问器');},enumerable:true});
  a.throws(()=>fn(M.seed(),accessor),/访问器/);
 }
});

test('合法默认值、所有旧预设与表单元数据兼容；输出是无副作用 JSON 纯数据',()=>{
 const db=M.seed(),before=JSON.stringify(db);
 for(const preset of M.LONGLIST_PRESETS){
  const need=JSON.parse(JSON.stringify(preset)),copy=JSON.stringify(need),r=M.explainLonglist(db,need);
  a.deepEqual(JSON.parse(JSON.stringify(r)),r);a.equal(JSON.stringify(need),copy);
  a.deepEqual(M.longlist(db,need),r.rows.filter(x=>x.tier!=='C').map(withoutReasons));
  a.ok(M.longlist(db,need).every(x=>!Object.hasOwn(x,'reasons')));
  const {id,...form}=need;form.preset=id;a.deepEqual(M.explainLonglist(db,form),r);
 }
 a.deepEqual(M.explainLonglist(db,{domains:['战斗体系']}),M.explainLonglist(db,{domains:['战斗体系'],chief:false,minScope:1,genre:''}));
 a.deepEqual(M.explainLonglist(db,{chief:true}),M.explainLonglist(db,{domains:[],chief:true,minScope:1,genre:''}));
 for(const genre of ['动作','开放世界','回合制','科幻','东方玄幻','动作 MMORPG'])a.doesNotThrow(()=>M.explainLonglist(db,{...chiefCombat,genre}));
 a.equal(JSON.stringify(db),before);
 const freeze=o=>{if(o&&typeof o==='object'){for(const v of Object.values(o))freeze(v);Object.freeze(o);}return o;};
 const frozenNeed=freeze(M.clone(chiefCombat));freeze(db);a.doesNotThrow(()=>M.explainLonglist(db,frozenNeed));
});

test('无项目偏好时全部 minScope、能力域组合与主策条件保留 V3.1 分层计分及任职选择',()=>{
 const db=M.seed();
 for(const afterPublish of [false,true]){
  if(afterPublish)publish(db);
  for(const domains of [[],...M.DOMAINS.map(d=>[d]),['战斗体系','经济系统'],[...M.DOMAINS]])for(const chief of [false,true])for(const minScope of [1,2,3,4]){
   if(!domains.length&&!chief)continue;
   const need={domains,chief,minScope,genre:''},actual=M.longlist(db,need).map(r=>({personId:r.personId,tier:r.tier,score:r.score,latestJobId:r.latestJobId,hitJobIds:r.hits.map(h=>h.jobId)}));
   a.deepEqual(actual,legacySignature(db,need),JSON.stringify({afterPublish,...need}));
  }
 }
});

test('空样本库返回零分母空集合，不产生非有限数或市场结论',()=>{
 const db=M.seed();db.people=[];
 const r=M.explainLonglist(db,chiefCombat);
 a.deepEqual(r.rows,[]);a.deepEqual(r.tiers,{A:[],B:[],C:[]});a.deepEqual(r.gapDistribution,[]);
 a.equal(r.totalPeople,0);a.equal(r.evaluatedPeople,0);a.deepEqual(M.longlist(db,chiefCombat),[]);
 a.deepEqual(JSON.parse(JSON.stringify(r)),r);a.match(r.notice,/仅解释当前样本库/);
});
