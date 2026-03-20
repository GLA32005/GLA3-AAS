import { Server, Zap, Cpu, ArrowRight, Download, Terminal, CheckCircle2, AlertCircle, Info, Shield } from 'lucide-react';

export function SDKPage() {
  const steps = [
    {
      id: 1,
      title: '开发者在服务器上安装 SDK',
      desc: '使用 pip 直接安装。安装后 SDK 包含核心规则库与 ONNX 语义分类模型。',
      code: 'pip install agentsec  # 约 120MB，含离线模型',
      note: 'SDK 作为应用依赖存在，无需独立部署容器。'
    },
    {
      id: 2,
      title: '在 Agent 代码中引入拦截器',
      desc: '通过 LangChain 的 Callback 机制注入。对业务逻辑完全透明。',
      code: `from agentsec import AgentSecurityCallback

agent = initialize_agent(
    tools=tools, llm=llm,
    callbacks=[AgentSecurityCallback()] # 只需增加此行
)`,
      note: '支持所有主流大模型框架的中间件模式。'
    },
    {
      id: 3,
      title: '应用启动，SDK 同进程加载',
      desc: 'SDK 随应用进程一同启动，加载预置规则与本地 ONNX 模型到内存。',
      note: '类比：如同给 Excel 装插件，两者在同一个系统资源池内运行。'
    },
    {
      id: 4,
      title: '实时拦截与异步上报',
      desc: '每次请求通过 SDK 进行微秒级本地检测。命中风险后拦截，并将告警异步上报。',
      note: '类比：如同 Word 拼写检查，离线实时，无需联网。'
    }
  ];

  return (
    <div className="p-8 space-y-8 max-w-[1200px] mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-zinc-100 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">SDK 接入指南</h1>
          <p className="text-zinc-500 text-[13px] mt-2">如何将 AgentSec 核心防御能力无缝集成进您的业务进程。</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-md text-[12px] font-medium hover:bg-zinc-800 transition-all">
            <Download size={14} /> 下载完整规格说明书 (PDF)
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-md text-[12px] font-medium hover:bg-zinc-50 transition-all">
            <Terminal size={14} /> 获取离线规则包 (.zip)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Wrong understanding */}
        <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="bg-red-50/50 border-b border-zinc-100 px-6 py-3 flex items-center gap-2 text-red-700 font-medium text-[13px]">
             <AlertCircle size={14} /> 错误理解：SDK 是独立的外部服务
          </div>
          <div className="p-8 space-y-6 flex flex-col items-center">
            <div className="w-full border border-dashed border-zinc-300 rounded-lg p-5 bg-zinc-50 relative">
              <span className="absolute -top-3 left-4 bg-white px-2 py-0.5 text-[10px] text-zinc-400 font-bold uppercase tracking-widest border border-zinc-100 rounded">Your Server</span>
              <div className="flex items-center gap-3 bg-white p-3 rounded-md border border-zinc-200 shadow-sm">
                <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600"><Zap size={18} /></div>
                <div>
                  <div className="text-[12px] font-bold text-zinc-800">Agent 业务应用</div>
                  <div className="text-[10px] text-zinc-400">LangChain / Python</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <div className="w-[1px] h-8 bg-zinc-200"></div>
              <div className="text-[11px] text-red-500 font-medium">跨网络请求 (Network Latency)</div>
              <ArrowRight size={14} className="text-red-400 rotate-90" />
            </div>

            <div className="w-full border border-dashed border-red-200 rounded-lg p-5 bg-red-50/20 relative">
              <span className="absolute -top-3 left-4 bg-white px-2 py-0.5 text-[10px] text-red-400 font-bold uppercase tracking-widest border border-red-100 rounded">Remote Cluster</span>
              <div className="flex items-center gap-3 bg-white p-3 rounded-md border border-red-200 shadow-sm opacity-60">
                <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center text-red-600"><Server size={18} /></div>
                <div>
                  <div className="text-[12px] font-bold text-red-800">AgentSec 云端检测</div>
                  <div className="text-[10px] text-red-400">第三方黑盒服务</div>
                </div>
              </div>
            </div>
            <div className="text-center text-[12px] text-red-600 px-4 py-2 bg-red-50 rounded-md border border-red-100 w-full">
               延迟 <strong>200ms+</strong>，受限于网络质量，容易成为业务瓶颈。
            </div>
          </div>
        </div>

        {/* Correct understanding */}
        <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-emerald-100 shadow-emerald-50">
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-3 flex items-center gap-2 text-emerald-700 font-medium text-[13px]">
             <CheckCircle2 size={14} /> 正确理解：SDK 嵌入应用进程内 (Process-Level)
          </div>
          <div className="p-8 space-y-4">
             <div className="border border-dashed border-emerald-300 rounded-xl p-6 bg-emerald-50/30 space-y-4 relative">
               <span className="absolute -top-3 left-6 bg-white px-2 py-0.5 text-[10px] text-emerald-600 font-bold uppercase tracking-widest border border-emerald-100 rounded">Your Unified Node</span>
               
               <div className="flex items-center gap-3 bg-white p-3 rounded-md border border-emerald-200 shadow-sm">
                 <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600"><Zap size={18} /></div>
                 <div>
                   <div className="text-[12px] font-bold text-zinc-800">Agent 应用进程</div>
                   <div className="text-[10px] text-zinc-400">宿主业务逻辑</div>
                 </div>
               </div>

               <div className="flex justify-center"><ArrowRight size={14} className="text-emerald-300 rotate-90" /></div>

               <div className="flex items-center gap-3 bg-emerald-600 p-3 rounded-md border border-emerald-700 shadow-md transform scale-[1.02]">
                 <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center text-white"><Shield size={18} /></div>
                 <div>
                   <div className="text-[12px] font-bold text-white">AgentSec SDK (In-Process)</div>
                   <div className="text-[10px] text-white/70">函数级调用，不产生网卡损耗</div>
                 </div>
               </div>

               <div className="flex justify-center"><ArrowRight size={14} className="text-emerald-200 rotate-90" /></div>

               <div className="flex items-center gap-3 bg-zinc-50 p-3 rounded-md border border-zinc-200 shadow-sm">
                 <div className="w-8 h-8 rounded bg-zinc-200 flex items-center justify-center text-zinc-500"><Cpu size={18} /></div>
                 <div>
                   <div className="text-[12px] font-bold text-zinc-800">规则缓存 + ONNX 分类器</div>
                   <div className="text-[10px] text-zinc-400">本地内存加速，无需磁盘回跳</div>
                 </div>
               </div>
             </div>
             <div className="text-center text-[12px] text-emerald-700 px-4 py-2 bg-emerald-50 rounded-md border border-emerald-100 w-full">
               P99 <strong>&lt; 20ms</strong>，本地断网环境下防御逻辑依然 100% 完整。
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-[15px] font-bold text-zinc-800 uppercase tracking-widest flex items-center gap-2">
           <Terminal size={16} /> 功能集成步骤 (Implementation Steps)
        </h2>
        <div className="grid grid-cols-1 divide-y divide-zinc-100 border border-zinc-200 rounded-xl bg-white shadow-sm overflow-hidden">
           {steps.map((step) => (
             <div key={step.id} className="p-8 flex gap-8 hover:bg-zinc-50/50 transition-all duration-300 group">
               <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center text-sm font-bold shrink-0 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                 {step.id}
               </div>
               <div className="flex-1 space-y-3">
                  <div className="text-[14px] font-bold text-zinc-800">{step.title}</div>
                  <div className="text-[13px] text-zinc-500 leading-relaxed max-w-[800px]">{step.desc}</div>
                  {step.code && (
                    <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 relative group/code overflow-hidden">
                       <pre className="text-[12px] text-zinc-300 font-mono leading-relaxed">
                          {step.code}
                       </pre>
                       <button className="absolute top-2 right-2 text-[10px] px-2 py-1 bg-zinc-800 text-zinc-500 rounded opacity-0 group-hover/code:opacity-100 transition-all hover:bg-zinc-700 hover:text-white">Copy Code</button>
                    </div>
                  )}
                  {step.note && (
                    <div className="flex items-start gap-2 text-[11px] text-zinc-400 bg-zinc-50 p-2 rounded border-l-2 border-zinc-200 italic">
                       <Info size={12} className="mt-0.5 shrink-0" /> {step.note}
                    </div>
                  )}
               </div>
             </div>
           ))}
        </div>
      </div>

      <div className="bg-indigo-900 text-white rounded-xl p-8 flex items-center justify-between shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 space-y-2">
            <h3 className="text-lg font-bold">对部署方案仍有疑问？</h3>
            <p className="text-white/60 text-[13px]">您可以直接针对您的业务拓扑（如多中心、海外节点等）咨询我们的架构师副本。</p>
        </div>
        <button className="relative z-10 px-6 py-2.5 bg-white text-indigo-900 rounded-md text-[13px] font-bold hover:bg-neutral-100 transition-all shadow-lg">
           咨询 AI 架构助手 ↗
        </button>
      </div>
    </div>
  );
}
