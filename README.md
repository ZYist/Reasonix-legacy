<h1 align="center">reasonix-legacy</h1>

<h3 align="center">DeepSeek 原生的终端 AI 编程 agent。</h3>
<p align="center">缓存优先，工具调用可修复，适合一直开着的纯 CLI 工作流。</p>

<p align="center">
  <a href="./docs/getting-started.md">快速开始</a>
  &nbsp;·&nbsp;
  <a href="./docs/cli-reference.md">CLI 参考</a>
  &nbsp;·&nbsp;
  <a href="./docs/configuration.md">配置</a>
  &nbsp;·&nbsp;
  <a href="./docs/architecture.md">架构</a>
  &nbsp;·&nbsp;
  <a href="./docs/README.md">全部文档</a>
  &nbsp;·&nbsp;
  <a href="./CONTRIBUTING.md">参与贡献</a>
</p>

<p align="center">
  <a href="https://github.com/ZYist/reasonix-legacy/releases"><img src="https://img.shields.io/github/v/release/ZYist/reasonix-legacy?style=flat-square&color=cb3837&labelColor=161b22&logo=github&logoColor=white" alt="release"/></a>
  <a href="https://github.com/ZYist/reasonix-legacy/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/ZYist/reasonix-legacy/ci.yml?style=flat-square&label=ci&labelColor=161b22&logo=githubactions&logoColor=white" alt="CI"/></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/ZYist/reasonix-legacy?style=flat-square&color=8b949e&labelColor=161b22" alt="license"/></a>
  <a href="./package.json"><img src="https://img.shields.io/badge/node-%E2%89%A5%2022-5fa04e?style=flat-square&labelColor=161b22&logo=nodedotjs&logoColor=white" alt="node"/></a>
</p>

<br/>

