---
quick: 260722-byv
status: complete
completed: 2026-07-22
verdict_1_2: no
verdict_1_3: conditional
---

# Quick Task 260722-byv Summary: 1.2 / 1.3 用户侧 LTS 适用性评估

## Executive verdict

**截至 2026-07-22，两者都不应直接对用户标记为 LTS。**

- **1.2 正式版：NO，不适合作为用户侧 LTS，也不建议继续作为默认安装版本。** 它虽然有 GitHub 正式 Release，但从源码重新打出的 npm 包不能在干净项目中安装，且当前安全政策不会继续维护旧 minor。
- **1.3 预览版：CONDITIONAL，是唯一合理的 LTS 候选，但现在还不是用户可用的 LTS。** 它已有很强的本地 release-ready 证据，且从已审计候选到当前 HEAD 没有产品/发布文件变化；但尚未在维护 fork 创建正式 tag/release、尚未发布 npm 包、远端门禁与 live UAT 未完成，也没有明确的 LTS 支持窗口和补丁承诺。

**推荐决策：** 不给 1.2 加 LTS 标签；将 1.3 作为“LTS candidate / 预览候选”，完成发布与支持治理清单后，把 **1.3.x** 升格为第一个用户侧 LTS。若今天必须给用户一个可下载版本，1.2 只能作为 GitHub 源码快照/已知版本留档，不能作为可通过 npm 正常安装的长期支持版。

## Assessment boundary

本报告区分三个不同层级：

1. **能运行/测试通过**：某个 checkout 或构建在已知环境中可工作。
2. **可发布 stable**：候选包可复现、可隔离安装、身份/依赖/安全门禁通过。
3. **可承诺 LTS**：除 stable 质量外，还必须有用户可获取的不可变发布物、明确支持窗口、补丁与安全修复政策、升级/回滚路径和持续维护能力。

因此，“1.2 是正式 Release”不自动等于 LTS；“1.3 本地审计 PASS”也不自动等于已经发布或已经具备长期支持承诺。

## Version objects and current availability

| 项目 | 1.2 正式版 | 1.3 预览版 / 候选 |
|---|---|---|
| 本次对应对象 | fork tag/release `legacy-1.2` | 本地已审计 `reasonix-legacy@1.3.0` candidate |
| 时间 | tag 2026-07-15；GitHub Release 2026-07-15 | clean candidate audit 2026-07-19；本报告复核 2026-07-22 |
| 源码 SHA | tag object 指向 commit `4fb560e3a5d6` | audited source `cc8bbad1d99b`，tree `ca7a220afcf3` |
| 当前 HEAD 关系 | 已被后续硬化工作明显替代 | 当前 HEAD `5eaf891140d`；相对 audited candidate 只有 `.planning/` 变化，产品与发布文件无变化 |
| GitHub fork Release | 有，`legacy-1.2`，非 prerelease | 无对应 fork 1.3 Release |
| origin tag | 有 `legacy-1.2` | origin 无 fork 的 `v1.3.0` / 1.3 release tag |
| npm registry | `reasonix-legacy` registry 查询为 HTTP 404 | 同样未发布；没有 `latest` / `next` 可供用户安装 |
| 可验证安装包 | GitHub Release 无附加二进制/tarball asset；源码 `npm pack` 有致命缺陷 | 仓库证据中有经过真实 pack 与隔离安装验证的 `reasonix-legacy-1.3.0.tgz`，但不是公开发布物 |

> 仓库还包含上游历史 `v1.2.0` / `v1.3.0` 标签；根据 `docs/governance.md`，这些是上游 lineage，不是当前 fork 的用户版本。本报告不把它们当作 fork LTS 发布对象。

## LTS gate matrix

