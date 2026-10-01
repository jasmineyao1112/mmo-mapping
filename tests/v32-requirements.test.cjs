'use strict';
const {test}=require('node:test');
const a=require('node:assert/strict');
require('./load-current.cjs');
const M=globalThis.Mapping;
const need={domains:['战斗体系'],minScope:2,chief:true,genre:''};
const brief=(overrides={})=>({title:'虚构战斗主策储备需求',conditions:M.clone(need),owner:'测试招聘同事',requester:'测试业务同事',status:'开放',reason:'首次记录工作需求',...overrides});
const get=(db,id)=>db.requirements.find(r=>r.id===id);
const head=r=>({title:r.title,conditions:M.clone(r.conditions),owner:r.owner,requester:r.requester,status:r.status});
const update=(db,id,changes={})=>M.saveRequirement(db,id,{...head(get(db,id)),reason:'依据业务讨论调整',...changes});
function publish(db){const d=M.extract(M.DEMO,db);d.identityConfirmed=true;db.drafts.push(d);M.publish(db,d);return d;}
function fixture(){const db=M.seed(),r=M.saveRequirement(db,null,brief()),d=M.deliverRequirement(db,r.id);M.validateDatabase(db);return {db,id:r.id,d};}
function rejectUnchanged(db,fn,pattern){const before=JSON.stringify(db);a.throws(fn,pattern);a.equal(JSON.stringify(db),before,'失败不得改动原库，包括日志和 revision');}
function storageFor(db){const raw=JSON.stringify(db);return {raw,getItem:k=>k===M.KEY?raw:null};}
function derived(db){return M.clone({jobs:db.jobs,fieldClaims:db.fieldClaims,relations:db.relationships,capabilities:db.capabilities,evidence:db.evidence,query:[M.query(db,{}),M.query(db,{combat:true,chief:true}),M.queryMatches(db,{project:'G-A1',year:2022,capability:'战斗体系'})],heatmap:M.heatmap(db),flows:M.flows(db),reports:M.reports(db),longlist:M.explainLonglist(db,need)});}
function enriched(){const f=fixture();update(f.db,f.id,{conditions:{...need,minScope:3}});M.saveRequirementFeedback(f.db,f.id,{deliveryId:f.d.id,personId:f.d.rows[0].personId,decision:'建议研究',reason:'核验历史战斗范围',actor:'测试业务同事'});M.linkRequirementPerson(f.db,f.id,'P-A10');return f;}
function illegalImport(label,mutate){test('非法导入拒绝：'+label,()=>{const {db,id}=enriched();mutate(db,get(db,id));const raw=JSON.stringify(db);a.throws(()=>M.validateDatabase(db),undefined,'validateDatabase 必须拒绝 '+label);a.equal(JSON.stringify(db),raw);a.throws(()=>M.loadState(storageFor(db)),undefined,'loadState 必须拒绝 '+label);a.throws(()=>M.migrateDatabase(db),undefined,'当前版本迁移不能绕过校验：'+label);a.equal(JSON.stringify(db),raw);});}

test('V3.2 初始库无正式需求；数据版本为 33 / 产品版本 3.4.0，池自由文本不被猜测为需求',()=>{
 const db=M.seed();a.equal(M.DATA_VERSION,33);a.equal(M.VERSION,'3.4.0');a.equal(db.dataVersion,33);a.deepEqual(db.requirements,[]);a.ok(db.poolMeta['P-A10'].need);a.equal(M.validateDatabase(db),true);
 const state=M.loadState({getItem:()=>null});a.deepEqual(state.db.requirements,[]);a.equal(state.migrationRequired,false);a.equal(state.needsChoice,false);
 a.deepEqual(M.REQUIREMENT_STATUSES,['开放','已交付','已关闭']);a.deepEqual(M.FEEDBACK_DECISIONS,['待评估','建议研究','同意接触','暂不推进']);
});

