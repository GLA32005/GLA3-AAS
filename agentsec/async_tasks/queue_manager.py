import queue
import threading
import logging
from typing import Optional, Dict, Any, Callable

logger = logging.getLogger("agentsec")

class AsyncQueueManager:
    """
    进程内的异步检测队列。
    负责将需要交给离线模型（ONNX or Cloud API）进行重量级计算的安全事件暂时存放，
    并在后台由 Worker 线程慢慢消费，确保完全不阻塞业务主干流程。
    """
    
    def __init__(self, maxsize: int = 1000):
        # 设定最大容量以防止极端情况下 OOM
        self._queue = queue.Queue(maxsize=maxsize)
        self._bg_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._handler: Optional[Callable[[Dict[str, Any]], None]] = None

    def set_handler(self, handler_func: Callable[[Dict[str, Any]], None]):
        """挂载实际消费队列中元素的推理功能（例如 ONNX runner）"""
        self._handler = handler_func
        
    def enqueue(self, event_type: str, payload: str, context: Optional[Dict[str, Any]] = None):
        """主进程抛送事件入口"""
        if self._stop_event.is_set() or self._bg_thread is None:
            return
            
        task = {
            "type": event_type,
            "payload": payload,
            "context": context or {}
        }
        try:
            # 不采用堵塞模式，如果队满直接遗弃该条离线分析事件以保可用性
            self._queue.put_nowait(task)
        except queue.Full:
            logger.debug("Async queue is full, dropping offline analysis task.")

    def _worker_loop(self):
        while not self._stop_event.is_set():
            try:
                # 设定阻塞时间，可以使得停止信号得以被响应
                task = self._queue.get(timeout=1.0)
                if self._handler:
                    try:
                        self._handler(task)
                    except Exception as e:
                        logger.error(f"Error executing offline handler: {str(e)}")
                self._queue.task_done()
            except queue.Empty:
                continue
                
    def start(self):
        if self._bg_thread is None or not self._bg_thread.is_alive():
            self._stop_event.clear()
            self._bg_thread = threading.Thread(
                target=self._worker_loop, 
                name="AgentSecAsyncWorker", 
                daemon=True
            )
            self._bg_thread.start()
            logger.info("Agentsec async worker thread started.")
            
    def stop(self):
        if self._bg_thread and self._bg_thread.is_alive():
            self._stop_event.set()
            self._bg_thread.join(timeout=2)
            logger.info("Agentsec async worker thread stopped.")

# 全局单例异步队列
queue_manager = AsyncQueueManager()
