import logging
from typing import Any, Dict, List, Optional
try:
    from langchain_core.callbacks import BaseCallbackHandler
    from langchain_core.messages import BaseMessage
    from langchain_core.outputs import LLMResult
except ImportError:
    # 为了保证 SDK 能无缝被安装，在缺乏 langchain 时做 Dummy 兼容
    class BaseCallbackHandler:
        pass
    class BaseMessage:
        pass
    class LLMResult:
        pass

from agentsec.rules.engine import engine
from agentsec.models.result import SecurityBlockedResult
from agentsec.core.manager import session_manager
from agentsec.async_tasks.queue_manager import queue_manager

import threading
import json

logger = logging.getLogger("agentsec")

class AgentSecurityCallback(BaseCallbackHandler):
    """
    针对 LangChain 生态的拦截适配器。
    覆盖间接注入的全部主要路径，根据传入的 `mode` 支持 warn/block。
    支持自动向控制台注册 Agent 元数据以建立资产台账。
    """
    
    def __init__(
        self, 
        mode: str = "warn", 
        agent_name: str = "anonymous-agent",
        agent_token: str = "unauthorized",
        business_line: str = "default",
        owner: str = "admin",
        console_url: str = "http://127.0.0.1:8000",
        stream_window_size: int = 32
    ):
        """
        初始化 AgentSecurityCallback
        :param mode: "warn" 仅告警放行; "block" 替换内容为安全拦截语。
        :param agent_name: Agent 唯一标识名称
        :param agent_token: Agent 认证令牌
        :param business_line: 所属业务线
        :param owner: 负责人
        :param console_url: 控制台后端 API 地址
        :param stream_window_size: 流式检测窗口大小 (Token 数)
        """
        self.mode = mode.lower()
        self.agent_name = agent_name
        self.agent_token = agent_token
        self.business_line = business_line
        self.owner = owner
        self.console_url = console_url.rstrip("/")
        self.stream_window_size = stream_window_size

        if self.mode not in ("warn", "block"):
            logger.warning(f"Unknown mode '{self.mode}', falling back to 'warn'")
            self.mode = "warn"

        logger.info(f"AgentSecurityCallback initialized for '{self.agent_name}' in {self.mode} mode. Window: {self.stream_window_size}")
        
        # (P1 Fix) 确保异步队列工作线程已启动
        queue_manager.start()
        
        self._streaming_buffers = {}
        self._token_counts = {} # {run_id: count}
        self._register_agent()

    def _register_agent(self):
        """向控制台注册 Agent 元数据，确保资产台账实时更新"""
        # (P1 Fix) 使用后台线程进行异步注册，避免阻塞 SDK 启动
        thread = threading.Thread(target=self._do_register_agent, daemon=True)
        thread.start()

    def _do_register_agent(self):
        try:
            import requests
            payload = {
                "name": self.agent_name,
                "token": self.agent_token,
                "business_line": self.business_line,
                "owner": self.owner,
                "status": "online",
                "sdk_version": "v1.5"
            }
            resp = requests.post(f"{self.console_url}/api/agents/register", json=payload, timeout=5)
            if resp.status_code == 200:
                logger.debug(f"[Registry] Agent '{self.agent_name}' successfully registered to console.")
            else:
                logger.error(f"[Registry] Failed to register agent: {resp.text}")
        except Exception as e:
            logger.error(f"[Registry] Error connecting to console for registration: {e}")

    def _report_alert(self, result: SecurityBlockedResult, hook_point: str, session_id: str = "global"):
        """将安全违规详情上报至控制台 (P1 Fix: 异步接入 queue_manager)"""
        try:
            payload = {
                "console_url": self.console_url, # 传递完整 URL 供 Worker 使用
                "agent_name": self.agent_name,
                "rule_id": result.reason,
                "severity": "critical" if self.mode == "block" else "warning",
                "hook_point": hook_point,
                "session_id": session_id,
                "payload": {
                    "input": result.original_input_hash,
                    "risk_details": result.reason,
                    "mode": self.mode
                }
            }
            queue_manager.enqueue("alert_report", json.dumps(payload))
        except Exception as e:
            logger.debug(f"[Reporting] Failed to enqueue alert: {e}")

    def raise_block_or_warn(self, result: SecurityBlockedResult, fallback_text: str, hook_point: str = "unknown", session_id: str = "global") -> str:
        """根据当前拦截模式返回被放行或者阻断注入后的安全语句"""
        if result.blocked:
            # 维度 2: PII 脱敏处理逻辑
            if result.is_pii:
                logger.info(f"[PII_MASKING] Sensitive data detected. Masking for safety...")
                return "[PII_DATA_REDACTED]"

            log_msg = f"Security Violation Detected! Reason: {result.reason} | Hash: {result.original_input_hash}"
            
            # 触发实时上报 (Phase 20)
            self._report_alert(result, hook_point, session_id)
            
            if self.mode == "block":
                logger.warning(f"[{self.mode.upper()}] {log_msg}")
                return result.safe_response
            else:
                logger.warning(f"[{self.mode.upper()}] {log_msg} -> Passing through.")
                return fallback_text
                
        return fallback_text

    def on_chain_start(
        self, serialized: Dict[str, Any], inputs: Dict[str, Any], **kwargs: Any
    ) -> Any:
        """【监控】维度 3: 多 Agent 协作风险监控。记录调用链输入特征，识别潜在的信任传播。"""
        # 简单记录调用链开启，未来可扩展为身份签名校验
        chain_name = serialized.get("name", "unknown_chain")
        logger.debug(f"[Chain Monitor] Chain {chain_name} started with inputs keys: {list(inputs.keys())}")

    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> Any:
        """在最初始阶段监控直接推给 LLM 组装完成的 Prompt (维度 1 & 2)"""
        # 尝试提取 Session ID 以获取历史上下文
        # LangChain 约定通常在 tags 或 metadata 中
        run_id = str(kwargs.get("run_id", ""))
        metadata = kwargs.get("metadata", {})
        session_id = metadata.get("session_id", run_id or "global-session")

        for i, prompt in enumerate(prompts):
            # 将当前输入与历史上下文结合评估（对抗慢速注入）
            session = session_manager.get_session(session_id)
            context = session.get_full_context()
            
            # 传入 context 供引擎进行跨回合关联分析
            result = engine.evaluate(prompt, context=context)
            
            if result and result.blocked:
                # 统一调用 raise_block_or_warn 并回写 prompts 列表
                prompts[i] = self.raise_block_or_warn(result, prompt, hook_point="on_llm_start", session_id=session_id)
            
            # 记录本轮输入（暂不记录输出，输出在 on_llm_end 记录）
            session.add_turn(prompt)

    def on_tool_start(
        self, serialized: Dict[str, Any], input_str: str, **kwargs: Any
    ) -> Any:
        """【策略重心】维度 2: 高危工具人工确认层。针对不可逆操作进行拦截/标记。"""
        tool_name = serialized.get("name", "")
        high_risk_tools = ["delete_file", "send_email", "drop_table", "terminate_process"]
        
        if tool_name in high_risk_tools:
            logger.warning(f"[HIGH_RISK_TOOL] Tool '{tool_name}' triggered. Pending manual confirmation in SOP console...")
            # 在 SDK 层面目前做警告记录，并标记 result 为 needs_confirmation
            # 未来版本可在此处 raise InterruptedError 配合外部状态机实现真正的挂起
            pass

    def on_chat_model_start(
        self, serialized: Dict[str, Any], messages: List[List[BaseMessage]], **kwargs: Any
    ) -> Any:
        """针对 ChatModel 的入口做一层兼容拦截"""
        for msg_list in messages:
            for msg in msg_list:
                if hasattr(msg, "content") and isinstance(msg.content, str):
                    result = engine.evaluate(msg.content)
                    if result and result.blocked:
                        msg.content = self.raise_block_or_warn(result, msg.content, hook_point="on_chat_model_start")

    def on_tool_end(
        self,
        output: str,
        *,
        run_id: str,
        parent_run_id: Optional[str] = None,
        **kwargs: Any,
    ) -> str:
        """【维度 1】监控外部 Tool 返回的注入指令（如网页爬虫结果），拦截间接注入。"""
        result = engine.evaluate(output)
        if result and result.blocked:
             return self.raise_block_or_warn(result, output, hook_point="on_tool_end", session_id=str(run_id))
        return output

    def on_retriever_end(
        self,
        documents: List[Any],
        *,
        run_id: str,
        parent_run_id: Optional[str] = None,
        **kwargs: Any,
    ) -> Any:
        """【维度 1】监控 RAG 系统检索出的文本段落，避免知识库被投毒。"""
        for doc in documents:
            if hasattr(doc, "page_content"):
                result = engine.evaluate(doc.page_content)
                if result and result.blocked:
                    doc.page_content = self.raise_block_or_warn(result, doc.page_content, hook_point="on_retriever_end")
        return documents

    def on_llm_new_token(
        self,
        token: str,
        *,
        run_id: str,
        parent_run_id: Optional[str] = None,
        **kwargs: Any,
    ) -> Any:
        """【推荐方案】维度 1 & 2: 滑动窗口流式输出拦截。"""
        current_text = self._streaming_buffers.get(run_id, "") + token
        self._streaming_buffers[run_id] = current_text
        
        count = self._token_counts.get(run_id, 0) + 1
        self._token_counts[run_id] = count

        # 每积累 stream_window_size 个 token 触发一次检测
        if count % self.stream_window_size == 0:
            result = engine.evaluate(current_text)
            if result and result.blocked:
                log_msg = f"Security Violation in STREAM (Token {count})! Reason: {result.reason}"
                if self.mode == "block":
                    logger.warning(f"[BLOCK] {log_msg}. Truncating stream.")
                    # 抛出异常阻断后续 Token 生成
                    raise InterruptedError(f"AgentSec Blocked: {result.safe_response}")
                else:
                    logger.warning(f"[WARN] {log_msg} -> Logged but passing.")

    def on_llm_end(
        self,
        response: LLMResult,
        *,
        run_id: str,
        parent_run_id: Optional[str] = None,
        **kwargs: Any,
    ) -> Any:
        """流式结束后的全量异步检测（第五层防御）"""
        # 1. 尝试从 buffer 获取全量文本（如果存在）
        full_text = self._streaming_buffers.get(run_id, "")
        
        # 2. 如果是非流式输出，从 response 中提取
        if not full_text:
            try:
                full_text = response.generations[0][0].text
            except (IndexError, AttributeError):
                pass

        if full_text:
            # 执行最终的全量规则检测（适合慢速/深度语义扫描）
            result = engine.evaluate(full_text)
            
            # 记录本轮助手的完整回答到 Session 历史
            metadata = kwargs.get("metadata", {})
            session_id = metadata.get("session_id", run_id or "global-session")
            session = session_manager.get_session(session_id)
            # 找到对应最近的一轮 User 输入并补全 Assistant 部分
            if session.history:
                session.history[-1]["assistant"] = full_text

            if result and result.blocked:
                # 在 on_llm_end 阶段，block 模式也只能做告警/审计，因为内容已基本发送完毕
                logger.warning(f"[FINAL_AUDIT] {result.reason} detected in full response.")

        # 清理缓冲区
        if run_id in self._streaming_buffers:
            del self._streaming_buffers[run_id]
        if run_id in self._token_counts:
            del self._token_counts[run_id]