test('31→33 只读迁移、幂等；保持全部 claims ID/撤销状态/原 logs.before 快照',()=>{
 const old=M.seed();publish(old);old.fieldClaims.find(c=>c.field==='scope').processStatus='已撤销';old.dataVersion=31;delete old.requirements;
 for(const l of old.logs)if(l.before)delete l.before.requirements;
 const before=JSON.stringify(old),claims=M.clone(old.fieldClaims),logs=M.clone(old.logs),pool=M.clone(old.poolMeta),s=storageFor(old);
 a.equal(M.loadState(s).migrationRequired,true);a.equal(s.getItem(M.KEY),before);
 const next=M.migrateDatabase(old);a.equal(JSON.stringify(old),before);a.equal(next.dataVersion,33);a.deepEqual(next.requirements,[]);a.deepEqual(next.fieldClaims,claims);a.deepEqual(next.logs,logs);a.deepEqual(next.poolMeta,pool);
 a.equal(next.migration.from,31);a.equal(next.migration.to,'V3.3.0');a.equal(M.validateDatabase(next),true);a.deepEqual(M.migrateDatabase(next),next);
 const again=M.migrateDatabase(next);again.fieldClaims[0].quote='仅修改副本';a.deepEqual(next.fieldClaims,claims);
});

test('迁移旧事实发布后再新增需求和交付，undo 保留工作记录及原审计快照',()=>{
 const old=M.seed();publish(old);old.dataVersion=31;delete old.requirements;const db=M.migrateDatabase(old),log=M.clone(db.logs[0]);
 const r=M.saveRequirement(db,null,brief()),d=M.deliverRequirement(db,r.id);M.linkRequirementPerson(db,r.id,'P-A10');const working=M.clone(db.requirements);
 M.undo(db);a.deepEqual(db.requirements,working);a.deepEqual(db.logs[0].before,log.before);a.equal(db.logs[0].undone,true);a.deepEqual(M.query(db,{combat:true,chief:true}).map(p=>p.name),['顾航']);
 a.ok(get(db,r.id).deliveries.some(x=>x.id===d.id));a.equal(M.validateDatabase(db),true);
});

test('新建需求记录完整元数据与版本一；返回值和输入与库内数据不共享引用',()=>{
 const db=M.seed(),input=brief(),copy=M.clone(input),revision=db.revision,r=M.saveRequirement(db,null,input);a.deepEqual(input,copy);a.equal(r.version,1);a.equal(r.versions.length,1);a.deepEqual(head(r.versions[0]),head(r));a.equal(r.versions[0].reason,input.reason);a.ok(r.createdAt&&r.updatedAt===r.createdAt);
 for(const k of ['deliveries','businessFeedback','calibrations','poolPersonIds'])a.deepEqual(r[k],[]);
 a.equal(db.revision,revision+1);a.equal(db.logs.at(-1).type,'需求创建');a.equal(db.logs.at(-1).before,null);
 input.conditions.domains.push('经济系统');r.conditions.domains.push('社交与帮会');r.versions[0].title='返回对象修改';a.deepEqual(get(db,r.id).conditions,need);a.equal(get(db,r.id).versions[0].title,copy.title);a.equal(M.validateDatabase(db),true);
});

test('条件按集合去重排序并补默认值；顺序变化和重复域不构成新版本',()=>{
 const db=M.seed(),r=M.saveRequirement(db,null,brief({conditions:{domains:['经济系统','战斗体系','经济系统']}}));
 a.deepEqual(r.conditions,{domains:['战斗体系','经济系统'].sort(),minScope:1,chief:false,genre:''});
 rejectUnchanged(db,()=>update(db,r.id,{conditions:{domains:['经济系统','战斗体系','战斗体系'],minScope:1,chief:false,genre:''}}),/未变化/);
 const c=M.saveRequirement(db,null,brief({conditions:{chief:true}}));a.deepEqual(c.conditions,{domains:[],minScope:1,chief:true,genre:''});
});

