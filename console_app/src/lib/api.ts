/**
 * AgentSec Console API 配置文件
 * 
 * 在本地开发时，如果没有设置 VITE_API_URL，默认指向 localhost:8000。
 * 在云端部署时，请通过环境变量 VITE_API_URL 指定后端地址。
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const API_ENDPOINTS = {
  DASHBOARD: `${API_BASE_URL}/api/dashboard`,
  ALERTS: `${API_BASE_URL}/api/alerts`,
  AGENTS: `${API_BASE_URL}/api/agents`,
  RULES: `${API_BASE_URL}/api/rules`,
  AUDIT_LOGS: `${API_BASE_URL}/api/audit-logs`,
  SETTINGS: `${API_BASE_URL}/api/settings`,
  LOGIN: `${API_BASE_URL}/api/login`,
};

export default API_BASE_URL;
