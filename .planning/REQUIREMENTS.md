# Requirements: reasonix-legacy v1.3.1 LTS Release

**Defined:** 2026-07-22
**Core Value:** 用户能够从公开、不可变、经过验证的发布物安装一个低成本、不中断的 DeepSeek 编程 agent，并获得明确的 1.3.x 长期支持承诺。

## v1.3.1 Requirements

### Release Identity

- [ ] **REL-01**: 用户看到的 npm package、唯一 CLI bin、`--version`、package lock、维护文档和发布工作流都一致标识为 `reasonix-legacy@1.3.1`。
- [ ] **REL-02**: 维护者可通过自动检查阻止 `reasonix`/`dsnix` bin、错误 semver、错误 tag convention 或上游 release identity 重新进入当前发布表面。
- [ ] **REL-03**: 维护者可以把正式发布绑定到一个不可变 source SHA、tree SHA、plain `v1.3.1` tag 和对应 checksum，而不把历史上游同名标签当作 fork 发布。

### LTS Policy

- [ ] **LTS-01**: 用户可以在维护文档中看到 1.3.x 的支持期限为“至少 6 个月或下一稳定版本发布后 90 天，取较晚者”，并看到明确的起止/触发规则。
- [ ] **LTS-02**: 用户可以看到 LTS patch 允许的变更范围，包括安全修复、凭据或数据泄漏修复、安装/启动阻断修复、关键回归、必要依赖升级和文档澄清。
- [ ] **LTS-03**: 安全报告者可以看到 critical/high 问题的确认与修复/缓解目标，以及维护资源不足时不虚构 SLA 的 best-effort 边界。
- [ ] **LTS-04**: 用户可以看到 1.4 或下一稳定版发布后的 1.3.x 并行维护规则、至少 30 天 EOL 通知和下一 LTS 升级路径。
- [ ] **LTS-05**: 维护政策明确 1.2 只作为历史版本保留，不作为 LTS，也不接受常规功能或兼容性 patch。

### Migration and Recovery

- [ ] **MIG-01**: 1.2 用户可以按照文档从旧 `reasonix`/`dsnix` 命令迁移到唯一的 `reasonix-legacy` 命令，并验证安装的版本和入口。
- [ ] **MIG-02**: 用户可以在升级前备份配置/会话，在升级后执行基础 smoke，并在失败时按文档回滚到已知本地环境而不误称 1.2 为受支持 LTS。
- [ ] **MIG-03**: 用户可以清楚区分 fork 的 `v1.3.1` / `reasonix-legacy` 发布与仓库中的上游历史 `v1.2.x`、`v1.3.x`、`1.17.x` lineage 标签。

### Candidate Verification

- [ ] **VER-01**: 维护者可以在 Windows + Node.js 24.15.0 + npm 11.16.0 + PowerShell 的 clean checkout 上复现 `npm ci`、完整 verify、文档 guard 和 production audit，并记录每个命令的退出码。
- [ ] **VER-02**: 维护者可以从同一不可变候选生成真实 npm tarball，记录 inventory、npm integrity、SHA-256/SHA-512，并证明包中包含 CLI runtime、tree-sitter grammars 和必需文档。
- [ ] **VER-03**: 用户可以在仓库外的干净目录安装候选 tarball，并运行 `reasonix-legacy --version`、`--help` 和基础 `doctor`/启动 smoke；安装结果不得暴露 `reasonix` 或 `dsnix` bin，也不得包含生产 `workspace:*`。
- [ ] **VER-04**: 维护者可以证明 audited candidate 到正式发布 commit 之间不存在未重新验证的产品、依赖、workflow 或发布文档漂移。

### Release Operations

