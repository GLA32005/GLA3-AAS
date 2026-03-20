import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

# 从环境变量获取数据库连接串，默认使用 Docker 内的服务名
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+asyncpg://agentsec:agentsec_pwd@localhost:5432/agentsec"
)

# 创建异步引擎
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

# 异步会话工厂
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

# FastAPI 依赖注入
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
