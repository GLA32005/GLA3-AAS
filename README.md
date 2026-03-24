# AgentSec · AI Agent 安全治理平台

> **零配置、开箱即用的 AI Agent 运行时安全防护框架**
> 一行代码接入，毫秒级拦截 Prompt 注入、RAG 投毒与数据隐私外泄。

[![Python](https://img.shields.io/badge/Python-3.8%2B-blue)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![SDK Version](https://img.shields.io/badge/SDK-v1.5-purple)](https://github.com/agentsec/agentsec)

---

## 为什么需要 AgentSec？

随着 LLM Agent 在企业内部大规模落地，一类全新的安全威胁正在快速涌现：

- **Prompt 注入攻击**：攻击者通过构造特殊指令，劫持 Agent 的决策逻辑，使其执行越权操作。
- **RAG 知识库投毒**：在检索增强生成（RAG）场景下，恶意文档被写入知识库，导致 Agent 在检索时无意间执行隐藏指令。
- **工具链权限滥用**：Agent 被授予了远超实际业务需求的工具权限（如 `delete_file`、`send_email`），一旦被攻击即产生不可逆后果。
- **PII 数据泄漏**：用户上传含手机号、身份证号的文件，明文进入 LLM 上下文，违反数据合规要求。
- **多 Agent 信任链攻击**：A2A（Agent to Agent）调用链中，被劫持的上游 Agent 会将恶意载荷传播至下游，造成横向扩散。

**AgentSec 的核心价值是：把这些运行时安全风险在进入 LLM 之前就切断。**

---

## 核心特性

| 特性 | 说明 |
|------|------|
| **零配置接入** | 仅需在现有代码中追加一个 `callbacks` 参数 |
| **本地进程内执行** | SDK 与业务进程同进程运行，P99 拦截延迟 < 20ms，无网络开销 |
| **断网可用** | 规则引擎基于本地缓存，完全支持 Air-Gapped 离线环境 |
| **多维检测** | 直接注入 / RAG 间接注入 / PII 脱敏 / 流式输出拦截 / 多轮上下文慢速注入 |
| **双模式运行** | `warn`（日志告警放行）/ `block`（拦截替换为安全文本） |
| **可观测性** | 内置 Web 控制台，实时查看告警、Agent 资产、规则命中、审计日志 |
| **LangChain 原生** | 基于 `BaseCallbackHandler` 实现，与 LangChain 生态无缝集成 |
| **工业极简设计** | 深度集成 Impeccable Style，提供极具工业美感、高对比度的专业 SOC 界面 |
| **独立接入门户** | 专为 Host B 提供 `/onboard` 独立向导页，支持 100% 实时进度同步 |

---

## 架构概览

```
用户 Prompt
    │
    ▼
┌─────────────────────────────────┐
│         Agent 业务进程           │
│  ┌───────────────────────────┐  │
│  │   AgentSec SDK (In-Process)│  │  ← 函数级调用，无网络延迟
│  │                           │  │
│  │  ① on_llm_start          │  │  直接注入检测
│  │  ② on_retriever_end      │  │  RAG 间接注入检测
│  │  ③ on_tool_start         │  │  高危工具拦截
│  │  ④ on_llm_new_token      │  │  流式输出实时检测
│  │  ⑤ on_llm_end            │  │  全量审计复核
│  └───────────────────────────┘  │
│              │                   │
│    本地规则引擎 + ONNX 语义模型    │
└─────────────────────────────────┘
              │ 异步上报（不阻塞主流程）
              ▼
    AgentSec Web 控制台（告警 / 审计 / 资产管理）
```

---

## 快速开始

### 方式一：Docker 一键启动（推荐）

最快速的体验方式，含控制台、后端 API、自动攻击演示 Agent：

```bash
# 拉起完整攻防演练环境
docker-compose up --build -d

# 访问 Web 控制台
open http://localhost:3000
# 账号: admin  密码: admin123

# B 机器独立接入向导 (Standalone Portal)
open http://localhost:8000/onboard
```

启动后你将看到演示 Agent 自动模拟 6 种攻击场景，所有拦截事件实时显示在控制台大盘。

**服务组成：**

| 服务 | 地址 | 说明 |
|------|------|------|
| Web 控制台 | http://localhost:3000 | React 前端管理界面 |
| Backend API | http://localhost:8000 | FastAPI 后端（含 Swagger UI `/docs`） |
| Demo Agent | — | 自动循环模拟攻击的演示 Agent |
| PostgreSQL | localhost:5432 | 数据持久化 |
| Redis | localhost:6379 | 会话缓存 + 任务队列 |

---

### 方式二：SDK 单独接入（生产集成）

#### 1. 安装

```bash
pip install agentsec
```

#### 2. 接入 LangChain Agent（只需一行）

```python
from langchain.agents import initialize_agent
from agentsec.integrations.langchain import AgentSecurityCallback

# 初始化安全回调（默认 warn 模式：告警不中断业务）
security_callback = AgentSecurityCallback(
    agent_name="customer-service-bot",  # Agent 唯一标识
    business_line="客服",
    mode="warn"                          # 切换为 "block" 开启主动拦截
)

# 将回调注入 Agent
agent = initialize_agent(
    tools=my_tools,
    llm=my_llm,
    callbacks=[security_callback]        # ← 仅需增加这一行
)

agent.run("帮我查询订单状态")
```

#### 3. 静态权限扫描

在部署前检查工具集是否存在过度授权：

```python
from agentsec import scan_tools

warnings = scan_tools(my_tools)
for w in warnings:
    print(f"[{w['risk_level']}] {w['tool_name']}: {w['advice']}")

# 示例输出：
# [HIGH] python_repl: Allows arbitrary Python code execution. Extremely high risk for Prompt Injection.
# [HIGH] delete_file: Allows deleting local files. Review if Read/Write restricted tools are sufficient.
```

#### 4. 离线模式（Air-Gapped 环境）

```bash
# 禁用所有网络同步，完全本地运行
export AGENTSEC_OFFLINE=true
```

---

## 安全左移：CI/CD 自动化审计 (Security Left-Shift)

针对原型图中高优先级的「在上线前扫描 Agent 配置」模块，AgentSec 提供工业级的 CLI 审计工具，可无缝集成至 GitHub Actions/GitLab CI。

### 1. 本地扫描 (Manual Scan)

```bash
# 扫描当前项目，若发现 HIGH/CRITICAL 风险则退出码为 1
python scripts/scan_agent_config.py . --fail-on HIGH
```

### 2. 流水线集成 (CI/CD Integration)

通过 [agentsec-scan.yml.example](.github/workflows/agentsec-scan.yml.example) 模版，您可以在每次 `pull_request` 时自动触发：
- **AST 代码审计**：识别硬编码工具、缺失 `AgentSecurityCallback` 等逻辑风险。
- **依赖扫描**：阻断包含 `langchain_experimental` 等受限库的合并。
- **凭证检测**：拦截 `.env` 或源码中泄露的 `API_KEY`。

---

## 防御模式详解

### WARN 模式（默认）

适合初期接入、灰度验证阶段。检测到威胁后**记录告警、原始请求照常放行**，不中断业务。

```python
AgentSecurityCallback(mode="warn")
```

### BLOCK 模式

适合生产高风险场景。检测到威胁后**立即替换为安全兜底文本**，阻止恶意内容进入 LLM。

```python
AgentSecurityCallback(
    mode="block"
)
```

---

## 检测能力矩阵

| 攻击类型 | 检测点 | 检测方式 |
|----------|--------|----------|
| 直接 Prompt 注入 | `on_llm_start` | 正则 + 黑名单 + 语义向量 |
| RAG 间接注入 | `on_retriever_end` | 文档内容扫描 |
| 高危工具调用 | `on_tool_start` | 工具名白/黑名单 |
| 流式输出劫持 | `on_llm_new_token` | 滑动窗口实时检测 |
| PII 数据外泄 | `on_llm_start` | 正则（手机号/身份证/邮箱） |
| 多轮慢速注入 | `on_llm_start` | 上下文关联攻击组合检测 |
| 多 Agent 传播 | `on_chain_start` | 调用链元数据监控 |

---

## Web 控制台功能

访问 `http://localhost:3000` 后，你可以：

- **大盘总览**：实时查看拦截次数、在线 Agent 数量、P99 延迟、误报率等核心指标
- **接入向导 V3**：全自动动态脚本分发，支持 SDK 离线包下发、环境自适应、连通性探测、逻辑自检与心跳注册 5 大步骤实时监控
- **工业化 UI**：基于 Outfit & Inter 字体系统，针对高强度 SOC 监控场景优化的 Tabular Precision 布局
- **告警中心**：逐条研判每一次安全事件，支持调用链还原、处置 SOP、误报反馈
- **Agent 资产池**：管理所有已接入 SDK 的 Agent，查看风险评分、权限状态
- **检测规则**：查看规则引擎版本、每条规则命中频率、ONNX 模型状态
- **权限扫描**：静态分析 Agent 工具集，识别最小权限违规
- **合规报告**：自动生成周/月度合规报告，支持 OWASP/等保 2.0 基线对照
- **审计日志**：不可篡改的操作流水，支持导出 CSV

---

## 本地开发环境搭建

### 前置依赖

- Python 3.8+
- Node.js 20+
- Docker & Docker Compose（可选，用于完整环境）

### 仅运行后端 + SDK

```bash
# 1. 克隆仓库
git clone https://github.com/agentsec/agentsec.git
cd agentsec

# 2. 安装依赖
pip install -r requirements.txt

# 3. 启动数据库（需 Docker）
docker run -d \
  -e POSTGRES_USER=agentsec \
  -e POSTGRES_PASSWORD=agentsec_pwd \
  -e POSTGRES_DB=agentsec \
  -p 5432:5432 postgres:16-alpine

docker run -d -p 6379:6379 redis:7-alpine

# 4. 初始化数据库
alembic upgrade head

# 5. 启动后端
uvicorn agentsec.server.app:app --reload --host 0.0.0.0 --port 8000

# 6. 验证 SDK（使用占位 Key）
export AGENTSEC_OFFLINE=true
python example.py
```

### 启动前端控制台

```bash
cd console_app
npm install
npm run dev
# 访问 http://localhost:5173
```

### 运行测试

```bash
pytest tests/ -v
```

---

## 配置说明

所有配置项均通过环境变量设置，无需修改代码：

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `AGENTSEC_OFFLINE` | `false` | 设为 `true` 完全禁用网络同步 |
| `AGENTSEC_RULE_SERVER` | 官方规则服务器 | 私有部署时指向内网规则服务器 |
| `AGENTSEC_RULE_SYNC_INTERVAL` | `3600` | 规则自动同步间隔（秒） |
| `AGENTSEC_DATA_DIR` | `~/.agentsec` | 本地规则缓存目录 |
| `AGENTSEC_LOG_LEVEL` | `WARNING` | 日志级别（DEBUG/INFO/WARNING） |
| `DATABASE_URL` | 本地 PostgreSQL | 控制台后端数据库连接串 |
| `REDIS_URL` | 本地 Redis | Redis 连接串 |

---

## 项目结构

```
agentsec/
├── agentsec/                  # Python SDK 核心
│   ├── integrations/
│   │   └── langchain.py       # LangChain Callback 适配器
│   ├── rules/
│   │   ├── engine.py          # 本地规则引擎（正则 + 黑名单 + 语义）
│   │   ├── cache.py           # 规则本地缓存管理
│   │   └── updater.py         # 后台规则自动同步
│   ├── scanner/
│   │   └── static_scanner.py  # 工具权限静态扫描
│   ├── core/
│   │   └── manager.py         # 多轮会话上下文管理
│   ├── models/
│   │   └── result.py          # 安全结果数据模型
│   └── server/                # 控制台后端 API (FastAPI)
│       ├── app.py
│       ├── models.py          # 数据库模型
│       ├── database.py
│       └── redis_client.py
├── console_app/               # Web 控制台前端 (React + TypeScript)
│   └── src/components/        # Dashboard, AlertsPage, RulesPage 等
├── migrations/                # Alembic 数据库迁移脚本
├── tests/                     # 单元测试 + 集成测试
├── demo/
│   └── demo_agent.py          # 自动化攻防演示脚本
├── docker-compose.yml
└── example.py                 # SDK 快速验证脚本
```

---

## 路线图

- [x] LangChain Callback 全生命周期覆盖
- [x] 本地规则引擎 + ONNX 离线语义检测
- [x] 多轮对话上下文关联攻击检测
- [x] 流式输出滑动窗口拦截
- [x] Web 控制台（告警 / 资产 / 规则 / 合规）
- [ ] CrewAI / AutoGen 框架适配
- [ ] MCP（Model Context Protocol）工具安全审计
- [ ] A2A（Agent-to-Agent）身份签名与信任链验证
- [ ] 用户行为基线建模（Behavior Profiling）
- [ ] 误报率自动优化（规则反馈闭环）

---

## 贡献指南

我们欢迎以下形式的贡献：

**提交新的检测规则（最受欢迎）**：在 PR 中附上规则 JSON、3 个正向测试用例和 3 个负向测试用例。规则格式参见 [CONTRIBUTING.md](CONTRIBUTING.md)。

**修复 Bug / 功能增强**：请先开 Issue 描述问题，Fork 后提交 PR。提交前请确保 `pytest tests/` 全部通过。

**发现安全漏洞**：请勿公开 Issue，直接发送邮件至 `security@agentsec.io`，详见 [SECURITY.md](SECURITY.md)。

---

## 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

---

*AgentSec — 让 AI Agent 在生产环境中更安全地运行。*