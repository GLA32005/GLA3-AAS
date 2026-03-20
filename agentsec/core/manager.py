import collections
from typing import List, Dict, Optional

class SessionState:
    """存储单个会话的上下文信息"""
    def __init__(self, session_id: str, max_history: int = 5):
        self.session_id = session_id
        self.history: collections.deque = collections.deque(maxlen=max_history)
        self.metadata: Dict = {}

    def add_turn(self, user_input: str, assistant_output: str = ""):
        self.history.append({
            "user": user_input,
            "assistant": assistant_output
        })

    def get_full_context(self) -> str:
        """拼接成便于规则引擎分析的文本流"""
        context = []
        for turn in self.history:
            context.append(f"User: {turn['user']}")
            if turn['assistant']:
                context.append(f"AI: {turn['assistant']}")
        return "\n".join(context)

class SessionManager:
    """
    LRU 缓存管理所有活跃的 Session。
    确保内存消耗在可控范围内，自动清理过期会话。
    """
    def __init__(self, max_sessions: int = 1000):
        self.sessions: Dict[str, SessionState] = {}
        self.max_sessions = max_sessions

    def get_session(self, session_id: str) -> SessionState:
        if session_id not in self.sessions:
            if len(self.sessions) >= self.max_sessions:
                # 简单清理策略：由于 Dict 在 Python 3.7+ 保序，pop(0) 接近 FIFO
                # 生产环境建议使用 collections.OrderedDict
                first_key = next(iter(self.sessions))
                del self.sessions[first_key]
            self.sessions[session_id] = SessionState(session_id)
        return self.sessions[session_id]

    def record_interaction(self, session_id: str, user_input: str, assistant_output: str = ""):
        session = self.get_session(session_id)
        session.add_turn(user_input, assistant_output)

# 全局单例管理器
session_manager = SessionManager()
