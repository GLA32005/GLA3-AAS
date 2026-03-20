# AgentSec 腾讯云部署指南

本文档提供在腾讯云（Tencent Cloud）CVM 服务器（推荐 Ubuntu 22.04 LTS）上快速部署 AgentSec 平台的说明。

## 1. 环境准备

### 推荐配置
- **CPU/内存**: 2核 / 4GB RAM (最低 1核 / 2GB)
- **操作系统**: Ubuntu 22.04 LTS
- **磁盘**: 40GB+ SSD

### 安装 Docker
在服务器上执行以下脚本安装 Docker 和 Docker Compose：

```bash
# 更新并安装基础依赖
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker 引擎
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

## 2. 代码部署

1. **克隆仓库**：
   ```bash
   git clone https://github.com/GLA32005/GLA3-AAS.git
   cd GLA3-AAS
   ```

2. **配置环境变量**：
   创建并编辑 `.env` 文件：
   ```bash
   cp .env.example .env  # 如果有 example 文件的话，否则直接创建
   ```
   **关键配置**：
   - `DB_HOST`: 保持 `db` (Docker 内部域名)
   - `REDIS_HOST`: 保持 `redis`

3. **启动服务**：
   ```bash
   docker compose up -d
   ```

## 3. 云主机网络配置 (安全组)

您必须在腾讯云控制台的**安全组**中开放以下端口：

| 端口 | 说明 |
| --- | --- |
| `3000` | Web 控制台 (Frontend) |
| `8000` | 后端 API (Backend) |

> [!TIP]
> 部署成功后，通过 `http://服务器公网IP:3000` 访问控制台。
> 如果无法加载数据，请检查您的浏览器是否能连通 `http://服务器公网IP:8000`。

## 4. 常见问题排查

- **容器状态检查**：`docker compose ps`
- **查看日志**：`docker compose logs -f backend`
- **手动迁移数据库**（如果自动迁移失败）：
  ```bash
  docker compose exec backend alembic upgrade head
  ```

---
如有任何安全漏洞，请通过 [SECURITY.md](SECURITY.md) 中的方式联系我们。
