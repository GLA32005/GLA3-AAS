import { LayoutGrid, ShieldAlert, Users, Layers, Settings, Shield, History, Cpu, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  onLogout?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: number;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

const navItems: NavGroup[] = [
  { section: '实时监控', items: [
    { id: 'overview', label: '大盘总览', icon: LayoutGrid },
    { id: 'alerts', label: '告警中心', icon: ShieldAlert, badge: 3 }
  ]},
  { section: '核心资产', items: [
    { id: 'agents', label: 'Agent 清单', icon: Users },
    { id: 'permissions', label: '权限管理', icon: Shield },
    { id: 'rules', label: '检测规则', icon: Layers },
    { id: 'register', label: '接入向导', icon: Cpu, badge: '新' as any }
  ]},
  { section: '安全系统', items: [
    { id: 'compliance', label: '合规态势', icon: History, badge: 'Hot' as any },
    { id: 'settings', label: '系统设置', icon: Settings },
    { id: 'audit', label: '审计日志', icon: History }
  ]}
];

export function Sidebar({ activePage, setActivePage, onLogout }: SidebarProps) {
  return (
    <div className="w-60 bg-white border-r border-zinc-200 flex flex-col pt-6 font-sans shadow-sm z-10 w-shrink-0">
      <div className="px-6 pb-6 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-[4px] border border-zinc-300 flex items-center justify-center bg-zinc-50 shadow-sm">
             <div className="w-2 h-2 rounded-[1px] bg-zinc-400"></div>
          </div>
          <div className="text-[14px] font-medium text-zinc-800 tracking-tight">AgentSec</div>
        </div>
        <div className="text-[10px] text-zinc-400 mt-1.5 font-medium tracking-wide">企业增强版 V1.5</div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3">
        {navItems.map((group, idx) => (
          <div key={idx} className="mb-6">
            <div className="text-[10px] text-zinc-400 px-3 mb-2 tracking-widest font-semibold uppercase">
              {group.section}
            </div>
            {group.items.map(item => (
              <div 
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-[13px] hover:cursor-pointer rounded-md transition-all duration-200 group",
                  activePage === item.id 
                    ? "bg-[#f5f3ff] text-[#4c1d95] font-medium" 
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
                )}
              >
                <item.icon size={15} className={cn("shrink-0", activePage === item.id ? "text-[#4c1d95]" : "text-zinc-400 group-hover:text-zinc-600")} strokeWidth={activePage === item.id ? 1.5 : 1} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", activePage === item.id ? "bg-[#ddd6fe] text-[#4c1d95]" : "bg-zinc-100 text-zinc-500")}>
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-zinc-100 m-3 rounded-lg bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-zinc-200 border border-zinc-300"></div>
              <div>
                  <div className="text-[12px] font-medium text-zinc-700">系统管理员</div>
                  <div className="text-[10px] text-zinc-500">本地内网环境</div>
              </div>
          </div>
          {onLogout && (
              <button onClick={onLogout} className="text-zinc-400 hover:text-red-500 transition-colors p-1" title="Log Out">
                  <LogOut size={14} />
              </button>
          )}
      </div>
    </div>
  );
}
