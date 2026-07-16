---
quick: 260716-qbx
status: complete
branch: dev
commits: []
---

# Quick Task 260716-qbx — API 供应商切换能力评估

## 结论

**建议新增，但不要把它实现成一个只会覆盖 `baseUrl` 的简单“切换 API 供应商”指令。**

更稳妥的产品形态是：对用户提供 `reasonix provider ...` 命令，对内部使用 `ApiProfile`（API 配置档案）抽象。一个 profile 同时保存协议、endpoint、凭据引用、默认模型和能力配置；用户切换的是一组经过验证的运行参数，而不是孤立的“供应商名称”。

推荐首期命令：

```text
reasonix provider list
reasonix provider current
reasonix provider add <name>
reasonix provider use <name>
reasonix provider test [name]
reasonix provider remove <name>
```

同时为一次性运行提供：

```text
reasonix code --provider <name>
reasonix chat --provider <name>
reasonix run "..." --provider <name>
```

**首期只承诺 OpenAI-compatible Chat Completions profile，不承诺任意供应商、任意协议都能直接工作。** Anthropic Messages、Gemini 原生接口、OpenAI Responses API、自动 fallback/路由应作为后续 adapter，而不是塞进首个版本。

## 当前事实：已经“能配”，但还不能“好用地切”

Reasonix 现在并非完全锁死 DeepSeek：

- `ReasonixConfig` 已有单组 `apiKey`、`baseUrl`、`model`（`src/config.ts:173-178`）。
- endpoint 解析已支持 `DEEPSEEK_BASE_URL` / `DEEPSEEK_API_BASE_URL`，以及配置文件中的自定义 `baseUrl`。
- `loadModel()` 在存在自定义 endpoint 时允许任意持久化模型 ID（`src/config.ts:1359-1366`），对应行为已有测试（`tests/config.test.ts:237`）。
- 向导通过 `${baseUrl}/models` 验证 key，因此对一部分 OpenAI-compatible 服务已经具备隐式接入路径。
- 客户端请求 `/models`、`/chat/completions`，使用 Bearer token 和 OpenAI 风格流式/tool call 数据结构。

因此，用户目前可以手工改成某个兼容 endpoint；真正缺少的是：

1. 多套配置的保存与切换；
2. 在所有命令中使用同一套 profile 解析逻辑；
3. 对协议和能力差异的明确诊断；
4. setup/doctor/TUI 中可发现、可验证、可恢复的交互；
5. 不破坏现有 DeepSeek 用户配置的迁移方案。

## 为什么值得做

### 易用性收益

当前单 tuple 配置会迫使用户反复覆盖 key/base URL/model，容易误用账户、忘记模型名，也难以在个人、公司网关、本地服务之间切换。命名 profile 可以把常用组合保存为：

```text
deepseek
work-gateway
local-llm
experiment
```

`provider list/current/test` 还能让配置状态从“藏在 JSON 和环境变量里”变成可发现的 CLI 能力。

### 稳定性收益

如果只是增加 `reasonix provider use openai` 并直接改三个全局字段，会产生新的不一致：

- `code`、`run`、`commit`、`acp`、聊天渠道可能各自构造客户端，未必同时读取新值；
- doctor 当前还探测 DeepSeek 特有的 `/user/balance`；
- client 会发送 DeepSeek 特有的 `extra_body.thinking`，目前只对 Azure 做了一次特殊排除；
- 错误、超时、代理和提示文本仍大量写死 DeepSeek；
- 会话中途改变 endpoint 可能让模型能力、工具调用格式、上下文窗口与统计口径突然变化。

profile + capability adapter 能把差异集中到一处，避免业务层到处写 `if (provider === ...)`。

## 推荐的用户体验

### 1. 新增与验证

```text
$ reasonix provider add work
Protocol: OpenAI-compatible Chat Completions
Base URL: https://gateway.example.com/v1
API key: ********
Default model: coding-model
Test connection now? Yes
✓ /models reachable
✓ chat completion smoke test passed
✓ tool calling supported
```

如果 `/models` 不可用，但 chat completion 可用，应允许 profile 保存，并把 model listing 标记为 unsupported，而不是误判整个供应商不可用。

