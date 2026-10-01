/* Deterministic adapter: no API, no network, no implied model inference. */
(function(root){
'use strict';const M=root.Mapping;
const AMBIGUOUS='【虚构论坛线索，演示稿，2026-09-20】花名“北辰”自称曾参与《云境》战斗设计；另一段转述称“北辰是该项目主策”。材料没有真实姓名、人员ID、任期或可独立核对的来源，无法确认是否指向库内人物，也无法确认岗位。';
const SAMPLES=[{id:'interview',title:'第一条：历史战斗访谈',text:M.DEMO,published:'2026-09-22',kind:'虚构开发者访谈'},{id:'supplement',title:'第二条：正式组长补充',text:M.SUPPLEMENT,published:'2026-09-21',kind:'虚构项目团队介绍'},{id:'ambiguous',title:'第三条：花名与岗位冲突',text:AMBIGUOUS,published:'2026-09-20',kind:'虚构论坛线索'}];
function extractIntelligence(input,context){
 const text=typeof input==='string'?input:input?.text,db=context?.db;if(typeof text!=='string'||!db)throw new Error('需要原文和当前数据上下文');
 const sample=SAMPLES.find(s=>s.text.trim()===text.trim());if(!sample)throw new Error('模拟模式仅支持三份完整预设材料；当前原文已保留，不会套用其他材料的答案。');
 let d;if(sample.id!=='ambiguous')d=M.extract(text,db);else d={id:M.id('D'),name:'北辰（身份未知）',personId:'',identityConfirmed:false,text:text.trim(),mode:'ambiguous',source:sample.kind,published:sample.published,created:M.now(),status:'待审核',facts:['参与战斗设计','主策说法待核验'].map((role,i)=>({id:M.id('F'),kind:'job',value:{projectId:'G-A2',role,start:null,end:null,module:'未知',scope:'未知',team:'待核验',capability:false},quote:i?'另一段转述称“北辰是该项目主策”。':'花名“北辰”自称曾参与《云境》战斗设计；',note:'身份与任期均未知；暂缓或拒绝，不合并现有人物。',decision:'defer',status:'待审核',overlapResolution:'defer',reviewNote:'',comparison:{action:'冲突 / 待核验',reason:'花名不能匹配唯一人员ID，岗位说法未核实'}}))};
 const source={kind:sample.kind,title:sample.title,published:sample.published,collected:db.observationDate,independence:'未核实',fiction:true};
 const reviewWarnings=['预设模拟结果，未调用真实AI；人工审核才会更新正式数据。',...(sample.id==='ambiguous'?['身份未知：仅可暂缓或拒绝，禁止强行合并。']:['来源独立性未核实；发布不代表交叉验证。'])];
 const provenance={adapter:'preset-simulation-v3.1.0',sampleId:sample.id,networkUsed:false};
 d.extraction={mode:'simulation',source,reviewWarnings,provenance};
 return {mode:'simulation',source,originalText:text,extractedFacts:M.clone(d.facts),reviewWarnings,status:'待审核',provenance,draft:d};
}
Object.assign(M,{VERSION:'3.1.0',SAMPLES,AMBIGUOUS,extractIntelligence});
})(typeof window!=='undefined'?window:globalThis);
