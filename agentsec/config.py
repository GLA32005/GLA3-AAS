import os
import logging
from pathlib import Path

# 初始化内置 Logger
logger = logging.getLogger("agentsec")
logger.setLevel(os.getenv("AGENTSEC_LOG_LEVEL", "WARNING").upper())
if not logger.handlers:
    ch = logging.StreamHandler()
    formatter = logging.Formatter('[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    ch.setFormatter(formatter)
    logger.addHandler(ch)

class AgentSecConfig:
    """
    配置管理器，负责加载并缓存 SDK 所需的所有环境变量设置。
    符合 PRD 的“零配置”原则，所有配置均有合理默认值并支持覆盖。
    """
    
    def __init__(self):
        # 1. 网络与离线模式支持
        self.offline_mode = self._parse_bool(os.getenv("AGENTSEC_OFFLINE", "false"))
        
        # 2. 从环境变量读取私有规则服务器地址；若未配置则使用默认开源服务器（占位符）
        self.rule_server_url = os.getenv(
            "AGENTSEC_RULE_SERVER", 
            "https://rules.agentsec.io/api/v1/rules"
        )
        
        # 3. 规则后台轮询时间间隔，默认 60 分钟（即 3600 秒）
        self.rule_sync_interval_seconds = int(os.getenv("AGENTSEC_RULE_SYNC_INTERVAL", "3600"))
        
        # 4. 默认数据及缓存存储位置（用于 rules_cache 等持久化文件保存）
        home_dir = Path.home()
        self.data_dir = Path(os.getenv("AGENTSEC_DATA_DIR", home_dir / ".agentsec"))
        
        # 定义子目录缓存位置
        self.rules_cache_dir = self.data_dir / "rules_cache"
        self._ensure_directories()
        
    def _parse_bool(self, val: str) -> bool:
        return val.lower() in ("true", "1", "yes", "on")

    def _ensure_directories(self):
        """确保 SDK 运行时所需的本地缓存目录存在"""
        if not self.rules_cache_dir.exists():
            try:
                self.rules_cache_dir.mkdir(parents=True, exist_ok=True)
            except Exception as e:
                logger.error(f"Failed to create cache directory at {self.rules_cache_dir}: {e}")

# 全局单例配置实例
config = AgentSecConfig()
