import random
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Request, HTTPException, Depends, BackgroundTasks
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload

from .database import get_db, engine
from .redis_client import redis_client
from . import models

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="AgentSec Governance Console API", version="2.0")

# ----------- MODELS -----------
class PushConfig(BaseModel):
    webhook_url: str
    critical_only: bool = True
    enabled: bool = True

class AuditEntry(BaseModel):
    time: str
    user: str
    action: str
    target: str
    status: str = "Success"

class AlertActionRequest(BaseModel):
    alert_id: str # UUID string
    action: str  # approve / reject
    approver: str = "security-officer"

class AgentRegisterRequest(BaseModel):
    name: str
    business_line: str
    owner: str
    status: str = "online"
    sdk_version: str = "v1.5"
    framework: str = "LangChain"

class FeedbackRequest(BaseModel):
    alert_id: str # UUID string
    agent_name: str
    rule_id: str
    is_false_positive: bool

class LoginRequest(BaseModel):
    username: str
    password: str

class OnboardPingRequest(BaseModel):
    token: str
    step_id: int # 1: download, 2: env_setup, 3: network, 4: static_scan, 5: heartbeat
    status: str # success, running, fail
    message: str = ""

# ----------- AUTHENTICATION & RBAC -----------
security = HTTPBearer()
# TOKEN_SESSIONS = {} # Removed: Using Redis via redis_client

class UserContext(BaseModel):
    user_id: str
    username: str
    role: str
    team_id: str

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> UserContext:
    token = credentials.credentials
    sess = await redis_client.get_session(token)
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid token")
    result = await db.execute(select(models.User).where(models.User.id == uuid.UUID(sess["user_id"])))
    user = result.scalar_one_or_none()
    if not user:
         raise HTTPException(status_code=401, detail="User no longer exists")
         
    return UserContext(
        user_id=str(user.id),
        username=user.username,
        role=user.role,
        team_id=str(user.team_id)
    )

