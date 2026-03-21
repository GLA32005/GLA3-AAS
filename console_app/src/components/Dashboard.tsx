import { useEffect, useState } from 'react';
import axios from 'axios';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from 'recharts';
import { Activity, ShieldAlert, Thermometer, Zap, ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { API_ENDPOINTS } from '../lib/api';

export function Dashboard() {
  const [data, setData] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 调用 FastAPI 端点获取数据
    axios.get(API_ENDPOINTS.DASHBOARD)
      .then(res => {
        setData(res.data);
        setError(null);
      })
      .catch(err => {
        console.error("Failed to fetch dashboard data:", err);
        setError("无法通过 http://127.0.0.1:8000 连接至安全大脑 (Backend Offline)");
      });
  }, []);

  if (error) return (
     <div className="flex flex-col items-center justify-center h-full space-y-4">
         <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex flex-col items-center max-w-md text-center">
            <ShieldAlert size={32} className="mb-3 opacity-50" />
            <div className="text-[14px] font-bold mb-1">系统通信异常</div>
            <div className="text-[11px] opacity-80">{error}</div>
            <div className="mt-4 p-2.5 bg-white border border-red-100 rounded text-[10px] text-zinc-500 font-mono italic">
               请确认后端容器或 uvicorn 服务是否已在 8000 端口启动。
            </div>
         </div>
         <button 
           onClick={() => window.location.reload()}
           className="text-[11px] text-[#4c1d95] font-bold hover:underline"
         >
           尝试重新连接 ↗
         </button>
     </div>
  );

  if (!data) return (
     <div className="flex items-center justify-center h-full">
         <div className="flex items-center gap-3 text-zinc-400 text-sm">
             <div className="w-4 h-4 rounded-sm border-2 border-zinc-200 border-t-zinc-400 animate-spin"></div>
             正在拉取系统安全大盘...
         </div>
     </div>
  );

  const chartData = data.hourly_trends.map((val: number, i: number) => ({ time: `${i.toString().padStart(2, '0')}:00`, value: val }));

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '纳管 Agent 端点', value: data.metrics.online_agents, sub: `活跃端点新增 ${data.metrics.online_agents_delta}`, icon: Activity, theme: 'green' },
          { label: '今日攻击拦截总数', value: data.metrics.today_blocks, sub: `${data.metrics.critical_alerts} 次严重危胁被缓解`, icon: ShieldAlert, alert: true, theme: 'red' },
          { label: '系统综合误报率', value: data.metrics.false_positive_rate, sub: '低于安全容忍阈值 < 1%', icon: Thermometer, theme: 'amber' },
          { label: '安全引擎 P99 时延', value: `${data.metrics.p99_latency_ms}ms`, sub: '纯内存级微秒级检测', icon: Zap, theme: 'purple' },
        ].map((m, i) => {
          let bgClass = '';
          let borderClass = '';
          let textClass = '';
          let iconColor = '';
          
          if (m.theme === 'green') {
            bgClass = 'bg-[#eef9f2]'; borderClass = 'border-[#98c9b3]'; textClass = 'text-[#185b46]'; iconColor = 'text-[#185b46]';
          } else if (m.theme === 'red') {
            bgClass = 'bg-[#fdf2f2]'; borderClass = 'border-[#e5a8a8]'; textClass = 'text-[#9a2828]'; iconColor = 'text-[#9a2828]';
          } else if (m.theme === 'amber') {
            bgClass = 'bg-[#fef7e7]'; borderClass = 'border-[#dac292]'; textClass = 'text-[#8d5b2d]'; iconColor = 'text-[#8d5b2d]';
          } else {
            bgClass = 'bg-[#eff0ff]'; borderClass = 'border-[#b4b2e8]'; textClass = 'text-[#323282]'; iconColor = 'text-[#323282]';
          }

          return (
            <div key={i} className={cn("rounded-lg p-5 relative overflow-hidden transition-shadow shadow-sm", bgClass, borderClass, "border-[0.5px]")}>
              <div className="flex justify-between items-start mb-4">
                  <div className={cn("text-[11px] font-medium tracking-wider uppercase opacity-80", textClass)}>{m.label}</div>
                  <m.icon size={16} strokeWidth={1} className={iconColor} />
              </div>
              <div className="flex items-baseline gap-2">
                  <div className={cn("text-3xl font-medium tracking-tight", textClass)}>{m.value}</div>
              </div>
              <div className={cn("text-[11px] mt-2 flex items-center gap-1.5 opacity-70", textClass)}>
                  {m.alert ? <AlertTriangle size={10} strokeWidth={1} /> : <ShieldCheck size={10} strokeWidth={1}/> }
                  {m.sub}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Chart Section - Takes 8 cols */}
        <div className="col-span-8 bg-white border-[0.5px] border-zinc-200 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-[14px] font-medium text-zinc-800 tracking-tight">全节点流量阻击大图 (过去 24H)</h3>
                    <div className="text-[11px] text-zinc-500 mt-0.5">记录横跨所有业务线微服务及 Agent 端的 Prompt 注入拦截频次。</div>
                </div>
                <div className="flex gap-2">
                    <button className="text-[10px] px-2.5 py-1.5 rounded bg-zinc-50 border-[0.5px] border-zinc-200 text-zinc-600 font-medium">24H</button>
                     <button className="text-[10px] px-2.5 py-1.5 rounded border border-transparent text-zinc-400 hover:text-zinc-600 transition-colors">7D</button>
                </div>
            </div>
            
            <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.08}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="time" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '0.5px solid #e4e4e7', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}
                    itemStyle={{ color: '#3f3f46', fontSize: '12px', fontWeight: 500 }}
                    cursor={{ stroke: '#d4d4d8', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="value" stroke="#b4b2e8" strokeWidth={1.5} fillOpacity={1} fill="url(#colorValue)" activeDot={{ r: 4, fill: '#fff', stroke: '#b4b2e8', strokeWidth: 1.5 }} />
                </AreaChart>
            </ResponsiveContainer>
            </div>
        </div>

        {/* Audit Log / Risk Radar - Takes 4 cols */}
         <div className="col-span-4 bg-white border-[0.5px] border-zinc-200 rounded-lg p-6 flex flex-col shadow-sm">
          <h3 className="text-[14px] font-medium text-zinc-800 tracking-tight mb-1 flex justify-between">
            <span>关键拦截日志</span>
            <span className="text-[11px] text-[#4c1d95] cursor-pointer hover:underline">查看完整追踪仪</span>
          </h3>
           <div className="text-[11px] text-zinc-500 mb-5">从 Callback 节点抛出并记录的最新的高危行为</div>
          
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {data.recent_alerts.map((alert: any) => (
              <div key={alert.id} className="group p-3 hover:bg-[#fafafa] rounded border border-transparent hover:border-zinc-200 transition-all cursor-crosshair">
                <div className="flex items-start gap-3">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", alert.level === 'Critical' ? "bg-[#e5a8a8]" : "bg-[#dac292]")}></div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[12px] text-zinc-700 font-medium leading-relaxed">{alert.title}</div>
                        <div className="text-[10px] text-zinc-400 mt-2 flex flex-wrap gap-x-2 gap-y-1 items-center">
                            <span className="px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-100 font-mono text-[9px] text-zinc-500">{alert.agent}</span>
                            <span>{alert.hook_point}</span>
                            <span className="text-zinc-400 ml-auto">{alert.time.split(' ')[1]}</span>
                        </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
