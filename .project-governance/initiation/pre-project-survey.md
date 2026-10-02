# NutriAuditListExport（保健品清单导出）：正式准入与受控集成

日期：2026-10-02T01:44:34.478723+00:00。范围：新增独立公开仓库，不创建医疗产品或数据库。

## 问题与目标
用户希望完成清单导出这一具体标签任务，开发者希望离线独立运行；完成后可选进入主站完整清单审计。用户已明确批准三项目、文档、导流与主站归因。真实采用与流量规模未知。

## 研究复用与更新
复用标签公开包2026-10-01的四条survey lane与已核验直接候选；它覆盖本轮任务，原文件不覆盖。2026-10-02官方collector新增六组宽窄查询，当前MIT上游精确commit ec9615a2212c3cce01c98e2fdf5dbba85dab1f7f。窄查询使用名称/简介减少无关README命中。外部快照仍保留各自实际observed_at，不把旧观察改成今天。来源、维护、采用与安全的不确定性继承如下。

## 来源与候选
- mathjs：https://github.com/josdejong/mathjs；commit=8d214e050a0acb9f132405d55a96b683fa7b6324；维护=active，采用=unknown，许可=Apache-2.0，安全=unknown。优势：Direct mass unit conversion; third-party library。限制：Whole eight-task label workflow not verified; inference from documented math-library scope
- wger：https://github.com/wger-project/wger；commit=5652a8ad87fa4f154e33720127d335ca06f705a5；维护=active，采用=unknown，许可=AGPL-3.0，安全=unknown。优势：Nutrition plans, records and REST API。限制：Self-hosted application differs from a dependency-free embeddable module
- nutrition-label：https://github.com/nutritionix/nutrition-label；commit=cd1ca81c2412529b376f0a77aa96edd442fcdde8；维护=inactive，采用=unknown，许可=MIT，安全=unknown。优势：Render nutrition labels from supplied data。限制：jQuery dependency and display workflow differ from arithmetic/compare functions
- SupplementTracker：https://github.com/hunterthompson025/SupplementTracker；commit=e87197869833669e91285eb77a7bd49b961bcd79；维护=active，采用=unknown，许可=MIT，安全=unknown。优势：Household inventory, depletion and reordering。限制：Documented Firebase authentication/database differ from no-account offline constraints
- PJT_kleerer.io：https://github.com/McJack3d/PJT_kleerer.io；commit=fcfaffc95658c90e4563e0b36c148b44f50cad7c；维护=active，采用=unknown，许可=AGPL-3.0，安全=unknown。优势：Static dependency-free offline catalogue, product comparisons and stack sums。限制：Clinical scoring/catalogue/pipeline and layered AGPL/restricted-data license differ from MIT manual-input arithmetic module; API extractability not tested
- stack：https://github.com/ilodezis/stack；commit=583b40c9a767ed5de800d1ec726359b4783f1dc5；维护=active，采用=unknown，许可=UNKNOWN，安全=unknown。优势：Offline no-account PWA with local storage, stock and export。限制：Persistent tracking differs from transient label arithmetic functions; reusable license not confirmed
- NutriAudit Label Tools：https://github.com/JinHanAI/nutriaudit-label-tools；commit=ec9615a2212c3cce01c98e2fdf5dbba85dab1f7f；维护=active，采用=unknown，许可=MIT，安全=needs_review。优势：已具备本轮任务函数、未知信息处理、离线演示及MIT许可，可集成复用。。限制：当前八工具入口没有三个独立任务项目与分别的项目来源标记；独立入口降低选择成本是假设，未证明排名或转化改善。

## 第一性原理决定
选择integrate：从已公开MIT工具包固定commit派生共享纯逻辑与主题，聚焦inventory。不重写营养算法，不复制商业站/用户数据，不下载竞品数据。相邻方案和电子表格能完成任务，未证明市场空缺；选择集成的理由是已有共享输入契约与可执行边界，低增量成本。三份独立发行增加维护成本，其收益为可证伪实验，不是SEO权重倍增承诺。

最低差异：直接提供多产品可打印CSV清单、下载失败打印恢复、公式前缀中和与输入本地保留；独立可运行的聚焦默认演示、真实任务问答与固定项目campaign和入口content。代码核心保持同一来源hash，修复统一复验。README、演示、Guide内容按任务分别编写，禁止仅换标题复制八功能包。

## 替代、成本与反证
只保留主工具包是最少维护的替代；单纯文档独立入口也可更轻。这里用用户批准的三独立任务验证额外入口，复用现有静态模块减少Token和维护，不增加付费服务、依赖、账户或数据源。若来源访问和真实完成没有增量，合并文档入口并停止新增仓库。不能由Stars、CI、发布或一次合成调用推断市场采用。

## 必须通过的验收
公开范围MIT许可与来源、脱敏；代码正常/缺失/非法单位与CSV边界；手机/Pad横竖屏、窄输入与表格、触控、下载/打印、核心链接。演示不采集，外链不带健康资料；主站首次/最近来源跨工具和scan保留，不影响已有支付与佣金归属。先Private审计CI再按已获授权Public。实机未知，模拟明确标注。

## 仍未知与回退
关键词需求、Google/Bing收录、AI检索引用、真实引荐和转化未知。公开项目可独立使用，核心引导可选；若无增量先停止扩张，不做垃圾外链。新仓库都是独立交付工具，存放开源根的独立正式目录，经canonical creator创建，登记目录索引。所有生产发布继续走NutriAudit受控事务，未改变成本门禁或账号权限。

## 独立反方补查：Groly
https://github.com/peterthepeter/groly；精确commit f86a9b7ced93047f2dc3210a77be6293e315c7c9，许可 AGPL-3.0；默认提交日期 2026-09-29T07:49:05Z，未归档。README实际覆盖补充剂每单位营养/日总量、PDF导出和PWA离线，不能将这些功能说成市场空缺。它需Docker部署、SQLite和受邀请账号，而本轮限定无账户静态模块；不复制AGPL代码或健康数据。真实采用及安全未知。Groly与只保留总工具包均是有效替代，本轮集成只验证聚焦入口和项目归因是否有增量。
宽/窄两批官方搜索快照分别保留github-search.snapshot.json和github-search-focused.snapshot.json；三份新项目内容按任务区别，核心函数复用不代表原创算法。
