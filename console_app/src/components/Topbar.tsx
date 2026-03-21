import { Activity } from 'lucide-react';

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
  return (
    <div className="h-[52px] bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0 font-sans z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-[14px] font-medium text-zinc-800 tracking-tight">{titleMap[activePage] || ''}</h1>
        <div className="w-[1px] h-3 bg-zinc-300 mx-1"></div>
        <span className="text-[11px] text-zinc-500 flex items-center gap-1.5 font-medium">
           <Activity size={12} className="text-zinc-400" strokeWidth={1} /> 监控引擎运行中
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center h-6 px-2.5 rounded-[4px] bg-[#f8fafc] border border-zinc-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 shadow-[0_0_4px_rgba(52,211,153,0.4)]"></span>
          <span className="text-[11px] font-medium text-zinc-600">服务在线</span>
        </div>
        
        <div className="flex items-center h-6 px-2.5 rounded-[4px] bg-[#f8fafc] border border-zinc-200 text-[11px] font-medium text-zinc-500">
          基线版本 v2.41
        </div>
      </div>
    </div>
  );
}
