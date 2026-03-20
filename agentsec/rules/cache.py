import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional

from agentsec.config import config

logger = logging.getLogger("agentsec")

class RuleCacheManager:
    """
    负责规则文件的本地缓存读写。
    保障 SDK 能够在离线模式、断网断开时兜底加载规则集。
    缓存位置默认为 `~/.agentsec/rules_cache/rules.json`
    """
    
    def __init__(self):
        self.cache_dir = config.rules_cache_dir
        self.rules_file = self.cache_dir / "rules.json"
        self.meta_file = self.cache_dir / "meta.json"
        
    def load_rules(self) -> Optional[Dict[str, Any]]:
        """从本地磁盘加载缓存的规则内容"""
        if not self.rules_file.exists():
            logger.debug(f"Rule cache file not found at {self.rules_file}")
            return None
            
        try:
            with open(self.rules_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load cached rules: {str(e)}")
            return None
            
    def load_metadata(self) -> Dict[str, Any]:
        """获取本地规则包的版本与元数据信息"""
        if not self.meta_file.exists():
            return {"version": "0.0.0"}
            
        try:
            with open(self.meta_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load rules meta: {str(e)}")
            return {"version": "0.0.0"}
            
    def save_rules(self, version: str, rules_payload: Dict[str, Any]) -> bool:
        """
        原子化保存下载的差量或完整规则到本地，防并发写入引发错乱。
        写入结束后同步更新 meta.json 的版本号。
        """
        tmp_rules = self.rules_file.with_suffix(".tmp")
        tmp_meta = self.meta_file.with_suffix(".tmp")
        
        try:
            # 存规则内容
            with open(tmp_rules, "w", encoding="utf-8") as f:
                json.dump(rules_payload, f, ensure_ascii=False, indent=2)
                
            # 存元数据
            meta_payload = {"version": version}
            with open(tmp_meta, "w", encoding="utf-8") as f:
                json.dump(meta_payload, f, ensure_ascii=False, indent=2)
                
            # 原子替换
            os.replace(tmp_rules, self.rules_file)
            os.replace(tmp_meta, self.meta_file)
            
            logger.info(f"Successfully cached rules version {version}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save rules to cache: {str(e)}")
            if tmp_rules.exists():
                tmp_rules.unlink()
            if tmp_meta.exists():
                tmp_meta.unlink()
            return False

# 全局单例
cache_manager = RuleCacheManager()
