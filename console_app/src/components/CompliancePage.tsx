import { Calendar, Download, ShieldCheck, AlertCircle, FileText, CheckCircle2, Search, Clock, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../lib/api';

export function CompliancePage() {
    const [filter, setFilter] = useState('weekly');
    const [stats, setStats] = useState<any>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditMessage, setAuditMessage] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [statsRes, reportsRes] = await Promise.all([
                axios.get(`${API_ENDPOINTS.COMPLIANCE}/stats`),
                axios.get(`${API_ENDPOINTS.COMPLIANCE}/reports`)
            ]);
            setStats(statsRes.data);
            setReports(reportsRes.data);
        } catch (err) {
            console.error("Failed to fetch compliance data:", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAudit = async () => {
        setIsAuditing(true);
        setAuditMessage(null);
        try {
            const res = await axios.post(`${API_ENDPOINTS.COMPLIANCE}/audit`);
            setAuditMessage(res.data.message);
            // 3秒后自动清除消息
            setTimeout(() => setAuditMessage(null), 5000);
        } catch (err) {
            console.error("Audit failed:", err);
        } finally {
            setIsAuditing(false);
        }
    };

    if (!stats) return (
        <div className="flex items-center justify-center h-full text-zinc-400 text-sm italic">
            正在通过全量 Agent 基线检索计算组织合规评分...
        </div>
    );

    // 计算环形图偏移量 (364 为周长)
    const strokeDashoffset = 364 - (364 * stats.slo_score) / 100;

    const handleDownload = (report: any) => {
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${report.id}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

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
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="364" strokeDashoffset={strokeDashoffset} className="text-emerald-500 transition-all duration-1000 ease-out" />
                        </svg>
                        <div className="absolute flex flex-col">
                            <span className="text-3xl font-bold text-zinc-800">{stats.slo_score}<span className="text-sm">%</span></span>
                        </div>
                    </div>
                    <p className="text-[10px] text-emerald-600 font-medium mt-4">↑ 较上周增长 {stats.delta}%</p>
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
                        {reports.map((report) => (
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
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDownload(report); }}
                                        className="p-2 text-zinc-400 hover:text-[#4c1d95] hover:bg-white rounded border border-transparent hover:border-zinc-200 transition-all" 
                                        title="Download PDF"
                                    >
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
                     <div className="flex items-center gap-4">
                        {auditMessage && <span className="text-[10px] text-[#4c1d95] bg-purple-50 px-3 py-1.5 rounded border border-purple-100 animate-in fade-in slide-in-from-right-2">{auditMessage}</span>}
                        <button 
                            onClick={handleAudit}
                            disabled={isAuditing}
                            className="px-5 py-2.5 bg-[#4c1d95] text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-100 hover:bg-[#3b157a] transition-all flex items-center gap-2 disabled:opacity-70"
                        >
                            {isAuditing ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                            {isAuditing ? '全量审计中...' : '立即执行全局交叉审计'}
                        </button>
                     </div>
                 </div>

                 <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                    {stats.checklist.map((item: any, i: number) => (
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