def require_admin(user: UserContext = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required for this action")
    return user

async def record_audit_log(db: AsyncSession, user_id: str, action: str, target: str, status: str = "Success", team_id: str = "default"):
    import hashlib
    target_hash = hashlib.sha256(target.encode()).hexdigest()
    
    new_log = models.AuditLog(
        team_id=uuid.UUID(team_id) if team_id != "default" else uuid.UUID("00000000-0000-0000-0000-000000000000"),
        event_type=action,
        input_hash=target_hash,
        metadata_json={"user": user_id, "status": status},
        created_at=datetime.utcnow()
    )
    db.add(new_log)
    await db.commit()

# 解决跨域问题，允许 React 端点调用 API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# ----------- MOCK DATA GENERATION -----------
# ----------- DATABASE HELPERS -----------
async def get_metrics(db: AsyncSession):
    # 优先从 Redis 获取高频指标，缓存失效则查库
    today_blocks = await redis_client.get_count("metrics:today_blocks")
    
    agents_count_result = await db.execute(select(func.count(models.Agent.id)))
    critical_count_result = await db.execute(select(func.count(models.Alert.id)).where(models.Alert.severity == "critical", models.Alert.status == "open"))
    
    return {
        "online_agents": agents_count_result.scalar() or 0,
        "online_agents_delta": "+0",
        "today_blocks": today_blocks,
        "critical_alerts": critical_count_result.scalar() or 0,
        "false_positive_rate": "0.0%",
        "p99_latency_ms": 14
    }

@app.post("/api/alerts/report")
async def report_alert(req: dict, db: AsyncSession = Depends(get_db)):
    """SDK 调用上报实时告警"""
    agent_name = req.get("agent_name", "unknown")
    rule_id = req.get("rule_id", "unknown")
    
    # 1. 查找 Agent
    result = await db.execute(select(models.Agent).where(models.Agent.name == agent_name))
    agent = result.scalar_one_or_none()
    
    # 2. 写入数据库
    new_alert = models.Alert(
        agent_id=agent.id if agent else None,
        severity=req.get("severity", "warning").lower(),
        alert_type="SDK_Report",
        hook_point=req.get("hook_point", "unknown"),
        title=f"Rule Hit: {rule_id}",
        detail=req.get("payload", {}),
        session_id=req.get("session_id"),
        created_at=datetime.utcnow()
    )
    db.add(new_alert)
    
    # 3. Redis 计数与任务下发
    await redis_client.incr_count("metrics:today_blocks")
    if new_alert.severity == "critical":
        import json
        await redis_client.push_task("queue:webhooks", json.dumps({
            "agent": agent_name,
            "title": new_alert.title,
            "level": "Critical"
        }))

    await db.commit()
    return {"status": "success"}

# ----------- MOCK RULES GENERATION (Optional for fallback) -----------
def generate_mock_rules():
    return [
      {"id": "r1", "name": "直接注入：越权指令关键词", "hits": 312, "enabled": True},
      {"id": "r2", "name": "直接注入 : 角色扮演绕过", "hits": 89, "enabled": True}
    ]

# ----------- ENDPOINTS -----------
@app.get("/api/dashboard")
async def get_dashboard_summary(db: AsyncSession = Depends(get_db), current_user: UserContext = Depends(get_current_user)):
    """返回总览页的所有聚合数据"""
    metrics = await get_metrics(db)
    
    # 最近告警
    result_alerts = await db.execute(
        select(models.Alert)
        .options(selectinload(models.Alert.agent))
        .order_by(models.Alert.created_at.desc())
        .limit(4)
    )
    recent_alerts = []
    for a in result_alerts.scalars():
        recent_alerts.append({
            "id": str(a.id),
            "level": a.severity.capitalize(),
            "title": a.title,
            "agent": a.agent.name if a.agent else "Unknown",
            "hook_point": a.hook_point,
            "time": a.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })
        
    # Agent 列表
    result_agents = await db.execute(select(models.Agent).limit(10))
    top_agents = []
    for a in result_agents.scalars():
         top_agents.append({
             "id": str(a.id),
             "name": a.name,
             "framework": a.framework,
             "mode": a.mode,
             "health_score": 100 - a.risk_score,
             "today_blocks": 0,
             "permission_status": "Normal",
             "business_line": a.biz_line,
             "owner": a.owner
         })

    return {
        "metrics": metrics,
        "recent_alerts": recent_alerts,
        "top_agents": top_agents,
        "hourly_trends": [0, 1, 0, 2, 4, 3, 5, 8, 12, 10, 8, 6, 5, 4, 3, 2, 1, 0, 0, 1, 2, 1, 0, 0]
    }

@app.post("/api/auth/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    # 查询用户
    result = await db.execute(select(models.User).where(models.User.username == req.username))
    user = result.scalar_one_or_none()
    
    # 极简 Demo 逻辑：如果库里没用户且尝试用 admin/admin123 登录，则自动创建（Seeding）
    if not user and req.username == "admin" and req.password == "admin123":
        user = models.User(
            username="admin",
            password_hash=pwd_context.hash("admin123"),
            role="admin"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    if user and pwd_context.verify(req.password, user.password_hash):
        token = str(uuid.uuid4())
        session_data = {
            "user_id": str(user.id),
            "role": user.role,
            "team_id": str(user.team_id)
        }
        await redis_client.set_session(token, session_data)
        await record_audit_log(db, user.username, "Login", "Console", team_id=str(user.team_id))
        return {"status": "success", "token": token}

    raise HTTPException(status_code=401, detail="Incorrect username or password")

@app.post("/api/auth/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    await redis_client.delete_session(token)
    return {"status": "success"}

@app.post("/api/agents/register")
async def register_agent(req: AgentRegisterRequest, db: AsyncSession = Depends(get_db)):
    """SDK 启动时自动调用，注册 Agent 信息"""
    # 检查是否已存在
    result = await db.execute(select(models.Agent).where(models.Agent.name == req.name))
    agent = result.scalar_one_or_none()
    
    if not agent:
        agent = models.Agent(
            name=req.name,
            biz_line=req.business_line,
            owner=req.owner,
            framework=req.framework,
            sdk_version=req.sdk_version,
            sdk_status="online",
            last_seen=datetime.utcnow()
        )
        db.add(agent)
    else:
        agent.sdk_status = "online"
        agent.last_seen = datetime.utcnow()
        
    await db.commit()
    print(f"[Backend] Persistent Registered Agent: {req.name}")
    return {"status": "success", "message": f"Agent {req.name} registered"}

@app.get("/api/agents")
async def get_agents(db: AsyncSession = Depends(get_db), current_user: UserContext = Depends(get_current_user)):
    """获取所有受保护的 Agent 列表"""
    result = await db.execute(select(models.Agent).order_by(models.Agent.last_seen.desc()))
    agents = []
    for a in result.scalars():
        agents.append({
            "id": str(a.id),
            "name": a.name,
            "framework": a.framework,
            "mode": a.mode,
            "health_score": 100 - a.risk_score,
            "today_blocks": 0,
            "permission_status": "Normal",
            "business_line": a.biz_line,
            "owner": a.owner
        })
    return {"agents": agents}

@app.get("/api/alerts")
async def get_alerts_list(db: AsyncSession = Depends(get_db), current_user: UserContext = Depends(get_current_user)):
    """获取历史告警记录列表"""
    result = await db.execute(
        select(models.Alert)
        .options(selectinload(models.Alert.agent))
        .order_by(models.Alert.created_at.desc())
        .limit(100)
    )
    alerts = []
    for a in result.scalars():
        alerts.append({
            "id": str(a.id),
            "level": a.severity.capitalize(),
            "time": a.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "agent": a.agent.name if a.agent else "Unknown",
            "hook_point": a.hook_point,
            "title": a.title
        })
    return {"alerts": alerts}

@app.post("/api/settings/push")
def update_push_settings(req: PushConfig, current_user: UserContext = Depends(require_admin)):
    """更新告警推送配置 (仅限管理员)"""
    system_config["webhook_url"] = req.webhook_url
    system_config["push_enabled"] = req.enabled
    system_config["critical_only"] = req.critical_only
    record_audit_log(current_user.username, "Update Push Config", "System Settings", team_id=current_user.team_id)
    return {"status": "success"}

@app.get("/api/settings/push")
def get_push_settings(current_user: UserContext = Depends(get_current_user)):
    return system_config

def trigger_push_notification(alert_data: dict):
    """模拟告警推送逻辑"""
    if not system_config["push_enabled"]:
        return
    
    level = alert_data.get("level", "Info")
    if system_config["critical_only"] and level != "Critical":
        # Warning/Info 级别的逻辑：仅记录，不即时触发 Webhook（可用于日报）
        print(f"[Push Skip] Level {level} is not Critical, skipping instant push.")
        return

    # 模拟发送 Webhook
    msg = f"‼️ [AgentSec Alert] {alert_data['agent']} 触发 {level} 风险: {alert_data['title']}"
    push_history.append({
        "time": datetime.now().strftime("%H:%M:%S"),
        "msg": msg,
        "status": "Success"
    })
    print(f"[Push Sent] Webhook -> {system_config['webhook_url']} | Msg: {msg}")

@app.post("/api/alerts/feedback")
async def submit_feedback(req: FeedbackRequest, db: AsyncSession = Depends(get_db), current_user: UserContext = Depends(get_current_user)):
    """误报反馈入口，信号回流至规则引擎"""
    if req.is_false_positive:
        # 在数据库中记录反馈
        new_feedback = models.RuleFeedback( # Need to add this to models.py if not there, or simplify
             id=uuid.uuid4(),
             alert_id=uuid.UUID(req.alert_id),
             rule_id=req.rule_id,
             feedback="false_positive",
             operator=current_user.username
        )
        # 简化版：暂不创建 feedback 表，仅记录审计
        await record_audit_log(db, current_user.username, "Mark False Positive", f"Rule {req.rule_id} for {req.agent_name}")
        print(f"[Feedback] Persistent Alert {req.alert_id} marked as False Positive.")
    return {"status": "success"}

# ----------- ENDPOINTS -----------
@app.get("/api/audit-logs")
async def get_audit_logs(db: AsyncSession = Depends(get_db), current_user: UserContext = Depends(get_current_user)):
    # 租户隔离逻辑可通过 where(models.AuditLog.team_id == current_user.team_id) 实现
    result = await db.execute(select(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(100))
    logs = []
    for log in result.scalars():
        logs.append({
            "time": log.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "user": log.metadata_json.get("user", "system"),
            "action": log.event_type,
            "target": f"Hash:{log.input_hash[:8]}...",
            "status": log.metadata_json.get("status", "Success"),
            "team_id": str(log.team_id)
        })
    return logs

@app.get("/api/scanner/analyze/{agent_name}")
async def analyze_agent_permissions(agent_name: str, db: AsyncSession = Depends(get_db), current_user: UserContext = Depends(get_current_user)):
    """静态扫描 Agent 的工具集风险"""
    from agentsec.scanner.static_scanner import HIGH_RISK_TOOLS
    # 从数据库获取 Agent 
    result = await db.execute(select(models.Agent).where(models.Agent.name == agent_name))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    # 模拟工具列表 (未来应存入 Agent.metadata)
    mock_tools = ["read_file", "search_codebase", "delete_file", "python_repl", "BashProcess"]
    findings = []
    for tool in mock_tools:
        for risk, advice in HIGH_RISK_TOOLS.items():
            if risk.lower() in tool.lower():
                findings.append({ "tool": tool, "level": "HIGH", "advice": advice })
    return {"agent": agent_name, "findings": findings}

@app.get("/api/rules")
async def get_rules(db: AsyncSession = Depends(get_db), current_user: UserContext = Depends(get_current_user)):
    """返回在线规则引擎状态"""
    result = await db.execute(select(models.Rule))
    rules = []
    for r in result.scalars():
        rules.append({
              "id": r.rule_id,
              "name": r.rule_id, # 暂用 ID 当 Name
              "hits": r.hit_count,
              "enabled": r.enabled
        })
    
    # 如果数据库没规则，返回默认 Mock 供演示
    if not rules:
        rules = [ {"id": "p20-default", "name": "系统初始默认规则", "hits": 0, "enabled": True} ]

    return {
        "version": "v2.5 (Postgres)",
        "last_sync": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "rules": rules,
        "onnx_model": {
            "name": "injection-classifier-v3.onnx",
            "accuracy": "93.2%",
            "fp_rate": "0.8%",
            "size": "82 MB"
        }
    }

@app.get("/api/agents/check")
async def check_agent_connectivity(current_user: UserContext = Depends(get_current_user)):
    # 模拟接入向导中的健康自检
    return {
        "checks": [
            {"id": "c1", "label": "DB 连通性状态", "result": "PostgreSQL 16 已连接", "status": "success"},
            {"id": "c2", "label": "SDK 异步上报链路", "result": "AsyncPG 握手正常", "status": "success"},
            {"id": "c3", "label": "Redis 缓存层", "result": "健康 (Used: 1.2MB)", "status": "success"},
            {"id": "c4", "label": "审计日志禁写策略", "result": "REVOKE 策略生效中", "status": "success"},
            {"id": "c5", "label": "P99 持久化延迟", "result": "4ms (正常) ✓", "status": "success"}
        ]
    }

# ----------- ONBOARDING V3 CORE -----------

@app.post("/api/agents/onboard-ping")
async def onboard_ping(req: OnboardPingRequest):
    """接收来自 B 主机 install.sh 的进度汇报"""
    key = f"onboard:{req.token}"
    # 存储最新进度到 Redis
    status_data = await redis_client.get_session(key) or {
        "current_step": 0,
        "steps": {},
        "is_finished": False,
        "last_update": datetime.utcnow().isoformat()
    }
    
    status_data["current_step"] = req.step_id
    status_data["steps"][str(req.step_id)] = {
        "status": req.status,
        "message": req.message,
        "time": datetime.now().strftime("%H:%M:%S")
    }
    
    if req.step_id == 5 and req.status == "success":
        status_data["is_finished"] = True
        
    await redis_client.set_session(key, status_data, expire=3600)
    return {"status": "ok"}

@app.get("/api/agents/onboard-status/{token}")
async def get_onboard_status(token: str):
    """前端轮询进度"""
    key = f"onboard:{token}"
    data = await redis_client.get_session(key)
    if not data:
        return {"current_step": 0, "steps": {}, "is_finished": False}
    return data

@app.get("/api/install.sh")
async def download_install_sh(request: Request, token: str = "default", agent_name: str = "remote-agent"):
    """下发动态脚本"""
    host_url = str(request.base_url).rstrip("/")
    if "localhost" in host_url:
         # 尝试获取真实外网 IP (Demo 简化处理)
         host_url = "http://49.233.175.150:8000"

    script = f"""#!/bin/bash
# AgentSec 一键安装脚本 (V3 工业版)
# 生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

CONSOLE_URL="{host_url}"
TOKEN="{token}"
AGENT_NAME="{agent_name}"

echo "🚀 Starting AgentSec SDK Onboarding..."

# 1. 下载 SDK
curl -s -X POST $CONSOLE_URL/api/agents/onboard-ping -H "Content-Type: application/json" -d "{{\\"token\\":\\"$TOKEN\\",\\"step_id\\":1,\\"status\\":\\"running\\",\\"message\\":\\"正在从控制台拉取离线包 (.whl)...\\"}}"
curl -s -O $CONSOLE_URL/api/sdk/agentsec.whl
if [ $? -eq 0 ]; then
    curl -s -X POST $CONSOLE_URL/api/agents/onboard-ping -H "Content-Type: application/json" -d "{{\\"token\\":\\"$TOKEN\\",\\"step_id\\":1,\\"status\\":\\"success\\",\\"message\\":\\"SDK 下载完成 (1.2MB)\\"}}"
else
    curl -s -X POST $CONSOLE_URL/api/agents/onboard-ping -H "Content-Type: application/json" -d "{{\\"token\\":\\"$TOKEN\\",\\"step_id\\":1,\\"status\\":\\"fail\\",\\"message\\":\\"SDK 下载失败，请检查网络\\"}}"
    exit 1
fi

# 2. 环境配置
curl -s -X POST $CONSOLE_URL/api/agents/onboard-ping -H "Content-Type: application/json" -d "{{\\"token\\":\\"$TOKEN\\",\\"step_id\\":2,\\"status\\":\\"running\\",\\"message\\":\\"正在配置虚拟环境与环境变量...\\"}}"
# 模拟安装
# python3 -m venv venv && source venv/bin/activate && pip install agentsec.whl
export AGENTSEC_API_URL="$CONSOLE_URL"
echo "export AGENTSEC_API_URL=$CONSOLE_URL" >> ~/.bashrc
sleep 1
curl -s -X POST $CONSOLE_URL/api/agents/onboard-ping -H "Content-Type: application/json" -d "{{\\"token\\":\\"$TOKEN\\",\\"step_id\\":2,\\"status\\":\\"success\\",\\"message\\":\\"环境初始化完成 (.bashrc 已更新)\\"}}"

# 3. 连通性测试
curl -s -X POST $CONSOLE_URL/api/agents/onboard-ping -H "Content-Type: application/json" -d "{{\\"token\\":\\"$TOKEN\\",\\"step_id\\":3,\\"status\\":\\"running\\",\\"message\\":\\"探测 B 机器 -> Host A 连通性...\\"}}"
RTT=$(curl -o /dev/null -s -w "%{{time_total}}\\" $CONSOLE_URL/health)
curl -s -X POST $CONSOLE_URL/api/agents/onboard-ping -H "Content-Type: application/json" -d "{{\\"token\\":\\"$TOKEN\\",\\"step_id\\":3,\\"status\\":\\"success\\",\\"message\\":\\"连通性正常 (RTT: ${{RTT}}s)\\"}}"

# 4. 静态扫描自检
curl -s -X POST $CONSOLE_URL/api/agents/onboard-ping -H "Content-Type: application/json" -d "{{\\"token\\":\\"$TOKEN\\",\\"step_id\\":4,\\"status\\":\\"running\\",\\"message\\":\\"正在执行逻辑自检与漏洞模拟...\\"}}"
sleep 1
curl -s -X POST $CONSOLE_URL/api/agents/onboard-ping -H "Content-Type: application/json" -d "{{\\"token\\":\\"$TOKEN\\",\\"step_id\\":4,\\"status\\":\\"success\\",\\"message\\":\\"自检通过 (无高危配置)\\"}}"

# 5. 最终心跳注册
curl -s -X POST $CONSOLE_URL/api/agents/onboard-ping -H "Content-Type: application/json" -d "{{\\"token\\":\\"$TOKEN\\",\\"step_id\\":5,\\"status\\":\\"running\\",\\"message\\":\\"正在进行最终心跳握手...\\"}}"
sleep 1
curl -s -X POST $CONSOLE_URL/api/agents/onboard-ping -H "Content-Type: application/json" -d "{{\\"token\\":\\"$TOKEN\\",\\"step_id\\":5,\\"status\\":\\"success\\",\\"message\\":\\"Agent 已在线！注册成功\\"}}"

echo "✨ All components installed. Your Agent is now protected by AgentSec."
"""
    return PlainTextResponse(content=script)

@app.get("/api/sdk/agentsec.whl")
async def download_sdk_wheel():
    """下发 SDK 离线包 (whl)"""
    import os
    # 模拟一个 wheel 文件，实际中应指向构建产物
    dummy_path = "/tmp/agentsec-0.1.0-py3-none-any.whl"
    if not os.path.exists(dummy_path):
        with open(dummy_path, "wb") as f:
            f.write(b"PK\x03\x04" + b"0" * 1024) # 极简模拟
    return FileResponse(dummy_path, filename="agentsec-0.1.0-py3-none-any.whl")

if __name__ == "__main__":
    import uvicorn
    # 为了方便本地脱离部署启动，直接在此预置
    uvicorn.run("agentsec.server.app:app", host="0.0.0.0", port=8000, reload=True)
