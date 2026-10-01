/* One registry for every independent, keyboard-accessible information button. */
window.helpRegistry={
 people:{title:'去重人员',see:'已发布人员与可解释的经历列表。',businessValue:'了解样本库能支持哪些人才研究，而非估计全市场供给。',basisAndLimit:'按人员唯一 ID 去重；同一人跨项目不重复创建。'},
 projects:{title:'查看项目组织',see:'公司、工作室、阶段历史和所选时期的组织骨架。',businessValue:'用有据的团队样本辅助岗位配置讨论。',basisAndLimit:'只显示已收录岗位；真实编制、未收录人数均未知。'},
 period:{title:'切换历史时期',see:'根据年份或阶段重算任职、成员、关系、事件与人数。',businessValue:'区别历史团队与最近已知团队。',basisAndLimit:'字段区分原文明确、推定边界、未知。推定边界不作为精确截止；查询可能列为时间待核验候选。当前资料仅精确到年；不虚构月份。阶段合并显示该阶段所有已收录人员。'},
 team:{title:'展开团队',see:'所选时期该模块的成员、职责、任职依据和历史任职。',businessValue:'从岗位模块发现可继续研究的人员。',basisAndLimit:'团队成员尚未收录不代表真实岗位空缺；分组位置不表示上下级。'},
 person:{title:'查看人物与历史组织',see:'最近已知身份、关键经历、能力与责任范围、证据和信息缺口。',businessValue:'看个人实际负责过什么，并沿历史项目找同期人才。',basisAndLimit:'能力来自职责原句；结束未知不代表确认现任，没有求职意向推断。'},
 relation:{title:'核验虚线关系',see:'双方、所涉项目时期、专门线索、缺失证据和人审动作。',businessValue:'把需要进一步核验的人际关系与已发布任职分开。',basisAndLimit:'虚线不进入正式汇报链；同期同项目不生成汇报箭头。确认须来源类型、标题、发布与采集日期、全文、逐字引文、独立性、审核人和有效期；人工批准不等于事实已独立核实。'},
 compare:{title:'查看变化前后',see:'当前项目所选年份与上一年，或所选阶段首尾的岗位和人员差异，以及引用证据的实际版本记录。',businessValue:'区分真实历史变动与本次新增收录，追溯谁在何时承担何种职责。',basisAndLimit:'前后快照从当前已发布的历史事实计算；不因同年变化推断直接交接。'},
 related:{title:'发现关联人才',see:'同期同项目的人、明确合作与待核验关系分别列出。',businessValue:'从一人扩展研究名单。',basisAndLimit:'共同项目不代表熟人、转介绍渠道或直接合作。'},
 evidence:{title:'查看原文证据',see:'原文、公开与采集日期、来源性质，以及该材料支持的具体对象和字段。',businessValue:'判断结论依据，发现缺证或同源重复。',basisAndLimit:'虚构演示；多段经历引用同一文本仍只是一份来源。不同文本也不自动独立交叉核验。'},
 extract:{title:'离线模拟抽取',see:'为本页三份完整材料生成可复现的事实提案。',businessValue:'演示资料整理与人工审核的分工。',basisAndLimit:'预置材料匹配，非实时 AI；未知或改写材料不会套用答案。'},
 review:{title:'逐条审核',see:'每项提案的身份、字段、引文、重复比较及确认／暂缓／拒绝。',businessValue:'先发布有依据的事实，保留不确定项，不给整篇材料一键背书。',basisAndLimit:'处理状态、事实核验状态、演示性质分开；人工发布不等于独立核验。'},
 publish:{title:'发布更新',see:'本次新增、补证据、暂缓数量；相关查询、项目组织与日志同步变化。',businessValue:'让维护者明确本次改了什么。',basisAndLimit:'同一既有任职只增补依据；冲突需要人工处置，审核前不可检索。'},
 query:{title:'关联人才查询',see:'战斗职责与主策任职的具体命中经历，公司、项目、时期、能力在经历①共同满足，主策可由经历②证明；也可选择同段满足。',businessValue:'形成有依据的候选长名单。',basisAndLimit:'有限关键词与结构化过滤，非任意自然语言理解；职责深度不是人才质量评级。'},
 follow:{title:'关注项目',see:'项目被加入或移出本地关注列表。',businessValue:'集中管理下次关注的项目。',basisAndLimit:'本轮仅本地关注；事件匹配消息、真实后台通知尚未实现。'},
 pool:{title:'加入人才池',see:'人员加入或移出当前浏览器的人才池。',businessValue:'保留下一步研究对象。',basisAndLimit:'不代表已接触或本人求职；加入后默认“待研究”、30天后复核，可在人才池更新状态、负责人与需求。'},
 logs:{title:'版本与撤销',see:'字段旧新值、处理人、记录时间、生效时间及原文。',businessValue:'解释变更并恢复错误发布前的事实。',basisAndLimit:'撤销保留证据和审计；按最近一次正式变更撤销。'},
 news:{title:'近30天新采集资料',see:'按演示观察日回推30个日历日的新采集证据清单，排除历史底库初始化。',businessValue:'区分资料采集新鲜度与历史事件发生时间。',basisAndLimit:'使用固定且显式显示的演示观察日，不冒称运行当天最新新闻。'},
 migration:{title:'V1 / V2 / V3.x 数据与备份',see:'导出原V1或V2；旧V2 / V3.0 显式备份后迁移 V3.1.0，保留审核进度；日期异常来源隔离。',businessValue:'升级演示而不悄悄改写已有操作。',basisAndLimit:'V1与V2人物不同，不做姓名映射；两套本地存储键独立保留。'},
 correction:{title:'提交核验任务',see:'记录目标对象、理由和责任人，进入待办。',businessValue:'让业务反馈成为可追踪的维护动作。',basisAndLimit:'关闭任务只记结论；不代表正式履历已被修正。'},
 company:{title:'公司与跨公司轨迹',see:'公司所属项目的人数及同一人物在不同公司的历次任职。',businessValue:'观察样本中的人才来源与项目分布。',basisAndLimit:'公司人数按人员 ID 去重；迁移事实必须有对应任职和证据。'}
};
Object.assign(window.helpRegistry,{
 storage:{title:'备份与跨版本恢复',see:'下载完整 JSON，或校验并确认导入；恢复前保留当前快照。',businessValue:'把演示进度带到另一个浏览器、电脑或交付形式。',basisAndLimit:'没有云端同步。file:// 存储受浏览器限制；临时模式关闭前须导出 JSON，下次导入恢复。'},
 reset:{title:'重置演示数据',see:'保存当前快照后恢复初始虚构样本（3 家公司、5 个项目、18 位人物）。',businessValue:'为下一位演示者重新走一遍录入、人审、查询流程。',basisAndLimit:'只重置当前浏览器的演示副本，不修改其他访问者；临时模式会先下载 JSON 备份。'},
 sourceReview:{title:'隔离或恢复来源',see:'填写原因与审核人后，该来源支持的字段、查询和关系即时重新计算。',businessValue:'在保留审计的同时停止使用存疑材料，避免误伤独立来源。',basisAndLimit:'不删除原文。头衔补证不能代替能力或任期来源；恢复不代表来源真实性已核实。'},
 role:{title:'切换演示视角',see:'HR 可录入、审核和维护；业务视角以查看、查询和提交核验为主。',businessValue:'演示信息维护者和使用者的不同路径。',basisAndLimit:'只是前端视角模拟，不是登录或安全权限；请勿输入真实个人资料。'}
});
Object.assign(window.helpRegistry,{
 delta:{title:'本轮新增 / 补证任职',see:'相对历史底库，由人审发布新增的任职段数与补充证据的任职段数，可逐条打开字段依据。',businessValue:'让维护者和使用者一眼看出“这段时间情报带来了什么变化”。',basisAndLimit:'只统计引用了非初始化来源的已发布任职；不统计待审核提案，不代表市场变化量。'},
 analysis:{title:'信号 → 判断 → 建议行动',see:'每个已发布事件分三层：①事实（原文与缺口）②信号与判断（HRBP 工作判断）③建议行动、窗口期、优先级与复核日。',businessValue:'把“发生了什么”推进到“所以呢、下一步做什么”，并能按优先级排期。',basisAndLimit:'判断层单独存储、不进入查询与组织事实；不得写入候选人意向推断；窗口期为人工设定的复核节奏，不是市场预测。修改写入版本日志。'},
 health:{title:'数据健康度',see:'原文明确依据率、单一来源占比、推定边界、结束未知、待核验关系与隔离来源；点击列出具体记录。',businessValue:'告诉维护者下一步该补哪条证据，而不是给出一个看不懂来源的总分。',basisAndLimit:'全部由字段主张与关系状态直接计数；不合成单一分数，不代表现实事实已被核实。'},
 flow:{title:'人才流向',see:'明确转岗、履历先后、同期跨项目和去向未收录分层展示；点击项目筛选，点击边下钻人物、任职、字段与原文。',businessValue:'在不混淆事实强度的前提下看人才来源与去向，并把聚合数字转成可补证的研究清单。',basisAndLimit:'确认净流量只计有已发布事件同时关联人员及前后任职的转岗。履历先后、同期兼任/借调和去向未知均不计净值；不推断离职原因或求职意向。'},
 flowConfirmed:{title:'明确转岗',see:'已发布事件同时关联同一人的前后两段任职；逐条展示事件、字段主张与原文。',businessValue:'提供可以用于样本内确认流入/流出的最强路径证据。',basisAndLimit:'仍是虚构演示及库内样本；人工发布不代表独立交叉核验，同一事件按人物计人次。'},
 flowCandidate:{title:'履历先后待核验',see:'同一人不重叠的相邻跨项目任职，但没有明确转岗事件。',businessValue:'把需要补证的潜在线路和已确认流动分开，避免图表制造结论。',basisAndLimit:'只说明履历时间先后，不证明直接转岗、离职原因或项目间关系，不计净流量。'},
 flowConcurrent:{title:'同期跨项目任职',see:'两段已发布任职在年份上重叠，单列人物、项目、任职与来源。',businessValue:'识别借调、兼任、外包支持或记录冲突，避免误算项目流动。',basisAndLimit:'时间重叠本身不能确认借调、兼职或冲突；人工核验前不计入流入/流出。'},
 flowNet:{title:'确认净流动口径',see:'每个项目仅汇总明确转岗的确认流入与流出，并旁列待核验路径和同期任职。',businessValue:'向业务展示可解释、可复核的样本净值，而不是把所有履历先后当成迁移。',basisAndLimit:'确认净值不含去向未收录；只描述库内已发布事件，不是公司实际人员增减。'},
 exits:{title:'去向未收录',see:'最近任职已结束、库内没有后续记录的人员。',businessValue:'形成“先核验现状”的研究清单，常与组织收缩事件一起看。',basisAndLimit:'可能已在未收录项目任职；不等于离职、待业或求职。'},
 heatmap:{title:'能力热力图',see:'项目 × 能力域矩阵：有职责证据的去重人数，括号内为带领小组 / 模块及以上人数。',businessValue:'看样本内哪些能力集中在哪些项目，点击直接进入组合查询。',basisAndLimit:'样本内集中度，不是市场稀缺度；“—”只表示未收录证据。'},
 timeline:{title:'架构演变时间轴',see:'项目每年的阶段、已收录人数、流入 / 流出、去向未收录和已发布事件。',businessValue:'把单年组织快照串成一条演变线，快速找到变化年份再下钻。',basisAndLimit:'按年回算，月份未知；推定边界年份的人数可能包含时间待核验人员。'},
 projectLinks:{title:'项目关系图谱',see:'团队迁移、疑似孵化、玩法延续等项目间关系，实线已发布、虚线待核验。',businessValue:'理解项目之间的人员与血缘线索，辅助判断从哪个项目找人。',basisAndLimit:'成员迁移不等于续作；讨论帖、玩家观感只作为待核验线索。'},
 longlist:{title:'需求 → 分层长名单',see:'按能力域、最低责任范围、是否做过主策与项目偏好，输出 A / B 两层名单，每人附命中依据、缺口与下一步核验。',businessValue:'把业务需求直接转成一份可解释、可复现的研究名单。',basisAndLimit:'规则匹配，不调用 AI、不评估人才质量或意向；缺证不等于没有能力。'},
 poolFollow:{title:'可行动人才池',see:'按跟进状态分栏；每人有负责人、对应需求、下次复核日、依据备注与跟进记录，推荐依据引用已发布经历。',businessValue:'从“收藏”升级为可排期、可交接的研究清单。',basisAndLimit:'工作记录不修改人员事实；不记录联系方式、不写意向推断；“可推荐给业务”必须写明依据。'}
});
Object.assign(window.helpRegistry,{
 requirements:{title:'需求版本与冻结交付',see:'保存需求名称、条件、负责人、业务方和状态；每次编辑留版本，交付冻结名单、条件、字段与原文，可记录反馈和按需求查看人才池。',businessValue:'追溯当时按什么要求交付了谁，支持交接与后续评价；不把保存或交付本身当作业务采纳。',basisAndLimit:'工作记录独立于事实。仅本地存储，无账号权限或消息发送；历史交付不自动重算，来源失效会提醒。实际记录时间与固定事实观察日分开。'},
 gapAnalysis:{title:'全库反向解释与原因分布',see:'A/B/C 覆盖全库去重人员，区分缺少证据、已有责任范围低于要求、项目偏好未命中；点开每项查看人员。',businessValue:'明确先补什么证据、哪些条件值得与业务讨论，避免把未入选者静默隐藏。',basisAndLimit:'分母为库内样本人数，原因按人去重但不可相加。C 层不是能力不合格；缺证不等于没有，A 层为零不证明市场没人或 JD 过严。'}
});
Object.assign(window.helpRegistry,{
 industryContext:{title:'公开行业资料与演示样本分层',see:'四条已核查的公开行业资料，逐条列出来源、发布日期、研究问题及适用限制。',businessValue:'为岗位平台要求、组织变动、项目署名和技能口径提供研究问题，而不伪造任何个人履历。',basisAndLimit:'公开的行业级数字不进入虚构人物、任职、项目、长名单或事实查询；不能推断具体团队编制或个人求职意向。点击来源链接才会访问外网。'},
 orgDiagnosis:{title:'组织分析',see:'梯队厚度、责任层级结构、真实 mapping 常见的数据坑，以及由规则推导的建议动作。',businessValue:'把“库里有谁”推进到“这个领域有没有厚度、下一步该补什么”，让与业务的讨论有结构。',basisAndLimit:'只由已发布任职与当前有效字段证据计算，描述的是样本库收录情况，不是真实编制、稳定性或流失风险。不涉及任何求职意向判断。'},
 bench:{title:'梯队厚度',see:'项目 × 能力域矩阵：有职责证据的去重人数，括号内为达到「带领小组 / 模块」及以上的人数；点格子查看成员。',businessValue:'识别哪些领域只靠一个人撑着，决定优先研究和补录的方向。',basisAndLimit:'“未收录证据”只说明本库没有材料，不代表该项目没有此类岗位；“样本内单点”不代表现实中只有一人。'},
 pyramid:{title:'责任层级结构',see:'按每人在库内达到过的最高责任范围归一层，观察是否符合金字塔形态。',businessValue:'层级倒挂能直接暴露职级口径没对齐或中间层漏收，这会让长名单按责任范围筛选失真。',basisAndLimit:'层级来自材料中的职责描述，不是真实职级体系；不同公司命名不可直接对齐。统筹类岗位常无单独能力证据，可能不计入。'},
 pathology:{title:'数据本身的坑',see:'同名不同人、同期跨项目、来源独立性不足，以及身份或职级冲突的待核验任职。',businessValue:'这些是资料问题不是人员问题；不先处理，后续所有名单和结论都会被污染。',basisAndLimit:'检出只是提示需要人工判读。同名不构成任何关联；时间重叠既不证明兼任也不证明冲突；独立性不足不等于内容错误。'},
 playbook:{title:'建议行动',see:'由固定规则从组织分析推导的动作清单，分优先级，每条附发现、理由、动作与依据。',businessValue:'把结构性发现直接转成可排期的研究与补证动作，而不是停在一张图表上。',basisAndLimit:'规则推导，不调用任何模型，不是招聘承诺。全部指向研究与补证，不涉及候选人意向、联系方式或推荐决定。'},
 persona:{title:'人才画像',see:'能力域与最高责任范围、轨迹形态、成长节奏、平均任期、涉及品类与证据强度。',businessValue:'比一句岗位描述更能判断这个人实际做到什么程度、适合什么方向的研究。',basisAndLimit:'全部由已发布任职与有效字段证据派生，精度只到年。不推断求职意向，不记录联系方式；待核验任职不计入。'}
});
for(const key of ['orgPlay'])window.helpRegistry[key]=window.helpRegistry.playbook;
for(const key of ['reqNew','reqSave','reqDeliver','reqHistory','reqRestore','reqDelivery','reqPool','reqExportDelivery'])window.helpRegistry[key]=window.helpRegistry.requirements;
for(const key of ['exportLegacy','exportV2','restoreBackup'])window.helpRegistry[key]=window.helpRegistry.storage;
