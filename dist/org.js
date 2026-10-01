/* V3.3 organisation analysis layer.
   Encodes real-world talent-mapping STRUCTURE (module taxonomy, level pyramid,
   recurring data pathologies) into fictional samples. No real company, person or
   personal data is ever introduced. Every metric derives from published facts and
   live field claims; nothing here infers job-seeking intent or contact details. */
(function(root){
'use strict';
const M=root.Mapping,OBS=M.OBSERVATION,clone=M.clone;
/* Real MMO design teams staff more than four disciplines; a four-domain taxonomy
   silently drops level/monetisation/systems designers out of every gap analysis. */
const EXTRA_DOMAINS=['关卡与副本','商业化与付费','玩法与系统'];
for(const d of EXTRA_DOMAINS)if(!M.DOMAINS.includes(d))M.DOMAINS.push(d);
for(const p of [{id:'level-lead',title:'关卡与副本负责人',domains:['关卡与副本'],minScope:3,chief:false,genre:''},
 {id:'monetisation-lead',title:'商业化负责人',domains:['商业化与付费'],minScope:3,chief:false,genre:''},
 {id:'systems-lead',title:'玩法与系统负责人',domains:['玩法与系统'],minScope:3,chief:false,genre:''}])if(!M.LONGLIST_PRESETS.some(x=>x.id===p.id))M.LONGLIST_PRESETS.push(p);
const PATHOLOGY={inflation:'职级自述与公开资料冲突',concurrent:'同期兼任 / 借调',boomerang:'离开后回到原公司',vendor:'外包或合作方身份归属不明',homonym:'同名不同人',secondhand:'二手转述来源'};
/* Published industry research is context for choosing verification questions, not input
   to publishedJobs, fieldClaims, queryMatches, longlist, analyses or recommendations. */
const INDUSTRY_CONTEXT=[
 {id:'market',source:'《2025年中国游戏产业报告》（人民网转述发布）',published:'2025-12-19',finding:'2025 年国内移动游戏收入占比 73.29%，客户端游戏占比 22.28%；多端是行业背景。',question:'与业务澄清岗位需要的项目平台经验：移动端、客户端，还是跨平台？把要求写成可验证的职责字段。',limit:'这是中国游戏市场销售收入结构，不是 MMO 策划供给、项目人头或本库覆盖率。',url:'https://jinbao.people.com.cn/n1/2025/1219/c421674-40628329.html'},
 {id:'employment',source:'GDC《2025 State of the Game Industry》',published:'2025-01-21',finding:'逾 3000 名全球游戏从业者参与的调查中，11% 的受访开发者表示过去一年曾被裁员。',question:'组织变动可以是研究入口；先核验具体人的近期任职与真实来源，再讨论是否值得纳入储备。',limit:'全球自选样本，不能外推中国 MMO 核心策划的离职率，更不能推断任何特定人物的求职意向。',url:'https://www.gdconf.com/article/gdc-2025-state-of-the-game-industry-devs-weigh-in-on-layoffs-ai-and-more/'},
 {id:'credits',source:'IGDA《Game Crediting Standards》',published:'行业标准页面',finding:'IGDA 指出开发者可能在制作名单中被错误标注、未标注或遗漏。',question:'名单可佐证被署名的作品与职能；若记录涉及借调或外包，须补充可核对的雇主、项目归属依据。',limit:'署名不等于劳动雇佣证明；未署名也不等于未参与。',url:'https://igda.org/resourcelibrary/game-industry-standards'},
 {id:'skills',source:'LinkedIn《Future of Recruiting 2025》',published:'2025',finding:'报告强调基于可观察技能而非仅凭学位或履历头衔进行评价，同时提示需要人工核实。',question:'向业务确认“带组 / 领域负责”的职责标准，再按任职经历与逐字引文建立画像，不由 Title 直接推能力。',limit:'跨行业招聘研究，不提供 MMO 团队的标准层级比例或市场人才数量。',url:'https://business.linkedin.com/talent-solutions/resources/future-of-recruiting'}
];
function src(id,text,source,published,extra={}){return {id,text,source,nature:'虚构演示资料',published,collected:OBS,recordedAt:M.now(),quality:'演示原文直接陈述；来源独立性未审核',factStatus:M.SINGLE,fiction:true,independence:'未审核',independentGroup:null,ingestionKind:'历史底库初始化',...extra};}

/* ---------- fictional sample shaped like real mapping output ---------- */
function expansion(){
 const x={companies:[{id:'C-D',name:'云澜互娱',market:'中国游戏行业'}],projects:[],evidence:[],people:[],jobs:[],capabilities:[],relationships:[],events:[],projectLinks:[],analyses:[]};
 const projectDefs=[
  ['G-D1','沧溟','C-D','云澜一工作室','动作 MMORPG','PC / 移动',[[2020,2021,'研发'],[2022,2022,'上线'],[2023,2026,'运营']],'内部代号「项目 O」'],
  ['G-D2','沧溟·归乡','C-D','云澜一工作室','动作 MMORPG','PC / 移动',[[2025,2026,'研发']],'资料片，与《沧溟》团队部分重叠']];
 for(const [pid,name,cid,studio,genre,platform,phases,alias] of projectDefs){const eid='E-'+pid;
  x.evidence.push(src(eid,`【虚构项目档案】${name}（${alias}）由云澜互娱的${studio}开发，类型${genre}，平台${platform}。阶段：${phases.map(([s,e,t])=>s+(s!==e?'—'+e:'')+'年'+t).join('；')}。实际团队总编制未知；代号与正式名的对应关系由档案直接给出，不是推断。`,'虚构项目档案','2026-09-10'));
  x.projects.push({id:pid,name,companyId:cid,studio,genre,platform,alias,start:phases[0][0],phases:phases.map(([start,end,name])=>({start,end,name,evidenceId:eid})),evidenceId:eid});}
 for(const [id,name] of [['P-D01','罗砚'],['P-D02','裴安'],['P-D03','岑野'],['P-D04','温叙'],['P-D05','卫楚'],['P-D06','卫楚'],['P-D07','尉迟朗'],['P-D08','阮清']])x.people.push({id,name,aliases:[],identity:'虚构样本身份；非现实人物',updated:OBS});
 // [jobId, personId, projectId, role, start, end, team, module, scope, domain, details, status, pathology, text]
 const defs=[
  ['J-D01','P-D01','G-D1','主策助理',2022,2024,'主策','策划协同（职责范围待核验）','未知','',[],'待核验','inflation','【虚构团队介绍】云澜互娱《沧溟》主创名单中，罗砚列为2022—2024年主策助理，协助策划协同工作。名单未写明其独立决策范围。'],
  ['J-D02','P-D02','G-D1','系统策划',2022,2023,'系统策划','养成与成长系统','带领小组 / 模块','玩法与系统',['养成系统','成长线'],'已发布','concurrent','【虚构履历】裴安于2022—2023年在《沧溟》带领养成与成长系统小组。'],
  ['J-D03','P-D02','G-B1','系统策划（借调）',2022,2023,'系统策划','跨项目系统支持','参与','玩法与系统',['系统支持'],'已发布','concurrent','【虚构团队资料】裴安于2022—2023年以借调身份参与《灵域传说》的跨项目系统支持；材料说明该阶段其主职仍在原项目。'],
  ['J-D04','P-D03','G-A1','关卡策划',2020,2021,'关卡策划组','副本关卡','参与','关卡与副本',['副本关卡'],'已发布','boomerang','【虚构履历】岑野于2020—2021年在《玄霄》参与副本关卡设计。'],
  ['J-D05','P-D03','G-D1','关卡策划',2022,2023,'关卡策划组','关卡节奏与副本','带领小组 / 模块','关卡与副本',['关卡节奏','副本'],'已发布','boomerang','【虚构履历】岑野于2022—2023年在《沧溟》带领关卡节奏与副本小组。'],
  ['J-D06','P-D03','G-A1','关卡设计负责人',2024,null,'关卡策划组','关卡与副本体系','领域负责','关卡与副本',['关卡体系','副本体系'],'已发布','boomerang','【虚构团队公告】岑野自2024年起回到《玄霄》，负责关卡与副本体系；结束时间未知。公告未说明其离开期间的雇佣关系。'],
  ['J-D07','P-D04','G-D1','战斗数值支持',2023,2024,'战斗策划组','战斗数值外包支持（雇主归属待核验）','未知','',[],'待核验','vendor','【虚构项目致谢】《沧溟》2023—2024年战斗数值外包支持名单中出现温叙。致谢名单未说明其受雇于云澜互娱还是外部供应商，也未说明具体职责范围。'],
  ['J-D08','P-D05','G-D1','商业化策划',2022,2024,'商业化','付费点与礼包设计','参与','商业化与付费',['付费设计','礼包'],'已发布','homonym','【虚构履历 A】卫楚（人员ID P-D05）于2022—2024年在《沧溟》参与付费点与礼包设计。'],
  ['J-D09','P-D06','G-C1','剧情策划',2021,2023,'世界 / 内容','剧情与任务文案','参与','世界与内容',['剧情文案'],'已发布','homonym','【虚构履历 B】卫楚（人员ID P-D06）于2021—2023年在《星海纪元》参与剧情与任务文案。此人与《沧溟》的同名策划并非同一人。'],
  ['J-D10','P-D07','G-D2','商业化负责人',2025,null,'商业化','商业化与付费体系','领域负责','商业化与付费',['商业化体系'],'已发布','secondhand','【虚构行业转述】有报道转述称，尉迟朗自2025年起负责《沧溟·归乡》的商业化与付费体系。该说法为二手转述，未见一手公告；结束时间未知。'],
  ['J-D11','P-D08','G-D1','世界内容策划',2021,2022,'世界 / 内容','区域世界观','参与','世界与内容',['区域世界观'],'已发布','','【虚构履历】阮清于2021—2022年在《沧溟》参与区域世界观设计。'],
  ['J-D12','P-D08','G-D1','世界内容组长',2023,2024,'世界 / 内容','世界观与主线','带领小组 / 模块','世界与内容',['世界观','主线'],'已发布','','【虚构团队介绍】阮清于2023—2024年担任《沧溟》世界内容组长，负责世界观与主线。'],
  ['J-D13','P-D08','G-D2','世界与内容负责人',2025,null,'世界 / 内容','世界与内容体系','领域负责','世界与内容',['世界与内容体系'],'已发布','','【虚构团队公告】阮清自2025年起负责《沧溟·归乡》的世界与内容体系；结束时间未知。']];
 const genreOf=id=>projectDefs.find(p=>p[0]===id)?.[4]||'MMORPG';
 for(const [jid,pid,gid,role,start,end,team,module,scope,domain,details,status,pathology,text] of defs){
  const eid='E-'+jid,e=src(eid,text,'虚构团队资料','2026-09-12',pathology==='secondhand'?{independence:'二手转述（非一手来源）',quality:'转述性质；未见一手公告，独立性不足'}:{});
  e.claims=[{objectId:jid,personId:pid,projectId:gid,role,start,end,module,scope,quote:text}];x.evidence.push(e);
  x.jobs.push({id:jid,personId:pid,projectId:gid,role,rawRole:role,start,end,precision:'年',team,module,scope,evidenceIds:[eid],processStatus:status,factStatus:status==='已发布'?M.SINGLE:'待核验',roleHistory:[],reviewedAt:OBS,pathology:pathology||undefined});
  if(domain&&status==='已发布')x.capabilities.push({id:'CAP-'+jid,jobId:jid,domain,details,scope,scenario:genreOf(gid),evidenceIds:[eid],quote:text,factStatus:M.SINGLE,processStatus:'已发布'});}
 // Self-reported title that contradicts the published roster: never auto-resolve.
 x.evidence.push(src('E-D01B','【虚构自述访谈】罗砚在访谈中自称2022—2024年担任《沧溟》主策。该说法与团队主创名单中的“主策助理”不一致，访谈未提供可核对的职责或授权范围。','虚构自述访谈','2026-09-08',{independence:'自述，未独立核实'}));
 x.projectLinks.push({id:'PL-4',fromId:'G-D1',toId:'G-D2',type:'资料片延续',year:2025,processStatus:'已发布',evidenceIds:['E-G-D2'],quote:'资料片，与《沧溟》团队部分重叠',gap:'档案只说明团队部分重叠；不能据此认为全部成员随迁或职责不变。'});
 return x;
}
function expand(t){
 const x=expansion(),full=Array.isArray(t.companies);
 for(const k of ['companies','projects','evidence','people','jobs','capabilities','relationships','events','projectLinks','analyses']){if(!Array.isArray(t[k]))continue;for(const it of x[k])if(!t[k].some(y=>y.id===it.id))t[k].push(clone(it));}
 if(full){const j=t.jobs.find(j=>j.id==='J-D01');if(j&&!t.evidence.some(e=>e.id==='E-D01B'))t.evidence.push(clone(x.evidence.find(e=>e.id==='E-D01B')));if(j&&!j.evidenceIds.includes('E-D01B'))j.evidenceIds.push('E-D01B');}
 return t;
}
(M.dataHooks=M.dataHooks||[]).push(expand);

/* ---------- talent persona: derived from published facts only ---------- */
const usable=(db,ids)=>[...new Set((ids||[]).filter(id=>M.sourceUsable(db,db.evidence.find(e=>e.id===id))))];
function liveScope(db,j,c){return M.fieldClaims(db,j.id,'capability.scope').some(f=>f.capabilityId===c.id&&f.value===c.scope&&c.evidenceIds.includes(f.sourceId))?M.scopeRank(c.scope):0;}
const SHAPE={0:'尚无能力职责证据',1:'纵深型（证据集中在单一能力域）'};
function persona(db,pid){
 const p=db.people.find(x=>x.id===pid);if(!p)throw new Error('未知人员');
 const js=M.publishedJobs(db).filter(j=>j.personId===pid).sort((a,b)=>a.start-b.start);
 const caps=js.flatMap(j=>M.capabilitiesFor(db,j).map(c=>({j,c,rank:liveScope(db,j,c),year:j.start})));
 const byDomain=[...new Set(caps.map(x=>x.c.domain))].map(d=>{const rows=caps.filter(x=>x.c.domain===d).sort((a,b)=>b.rank-a.rank);const best=rows[0];
  return {domain:d,topScope:best.rank?best.c.scope:'责任范围待核验',rank:best.rank,jobIds:rows.map(x=>x.j.id),evidenceIds:usable(db,rows.flatMap(x=>x.c.evidenceIds))};}).sort((a,b)=>b.rank-a.rank);
 const genres=[...new Set(js.map(j=>db.projects.find(g=>g.id===j.projectId)?.genre).filter(Boolean))];
 const companies=[...new Set(js.map(j=>db.projects.find(g=>g.id===j.projectId)?.companyId).filter(Boolean))];
 const entry=caps.filter(x=>x.rank===1).sort((a,b)=>a.year-b.year)[0],lead=caps.filter(x=>x.rank>=2).sort((a,b)=>a.year-b.year)[0];
 const growth=entry&&lead&&lead.year>entry.year?{fromYear:entry.year,toYear:lead.year,years:lead.year-entry.year,fromScope:entry.c.scope,toScope:lead.c.scope,jobIds:[entry.j.id,lead.j.id]}:null;
 const closed=js.filter(j=>j.end!==null);
 const tenure=closed.length?{closed:closed.length,avgYears:+(closed.reduce((s,j)=>s+(j.end-j.start+1),0)/closed.length).toFixed(1)}:null;
 const single=js.filter(j=>usable(db,j.evidenceIds).length<2).length,inferred=js.filter(j=>M.fieldClaims(db,j.id,'end').some(c=>c.basis==='推定边界')).length,open=js.filter(j=>j.end===null).length;
 const pend=db.jobs.filter(j=>j.personId===pid&&j.processStatus!=='已发布');
 const limits=['求职意向未知：系统不推断，也不记录联系方式。'];
 if(!js.length)limits.push('库内没有已发布任职，画像不成立；缺证不等于没有经历。');
 if(single)limits.push(`${single} 段任职仅单一来源，画像强度有限。`);
 if(inferred)limits.push('任期末年为推定边界，不能当作精确离任时间。');
 if(open)limits.push('结束时间未知只代表最近已知，不确认仍在职。');
 if(pend.length)limits.push(`另有 ${pend.length} 段待核验任职未计入画像（例如身份或职级存在冲突）。`);
 if(tenure&&tenure.closed<2)limits.push('已结束任职不足 2 段，平均任期只能作为参考。');
 return {person:p,personId:pid,domains:byDomain,shape:SHAPE[Math.min(byDomain.length,2)]||'复合型（证据覆盖多个能力域）',genres,companyCount:companies.length,companyIds:companies,growth,tenure,jobCount:js.length,pendingJobs:pend.map(j=>j.id),
  quality:{total:js.length,singleSource:single,inferredEnd:inferred,openEnd:open},limits};
}

/* ---------- organisation diagnosis (structure only, never intent) ---------- */
const BENCH={0:'未收录证据',1:'样本内单点'};
function bench(db){
 const js=M.publishedJobs(db);
 return db.projects.map(p=>({project:p,cells:M.DOMAINS.map(d=>{
  const hits=js.filter(j=>j.projectId===p.id).flatMap(j=>M.capabilitiesFor(db,j).filter(c=>c.domain===d).map(c=>({j,c})));
  const people=new Set(hits.map(h=>h.j.personId)),leads=new Set(hits.filter(h=>liveScope(db,h.j,h.c)>=2).map(h=>h.j.personId));
  return {domain:d,people:people.size,leads:leads.size,level:BENCH[leads.size]||'样本内有厚度',personIds:[...people],leadIds:[...leads]};})}));
}
function singlePoints(db){
 return bench(db).flatMap(r=>r.cells.filter(c=>c.leads===1).map(c=>{const pid=c.leadIds[0],j=M.publishedJobs(db).find(j=>j.personId===pid&&j.projectId===r.project.id&&M.capabilitiesFor(db,j).some(x=>x.domain===c.domain&&liveScope(db,j,x)>=2));
  return {projectId:r.project.id,domain:c.domain,personId:pid,jobId:j?.id||null,evidenceIds:j?usable(db,j.evidenceIds):[]};}));
}
function coverage(db){
 return bench(db).map(r=>{const covered=r.cells.filter(c=>c.people>0).map(c=>c.domain),missing=r.cells.filter(c=>!c.people).map(c=>c.domain);
  return {projectId:r.project.id,project:r.project,covered,missing,pct:Math.round(covered.length/M.DOMAINS.length*100)};});
}
function pyramid(db){
 const top=new Map();
 for(const j of M.publishedJobs(db))for(const c of M.capabilitiesFor(db,j)){const r=liveScope(db,j,c);if(r>(top.get(j.personId)?.rank??0))top.set(j.personId,{rank:r,scope:c.scope});}
 return [4,3,2,1].map(rank=>{const ids=[...top].filter(([,v])=>v.rank===rank).map(([k])=>k);
  return {rank,label:M.SCOPE_LABEL[rank],people:ids.length,personIds:ids};});
}
// Overlapping cross-project stints are usually secondment, not a move. Flow charts misread them.
function concurrent(db){
 const byP={};for(const j of M.publishedJobs(db))(byP[j.personId]=byP[j.personId]||[]).push(j);
 const out=[];
 for(const [pid,list] of Object.entries(byP))for(let i=0;i<list.length;i++)for(let k=i+1;k<list.length;k++){
  const a=list[i],b=list[k];if(a.projectId===b.projectId)continue;
  const lo=Math.max(a.start,b.start),hi=Math.min(a.end??9999,b.end??9999);
  if(lo<=hi)out.push({personId:pid,jobIds:[a.id,b.id],projectIds:[a.projectId,b.projectId],years:[lo,Math.min(hi,+db.observationDate.slice(0,4))],evidenceIds:usable(db,[...a.evidenceIds,...b.evidenceIds])});}
 return out;
}
function homonyms(db){
 const byName={};for(const p of db.people)(byName[p.name]=byName[p.name]||[]).push(p.id);
 return Object.entries(byName).filter(([,ids])=>ids.length>1).map(([name,personIds])=>({name,personIds}));
}
function secondhand(db){return db.evidence.filter(e=>M.sourceUsable(db,e)&&/二手转述|自述/.test(e.independence||'')).map(e=>({evidenceId:e.id,independence:e.independence,jobIds:db.jobs.filter(j=>j.evidenceIds.includes(e.id)).map(j=>j.id)}));}
function orgDiagnosis(db){
 const b=bench(db),py=pyramid(db),mid=py.find(x=>x.rank===2),lead=py.find(x=>x.rank===3);
 return {bench:b,singlePoints:singlePoints(db),coverage:coverage(db),pyramid:py,concurrent:concurrent(db),homonyms:homonyms(db),secondhand:secondhand(db),
  pyramidInverted:!!(mid&&lead&&mid.people<lead.people),
  notice:'全部结构指标仅由已发布任职与当前有效字段证据计算，描述的是样本库的收录情况，不是任何团队的真实编制、稳定性或人员流失风险。“未收录证据”不等于该项目没有此类岗位；“样本内单点”不等于现实中只有一人。不涉及任何求职意向判断。'};
}

/* ---------- rule-based playbook: explainable, never an AI guess ---------- */
const P=(id,kind,priority,finding,why,action,basis,limit)=>({id,kind,priority,finding,why,action,basis,limit});
function playbook(db){
 const d=orgDiagnosis(db),out=[],health=Object.fromEntries(M.health(db).map(h=>[h.key,h]));
 /* A single-point domain only carries signal when the SAME project shows depth elsewhere.
    If every recorded domain in a project is thin, that is a sampling gap, not a talent finding —
    reporting it as risk would manufacture six alarms out of one collection shortfall. */
 for(const row of d.bench){
  const recorded=row.cells.filter(c=>c.people>0),deep=recorded.filter(c=>c.leads>=2),thin=recorded.filter(c=>c.leads===1);
  if(!thin.length)continue;
  if(!deep.length&&thin.length>=2){out.push(P('thin:'+row.project.id,'扩样 mapping','P2',
   `《${row.project.name}》已收录的 ${recorded.length} 个能力域全部只有 1 位带组及以上人员，没有任何领域呈现厚度。`,
   '整个样本均匀地薄，优先考虑收录深度、外包分工与项目阶段差异；仅凭本库无法判断真实团队厚度。此时逐域报“单点风险”可能把一次收录缺口放大成多条虚假告警。',
   '先把这个项目整体补录到能看出厚度差异，再判断哪个领域是真的薄。补录前不要用本项目的梯队结论对业务下判断。',
   {projectId:row.project.id,personIds:[...new Set(recorded.flatMap(c=>c.leadIds))].slice(0,8)},
   '样本内薄不等于现实中薄；本条描述的是我们的收录状态，不是该团队的真实配置。'));continue;}
  for(const c of thin.slice(0,3)){const s=d.singlePoints.find(x=>x.projectId===row.project.id&&x.domain===c.domain)||{};
   out.push(P('single:'+row.project.id+':'+c.domain,'定向研究','P1',
   `《${row.project.name}》的「${c.domain}」只有 1 位带组及以上人员，而同项目另有 ${deep.length} 个能力域已收录到 2 人以上。`,
   '同一项目内部对比可帮助选择下一轮补录顺序，但资料来源与岗位配置也可能不同；不能排除选择性收录造成的差异。',
   '以该人所在项目与年份为起点，定向 mapping 同项目同领域的其他成员，验证这个薄是真实的还是仍有遗漏。',
   {personIds:[s.personId].filter(Boolean),jobIds:[s.jobId].filter(Boolean),evidenceIds:s.evidenceIds||[]},
   '样本内单点不代表现实中只有一人，也不代表该人有任何流动意向。'));}}
 for(const c of d.coverage.filter(c=>c.missing.length))out.push(P('coverage:'+c.projectId,'扩样 mapping','P2',
  `《${c.project.name}》有 ${c.missing.length} 个能力域没有任何职责证据：${c.missing.join('、')}。`,
  '能力域设置用于规划资料采集，不是任何项目的标准编制；整域未命中可能来自未收录、外包、阶段差异或实际岗位设置差异。',
  '按缺失能力域做定向补录，优先补与当前在招需求重叠的域。',
  {projectId:c.projectId},'“未收录证据”只说明本库没有材料，不能对外表述为该项目没有此类人才或岗位。'));
 if(d.pyramidInverted){const mid=d.pyramid.find(x=>x.rank===2),lead=d.pyramid.find(x=>x.rank===3);
  out.push(P('pyramid','与业务对齐','P1',
   `责任层级分布异常：「${lead.label}」${lead.people} 人，多于「${mid.label}」${mid.people} 人。`,
   '样本中上层人数多于中层，是提醒复核口径和收录覆盖的信号，不证明实际组织异常；项目规模和组织模式可能各不相同。',
   '与业务确认“带组 / 领域负责”的判定口径，并优先补录中间层证据，再重跑长名单分层。',
   {personIds:[...mid.personIds,...lead.personIds]},'层级来自材料中的职责描述，不是真实职级体系；不同公司命名不可直接对齐。'));}
 for(const c of d.concurrent)out.push(P('concurrent:'+c.jobIds.join('-'),'核验口径','P1',
  `${db.people.find(p=>p.id===c.personId).name} 在 ${c.years[0]}–${c.years[1]} 年同时有两个项目的已发布任职。`,
  '同期跨项目更常见的是借调、兼任或外包支持。流向图按相邻任职推导，会把这种情况误读成一次人员流动。',
  '核验是否为借调 / 兼任；在解读流向网络与净流动时手工排除该条，不要计入团队迁移。',
  {personIds:[c.personId],jobIds:c.jobIds,evidenceIds:c.evidenceIds},
  '重叠本身只是时间事实，既不证明兼任，也不证明任职冲突。'));
 for(const h of d.homonyms)out.push(P('homonym:'+h.name,'核验口径','P0',
  `库内有 ${h.personIds.length} 位同名「${h.name}」（${h.personIds.join(' / ')}）。`,
  '同名合并是人才库最常见也最难回滚的污染源：一旦合并，两个人的履历会互相污染所有查询与名单。',
  '保持独立人员 ID；任何检索结果出现该姓名时，先按项目与年份确认是哪一位，禁止按姓名合并。',
  {personIds:h.personIds},'姓名相同不构成任何关联；也不能据此推断亲属或同事关系。'));
 for(const s of d.secondhand)out.push(P('source:'+s.evidenceId,'补充证据','P1',
  `来源 ${s.evidenceId} 的独立性为「${s.independence}」，支撑 ${s.jobIds.length} 段任职。`,
  '二手转述与本人自述都无法独立验证。以此为唯一依据向业务推荐，一旦被追问原文就会失去可信度。',
  '寻找一手材料补证；补证前在名单中标注依据强度，不要与有一手来源的经历同等呈现。',
  {evidenceIds:[s.evidenceId],jobIds:s.jobIds},'独立性不足不等于内容错误，只表示当前不可独立核实。'));
 if(health.single&&health.single.pct>40)out.push(P('single-source','补充证据','P1',
  `${health.single.value}/${health.single.total} 段任职仅有单一来源（${health.single.pct}%）。`,
  '单一来源是这套证据体系的主要短板。对外汇报时，单来源结论最容易被业务方一问就倒。',
  '优先为进入长名单 A 层的人补第二份独立来源，其余按需求优先级排队。',
  {jobIds:(health.single.jobIds||[]).slice(0,12)},'同一段文本被多处引用仍然只算一份来源。'));
 // Distinctive findings first, so repeatable per-project items never bury a structural problem.
 const order={P0:0,P1:1,P2:2},kindOrder={'核验口径':0,'与业务对齐':1,'补充证据':2,'定向研究':3,'扩样 mapping':4};
 return {items:out.sort((a,b)=>order[a.priority]-order[b.priority]||kindOrder[a.kind]-kindOrder[b.kind]),
  notice:'建议由固定规则从已发布事实推导，不调用任何模型，也不是招聘承诺。全部指向研究与补证动作，不涉及候选人意向、联系方式或推荐决定。'};
}
Object.assign(M,{VERSION:'3.4.0',EXTRA_DOMAINS,PATHOLOGY,INDUSTRY_CONTEXT,expandOrgSample:expand,persona,bench,singlePoints,coverage,pyramid,concurrentJobs:concurrent,homonyms,secondhandSources:secondhand,orgDiagnosis,playbook});
})(typeof window!=='undefined'?window:globalThis);
