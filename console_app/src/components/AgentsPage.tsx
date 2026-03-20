import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Shield, Cpu, ActivitySquare } from 'lucide-react';
import { cn } from '../lib/utils';

interface AgentsPageProps {
    onViewReport: (agentName: string) => void;
}

export function AgentsPage({ onViewReport }: AgentsPageProps) {
    const [agents, setAgents] = useState<any[]>([]);

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/agents')
          .then(res => setAgents(res.data.agents))
          .catch(err => console.error("Failed to fetch agents:", err));
      }, []);

    return (
        <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-medium text-zinc-800 tracking-tight flex items-center gap-2">
                        <Users className="text-zinc-600" strokeWidth={1} />
                        纳管 Agent 资产池
                    </h2>
                    <p className="text-[12px] text-zinc-500 mt-1">全局检视已挂载 SDK 防护的所有 AI 端点运行情况</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {agents.map((agent: any) => (
                    <div 
                      key={agent.id} 
                      className="group bg-white border-[0.5px] border-zinc-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all cursor-pointer relative"
                      onClick={() => onViewReport(agent.name)}
                    >
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] bg-[#f5f3ff] text-[#4c1d95] px-2 py-1 rounded border border-[#ddd6fe] font-medium">查看安全报告 ↗</span>
                        </div>
                        <div className="flex justify-between items-start mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#f8fafc] border border-zinc-200 flex items-center justify-center text-zinc-600 font-bold font-sans">
                                    {agent.name.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-medium text-zinc-800">{agent.name}</h3>
                                    <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                        <Cpu size={10} /> {agent.framework}
                                        <span className="text-zinc-300">|</span>
                                        <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-[10px]">{agent.business_line || 'No Dept'}</span>
                                    </div>
                                </div>
                            </div>
                            <span className={cn("text-[10px] px-2 py-1 rounded font-medium border uppercase tracking-wide", agent.mode === 'block' ? "bg-[#eef9f2] text-[#185b46] border-[#98c9b3]" : "bg-[#fef7e7] text-[#8d5b2d] border-[#dac292]")}>
                                MODE: {agent.mode}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-[11px] mb-1.5">
                                    <span className="text-zinc-500">安全信用分 (Trust Score)</span>
                                    <span className={cn("font-medium", agent.health_score > 60 ? "text-[#185b46]" : "text-[#9a2828]")}>{agent.health_score}/100</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                    <div className={cn("h-full rounded-full transition-all", agent.health_score > 60 ? "bg-[#98c9b3]" : "bg-[#e5a8a8]")} style={{ width: `${agent.health_score}%` }}></div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-zinc-100">
                                <div className="flex-1">
                                    <div className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1 flex items-center gap-1"><ActivitySquare size={10}/> 今日拦截</div>
                                    <div className="text-zinc-800 font-medium text-sm">{agent.today_blocks} 次</div>
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1 flex items-center gap-1"><Shield size={10}/> 权限状态</div>
                                    <div className={cn("font-medium text-[12px]", agent.permission_status === 'Normal' ? "text-zinc-600" : "text-[#8d5b2d]")}>{agent.permission_status}</div>
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1">负责人</div>
                                    <div className="text-zinc-600 font-medium text-[12px]">{agent.owner || 'Unknown'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
