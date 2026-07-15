# reasonix-legacy

> DeepSeek 原生的命令行编程 agent——缓存优先把 token 成本压到最低,工具调用 JSON 自修复保证 loop 不被坏输出打断。

<p align="center">
  <a href="https://github.com/ZYist/reasonix-legacy/releases"><img src="https://img.shields.io/github/v/release/ZYist/reasonix-legacy?style=flat-square&color=cb3837&labelColor=161b22&logo=github&logoColor=white" alt="release"/></a>
  <a href="https://github.com/ZYist/reasonix-legacy/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/ZYist/reasonix-legacy/ci.yml?style=flat-square&label=ci&labelColor=161b22&logo=githubactions&logoColor=white" alt="CI"/></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/ZYist/reasonix-legacy?style=flat-square&color=8b949e&labelColor=161b22" alt="license"/></a>
  <a href="./package.json"><img src="https://img.shields.io/badge/node-%E2%89%A5%2022-5fa04e?style=flat-square&labelColor=161b22&logo=nodedotjs&logoColor=white" alt="node"/></a>
</p>

**reasonix-legacy** 是 [`esengine/DeepSeek-Reasonix`](https://github.com/esengine/DeepSeek-Reasonix) 的 fork,走**纯 CLI** 方向:在终端里跑一个低成本、不中断的 DeepSeek 编程 agent。Web 面板和桌面 GUI 已移除,聚焦命令行体验,保留 QQ / Telegram / 微信机器人作为远程通道。核心 loop / 工具 / 记忆 / MCP / AcP 与上游零回归。

## 为什么用它

- **缓存优先** —— DeepSeek-only,每一层都围绕字节稳定的 prefix-cache 设计。冻结 system + tools + few-shots 前缀 + locale 无关工具排序,避免 cache 抖动,长会话 token 成本最低。
- **工具调用自修复** —— 模型输出坏 JSON 也能修复(扁平化 schema、拾遗 dangling tool_calls、检测 storm、恢复截断参数),loop 不被坏输出打断。
- **纯 CLI** —— 不再维护面板 / 桌面 GUI,所有交互在终端内完成。

## 安装

需要 Node ≥ 22。支持 macOS · Linux · Windows(PowerShell · Git Bash · Windows Terminal)。

reasonix-legacy 目前只通过 GitHub 发布(暂未上 npm),从源码安装:

```bash
git clone https://github.com/ZYist/reasonix-legacy.git
cd reasonix-legacy
npm install
npm run build
npm link        # 让 `reasonix` 命令全局可用
```

升级:`git pull && npm install && npm run build`。

获取 [DeepSeek API key →](https://platform.deepseek.com/api_keys)。首次运行 `reasonix code` 会引导配置。

> CLI 命令名是 **`reasonix`**(也保留 `dsnix` 短别名);npm 包名是 `reasonix-legacy`。裸 `reasonix` 等价于 `reasonix code`(在当前目录启动编程 agent)。

## 快速开始

| 命令 | 用途 |
|------|------|
| `reasonix` / `reasonix code [dir]` | 编程 agent(**从这里开始**) |
| `reasonix chat` | 纯聊天,无文件 / shell 工具 |
| `reasonix run "任务"` | 一次性执行,流式输出到 stdout(适合管道) |
| `reasonix doctor` | 健康检查:Node、API key、MCP |
| `reasonix qq` / `telegram` / `weixin` | 挂载远程机器人通道 |

其余子命令(`replay` · `diff` · `events` · `stats` · `index` · `mcp` · `prune-sessions` · `update` 等)见 `reasonix --help`。

## 核心特性

- **缓存优先 agentic loop** —— `CacheFirstLoop` 冻结前缀 + locale 无关工具排序,最大化 DeepSeek prefix-cache 命中。
- **工具调用 JSON 自修复** —— `ToolCallRepair` 在请求 400 之前修复 malformed / truncated tool-call JSON。
- **token 预算纵深防御** —— `ContextManager` 分层阈值折叠历史(正常 / 激进 / 强制摘要),在上下文预算内不中断。
- **多端单核** —— CLI/TUI 和机器人通道都驱动同一个 `CacheFirstLoop`,核心 loop / 工具 / 记忆 / MCP / AcP 零重实现。
- **Windows Terminal 标签页标题** —— tab 显示 `reasonix-legacy` 而非 cmd 路径(OSC 0,每 2 秒重发以对抗 ConPTY 把子进程标题同步到 tab)。

## 配置

- DeepSeek API key:`process.env.DEEPSEEK_API_KEY`,或 `reasonix setup` 写入 `~/.reasonix/config.json`。
- `.env` 自动加载(不覆盖已设的环境变量)。
- Base URL 覆盖:`DEEPSEEK_BASE_URL` 或 config `baseUrl`(默认 `https://api.deepseek.com`,支持 Azure 兼容端点)。

## 版本与发布

当前 **`legacy-1.2.0`**(2026-07-15)。发布历史见 [releases](https://github.com/ZYist/reasonix-legacy/releases)。

版本号约定:npm version 为 semver(`1.2.0`),展示层加 `legacy-` 前缀(`legacy-1.2.0`,见 `--version` / TUI 右下角 / `/about`)。

## 上游与归属

本项目 fork 自 [`esengine/DeepSeek-Reasonix`](https://github.com/esengine/DeepSeek-Reasonix),感谢上游的开源工作。上游的完整 README 存档于:

- [README.upstream.md](./README.upstream.md)(英文)
- [README.upstream.zh-CN.md](./README.upstream.zh-CN.md)(中文)

## 反馈

- [Issues](https://github.com/ZYist/reasonix-legacy/issues)
- [Discussions](https://github.com/ZYist/reasonix-legacy/discussions)

## License

MIT
