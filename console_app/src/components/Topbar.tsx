import { Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../lib/api';

const titleMap: Record<string, string> = {
  overview: '数据总览 Dashboard',
  alerts: '告警中心 Incident Response',
  agents: 'Agent 清单 Asset Inventory',
  rules: '检测规则 Signatures',
  settings: '系统设置 Configuration',
  register: '接入向导 Access Wizard',
  permissions: '权限管理 Permissions',
  audit: '审计日志 Audit Logs',
  compliance: '合规态势 Compliance',
  report: '分析报告 Analytics',
  alert_detail: '告警详情 Alert Intelligence'
};

export function Topbar({ activePage }: { activePage: string }) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const baseUrl = API_ENDPOINTS.DASHBOARD.replace('/api/dashboard', '');
        await axios.get(`${baseUrl}/health`);
        setIsOnline(true);
      } catch (err) {
        setIsOnline(false);
      }
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // 每30秒同步一次健康状态
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[52px] bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0 font-sans z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-[14px] font-medium text-zinc-800 tracking-tight">{titleMap[activePage] || ''}</h1>
        <div className="w-[1px] h-3 bg-zinc-300 mx-1"></div>
        <span className="text-[11px] text-zinc-500 flex items-center gap-1.5 font-medium">
           <Activity size={12} className={isOnline ? "text-emerald-500" : "text-zinc-400"} strokeWidth={1} /> 
           {isOnline === false ? '监控引擎已离线' : '监控引擎运行中'}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className={`flex items-center h-6 px-2.5 rounded-[4px] border ${isOnline ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : isOnline === false ? 'bg-red-50 border-red-100 text-red-600' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${isOnline ? 'bg-emerald-400 animate-pulse' : isOnline === false ? 'bg-red-400' : 'bg-zinc-300'}`}></span>
          <span className="text-[11px] font-bold uppercase tracking-tight">
            {isOnline === true ? 'API 在线' : isOnline === false ? 'API 离线' : '探测中...'}
          </span>
        </div>
        
        <div className="flex items-center h-6 px-2.5 rounded-[4px] bg-[#f8fafc] border border-zinc-200 text-[11px] font-medium text-zinc-500">
          基线版本 v2.41
        </div>
      </div>
    </div>
  );
}
