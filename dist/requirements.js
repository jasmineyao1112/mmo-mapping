/* V3.2 working records: requirements, versioned briefs and frozen deliveries.
   They never write jobs/claims/relations and never participate in fact queries. */
(function(root){
'use strict';
const M=root.Mapping,B={...M},STATUSES=['开放','已交付','已关闭'],DECISIONS=['待评估','建议研究','同意接触','暂不推进'];
const INTENT=/(强意向|意向强|可挖|好挖|想跳槽|愿意跳槽|在看机会|求职意向(高|强|明确))/;
const CONTACT=/(\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|(?:\+?\d[\s-]*){8,}|(?:微信|电话|手机|wechat|phone)\s*[:：])/i;
function text(v,max=600,required=false){if(typeof v!=='string'||/[<>]/.test(v)||v.length>max||required&&!v.trim())throw new Error('请填写规定长度内的纯文本');if(INTENT.test(v)||CONTACT.test(v))throw new Error('需求工作记录不接受意向推断或联系方式');return v.trim();}
function stamp(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString()===s;}
function list(a,label){if(!Array.isArray(a))throw new Error('无效集合：'+label);return a;}
function distinct(a,key='id'){if(new Set(a.map(x=>key?x[key]:x)).size!==a.length)throw new Error('重复记录或ID');}
function obj(v,keys){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k)))throw new Error('未知字段或无效对象');}
function conditions(c){obj(c,['domains','minScope','chief','genre']);M.explainLonglist({people:[],jobs:[],fieldClaims:[],evidence:[]},c);return {domains:[...new Set(c.domains||[])].sort(),minScope:c.minScope??1,chief:c.chief??false,genre:c.genre??''};}
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function header(input){obj(input,['title','conditions','owner','requester','status','reason']);if(!STATUSES.includes(input.status))throw new Error('无效需求状态');return {title:text(input.title,80,true),conditions:conditions(input.conditions),owner:text(input.owner,40,true),requester:text(input.requester,40,true),status:input.status};}
const headOf=r=>({title:r.title,conditions:r.conditions,owner:r.owner,requester:r.requester,status:r.status});
function req(db,id){const r=db.requirements.find(r=>r.id===id);if(!r)throw new Error('需求不存在');return r;}
function hook(db){if(Array.isArray(db.companies)&&!Object.hasOwn(db,'requirements'))db.requirements=[];return db;}
(M.dataHooks=M.dataHooks||[]).push(hook);
function audit(db,type,r,old,next,reason){db.logs.push({id:M.id('L'),revision:++db.revision,type,reason,before:null,changes:[{objectId:r.id,field:'需求工作记录',old,new:next,effective:'仅工作层；不改变事实'}],evidenceIds:[],actor:r.owner,date:M.now()});}
function transaction(original,fn){const db=M.clone(original),result=fn(db);validateDatabase(db);Object.assign(original,db);return M.clone(result);}
function saveRequirement(original,id,input){return transaction(original,db=>{
 const h=header(input),at=M.now(),reason=text(input.reason||'',600,!!id);
 if(!id){const r={id:M.id('REQ'),...h,createdAt:at,updatedAt:at,version:1,versions:[{version:1,...M.clone(h),updatedAt:at,reason:reason||'新建需求'}],deliveries:[],businessFeedback:[],calibrations:[],poolPersonIds:[]};db.requirements.push(r);audit(db,'需求创建',r,null,h,'新建需求');return r;}
 const r=req(db,id),before=M.clone(headOf(r));if(equal(before,h))throw new Error('需求内容未变化，无需新增版本');
 const previousVersion=r.version;Object.assign(r,h,{version:r.version+1,updatedAt:at});r.versions.push({version:r.version,...M.clone(h),updatedAt:at,reason});
 for(const field of ['domains','minScope','chief','genre'])if(!equal(before.conditions[field],h.conditions[field]))r.calibrations.push({id:M.id('CAL'),date:at,fromVersion:previousVersion,toVersion:r.version,field,before:before.conditions[field],after:h.conditions[field],trigger:reason,actor:r.owner});
 audit(db,'需求更新',r,before,h,reason);return r;
 });}