| LTS 门槛 | 1.2 | 1.3 candidate | 说明 |
|---|---|---|---|
| 不可变发布对象 | **部分通过** | **未通过** | 1.2 有 GitHub tag/release；1.3 只有本地候选 SHA/证据，尚无 fork 正式 tag/release。 |
| 普通用户可获取 | **未通过** | **未通过** | npm registry 中不存在 `reasonix-legacy`；1.2 release 也没有附加可安装资产。 |
| 可复现打包 | **未通过** | **通过（本地）** | 1.2 从 tag 执行 `npm pack --ignore-scripts` 仅得到 5 个条目，不含 `dist/`；1.3 真实 tarball 包含 170 个条目。 |
| 干净环境安装 | **未通过** | **通过（本地）** | 1.2 tarball 安装报 `EUNSUPPORTEDPROTOCOL: workspace:*`；1.3 隔离安装成功且只有 `reasonix-legacy` bin。 |
| 包/CLI 身份一致 | **未通过** | **通过** | 1.2 package 名为 `reasonix-legacy`，但 bin 仍为 `reasonix` 与 `dsnix`，lock root 仍是 `0.55.0`；1.3 统一为 `reasonix-legacy 1.3.0`。 |
| 生产依赖安全门禁 | **不足/未通过** | **通过（候选）** | 1.2 的生产依赖泄漏 `ink: workspace:*`，无法正常消费；1.3 production audit 为 0 vulnerabilities，且无生产 `workspace:*`。 |
| 全量质量门禁 | **历史通过但不足** | **通过** | 1.2 release note 记录 279 文件/3788 测试通过，但这没有覆盖最终消费包安装失败；1.3 clean verify 为 281 文件/3800 测试通过，0 failed。 |
| 远端 CI/CodeQL 与发布门禁 | **不形成 LTS 证据** | **待完成** | 1.3 workflow 已硬化，但候选尚未以正式 release/tag 跑完远端链路。 |
| live 用户路径 UAT | **不完整** | **待完成/可接受为条件** | Telegram、Weixin、交互式 TTY 仍是凭据/网络/终端依赖的人工 UAT。 |
| 明确支持窗口 | **未通过** | **未通过** | 当前没有“支持到何时”的 LTS 生命周期文件或承诺。 |
| 旧分支补丁/回移植政策 | **未通过** | **未通过** | `SECURITY.md` 明确只维护 npm 上最新发布 minor；这与同时把 1.2 和 1.3 宣称为 LTS 冲突。 |
| 升级/回滚路径 | **较差** | **待发布后确认** | 1.2 到 1.3 会发生公开命令身份从 `reasonix`/`dsnix` 到 `reasonix-legacy` 的变化，需要迁移说明；1.3 尚无公开包可验证升级/回滚。 |

## 1.2 verdict — NO

### 为什么不能作为 LTS

1. **发布物对普通 npm 用户不可安装。** 在 `legacy-1.2` 源码快照上执行 `npm pack --json --silent --ignore-scripts`，tarball 只有 `LICENSE`、两个 README、tokenizer 数据和 `package.json`，没有 `dist/`。随后在干净目录安装该 tarball，npm 11.16.0 以退出码 1 失败：`EUNSUPPORTEDPROTOCOL Unsupported URL Type "workspace:": workspace:*`。
2. **发布身份不稳定。** `package.json` 为 `reasonix-legacy@1.2.0`，但公开 bin 仍是 `reasonix` 和 `dsnix`；同一 tag 的 `package-lock.json` 根版本仍为 `0.55.0`。长期支持分支不能在包名、版本权威和命令入口上存在这种漂移。
3. **它已被 1.3 的硬化修复实质取代。** 1.3 专门修复了生产 `workspace:*` 泄漏、移除 `dsnix` 发布残留、统一 package/bin/version、补齐 production audit、真实 pack 和隔离安装证据。
4. **现行支持政策明确不支持旧 minor。** `SECURITY.md` 写明“仅 npm 上最新发布 minor 被积极维护”。即使将 1.3 发布，1.2 也会立刻落入非维护版本；这不能称为 LTS。
5. **GitHub 正式 Release 只能证明版本被标记发布，不能覆盖其消费包缺陷。** 1.2 的 release note 有完整测试记录，这是良好的开发回归证据，但不是可安装发布物与长期维护证据。

### 1.2 可以怎样使用

