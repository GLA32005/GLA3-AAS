import { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Copy, 
  Terminal, 
  Shield, 
  Zap, 
  Server, 
  Info, 
  AlertCircle,
  X,
  RefreshCw,
  Cpu,
  Activity,
  ChevronRight,
  Monitor
} from 'lucide-react';
import axios from 'axios';
import { API_ENDPOINTS } from '../lib/api';

interface StepProps {
  active: boolean;
  done: boolean;
  index: number;
  label: string;
}

const StepIndicator = ({ active, done, index, label }: StepProps) => (
  <div className="flex items-center flex-1">
    <div className={`
      w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-mono border-2 transition-all duration-500
      ${active ? 'bg-zinc-900 border-zinc-900 text-white scale-110 shadow-lg' : 
        done ? 'bg-emerald-500 border-emerald-500 text-white' : 
        'bg-white border-zinc-200 text-zinc-400'}
    `}>
      {done ? <CheckCircle2 size={16} /> : index}
    </div>
    <div className="ml-3 flex flex-col">
      <span className={`text-[11px] font-bold uppercase tracking-tighter ${active ? 'text-zinc-900' : 'text-zinc-400'}`}>
        STEP {index}
      </span>
      <span className={`text-[13px] font-medium whitespace-nowrap ${active ? 'text-zinc-900' : 'text-zinc-400'}`}>
        {label}
      </span>
    </div>
    {index < 4 && <div className={`flex-1 h-[1.5px] mx-6 transition-all duration-1000 ${done ? 'bg-emerald-200' : 'bg-zinc-100'}`} />}
  </div>
);