function restoreRequirementVersion(original,id,version,reason){const r=req(original,id),v=r.versions.find(v=>v.version===version);if(!v)throw new Error('需求版本不存在');return saveRequirement(original,id,{...M.clone(headOf(v)),reason:text(reason,600,true)});}
function requirementDiff(db,id){const r=req(db,id),current=M.explainLonglist(db,r.conditions),last=r.deliveries.at(-1),previous=new Map((last?.rows||[]).map(x=>[x.personId,x.tier]));return {current,last:last||null,changes:last?current.rows.filter(x=>previous.get(x.personId)!==x.tier).map(x=>({personId:x.personId,name:x.person.name,before:previous.get(x.personId)||'未收录',after:x.tier})):[]};}
function deliverRequirement(original,id){return transaction(original,db=>{
 const r=req(db,id);if(r.status==='已关闭')throw new Error('已关闭需求不能交付；请先重新开放');const report=M.explainLonglist(db,r.conditions),last=r.deliveries.at(-1);
 if(last&&last.requirementVersion===r.version&&equal(last.rows,report.rows)&&equal(last.gapDistribution,report.gapDistribution))throw new Error('该版本及名单未变化，不重复记录交付');
 const claimIds=[...new Set(report.rows.flatMap(x=>x.hits.flatMap(h=>h.claimIds)))],claimSnapshots=claimIds.map(id=>M.clone(db.fieldClaims.find(c=>c.id===id))),sources=[...new Set(claimSnapshots.map(c=>c.sourceId))];
 const d={id:M.id('DEL'),createdAt:M.now(),requirementVersion:r.version,conditionsSnapshot:M.clone(r.conditions),dataRevision:db.revision,observationDate:db.observationDate,totalPeople:report.totalPeople,rows:M.clone(report.rows),gapDistribution:M.clone(report.gapDistribution),tierA:report.tiers.A.map(x=>x.personId),tierB:report.tiers.B.map(x=>x.personId),tierC:report.tiers.C.map(x=>x.personId),claimSnapshots,sourceSnapshots:sources.map(id=>M.clone(db.evidence.find(e=>e.id===id)))};
 r.deliveries.push(d);audit(db,'长名单交付',r,null,{deliveryId:d.id,requirementVersion:r.version,tierA:d.tierA,tierB:d.tierB,tierC:d.tierC},'冻结本次名单与证据；仅记录交付，未发送给任何人');return d;
 });}
function saveRequirementFeedback(original,id,input){return transaction(original,db=>{
 obj(input,['deliveryId','personId','decision','reason','actor']);const r=req(db,id),d=r.deliveries.find(d=>d.id===input.deliveryId);if(!d||!d.rows.some(x=>x.personId===input.personId))throw new Error('反馈必须关联交付批次中的人物');if(!DECISIONS.includes(input.decision))throw new Error('无效业务反馈');
 const f={id:M.id('FB'),date:M.now(),deliveryId:d.id,personId:input.personId,decision:input.decision,reason:text(input.reason,600,true),actor:text(input.actor,40,true)};r.businessFeedback.push(f);audit(db,'业务反馈',r,null,f,'人工记录的业务评价；不代表候选人意向');return f;
 });}