test('需求修改递增版本，仅四类条件变化生成准确的 calibrations',()=>{
 const db=M.seed(),r=M.saveRequirement(db,null,brief()),old=M.clone(r),conditions={domains:['经济系统','战斗体系'],minScope:3,chief:false,genre:'开放世界'};
 const next=update(db,r.id,{title:'调整后的虚构需求',owner:'测试新负责人',conditions,reason:'业务讨论扩大领域范围'});
 a.equal(next.version,2);a.deepEqual(next.versions[0],old.versions[0]);a.equal(next.versions[1].reason,'业务讨论扩大领域范围');a.equal(next.calibrations.length,4);
 for(const c of next.calibrations){a.equal(c.fromVersion,1);a.equal(c.toVersion,2);a.deepEqual(c.before,old.conditions[c.field]);a.deepEqual(c.after,next.conditions[c.field]);a.equal(c.trigger,'业务讨论扩大领域范围');a.equal(c.actor,'测试新负责人');a.ok(c.date);}
 const metadata=update(db,r.id,{requester:'测试另一业务同事',status:'已交付'});a.equal(metadata.version,3);a.equal(metadata.calibrations.length,4);a.equal(db.logs.at(-1).type,'需求更新');a.equal(M.validateDatabase(db),true);
});

test('恢复历史需求是新增版本，不重写旧版本与既有交付',()=>{
 const {db,id,d}=fixture(),v1=M.clone(get(db,id).versions[0]);update(db,id,{conditions:{...need,minScope:3},title:'调整后的需求'});const oldVersions=M.clone(get(db,id).versions);
 const restored=M.restoreRequirementVersion(db,id,1,'按原需求重新校准');a.equal(restored.version,3);a.deepEqual(restored.versions.slice(0,2),oldVersions);a.deepEqual(head(restored),head(v1));a.deepEqual(restored.deliveries,[d]);
 const cal=restored.calibrations.at(-1);a.equal(cal.fromVersion,2);a.equal(cal.toVersion,3);a.equal(cal.field,'minScope');a.equal(cal.before,3);a.equal(cal.after,2);a.equal(M.validateDatabase(db),true);
 rejectUnchanged(db,()=>M.restoreRequirementVersion(db,id,3,'再次恢复当前版本'),/未变化/);
});

test('同内容更新和同版本同名单重复交付拒绝且原库字节不变',()=>{
 const {db,id}=fixture();rejectUnchanged(db,()=>update(db,id),/未变化/);rejectUnchanged(db,()=>M.deliverRequirement(db,id),/不重复|未变化/);
 update(db,id,{title:'仅修改需求标题'});const d=M.deliverRequirement(db,id);a.equal(d.requirementVersion,2);a.equal(get(db,id).deliveries.length,2);a.equal(M.validateDatabase(db),true);
});

test('交付冻结解释全量、分母、分层、条件、数据版本及证据原文',()=>{
 const db=M.seed(),r=M.saveRequirement(db,null,brief()),report=M.explainLonglist(db,need),revision=db.revision,d=M.deliverRequirement(db,r.id),saved=M.clone(d);
 a.equal(d.requirementVersion,1);a.equal(d.dataRevision,revision);a.equal(d.observationDate,db.observationDate);a.equal(d.totalPeople,26);a.deepEqual(d.conditionsSnapshot,need);a.deepEqual(d.rows,report.rows);a.deepEqual(d.gapDistribution,report.gapDistribution);
 for(const tier of ['A','B','C'])a.deepEqual(d['tier'+tier],report.tiers[tier].map(x=>x.personId));
 const ids=[...new Set(report.rows.flatMap(x=>x.hits.flatMap(h=>h.claimIds)))];a.deepEqual(d.claimSnapshots,ids.map(id=>db.fieldClaims.find(c=>c.id===id)));a.deepEqual(d.sourceSnapshots,[...new Set(d.claimSnapshots.map(c=>c.sourceId))].map(id=>db.evidence.find(e=>e.id===id)));
 a.equal(db.logs.at(-1).before,null);a.equal(db.logs.at(-1).type,'长名单交付');a.match(db.logs.at(-1).reason,/未发送/);
 d.rows[0].person.name='修改返回值';d.sourceSnapshots[0].text='修改返回原文';update(db,r.id,{conditions:{...need,minScope:4}});a.deepEqual(get(db,r.id).deliveries[0],saved);a.equal(M.validateDatabase(db),true);
});

