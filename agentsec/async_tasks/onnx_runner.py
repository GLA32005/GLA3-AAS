import logging
from typing import Dict, Any

from agentsec.async_tasks.queue_manager import queue_manager
from agentsec.models.result import SecurityBlockedResult

logger = logging.getLogger("agentsec")

class OnnxModelRunner:
    """
    处理模型深层离线推理验证（当前为装嵌 ONNX Runtime 的 Mock）。
    主要用于将 RAG 知识库大段落或者工具庞大返回值进行更精确的语义鉴伪扫描。
    """
    
    def __init__(self):
        self._is_loaded = False
        
    def _load_model(self):
        """(延期加载) 确保只在发生首次分析时由于 ONNX 耗时过长不拖慢主进程"""
        if self._is_loaded:
            return
            
        logger.info("Initializing embedded ONNX defense model checkpoint...")
        # TODO: import onnxruntime && load deBerta tiny model
        # ...
        self._is_loaded = True
        
    def evaluate_offline(self, task: Dict[str, Any]):
        """被 AsyncQueueManager 的后台 Worker 调用"""
        task_type = task.get("type")
        
        if task_type == "alert_report":
            self._handle_alert_report(task)
            return
        elif task_type == "telemetry_report":
            self._handle_telemetry_report(task)
            return

        self._load_model()
        payload_text = task.get("payload", "")
        # TODO: 将 text 转为 tokenize tensor 然后进行 forward
        logger.debug(f"[Offline Model Runner] Processed payload of length {len(payload_text)}")

    def _handle_telemetry_report(self, task: Dict[str, Any]):
        """后台异步处理常规遥测数据上报 (New in 3.0)"""
        try:
            import requests
            import json
            data = json.loads(task.get("payload", "{}"))
            console_url = data.pop("console_url", "http://127.0.0.1:8000")
            
            # telemetry 数据包含 agent_name, event_type, payload
            resp = requests.post(f"{console_url}/api/agents/telemetry", json=data, timeout=5)
            if resp.status_code == 200:
                logger.debug(f"[Async Telemetry] Telemetry synced to console for {data.get('agent_name')}.")
            else:
                logger.error(f"[Async Telemetry] Failed to sync telemetry: {resp.text}")
        except Exception as e:
            logger.error(f"[Async Telemetry] Error during background telemetry sync: {e}")

    def _handle_alert_report(self, task: Dict[str, Any]):
        """后台异步处理告警上报到控制台 (P1 Fix)"""
        try:
            import requests
            import json
            data = json.loads(task.get("payload", "{}"))
            console_url = data.pop("console_url", "http://127.0.0.1:8000")
            
            resp = requests.post(f"{console_url}/api/alerts/report", json=data, timeout=5)
            if resp.status_code == 200:
                logger.debug(f"[Async Reporting] Alert successfully synced to console.")
            else:
                logger.error(f"[Async Reporting] Failed to sync alert: {resp.text}")
        except Exception as e:
            logger.error(f"[Async Reporting] Error during background alert sync: {e}")

# 全局单例
onnx_runner = OnnxModelRunner()

# 绑定排队消费者角色
queue_manager.set_handler(onnx_runner.evaluate_offline)
