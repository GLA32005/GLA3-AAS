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

# 安装 Docker 引擎
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

## 2. 代码部署

1. **克隆仓库**：
   ```bash
   git clone https://github.com/GLA32005/GLA3-AAS.git
   cd GLA3-AAS
   ```

2. **配置环境变量**：
   复制环境模板并根据实际情况修改：
   ```bash
   cp .env.example .env
   ```
   **关键生产配置**：
   - `SECRET_KEY`: 用于 JWT 签名的密钥，**请务必修改为强随机字符串**。
   - `DATABASE_URL`: 数据库连接串（Docker 部署保持默认即可）。
   - `REDIS_URL`: Redis 连接串（Docker 部署保持默认即可）。

3. **启动服务**：
   Docker Compose 会自动应用 `.env` 变量，并启动 Gunicorn 生产服务器：
   ```bash
   docker compose up -d --build
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

## 4. 生产环境进阶 (Production Hardening)

### 通信加密 (HTTPS/SSL)

强烈建议在生产环境中使用 Nginx 作为反向代理，并配置 SSL 证书：

```nginx
# Nginx 配置示例 (/etc/nginx/sites-available/agentsec)
server {
    listen 443 ssl;
    server_name console.agentsec.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://localhost:3000; # Frontend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8000; # Backend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 日志滚动 (Log Rotation)

为了防止审计日志撑爆磁盘，请在宿主机配置 Docker 日志驱动：

```yaml
# docker-compose.yml 建议添加
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "3"
```

## 5. 常见问题排查与验收

---
如对部署有疑问，请参考 [walkthrough.md](walkthrough.md) 中的架构说明。🛡️🚀
