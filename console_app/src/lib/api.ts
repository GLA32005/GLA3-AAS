/**
 * AgentSec Console API 配置文件
 * 
 * 在本地开发时，如果没有设置 VITE_API_URL，默认指向 localhost:8000。
 * 在云端部署时，请通过环境变量 VITE_API_URL 指定后端地址。
 */

// 在 Vite 环境中，逻辑首选动态发现当前主机的 8000 端口（云端部署兼容性）
const DEFAULT_API_HOST = typeof window !== 'undefined' ? window.location.hostname : "127.0.0.1";
const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${DEFAULT_API_HOST}:8000`;

export const API_ENDPOINTS = {
  DASHBOARD: `${API_BASE_URL}/api/dashboard`,
  ALERTS: `${API_BASE_URL}/api/alerts`,
  AGENTS: `${API_BASE_URL}/api/agents`,
  RULES: `${API_BASE_URL}/api/rules`,
  AUDIT_LOGS: `${API_BASE_URL}/api/audit-logs`,
  COMPLIANCE: `${API_BASE_URL}/api/compliance`,
  PERMISSIONS: `${API_BASE_URL}/api/permissions`,
  SCANNER: `${API_BASE_URL}/api/scanner`,
  SETTINGS: `${API_BASE_URL}/api/settings`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  SUGGESTIONS: (agentId: string) => `${API_BASE_URL}/api/agents/${agentId}/suggestions`,
};

export default API_BASE_URL;
