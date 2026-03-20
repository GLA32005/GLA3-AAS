import { Calendar, Download, ShieldCheck, AlertCircle, FileText, CheckCircle2, Search, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';

export function CompliancePage() {
    const [filter, setFilter] = useState('weekly');

    return (
        <div className="p-8 space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-4">
                <div>
                     <h1 className="text-2xl font-bold text-zinc-800 tracking-tight">全局合规与审计态势</h1>
                     <p className="text-zinc-500 text-sm mt-1">汇总全组织内所有 AI 端点的合规基线达标率与历史趋势报告。</p>
                </div>
                <div className="flex bg-white border border-zinc-200 p-1 rounded-lg shadow-sm">
                    <button 
                        onClick={() => setFilter('weekly')}
                        className={cn("px-4 py-1.5 text-[11px] font-bold rounded-md transition-all", filter === 'weekly' ? "bg-[#4c1d95] text-white shadow-md shadow-purple-100" : "text-zinc-500 hover:text-zinc-700")}
                    > Weekly </button>
                    <button 
                        onClick={() => setFilter('monthly')}
                        className={cn("px-4 py-1.5 text-[11px] font-bold rounded-md transition-all", filter === 'monthly' ? "bg-[#4c1d95] text-white shadow-md shadow-purple-100" : "text-zinc-500 hover:text-zinc-700")}
                    > Monthly </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Score Cards */}
                <div className="col-span-3 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">组织合规水位 (SLO)</div>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-50" />
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="364" strokeDashoffset="42" className="text-emerald-500" />
                        </svg>
                        <div className="absolute flex flex-col">
                            <span className="text-3xl font-bold text-zinc-800">88.5<span className="text-sm">%</span></span>
                        </div>
                    </div>
                    <p className="text-[10px] text-emerald-600 font-medium mt-4">↑ 较上周增长 2.4%</p>
                </div>

                <div className="col-span-9 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm overflow-hidden relative">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[13px] font-bold text-zinc-700 uppercase tracking-widest flex items-center gap-2">
                             <Calendar size={14} className="text-[#4c1d95]" /> 周期性合规报告库
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
                            <input type="text" placeholder="搜索报告 ID..." className="pl-9 pr-4 py-1.5 bg-zinc-50 border border-zinc-100 rounded-lg text-[11px] w-48 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-all" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {[
                            { id: 'RPT-2024-W12', name: '全线 Agent 2024 第 12 周安全审计周报', date: '2024-03-24', agents: 12, risk: 'Low', status: 'Generated' },
                            { id: 'RPT-2024-M02', name: '组织应用层大模型安全治理 2 月度深度报告', date: '2024-02-29', agents: 9, risk: 'Medium', status: 'Archived' },
                            { id: 'RPT-2024-W11', name: '全线 Agent 2024 第 11 周安全审计周报', date: '2024-03-17', agents: 12, risk: 'Low', status: 'Archived' },
                            { id: 'RPT-2024-W10', name: '全线 Agent 2024 第 10 周安全审计周报', date: '2024-03-10', agents: 8, risk: 'High', status: 'Archived' },
                        ].map((report) => (
                            <div key={report.id} className="group flex items-center justify-between p-3.5 border border-zinc-100 rounded-lg hover:bg-zinc-50 transition-all cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className={cn("p-2.5 rounded-lg", report.status === 'Generated' ? "bg-[#eff0ff] text-[#4c1d95]" : "bg-zinc-100 text-zinc-500")}>
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <div className="text-[13px] font-medium text-zinc-800">{report.name}</div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] text-zinc-400 font-mono">{report.id}</span>
                                            <span className="text-zinc-300">|</span>
                                            <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Clock size={10} /> {report.date}</span>
                                            <span className="text-zinc-300">|</span>
                                            <span className="text-[10px] text-zinc-500 uppercase font-medium">{report.agents} Agents Covered</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded border uppercase", 
                                        report.risk === 'Low' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                                        report.risk === 'Medium' ? "bg-amber-50 text-amber-700 border-amber-100" : 
                                        "bg-red-50 text-red-700 border-red-100"
                                    )}>
                                        {report.risk} Risk
                                    </span>
                                    <button className="p-2 text-zinc-400 hover:text-[#4c1d95] hover:bg-white rounded border border-transparent hover:border-zinc-200 transition-all" title="Download PDF">
                                        <Download size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-center">
                        <button className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 transition-colors">查看更早的 12 份历史报告清单 ↓</button>
                    </div>
                </div>
            </div>

            {/* Compliance Checklist Global View */}
            <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm">
                 <div className="flex justify-between items-center mb-8">
                     <div>
                        <h2 className="text-lg font-bold text-zinc-800 tracking-tight">组织级合规基线对照表 (Checklist)</h2>
                        <p className="text-zinc-500 text-[12px] mt-0.5">参考 OWSAP for LLM 与 ISO 27001 AI 治理子集制定的基准线。</p>
                     </div>
                     <button className="px-5 py-2.5 bg-[#4c1d95] text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-100 hover:bg-[#3b157a] transition-all flex items-center gap-2">
                        <ShieldCheck size={14} /> 立即执行全局交叉审计
                     </button>
                 </div>

                 <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                    {[
                        { title: '接入适配性', sub: '所有在册 Agent 均集成 v1.5+ SDK 且心跳正常', status: 'pass' },
                        { title: '拦截策略覆盖', sub: '80% 以上的 Agent 核心管线已开启 BLOCK 模式', status: 'warn' },
                        { title: '身份认证闭环', sub: '控制台全局开启 Token 鉴权，且管理员权限已隔离', status: 'pass' },
                        { title: 'RAG 文档墙', sub: '所有具备检索能力的 Agent 已接入内容脱敏过滤层', status: 'warn' },
                        { title: '时延性能阈值', sub: '全局平均拦截 P99 时延维持在 20ms 以下', status: 'pass' },
                        { title: '误报闭环机制', sub: '告警中心已实现 100% 的误报反馈与规则自动调优回流', status: 'pass' },
                    ].map((item, i) => (
                        <div key={i} className="flex gap-4">
                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5", item.status === 'pass' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                                {item.status === 'pass' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            </div>
                            <div>
                                <div className="text-[13px] font-bold text-zinc-800">{item.title}</div>
                                <div className="text-[11px] text-zinc-500 mt-1">{item.sub}</div>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
}
