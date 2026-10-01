/* Shared domain model. No network or AI claims: template parser proposes drafts only. */
(function(root){
const DEMO='演示访谈记录：林澈在2021至2023年担任《星河战纪》的战斗组长，负责职业战斗与 PvP 模块。2024年转至《山海纪元》，担任主策；与原数值负责人周岚在同一项目工作。访谈未说明两人直接汇报关系。';
const clone=x=>JSON.parse(JSON.stringify(x));
const now=()=>new Date().toISOString();
const id=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
function seed(){return {schema:1,revision:0,people:[{id:'P001',name:'沈砚',alias:'',identity:'演示身份已确认'},{id:'P002',name:'周岚',alias:'岚',identity:'演示身份已确认'}],companies:[{id:'C001',name:'云岫游戏（虚构）'},{id:'C002',name:'远汐互动（虚构）'}],projects:[{id:'G001',name:'星河战纪',companyId:'C001',studio:'星河工作室',genre:'科幻 MMO',platform:'PC',stage:'运营期',effective:'2023'},{id:'G002',name:'山海纪元',companyId:'C002',studio:'山海工作室',genre:'国风 MMO',platform:'PC / 移动',stage:'研发期',effective:'2024'}],jobs:[{id:'J001',personId:'P001',projectId:'G001',role:'战斗负责人',start:2019,end:2020,module:'职业技能、PvP',scope:'领域负责',evidenceId:'E001',verified:'已确认',capability:'战斗体系'},{id:'J002',personId:'P001',projectId:'G002',role:'主策',start:2021,end:2023,module:'策划整体统筹',scope:'整体统筹',evidenceId:'E002',verified:'已确认',capability:''},{id:'J003',personId:'P002',projectId:'G001',role:'数值负责人',start:2021,end:2023,module:'数值与经济系统',scope:'领域负责',evidenceId:'E003',verified:'已确认',capability:'经济系统'}],evidence:[{id:'E001',text:'虚构履历摘录：沈砚于2019至2020年在《星河战纪》任战斗负责人，负责职业技能和 PvP 设计。',source:'演示档案 A',published:'2026-09-01',collected:'2026-09-22',status:'单一来源',quality:'直接描述职责；尚无独立来源',fiction:true},{id:'E002',text:'虚构履历摘录：沈砚于2021至2023年在《山海纪元》任主策，负责策划整体统筹。',source:'演示档案 B',published:'2026-09-01',collected:'2026-09-22',status:'单一来源',quality:'直接描述岗位；尚无独立来源',fiction:true},{id:'E003',text:'虚构履历摘录：周岚于2021至2023年在《星河战纪》任数值负责人，负责数值与经济系统。',source:'演示档案 C',published:'2026-09-01',collected:'2026-09-22',status:'单一来源',quality:'直接描述职责；尚无独立来源',fiction:true},{id:'E004',text:'虚构项目公告：2026年9月18日，《山海纪元》公布新一轮战斗系统测试计划，未披露人员调整或编制。',source:'模拟项目公告',published:'2026-09-18',collected:'2026-09-22',status:'待核验',quality:'仅作为更新线索',fiction:true}],events:[{id:'EV001',projectId:'G002',date:'2026-09-18',discovered:'2026-09-22',title:'山海纪元公布战斗系统测试计划',fact:'模拟公告提及战斗测试，未披露人员调整。',impact:'需要补充核验当期战斗职责与组织信息。',evidenceId:'E004'}],relationships:[],drafts:[],logs:[],pool:[],follows:[],tasks:[{id:'T001',title:'核验山海纪元当期战斗职责',projectId:'G002',evidenceId:'E004',status:'待核验',owner:'HRBP',reason:'模拟事件触发；不代表人员发生变动。'}]};}
function extract(text,db){
 const normalized=text.trim();
 // Deliberately narrow, documented template. Unsupported input is never filled with the demo answer.
 const m=normalized.match(/([^\s：:，。；]{2,8})在(\d{4})至(\d{4})年担任《([^》]+)》的([^，。；]+)，负责([^。]+)。\s*(\d{4})年转至《([^》]+)》，担任([^；。]+)/);
 if(!m)throw new Error('模拟模式仅支持此处示例句式。请保留“姓名在YYYY至YYYY年担任《项目》的岗位，负责模块。YYYY年转至《项目》，担任岗位”的结构，或使用示例。未生成任何记录。');
 const [,name,a,b,p1,r1,module,c,p2,r2]=m;
 if(+a>+b || +b>=+c || +c>new Date().getFullYear())throw new Error('时间顺序存在冲突：历史任职结束须早于新任职开始，且不能是未来年份。请核验原文。');
 const projects=[p1,p2].map(n=>db.projects.find(p=>p.name===n));
 if(projects.some(p=>!p))throw new Error('存在尚未建档的项目。阶段一不猜测项目类型或自动建档；请使用已建档的《星河战纪》与《山海纪元》。');
 const candidates=db.people.filter(p=>p.name===name||p.alias===name);
 return {id:id('D'),text:normalized,name,personId:candidates.length===1?candidates[0].id:'',candidates:candidates.map(p=>p.id),identityConfirmed:false,status:'待审核',created:now(),source:'虚构访谈 / 手工粘贴',jobs:[{projectId:projects[0].id,role:r1,start:+a,end:+b,module,scope:'待人工确认',capability:/战斗|PvP/i.test(module)?'战斗体系':'',quote:m[0].split('。')[0]+'。'},{projectId:projects[1].id,role:r2.trim(),start:+c,end:null,module:'未知',scope:'待人工确认',capability:'',quote:m[0].split('。')[1]}],relation:normalized.includes('周岚')&&normalized.includes('同一项目')?{otherId:'P002',type:'同项目',projectId:'',start:null,end:null,quote:'与原数值负责人周岚在同一项目工作'}:null,notes:['来源独立性尚未核验。','现任结束时间原文未提供；仅表示未记录结束，不保证目前仍任职。','同一项目不等于直接合作或汇报。']};
}
function publish(db,d){
 if(d.status!=='待审核')throw new Error('该提案已处理，不能重复发布。');
 if(!d.identityConfirmed)throw new Error('请人工确认身份匹配，避免同名自动合并。');
 let person=d.personId?db.people.find(p=>p.id===d.personId):null;
 if(d.personId&&!person)throw new Error('人员 ID 不存在。');
 if(!d.name.trim())throw new Error('姓名不能为空。');
 const jobs=d.jobs.map(j=>({...j,start:Number(j.start),end:j.end==null||j.end===''?null:Number(j.end)}));
 for(const j of jobs){if(!db.projects.some(p=>p.id===j.projectId)||!j.role.trim()||!Number.isInteger(j.start)||j.start<1980||j.start>new Date().getFullYear()||(j.end!=null&&(!Number.isInteger(j.end)||j.end<j.start||j.end>new Date().getFullYear())))throw new Error('请检查岗位、项目和有效年份。');}
 if(jobs[0].end==null||jobs[0].end>=jobs[1].start)throw new Error('两段任职时间存在重叠冲突，请核验后修正。');
 if(person){for(const j of jobs){const conflicts=db.jobs.filter(x=>x.personId===person.id&&Math.max(x.start,j.start)<=Math.min(x.end??9999,j.end??9999));if(conflicts.length)throw new Error('与该人员已发布经历存在时间重叠或重复。原提案已保留，请核验身份或时间，不能直接覆盖。');}}
 const before={people:clone(db.people),jobs:clone(db.jobs),relationships:clone(db.relationships)};
 if(!person){person={id:id('P'),name:d.name.trim(),alias:'',identity:'人工确认（演示）'};db.people.push(person);}
 const e={id:id('E'),text:d.text,source:d.source,published:'未知',collected:now(),status:'单一来源',quality:'原文陈述；尚未独立核验',fiction:true};db.evidence.push(e);
 const added=jobs.map(j=>({...j,id:id('J'),personId:person.id,evidenceId:e.id,verified:'人工审核发布',recorded:now()}));db.jobs.push(...added);
 if(d.relation){db.relationships.push({...clone(d.relation),id:id('R'),personId:person.id,evidenceId:e.id,status:'项目与时间待核验',projectId:null});}
 d.status='已发布';d.publishedPersonId=person.id;d.evidenceId=e.id;db.revision++;
 db.logs.push({id:id('L'),revision:db.revision,date:now(),actor:'HRBP（权限模拟）',type:'发布',object:person.id,reason:'人工审核身份、时间与能力提案',effective:jobs.map(j=>j.start+'–'+(j.end??'结束未知')).join('；'),evidenceId:e.id,before,after:{person:clone(person),jobs:clone(added)},draftId:d.id});return person;
}
function undo(db){const log=[...db.logs].reverse().find(l=>l.type==='发布'&&!l.undone);if(!log)throw new Error('没有可以撤销的发布版本。');
 db.people=clone(log.before.people);db.jobs=clone(log.before.jobs);db.relationships=clone(log.before.relationships);db.pool=db.pool.filter(id=>db.people.some(p=>p.id===id));log.undone=true;const d=db.drafts.find(d=>d.id===log.draftId);d.status='已撤销';db.revision++;db.logs.push({id:id('L'),revision:db.revision,type:'撤销',date:now(),actor:'HRBP（权限模拟）',object:log.object,reason:'撤销发布 V'+log.revision+'，证据与历史日志保留',effective:log.effective,evidenceId:log.evidenceId});}
function query(db,{text='',combat=false,chief=false,project='',capability=''}={}){return db.people.filter(p=>{const jobs=db.jobs.filter(j=>j.personId===p.id);if(combat&&!jobs.some(j=>j.capability==='战斗体系'))return false;if(chief&&!jobs.some(j=>j.role.includes('主策')))return false;if(project&&!jobs.some(j=>j.projectId===project))return false;if(capability&&!jobs.some(j=>j.capability===capability))return false;let q=text.trim();if(q.includes('战斗')||q.includes('主策'))return (!q.includes('战斗')||jobs.some(j=>j.capability==='战斗体系'))&&(!q.includes('主策')||jobs.some(j=>j.role.includes('主策')));return !q||[p.name,p.alias,...jobs.map(j=>j.role+' '+db.projects.find(g=>g.id===j.projectId).name)].join(' ').includes(q);});}
root.Mapping={DEMO,seed,extract,publish,undo,query,clone,id,now};
})(typeof window!=='undefined'?window:globalThis);
