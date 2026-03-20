import json
import logging
import requests
from typing import Dict, Any, Optional

logger = logging.getLogger("agentsec")

def send_alert_webhook(url: str, alert_data: Dict[str, Any]) -> bool:
    """简单的告警触达封装，用于向企业管理中台传递 Agent 运行防线命中记录"""
    if not url:
        return False
        
    try:
        res = requests.post(
            url,
            json=alert_data,
            headers={"Content-Type": "application/json"},
            timeout=3
        )
        if res.status_code in (200, 201, 202, 204):
            logger.info("Security alert webhook fired successfully.")
            return True
        else:
            logger.warning(f"Webhook failed with status {res.status_code}")
    except requests.RequestException as e:
        logger.error(f"Network error while sending webhook: {e}")
        
    return False

# 提供全局简单的 Hook 推送服务
def fire_alert(result: "SecurityBlockedResult", context: Optional[Dict] = None):
    # TODO: 从 config 获取全局报警 URL
    pass

