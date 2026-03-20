# AgentSec: 零配置 AI Agent 安全治理预警框架

AgentSec 是一款极轻量的、零配置的安全防护 SDK。专门用于在生产环境中为您组装的 AI Agent 提供 Prompt 注入检测、防投毒越权与数据隐私外泄的安全保障。

## 本地 10 分钟一键靶场体验 (推荐)
为方便安全研究人员快速验证效果，我们在仓库中内置了自带漏洞的靶机与控制台引擎，只需一条命令即可拉起攻防演练：

```bash
# 启动包含 Web 控制台、API 后端以及一个会自动发动注入、RAG 投毒的演示 Agent
docker-compose up --build -d
```
启动后访问 `http://localhost:3000` (账号: `admin` / 密码: `admin123`) 即可在界面实时观测到所有的恶意请求正在被精准阻断！

---

## 零摩擦接入理念
为了打造顺滑的开发者体验，AgentSec 专为 **LangChain** 等主流编排框架设计。没有任何重型的外部网络或中间件依赖限制，且将运行阻断的可能降至最低。

## 快速开始 (LangChain)

只要在您的 Agent 初始化过程中将 `AgentSecurityCallback` 加入到生命周期即可：

```python
from langchain.agents import initialize_agent
from agentsec.integrations.langchain import AgentSecurityCallback

# 仅需一行代码接入，立即开启针对大模型的全栈交互监控！
# 默认情况下使用 "warn" 模式，包含攻击载荷的异常请求只会被拦截并告警，但不会中断正常业务流程。
agent = initialize_agent(
    tools=my_tools,
    llm=my_llm,
    callbacks=[AgentSecurityCallback()]
)
```

## 防御模式设定
- **WARN (默认告警模式):**  任何命中间接或直接的提示词注入动作都会在本地生成日志，并可通过 Webhook 向安全中台报警，但该会话将被放行用于业务调试。
- **BLOCK (主动拦截兜底):** SDK 将在文本传输管线中直接强阻断高危指令执行，并在响应中嵌入经过脱敏的安全提示语。开启示例：`AgentSecurityCallback(mode="block")`

## 静态权限扫描评估
为防止您的 Agents 在建立时被授予了过度的基建权限，您可以静态扫描您传入的外部工具链（Tool），以提前规避类似 PythonREPL 或 Shell 等高危代码执行风险：

```python
from agentsec import scan_tools

warnings = scan_tools(my_tools)
for warning in warnings:
    print(f"[{warning['risk_level']}] {warning['tool_name']}: {warning['advice']}")
```

## 动态指纹更新机制
AgentSec 内置了一个异步后台守护服务。它会定期自动从规则服务器无痕拉取轻量的最新攻击正则表达式及特征签名到本地磁盘缓存 `~/.agentsec/rules_cache/` 中。借助于纯内存执行的离线校验，能够使得在线引擎的 P99 拦截延迟降低至 `< 20ms`。
对于需要断网隔离的企业环境（如金融、政务部门），您也可以选择配置 `AGENTSEC_OFFLINE=true` 完全关闭网络交互功能。
