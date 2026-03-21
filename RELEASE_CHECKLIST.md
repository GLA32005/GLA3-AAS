# AgentSec 正式发布验收清单 (Release Checklist) 🛡️✅

本清单用于指导从 **开发/Demo 模式** 向 **正式生产环境 (Normal Release)** 切换时的最后检查。

## 1. 安全加固 (Security Hardening) 🔒
- [ ] **密钥彻底置换**：确保 `.env` 中的 `SECRET_KEY` 已更换为 64 位以上随机字符串。
- [ ] **默认账户清理**：首次登录后立即修改 `admin` 初始密码，或在初始化脚本中剔除 `admin123` 逻辑。
- [ ] **通信加密 (HTTPS)**：部署 Nginx 反向代理并配置 SSL 证书，禁止通过 `http` 明文访问控制台。
- [ ] **网络隔离策略**：确保 DB (5432) 与 Redis (6379) 端口不在云主机安全组对外开放，仅限 Docker 内部通讯。

## 2. 运维与观测 (Ops & Observability) 📊
- [ ] **日志滚动与持久化**：配置 Docker 日志驱动或 `logrotate`，防止 `/var/lib/docker/containers` 被审计日志撑爆。
- [ ] **健康检查 (Health Check)**：在 `docker-compose.yml` 中补全容器存活探针逻辑。
- [ ] **监控告警接入**：接入外部监控（如 Prometheus + Grafana 或腾讯云云监控），对 API 5xx 状态码及 CPU 飙升进行实时告警。
- [ ] **数据库异地备份**：实装 `pg_dump` 定时任务，确保审计数据具备灾难恢复能力。

## 3. 性能调优 (Performance & Scaling) 🚀
- [ ] **并发数优化**：根据 CPU 核心数调整 Gunicorn 的 `workers` 数量（推荐 1 + 2 * Cores）。
- [ ] **数据库连接池**：在 `database.py` 中优化 `pool_size` 与 `max_overflow` 参数，适配高并发安全回流。
- [ ] **前端构建构建优化**：确保发布前执行 `npm run build` 生成生产混淆包，而非开发版代码。

## 4. 文档与合规 (Docs & Compliance) 📄
- [ ] **版本标签 (Tagging)**：在 Git 中标记正式 Release Tag (如 `v1.0.0`)。
- [ ] **开源许可核对**：确保 `LICENSE` 文件已放入根目录，并核对第三方库版权说明。
- [ ] **一键安装自检**：验证 `install.sh` 在干净机器上的全流程拉取与安装通畅性。

---
> 离「正常发布」仅剩最后的环境配置转换。 AgentSec 治理平台已在代码层面做好战斗准备。
