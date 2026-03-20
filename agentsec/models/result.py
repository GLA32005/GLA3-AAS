from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib
import json

@dataclass
class SecurityBlockedResult:
    """
    在线（规则层）和离线（模型层）检测命中时返回的安全结果对象。
    默认不会向外抛出 Exception 造成崩溃，只返回此数据载荷。
    """
    blocked: bool
    reason: str
    safe_response: str
    original_input_hash: str
    alert_sent: bool = False
    confidence: float = 0.0
    rule_id: str = "unknown"
    is_pii: bool = False
    needs_confirmation: bool = False
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.utcnow().isoformat() + "Z"

    @classmethod
    def create_safe(cls, input_text: str, reason: str, confidence: float = 1.0, is_pii: bool = False, needs_confirmation: bool = False, rule_id: str = "unknown") -> "SecurityBlockedResult":
        """工厂方法：快速创建一组包含特征 Hash 与打标类型的命中响应"""
        text_hash = hashlib.sha256(input_text.encode("utf-8")).hexdigest()
        return cls(
            blocked=True,
            reason=reason,
            safe_response="I cannot process this request as it appears to contain instructions that conflict with the security policy.",
            original_input_hash=text_hash,
            alert_sent=False,
            confidence=confidence,
            rule_id=rule_id,
            is_pii=is_pii,
            needs_confirmation=needs_confirmation
        )

    @classmethod
    def create_pass(cls, input_text: str) -> "SecurityBlockedResult":
        """工厂方法：未命中任何规则时的放行响应"""
        text_hash = hashlib.sha256(input_text.encode("utf-8")).hexdigest()
        return cls(
            blocked=False,
            reason="passed",
            safe_response="",
            original_input_hash=text_hash,
            alert_sent=False,
            confidence=0.0,
            rule_id="none"
        )
