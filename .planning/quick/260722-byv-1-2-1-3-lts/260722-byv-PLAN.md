---
quick: 260722-byv
phase: quick-260722-byv
plan: "01"
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: []
files_modified:
  - .planning/quick/260722-byv-1-2-1-3-lts/260722-byv-SUMMARY.md

must_haves:
  truths:
    - "1.2 与 1.3 的判断分别绑定到明确的发布/候选对象、日期和可复核证据。"
    - "LTS 不只按测试通过判断，还覆盖可获取性、版本支持政策、补丁承诺、发布身份、安全与升级路径。"
    - "结论区分当前可日常使用、可发布为 stable、以及可向用户承诺 LTS 三个层级。"
    - "最终给出每个版本的明确 verdict、阻塞项和最小转正动作。"
  artifacts:
    - path: .planning/quick/260722-byv-1-2-1-3-lts/260722-byv-SUMMARY.md
      provides: "1.2 正式版与 1.3 预览版的用户侧 LTS 适用性评估"
  key_links:
    - from: legacy-1.2 GitHub release and tag
      to: package.json/package-lock.json at legacy-1.2
      via: "发布身份、安装可行性与生产依赖合同"
    - from: .planning/v1.3-MILESTONE-AUDIT.md
      to: current package/release workflows
      via: "候选包可复现验证与本地 release-ready 证据"
    - from: SECURITY.md and docs/governance.md
      to: LTS verdict
      via: "实际支持版本政策与发布治理是否允许长期支持承诺"
---

<objective>
评估当前 1.2 正式版与 1.3 预览版是否适合作为用户侧 LTS 使用，并产出证据化结论与落地建议。

Purpose: 避免把“已有正式 release”或“本地验证通过”误判为“具备长期支持承诺”。
Output: `.planning/quick/260722-byv-1-2-1-3-lts/260722-byv-SUMMARY.md`。

本任务只评估，不修改产品代码、版本号、tag、release、npm registry 或远端设置。
</objective>

<context>
@.planning/STATE.md
@.planning/PROJECT.md
@.planning/MILESTONES.md
@.planning/v1.3-MILESTONE-AUDIT.md
@.planning/quick/260717-bvq-assess-stable-release/260717-bvq-SUMMARY.md
@package.json
@package-lock.json
@README.md
@SECURITY.md
@docs/governance.md
@.github/workflows/ci.yml
@.github/workflows/codeql.yml
@.github/workflows/publish-npm.yml
@legacy-1.2
</context>

<tasks>

<task type="auto">
  <name>Task 1: 固定 1.2 与 1.3 的实际版本对象和可获取性</name>
  <files>.planning/quick/260722-byv-1-2-1-3-lts/260722-byv-SUMMARY.md</files>
  <action>
记录 2026-07-22 的远端和本地事实：1.2 对应 GitHub `legacy-1.2` release/tag 及其 package manifest；1.3 对应已通过本地 clean-candidate audit 的 `reasonix-legacy@1.3.0` 候选，而不是当前 GitHub/npx 已发布版本。核对 GitHub release、origin tags/heads、npm registry、当前 branch/commit、候选 SHA 与 HEAD 的 runtime tree 差异。明确“正式版/预览版”是发布状态，不自行扩展为 LTS 承诺。
  </action>
  <verify>报告含每个版本的 source object、发布日期/审计日、获取渠道、发布状态与证据 SHA。</verify>
  <done>不存在把上游同名 v1.2/v1.3 tag、fork legacy release、当前候选包混为一谈的歧义。</done>
</task>

<task type="auto">
  <name>Task 2: 按用户侧 LTS 门槛评估并形成建议</name>
  <files>.planning/quick/260722-byv-1-2-1-3-lts/260722-byv-SUMMARY.md</files>
  <action>
建立 LTS 门槛矩阵：可安装性与可重现性、稳定/安全证据、发布身份、支持窗口、补丁/回移植政策、升级/回滚路径、远端门禁和人工 UAT。对 1.2 和 1.3 分别给出 `YES / CONDITIONAL / NO`，并同时注明“当前可供什么用户使用”。把仓库 `SECURITY.md` 的“仅维护 npm 上最新 minor”政策、npm 包不存在、1.2 的 `workspace:*` 生产依赖与 lock/package 漂移、1.3 尚未 tag/publish/live UAT 的事实纳入阻塞项。提出最小 LTS 落地方案和推荐主线。
  </action>
  <verify>结论包含版本对比表、阻塞项、风险分级、建议支持对象、支持期限/补丁策略建议与转正清单。</verify>
  <done>用户能据此决定是否把 1.2/1.3 暴露给终端用户，以及何时可以使用 LTS 标签。</done>
</task>

</tasks>

<success_criteria>
- 结论基于 2026-07-22 的版本与远端事实。
- 明确区分 1.2 正式发布、1.3 本地 release-ready 候选和真正 LTS。
- 每个版本有单独 verdict 与用户使用建议。
- 给出可执行的 LTS 转正路线，而不是只列问题。
</success_criteria>
