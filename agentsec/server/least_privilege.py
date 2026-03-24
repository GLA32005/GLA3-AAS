from typing import List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from . import models
import uuid

class LeastPrivilegeEngine:
    """
    最小权限建议引擎
    通过对比 Agent 的「在册权限」与「实际调用审计」，识别冗余权限。
    """
    
    @staticmethod
    async def generate_suggestions(db: AsyncSession, agent_id: uuid.UUID, days: int = 30) -> List[Dict[str, Any]]:
        # 1. 获取 Agent 信息（目前假设 metadata_json 或配置中存有初始工具清单）
        result = await db.execute(select(models.Agent).where(models.Agent.id == agent_id))
        agent = result.scalar_one_or_none()
        if not agent:
            return []

        # 2. 获取过去 X 天内的真实工具调用记录
        # 我们假设 event_type 为 'tool_call'，工具名存在 metadata_json['tool_name']
        since = datetime.utcnow() - timedelta(days=days)
        query = (
            select(models.AuditLog.metadata_json["tool_name"].astext, func.count(models.AuditLog.id))
            .where(models.AuditLog.agent_id == agent_id)
            .where(models.AuditLog.event_type == 'tool_call')
            .where(models.AuditLog.created_at >= since)
            .group_by(models.AuditLog.metadata_json["tool_name"].astext)
        )
        
        usage_result = await db.execute(query)
        used_tools = {row[0]: row[1] for row in usage_result}

        # 3. 这里的逻辑是：如果 Agent 的注册信息里声明了某些高危工具，但从未被用到，则建议收缩
        # 在原型演示阶段，如果没有真实的注册清单，我们基于预置的高危工具列表进行「模拟研判」
        # 但既然要对齐 1.0，我们从 Agent 的 metadata 中尝试获取最初声明的 tools
        declared_tools = agent.metadata_json.get("declared_tools", []) if hasattr(agent, "metadata_json") and agent.metadata_json else []
        
        # 如果没有 metadata，使用一套默认的高危工具作为检测基准（模拟真实场景）
        if not declared_tools:
            declared_tools = ["Terminal", "python_repl", "requests_all", "FileDeleteTool", "WriteFileTool", "BashProcess"]

        suggestions = []
        for tool in declared_tools:
            count = used_tools.get(tool, 0)
            if count == 0:
                suggestions.append({
                    "tool": tool,
                    "reason": f"过去 {days} 天内调用次数为 0。该工具具备高风险，建议下线以收缩攻击面。",
                    "risk_level": "High",
                    "action": "Revoke"
                })
            elif count < 3:
                 suggestions.append({
                    "tool": tool,
                    "reason": f"调用频率极低（仅 {count} 次）。请核实业务必要性，建议收紧访问策略。",
                    "risk_level": "Medium",
                    "action": "Monitor"
                })

        return suggestions

# 辅助函数，供 app.py 调用
async def get_least_privilege_suggestions(db: AsyncSession, agent_id: uuid.UUID):
    return await LeastPrivilegeEngine.generate_suggestions(db, agent_id)
