# AgentSec · AI Agent 安全治理平台

> **零配置、开箱即用的 AI Agent 运行时安全防护与治理框架 (v3.0 Enterprise)**
> 一行代码接入，毫秒级拦截 Prompt 注入、RAG 投毒与数据外泄。
> **3.0 全新特性：AI 最小权限建议引擎、A2A 身份水印、真实合规指标。**

[![Python](https://img.shields.io/badge/Python-3.9%2B-blue)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![SDK Version](https://img.shields.io/badge/SDK-v3.0-purple)](https://github.com/GLA32005/GLA3-AAS)

---

## 为什么需要 AgentSec 3.0？

随着 LLM Agent 向多智能体（Multi-Agent）与长链路协作进化，传统的黑盒运行已成为企业核心风险。AgentSec 3.0 引入了**深度治理**能力：

- **🧠 动态最小权限治理**：通过实时分析工具调用遥测，系统自动识别冗余权限并提供 AI 撤销建议。
- **🔗 A2A 身份签名体系**：各 Agent 间协作均携带基于 HMAC-SHA256 的数字水印，杜绝凭证篡改与横向位移。
- **📊 真实合规监测**：基于生产审计流实时计算 SLO、PII 覆盖率等关键指标，对标「等保 2.0」及「数安法」。

---

## 核心特性

| 特性 | 说明 |
|------|------|
| **零配置接入** | 一行代码注入 Callback，支持云端 IP 自动感知与动态基地址发现 |
| **🧠 AI 治理建议** | 动态分析 Agent 行为建模，智能识别并建议撤销「僵尸工具」权限 |
| **🔗 A2A 身份水印** | 跨 Agent 调用链数字签名，确保协作链路的防伪与不可篡改性 |
| **🛡️ 运行时拦截** | 直接注入 / RAG 间接注入 / PII 脱敏 / 流式输出检测 (BLOCK/WARN) |
| **可观测性** | 工业级 SOC 界面，支持攻击链还原 (Attack Chain) 与调用实时审计 |
| **安全左移** | 内置 AST 配置审计引擎，支持 CI/CD 环节提前阻断风险代码上线 |

---

## 快速开始

### 方式一：本地开发/演练环境 (推荐)

我们提供了 `local_dev.sh` 脚本，可快速启动含数据库、Redis 及控制台的完整环境：

```bash
# 一键初始化并拉起所有服务 (含 DB/Redis/API/Console)
./local_dev.sh

# 访问 Web 控制台
# 前端访问：http://localhost:3000
# 后端 API：http://localhost:8000
```

### 方式二：生产环境部署

```bash
# 使用 Docker Compose 快速生产上线
docker-compose up --build -d

# 前端地址：http://<服务器IP>:3000
# 后端 API：http://<服务器IP>:8000 (支持自动 Host 探测)
```

---

## 核心治理模块

### 1. 动态最小权限建议 (`least_privilege.py`)
AgentSec 会对每个 Agent 的工具调用轨迹进行建模。如果你声明了 `Terminal` 等高危权限但在 24 小时内未实际使用，控制台会在「权限管理」页面标记为 **HIGH RISK** 并提供一键 Revoke SOP。

### 2. A2A 身份签名体系
在 SDK (`integrations/langchain.py`) 中，系统利用注册时自动生成的 `secret_key` 进行 HMAC 签名。这确保了在 Multi-Agent 调用链中，所有身份指纹具备可追溯性与端到端信任。

### 3. 安全左移审计 (Static Scan)
```bash
# 在 CI 流水线中扫描当前 Agent 项目
python scripts/scan_agent_config.py . --fail-on HIGH
```
识别包括硬编码 API Key、缺失安全网关、过度授权工具等在内的 12 类典型安全配置风险。

---

## 路线图 (Roadmap)

- [x] LangChain Callback 全生命周期覆盖 (v1.0)
- [x] 本地规则引擎 + 语义向量离线检测 (v1.5)
- [x] 安全左移：AST 静态代码审计插件 (v2.0)
- [x] **AgentSec 3.0：AI 最小权限建议引擎** 🧠
- [x] **AgentSec 3.0：A2A 身份签名验证体系** 🔗
- [x] **AgentSec 3.0：真实合规数据水位实装** 📊
- [ ] 自动化风险处置策略重心 (Policy Auto-tuning)
- [ ] 分布式 Agent 协作拓扑自动发现

---

## 项目结构

```
agentsec/
├── agentsec/                  # Python SDK 与后端核心
│   ├── integrations/          # LangChain 适配器 (含 A2A 签名逻辑)
│   ├── server/                # 控制台后端 API (FastAPI)
│   │   ├── least_privilege.py # 最小权限建议引擎核心
│   │   └── app.py             # A2A 密钥管理与合规聚合逻辑
│   ├── scanner/               # 静态扫描工具集
│   └── models/                # 跨组件统一数据模型
├── console_app/               # Web 控制台前端 (React + TypeScript)
├── demo/                      # 自动化攻防演示脚本
└── docker-compose.yml         # 生产发布配置
```

---

## 贡献与许可证

本项目基于 [MIT 许可证](LICENSE) 开源。欢迎提交 PR 扩充防御规则库。

---
*AgentSec — 赋能每一个 AI Agent 在安全护栏内释放潜能。* 🛡️🚀