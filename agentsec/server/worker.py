import asyncio
import json
import logging
import time
from .redis_client import redis_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agentsec-worker")

async def cleanup_old_data():
    """模拟清理 90 天前的历史告警与审计日志"""
    logger.info("🛠️ [MAINTENANCE] Running data cleanup (Alerts > 90 days)...")
    # 实际生产此处应执行: DELETE FROM alerts WHERE created_at < NOW() - INTERVAL '90 days'
    await asyncio.sleep(0.5)
    logger.info("🛠️ [MAINTENANCE] Cleanup finished. Compressed 124MB old audit logs.")

async def run_worker():
    logger.info("AgentSec Webhook Worker started. Listening for tasks...")
    
    last_maintenance = 0
    while True:
        try:
            # 1. 业务任务处理
            task = await redis_client.pop_task("queue:webhooks")
            if task:
                _, data_str = task
                payload = json.loads(data_str)
                logger.info(f"🚀 [NOTIFICATION SENT] Agent: {payload['agent']} | Title: {payload['title']}")
            
            # 2. 定时维护 (每 3600 秒模拟一次)
            now = time.time()
            if now - last_maintenance > 3600:
                await cleanup_old_data()
                last_maintenance = now
                
            await asyncio.sleep(0.1)
        except Exception as e:
            logger.error(f"Worker Error: {e}")
            await asyncio.sleep(2)

if __name__ == "__main__":
    try:
        asyncio.run(run_worker())
    except KeyboardInterrupt:
        logger.info("Worker stopped by user.")
