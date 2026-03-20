import logging
from typing import List, Dict, Any, Union

logger = logging.getLogger("agentsec")

# 预置的高危工具黑名单与建议
HIGH_RISK_TOOLS = {
    "Terminal": "Allows arbitrary shell command execution. Recommend using restricted APIs instead.",
    "python_repl": "Allows arbitrary Python code execution. Extremely high risk for Prompt Injection.",
    "requests_all": "Allows SSRF attacks. Restrict domains in requests.",
    "FileDeleteTool": "Allows deleting local files. Review if Read/Write restricted tools are sufficient.",
    "WriteFileTool": "Allows writing local files. Can be used to overwrite code or configs.",
    "BashProcess": "Direct shell access.",
}

class StaticPermissionScanner:
    """
    基础权限扫描（静态）模块
    负责在 Agent 初始化阶段扫描传入的 tools 列表，或者扫描静态配置，评估是否存在权限过度配置风险。
    """
    
    @staticmethod
    def scan_langchain_tools(tools: List[Any]) -> List[Dict[str, str]]:
        """
        扫描传入的 LangChain Tools 列表，返回高危配置告警列表
        """
        warnings = []
        for tool in tools:
            # 兼容 LangChain Tool 的基本属性提取
            tool_name = getattr(tool, "name", "")
            tool_type = type(tool).__name__
            
            # 检测常用名命中
            for risk_name, advice in HIGH_RISK_TOOLS.items():
                if risk_name.lower() in tool_name.lower() or risk_name.lower() in tool_type.lower():
                    warn_msg = {
                        "tool_name": tool_name,
                        "tool_type": tool_type,
                        "risk_level": "HIGH",
                        "advice": advice
                    }
                    warnings.append(warn_msg)
                    logger.warning(f"[Permission Scan] Detected high-risk tool: '{tool_name}' ({tool_type}) - {advice}")
        
        if not warnings:
            logger.info("[Permission Scan] No high-risk tools detected. Permissions look good.")
            
        return warnings

# 暴露给外部简单的扫描函数
def scan_tools(tools: List[Any]) -> List[Dict[str, str]]:
    return StaticPermissionScanner.scan_langchain_tools(tools)