test('requirementDiff 只读：无交付无差异，事实发布后按人员解释分层变化',()=>{
 const db=M.seed(),r=M.saveRequirement(db,null,brief());const raw=JSON.stringify(db),first=M.requirementDiff(db,r.id);a.equal(first.last,null);a.deepEqual(first.changes,[]);a.deepEqual(first.current,M.explainLonglist(db,need));a.equal(JSON.stringify(db),raw);
 const d=M.deliverRequirement(db,r.id);a.deepEqual(M.requirementDiff(db,r.id).changes,[]);publish(db);const after=JSON.stringify(db),diff=M.requirementDiff(db,r.id);
 a.deepEqual(diff.last,d);a.ok(diff.changes.some(x=>x.personId==='P-A01'&&x.before==='C'&&x.after==='A'));
 const expected=diff.current.rows.filter(x=>d.rows.find(p=>p.personId===x.personId)?.tier!==x.tier).map(x=>({personId:x.personId,name:x.person.name,before:d.rows.find(p=>p.personId===x.personId)?.tier||'未收录',after:x.tier}));a.deepEqual(diff.changes,expected);a.equal(JSON.stringify(db),after);
 const second=M.deliverRequirement(db,r.id);a.notEqual(second.id,d.id);a.equal(second.requirementVersion,1);a.deepEqual(get(db,r.id).deliveries[0],d);
});

test('来源隔离后历史交付保持冻结，警告精确列出失效来源及字段；恢复后清空',()=>{
 const {db,id,d}=fixture(),sourceId=d.claimSnapshots[0].sourceId;const clean=M.deliveryWarnings(db,d);a.deepEqual(clean,{sourceIds:[],claimIds:[],historical:true});
 M.setSourceStatus(db,sourceId,true,'测试：该来源需重新核验','测试审核人');const raw=JSON.stringify(db),warnings=M.deliveryWarnings(db,get(db,id).deliveries[0]);
 a.deepEqual(warnings.sourceIds,[sourceId]);a.deepEqual(warnings.claimIds,d.claimSnapshots.filter(c=>c.sourceId===sourceId).map(c=>c.id));a.equal(warnings.historical,true);a.deepEqual(get(db,id).deliveries[0],d);a.equal(JSON.stringify(db),raw);a.equal(M.validateDatabase(db),true);
 M.setSourceStatus(db,sourceId,false,'测试：恢复来源','测试审核人');a.deepEqual(M.deliveryWarnings(db,d),clean);
});

test('字段撤销不改变历史交付，仍可 validate 并提示撤销字段而不误报来源',()=>{
 const {db,id,d}=fixture(),claim=d.claimSnapshots[0];db.fieldClaims.find(c=>c.id===claim.id).processStatus='已撤销';a.deepEqual(get(db,id).deliveries[0],d);a.deepEqual(M.deliveryWarnings(db,d),{sourceIds:[],claimIds:[claim.id],historical:true});a.equal(M.validateDatabase(db),true);
});

test('取消事实发布后历史交付仍可查看、validate、JSON恢复，并提示已不存在的字段',()=>{
 const db=M.seed();publish(db);const r=M.saveRequirement(db,null,brief()),d=M.deliverRequirement(db,r.id);a.equal(d.rows.find(x=>x.personId==='P-A01').tier,'A');
 M.saveRequirementFeedback(db,r.id,{deliveryId:d.id,personId:'P-A01',decision:'建议研究',reason:'核验任期边界',actor:'测试业务同事'});const working=M.clone(db.requirements);M.undo(db);
 a.deepEqual(db.requirements,working);a.equal(M.requirementDiff(db,r.id).current.rows.find(x=>x.personId==='P-A01').tier,'C');a.equal(get(db,r.id).deliveries[0].rows.find(x=>x.personId==='P-A01').tier,'A');
 const missing=d.claimSnapshots.filter(c=>!db.fieldClaims.some(x=>x.id===c.id)).map(c=>c.id);a.ok(missing.length);const warnings=M.deliveryWarnings(db,d);a.deepEqual(warnings.claimIds,missing);a.deepEqual(warnings.sourceIds,[]);a.equal(M.validateDatabase(db),true);
 const restored=M.loadState(storageFor(db));a.equal(restored.migrationRequired,false);a.equal(JSON.stringify(restored.db),JSON.stringify(db));a.equal(M.validateDatabase(M.migrateDatabase(restored.db)),true);
});