export function AccessWizardPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    businessLine: '',
    owner: '',
    mode: 'warn'
  });
  const [token] = useState(() => `agt_${Math.random().toString(36).substr(2, 20)}`);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [onboardStatus, setOnboardStatus] = useState<any>({ current_step: 0, steps: {}, is_finished: false });
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<any>(null);

  // ── Auto-generate Install Command ──
  const backendUrl = API_ENDPOINTS.DASHBOARD.replace('/api/dashboard', '');
  const installCmd = `curl -sSL "${backendUrl}/api/install.sh?token=${token}&agent_name=${formData.name}" | bash`;

  const handleCopy = async (text: string, id: string) => {
    // 优先使用高级 API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 3000);
        return;
      } catch (err) {
        console.error('Modern copy failed, falling back...', err);
      }
    }

    // Fallback: 兼容非 HTTPS 环境
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 3000);
    } catch (err) {
      console.error('Fallback copy failed: ', err);
    }
    document.body.removeChild(textArea);
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  // ── Polling Onboard Status ──
  useEffect(() => {
    if (step === 3 && !isPolling) {
      setIsPolling(true);
      pollingRef.current = setInterval(async () => {
        try {
          const res = await axios.get(`${backendUrl}/api/agents/onboard-status/${token}`);
          setOnboardStatus(res.data);
          if (res.data.is_finished) {
            clearInterval(pollingRef.current);
            setIsPolling(false);
            setTimeout(() => setStep(4), 1500);
          }
        } catch (e) {
          console.error("Polling failed", e);
        }
      }, 2000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [step, token]);

  const StatusItem = ({ id, label, icon: Icon }: any) => {
    const stepData = onboardStatus.steps[id];
    const isCurrent = onboardStatus.current_step === parseInt(id);
    const isDone = parseInt(id) < onboardStatus.current_step || (isCurrent && stepData?.status === 'success');
    const isFail = stepData?.status === 'fail';

    return (
      <div className={`
        flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
        ${isDone ? 'bg-emerald-50/50 border-emerald-100' : isCurrent ? 'bg-zinc-50 border-zinc-200 shadow-sm' : 'bg-white border-zinc-100 opacity-60'}
      `}>
        <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            ${isDone ? 'bg-emerald-500 text-white' : isFail ? 'bg-red-500 text-white' : isCurrent ? 'bg-zinc-900 text-white animate-pulse' : 'bg-zinc-100 text-zinc-400'}
        `}>
          {isDone ? <CheckCircle2 size={20} /> : <Icon size={20} />}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className={`text-[13px] font-bold ${isDone ? 'text-emerald-700' : isCurrent ? 'text-zinc-900' : 'text-zinc-400'}`}>
              {label}
            </span>
            {stepData?.time && <span className="text-[10px] font-mono text-zinc-400">{stepData.time}</span>}
          </div>
          <p className={`text-[12px] ${isDone ? 'text-emerald-600/70' : isFail ? 'text-red-500' : 'text-zinc-500'}`}>
            {stepData?.message || (isCurrent ? '等待数据回传...' : '准备就绪')}
          </p>
        </div>
        {isCurrent && !isDone && <RefreshCw size={14} className="animate-spin text-zinc-400" />}
      </div>
    );
  };

  return (
    <div className="p-6 animate-in fade-in duration-700">
      <div className="w-full">

        <div className="flex gap-0 mb-10 px-4">
          <StepIndicator active={step === 1} done={step > 1} index={1} label="Agent 信息" />
          <StepIndicator active={step === 2} done={step > 2} index={2} label="获取安装预览" />
          <StepIndicator active={step === 3} done={step > 3} index={3} label="实时心跳监测" />
          <StepIndicator active={step === 4} done={step > 4} index={4} label="接入完成" />
        </div>

        <div className="bg-white border border-zinc-200 rounded-[24px] shadow-2xl shadow-zinc-200/50 overflow-hidden min-h-[580px] flex flex-col relative">
          {/* Progress Overlays */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-zinc-100">
             <div className="h-full bg-emerald-500 transition-all duration-700 ease-out" style={{ width: `${(step/4)*100}%` }} />
          </div>

          {step === 1 && (
            <div className="p-12 flex-1 flex flex-col animate-in slide-in-from-right-8 duration-500">
              <div className="mb-10">
                <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-2">配置您的资产身份</h2>
                <p className="text-zinc-500 text-[15px]">填写 Agent 基本信息，向导将自动生成包含预检逻辑的一键安装脚本。</p>
              </div>

              <div className="grid grid-cols-2 gap-10 flex-1">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1 block">Agent 名称</label>
                    <input 
                      className="w-full bg-white border-2 border-zinc-100 rounded-xl px-4 py-4 text-[14px] font-medium focus:outline-none focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 transition-all outline-none"
                      placeholder="例如: cs-assistant-bot"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                    <p className="text-[11px] text-zinc-400">我们将基于此名称在审计日志中标记告警来源。</p>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1 block">防护模式</label>
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                         onClick={() => setFormData({...formData, mode: 'warn'})}
                         className={`p-4 rounded-xl border-2 transition-all text-left ${formData.mode === 'warn' ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg' : 'border-zinc-100 bg-white text-zinc-500 hover:border-zinc-200'}`}
                       >
                         <div className="font-bold text-[14px] mb-1">Warn</div>
                         <div className="text-[10px] opacity-70 leading-tight">仅记录告警，不拦截业务，适合初次接入。</div>
                       </button>
                       <button 
                         onClick={() => setFormData({...formData, mode: 'block'})}
                         className={`p-4 rounded-xl border-2 transition-all text-left ${formData.mode === 'block' ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg' : 'border-zinc-100 bg-white text-zinc-500 hover:border-zinc-200'}`}
                       >
                         <div className="font-bold text-[14px] mb-1">Block</div>
                         <div className="text-[10px] opacity-70 leading-tight">高风险操作直接拦截，强安全策略模式。</div>
                       </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1 block">所属业务线</label>
                    <select 
                      className="w-full bg-white border-2 border-zinc-100 rounded-xl px-4 py-4 text-[14px] font-medium focus:outline-none transition-all outline-none appearance-none cursor-pointer"
                      value={formData.businessLine}
                      onChange={e => setFormData({...formData, businessLine: e.target.value})}
                    >
                      <option value="">请选择业务板块</option>
                      <option value="HR">HR & Admin 人力资源</option>
                      <option value="Finance">Finance & Tax 财务</option>
                      <option value="CS">Consumer Service 核心客服</option>
                      <option value="Core">Core Systems 核心业务系统</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1 block">负责人</label>
                    <input 
                      className="w-full bg-white border-2 border-zinc-100 rounded-xl px-4 py-4 text-[14px] font-medium focus:outline-none transition-all outline-none"
                      placeholder="姓名或系统邮箱"
                      value={formData.owner}
                      onChange={e => setFormData({...formData, owner: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-10 border-t border-zinc-50 flex justify-end">
                <button 
                  onClick={nextStep}
                  disabled={!formData.name || !formData.businessLine}
                  className="group flex items-center gap-3 px-10 py-4 bg-zinc-900 text-white rounded-xl text-[15px] font-black hover:bg-zinc-800 transition-all disabled:opacity-20 disabled:grayscale shadow-xl shadow-zinc-900/10"
                >
                  生成一键安装脚本 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-12 flex-1 flex flex-col animate-in slide-in-from-right-8 duration-500">
              <div className="flex justify-between items-start mb-10">
                 <div>
                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-2">获取接入指令</h2>
                    <p className="text-zinc-500 text-[15px]">SSH 登录您的业务主机 (B Server)，复制并粘贴执行下方命令。</p>
                 </div>
                 <div className="p-3 bg-zinc-900 rounded-xl text-white">
                    <Cpu size={24} />
                 </div>
              </div>

              <div className="space-y-8 flex-1">
                <div className="bg-zinc-900 rounded-3xl p-1 shadow-2xl shadow-zinc-900/20">
                  <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-4">
                       <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500/30" />
                          <div className="w-3 h-3 rounded-full bg-amber-500/30" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500/30" />
                       </div>
                       <span className="text-[11px] font-mono font-black text-zinc-500 uppercase tracking-widest pl-4">Exclusive Onboard Script</span>
                    </div>
                    <button 
                      onClick={() => handleCopy(installCmd, 'mainCmd')}
                      className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[12px] font-black transition-all border-2 border-transparent ${copiedId === 'mainCmd' ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                    >
                      {copiedId === 'mainCmd' ? <>已复制到剪贴板 <CheckCircle2 size={14} /></> : <>复制命令 <Copy size={14} /></>}
                    </button>
                  </div>
                  <div className="p-8 font-mono text-[14px] overflow-x-auto text-zinc-300 leading-relaxed whitespace-pre bg-zinc-950/50 rounded-b-3xl">
                    <span className="text-zinc-600 select-none mr-4">$</span>
                    <span className="text-emerald-400">curl</span> -sSL <span className="text-purple-400 italic">"{backendUrl}/api/install.sh?token={token.slice(0, 10)}..."</span> | <span className="text-emerald-400 font-bold">bash</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                   <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-600 mb-4 font-mono font-bold text-xs ring-4 ring-white shadow-sm">01</div>
                      <h4 className="text-[13px] font-black mb-2 text-zinc-900">自动离线分发</h4>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">脚本会自动从控制台下载 SDK 离线包 (.whl) 并本地安装，无需访问 GitHub 或外部网络。</p>
                   </div>
                   <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-600 mb-4 font-mono font-bold text-xs ring-4 ring-white shadow-sm">02</div>
                      <h4 className="text-[13px] font-black mb-2 text-zinc-900">环境自适应</h4>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">自动完成环境变量注入 (AGENTSEC_API_URL)，确保业务端能正确找到“大脑”地址。</p>
                   </div>
                   <div className="p-6 bg-zinc-100 rounded-2xl border-2 border-zinc-900 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-zinc-900 rotate-45 transform translate-x-6 -translate-y-6 flex items-end justify-center pb-1">
                         <Zap size={14} className="text-white -rotate-45" />
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white mb-4 font-mono font-bold text-xs shadow-lg">03</div>
                      <h4 className="text-[13px] font-black mb-2 text-zinc-900">预检激活</h4>
                      <p className="text-[11px] text-zinc-600 leading-relaxed">脚本将自动模拟一次拦截请求，通过 A-B 双向验证网络通畅后才会正式上线。</p>
                   </div>
                </div>
              </div>

              <div className="mt-auto pt-10 border-t border-zinc-50 flex justify-between items-center">
                <button onClick={prevStep} className="px-6 py-4 text-[14px] font-bold text-zinc-400 hover:text-zinc-600 transition-all font-mono">← BACK</button>
                <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-4 py-2 rounded-lg">
                   <Activity size={14} className="animate-pulse" /> Listening for heartbeats...
                </div>
                <button 
                  onClick={nextStep}
                  className="group flex items-center gap-3 px-10 py-4 bg-zinc-900 text-white rounded-xl text-[15px] font-black hover:bg-zinc-800 transition-all shadow-xl"
                >
                  我已在 B 主机执行命令 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-12 flex-1 flex flex-col animate-in slide-in-from-right-8 duration-500">
              <div className="mb-10 text-center">
                 <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-2">正在等待 B 主机上线</h2>
                 <p className="text-zinc-500 text-[15px]">安装脚本正在业务服务器上运行，进度将通过加密通道实时回传...</p>
              </div>

              <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto w-full flex-1">
                 <StatusItem id="1" label="SDK 离线分发状态" icon={Monitor} />
                 <StatusItem id="2" label="环境配置与隔离" icon={Info} />
                 <StatusItem id="3" label="B 机器 -> 控制台连通性" icon={Activity} />
                 <StatusItem id="4" label="动态拦截逻辑自检" icon={Zap} />
                 <StatusItem id="5" label="生产级心跳握手注册" icon={Shield} />
              </div>

              <div className="mt-10 p-8 bg-zinc-900 rounded-3xl flex items-center justify-between text-white shadow-2xl shadow-zinc-900/30 overflow-hidden relative">
                 <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
                 <div className="relative z-10 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                       <div className="w-8 h-8 rounded-full border-4 border-white border-t-transparent animate-spin" />
                    </div>
                    <div>
                       <h4 className="text-[13px] font-black uppercase tracking-widest opacity-60 mb-1">Status Report</h4>
                       <p className="text-xl font-bold tracking-tight">
                         {onboardStatus.is_finished ? '✅ Agent 已完成线上接入' : '⏳ 正在等待探头 (SDK) 回传信号...'}
                       </p>
                    </div>
                 </div>
                 <div className="relative z-10 hidden lg:block">
                    <div className="text-[10px] font-mono text-zinc-500 mb-2">CONSOLE UUID: {token.slice(0, 8)}...</div>
                    <div className="flex gap-1 justify-end">
                       {[0, 1, 2, 3, 4].map(i => <div key={i} className={`h-1 rounded-full transition-all duration-500 ${onboardStatus.current_step > i ? 'w-6 bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'w-2 bg-zinc-700'}`} />)}
                    </div>
                 </div>
              </div>

              <div className="mt-10 pt-4 border-t border-zinc-50 flex justify-center">
                 <button onClick={() => setStep(2)} className="text-[12px] font-bold text-zinc-400 hover:text-zinc-600 flex items-center gap-2 px-6 py-2 rounded-xl transition-all">
                    如果长时间没有进度，点击查看命令确认执行情况 <ChevronRight size={14} />
                 </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="p-12 flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-700">
              <div className="w-32 h-32 rounded-[40px] bg-emerald-500 shadow-2xl shadow-emerald-500/40 flex items-center justify-center mb-10 relative overflow-hidden group">
                <div className="absolute inset-x-0 bottom-0 h-0 bg-emerald-600 transition-all duration-700 group-hover:h-full" />
                <CheckCircle2 size={64} className="text-white relative z-10 animate-in zoom-in-50 duration-500" />
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
              
              <div className="mb-12">
                <h2 className="text-4xl font-black text-zinc-900 tracking-tighter mb-4 italic uppercase">{formData.name} <span className="text-emerald-500">Securely Armed!</span></h2>
                <div className="flex items-center justify-center gap-6">
                   <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 text-[12px] font-black text-emerald-700 uppercase tracking-widest">
                      <Zap size={12} /> Active Protection
                   </div>
                   <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 rounded-full border border-indigo-100 text-[12px] font-black text-indigo-700 uppercase tracking-widest">
                      <Shield size={12} /> Encrypted Channel
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 w-full max-w-2xl px-8">
                <button 
                  onClick={() => window.location.href='/agents'} 
                  className="flex items-center justify-center gap-3 px-8 py-5 bg-zinc-900 text-white rounded-2xl text-[16px] font-black hover:bg-zinc-800 transition-all shadow-2xl shadow-zinc-900/20 translate-y-0 hover:-translate-y-1 active:translate-y-0"
                >
                  进入资产大盘查看 <Monitor size={20} />
                </button>
                <button 
                  onClick={() => { setStep(1); setOnboardStatus({ current_step: 0, steps: {}, is_finished: false }); }}
                  className="flex items-center justify-center gap-3 px-8 py-5 border-2 border-zinc-100 bg-white text-zinc-900 rounded-2xl text-[16px] font-black hover:border-zinc-200 hover:bg-zinc-50 transition-all"
                >
                  继续接入下一个 Agent <RefreshCw size={20} />
                </button>
              </div>
              
              <p className="mt-12 text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-[0.3em]">Precision Protection for Autonomous Intelligence</p>
            </div>
          )}
        </div>

        <footer className="mt-10 px-6 flex flex-col md:flex-row items-center justify-between text-zinc-400 font-bold uppercase tracking-widest text-[10px]">
           <div className="flex items-center gap-6 mb-4 md:mb-0">
              <span className="flex items-center gap-2 opacity-50"><Shield size={12}/> Air-Gapped Ready</span>
              <span className="flex items-center gap-2 opacity-50"><Activity size={12}/> 15s Heartbeat Polling</span>
           </div>
           <div className="opacity-30 select-none">AgentSec Architecture © 2026</div>
        </footer>
      </div>
    </div>
  );
}
