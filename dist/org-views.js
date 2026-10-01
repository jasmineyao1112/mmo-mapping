/* V3.3 views: organisation diagnosis, level pyramid, data-pathology review, talent persona.
   Loaded after insight-views.js / requirements-views.js; reuses their shared helpers at call time. */
'use strict';
const PATH_LABEL={inflation:'职级自述与公开资料冲突',concurrent:'同期兼任 / 借调',boomerang:'离开后回到原公司',vendor:'外包或合作方身份归属不明',homonym:'同名不同人',secondhand:'二手转述来源'};
const KIND_TONE={'定向研究':'green','扩样 mapping':'','与业务对齐':'amber','核验口径':'red','补充证据':'amber'};
const orgJob=id=>db.jobs.find(j=>j.id===id);
function orgEvidence(ids){return (ids||[]).length?evidenceLink(ids):'<span class="muted small">无可用来源</span>';}

function orgAnalysisView(){
 const d=M.orgDiagnosis(db),pb=M.playbook(db),max=Math.max(1,...d.pyramid.map(x=>x.people));
 return `<section class="panel"><div class="panel-head"><div><h2>组织分析与行动建议</h2><p class="muted">按真实人才 mapping 的做法拆解：先看梯队厚度与层级结构，再看数据本身有没有坑，最后才给动作。</p></div>${info('orgDiagnosis')}</div><p class="hint">${esc(d.notice)}</p></section>

 <section class="panel section-space"><div class="panel-head"><h2>公开行业资料 · 背景而非样本事实</h2>${info('industryContext')}</div><p class="hint">来源、时间、适用边界逐条标出。以下公开资料不写入人员、任职或长名单，也不会自动改变任何虚构项目的研判。离线演示可正常使用；仅主动点击原始链接时才需要联网。</p><div class="req-gap-grid">${M.INDUSTRY_CONTEXT.map(x=>`<article class="req-gap-block"><h3>${esc(x.source)}</h3><p class="small muted">发布日期/年份：${esc(x.published)}</p><p><b>公开资料</b>　${esc(x.finding)}</p><p><b>转化为研究问题</b>　${esc(x.question)}</p><p class="small muted">限制：${esc(x.limit)}</p><a href="${esc(x.url)}" rel="noopener noreferrer" target="_blank">查看原始来源 ↗</a></article>`).join('')}</div></section>

 <section class="panel section-space"><div class="panel-head"><h2>建议行动 · ${pb.items.length} 条</h2>${info('playbook')}</div><p class="muted">${esc(pb.notice)}</p>
 ${pb.items.map(it=>`<article class="org-play p-${it.priority.toLowerCase()}"><div class="row spread"><div class="row">${tag(it.priority,it.priority==='P0'?'red':it.priority==='P1'?'amber':'')}${tag(it.kind,KIND_TONE[it.kind]??'')}</div></div><h3>${esc(it.finding)}</h3><p><b>为什么值得做</b>　${esc(it.why)}</p><p><b>建议动作</b>　${esc(it.action)}</p><p class="muted small">${esc(it.limit)}</p><div class="actions">${(it.basis.personIds||[]).slice(0,6).map(id=>personBtn(id)).join(' ')}${(it.basis.jobIds||[]).slice(0,4).map(id=>action('job','任职 '+esc(id),`data-id="${esc(id)}" data-year="all"`,'link','evidence')).join(' ')}${it.basis.projectId?projectLink(it.basis.projectId):''}${orgEvidence((it.basis.evidenceIds||[]).slice(0,4))}</div></article>`).join('')||'<p class="empty">当前样本没有触发任何规则。</p>'}</section>

 <section class="panel section-space"><div class="panel-head"><h2>梯队厚度 · 项目 × 能力域</h2>${info('bench')}</div><p class="muted">格内为有该能力职责证据的去重人数，括号内是其中达到「带领小组 / 模块」及以上的人数。人员配置因项目阶段和分工而异，本图不能推定每个团队的应配人数。</p>
 <div class="tablewrap"><table class="heat"><thead><tr><th>项目</th>${M.DOMAINS.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${d.bench.map(r=>`<tr><td>${projectLink(r.project.id)}<br><small class="muted">${esc(r.project.genre)}</small></td>${r.cells.map(c=>`<td>${c.people?act('bench',`<b>${c.people}</b><small>（${c.leads}）</small>`,`data-project="${r.project.id}" data-domain="${esc(c.domain)}"`,'heat-cell bench-'+(c.leads?c.leads===1?'thin':'ok':'none')):'<span class="heat-empty">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 <div class="legend section-space"><span class="bench-key bench-ok"></span>有厚度（带组以上 ≥2） <span class="bench-key bench-thin"></span>样本内单点（带组以上 =1） <span class="bench-key bench-none"></span>有人但无带组证据 <span class="heat-empty">—</span> 未收录任何证据</div>
 <p class="small muted">“—”只说明本库没有材料，不能对外表述为该项目没有此类岗位或人才。</p></section>

 <section class="panel section-space"><div class="panel-head"><h2>责任层级结构</h2>${info('pyramid')}</div><p class="muted">按每人在库内达到过的最高责任范围归一层。这是检查样本收录和职责口径的图，不是任何公司的标准组织架构。</p>
 ${d.pyramid.map(l=>`<div class="barrow"><span>${esc(l.label)}</span><span class="bartrack"><span class="barfill ${d.pyramidInverted&&l.rank===2?'warn':''}" style="display:block;width:${l.people/max*100}%"></span></span><span>${l.people} 人</span></div>`).join('')}
 ${d.pyramidInverted?'<p class="error section-space">样本层级倒挂：「领域负责」人数多于「带领小组 / 模块」。先检查样本对中间层的收录覆盖与职级口径，再讨论需求条件；不能据此认定真实组织结构异常。</p>':'<p class="muted section-space">当前分布未出现倒挂。</p>'}
 <p class="small muted">层级来自材料中的职责描述，不是真实职级体系；不同公司的层级命名不可直接对齐。统筹类岗位常常没有单独的能力职责证据，可能整体不计入本图。</p></section>

 <section class="panel section-space"><div class="panel-head"><h2>数据本身的坑 · 真实 mapping 常见情形</h2>${info('pathology')}</div><p class="muted">这些不是人员问题，是资料问题。不先处理，后面所有名单和结论都会被污染。</p>
 <div class="req-gap-grid">
  <div class="req-gap-block"><h3>同名不同人 · ${d.homonyms.length}</h3><p class="small muted">人才库最难回滚的污染源</p>${d.homonyms.map(h=>`<p>${esc(h.name)}：${h.personIds.map(id=>personBtn(id)).join(' 与 ')}<br><span class="muted small">按项目与年份区分，禁止按姓名合并</span></p>`).join('')||'<p class="muted">未检出</p>'}</div>
  <div class="req-gap-block"><h3>同期跨项目 · ${d.concurrent.length}</h3><p class="small muted">多为借调兼任，流向图会误读成流动</p>${d.concurrent.map(c=>`<p>${personBtn(c.personId)} ${esc(c.years[0])}–${esc(c.years[1])} 年<br>${c.projectIds.map(id=>projectLink(id)).join(' ＋ ')}</p>`).join('')||'<p class="muted">未检出</p>'}</div>
  <div class="req-gap-block"><h3>来源独立性不足 · ${d.secondhand.length}</h3><p class="small muted">二手转述与本人自述都无法独立核实</p>${d.secondhand.map(s=>`<p>${esc(s.independence)}<br>${orgEvidence([s.evidenceId])}</p>`).join('')||'<p class="muted">未检出</p>'}</div>
 </div>
 <h3 class="section-space">待核验任职 · ${db.jobs.filter(j=>j.processStatus!=='已发布').length}</h3><p class="muted">身份、职级或雇主归属存在冲突，未进入任何查询、名单与派生指标。</p>
 ${db.jobs.filter(j=>j.processStatus!=='已发布').map(j=>`<div class="task"><div>${personBtn(j.personId)} · ${esc(project(j.projectId).name)} · ${esc(j.role)}<p class="muted small">${j.pathology?esc(PATH_LABEL[j.pathology]||j.pathology)+' · ':''}${esc(j.module)}</p></div>${orgEvidence(j.evidenceIds)}</div>`).join('')||'<p class="muted">无。</p>'}</section>`;
}

/* ---------- talent persona ---------- */
function personaBody(pid){
 const k=M.persona(db,pid);
 if(!k.jobCount)return `<p class="empty">该人物在库内没有已发布任职，画像不成立。缺证不等于没有经历。</p>${k.pendingJobs.length?`<p class="muted">另有 ${k.pendingJobs.length} 段待核验任职。</p>`:''}`;
 return `<div class="row">${tag(k.shape,'green')}${k.genres.map(g=>tag(g)).join('')}${k.companyCount>1?tag('跨 '+k.companyCount+' 家公司','amber'):''}</div>
 <h3 class="section-space">能力域与最高责任范围</h3>
 ${k.domains.map(x=>`<p>${tag(x.domain,'green')} ${esc(x.topScope)} ${x.jobIds.map(id=>action('job','任职 '+esc(id),`data-id="${esc(id)}" data-year="all"`,'link','evidence')).join(' ')} ${orgEvidence(x.evidenceIds)}</p>`).join('')||'<p class="muted">尚无能力职责证据。</p>'}
 <h3 class="section-space">轨迹特征</h3>
 <p><b>成长节奏</b>　${k.growth?`${k.growth.fromYear} 年「${esc(k.growth.fromScope)}」→ ${k.growth.toYear} 年「${esc(k.growth.toScope)}」，间隔 ${k.growth.years} 年`:'库内证据不足以判断（需要同时有参与期与带组以上的职责证据）'}</p>
 <p><b>平均任期</b>　${k.tenure?`${k.tenure.avgYears} 年（按 ${k.tenure.closed} 段已结束任职计算，精度为年）`:'没有已结束的任职，无法计算'}</p>
 <p><b>已发布任职</b>　${k.jobCount} 段　<b>涉及品类</b>　${k.genres.map(esc).join('、')||'未收录'}</p>
 <h3 class="section-space">证据强度</h3>
 <p class="muted">单一来源 ${k.quality.singleSource}/${k.quality.total} · 任期末年为推定 ${k.quality.inferredEnd} · 结束时间未知 ${k.quality.openEnd}</p>
 <h3 class="section-space">使用限制</h3>${k.limits.map(l=>`<p class="muted small">· ${esc(l)}</p>`).join('')}
 <div class="actions">${db.pool.includes(pid)?tag('已在人才池'):action('pool','＋ 加入人才池',`data-id="${esc(pid)}"`,'link','pool')}</div>`;
}
Object.assign(window.extraModals,{
 persona(m){return ['人才画像 · '+esc(person(m.id).name),personaBody(m.id)];},
 bench(m){const cell=M.bench(db).find(r=>r.project.id===m.id)?.cells.find(c=>c.domain===m.domain);const p=project(m.id);
  return [`梯队 · ${esc(p.name)} × ${esc(m.domain)}`,`<p>${cell.people} 人有该能力职责证据，其中 ${cell.leads} 人达到「带领小组 / 模块」及以上。</p>${tag(cell.level,cell.leads===1?'amber':cell.leads?'green':'')}
  <h3 class="section-space">成员</h3>${cell.personIds.map(id=>`<div class="task"><div>${personBtn(id)}${cell.leadIds.includes(id)?' '+tag('带组以上','green'):''}</div>${action('persona','人才画像',`data-id="${esc(id)}"`,'link','persona')}</div>`).join('')||'<p class="muted">该能力域未收录成员。</p>'}
  <p class="hint section-space">这是样本库的收录情况，不是该项目的真实编制。“单点”既可能是人才稀缺信号，也可能只是我们收录不足；补录后才能分辨。</p>`];}
});
Object.assign(window.insightActions,{
 persona(b){openModal('persona',b.dataset.id);},
 bench(b){openModal('bench',b.dataset.project,{domain:b.dataset.domain});}
});
