import { Shield, Users, Lock, CheckCircle2 } from 'lucide-react';

export function PermissionsPage() {
  const roles = [
    {
      name: 'System Administrator (Admin)',
      description: 'Full access to all security policies and system configurations.',
      capabilities: [
        { name: 'Update Rule Engine', status: 'pass' },
        { name: 'Approve Tool Escalation', status: 'pass' },
        { name: 'Manage Webhooks', status: 'pass' },
        { name: 'View Audit Logs', status: 'pass' },
        { name: 'Delete Agents', status: 'pass' },
      ]
    },
    {
      name: 'Security Auditor (Read-Only)',
      description: 'Restricted access for monitoring and report generation.',
      capabilities: [
        { name: 'Update Rule Engine', status: 'fail' },
        { name: 'Approve Tool Escalation', status: 'fail' },
        { name: 'Manage Webhooks', status: 'fail' },
        { name: 'View Audit Logs', status: 'pass' },
        { name: 'Delete Agents', status: 'fail' },
      ]
    }
  ];

  return (
    <div className="p-8 space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-800 tracking-tight">权限与角色管理 (RBAC)</h1>
        <p className="text-zinc-500 text-sm mt-1">定义不同用户级别对 Agent 安全策略的控制权限，支持多租户隔离。</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {roles.map((role, i) => (
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
              {role.capabilities.map((cap, j) => (
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