test('已关闭需求不可交付或新增池关联；重新开放后可交付，原历史保留',()=>{
 const {db,id,d}=fixture();update(db,id,{status:'已关闭'});rejectUnchanged(db,()=>M.deliverRequirement(db,id),/已关闭/);rejectUnchanged(db,()=>M.linkRequirementPerson(db,id,'P-A17'),/已关闭/);a.deepEqual(get(db,id).deliveries,[d]);
 update(db,id,{status:'开放'});const next=M.deliverRequirement(db,id);a.equal(next.requirementVersion,3);a.equal(get(db,id).deliveries.length,2);
});

test('业务反馈必须绑定本需求交付批次中的人员；后来入库人员不能冒用旧批次',()=>{
 const {db,id,d}=fixture(),other=M.saveRequirement(db,null,brief({title:'另一虚构需求'})),otherDelivery=M.deliverRequirement(db,other.id);
 const input={deliveryId:d.id,personId:d.rows[0].personId,decision:'建议研究',reason:'补核验职责范围',actor:'测试业务同事'};
 db.people.push({id:'P-V32-LATER',name:'虚构后入库样本',aliases:[],identity:'虚构测试样本',updated:db.observationDate});a.equal(M.validateDatabase(db),true);
 for(const change of [{deliveryId:'DEL-UNKNOWN'},{deliveryId:otherDelivery.id},{personId:'P-UNKNOWN'},{personId:'P-V32-LATER'},{decision:'已发offer'}])rejectUnchanged(db,()=>M.saveRequirementFeedback(db,id,{...input,...change}),/反馈|交付/);
 for(const decision of M.FEEDBACK_DECISIONS){const f=M.saveRequirementFeedback(db,id,{...input,decision});a.equal(f.decision,decision);a.equal(f.deliveryId,d.id);a.equal(f.personId,input.personId);a.equal(db.logs.at(-1).before,null);a.equal(db.logs.at(-1).type,'业务反馈');}
 a.equal(get(db,id).businessFeedback.length,4);a.equal(new Set(get(db,id).businessFeedback.map(f=>f.id)).size,4);a.equal(M.validateDatabase(db),true);
});

test('同一人可关联多个需求，不覆盖池旧备注、负责人、复核日与 history',()=>{
 const db=M.seed(),r1=M.saveRequirement(db,null,brief()),r2=M.saveRequirement(db,null,brief({title:'第二虚构需求'})),pid='P-A10',before=M.clone(db.poolMeta[pid]);
 M.linkRequirementPerson(db,r1.id,pid);M.linkRequirementPerson(db,r2.id,pid);a.deepEqual(db.poolMeta[pid],before);a.equal(db.pool.filter(x=>x===pid).length,1);
 for(const r of [r1,r2]){a.deepEqual(get(db,r.id).poolPersonIds,[pid]);const raw=JSON.stringify(db),pool=M.requirementPool(db,r.id);a.deepEqual(pool.map(x=>x.personId),[pid]);a.deepEqual(pool[0].meta,before);a.equal(JSON.stringify(db),raw);}
 rejectUnchanged(db,()=>M.linkRequirementPerson(db,r1.id,pid),/已关联/);
 M.linkRequirementPerson(db,r1.id,'P-A17');const newMeta=M.clone(db.poolMeta['P-A17']);a.match(newMeta.note,/来自需求/);M.linkRequirementPerson(db,r2.id,'P-A17');a.deepEqual(db.poolMeta['P-A17'],newMeta);a.equal(M.validateDatabase(db),true);
});

