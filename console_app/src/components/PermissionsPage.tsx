import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../lib/api';
import { cn } from '../lib/utils';
import { Shield, Users, Lock, CheckCircle2, UserCircle } from 'lucide-react';

export function PermissionsPage() {
  const [data, setData] = useState<{roles: any[], admins: any[]}>({ roles: [], admins: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.PERMISSIONS);
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch permissions:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const roles = data.roles;
  const admins = data.admins;

  return (
    <div className="p-8 space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-800 tracking-tight">权限与角色管理 (RBAC)</h1>
        <p className="text-zinc-500 text-sm mt-1">定义不同用户级别对 Agent 安全策略的控制权限，支持多租户隔离。</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {isLoading ? (
          Array(2).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-zinc-100 rounded-xl p-6 h-64 animate-pulse"></div>
          ))
        ) : roles.map((role: any, i: number) => (
          <div key={i} className="bg-white border-[0.5px] border-zinc-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                <Shield size={20} className={i === 0 ? "text-[#4c1d95]" : "text-zinc-400"} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-zinc-800">{role.name}</h3>
                <p className="text-[11px] text-zinc-500">{role.description}</p>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              {role.capabilities.map((cap: any, j: number) => (
                <div key={j} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50/50 border border-transparent hover:border-zinc-100 transition-all">
                  <span className="text-[13px] text-zinc-600 font-medium">{cap.name}</span>
                  {cap.status === 'pass' ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-bold">
                      <CheckCircle2 size={14} /> ALLOWED
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-bold">
                      <Lock size={14} /> RESTRICTED
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-zinc-100 bg-[#fcfcff] flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-zinc-700 uppercase tracking-widest flex items-center gap-2">
                <Users size={14} className="text-indigo-500" /> 当前在线管理员清单
            </h3>
        </div>
        <table className="w-full text-left border-collapse text-[12px]">
            <thead className="bg-[#fcfcff] border-b border-zinc-100 text-zinc-400 uppercase tracking-widest font-bold text-[9px]">
                <tr>
                    <th className="px-6 py-4">用户名</th>
                    <th className="px-6 py-4">系统角色</th>
                    <th className="px-6 py-4">加入时间</th>
                    <th className="px-6 py-4 text-right">状态</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={4} className="h-12 bg-zinc-50/20"></td></tr>)
                ) : admins.map((admin: any, i: number) => (
                    <tr key={i} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-zinc-700 font-medium">
                                <UserCircle size={14} className="text-zinc-300" />
                                {admin.username}
                            </div>
                        </td>
                        <td className="px-6 py-4">
                             <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                admin.role === 'admin' ? "bg-purple-50 text-purple-600" : "bg-zinc-100 text-zinc-500"
                             )}>
                                {admin.role}
                             </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">{admin.created_at}</td>
                        <td className="px-6 py-4 text-right">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 flex gap-4 mt-8">
        <div className="p-2 bg-white rounded-lg self-start">
          <Users size={20} className="text-amber-600" />
        </div>
        <div>
          <h4 className="text-[14px] font-bold text-amber-900">多租户隔离控制 (Team Isolation)</h4>
          <p className="text-[12px] text-amber-800/70 mt-1 leading-relaxed">
            当前系统运行在 `Team: default`。所有的 Agent 资产和告警日志均已通过 `team_id` 进行底层逻辑隔离。
            如需开启多团队协作，请在主配置文件中启用 `MULTI_TENANCY_ENABLED`。
          </p>
        </div>
      </div>
    </div>
  );
}
