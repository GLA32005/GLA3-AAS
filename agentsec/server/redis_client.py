import os
from typing import Optional
import redis.asyncio as redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

class RedisClient:
    def __init__(self):
        self.client = redis.from_url(REDIS_URL, decode_responses=True)

    async def get_count(self, key: str) -> int:
        val = await self.client.get(key)
        return int(val) if val else 0

    async def incr_count(self, key: str):
        await self.client.incr(key)

    async def push_task(self, queue: str, data: str):
        await self.client.lpush(queue, data)

    async def pop_task(self, queue: str, timeout: int = 0):
        """阻塞式弹出任务 (pop from tail)"""
        return await self.client.brpop(queue, timeout=timeout)

    async def set_session(self, token: str, data: dict, ttl_seconds: int = 86400):
        import json
        await self.client.setex(f"session:{token}", ttl_seconds, json.dumps(data))

    async def get_session(self, token: str) -> Optional[dict]:
        import json
        val = await self.client.get(f"session:{token}")
        return json.loads(val) if val else None

    async def delete_session(self, token: str):
        await self.client.delete(f"session:{token}")

redis_client = RedisClient()