- 可作为 **历史源码快照、回归基线或已有本地安装的短期冻结环境**。
- 不应推荐新用户安装，不应作为企业/用户侧默认版本，不应追加 `LTS`、`stable-LTS` 或类似标签。
- 如果存在必须留在 1.2 的存量用户，建议只承诺一个很短的迁移缓冲期，并仅接受阻断性安全问题；不要建立长期 1.2 补丁分支，除非愿意先回移植 1.3 的发布身份和打包修复并重新发布为 1.2.1。

## 1.3 verdict — CONDITIONAL LTS CANDIDATE

### 为什么它适合成为 LTS 主线

1. **候选质量证据完整。** `v1.3-MILESTONE-AUDIT.md` 绑定到 source SHA `cc8bbad1d99b` 和 tree SHA `ca7a220afcf3`，在 Windows / Node 24.15.0 / npm 11.16.0 的 clean worktree 上执行了 `npm ci`、完整 verify、文档 guard、production audit、dry-run pack、真实 pack 与隔离安装。
2. **消费包已被真实验证。** 1.3 tarball 约 8.8 MB、170 个条目；隔离安装后 `reasonix-legacy --version` 输出 `reasonix-legacy 1.3.0`，仅暴露 `reasonix-legacy` bin，不再暴露 `reasonix`/`dsnix`。
3. **安全与供应链状态适合稳定主线。** production audit 为 0 vulnerabilities，生产依赖不再包含 `workspace:*`，安装脚本 provenance 和安全支持边界已文档化。
4. **候选到当前开发快照没有产品漂移。** `git diff cc8bbad1..HEAD` 的 60 个文件全部位于 `.planning/`；`src/`、`tests/`、`package*.json`、`.github/`、`scripts/` 和用户文档的发布合同没有变化。因此可复用审计的 runtime tree，而不需要把当前快照误说成一个未经审计的新产品候选。

### 为什么现在仍不能叫 LTS

1. **用户拿不到它。** 截至 2026-07-22，fork 没有 1.3 GitHub Release/tag，npm registry 也没有 `reasonix-legacy` 包。
2. **本地 PASS 不等于远端发布完成。** branch protection、tag/push、正式 GitHub Actions/CodeQL 结果、GitHub Release 和 `npm publish` 均仍是 operator action。
3. **没有 LTS 生命周期合同。** 当前政策只说维护最新 minor，没有支持终止日期、补丁优先级、CVE 响应目标、是否允许 1.4 发布后继续维护 1.3.x等承诺。
4. **关键用户路径仍有人工验证缺口。** Telegram、Weixin 和交互式 TTY UAT 需要真实凭据、网络或终端；如果它们属于 LTS 支持面，发布前至少应做一次签字确认，或明确将其列为 best-effort/非阻塞功能。
5. **升级迁移需要对用户说明。** 1.2 的 `reasonix`/`dsnix` 命令入口在 1.3 收敛为 `reasonix-legacy`；LTS 发布说明必须给出卸载旧包、安装新包、验证版本和回滚步骤。

## Recommended LTS operating model

### 推荐支持对象

- **唯一 LTS 主线：1.3.x**，不要同时维护 1.2 LTS。
- 首个 LTS 发布应来自已审计 tree `ca7a220afcf3` 对应的产品内容；如果重做 candidate，必须重新跑同等级 clean pack/install/audit 链。
- 1.2 保留为历史 release，不接受常规功能或兼容性修复；如有存量用户，设置一次性迁移窗口。

### 建议的最小承诺

为了让“LTS”对用户有可验证含义，建议在发布前写入治理/安全文档：

- **支持期限：** 至少 6 个月，或“1.4 stable 发布后 90 天”，取更晚者；若维护资源有限，不建议承诺 12–24 个月。
- **允许的 1.3.x 变更：** 安全修复、数据/凭据泄漏修复、安装/启动阻断修复、关键回归修复、必要依赖升级和文档澄清；不在 LTS patch 中引入新的 provider 抽象或破坏性 CLI 改名。
- **响应目标：** critical security 1–3 天确认、7 天内给出修复/缓解；high 7 天内确认并进入最近 patch。资源不足时应声明 best-effort，不能虚构 SLA。
- **平台基线：** 当前强证据仅覆盖 Windows + Node 24.15.0 + npm 11.16.0。Node `>=22` 仍可作为兼容声明，但应区分“支持范围”和“发布门禁基线”。
- **终止政策：** 提前至少 30 天公告 EOL，并给出下一 LTS 升级路径。

