import asyncio
import aiohttp
import random
import time
import uuid

CONSOLE_URL = "http://localhost:8000"
NUM_AGENTS = 50
ALERTS_PER_AGENT = 20

async def simulate_agent(agent_id: int):
    agent_name = f"stress-test-agent-{agent_id}"
    async with aiohttp.ClientSession() as session:
        # 1. 注册 Agent
        reg_payload = {
            "name": agent_name,
            "business_line": "StressTest",
            "owner": "Tester",
            "framework": "LangChain"
        }
        await session.post(f"{CONSOLE_URL}/api/agents/register", json=reg_payload)
        
        # 2. 并发上报告警
        for i in range(ALERTS_PER_AGENT):
            severity = random.choice(["critical", "warning", "info"])
            alert_payload = {
                "agent_name": agent_name,
                "rule_id": f"STRESS_RULE_{random.randint(1, 100)}",
                "severity": severity,
                "hook_point": random.choice(["on_llm_start", "on_tool_end", "on_retriever_end"]),
                "session_id": f"sess-{uuid.uuid4().hex[:8]}",
                "payload": {"text": "dummy attack payload " * 5}
            }
            try:
                async with session.post(f"{CONSOLE_URL}/api/alerts/report", json=alert_payload) as resp:
                    if resp.status == 200:
                        pass # logger.info(f"Agent {agent_id} reported alert {i}")
            except Exception as e:
                print(f"Error for agent {agent_id}: {e}")
            
            await asyncio.sleep(random.uniform(0.1, 0.5))

async def main():
    print(f"🚀 Starting Load Test: {NUM_AGENTS} agents, {ALERTS_PER_AGENT} alerts each...")
    start_time = time.time()
    
    tasks = [simulate_agent(i) for i in range(NUM_AGENTS)]
    await asyncio.gather(*tasks)
    
    duration = time.time() - start_time
    total_alerts = NUM_AGENTS * ALERTS_PER_AGENT
    print(f"🏁 Load Test Finished in {duration:.2f}s")
    print(f"📊 Total Alerts Sent: {total_alerts} ({total_alerts/duration:.2f} alerts/sec)")

if __name__ == "__main__":
    asyncio.run(main())