test('所有需求写操作及只读 API 不改变 jobs/fieldClaims/relations/query/heatmap/flows',()=>{
 const db=M.seed(),before=derived(db);const invariant=()=>a.deepEqual(derived(db),before);
 const r=M.saveRequirement(db,null,brief());invariant();update(db,r.id,{conditions:{...need,minScope:3}});invariant();M.restoreRequirementVersion(db,r.id,1,'恢复业务原条件');invariant();
 const d=M.deliverRequirement(db,r.id);invariant();M.saveRequirementFeedback(db,r.id,{deliveryId:d.id,personId:'P-A10',decision:'暂不推进',reason:'先补充现状资料',actor:'测试业务同事'});invariant();M.linkRequirementPerson(db,r.id,'P-A17');invariant();
 const raw=JSON.stringify(db);M.requirementDiff(db,r.id);M.requirementPool(db,r.id);M.deliveryWarnings(db,d);invariant();a.equal(JSON.stringify(db),raw);a.ok(db.logs.every(l=>l.before===null));a.equal(M.validateDatabase(db),true);
});

test('失败事务在最终整库校验时也不得提交需求、交付、反馈、池关联或审计',()=>{
 for(const operation of ['create','update','restore','deliver','feedback','link']){
  const {db,id,d}=fixture();update(db,id,{conditions:{...need,minScope:3}});db.poolMeta['P-A10'].status='非法状态';
  const actions={create:()=>M.saveRequirement(db,null,brief()),update:()=>update(db,id,{title:'不会保存的标题'}),restore:()=>M.restoreRequirementVersion(db,id,1,'恢复旧条件'),deliver:()=>M.deliverRequirement(db,id),feedback:()=>M.saveRequirementFeedback(db,id,{deliveryId:d.id,personId:'P-A10',decision:'建议研究',reason:'补核验范围',actor:'测试业务同事'}),link:()=>M.linkRequirementPerson(db,id,'P-A17')};
  rejectUnchanged(db,actions[operation],/人才池/);
 }
});

test('不存在的需求/历史版本、缺修改理由与反馈必填字段失败原库不变',()=>{
 const {db,id,d}=fixture();
 const actions=[()=>M.saveRequirement(db,'REQ-UNKNOWN',brief()),()=>M.deliverRequirement(db,'REQ-UNKNOWN'),()=>M.restoreRequirementVersion(db,id,999,'恢复不存在版本'),()=>M.restoreRequirementVersion(db,id,1,''),()=>update(db,id,{title:'新标题',reason:''}),()=>M.linkRequirementPerson(db,id,'P-UNKNOWN'),()=>M.requirementDiff(db,'REQ-UNKNOWN'),()=>M.requirementPool(db,'REQ-UNKNOWN')];
 for(const fn of actions)rejectUnchanged(db,fn);
 const input={deliveryId:d.id,personId:'P-A10',decision:'建议研究',reason:'补核验范围',actor:'测试业务同事'};for(const k of ['reason','actor'])rejectUnchanged(db,()=>M.saveRequirementFeedback(db,id,{...input,[k]:''}));
});

for(const [label,changes] of [
 ['未知状态',{status:'处理中'}],['空标题',{title:' '}],['空负责人',{owner:''}],['空需求方',{requester:''}],['超长标题',{title:'测'.repeat(81)}],['未知输入字段',{unexpected:true}],
 ['空条件',{conditions:{}}],['未知能力域',{conditions:{domains:['不存在的能力域']}}],['范围越界',{conditions:{...need,minScope:5}}],['范围类型错误',{conditions:{...need,minScope:'2'}}],['主策类型错误',{conditions:{...need,chief:'true'}}],['未知偏好',{conditions:{...need,genre:'未知类型'}}],['未知条件字段',{conditions:{...need,region:'未知'}}]
])test('保存需求拒绝非法输入且无副作用：'+label,()=>{const db=M.seed();rejectUnchanged(db,()=>M.saveRequirement(db,null,brief(changes)));});