## 1.3 LTS promotion checklist

以下全部完成后，才能把 1.3 对用户标记为 LTS：

1. 从审计过的产品 tree 创建 plain `v1.3.0` tag，确保该 tag 属于 fork 当前发布，不与上游 lineage 混淆。
2. 在 `v1`/tag 上确认维护的 Windows CI 与 CodeQL 通过，并保留 head SHA 对应关系。
3. 通过已硬化的 manual-dispatch workflow 发布 `reasonix-legacy@1.3.0` 到 npm；先用非 `latest` dist-tag 做 smoke，再提升为 `latest`/`lts`（若团队决定维护该 tag）。
4. 创建 GitHub Release，附 checksum、Node/npm 基线、安装/升级/回滚命令和已知限制。
5. 在真实外部目录运行 npm 安装 smoke：`--version`、`--help`、基本 chat/doctor；确认不暴露 `reasonix`/`dsnix` bin。
6. 对交互式 TTY、Telegram、Weixin 做一次人工 UAT，或者在 release notes 中明确哪些通道不是 LTS 保证面。
7. 更新 `SECURITY.md`：把“只维护最新 minor”改成明确的“1.3.x LTS 支持至某日/某事件”，并定义 1.4 出现后的并行维护规则。
8. 增加 `docs/lts-policy.md` 或等价治理章节，记录 patch 范围、响应目标、EOL 通知与升级策略。
9. 发布后从全新环境复核 registry tarball，而不是只验证本地 tarball；记录实际 npm integrity 与 install smoke。

## Evidence collected on 2026-07-22

| Evidence | Result |
|---|---|
| Current branch / HEAD | `backup/dev-snapshot-20260720` / `5eaf891140d3c2a5f4f9e9271f83aeab566f47e4` |
| Current toolchain | Node `v24.15.0`; npm `11.16.0` |
| Fork default branch | `v1` |
| Fork public releases | latest fork release is `legacy-1.2`, published 2026-07-15; no 1.3 release |
| Fork registry availability | `https://registry.npmjs.org/reasonix-legacy` returned HTTP 404 |
| 1.2 manifest | `reasonix-legacy@1.2.0`; bins `reasonix` + `dsnix`; production `ink: workspace:*` |
| 1.2 lock root | stale `reasonix-legacy@0.55.0`; production `workspace:*` present |
| 1.2 pack | exit 0, but only 5 entries and no `dist/` |
| 1.2 isolated install | exit 1, `EUNSUPPORTEDPROTOCOL` for `workspace:*` |
| 1.3 audit | PASS, 21/21 requirements, 4/4 phases, 6/6 integration, 6/6 local release flow |
| 1.3 verify | 281 test files; 3,800 passed; 15 skipped; 0 failed |
| 1.3 production audit | 0 vulnerabilities |
| 1.3 isolated install | success; only `reasonix-legacy` bin; version/help correct |
| Audited candidate → current HEAD | 60 changed files, all under `.planning/`; no runtime/release code delta |

## Final recommendation to the maintainer

- **现在对用户的措辞：** “1.2 historical stable / 已发布历史版”；“1.3 LTS candidate / release preview”。不要称任一为 LTS。
- **发布选择：** 直接完成 1.3 的正式发布和 LTS 治理，不要投入成本把 1.2 重新包装成长期分支。
- **LTS 转正点：** registry 发布物通过外部安装复核、远端门禁通过、支持截止时间和 patch policy 写入文档之后，才宣布 **reasonix-legacy 1.3.x LTS**。

## Task completion

- Task 1 complete: 固定了 fork 1.2 release 与 1.3 audited candidate 的不同对象、SHA、发布日期和可获取性。
- Task 2 complete: 建立 LTS 门槛矩阵，给出 1.2 `NO`、1.3 `CONDITIONAL` 结论及 1.3.x LTS 转正路线。
- Product code, tags, releases, npm registry and remote settings were not modified.
