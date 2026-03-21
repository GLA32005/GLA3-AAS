import { useState, useEffect } from 'react';
import { History, Search, Download, Filter, User, Activity, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';
import { cn } from '../lib/utils';
import { API_ENDPOINTS } from '../lib/api';

export function AuditLogPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoading(true);
            try {
                const params = searchTerm ? { search: searchTerm } : {};
                const res = await axios.get(API_ENDPOINTS.AUDIT_LOGS, { params });
                setLogs(res.data);
            } catch (err) {
                console.error("Failed to fetch logs:", err);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchLogs();
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const filteredLogs = logs; // 后端已经过滤好了

    const handleExport = async () => {
        try {
            const res = await axios.get(`${API_ENDPOINTS.AUDIT_LOGS}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Export failed:", err);
        }
    };

    return (
        <div className="p-8 space-y-6 max-w-[1200px] mx-auto animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-medium text-zinc-800 tracking-tight flex items-center gap-2">
                        <History className="text-zinc-600" strokeWidth={1} />
                        安全审计日志
                    </h2>
                    <p className="text-[12px] text-zinc-500 mt-1">记录控制台内所有敏感操作的流水，用于合规性核查与责任追溯</p>
                </div>
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-[12px] font-medium text-zinc-600 rounded-md hover:bg-zinc-50 transition-all shadow-sm"
                >
                    <Download size={14} /> 导出审计报告 (CSV)
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 border border-zinc-200 rounded-lg shadow-sm flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="搜索操作、目标或用户..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-md text-[13px] outline-none focus:ring-1 focus:ring-purple-200 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-3 py-2 bg-zinc-50 border border-zinc-100 rounded text-[12px] text-zinc-500 flex items-center gap-2">
                        <Filter size={12} /> 时间范围
                    </button>
                    <button className="px-3 py-2 bg-zinc-50 border border-zinc-100 rounded text-[12px] text-zinc-500">
                        最近 7 天
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse text-[12px]">
                    <thead className="bg-[#fcfcff] border-b border-zinc-100 text-zinc-400 uppercase tracking-widest font-bold text-[9px]">
                        <tr>
                            <th className="px-6 py-4">触发时间</th>
                            <th className="px-6 py-4">操作员</th>
                            <th className="px-6 py-4">涉及动作</th>
                            <th className="px-6 py-4">操作目标</th>
                            <th className="px-6 py-4">状态</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-6 py-6 border-b border-zinc-50 bg-zinc-50/20"></td>
                                </tr>
                            ))
                        ) : filteredLogs.length > 0 ? filteredLogs.map((log, i) => (
                            <tr key={i} className="hover:bg-zinc-50 transition-colors group">
                                <td className="px-6 py-5 text-zinc-400 font-mono">{log.time}</td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2 text-zinc-700 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center">
                                            <User size={10} className="text-indigo-400" />
                                        </div>
                                        {log.user}
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-zinc-600 font-bold tracking-tight">
                                    <div className="flex items-center gap-2">
                                        <Activity size={12} className="text-zinc-300" />
                                        {log.action}
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-zinc-500">{log.target}</td>
                                <td className="px-6 py-5">
                                    <div className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold",
                                        log.status === 'Success' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                    )}>
                                        {log.status === 'Success' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                        {log.status.toUpperCase()}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-16 text-center text-zinc-400 italic">
                                    暂无审计记录。所有的敏感操作（如审批、设置更改）都会被实时记录在此。
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="p-4 bg-zinc-50 border border-dashed border-zinc-200 rounded-lg">
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                    <strong>提示:</strong> 审计日志采用 WORM (Write Once Read Many) 策略沉淀至后端安全存储，本地部署环境下仅支持管理员查询。导出报告将包含完整的数据指纹摘要用于真实性验证。
                </p>
            </div>
        </div>
    );
}