- [ ] **OPS-01**: 维护者拥有按顺序执行并留证的发布 runbook：候选冻结、tag 前检查、plain `v1.3.1` tag、Windows CI/CodeQL、npm publish、registry smoke、GitHub Release 和发布后核验。
- [ ] **OPS-02**: npm publish workflow 只有在 package 名称/版本、plain tag、Windows toolchain、docs/lint/typecheck/build/tests/production audit/pack smoke 全部通过后才允许发布 `reasonix-legacy@1.3.1`。
- [ ] **OPS-03**: 发布后维护者可以从 npm registry 本身安装 `reasonix-legacy@1.3.1`，核对 registry integrity、唯一 bin、版本/帮助输出和基础 smoke，而不是只复用本地 tarball。
- [ ] **OPS-04**: GitHub Release 包含 source/tag SHA、checksums、支持期限、安装/升级/回滚步骤、已知限制和人工验证状态，并且不声称未执行的 branch protection 或 live UAT 已完成。
- [ ] **OPS-05**: 交互式 TTY、Telegram 和 Weixin 的人工 UAT 有可执行清单与结果记录；无法使用真实凭据/网络执行的项目必须明确标为未验证或 best-effort，而不是自动通过。
- [ ] **OPS-06**: 所有 tag、push、npm publish、GitHub Release 和远端设置变更在执行前要求显式 operator 授权，规划/测试命令本身不得产生未经授权的远端副作用。

## Future Requirements

### Maintenance Automation

- **AUTO-01**: 维护者可以自动生成 LTS patch release notes 与 checksum manifest，但最终远端发布仍需人工授权。
- **AUTO-02**: 维护者可以在多个受支持 Node/OS 组合上执行非阻塞兼容矩阵，并逐步提升为正式支持基线。

### Deferred Product Work

- **CHAN-01**: QQ/Telegram/Weixin channel 可以转发 reasoning/tool events，补齐 HeadlessHost streaming 可见性。
- **REF-01**: `App.tsx` 在 characterization tests 保护下拆分。
- **REF-02**: `config.ts` 在 characterization tests 保护下拆分。
- **REF-03**: `loop.ts` 在 characterization tests 保护下拆分。
- **REF-04**: 大型 tools 模块在 characterization tests 保护下拆分。

## Out of Scope

| Feature | Reason |
|---------|--------|
| 将 1.2 重新发布或维护为 LTS | 1.2 的消费包、身份和支持合同不满足 LTS；本里程碑唯一主线是 1.3.x。 |
| 多模型/provider 抽象 | 与 LTS 发布无关，并会稀释 DeepSeek-first 核心价值。 |
| 恢复 `reasonix` 或 `dsnix` 兼容 bin | v1.3 已明确统一为唯一 `reasonix-legacy` 身份；迁移通过文档完成。 |
| Web 面板或 Tauri desktop | 已在 v1.0 物理移除，不属于 LTS 转正。 |
| HeadlessHost channel streaming 功能开发 | 是已知产品改进，但不应扩大 1.3.1 发布里程碑；仅验证当前通道边界。 |
| Protected core decomposition | 风险较高且与 release promotion 无直接依赖，留给独立后续里程碑。 |
| 自动修改 GitHub branch protection 或未经授权自动 push/publish | 属于外部 operator action；仓库只能检查、指导和记录。 |
| 伪造真实 bot/model/TTY 测试通过 | 无凭据、网络或真实终端时必须保持 honest gap。 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REL-01 | TBD | Pending |
| REL-02 | TBD | Pending |
| REL-03 | TBD | Pending |
| LTS-01 | TBD | Pending |
| LTS-02 | TBD | Pending |
| LTS-03 | TBD | Pending |
| LTS-04 | TBD | Pending |
| LTS-05 | TBD | Pending |
| MIG-01 | TBD | Pending |
| MIG-02 | TBD | Pending |
| MIG-03 | TBD | Pending |
| VER-01 | TBD | Pending |
| VER-02 | TBD | Pending |
| VER-03 | TBD | Pending |
| VER-04 | TBD | Pending |
| OPS-01 | TBD | Pending |
| OPS-02 | TBD | Pending |
| OPS-03 | TBD | Pending |
| OPS-04 | TBD | Pending |
| OPS-05 | TBD | Pending |
| OPS-06 | TBD | Pending |

**Coverage:**
- v1.3.1 requirements: 21 total
- Mapped to phases: 0
- Unmapped: 21 ⚠️

---
*Requirements defined: 2026-07-22*
*Last updated: 2026-07-22 after milestone scope confirmation*
