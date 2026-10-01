/* V3 field evidence layer. All screens and adapters share the existing database. */
(function(root){
'use strict';
const M=root.Mapping,B={...M},VERSION=33;
// V3.1 sample/insight layers register hooks; they must be idempotent and accept partial undo snapshots.
function applyHooks(db){for(const h of (M.dataHooks||[]))h(db);return db;}
const labels={membership:'项目任职',role:'岗位',start:'开始年份',end:'结束年份',module:'职责模块',scope:'责任范围','capability.domain':'能力域','capability.scope':'能力责任范围',roleHistory:'正式头衔有效期'};
const unique=a=>[...new Set(a)];
function rawClaims(db,jobId,field){return (db.fieldClaims||[]).filter(c=>c.jobId===jobId&&(!field||c.field===field));}
function live(db,c){return c.processStatus==='已发布'&&c.basis!=='未知'&&B.sourceUsable(db,db.evidence.find(e=>e.id===c.sourceId));}
function fieldClaims(db,jobId,field){return rawClaims(db,jobId,field).filter(c=>live(db,c));}
function addClaim(db,j,field,value,e,quote,basis='原文明确',extra={}){
 if(!quote||!e.text.includes(quote))return;
 if(db.fieldClaims.some(c=>c.jobId===j.id&&c.field===field&&c.sourceId===e.id&&JSON.stringify(c.value)===JSON.stringify(value)&&c.validFrom===extra.validFrom&&c.validTo===extra.validTo))return;
 db.fieldClaims.push({id:M.id('CL'),jobId:j.id,personId:j.personId,projectId:j.projectId,field,value,sourceId:e.id,quote,basis,precision:['start','end','roleHistory'].includes(field)?'年':'原文范围',processStatus:'已发布',factStatus:basis==='原文明确'?M.SINGLE:'待核验',limitations:basis==='推定边界'?'2023仅是推定最后完整年，2024迁移边界月份未知；不可作为精确离任截止。':basis==='职责标准化'?'依据职责归类，不证明正式岗位头衔。':'',...extra});
}
function buildClaims(db){
 db.fieldClaims=db.fieldClaims||[];
 for(const j of db.jobs){
  for(const eid of j.evidenceIds){const e=db.evidence.find(x=>x.id===eid);if(!e)continue;
   for(const c of (e.claims||[]).filter(c=>c.objectId===j.id)){
    const h=(j.roleHistory||[]).find(h=>h.role===c.role&&h.start===c.start&&h.end===c.end&&h.evidenceIds.includes(e.id));
    if(h){addClaim(db,j,'roleHistory',h.role,e,c.quote,'原文明确',{validFrom:h.start,validTo:h.end});continue;}
    // Only a matching base-employment claim can support the base fields.
    if(c.role!==j.role||c.start!==j.start||c.end!==j.end)continue;
    const inferred=j.personId==='P-A01'&&j.projectId==='G-A1'&&/2024年转至/.test(e.text);
    addClaim(db,j,'membership',j.projectId,e,c.quote);
    addClaim(db,j,'role',j.role,e,c.quote,j.role.includes('待核验')?'职责标准化':'原文明确');
    addClaim(db,j,'start',j.start,e,c.quote);
    addClaim(db,j,'end',j.end,e,inferred?e.text:c.quote,j.end===null?'未知':inferred?'推定边界':'原文明确',{transitionYear:inferred?2024:null});
    for(const f of ['module','scope'])if(c[f]===j[f])addClaim(db,j,f,j[f],e,c.quote,/未知/.test(j[f])?'未知':'原文明确');
   }
  }
  for(const cap of db.capabilities.filter(c=>c.jobId===j.id))for(const eid of cap.evidenceIds){const e=db.evidence.find(e=>e.id===eid);if(e){addClaim(db,j,'capability.domain',cap.domain,e,cap.quote,'原文明确',{capabilityId:cap.id});addClaim(db,j,'capability.scope',cap.scope,e,cap.quote,'原文明确',{capabilityId:cap.id});}}
 }
 return db;
}
function migrateDatabase(original){
 if(original.dataVersion===VERSION){validateDatabase(original);return M.clone(original);}
 const db=original.dataVersion>=30?M.clone(original):B.migrateDatabase(original);
 applyHooks(db);for(const l of db.logs)if(l.before)applyHooks(l.before);
 buildClaims(db);db.dataVersion=VERSION;
 // Existing claims (including withdrawals) keep their IDs; only newly seeded jobs gain mappings.
 // Undo snapshots need the same treatment, or restoring an old revision would silently drop new sample jobs.
 for(const l of db.logs)if(l.before){const historical={...db,...l.before,fieldClaims:Array.isArray(l.before.fieldClaims)?l.before.fieldClaims:[]};buildClaims(historical);l.before.fieldClaims=historical.fieldClaims;}
 db.migration={...(db.migration||{}),from:original.dataVersion||'V2',to:'V3.3.0',recordedAt:M.now(),fieldClaims:db.fieldClaims.length,note:'保留事实、证据ID、审核进度、需求与历史日志；并入 V3.3 组织分析所需的虚构样本（含职级冲突、兼任、回流、外包归属不明、同名与二手转述等真实 mapping 常见情形）。新增能力域只影响新样本，不改写既有能力归类。'};
 validateDatabase(db);return db;
}
function seed(){const db=applyHooks(B.seed());buildClaims(db);db.dataVersion=VERSION;return db;}
function loadState(storage){const current=storage.getItem(M.KEY),legacy=storage.getItem(M.LEGACY_KEY);if(!current)return {db:seed(),legacy,needsChoice:!!legacy,migrationRequired:false};const db=JSON.parse(current);validateDatabase(db);return {db,legacy,needsChoice:false,migrationRequired:db.dataVersion!==VERSION};}
function publishedJobs(db){return db.jobs.filter(j=>j.processStatus==='已发布'&&(fieldClaims(db,j.id,'membership').length||fieldClaims(db,j.id,'roleHistory').length));}
function capabilitiesFor(db,j){return db.capabilities.filter(c=>c.jobId===j.id&&c.processStatus==='已发布'&&fieldClaims(db,j.id,'capability.domain').some(f=>f.capabilityId===c.id&&f.value===c.domain&&c.evidenceIds.includes(f.sourceId)));}
function roleAt(j,year='all',db){if(!db)return B.roleAt(j,year);const hs=fieldClaims(db,j.id,'roleHistory').filter(h=>year==='all'||+year>=h.validFrom&&+year<=h.validTo);if(hs.length){const h=hs.at(-1);return h.value+(year==='all'?`（${h.validFrom}–${h.validTo}）`:'');}return fieldClaims(db,j.id,'role').at(-1)?.value||'岗位证据待核验';}
function timeMatch(db,j,year){
 if(!year||year==='all')return {match:true,confirmed:true,claims:[]};const y=+year;
 const hs=fieldClaims(db,j.id,'roleHistory').filter(c=>y>=c.validFrom&&y<=c.validTo);
 const starts=fieldClaims(db,j.id,'start'),ends=fieldClaims(db,j.id,'end'),start=starts.at(-1),end=ends.at(-1);
 if(start&&y>=start.value){if(end?.basis==='推定边界')return {match:y<=end.transitionYear,confirmed:false,claims:[start,end],warning:'任期末年为推定边界；该年是否仍在职待核验。'};if(!end)return {match:true,confirmed:false,claims:[start],warning:'结束时间未知，仅最近已知，不确认仍在职。'};if(y<=end.value)return {match:true,confirmed:true,claims:[start,end]};}
 return {match:hs.length>0,confirmed:hs.length>0,claims:hs};
}
function timeText(j,db){if(!j.id||!db)return `${j.start}–${j.end??'结束未知'}（年）`;const start=fieldClaims(db,j.id,'start').at(-1),end=fieldClaims(db,j.id,'end').at(-1);if(end?.basis==='推定边界')return `${start?.value??'开始未知'}年加入；${end.value}为推定最后完整年（2024迁移边界待核验）`;if(!start){const h=fieldClaims(db,j.id,'roleHistory').at(-1);return h?`${h.validFrom}–${h.validTo}年（仅头衔证据覆盖；其他任期未知）`:'任期字段证据不足';}return `${start.value}–${end?.value??'结束未知'}（年）`;}
function projectJobs(db,pid,year='all'){return publishedJobs(db).filter(j=>j.projectId===pid&&(year==='all'||timeMatch(db,j,year).match)&&!(year!=='all'&&fieldClaims(db,j.id,'end').some(c=>c.basis==='推定边界'&&+year>c.value)));}
function queryMatches(db,q={}){
 const text=q.text?.trim()||'',combat=q.combat||text.includes('战斗'),chief=q.chief||text.includes('主策'),leader=text.includes('组长');
 const factSet=(j,anchor)=>{let claims=[...fieldClaims(db,j.id,'membership')];if(anchor){if(combat||q.capability)claims.push(...fieldClaims(db,j.id,'capability.domain').filter(c=>capabilitiesFor(db,j).some(x=>x.id===c.capabilityId)&&((combat&&c.value==='战斗体系')||c.value===q.capability)));if(leader)claims.push(...fieldClaims(db,j.id,'roleHistory').filter(c=>(!q.year||+q.year>=c.validFrom&&+q.year<=c.validTo)&&c.value.includes('组长')),...fieldClaims(db,j.id,'role').filter(c=>c.value.includes('组长')));if(q.year)claims.push(...timeMatch(db,j,q.year).claims);}else claims.push(...fieldClaims(db,j.id,'role').filter(c=>c.value==='主策'));return unique(claims.map(c=>c.id)).map(id=>claims.find(c=>c.id===id));};
 return db.people.flatMap(p=>{const js=publishedJobs(db).filter(j=>j.personId===p.id),anchor=js.filter(j=>(!q.project||j.projectId===q.project)&&(!q.company||db.projects.find(g=>g.id===j.projectId).companyId===q.company)&&timeMatch(db,j,q.year).match&&(!q.capability||capabilitiesFor(db,j).some(c=>c.domain===q.capability))&&(!combat||capabilitiesFor(db,j).some(c=>c.domain==='战斗体系'))&&(!leader||roleAt(j,q.year||'all',db).includes('组长'))),chiefRows=js.filter(j=>fieldClaims(db,j.id,'role').some(c=>c.value==='主策'));
 let primary=chief&&(q.mode==='same'||!(combat||q.capability||leader))?anchor.filter(j=>chiefRows.includes(j)):anchor;if(!primary.length||chief&&!chiefRows.length)return [];
 if(text&&!combat&&!chief&&!leader&&!([p.name,...(p.aliases||[]),...primary.map(j=>roleAt(j,'all',db)+' '+db.projects.find(g=>g.id===j.projectId).name)].join(' ').includes(text)))return [];
 const make=(label,rows,isAnchor)=>{let claims=rows.flatMap(j=>factSet(j,isAnchor));if(isAnchor&&chief&&(q.mode==='same'||!(combat||q.capability||leader)))claims.push(...rows.flatMap(j=>fieldClaims(db,j.id,'role').filter(c=>c.value==='主策')));return {label,jobIds:rows.map(j=>j.id),claimIds:unique(claims.map(c=>c.id)),evidenceIds:unique(claims.map(c=>c.sourceId))};};
 const groups=[make([q.company&&'公司',q.project&&'项目',q.year&&'年份',q.capability,combat&&'战斗职责',leader&&'正式组长',chief&&(q.mode==='same'||!(combat||q.capability||leader))&&'主策'].filter(Boolean).join('＋')||'已发布经历',primary,true)];if(chief&&q.mode!=='same'&&(combat||q.capability||leader))groups.push(make('经历②：主策岗位',chiefRows,false));
 return [{person:p,personId:p.id,groups,jobIds:unique(groups.flatMap(g=>g.jobIds)),timeConfirmed:primary.every(j=>timeMatch(db,j,q.year).confirmed),uncertainties:unique(primary.flatMap(j=>[timeMatch(db,j,q.year).warning,fieldClaims(db,j.id,'end').some(c=>c.basis==='推定边界')?'2023为推定最后完整年，不能视作精确离任时间。':null]).filter(Boolean))}];});
}
function publish(original,input){
 const db=M.clone(original),beforeClaims=M.clone(db.fieldClaims||[]);
 if(input.mode==='ambiguous')return publishAmbiguous(original,input);
 // Templates can be corrected in review, but a note cannot create an unsupported title.
 const template=B.extract(input.text,db);for(let i=0;i<input.facts.length;i++){const f=input.facts[i],t=template.facts[i];if(f.decision==='accept'&&t&&['role','start','end','scope','module','domain'].some(k=>JSON.stringify(f.value[k])!==JSON.stringify(t.value[k])))throw new Error('修订岗位、时间或职责必须另有字段原文依据；本模拟样本不能凭审核理由添加事实。');}
 const result=B.publish(db,input);buildClaims(db);db.dataVersion=VERSION;const log=db.logs.at(-1);log.before.fieldClaims=beforeClaims;log.changes.push({objectId:input.personId,field:'新增字段主张',old:beforeClaims.map(c=>c.id),new:db.fieldClaims.map(c=>c.id),effective:'依各字段时间精度'});validateDatabase(db);Object.assign(original,db);return result;
}
function stateSnapshot(db){return M.clone({people:db.people,jobs:db.jobs,capabilities:db.capabilities,relationships:db.relationships,events:db.events,tasks:db.tasks,fieldClaims:db.fieldClaims});}
function log(db,type,reason,before,changes,evidenceIds=[]){db.logs.push({id:M.id('L'),revision:++db.revision,type,reason,before,changes,evidenceIds,actor:'HRBP（演示）',date:M.now()});}
function reviewRelation(original,rid,decision,note,material){
 const db=M.clone(original),r=db.relationships.find(x=>x.id===rid);if(!r)throw new Error('关系不存在');if(!note?.trim())throw new Error('请填写审核意见');if(!['confirm','reject','defer'].includes(decision))throw new Error('无效审核动作');const before=stateSnapshot(db),old=M.clone(r);let source=null;
 if(decision==='confirm'){
  if(!material||typeof material!=='object'||['kind','title','published','collected','text','quote','independence','reviewer'].some(k=>typeof material[k]!=='string'||!material[k].trim())||material.approved!==true)throw new Error('请补充明确来源元数据、完整原文及审核人，并人工批准显示；一句话不足以确认。');
  B.validateSourceDates(material,db.observationDate);if(!(material.text+' '+material.title).includes(db.projects.find(p=>p.id===r.projectId).name))throw new Error('来源标题或全文必须明确对应项目，不能跨项目确认关系');if(!material.text.includes(material.quote))throw new Error('关系引文不能在来源全文中定位');
  if(!Number.isInteger(material.start)||material.start<db.projects.find(p=>p.id===r.projectId).start||material.start>2026||material.end!=null&&(!Number.isInteger(material.end)||material.end<material.start||material.end>2026))throw new Error('关系有效期无效');
  const a=db.people.find(p=>p.id===r.subjectId).name,b=db.people.find(p=>p.id===r.objectId).name,q=material.quote;if(!q.includes(String(material.start)))throw new Error('引文须明确关系开始年份；不能凭表单日期创造有效期');if(material.end!=null&&!q.includes(String(material.end)))throw new Error('引文须明确关系结束年份');
  const clear=r.type==='直接汇报'?q.includes(a+'直接向'+b+'汇报')&&/行政|直属|直线管理/.test(q):q.includes(a)&&q.includes(b)&&/共同|合作/.test(q);
  if(!clear||/并非|不是|不构成|未确认|未说明|不代表|没有|否认|传闻|据说|可能|待核验/.test(q))throw new Error('引文不足以支持行政直接汇报或明确合作；汇报方案仍应待核验。');
  source=db.evidence.find(e=>e.text===material.text);if(source&&['kind','title','published','collected','independence'].some(k=>source[k]!==material[k]))throw new Error('相同原文的来源元数据不一致，请核对已存来源，不能静默覆盖。');if(source?.quarantined)throw new Error('该原文来源已隔离，不能重复创建以绕过核验');
  if(!source){source={id:M.id('E'),source:material.title,title:material.title,kind:material.kind,nature:'演示补充证据',published:material.published,collected:material.collected,text:material.text,quote:material.quote,independence:material.independence,fiction:true,quality:'人工审核的演示材料；格式检查不代表真实性核实',factStatus:M.SINGLE,recordedAt:M.now()};db.evidence.push(source);}
  r.processStatus='已发布';r.factStatus=M.SINGLE;r.start=material.start;r.end=material.end;r.evidenceIds=unique([...r.evidenceIds,source.id]);r.approval={sourceId:source.id,quote:q,reviewer:material.reviewer,approved:true,start:r.start,end:r.end};
 }else{r.processStatus=decision==='reject'?'已拒绝':'待核验';r.factStatus=decision==='reject'?'不建立该关系':'待核验';}
 r.reviews=r.reviews||[];r.reviews.push({id:M.id('RR'),decision,note,sourceId:source?.id||null,quote:material?.quote||null,metadata:source?{kind:source.kind,title:source.title,published:source.published,collected:source.collected,independence:source.independence,start:material.start,end:material.end}:null,reviewer:material?.reviewer||'HRBP（演示）',date:M.now()});r.reviewNote=note;r.reviewedAt=M.now();r.reviewer=material?.reviewer||'HRBP（演示）';
 let t=db.tasks.find(t=>t.relationId===rid);if(!t){t={id:M.id('T'),relationId:rid,projectId:r.projectId,title:'关系核验：'+r.type,owner:r.reviewer,evidenceIds:r.evidenceIds};db.tasks.push(t);}t.status=decision==='defer'?'待核验':'已处理';t.resolution=note;
 log(db,'关系审核',note,before,[{objectId:rid,field:'演示批准与来源元数据',old,new:M.clone(r),effective:`${r.start}–${r.end??'未知'}`}],r.evidenceIds);validateDatabase(db);Object.assign(original,db);
}
function relationshipView(db,r){if(r.processStatus!=='已发布'||r.type==='同项目'||r.id==='R-B1'&&r.evidenceIds.some(id=>B.sourceUsable(db,db.evidence.find(e=>e.id===id))))return r;if(!r.approval||!B.sourceUsable(db,db.evidence.find(e=>e.id===r.approval.sourceId)))return {...r,processStatus:'待核验',factStatus:'来源审核不足',gap:r.gap+' 旧批准或已隔离来源不能作为有效关系确认。'};return r;}
function projectRelations(db,pid,year='all'){return db.relationships.map(r=>relationshipView(db,r)).filter(r=>r.projectId===pid&&!['已拒绝','已撤销'].includes(r.processStatus)&&B.active(r,year));}
function setSourceStatus(original,eid,quarantined,reason,reviewer){const db=M.clone(original),e=db.evidence.find(x=>x.id===eid);if(!e||!reason?.trim()||!reviewer?.trim())throw new Error('来源、原因和审核人必填');if(!quarantined)B.validateSourceDates(e,db.observationDate);const old={quarantined:!!e.quarantined,quarantineReason:e.quarantineReason||''},before=stateSnapshot(db);e.quarantined=quarantined;e.quarantineReason=quarantined?reason:'';log(db,'来源隔离',reason,before,[{objectId:eid,field:'来源可用性',old,new:{quarantined,quarantineReason:e.quarantineReason},effective:db.observationDate}],[eid]);db.logs.at(-1).previousSourceState={id:eid,...old};db.logs.at(-1).actor=reviewer;Object.assign(original,db);}
function undo(db){const l=[...db.logs].reverse().find(l=>l.before&&!l.undone&&l.type!=='撤销');B.undo(db);if(l?.previousSourceState){const {id,...state}=l.previousSourceState;Object.assign(db.evidence.find(e=>e.id===id),state);}if(!db.fieldClaims)buildClaims(db);}
function validateDatabase(db){
 const structural=M.clone(db);if(db.dataVersion>=21)structural.dataVersion=21;B.validateDatabase(structural);if(db.dataVersion!==VERSION)return true;
 if(!Array.isArray(db.fieldClaims))throw new Error('缺少字段主张集合');if(new Set(db.fieldClaims.map(c=>c.id)).size!==db.fieldClaims.length)throw new Error('重复主张ID');
 for(const c of db.fieldClaims){const j=db.jobs.find(j=>j.id===c.jobId),e=db.evidence.find(e=>e.id===c.sourceId);if(!j||!e||!labels[c.field]||typeof c.quote!=='string'||!c.quote||!e.text.includes(c.quote)||c.personId!==j.personId||c.projectId!==j.projectId)throw new Error('字段主张引用或原文无效');if(!['原文明确','推定边界','未知','职责标准化'].includes(c.basis)||!['已发布','待核验','已撤销','已拒绝'].includes(c.processStatus))throw new Error('字段主张状态无效');
  if(['role','start','end','module','scope'].includes(c.field)&&JSON.stringify(c.value)!==JSON.stringify(j[c.field]))throw new Error('字段主张值与任职不一致');if(c.field==='membership'&&c.value!==j.projectId)throw new Error('项目主张不一致');if(c.field.startsWith('capability.')&&!db.capabilities.some(cap=>cap.id===c.capabilityId&&cap.jobId===j.id&&cap[c.field.split('.')[1]]===c.value&&cap.evidenceIds.includes(c.sourceId)))throw new Error('能力主张引用无效');if(c.field==='roleHistory'&&!(j.roleHistory||[]).some(h=>h.role===c.value&&h.start===c.validFrom&&h.end===c.validTo&&h.evidenceIds.includes(c.sourceId)))throw new Error('头衔主张时期无效');}
 for(const r of db.relationships)if(r.approval){const e=db.evidence.find(e=>e.id===r.approval.sourceId);if(!e||!e.text.includes(r.approval.quote)||!r.approval.reviewer||r.approval.approved!==true||['kind','title','published','collected','independence'].some(k=>!e[k]))throw new Error('关系来源审核元数据无效');}
 return true;
}
function publishAmbiguous(original,d){if(!['待审核','部分发布'].includes(d.status))throw new Error('提案已处理');if(d.facts.some(f=>f.decision==='accept'))throw new Error('花名身份和岗位说法未核实，不可仅选择已有ID强行合并；请暂缓或拒绝。');const db=M.clone(original),before=stateSnapshot(db),next=M.clone(d);let source=db.evidence.find(e=>e.text===d.text);if(!source){source={id:M.id('E'),text:d.text,source:d.source,title:'花名身份与岗位线索',kind:d.source,published:d.published,collected:db.observationDate,independence:'未核实',nature:'虚构演示',fiction:true,factStatus:'待核验',recordedAt:M.now()};db.evidence.push(source);}const summary={added:0,updated:0,deferred:0,rejected:0};for(const f of next.facts){if(f.status==='已拒绝')continue;if(!['defer','reject'].includes(f.decision))throw new Error('未知身份提案需暂缓或拒绝');f.status=f.decision==='reject'?'已拒绝':'待核验';summary[f.decision==='reject'?'rejected':'deferred']++;if(f.decision==='defer'&&!db.tasks.some(t=>t.factId===f.id))db.tasks.push({id:M.id('T'),factId:f.id,draftId:d.id,title:'花名身份与岗位线索待核验',reason:f.note,owner:'HRBP',status:'待核验',evidenceIds:[source.id]});}next.status=next.facts.every(f=>f.status==='已拒绝')?'已拒绝':'部分发布';const i=db.drafts.findIndex(x=>x.id===d.id);if(i<0)db.drafts.push(next);else db.drafts[i]=next;log(db,'身份线索审核','未写入任何正式任职',before,[{objectId:d.id,field:'提案处理',old:d.status,new:next.status,effective:'无正式事实变更'}],[source.id]);db.logs.at(-1).draftId=d.id;db.logs.at(-1).draftBefore=M.clone(original.drafts.find(x=>x.id===d.id)||d);validateDatabase(db);Object.assign(original,db);return summary;}
Object.assign(M,{DATA_VERSION:VERSION,buildClaims,fieldLabels:labels,rawClaims,fieldClaims,claimUsable:live,seed,migrateDatabase,loadState,publishedJobs,capabilitiesFor,roleAt,timeMatch,timeText,projectJobs,projectPeople:(db,pid,year)=>unique(projectJobs(db,pid,year).map(j=>j.personId)),queryMatches,query:(db,q)=>queryMatches(db,q).map(r=>r.person),publish,reviewRelation,relationshipView,projectRelations,reports:db=>db.relationships.map(r=>relationshipView(db,r)).filter(r=>r.type==='直接汇报'&&r.processStatus==='已发布'),setSourceStatus,undo,validateDatabase});
})(typeof window!=='undefined'?window:globalThis);