function linkRequirementPerson(original,id,pid){return transaction(original,db=>{const r=req(db,id);if(!db.people.some(p=>p.id===pid))throw new Error('未知人员');if(r.status==='已关闭')throw new Error('已关闭需求不能新增人才池关联');const already=r.poolPersonIds.includes(pid)&&db.pool.includes(pid);if(already)throw new Error('已关联此需求的人才池');if(!db.pool.includes(pid))M.poolAdd(db,pid,{reason:'来自需求：'+r.title});if(!r.poolPersonIds.includes(pid))r.poolPersonIds.push(pid);audit(db,'需求人才池关联',r,null,{personId:pid},'同一人可以关联多个需求，不覆盖既有跟进');return r;});}
function requirementPool(db,id){const r=req(db,id);return M.poolItems(db).filter(x=>r.poolPersonIds.includes(x.personId));}
function deliveryWarnings(db,d){const bad=d.sourceSnapshots.filter(e=>!M.sourceUsable(db,db.evidence.find(x=>x.id===e.id))).map(e=>e.id);const revoked=d.claimSnapshots.filter(c=>{const now=db.fieldClaims.find(x=>x.id===c.id);return !now||!M.claimUsable(db,now);}).map(c=>c.id);return {sourceIds:bad,claimIds:revoked,historical:true};}
function checkReport(db,d){
 list(d.rows,'交付名单');distinct(d.rows,'personId');if(d.totalPeople!==d.rows.length)throw new Error('交付分母与名单不符');
 for(const row of d.rows){if(!db.people.some(p=>p.id===row.personId)||row.person?.id!==row.personId||!['A','B','C'].includes(row.tier))throw new Error('交付人物或分层无效');list(row.hits,'命中依据');list(row.gaps,'缺口');list(row.checks,'核验提示');list(row.reasons,'原因');if(row.tier==='C'&&!row.reasons.length)throw new Error('C层必须有原因');}
 for(const tier of ['A','B','C']){list(d['tier'+tier],'分层ID');if(!equal(d['tier'+tier],d.rows.filter(x=>x.tier===tier).map(x=>x.personId)))throw new Error('交付分层不一致');}
 list(d.claimSnapshots,'字段快照');distinct(d.claimSnapshots);list(d.sourceSnapshots,'来源快照');distinct(d.sourceSnapshots);
 for(const e of d.sourceSnapshots)if(!db.evidence.some(x=>x.id===e.id)||typeof e.text!=='string')throw new Error('交付来源快照无效');
 const knownClaims=new Set([...db.fieldClaims.map(c=>c.id),...db.logs.flatMap(l=>[...(l.before?.fieldClaims||[]).map(c=>c.id),...(l.changes||[]).filter(c=>c.field==='新增字段主张').flatMap(c=>Array.isArray(c.new)?c.new:[])])]);
 for(const c of d.claimSnapshots){const e=d.sourceSnapshots.find(e=>e.id===c.sourceId);if(!knownClaims.has(c.id)||!e||typeof c.quote!=='string'||!c.quote||!e.text.includes(c.quote))throw new Error('交付字段不存在或引文不能定位');}
 const map=new Map();for(const row of d.rows){for(const h of row.hits){list(h.claimIds,'字段ID');list(h.evidenceIds,'来源ID');list(h.scopeClaimIds,'范围字段ID');list(h.scopeEvidenceIds,'范围来源ID');if(!h.claimIds.length||h.claimIds.some(id=>!d.claimSnapshots.some(c=>c.id===id&&c.personId===row.personId&&c.jobId===h.jobId&&c.projectId===h.projectId)))throw new Error('交付命中依据缺失');
 const cs=h.claimIds.map(id=>d.claimSnapshots.find(c=>c.id===id)),sc=cs.filter(c=>c.field==='capability.scope');
 if(!equal([...new Set(cs.map(c=>c.sourceId))].sort(),[...h.evidenceIds].sort())||!equal(sc.map(c=>c.id).sort(),[...h.scopeClaimIds].sort())||!equal([...new Set(sc.map(c=>c.sourceId))].sort(),[...h.scopeEvidenceIds].sort()))throw new Error('交付字段与范围来源不一致');}
 for(const g of row.reasons){if(typeof g.code!=='string'||!['missing_evidence','below_requirement','preference'].includes(g.kind)||typeof g.label!=='string')throw new Error('原因分类无效');if(!map.has(g.code))map.set(g.code,{kind:g.kind,ids:new Set()});map.get(g.code).ids.add(row.personId);}}
 list(d.gapDistribution,'原因分布');distinct(d.gapDistribution,'code');if(map.size!==d.gapDistribution.length)throw new Error('原因分布不完整');for(const g of d.gapDistribution){const m=map.get(g.code);if(!m||g.kind!==m.kind||g.denominator!==d.totalPeople||g.count!==m.ids.size||!equal([...m.ids].sort(),[...list(g.personIds,'原因人员')].sort()))throw new Error('原因分母或人数不符');}
}
function validateDatabase(db){
 B.validateDatabase(db);if(db.dataVersion!==M.DATA_VERSION)return true;list(db.requirements,'requirements');distinct(db.requirements);const globalIds=new Set();
 for(const r of db.requirements){text(r.id,100,true);if(!stamp(r.createdAt)||!stamp(r.updatedAt)||r.updatedAt<r.createdAt)throw new Error('需求时间无效');header(headOf(r));list(r.versions,'需求版本');if(!Number.isInteger(r.version)||r.version<1||r.versions.length!==r.version)throw new Error('需求版本不连续');
 for(const [i,v] of r.versions.entries()){header(headOf(v));text(v.reason,600,true);if(v.version!==i+1||!stamp(v.updatedAt)||v.updatedAt<r.createdAt)throw new Error('历史需求版本无效');}if(!equal(headOf(r),headOf(r.versions.at(-1))))throw new Error('当前需求与最新版本不符');
 list(r.poolPersonIds,'需求人才池');distinct(r.poolPersonIds,null);if(r.poolPersonIds.some(id=>!db.people.some(p=>p.id===id)))throw new Error('需求人才池引用无效');
 for(const k of ['deliveries','businessFeedback','calibrations'])for(const x of list(r[k],k)){text(x.id,100,true);if(globalIds.has(x.id))throw new Error('重复工作记录ID');globalIds.add(x.id);}
 for(const d of r.deliveries){const v=r.versions.find(v=>v.version===d.requirementVersion);if(!v||!equal(conditions(d.conditionsSnapshot),v.conditions)||!stamp(d.createdAt)||d.createdAt<r.createdAt||!Number.isInteger(d.dataRevision)||d.dataRevision<0)throw new Error('交付版本、条件或时间无效');M.validateSourceDates({published:d.observationDate,collected:d.observationDate},d.observationDate);checkReport(db,d);}
 for(const f of r.businessFeedback){const d=r.deliveries.find(d=>d.id===f.deliveryId);if(!d||!d.rows.some(x=>x.personId===f.personId)||!DECISIONS.includes(f.decision)||!stamp(f.date)||f.date<d.createdAt)throw new Error('业务反馈引用或状态无效');text(f.reason,600,true);text(f.actor,40,true);}
 for(const c of r.calibrations){const a=r.versions.find(v=>v.version===c.fromVersion),b=r.versions.find(v=>v.version===c.toVersion);if(!a||!b||c.toVersion!==c.fromVersion+1||!['domains','minScope','chief','genre'].includes(c.field)||!equal(a.conditions[c.field],c.before)||!equal(b.conditions[c.field],c.after)||!stamp(c.date))throw new Error('条件调整记录无效');text(c.trigger,600,true);text(c.actor,40,true);}
 }
 return true;
}
function migrateDatabase(original){B.validateDatabase(original);const next=B.migrateDatabase(original);validateDatabase(next);return next;}
function loadState(storage){const raw=storage.getItem(M.KEY),legacy=storage.getItem(M.LEGACY_KEY);if(!raw)return {db:M.seed(),legacy,needsChoice:!!legacy,migrationRequired:false};const db=JSON.parse(raw);validateDatabase(db);return {db,legacy,needsChoice:false,migrationRequired:db.dataVersion!==M.DATA_VERSION};}
// Fact undo cannot delete a delivery or rewrite requirements created after that fact change.
function undo(db){const working=M.clone(db.requirements);B.undo(db);db.requirements=working;}
Object.assign(M,{VERSION:'3.2.0',REQUIREMENT_STATUSES:STATUSES,FEEDBACK_DECISIONS:DECISIONS,saveRequirement,restoreRequirementVersion,deliverRequirement,requirementDiff,saveRequirementFeedback,linkRequirementPerson,requirementPool,deliveryWarnings,validateDatabase,migrateDatabase,loadState,undo});
})(typeof window!=='undefined'?window:globalThis);