### 2. 切换

```text
$ reasonix provider use work
✓ Active provider: work
  Endpoint: https://gateway.example.com/v1
  Model: coding-model
```

切换应使用“先验证、后原子写入”：目标 profile 不存在、字段不完整或协议不支持时，不改变当前 active profile。

### 3. 查看与诊断

```text
$ reasonix provider list
* deepseek      deepseek-chat       healthy
  work          coding-model        healthy
  local         qwen-local           untested
```

`reasonix doctor` 应显示当前 profile，并按 capability 执行检查；DeepSeek profile 才检查 balance，其他 profile 不应因为没有 `/user/balance` 而报错。

### 4. 单次覆盖

`--provider <name>` 只影响当前进程，不修改全局 active profile。它适合脚本、CI、临时测试，也能减少频繁全局切换带来的误操作。

### 5. TUI 内切换

首期不建议静默地在既有会话中原地更换供应商。若以后增加 `/provider use <name>`，应：

- 明确提示 endpoint/model 将变化；
- 默认开始新会话，或写入清晰的 provider boundary；
- 重新计算工具、thinking、上下文窗口和模型价格能力；
- 失败时保留原客户端和原会话状态。

## 推荐配置模型

用户面叫 provider，内部建议叫 profile，避免把“公司”“账号”“网关”“endpoint”混为同一概念：

```ts
interface ApiProfile {
  protocol: "openai-chat-completions";
  baseUrl: string;
  apiKey?: string;             // 后续最好迁移为 secret 引用
  model: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  capabilities?: {
    modelListing?: boolean;
    streaming?: boolean;
    tools?: boolean;
    reasoningContent?: "none" | "reasoning_content";
    thinkingControl?: "none" | "deepseek-extra-body" | "reasoning-effort";
    balance?: "none" | "deepseek";
  };
}

interface ReasonixConfig {
  activeProfile?: string;
  profiles?: Record<string, ApiProfile>;
  // legacy: apiKey/baseUrl/model 暂时保留，用于迁移和兼容
}
```

推荐配置示例：

```json
{
  "activeProfile": "deepseek",
  "profiles": {
    "deepseek": {
      "protocol": "openai-chat-completions",
      "baseUrl": "https://api.deepseek.com",
      "model": "deepseek-chat",
      "capabilities": {
        "thinkingControl": "deepseek-extra-body",
        "balance": "deepseek"
      }
    },
    "work": {
      "protocol": "openai-chat-completions",
      "baseUrl": "https://gateway.example.com/v1",
      "model": "coding-model"
    }
  }
}
```

## 配置优先级与兼容迁移

建议统一解析顺序：

1. 当前命令的 `--provider`；
2. 新环境变量 `REASONIX_PROVIDER`；
3. 配置文件 `activeProfile`；
4. 从现有 `apiKey/baseUrl/model` 构造的 legacy profile；
5. DeepSeek 默认 profile。