**reasonix-legacy** 是 [`esengine/DeepSeek-Reasonix`](https://github.com/esengine/DeepSeek-Reasonix) 的纯 CLI / TUI TypeScript fork。它保留 Reasonix 的缓存优先 agent loop、工具、记忆、MCP 与 ACP 能力，移除 Web 面板和桌面 GUI，并继续维护 QQ、Telegram、微信三种远程通道。

> [!NOTE]
> **当前维护仓库是 `ZYist/reasonix-legacy`。** 安装、Issue、Discussion、发布与文档均以本仓库为准；上游链接只用于来源署名和历史追溯。

> [!TIP]
> **缓存稳定不是一个开关，而是整个 loop 要共同守住的不变量。** Reasonix 围绕 DeepSeek 字节稳定的前缀缓存设计 system、tools、few-shots 与工具排序，让长会话尽量复用已经付过成本的上下文。

## 安装

需要 Node.js **22 或更新版本**。支持 macOS、Linux 与 Windows（PowerShell、Git Bash、Windows Terminal）。

reasonix-legacy 当前从 GitHub 源码安装：

```bash
git clone https://github.com/ZYist/reasonix-legacy.git
cd reasonix-legacy
npm install
npm run build
npm link
```

`npm link` 会把唯一的 `reasonix-legacy` 命令加入 `PATH`。获取 [DeepSeek API Key →](https://platform.deepseek.com/api_keys)，然后运行：

```bash
reasonix-legacy setup
reasonix-legacy code
```

裸 `reasonix-legacy` 等价于在当前目录运行 `reasonix-legacy code`。完整的安装、升级与首次配置流程见 [快速开始](./docs/getting-started.md)。

## 先用这些命令

| 命令 | 何时用 |
|---|---|
| `reasonix-legacy` / `reasonix-legacy code [dir]` | 编程 agent。**先用这个。** |
| `reasonix-legacy chat` | 纯聊天，不挂文件系统与 shell 工具。 |
| `reasonix-legacy run "任务"` | 一次性执行，结果流到 stdout；适合 shell 管道。 |
| `reasonix-legacy doctor` | 检查 Node、API Key、配置与 MCP 接线。 |
| `reasonix-legacy acp` | 通过 stdio 启动 ACP agent，供编辑器或 IDE 接入。 |
| `reasonix-legacy qq` | 启动 QQ headless 通道。 |
| `reasonix-legacy telegram` | 启动 Telegram headless 通道。 |
| `reasonix-legacy weixin` | 启动微信 headless 通道。 |

其余子命令（`replay`、`diff`、`events`、`stats`、`index`、`mcp`、`prune-sessions`、`update` 等）见 `reasonix-legacy --help` 与 [CLI 参考](./docs/cli-reference.md)。

## Reasonix 的不同之处

- **缓存优先的 agentic loop** —— `CacheFirstLoop` 固定高价值前缀并保持工具排序稳定，尽量提高 DeepSeek prefix-cache 命中率。
- **工具调用 JSON 自修复** —— `ToolCallRepair` 处理 malformed / truncated tool-call JSON、遗留 tool calls 与调用风暴，避免一次坏输出直接打断 loop。
- **token 预算纵深防御** —— `ContextManager` 按阈值折叠历史，在长会话接近上下文上限时逐步收缩，而不是突然失效。
- **多端共用一个核心** —— CLI / TUI、ACP 与三个机器人通道都复用同一套 loop、工具、记忆和权限边界。
- **纯 CLI 维护面** —— 不再背负 Web 与桌面 GUI 的双份状态；终端就是主界面，远程通道只负责把同一个 agent core 接出去。
- **Windows 终端细节** —— 主动维护 Windows Terminal 标签页标题，避免 ConPTY 把子进程路径反复同步到 tab。

## 能力一览

| 表面 | 用途 | 文档 |
|---|---|---|
| Code TUI | 在仓库中搜索、编辑、运行命令与持续对话 | [快速开始](./docs/getting-started.md) · [CLI 参考](./docs/cli-reference.md) |
| 配置系统 | API、权限、代理、搜索、索引、MCP 与通道配置 | [配置参考](./docs/configuration.md) |
| ACP | 通过 stdio 对接支持 Agent Client Protocol 的客户端 | [CLI 参考：ACP](./docs/cli-reference.md) |
| QQ | 将同一个 headless agent 挂到 QQ | [中文](./docs/qq-connect.zh-CN.md) · [English](./docs/qq-connect.md) |
| Telegram | 将同一个 headless agent 挂到 Telegram | [中文](./docs/telegram-connect.zh-CN.md) · [English](./docs/telegram-connect.md) |
| 微信 | 将同一个 headless agent 挂到微信 | [中文](./docs/weixin-connect.zh-CN.md) · [English](./docs/weixin-connect.md) |
| 架构与维护 | 理解共享 loop、持久化边界与通道生命周期 | [架构](./docs/architecture.md) · [通道生命周期测试](./docs/channel-lifecycle-testing.md) |

## 文档

从 [**文档总入口**](./docs/README.md) 开始。当前维护文档按“用户指南、远程通道、维护与治理”组织：

- [**快速开始**](./docs/getting-started.md) —— 从源码安装、build / link、配置并运行第一个任务。
- [**CLI 参考**](./docs/cli-reference.md) —— 顶层命令、选项与 TUI slash commands。
- [**配置参考**](./docs/configuration.md) —— `~/.reasonix/config.json`、环境变量、权限、MCP、代理、索引与通道配置。
- [**架构文档**](./docs/architecture.md) —— 纯 CLI 表面、缓存优先 loop、HeadlessHost、ACP 与持久化边界。
- [**QQ 连接**](./docs/qq-connect.zh-CN.md) · [**Telegram 连接**](./docs/telegram-connect.zh-CN.md) · [**微信连接**](./docs/weixin-connect.zh-CN.md) —— 三种远程通道的中文接入指南。
- [**通道生命周期测试**](./docs/channel-lifecycle-testing.md) —— headless 通道的启动、停止与回归测试约定。
- [**治理决策**](./docs/governance.md) · [**CI 与分支保护**](./docs/ci-branch-protection.md) —— 维护者规则与合并闸门。
- [**贡献指南**](./CONTRIBUTING.md) · [**安全策略**](./SECURITY.md) · [**行为准则**](./CODE_OF_CONDUCT.md)。

> [!WARNING]
> 历史上游文档只作为只读快照保存在 [upstream archive](./docs/archive/upstream-reasonix/ARCHIVE.md)。其中的 GUI、网站、安装与发布说明可能已经失效，不应作为当前操作指南。

## 配置速览

- API Key：环境变量 `DEEPSEEK_API_KEY`，或运行 `reasonix-legacy setup` 写入 `~/.reasonix/config.json`。
- Base URL：`DEEPSEEK_BASE_URL` 或配置项 `baseUrl`；默认值为 `https://api.deepseek.com`。
- 项目环境：启动时自动加载 `.env`，但不会覆盖已经存在的环境变量。
- 机器人凭据：QQ、Telegram、微信 token 都应当视为 secret；对外开放前先配置 owner / allowlist 与权限策略。

配置优先级、完整字段和示例见 [配置参考](./docs/configuration.md)。

## 不做的事

> [!IMPORTANT]
> reasonix-legacy 是有立场的。下面这些边界是维护方向，不是待补齐的功能清单。

- **不恢复 Web 面板或桌面 GUI。** 这个 fork 只维护 CLI / TUI、ACP 与 headless 通道。
- **不把多供应商抽象放在缓存稳定之前。** DeepSeek-first 是设计约束，不是临时缺口。
- **不把机器人通道做成三套 agent。** 通道负责接入，核心行为仍由共享 loop 和权限系统决定。
- **不把历史上游文档当作当前说明。** 当前行为以源码、`reasonix-legacy --help` 与 `docs/` 下的维护文档为准。

## 版本、上游与归属

当前版本为 **`reasonix-legacy 1.3.1`**；对应 npm semver 为 `1.3.1`，当前里程碑为 `v1.3.1`。发布记录见 [Releases](https://github.com/ZYist/reasonix-legacy/releases)。

本项目 fork 自 [`esengine/DeepSeek-Reasonix`](https://github.com/esengine/DeepSeek-Reasonix)，感谢上游作者与贡献者的开源工作。原始 README 与网站文档已经归档，并在 [历史存档索引](./docs/archive/upstream-reasonix/ARCHIVE.md) 中标明来源与适用范围。

## 反馈与贡献

- 使用问题与 bug：[Issues](https://github.com/ZYist/reasonix-legacy/issues)
- 想法、经验与展示：[Discussions](https://github.com/ZYist/reasonix-legacy/discussions)
- 准备提交 PR：先读 [CONTRIBUTING.md](./CONTRIBUTING.md)，并在提交前运行 `npm run verify`。
- 安全问题：不要公开披露，按 [SECURITY.md](./SECURITY.md) 提交。

## License

MIT
