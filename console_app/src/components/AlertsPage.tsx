import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

interface AlertsPageProps {
    onViewDetail: (alertId: string) => void;
}

export function AlertsPage({ onViewDetail }: AlertsPageProps) {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [selectedAlerts, setSelectedAlerts] = useState<Set<number>>(new Set());
    const [filterLevel, setFilterLevel] = useState('All');
    const [filterAgent, setFilterAgent] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/alerts')
            .then(res => setAlerts(res.data.alerts))
            .catch(err => console.error("Failed to fetch alerts:", err));
    }, []);

    const toggleSelect = (id: number) => {
        const next = new Set(selectedAlerts);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedAlerts(next);
    };

    const toggleAll = () => {
        if (selectedAlerts.size === filteredAlerts.length) {
            setSelectedAlerts(new Set());
        } else {
            setSelectedAlerts(new Set(filteredAlerts.map(a => a.id)));
        }
    };

    const filteredAlerts = alerts.filter(a => {
        const matchLevel = filterLevel === 'All' || a.level === filterLevel;
        const matchAgent = filterAgent === 'All' || a.agent === filterAgent;
        const matchSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.agent.toLowerCase().includes(searchQuery.toLowerCase());
        return matchLevel && matchAgent && matchSearch;
    });

    const uniqueAgents = Array.from(new Set(alerts.map(a => a.agent)));

    return (
        <div className="p-8 space-y-6 max-w-[1600px] mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 className="text-xl font-medium text-zinc-800 tracking-tight flex items-center gap-2">
                        <ShieldAlert className="text-zinc-600" strokeWidth={1} />
                        告警响应中心
                    </h2>
                    <p className="text-[12px] text-zinc-500 mt-1">处理并追溯由各个 Agent 抛出的拦截事件</p>
                </div>

                <div className="flex gap-3 items-center">
                    {selectedAlerts.size > 0 && (
                        <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                             <span className="text-[11px] text-zinc-500 font-medium">已选择 {selectedAlerts.size} 项</span>
                             <button 
                                onClick={() => setSelectedAlerts(new Set())}
                                className="px-3 py-1.5 bg-zinc-900 text-white text-[11px] font-bold rounded-md hover:bg-zinc-800 transition-all shadow-lg"
                             >
                                 批量标记为“已处理”
                             </button>
                        </div>
                    )}
                    
                    <select 
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                        className="bg-zinc-50 border border-zinc-200 text-[11px] px-3 py-2 rounded-md outline-none focus:ring-1 focus:ring-zinc-200"
                    >
                        <option value="All">所有级别</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Warning">Warning</option>
                    </select>

                    <select 
                        value={filterAgent}
                        onChange={(e) => setFilterAgent(e.target.value)}
                        className="bg-zinc-50 border border-zinc-200 text-[11px] px-3 py-2 rounded-md outline-none focus:ring-1 focus:ring-zinc-200"
                    >
                        <option value="All">所有 Agent</option>
                        {uniqueAgents.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} strokeWidth={1.5} />
                        <input 
                            type="text" 
                            placeholder="搜索告警内容..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-64 pl-9 pr-4 py-2 text-[12px] bg-white border border-zinc-200 rounded-md focus:outline-none focus:border-zinc-300 focus:ring-1 focus:ring-zinc-200 shadow-sm transition-all" 
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white border-[0.5px] border-zinc-200 rounded-lg shadow-sm flex-1 overflow-hidden flex flex-col">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-[0.5px] border-zinc-200 bg-[#f8fafc] text-[11px] font-medium text-zinc-500 uppercase tracking-widest">
                            <th className="px-6 py-4 w-10">
                                <input 
                                    type="checkbox" 
                                    checked={selectedAlerts.size === filteredAlerts.length && filteredAlerts.length > 0} 
                                    onChange={toggleAll}
                                    className="accent-purple-600"
                                />
                            </th>
                            <th className="px-6 py-4 font-medium">级别</th>
                            <th className="px-6 py-4 font-medium">触发时间</th>
                            <th className="px-6 py-4 font-medium">来源 Agent</th>
                            <th className="px-6 py-4 font-medium">监测点</th>
                            <th className="px-6 py-4 font-medium w-1/3">事件描述</th>
                            <th className="px-6 py-4 font-medium text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-[0.5px] divide-zinc-100 overflow-y-auto">
                        {filteredAlerts.map((alert) => (
                            <tr
                                key={alert.id}
                                className={cn(
                                    "hover:bg-zinc-50/50 transition-colors text-[13px] text-zinc-700 group cursor-pointer",
                                    selectedAlerts.has(alert.id) && "bg-purple-50/30"
                                )}
                            >
                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedAlerts.has(alert.id)}
                                        onChange={() => toggleSelect(alert.id)}
                                        className="accent-purple-600"
                                    />
                                </td>
                                <td className="px-6 py-4" onClick={() => onViewDetail(alert.id)}>
                                    <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-[10px] uppercase font-semibold tracking-wider", alert.level === 'Critical' ? "bg-[#fdf2f2] text-[#9a2828] border border-[#e5a8a8]" : "bg-[#fef7e7] text-[#8d5b2d] border border-[#dac292]")}>
                                        <div className={cn("w-1 h-1 rounded-full", alert.level === 'Critical' ? "bg-[#9a2828]" : "bg-[#8d5b2d]")}></div>
                                        {alert.level}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-zinc-500 font-mono text-[11px]" onClick={() => onViewDetail(alert.id)}>{alert.time}</td>
                                <td className="px-6 py-4" onClick={() => onViewDetail(alert.id)}>
                                    <span className="px-2 py-1 bg-zinc-100 border border-zinc-200 rounded text-[11px] text-zinc-600 font-mono">
                                        {alert.agent}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-zinc-600 font-mono text-[11px] font-medium" onClick={() => onViewDetail(alert.id)}>{alert.hook_point}</td>
                                <td className="px-6 py-4 truncate max-w-sm" title={alert.title} onClick={() => onViewDetail(alert.id)}>{alert.title}</td>
                                <td className="px-6 py-4 text-right" onClick={() => onViewDetail(alert.id)}>
                                    <button className="text-[11px] font-semibold text-[#4c1d95] bg-[#f5f3ff] px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-all border border-[#ddd6fe] shadow-sm">
                                        去处置 ↗
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {alerts.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
                        暂无相关告警记录
                    </div>
                )}
            </div>
        </div>
    );
}
