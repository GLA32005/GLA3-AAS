"""
AI Agent 安全治理平台 SDK (AgentSec)
Provide zero-configuration prompt injection detection and security policies for LLM Agents.
"""

__version__ = "0.1.0"
__author__ = "AgentSec Community"

# 占位符：后续阶段导入具体的配置及模块
from .config import config
from .integrations.langchain import AgentSecurityCallback
from .scanner.static_scanner import scan_tools
from .async_tasks.onnx_runner import onnx_runner # 确保后台处理器就绪

__all__ = [
    "config",
    "AgentSecurityCallback",
    "scan_tools"
]
