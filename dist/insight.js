/* V3.1 insight layer.
   Facts stay in the evidence layer (jobs / field claims / relationships).
   Everything here is either (a) additional fictional sample facts with sources,
   (b) metrics derived only from published facts, or (c) human judgement stored
   separately from facts (analyses, pool follow-up state). Judgement never feeds queries. */
(function(root){
'use strict';
const M=root.Mapping,OBS=M.OBSERVATION,clone=M.clone;
const GENRE={'G-A1':'动作 MMORPG','G-A2':'开放世界 MMORPG','G-B1':'回合制 MMORPG','G-C1':'科幻 MMORPG','G-C2':'东方玄幻 MMORPG'};
const DOMAINS=['战斗体系','经济系统','世界与内容','社交与帮会'];
const PRIORITIES=['P0','P1','P2'],PR={P0:0,P1:1,P2:2};
const POOL_STATUS=['待研究','待核验','可推荐给业务','暂不考虑'];
const SCOPE_LABEL={1:'参与',2:'带领小组 / 模块',3:'领域负责',4:'整体统筹'};
const INTENT=/(强意向|意向强|可挖|好挖|想跳槽|愿意跳槽|在看机会|求职意向(高|强|明确))/;
function src(id,text,source='虚构团队资料',published='2026-09-15'){return {id,text,source,nature:'虚构演示资料',published,collected:OBS,recordedAt:M.now(),quality:'演示原文直接陈述；来源独立性未审核',factStatus:M.SINGLE,fiction:true,independence:'未审核',independentGroup:null,ingestionKind:'历史底库初始化'};}
function addDays(d,n){return new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);}
const plain=(v,max=600)=>{const s=String(v??'').trim();if(/[<>]/.test(s))throw new Error('仅接受纯文本，不允许 HTML 标记');if(s.length>max)throw new Error('内容过长（上限 '+max+' 字）');return s;};

/* ---------- (a) V3.1 fictional sample expansion: 1 company, 2 projects, 10 people ---------- */
function expansion(){
 const x={companies:[{id:'C-C',name:'星野网络',market:'中国游戏行业'}],projects:[],evidence:[],people:[],jobs:[],capabilities:[],relationships:[],events:[],projectLinks:[],analyses:[]};
 const projectDefs=[['G-C1','星海纪元','C-C','星野一工作室','科幻 MMORPG','PC / 移动',[[2019,2020,'研发'],[2021,2021,'上线'],[2022,2024,'运营'],[2025,2026,'收缩运营']]],['G-C2','归墟','C-C','星野二工作室','东方玄幻 MMORPG','跨平台',[[2025,2026,'研发']]]];
 for(const [pid,name,cid,studio,genre,platform,phases] of projectDefs){const eid='E-'+pid;x.evidence.push(src(eid,`【虚构项目档案】${name}由星野网络的${studio}开发，类型${genre}，平台${platform}。阶段：${phases.map(([s,e,t])=>s+(s!==e?'—'+e:'')+'年'+t).join('；')}。实际团队总编制未知。`));x.projects.push({id:pid,name,companyId:cid,studio,genre,platform,start:phases[0][0],phases:phases.map(([start,end,name])=>({start,end,name,evidenceId:eid})),evidenceId:eid});}
 ['沈砚','何川','韩露','陆遥','程野','宋棠','江临','白芷','秦朗','孟夏'].forEach((name,i)=>x.people.push({id:'P-A'+String(9+i).padStart(2,'0'),name,aliases:[],identity:'虚构样本身份；非现实人物',updated:OBS}));
 const defs=[
  ['J-C01','P-A09','G-C1','战斗策划负责人',2019,2024,'战斗策划组','职业战斗与副本战斗','领域负责','战斗体系',['职业战斗','副本战斗'],'【虚构履历】沈砚于2019—2024年担任《星海纪元》战斗策划负责人，负责职业战斗与副本战斗。'],
  ['J-C02','P-A09','G-C2','战斗策划负责人',2025,null,'战斗策划组','战斗框架搭建','领域负责','战斗体系',['战斗框架'],'【虚构团队公告】沈砚自2025年起担任《归墟》战斗策划负责人，负责战斗框架搭建；结束时间未知。'],
  ['J-C03','P-A10','G-C1','主策',2019,2024,'主策','策划整体统筹','整体统筹','',[],'【虚构履历】何川于2019—2024年担任《星海纪元》主策，统筹策划工作。2025年后的任职未见记载。'],
  ['J-C04','P-A11','G-C1','数值策划',2020,2024,'数值 / 经济','养成数值','参与','经济系统',['养成数值'],'【虚构履历】韩露于2020—2024年在《星海纪元》参与养成数值设计。'],
  ['J-C05','P-A11','G-C2','数值负责人',2025,null,'数值 / 经济','数值与经济系统','领域负责','经济系统',['数值','经济'],'【虚构团队公告】韩露自2025年起担任《归墟》数值负责人，负责数值与经济系统；结束时间未知。'],
  ['J-C06','P-A12','G-C1','世界与内容策划负责人',2021,2025,'世界 / 内容','世界观与主线任务','领域负责','世界与内容',['世界观','主线任务'],'【虚构履历】陆遥于2021—2025年负责《星海纪元》世界观与主线任务内容。2026年任职未见记载。'],
  ['J-C07','P-A13','G-C1','社交系统策划',2022,2025,'系统策划','公会与社交玩法','参与','社交与帮会',['公会玩法'],'【虚构履历】程野于2022—2025年在《星海纪元》参与公会与社交玩法设计。'],
  ['J-C08','P-A14','G-B1','系统策划负责人',2019,2024,'系统策划','帮派与社交系统','领域负责','社交与帮会',['帮派系统','社交系统'],'【虚构履历】宋棠于2019—2024年负责《灵域传说》帮派与社交系统。'],
  ['J-C09','P-A14','G-C2','主策',2025,null,'主策','策划整体统筹','整体统筹','',[],'【虚构团队公告】宋棠自2025年起担任《归墟》主策，统筹策划工作；结束时间未知。'],
  ['J-C10','P-A15','G-A1','世界与内容策划',2021,2024,'世界 / 内容','地图与区域任务','参与','世界与内容',['区域任务'],'【虚构履历】江临于2021—2024年在《玄霄》参与地图与区域任务设计。'],
  ['J-C11','P-A15','G-A2','世界与内容负责人',2025,null,'世界 / 内容','开放世界内容','领域负责','世界与内容',['开放世界内容'],'【虚构团队资料】江临自2025年起负责《云境》开放世界内容；结束时间未知。'],
  ['J-C12','P-A16','G-B1','战斗策划',2021,null,'战斗策划组','回合制战斗数值','参与','战斗体系',['回合制战斗'],'【虚构履历】白芷自2021年起在《灵域传说》参与回合制战斗数值设计；结束时间未知。'],
  ['J-C13','P-A17','G-C1','战斗策划',2020,2023,'战斗策划组','副本 Boss 战斗','参与','战斗体系',['副本战斗'],'【虚构履历】秦朗于2020—2023年在《星海纪元》参与副本 Boss 战斗设计。'],
  ['J-C14','P-A17','G-A2','战斗策划负责人',2024,null,'战斗策划组','动作战斗与 PvP','领域负责','战斗体系',['动作战斗','PvP'],'【虚构团队资料】秦朗自2024年起负责《云境》动作战斗与 PvP 设计；结束时间未知。'],
  ['J-C15','P-A18','G-B1','数值策划',2020,2024,'数值 / 经济','经济产出与回收','参与','经济系统',['经济回收'],'【虚构履历】孟夏于2020—2024年在《灵域传说》参与经济产出与回收设计。'],
  ['J-C16','P-A18','G-A2','经济策划',2025,null,'数值 / 经济','交易与经济系统','参与','经济系统',['交易系统'],'【虚构团队资料】孟夏自2025年起在《云境》参与交易与经济系统设计；结束时间未知。']
 ];
 for(const [jid,pid,gid,role,start,end,team,module,scope,domain,details,text] of defs){const eid='E-'+jid,e=src(eid,text);e.claims=[{objectId:jid,personId:pid,projectId:gid,role,start,end,module,scope,quote:text}];x.evidence.push(e);x.jobs.push({id:jid,personId:pid,projectId:gid,role,rawRole:role,start,end,precision:'年',team,module,scope,evidenceIds:[eid],processStatus:'已发布',factStatus:M.SINGLE,roleHistory:[],reviewedAt:OBS});if(domain)x.capabilities.push({id:'CAP-'+jid,jobId:jid,domain,details,scope,scenario:GENRE[gid],evidenceIds:[eid],quote:text,factStatus:M.SINGLE,processStatus:'已发布'});}
 x.evidence.push(src('E-EV-C1','【虚构2025公司公告】星野网络宣布《星海纪元》自2025年起转入收缩运营，战斗策划负责人沈砚、数值策划韩露等成员转入新项目《归墟》。公告未列出全部转岗名单，也未说明其他策划成员的去向。','虚构公司公告','2025-03-10'));
 x.evidence.push(src('E-EV-C2','【虚构2025团队公告】星野网络新项目《归墟》于2025年进入研发，宋棠担任主策。公告未说明宋棠此前的离职时间与项目团队规模。','虚构团队公告','2025-04-02'));
 x.evidence.push(src('E-PL2','【虚构行业讨论帖】有帖子称《云境》是由《玄霄》团队孵化的新项目，但未给出来源；项目档案显示两者分属不同工作室。','虚构行业讨论','2026-08-30'));
 x.evidence.push(src('E-PL3','【虚构玩家社区线索】有玩家认为《归墟》的帮派玩法“很像《灵域传说》”，并提到主策宋棠来自该项目。','虚构玩家社区','2026-09-05'));
 x.events.push({id:'EV-C1',title:'星海纪元转入收缩运营，部分策划转入归墟',projectId:'G-C1',relatedProjectId:'G-C2',personIds:['P-A09','P-A11'],date:'2025',published:'2025-03-10',collected:OBS,evidenceIds:['E-EV-C1'],fact:'公告称《星海纪元》自2025年起转入收缩运营，沈砚、韩露等成员转入《归墟》。',gap:'转岗名单不完整；未随迁成员的去向、离开原因与具体月份均未披露。',before:2024,after:2025,jobIds:['J-C01','J-C02','J-C04','J-C05'],processStatus:'已发布',ingestionKind:'历史底库初始化'});
 x.events.push({id:'EV-C2',title:'归墟进入研发，宋棠出任主策',projectId:'G-C2',personIds:['P-A14'],date:'2025',published:'2025-04-02',collected:OBS,evidenceIds:['E-EV-C2'],fact:'公告称《归墟》于2025年进入研发，宋棠担任主策。',gap:'宋棠离开《灵域传说》的具体时间、归墟团队规模未披露。',before:2024,after:2025,jobIds:['J-C08','J-C09'],processStatus:'已发布',ingestionKind:'历史底库初始化'});
 x.projectLinks.push(
  {id:'PL-1',fromId:'G-C1',toId:'G-C2',type:'团队迁移',year:2025,processStatus:'已发布',evidenceIds:['E-EV-C1'],quote:'战斗策划负责人沈砚、数值策划韩露等成员转入新项目《归墟》',gap:'仅确认部分成员随迁；不代表《归墟》是《星海纪元》的续作。'},
  {id:'PL-2',fromId:'G-A1',toId:'G-A2',type:'同团队孵化（线索）',year:2024,processStatus:'待核验',evidenceIds:['E-PL2'],quote:'有帖子称《云境》是由《玄霄》团队孵化的新项目，但未给出来源',gap:'讨论帖无可核对来源，且两者工作室不同；个别成员迁移不能证明项目血缘。'},
  {id:'PL-3',fromId:'G-B1',toId:'G-C2',type:'玩法延续（线索）',year:2025,processStatus:'待核验',evidenceIds:['E-PL3'],quote:'有玩家认为《归墟》的帮派玩法“很像《灵域传说》”',gap:'玩法相似与主策来源都不能证明项目延续、授权或团队整体迁移。'});
 const who='HRBP 人工判断（演示）';
 x.analyses.push(
  {id:'AN-C1',eventId:'EV-C1',priority:'P0',signal:'《星海纪元》2025 年转入收缩运营：库内沈砚、韩露转入《归墟》（秦朗 2024 年已转入《云境》），另有何川、陆遥、程野 3 位任职记录止于 2024–2025 年、去向未收录。',judgement:'收缩期通常伴随人员再配置，未随迁成员是值得优先研究的来源；其中何川有主策经历，陆遥有世界内容领域负责经历。这是 HRBP 的工作判断，不代表任何人有求职意向。',action:'① 核验何川、陆遥、程野 2025 年后的任职现状；② 将其加入人才池“待核验”，按团队缺口排序；③ 补充收缩规模的第二来源。',window:'建议 3 个月内完成首轮核验（人工设定的复核窗口，非市场预测）',reviewBy:'2026-12-31',author:who,updated:OBS,kind:'人工判断'},
  {id:'AN-C2',eventId:'EV-C2',priority:'P1',signal:'《归墟》2025 年进入研发，主策宋棠来自《灵域传说》，沈砚、韩露自《星海纪元》转入。',judgement:'新项目组建期会持续补充策划，归墟会成为同类战斗 / 经济人才的竞争方；同时其组建名单是研究星海、灵域历史团队的线索。',action:'① 关注归墟后续团队公告；② 研究宋棠在灵域的系统与社交团队成员。',window:'季度复核',reviewBy:'2026-12-31',author:who,updated:OBS,kind:'人工判断'},
  {id:'AN-A1',eventId:'EV-A1',priority:'P2',signal:'周岚 2024 年起负责《玄霄》战斗策划组。',judgement:'玄霄战斗组发生负责人更替；2021–2023 年的战斗组历史成员是“战斗 + 带组”方向的研究来源。更替本身不代表团队不稳定。',action:'① 以《玄霄》2022 年组织为起点研究战斗组历史成员；② 补充前后任交接关系的来源。',window:'研究型，无明确时效',reviewBy:'2027-03-31',author:who,updated:OBS,kind:'人工判断'});
 return x;
}
/* Idempotent hook: full databases receive every collection; undo snapshots only receive the collections they carry. */
function expand(t){
 const x=expansion(),full=Array.isArray(t.companies);
 if(full){for(const k of ['projectLinks','analyses'])if(!Array.isArray(t[k]))t[k]=[];if(!t.poolMeta||typeof t.poolMeta!=='object'||Array.isArray(t.poolMeta))t.poolMeta={};}
 for(const k of ['companies','projects','evidence','people','jobs','capabilities','relationships','events','projectLinks','analyses']){if(!Array.isArray(t[k]))continue;for(const it of x[k])if(!t[k].some(y=>y.id===it.id))t[k].push(clone(it));}
 if(full&&!t.poolSeeded){t.poolSeeded=true;for(const [pid,status,need,note] of [['P-A10','待核验','《云境》主策 / 策划统筹储备','来自 EV-C1：任职记录止于2024，去向未收录，先核实现状。'],['P-A09','待研究','《云境》战斗方向储备','战斗领域负责经历；已随迁《归墟》，优先级低于未随迁成员。']])if(t.people.some(p=>p.id===pid)&&!t.pool.includes(pid)){t.pool.push(pid);t.poolMeta[pid]={status,owner:'HRBP',need,nextReview:pid==='P-A10'?'2026-09-15':addDays(OBS,30),note,added:OBS,history:[{date:OBS,status,note:'演示初始化'}]};}}
 return t;
}
(M.dataHooks=M.dataHooks||[]).push(expand);

/* ---------- (b) metrics derived only from published facts ---------- */
const ev=(db,id)=>db.evidence.find(e=>e.id===id);
const usable=(db,ids)=>[...new Set((ids||[]).filter(id=>M.sourceUsable(db,ev(db,id))))];
const project=(db,id)=>db.projects.find(p=>p.id===id);
function scopeRank(s){s=String(s||'');if(s.includes('整体'))return 4;if(s.includes('领域负责'))return 3;if(/负责小组|带领/.test(s))return 2;if(s.includes('参与'))return 1;return 0;}
function isInit(db,id){return ev(db,id)?.ingestionKind==='历史底库初始化';}
function analyses(db){return (db.analyses||[]).map(a=>({...a,event:db.events.find(e=>e.id===a.eventId)})).filter(a=>a.event&&a.event.processStatus==='已发布'&&M.supported(db,a.event)).map(a=>({...a,overdue:!!a.reviewBy&&a.reviewBy<db.observationDate})).sort((a,b)=>PR[a.priority]-PR[b.priority]||String(b.event.date).localeCompare(String(a.event.date)));}
function dashboard(db){
 const js=M.publishedJobs(db),touched=js.filter(j=>usable(db,j.evidenceIds).some(id=>!isInit(db,id))),added=touched.filter(j=>j.evidenceIds.every(id=>!isInit(db,id))),as=analyses(db),pool=poolItems(db);
 return {people:new Set(js.map(j=>j.personId)).size,companies:db.companies.length,projects:db.projects.length,jobs:js.length,added:added.length,supplemented:touched.length-added.length,analyses:as,p0:as.filter(a=>a.priority==='P0'),overdue:as.filter(a=>a.overdue),pool:pool.length,poolDue:pool.filter(p=>p.overdue).length};
}
function health(db){
 const js=M.publishedJobs(db),n=js.length||1,rel=db.relationships.map(r=>M.relationshipView(db,r)).filter(r=>!['已拒绝','已撤销'].includes(r.processStatus));
 const explicit=js.filter(j=>['role','start'].every(f=>M.fieldClaims(db,j.id,f).some(c=>c.basis==='原文明确'))),single=js.filter(j=>usable(db,j.evidenceIds).length<2),inferred=js.filter(j=>M.fieldClaims(db,j.id,'end').some(c=>c.basis==='推定边界')),open=js.filter(j=>j.end===null),pendingRel=rel.filter(r=>r.processStatus==='待核验');
 const pct=(a,b=n)=>Math.round(a/(b||1)*100);
 return [
  {key:'explicit',label:'岗位与开始年份有原文明确依据',value:explicit.length,total:js.length,pct:pct(explicit.length),good:'high',jobIds:js.filter(j=>!explicit.includes(j)).map(j=>j.id),note:'未达标的任职多为“职责标准化”岗位或只有头衔证据。'},
  {key:'single',label:'仅单一来源支撑的任职',value:single.length,total:js.length,pct:pct(single.length),good:'low',jobIds:single.map(j=>j.id),note:'同一文本多次引用仍算一份来源；需要补独立来源。'},
  {key:'inferred',label:'任期边界为推定',value:inferred.length,total:js.length,pct:pct(inferred.length),good:'low',jobIds:inferred.map(j=>j.id),note:'推定边界不作为精确离任时间，查询中列为时间待核验。'},
  {key:'open',label:'结束时间未知（需定期复核现状）',value:open.length,total:js.length,pct:pct(open.length),good:'low',jobIds:open.map(j=>j.id),note:'结束未知只代表“最近已知”，不确认仍在职。'},
  {key:'relations',label:'人员关系仍待核验',value:pendingRel.length,total:rel.length,pct:pct(pendingRel.length,rel.length),good:'low',relationIds:pendingRel.map(r=>r.id),note:'虚线关系不进入正式汇报链。'},
  {key:'quarantine',label:'已隔离来源',value:db.evidence.filter(e=>e.quarantined).length,total:db.evidence.length,pct:pct(db.evidence.filter(e=>e.quarantined).length,db.evidence.length),good:'low',note:'隔离不删除原文，只停止参与当期事实。'}
 ];
}
function flows(db){
 const byP={},confirmed={},candidate={},concurrent=[],exits=[],obsY=+db.observationDate.slice(0,4),jobs=M.publishedJobs(db);
 for(const j of jobs)(byP[j.personId]=byP[j.personId]||[]).push(j);
 const claimIds=j=>['membership','start','end'].flatMap(f=>M.fieldClaims(db,j.id,f).map(c=>c.id));
 const moveEvent=(pid,a,b)=>db.events.find(e=>{if(e.processStatus!=='已发布'||!M.supported(db,e)||!(e.personIds||[]).includes(pid)||!(e.jobIds||[]).includes(a.id)||!(e.jobIds||[]).includes(b.id))return false;if(e.relatedProjectId)return e.projectId===a.projectId&&e.relatedProjectId===b.projectId;const from=project(db,a.projectId)?.name,to=project(db,b.projectId)?.name,text=(e.title||'')+' '+(e.fact||'');return !!from&&!!to&&text.includes(from)&&text.includes(to)&&/来自|转入|转至|调入|迁入/.test(text);});
 const add=(bucket,a,b,move)=>{const k=a.projectId+'>'+b.projectId;(bucket[k]=bucket[k]||{from:a.projectId,to:b.projectId,moves:[]}).moves.push(move);};
 for(const [pid,list] of Object.entries(byP)){
  list.sort((a,b)=>a.start-b.start||(a.end??9999)-(b.end??9999)||a.id.localeCompare(b.id));
  for(let i=0;i<list.length;i++)for(let k=i+1;k<list.length;k++){
   const a=list[i],b=list[k];if(a.projectId===b.projectId)continue;
   const overlapStart=Math.max(a.start,b.start),overlapEnd=Math.min(a.end??9999,b.end??9999);
   if(overlapStart<=overlapEnd){concurrent.push({id:'CON-'+a.id+'-'+b.id,personId:pid,jobIds:[a.id,b.id],projectIds:[a.projectId,b.projectId],start:overlapStart,end:Math.min(overlapEnd,obsY),claimIds:[...new Set([...claimIds(a),...claimIds(b)])],evidenceIds:usable(db,[...a.evidenceIds,...b.evidenceIds]),status:'待核验',kind:'同期任职',warning:'同期跨项目任职可能是借调、兼任、外包支持或记录冲突；不计入项目流入/流出。'});}
  }
  const seq=list.slice().sort((a,b)=>a.start-b.start||(a.end??9999)-(b.end??9999)||a.id.localeCompare(b.id));
  for(let i=1;i<seq.length;i++){
   const a=seq[i-1],b=seq[i];if(a.projectId===b.projectId)continue;
   const overlap=Math.max(a.start,b.start)<=Math.min(a.end??9999,b.end??9999);if(overlap)continue;
   const end=M.fieldClaims(db,a.id,'end').at(-1),event=moveEvent(pid,a,b),base={id:'MOVE-'+a.id+'-'+b.id,personId:pid,fromJob:a.id,toJob:b.id,from:a.projectId,to:b.projectId,year:b.start,timePrecision:'年',inferred:!end||end.basis!=='原文明确',gap:a.end!=null&&b.start-a.end>1,claimIds:[...new Set([...claimIds(a),...claimIds(b)])],evidenceIds:usable(db,[...a.evidenceIds,...b.evidenceIds,...(event?.evidenceIds||[])]),eventId:event?.id||null};
   if(event)add(confirmed,a,b,{...base,status:'已发布',kind:'明确转岗',basis:'已发布事件同时关联前后两段任职与人员；净流量只计算此类记录。'});
   else add(candidate,a,b,{...base,status:'待核验',kind:'履历先后',basis:'仅确认两段任职的时间先后，未见明确转岗事件；不计入净流量。'});
  }
  if(list.every(j=>j.end!==null)){const last=list.slice().sort((a,b)=>b.end-a.end||b.start-a.start)[0];if(last.end<=obsY)exits.push({id:'PENDING-'+last.id,personId:pid,projectId:last.projectId,jobId:last.id,year:last.end,status:'去向未收录',kind:'去向待核验',claimIds:claimIds(last),evidenceIds:usable(db,last.evidenceIds),warning:'最近任职已结束且库内无后续记录；不等于离职、待业或求职。'});}
 }
 const pack=(bucket,status)=>Object.values(bucket).map(e=>({...e,status,count:new Set(e.moves.map(m=>m.personId)).size,inferred:e.moves.every(m=>m.inferred),partlyInferred:e.moves.some(m=>m.inferred)})).sort((a,b)=>b.count-a.count||a.from.localeCompare(b.from));
 const edges=pack(confirmed,'已发布'),candidateEdges=pack(candidate,'待核验');
 const net={};for(const p of db.projects)net[p.id]={in:0,out:0,exit:0,candidateIn:0,candidateOut:0,concurrent:0};for(const e of edges){net[e.from].out+=e.count;net[e.to].in+=e.count;}for(const e of candidateEdges){net[e.from].candidateOut+=e.count;net[e.to].candidateIn+=e.count;}for(const x of concurrent)for(const pid of x.projectIds)if(net[pid])net[pid].concurrent++;for(const x of exits)if(net[x.projectId])net[x.projectId].exit++;
 return {edges,candidateEdges,concurrent,exits,net,method:'净流入/流出仅统计有已发布事件同时关联人员与前后任职的明确转岗；履历先后、同期任职和去向未收录分别展示，不参与净值。'};
}
function heatmap(db){
 const js=M.publishedJobs(db);
 const rows=db.projects.map(p=>({project:p,cells:DOMAINS.map(d=>{const hits=js.filter(j=>j.projectId===p.id).flatMap(j=>M.capabilitiesFor(db,j).filter(c=>c.domain===d).map(c=>({j,c})));return {domain:d,count:new Set(hits.map(h=>h.j.personId)).size,leads:new Set(hits.filter(h=>scopeRank(h.c.scope)>=2).map(h=>h.j.personId)).size,personIds:[...new Set(hits.map(h=>h.j.personId))]};})}));
 const totals=DOMAINS.map((d,i)=>{const ids=new Set(rows.flatMap(r=>r.cells[i].personIds));const leadIds=new Set(js.flatMap(j=>M.capabilitiesFor(db,j).filter(c=>c.domain===d&&scopeRank(c.scope)>=2).map(()=>j.personId)));return {domain:d,people:ids.size,leads:leadIds.size,projects:rows.filter(r=>r.cells[i].count).length};});
 return {domains:DOMAINS,rows,totals};
}
function timeline(db,pid){
 const p=project(db,pid),obsY=+db.observationDate.slice(0,4),f=flows(db);
 return Array.from({length:obsY-p.start+1},(_,i)=>{const y=p.start+i;return {year:y,stage:M.stageAt(p,y),count:M.projectPeople(db,pid,y).length,events:db.events.filter(e=>(e.projectId===pid||e.relatedProjectId===pid)&&+String(e.date).slice(0,4)===y&&M.supported(db,e)),inflow:f.edges.filter(e=>e.to===pid).flatMap(e=>e.moves.filter(m=>m.year===y).map(m=>({...m,from:e.from}))),outflow:f.edges.filter(e=>e.from===pid).flatMap(e=>e.moves.filter(m=>m.year===y).map(m=>({...m,to:e.to}))),candidateIn:f.candidateEdges.filter(e=>e.to===pid).flatMap(e=>e.moves.filter(m=>m.year===y).map(m=>({...m,from:e.from}))),candidateOut:f.candidateEdges.filter(e=>e.from===pid).flatMap(e=>e.moves.filter(m=>m.year===y).map(m=>({...m,to:e.to}))),concurrent:f.concurrent.filter(x=>x.projectIds.includes(pid)&&y>=x.start&&y<=x.end),exits:f.exits.filter(x=>x.projectId===pid&&x.year===y)};});
}
function linksFor(db,pid){return (db.projectLinks||[]).filter(l=>(!pid||l.fromId===pid||l.toId===pid)&&!['已拒绝','已撤销'].includes(l.processStatus)).map(l=>usable(db,l.evidenceIds).length?l:{...l,processStatus:'待核验',gap:l.gap+' 来源已隔离，暂不作为已发布关系。'});}

/* ---------- requirement → explainable longlist ---------- */
const LONGLIST_PRESETS=[
 {id:'chief-combat',title:'主策（需战斗背景）',domains:['战斗体系'],minScope:2,chief:true,genre:''},
 {id:'combat-lead',title:'战斗策划负责人',domains:['战斗体系'],minScope:3,chief:false,genre:'动作'},
 {id:'economy-lead',title:'数值 / 经济负责人',domains:['经济系统'],minScope:3,chief:false,genre:''},
 {id:'world-lead',title:'世界与内容负责人',domains:['世界与内容'],minScope:3,chief:false,genre:'开放世界'},
 {id:'social-lead',title:'社交与帮会负责人',domains:['社交与帮会'],minScope:3,chief:false,genre:''}];
const LONGLIST_GENRES=['',...Object.values(GENRE).flatMap(g=>[g,g.replace(/ MMORPG$/,'')])];
function longlistNeed(need){
 if(!need||typeof need!=='object'||Array.isArray(need)||![Object.prototype,null].includes(Object.getPrototypeOf(need)))throw new Error('need 须为 JSON 纯数据需求对象');
 const keys=['domains','chief','minScope','genre','id','title','preset'];
 for(const k of Reflect.ownKeys(need)){
  if(typeof k!=='string'||!keys.includes(k))throw new Error('未知需求字段：'+String(k));
  if(!Object.hasOwn(Object.getOwnPropertyDescriptor(need,k),'value'))throw new Error('need 仅接受 JSON 纯数据，不接受访问器');
  if(['id','title','preset'].includes(k)){if(typeof need[k]!=='string')throw new Error(k+' 须为纯文本');plain(need[k]);}
 }
 const domains=Object.hasOwn(need,'domains')?need.domains:[],chief=Object.hasOwn(need,'chief')?need.chief:false,min=Object.hasOwn(need,'minScope')?need.minScope:1,genre=Object.hasOwn(need,'genre')?need.genre:'';
 if(!Array.isArray(domains)||[...domains].some(d=>!DOMAINS.includes(d)))throw new Error('domains 须为已知能力域数组：'+DOMAINS.join('、'));
 if(typeof chief!=='boolean')throw new Error('chief 须为布尔值');
 if(!Number.isInteger(min)||min<1||min>4)throw new Error('minScope 须为 1–4 的整数');
 if(typeof genre!=='string'||!LONGLIST_GENRES.includes(genre))throw new Error('genre 须为已知项目类型偏好，或空字符串（不限）');
 if(!domains.length&&!chief)throw new Error('请至少选择一项能力域，或勾选“需做过主策”。');
 return {domains:[...new Set(domains)],chief,min,genre};
}
function longlistHit(label,j,claims,scopeClaims=[]){
 const all=[...claims,...scopeClaims];
 return {label,jobId:j.id,projectId:j.projectId,claimIds:[...new Set(all.map(c=>c.id))],evidenceIds:[...new Set(all.map(c=>c.sourceId))],scopeClaimIds:[...new Set(scopeClaims.map(c=>c.id))],scopeEvidenceIds:[...new Set(scopeClaims.map(c=>c.sourceId))]};
}
function explainLonglist(db,need={}){
 const {domains,chief,min,genre}=longlistNeed(need),people=[...new Map(db.people.map(p=>[p.id,p])).values()];
 // 任期排序和范围判定均读取有效字段，隔离来源后不沿用记录上的旧值。
 const all=M.publishedJobs(db).map(j=>({...j,start:M.fieldClaims(db,j.id,'start').at(-1)?.value??0,end:M.fieldClaims(db,j.id,'end').at(-1)?.value??null}));
 const genreMatches=j=>!genre||!!project(db,j.projectId)?.genre?.includes(genre),out=[];
 for(const p of people){
  const js=all.filter(j=>j.personId===p.id),hits=[],reasons=[],checks=new Set();let met=0,scope=0,hard=true,chiefJob=null;
  const reason=(code,kind,label,domain)=>reasons.push({code,kind,label,...(domain?{domain}:{})});
  if(!js.length)reason('no_published_jobs','missing_evidence','没有可用的已发布任职证据（缺证不等于没有能力）');
  for(const d of domains){
   const rows=js.flatMap(j=>M.capabilitiesFor(db,j).filter(c=>c.domain===d).map(c=>{
    const claims=M.fieldClaims(db,j.id,'capability.domain').filter(f=>f.capabilityId===c.id&&f.value===d&&c.evidenceIds.includes(f.sourceId));
    const scopeClaims=M.fieldClaims(db,j.id,'capability.scope').filter(f=>f.capabilityId===c.id&&f.value===c.scope&&c.evidenceIds.includes(f.sourceId));
    const rank=scopeClaims.length?scopeRank(c.scope):0;
    return {j,c,claims,scopeClaims,rank,preferred:rank>=min&&genreMatches(j)};
   })).sort((a,b)=>Number(b.preferred)-Number(a.preferred)||b.rank-a.rank||b.j.start-a.j.start);
   if(!rows.length){hard=false;reason('missing_domain:'+d,'missing_evidence',`缺少「${d}」的职责证据（缺证不等于没有能力）`,d);continue;}
   const best=rows[0];met++;scope+=best.rank;
   if(best.rank<min){hard=false;reason((best.rank?'insufficient_scope:':'missing_scope:')+d,best.rank?'below_requirement':'missing_evidence',best.rank?`「${d}」最高责任范围为「${best.c.scope}」，低于要求的「${SCOPE_LABEL[min]}」`:`「${d}」缺少可判定责任范围的有效字段证据，尚不能确认达到「${SCOPE_LABEL[min]}」（缺证不等于没有能力）`,d);}
   hits.push(longlistHit(`${d} · ${best.rank?best.c.scope:'责任范围待核验'}`,best.j,best.claims,best.scopeClaims));
  }
  // minScope 仍只约束能力域；主策可由另一段有效岗位证据证明。
  if(chief){
   const chiefJobs=js.filter(j=>M.fieldClaims(db,j.id,'role').some(c=>c.value==='主策'));
   chiefJob=chiefJobs.find(genreMatches)||chiefJobs[0]||null;
   if(chiefJob)hits.push(longlistHit('主策任职',chiefJob,M.fieldClaims(db,chiefJob.id,'role').filter(c=>c.value==='主策')));
   else{hard=false;reason('missing_chief','missing_evidence','没有已发布的主策任职证据（缺证不等于没有经历）');}
  }
  const genreHit=!genre||hits.some(h=>genreMatches(h));
  if(!genreHit)reason('genre_preference','preference',`命中经历不含「${genre}」类项目（偏好项，不作淘汰）`);
  for(const h of hits){const j=js.find(x=>x.id===h.jobId);if(j.end===null)checks.add('结束时间未知：核验当前是否仍在该项目');if(M.fieldClaims(db,j.id,'end').some(c=>c.basis==='推定边界'))checks.add('任期末年为推定边界：核验实际离任时间');if(h.evidenceIds.length<2)checks.add('命中经历仅单一来源：补充独立来源');}
  if(js.length&&js.every(j=>j.end!==null))checks.add('最近任职已结束且去向未收录：先核实现状');
  checks.add('求职意向未知：不作推断，接触前由招聘同事评估');
  const latest=js.slice().sort((a,b)=>(b.end??9999)-(a.end??9999)||b.start-a.start)[0];
  const tier=!hits.length||(domains.length&&!met)?'C':hard?'A':'B';
  out.push({person:p,personId:p.id,tier,hits,gaps:reasons.map(r=>r.label),checks:[...checks],latestJobId:latest?.id??null,genreHit,score:met*10+scope+(chiefJob?5:0)+(genre&&genreHit?2:0),reasons});
 }
 out.sort((a,b)=>a.tier.localeCompare(b.tier)||b.score-a.score||a.personId.localeCompare(b.personId));
 const tiers={A:[],B:[],C:[]},distribution=new Map(),totalPeople=people.length;
 for(const row of out){
  tiers[row.tier].push(row);
  for(const r of row.reasons){
   if(!distribution.has(r.code))distribution.set(r.code,{...r,label:r.kind==='below_requirement'?`「${r.domain}」已收录责任范围低于要求的「${SCOPE_LABEL[min]}」`:r.label,count:0,personIds:[],denominator:totalPeople});
   const group=distribution.get(r.code);
   if(!group.personIds.includes(row.personId))group.personIds.push(row.personId);
  }
 }
 const gapDistribution=[...distribution.values()].map(g=>({...g,count:g.personIds.length,personIds:g.personIds.sort()}));
 return {rows:out,tiers,gapDistribution,totalPeople,evaluatedPeople:out.length,notice:'仅解释当前样本库的已发布任职与有效字段证据；已解释人数含无有效任职的 C 层。C 层表示未进入 A/B，不代表能力不合格；缺证不等于没有能力。责任范围不足仅指已收录证据低于本次要求；项目类型仅为偏好，不作淘汰。各原因按人去重，分母为总库去重人数；同一人可有多个原因，多原因人数不可相加。不能据此推断市场没人或 JD 过严；求职意向未知。'};
}
function longlist(db,need={}){
 return explainLonglist(db,need).rows.filter(r=>r.tier!=='C').map(({reasons,...row})=>row);
}

/* ---------- (c) human judgement & working state (never facts) ---------- */
function log(db,type,reason,changes,evidenceIds=[]){db.logs.push({id:M.id('L'),revision:++db.revision,type,reason,before:null,changes,evidenceIds,actor:'HRBP（演示）',date:M.now()});}
function saveAnalysis(db,eventId,input={}){
 const e=db.events.find(x=>x.id===eventId);if(!e||e.processStatus!=='已发布'||!M.supported(db,e))throw new Error('只能对有可用来源的已发布事件写研判');
 const v={};for(const k of ['signal','judgement','action','window']){v[k]=plain(input[k]);if(!v[k])throw new Error('信号、判断、建议行动、窗口期均需填写');}
 if(!PRIORITIES.includes(input.priority))throw new Error('优先级须为 P0 / P1 / P2');
 const reviewBy=String(input.reviewBy||'').trim();if(reviewBy&&!/^\d{4}-\d{2}-\d{2}$/.test(reviewBy))throw new Error('复核日期格式错误');
 if(INTENT.test(v.signal+v.judgement+v.action))throw new Error('研判不得写入候选人意向推断（如“强意向 / 可挖性高”）；意向线索须作为独立来源录入并核验。');
 db.analyses=db.analyses||[];const old=db.analyses.find(a=>a.eventId===eventId),next={id:old?.id||M.id('AN'),eventId,priority:input.priority,...v,reviewBy,author:plain(input.author||'HRBP（演示）',40)||'HRBP（演示）',updated:M.now(),kind:'人工判断'};
 if(old)Object.assign(old,next);else db.analyses.push(next);
 log(db,'研判更新',`${e.title} · ${next.priority}`,[{objectId:next.id,field:'信号 / 判断 / 行动（判断层）',old:old?clone(old):null,new:clone(next),effective:'仅判断层；不修改任何事实'}],e.evidenceIds);
 return next;
}
function poolItems(db){const meta=db.poolMeta||{};return (db.pool||[]).map(pid=>{const p=db.people.find(x=>x.id===pid);if(!p)return null;const m={status:'待研究',owner:'HRBP',need:'',nextReview:'',note:'',history:[],...(meta[pid]||{})};return {person:p,personId:pid,meta:m,overdue:!!m.nextReview&&m.nextReview<db.observationDate,basis:recommendation(db,pid)};}).filter(Boolean);}
function recommendation(db,pid){const js=M.publishedJobs(db).filter(j=>j.personId===pid).sort((a,b)=>a.start-b.start);return {caps:js.flatMap(j=>M.capabilitiesFor(db,j).map(c=>({domain:c.domain,scope:c.scope,projectId:j.projectId,jobId:j.id,evidenceIds:usable(db,c.evidenceIds)}))),chief:js.filter(j=>M.fieldClaims(db,j.id,'role').some(c=>c.value==='主策')).map(j=>j.id),latest:js.slice().sort((a,b)=>(b.end??9999)-(a.end??9999)||b.start-a.start)[0]||null,closed:js.length>0&&js.every(j=>j.end!==null)};}
function poolAdd(db,pid,{need='',reason=''}={}){if(!db.people.some(p=>p.id===pid))throw new Error('未知人员');db.poolMeta=db.poolMeta||{};if(!db.pool.includes(pid))db.pool.push(pid);const m=db.poolMeta[pid];need=plain(need,60);reason=plain(reason,300);if(!m)db.poolMeta[pid]={status:'待研究',owner:'HRBP',need,nextReview:addDays(db.observationDate,30),note:reason,added:db.observationDate,history:[{date:db.observationDate,status:'待研究',note:reason||'加入人才池'}]};else if(need)m.need=need;return db.poolMeta[pid];}
function poolRemove(db,pid){db.pool=db.pool.filter(x=>x!==pid);if(db.poolMeta)delete db.poolMeta[pid];}
function poolUpdate(db,pid,f={}){
 if(!db.pool.includes(pid))throw new Error('该人员不在人才池');if(!POOL_STATUS.includes(f.status))throw new Error('请选择有效跟进状态');
 const owner=plain(f.owner,40),need=plain(f.need,60),note=plain(f.note,300),next=String(f.nextReview||'').trim();if(!owner)throw new Error('请填写负责人');if(next&&(!/^\d{4}-\d{2}-\d{2}$/.test(next)||Number.isNaN(Date.parse(next))))throw new Error('复核日期格式错误');
 if(INTENT.test(note))throw new Error('跟进备注不得写入意向推断；如有意向线索请作为来源录入并注明时效。');
 if(f.status==='可推荐给业务'&&!note)throw new Error('标记“可推荐给业务”须写明依据（例如已核验的经历）。');
 db.poolMeta=db.poolMeta||{};const m=db.poolMeta[pid]||{history:[]},changed=m.status!==f.status;Object.assign(m,{status:f.status,owner,need,nextReview:next,note,updated:db.observationDate});m.history=[...(m.history||[]),...(changed||note?[{date:db.observationDate,status:f.status,note:note||'状态更新'}]:[])];db.poolMeta[pid]=m;return m;
}

/* ---------- validation of V3.1 collections ---------- */
const baseValidate=M.validateDatabase;
function validateDatabase(db){
 baseValidate(db);if(db.dataVersion!==M.DATA_VERSION)return true;
 const has=(k,id)=>db[k].some(x=>x.id===id);
 if(!Array.isArray(db.projectLinks)||!Array.isArray(db.analyses)||!db.poolMeta||typeof db.poolMeta!=='object'||Array.isArray(db.poolMeta))throw new Error('缺少 V3.1 集合：projectLinks / analyses / poolMeta');
 for(const l of db.projectLinks)if(!has('projects',l.fromId)||!has('projects',l.toId)||!l.evidenceIds?.length||!l.evidenceIds.every(id=>has('evidence',id))||!ev(db,l.evidenceIds[0]).text.includes(l.quote))throw new Error('项目关系引用或引文无效');
 for(const a of db.analyses)if(!PRIORITIES.includes(a.priority)||a.kind!=='人工判断'||['signal','judgement','action','window'].some(k=>typeof a[k]!=='string'))throw new Error('研判记录无效');
 for(const [pid,m] of Object.entries(db.poolMeta))if(!has('people',pid)||!POOL_STATUS.includes(m.status))throw new Error('人才池跟进记录无效');
 return true;
}
Object.assign(M,{VERSION:'3.1.0',DOMAINS,PRIORITIES,POOL_STATUS,SCOPE_LABEL,LONGLIST_PRESETS,scopeRank,expandSample:expand,analyses,dashboard,health,flows,heatmap,timeline,linksFor,longlist,explainLonglist,saveAnalysis,poolItems,recommendation,poolAdd,poolRemove,poolUpdate,validateDatabase,addDays});
})(typeof window!=='undefined'?window:globalThis);
