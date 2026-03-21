#!/bin/bash
# AgentSec Local Development & Demo Launcher
# 🛡️ 自动化启动脚本：一键拉起本地开发环境 (DB + Redis + API)

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛡️ AgentSec | 正在初始化本地攻防演练环境...${NC}"

# 1. 检查 Docker 状态
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ 错误: Docker 未启动。请先打开 Docker Desktop。${NC}"
    exit 1
fi

# 2. 拉起基础架构 (PostgreSQL & Redis)
echo -e "${GREEN}📦 [1/4] 正在拉起数据库与缓存容器...${NC}"
docker-compose up -d db redis

# 3. 检查并补全 Python 依赖
echo -e "${GREEN}🐍 [2/4] 正在校验 Python 运行环境...${NC}"
if [ -f "requirements.txt" ]; then
    python3 -m pip install -r requirements.txt > /dev/null
fi

# 4. 执行数据库迁移 (Alembic)
echo -e "${GREEN}🗄️ [3/4] 正在同步数据库 Schema...${NC}"
export PYTHONPATH=$PYTHONPATH:.
alembic upgrade head > /dev/null 2>&1

# 5. 启动后端 API 服务
echo -e "${GREEN}🚀 [4/4] 正在接通安全大脑 (Backend API)...${NC}"
echo -e "${YELLOW}提示: 后端将运行在 http://127.0.0.1:8000${NC}"
echo -e "${YELLOW}提示: 前端控制台请在另一终端运行 'npm run dev'${NC}"

# 使用 nohup 后台运行 backend，或者直接运行 (建议直接运行以便观察日志)
# 为了演示方便，我们这里使用 uvicorn 启动
python3 -m uvicorn agentsec.server.app:app --host 0.0.0.0 --port 8000 --reload
