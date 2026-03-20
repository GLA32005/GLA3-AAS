import os
import json
import time
import threading
import logging
import requests
from typing import Optional, Dict, Any

from agentsec.config import config
from agentsec.rules.cache import cache_manager

logger = logging.getLogger("agentsec")

class RuleUpdater:
    """
    负责启动后台守护进程，定期从 AGENTSEC_RULE_SERVER 获取最新规则版本，
    支持网络断开条件下的本地配置兜底 (Fallback)。
    """
    
    def __init__(self):
        self._bg_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._current_version = "0.0.0"
        
    def _fetch_remote_rules(self) -> Optional[Dict[str, Any]]:
        """从远端获取最新的检测规则引擎配置包"""
        try:
            req_url = config.rule_server_url
            meta_res = requests.get(f"{req_url}/meta", timeout=5)
            if meta_res.status_code != 200:
                logger.warning(f"Failed to fetch rule meta: HTTP {meta_res.status_code}")
                return None
                
            remote_meta = meta_res.json()
            remote_version = remote_meta.get("version", "0.0.0")
            
            # 若版本无更新，跳过拉取
            if remote_version == self._current_version:
                logger.debug("Rules are up to date.")
                return None
                
            # 拉取详细规则内容
            rules_res = requests.get(f"{req_url}/payload?version={remote_version}", timeout=10)
            if rules_res.status_code == 200:
                rules_payload = rules_res.json()
                # 落盘缓存
                if cache_manager.save_rules(remote_version, rules_payload):
                    self._current_version = remote_version
                return rules_payload
            else:
                logger.warning(f"Failed to download payload: HTTP {rules_res.status_code}")
                
        except requests.RequestException as e:
            logger.warning(f"Network error while fetching rules: {str(e)}")
            
        return None
        
    def _update_loop(self):
        """后台轮询循环"""
        while not self._stop_event.is_set():
            logger.info(f"Syncing checking rules from {config.rule_server_url} ...")
            self._fetch_remote_rules()
            
            # 休眠至下一个同步周期，支持中途安全退出
            self._stop_event.wait(config.rule_sync_interval_seconds)
            
    def start(self):
        """主入口调用，启动同步更新逻辑"""
        # 加载本地旧缓存做版本基准
        local_meta = cache_manager.load_metadata()
        self._current_version = local_meta.get("version", "0.0.0")
        
        # 离线模式下不启动后台网络同步
        if config.offline_mode:
            logger.info("AgentSec running in offline mode. Rule updater thread disabled.")
            return
            
        if self._bg_thread is None or not self._bg_thread.is_alive():
            self._stop_event.clear()
            self._bg_thread = threading.Thread(
                target=self._update_loop, 
                name="AgentSecRuleUpdater", 
                daemon=True
            )
            self._bg_thread.start()
            logger.info("Rule updater background thread started.")
            
    def stop(self):
        """平滑停止后台更新"""
        if self._bg_thread and self._bg_thread.is_alive():
            self._stop_event.set()
            self._bg_thread.join(timeout=2)
            logger.info("Rule updater background thread stopped.")

# 全局单例
updater = RuleUpdater()