for(const [label,value] of [['HTML','<b>测试内容</b>'],['意向推断','此人强意向'],['联系方式','联系 test@example.invalid'],['电话','电话：13800000000']]){
 for(const field of ['title','owner','requester','reason'])test('工作文本拒绝'+label+'：需求 '+field,()=>{const db=M.seed();rejectUnchanged(db,()=>M.saveRequirement(db,null,brief({[field]:value})),/纯文本|HTML|意向|联系方式/);});
 for(const field of ['reason','actor'])test('工作文本拒绝'+label+'：反馈 '+field,()=>{const {db,id,d}=fixture();rejectUnchanged(db,()=>M.saveRequirementFeedback(db,id,{deliveryId:d.id,personId:'P-A10',decision:'建议研究',reason:'补充核验',actor:'测试同事',[field]:value}),/纯文本|HTML|意向|联系方式/);});
}

illegalImport('缺少 requirements 集合',db=>{delete db.requirements;});
illegalImport('重复需求 ID',(db,r)=>db.requirements.push(M.clone(r)));
illegalImport('跨需求重复交付 ID',(db,r)=>{const copy=M.clone(r);copy.id='REQ-ANOTHER';db.requirements.push(copy);});
illegalImport('反馈与 calibration 重复工作记录 ID',(db,r)=>{r.businessFeedback[0].id=r.calibrations[0].id;});
illegalImport('当前需求及最新版本错误状态',(db,r)=>{r.status=r.versions.at(-1).status='处理中';});
illegalImport('旧版本错误状态',(db,r)=>{r.versions[0].status='处理中';});
illegalImport('不连续版本号',(db,r)=>{r.versions[0].version=0;});
illegalImport('当前与最新历史版本不一致',(db,r)=>{r.title='不一致的当前标题';});
illegalImport('未知池人员',(db,r)=>r.poolPersonIds.push('P-UNKNOWN'));
illegalImport('重复池人员',(db,r)=>r.poolPersonIds.push(r.poolPersonIds[0]));
illegalImport('交付不存在的需求版本',(db,r)=>{r.deliveries[0].requirementVersion=99;});
illegalImport('交付条件与历史需求不符',(db,r)=>{r.deliveries[0].conditionsSnapshot.minScope=4;});
illegalImport('交付分母错误',(db,r)=>{r.deliveries[0].totalPeople++;});
illegalImport('交付重复人员',(db,r)=>r.deliveries[0].rows.push(M.clone(r.deliveries[0].rows[0])));
illegalImport('交付错误分层',(db,r)=>{r.deliveries[0].rows[0].tier='D';});
illegalImport('交付分层 ID 与名单不符',(db,r)=>{r.deliveries[0].tierA=[];});
illegalImport('反馈错误交付引用',(db,r)=>{r.businessFeedback[0].deliveryId='DEL-UNKNOWN';});
illegalImport('反馈错误人员引用',(db,r)=>{r.businessFeedback[0].personId='P-UNKNOWN';});
illegalImport('反馈错误状态',(db,r)=>{r.businessFeedback[0].decision='已发offer';});
illegalImport('calibration 错误版本引用',(db,r)=>{r.calibrations[0].fromVersion=99;});
illegalImport('calibration 错误历史值',(db,r)=>{r.calibrations[0].before=4;});
illegalImport('交付不存在的来源引用',(db,r)=>{r.deliveries[0].sourceSnapshots[0].id='E-UNKNOWN';});
illegalImport('字段快照引文无法定位',(db,r)=>{r.deliveries[0].claimSnapshots[0].quote='不存在的引文';});
illegalImport('字段快照错误来源引用',(db,r)=>{r.deliveries[0].claimSnapshots[0].sourceId='E-UNKNOWN';});
illegalImport('命中人物与字段快照错配',(db,r)=>{const d=r.deliveries[0],h=d.rows.find(x=>x.hits.length).hits[0];d.claimSnapshots.find(c=>c.id===h.claimIds[0]).personId='P-UNKNOWN';});
illegalImport('缺少 claimSnapshots',(db,r)=>{delete r.deliveries[0].claimSnapshots;});
illegalImport('缺少 sourceSnapshots',(db,r)=>{delete r.deliveries[0].sourceSnapshots;});
illegalImport('遗漏命中字段快照',(db,r)=>r.deliveries[0].claimSnapshots.shift());
illegalImport('遗漏字段来源快照',(db,r)=>r.deliveries[0].sourceSnapshots.shift());
illegalImport('缺少原因分布',(db,r)=>{r.deliveries[0].gapDistribution=[];});
illegalImport('原因分布人数错误',(db,r)=>{r.deliveries[0].gapDistribution[0].count++;});