现有 `DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`DEEPSEEK_API_BASE_URL` 必须在至少一个兼容周期内继续工作。首次写入 profiles 时可执行幂等迁移：

- 已有自定义 `baseUrl`：迁移为 `legacy-custom`；
- 没有自定义 `baseUrl`：迁移为 `deepseek`；
- 保留旧字段读取，不在无确认情况下删除旧字段；
- 日志和 `provider current` 显示值的来源，便于排查环境变量覆盖配置的问题。

API key 不应在 `list/current/doctor --json` 中明文输出；自定义 headers 也必须进入统一脱敏规则。

## 推荐运行时架构

### 统一客户端边界

新增业务层依赖的窄接口，例如：

```ts
interface ChatModelClient {
  complete(...): Promise<...>;
  stream(...): AsyncIterable<...>;
  listModels?(): Promise<...>;
  checkHealth?(): Promise<...>;
  readonly capabilities: ModelProviderCapabilities;
}
```

当前 `DeepSeekClient` 可先内部泛化为 OpenAI-compatible adapter，并保留原导出作为兼容 alias。`code/chat/run/commit/acp`、HeadlessHost 和渠道命令都只能通过同一个 `resolveProfile()` + `createChatModelClient()` 工厂获得客户端，不能各自拼 endpoint。

### 以能力分支，不以供应商名分支

至少要描述：

- 是否支持 streaming；
- 是否支持 tools/tool_calls；
- reasoning 内容字段；
- thinking 参数形式；
- 是否支持 `/models`；
- 是否支持 balance；
- context window / pricing 是否已知。

供应商或网关名称只用于显示和默认模板，payload、doctor 和 UI 行为由 capability 决定。

### 错误处理

错误应从“DeepSeek request failed”改为包含 profile/endpoint/model 的通用诊断，同时避免打印 key：

```text
Provider "work" request failed (HTTP 400)
Endpoint: gateway.example.com/v1
Model: coding-model
Hint: this endpoint rejected tool_calls; run `reasonix provider test work`.
```

## MVP 范围

### 必须包含

- `provider list/current/add/use/test/remove`；
- OpenAI-compatible Chat Completions adapter；
- active profile + `--provider` 单次覆盖；
- legacy 配置和 `DEEPSEEK_*` 环境变量兼容；
- setup 可创建/选择 profile；
- doctor 按 capability 检查；
- 所有模型调用入口统一使用 client factory；
- key/header 脱敏与配置原子写入；
- 无 `/models` endpoint 时的合理降级；
- 文档说明“兼容协议不等于全部能力兼容”。

### 首期非目标

- 原生 Anthropic/Gemini/Responses API；
- 自动选择最便宜或最快模型；
- 请求失败后跨供应商自动 fallback；
- 一个会话内无提示热切换；
- 自动同步所有供应商模型和价格目录；
- 声称支持所有 OpenAI-compatible 服务。

## 测试与稳定性门禁

实施前应把以下矩阵写进正式 phase plan：

1. 配置解析：CLI override / env / active profile / legacy / default 的优先级；
2. 迁移：旧 DeepSeek、旧 custom endpoint、缺 key、重复迁移；
3. 原子性：切换失败不改变 active profile，写配置中断不损坏文件；
4. adapter：stream、tool_calls、reasoning、thinking 参数与 capability gating；
5. doctor：有/无 `/models`、仅 DeepSeek balance、401/403/404/429/timeout；
6. CLI：所有模型调用命令使用同一 profile；
7. TUI/渠道：启动时 profile 固定，错误显示一致，secret 不泄露；
8. 回归：不配置新字段时，现有 DeepSeek 行为完全保持。

建议至少提供一个本地 mock OpenAI-compatible server 做合同测试，避免测试依赖真实供应商凭据和网络。

## 实施顺序建议

### Phase A — 配置与工厂

- 定义 `ApiProfile`、capabilities 和解析优先级；
- 建立迁移与脱敏；
- 引入 `ChatModelClient` / client factory；
- 保持现有行为不变。

### Phase B — CLI 与诊断

- 增加 `provider` 命令组和 `--provider`；
- 更新 setup/doctor；
- 统一 code/chat/run/commit/acp/渠道入口。

### Phase C — TUI 与文档

- 显示当前 profile；
- 设计安全的新会话切换体验；
- 更新配置、故障排查和兼容性文档。

这应作为一个正式 phase 或短 milestone 实施，不建议直接在 quick task 中跨 `config.ts`、`client.ts`、doctor、wizard、TUI 和渠道做未经完整保护的补丁。

## 待用户确认的产品决策

本报告给出的推荐默认是：

- 命令名使用 `provider`，内部结构使用 `ApiProfile`；
- 首期只做 OpenAI-compatible Chat Completions；
- `provider use` 影响未来进程，`--provider` 影响单次进程；
- TUI 中途切换默认开启新会话；
- 原生协议和 fallback 延后。

如果接受这组边界，下一步应新增一个专门的 roadmap phase，再做详细代码级 planning；如果当前需求只是偶尔连接单个自建兼容 endpoint，则现有 `baseUrl/apiKey/model` 已经够用，可以暂不增加命令。

## Verification

- 检查配置、client、setup/wizard、doctor、TUI、CLI 命令注册和 config tests — PASS
- 产品源码修改 — none
- 结论未依赖未经验证的第三方兼容性声明 — PASS
- quick artifact 与 STATE 更新 — PASS
