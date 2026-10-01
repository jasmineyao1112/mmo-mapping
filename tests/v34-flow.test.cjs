const {test}=require('node:test'),a=require('node:assert/strict');
require('./load-current.cjs');
const M=globalThis.Mapping;

/* V3.4 流向分析回归测试：四层分类（明确转岗 / 履历先后 / 同期任职 / 去向未收录）
   与净流量结构。不绑定具体样本值，只锁定不变量，确保 flows(db) 重构不破坏口径。 */
test('V3.4 流向分析：四层分类与净流量结构完整',()=>{
 const db=M.seed();M.validateDatabase(db);
 const f=M.flows(db);
 a.ok(Array.isArray(f.edges));
 a.ok(Array.isArray(f.candidateEdges));
 a.ok(Array.isArray(f.concurrent));
 a.ok(Array.isArray(f.exits));
 a.ok(f.net&&typeof f.net==='object');
 a.equal(typeof f.method,'string');
 a.match(f.method,/净流入\/流出仅统计/);
 // 每个项目净流量字段齐全且为数字
 for(const p of db.projects){const n=f.net[p.id];a.ok(n,'net 缺项目 '+p.id);for(const k of ['in','out','exit','candidateIn','candidateOut','concurrent'])a.equal(typeof n[k],'number');}
 // 明确转岗 edge 结构
 for(const e of f.edges){a.ok(e.from&&e.to);a.equal(typeof e.count,'number');a.ok(Array.isArray(e.moves));a.equal(e.status,'已发布');a.ok(e.moves.length&&e.moves.every(m=>m.kind==='明确转岗'));}
 // 履历先后候选 edge 不参与净值
 for(const e of f.candidateEdges){a.equal(e.status,'待核验');a.ok(e.moves.length&&e.moves.every(m=>m.kind==='履历先后'));}
 // 同期任职统一标记，且独立于净流量
 a.ok(f.concurrent.every(x=>x.kind==='同期任职'),'同期任职应标记为同期任职');
});

test('V3.4 流向分析：明确转岗净流量守恒（全局净流入==净流出）',()=>{
 const db=M.seed();const f=M.flows(db);
 let tin=0,tout=0;for(const p of db.projects){tin+=f.net[p.id].in;tout+=f.net[p.id].out;}
 a.equal(tin,tout,'明确转岗净流入应等于净流出');
});

test('V3.4 流向分析：流向口径说明覆盖四层',()=>{
 const db=M.seed();const f=M.flows(db);
 a.match(f.method,/履历先后/);
 a.match(f.method,/同期任职/);
 a.match(f.method,/去向未收录/);
});