// 字段与来源须构成同一条证据链；历史撤销可缺少当期字段，但不能任意伪造快照引用。
illegalImport('伪造 hit.evidenceIds 为另一人物的真实来源',(db,r)=>{const d=r.deliveries[0],row=d.rows.find(x=>x.hits.length),h=row.hits[0],other=d.claimSnapshots.find(c=>c.personId!==row.personId&&!h.evidenceIds.includes(c.sourceId));a.ok(other);h.evidenceIds=[other.sourceId];});
illegalImport('伪造 hit.scopeClaimIds 为不存在字段',(db,r)=>{const h=r.deliveries[0].rows.flatMap(x=>x.hits).find(h=>h.scopeClaimIds.length);a.ok(h);h.scopeClaimIds=['CL-FORGED-SCOPE'];});
illegalImport('伪造 hit.scopeEvidenceIds 为不存在来源',(db,r)=>{const h=r.deliveries[0].rows.flatMap(x=>x.hits).find(h=>h.scopeEvidenceIds.length);a.ok(h);h.scopeEvidenceIds=['E-FORGED-SCOPE'];});
illegalImport('伪造完整 claim ID 引用而非真实历史字段',(db,r)=>{const d=r.deliveries[0],c=d.claimSnapshots[0],old=c.id;c.id='CL-FORGED-SNAPSHOT';for(const row of d.rows)for(const h of row.hits)for(const key of ['claimIds','scopeClaimIds'])h[key]=h[key].map(id=>id===old?c.id:id);});

for(const [label,value] of [['HTML','<i>不允许的内容</i>'],['意向推断','愿意跳槽'],['联系方式','test@example.invalid']]){
 illegalImport(label+' 当前需求',(db,r)=>{r.title=r.versions.at(-1).title=value;});
 illegalImport(label+' 历史需求理由',(db,r)=>{r.versions[0].reason=value;});
 illegalImport(label+' 业务反馈',(db,r)=>{r.businessFeedback[0].reason=value;});
 illegalImport(label+' calibration',(db,r)=>{r.calibrations[0].trigger=value;});
}

test('完整工作库导出 JSON 再恢复：版本、校准、交付、反馈、池关联和审计一致',()=>{
 const {db,id,d}=enriched();M.restoreRequirementVersion(db,id,1,'回到最初业务要求');const second=M.deliverRequirement(db,id);a.notEqual(second.id,d.id);
 M.setSourceStatus(db,d.sourceSnapshots[0].id,true,'测试：恢复后仍展示历史来源警告','测试审核人');const raw=JSON.stringify(db),state=M.loadState(storageFor(db));
 a.equal(state.migrationRequired,false);a.equal(state.needsChoice,false);a.equal(JSON.stringify(state.db),raw);a.equal(M.validateDatabase(state.db),true);a.deepEqual(M.migrateDatabase(state.db),db);
 a.deepEqual(M.requirementDiff(state.db,id),M.requirementDiff(db,id));a.deepEqual(M.requirementPool(state.db,id),M.requirementPool(db,id));a.deepEqual(M.deliveryWarnings(state.db,get(state.db,id).deliveries[0]),M.deliveryWarnings(db,d));a.deepEqual(derived(state.db),derived(db));
 update(state.db,id,{title:'恢复副本中的新标题'});a.equal(JSON.stringify(db),raw,'恢复副本不得反向改变原库');
});
