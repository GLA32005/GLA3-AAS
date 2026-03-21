import { useState } from 'react';
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
  X
} from 'lucide-react';

interface StepProps {
  active: boolean;
  done: boolean;
  index: number;
  label: string;
}

const StepIndicator = ({ active, done, index, label }: StepProps) => (
  <div className="flex items-center flex-1">
    <div className={`
      w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300
      ${active ? 'bg-zinc-900 border-zinc-900 text-white' : 
        done ? 'bg-emerald-500 border-emerald-500 text-white' : 
        'bg-zinc-100 border-zinc-200 text-zinc-400'}
    `}>
      {done ? <CheckCircle2 size={12} /> : index}
    </div>
    <span className={`ml-2 text-[11px] font-medium whitespace-nowrap ${active ? 'text-zinc-900' : 'text-zinc-400'}`}>
      {label}
    </span>
    {index < 4 && <div className="flex-1 h-[1px] bg-zinc-100 mx-4" />}
  </div>
);

export function AccessWizardPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    businessLine: '',
    owner: '',
    environment: 'Production',
    framework: 'LangChain'
  });
  const [token] = useState(() => `agent_${Math.random().toString(36).substr(2, 8)}`);
  const [showGuide, setShowGuide] = useState(false);
  const [checkStatus, setCheckStatus] = useState<any[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 3000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const runCheck = async () => {
    setIsChecking(true);
    setCheckResult('正在建立连接...');
    
    const checks = [
      { id: 'c1', label: 'SDK 连通性状态', result: 'SDK 连接成功' },
      { id: 'c2', label: '核心规则库加载', result: '已加载 v2.41 (124 条规则)' },
      { id: 'c3', label: 'ONNX 语义模型状态', result: '边缘推理引擎就绪 (82MB)' },
      { id: 'c4', label: '高危告警上报链路', result: '上报延迟 42ms (正常)' },
      { id: 'c5', label: 'P99 性能延迟自检', result: '本地拦截延迟 14ms ✓' }
    ];

    const currentChecks: any[] = [];
    for (let i = 0; i < checks.length; i++) {
      await new Promise(r => setTimeout(r, 800));
      currentChecks.push({ ...checks[i], status: 'success' });
      setCheckStatus([...currentChecks]);
    }
    
    setCheckResult('全部检查通过');
    setIsChecking(false);
    
    // Auto proceed to success after a short delay
    setTimeout(() => nextStep(), 1000);
  };

  const DeploymentGuide = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-8 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-zinc-900" />
            <h3 className="font-bold text-zinc-900">AgentSec 深层接入指南</h3>
          </div>
          <button onClick={() => setShowGuide(false)} className="p-2 hover:bg-zinc-200 rounded-full transition-all">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          <section className="grid grid-cols-2 gap-8">
            <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-emerald-100">
              <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-3 flex items-center gap-2 text-emerald-700 font-medium text-[13px]">
                <CheckCircle2 size={14} /> 推荐方案：SDK 嵌入本地进程
              </div>
              <div className="p-6 space-y-4">
                <div className="border border-dashed border-emerald-300 rounded-xl p-4 bg-emerald-50/30 space-y-3">
                  <div className="flex items-center gap-3 bg-white p-3 rounded-md border border-emerald-200 shadow-sm">
                    <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600"><Zap size={18} /></div>
                    <div className="text-[12px] font-bold">Agent 业务进程</div>
                  </div>
                  <div className="flex justify-center"><ArrowRight size={14} className="text-emerald-300 rotate-90" /></div>
                  <div className="flex items-center gap-3 bg-emerald-600 p-3 rounded-md border border-emerald-700 text-white shadow-md">
                    <Shield size={18} />
                    <div className="text-[12px] font-bold">AgentSec SDK</div>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded text-center">
                  微秒级延迟，断网仍可完全拦截风险。
                </div>
              </div>
            </div>
            <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm opacity-60 grayscale-[0.5]">
              <div className="bg-red-50 border-b border-zinc-100 px-6 py-3 flex items-center gap-2 text-red-700 font-medium text-[13px]">
                <AlertCircle size={14} /> 备选方案：远程云端检测
              </div>
              <div className="p-6 space-y-4">
                <div className="border border-dashed border-zinc-300 rounded-xl p-4 bg-zinc-50 space-y-3">
                  <div className="flex items-center gap-3 bg-white p-3 rounded-md border border-zinc-200">
                    <Zap size={18} className="text-zinc-400" />
                    <div className="text-[12px] font-bold text-zinc-400">Agent 业务进程</div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ArrowRight size={14} className="text-red-300 rotate-90" />
                    <span className="text-[10px] text-red-400">200ms 网络延迟</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-md border border-red-100">
                    <Server size={18} className="text-red-400" />
                    <div className="text-[12px] font-bold text-red-400">远程安全 Cluster</div>
                  </div>
                </div>
                <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded text-center">
                  受网络波动影响，且可能造成业务阻塞。
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[14px] font-bold text-zinc-900 border-l-4 border-zinc-900 pl-3">典型集成代码 (LangChain)</h4>
            <div className="bg-zinc-900 rounded-xl p-5 font-mono text-[12px] text-zinc-300 leading-relaxed relative">
              <pre>
{`from agentsec import AgentSecurityCallback

# 创建安全回调
security_callback = AgentSecurityCallback(
    agent_name="HR-Assistant", 
    business_line="HR",
    mode="block" # 命中风险直接拦截
)

# 注入 Agent
agent_executor.run(
    "帮助我筛选简历...", 
    callbacks=[security_callback]
)`}
              </pre>
            </div>
          </section>

          <section className="bg-zinc-50 p-6 rounded-xl border border-zinc-100">
            <h4 className="flex items-center gap-2 text-[14px] font-bold text-zinc-900 mb-3">
              <Info size={16} /> 离线部署说明 (Air-Gapped)
            </h4>
            <p className="text-[12px] text-zinc-500 leading-relaxed">
              如果您的生产环境无法连接互联网，可以联系管理员获取最新的 <span className="text-zinc-900 font-bold">rules.onnx.zip</span> 部署包。手动解压至 <code className="bg-zinc-200 px-1 rounded">~/.agentsec/</code> 目录下，SDK 将自动识别并启动全量防御。
            </p>
          </section>
        </div>
        <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
          <button 
            onClick={() => setShowGuide(false)}
            className="px-6 py-2 bg-zinc-900 text-white rounded-md text-[13px] font-bold hover:shadow-lg transition-all"
          >
            我已了解
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-10 max-w-[1000px] mx-auto animate-in fade-in duration-500">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Agent 接入向导</h1>
        <p className="text-zinc-500 text-[14px] mt-2">简单四步，为您的 AI Agent 开启生产级安全防护。</p>
      </div>

      <div className="flex gap-0 mb-12">
        <StepIndicator active={step === 1} done={step > 1} index={1} label="基本信息" />
        <StepIndicator active={step === 2} done={step > 2} index={2} label="SDK 安装" />
        <StepIndicator active={step === 3} done={step > 3} index={3} label="连通性自检" />
        <StepIndicator active={step === 4} done={step > 4} index={4} label="接入完成" />
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        {step === 1 && (
          <div className="p-10 flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-zinc-900 rounded-full" /> 填写 Agent 基本信息
            </h2>
            <div className="grid grid-cols-2 gap-8 flex-1">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Agent 名称 *</label>
                  <input 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                    placeholder="例如: customer-service-bot"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">所属业务线 *</label>
                  <select 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-[14px] focus:outline-none transition-all"
                    value={formData.businessLine}
                    onChange={e => setFormData({...formData, businessLine: e.target.value})}
                  >
                    <option value="">请选择业务线</option>
                    <option value="HR">人力资源 (HR)</option>
                    <option value="Finance">财务 (Finance)</option>
                    <option value="CS">核心业务/客服</option>
                    <option value="Dev">技术研发</option>
                  </select>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">负责人 *</label>
                  <input 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-[14px] focus:outline-none transition-all"
                    placeholder="姓名或邮箱"
                    value={formData.owner}
                    onChange={e => setFormData({...formData, owner: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Agent 框架</label>
                  <select 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-[14px] focus:outline-none transition-all"
                    value={formData.framework}
                    onChange={e => setFormData({...formData, framework: e.target.value})}
                  >
                    <option>LangChain</option>
                    <option>CrewAI</option>
                    <option>AutoGen</option>
                    <option>Other / Custom</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-zinc-100 flex justify-end">
              <button 
                onClick={nextStep}
                disabled={!formData.name || !formData.businessLine || !formData.owner}
                className="group flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white rounded-lg text-[14px] font-bold hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-zinc-200"
              >
                下一步：获取接入代码 <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-10 flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-zinc-900 rounded-full" /> 安装 SDK 并接入代码
              </h2>
              <button 
                onClick={() => setShowGuide(true)}
                className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-full transition-all"
              >
                <Server size={14} /> 查看接入指南 (架构/离线模式)
              </button>
            </div>
            
            <p className="text-[13px] text-zinc-500 mb-8">
              已为 <strong className="text-zinc-900">{formData.name}</strong> 生成专属配置。复制以下代码到您的应用中。
            </p>

            <div className="space-y-6 flex-1">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">命令行：安装 SDK (推荐使用虚拟环境)</label>
                  <button 
                    onClick={() => handleCopy("python3 -m venv venv && source venv/bin/activate && pip install agentsec", 'pip')}
                    className="text-[10px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
                  >
                    {copiedId === 'pip' ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12}/>}
                    {copiedId === 'pip' ? <span className="text-emerald-600 font-bold">已复制!</span> : '复制'}
                  </button>
                </div>
                <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 font-mono text-sm leading-none">$</div>
                    <code className="text-zinc-300 font-mono text-[13px]">python3 -m venv venv && source venv/bin/activate</code>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 font-mono text-sm leading-none">$</div>
                    <code className="text-zinc-300 font-mono text-[13px]">pip install agentsec</code>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 italic">注：在 Ubuntu 23.04+ 等现代系统中，直接使用 pip 可能会受 PEP 668 限制，建议优先使用上面的 venv 方案。</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">代码：业务配置</label>
                  <button 
                    onClick={() => handleCopy(`from agentsec import AgentSecurityCallback\n\ncallback = AgentSecurityCallback(\n    agent_name="${formData.name}",\n    agent_token="${token}",\n    mode="warn"\n)`, 'code')}
                    className="text-[10px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
                  >
                    {copiedId === 'code' ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12}/>}
                    {copiedId === 'code' ? <span className="text-emerald-600 font-bold">已复制!</span> : '复制'}
                  </button>
                </div>
                <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 relative font-mono text-[12px] leading-relaxed">
                  <div className="text-zinc-500 italic mb-2"># 注入身份元数据，系统将自动建立资产台账</div>
                  <div className="text-zinc-300">
                    <span className="text-purple-400">from</span> agentsec <span className="text-purple-400">import</span> AgentSecurityCallback<br/><br/>
                    callback = AgentSecurityCallback(<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;agent_name=<span className="text-emerald-400">"{formData.name}"</span>,<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;agent_token=<span className="text-emerald-400">"{token}"</span>,<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;mode=<span className="text-emerald-400">"warn"</span><br/>
                    )
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-zinc-100 flex justify-between">
              <button 
                onClick={prevStep}
                className="px-6 py-3 border border-zinc-200 text-zinc-600 rounded-lg text-[14px] font-bold hover:bg-zinc-50 transition-all font-mono"
              >
                ← 上一步
              </button>
              <button 
                onClick={nextStep}
                className="group flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white rounded-lg text-[14px] font-bold hover:bg-zinc-800 transition-all shadow-lg"
              >
                已完成接入，去验证联通性 <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-10 flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-zinc-900 rounded-full" /> 联通性自检
            </h2>

            <p className="text-[13px] text-zinc-500 mb-8 border-l-2 border-indigo-200 pl-4">
              启动您的 Agent 进程后，点击下方的按钮。平台将向 SDK 发送探测信号并验证环境状态。
            </p>

            <div className="grid grid-cols-1 divide-y divide-zinc-100 border border-zinc-100 rounded-xl bg-zinc-50/30 overflow-hidden flex-1 mb-8">
              {checkStatus.length === 0 && !isChecking && (
                <div className="p-12 flex flex-col items-center justify-center text-zinc-400 space-y-4">
                  <Terminal size={40} strokeWidth={1} />
                  <p className="text-[13px]">等待执行探测程序...</p>
                </div>
              )}
              {isChecking || checkStatus.length > 0 ? (
                checkStatus.map((c, i) => (
                  <div key={i} className="px-6 py-4 flex items-center justify-between group hover:bg-white transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${c.status === 'success' ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 'bg-zinc-300'}`} />
                      <span className="text-[13px] font-medium text-zinc-800">{c.label}</span>
                    </div>
                    <span className={`text-[12px] ${c.status === 'success' ? 'text-emerald-600 font-bold' : 'text-zinc-400'}`}>
                      {c.result}
                    </span>
                  </div>
                ))
              ) : null}
            </div>

            <div className="flex gap-4 items-center">
              <button 
                onClick={runCheck}
                disabled={isChecking}
                className="px-8 py-3 bg-zinc-900 text-white rounded-lg text-[14px] font-bold hover:bg-zinc-800 transition-all shadow-lg disabled:opacity-50"
              >
                {isChecking ? '正在探测中...' : '开始联通性检测'}
              </button>
              <span className={`text-[12px] font-medium ${checkResult.includes('检查通过') ? 'text-emerald-600' : 'text-zinc-400'}`}>
                {checkResult}
              </span>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="p-10 flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 rounded-full bg-emerald-100/50 animate-ping" />
              <CheckCircle2 size={48} className="text-emerald-600 relative z-10" />
            </div>
            
            <h2 className="text-2xl font-bold text-zinc-900 mb-3">{formData.name} 接入成功</h2>
            <p className="text-zinc-500 text-[14px] max-w-[400px] mb-10">
              资产已自动入库并开启实时防护。您可以前往 Agent 清单查看其安全动态。
            </p>

            <div className="flex gap-4">
              <button 
                onClick={() => window.location.href='/agents'} // Simple mock navigation
                className="px-8 py-3 bg-zinc-900 text-white rounded-lg text-[14px] font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200"
              >
                查看资产清单 →
              </button>
              <button 
                onClick={() => { setStep(1); setCheckStatus([]); }}
                className="px-8 py-3 border border-zinc-200 text-zinc-600 rounded-lg text-[14px] font-bold hover:bg-zinc-50 transition-all"
              >
                返回向导首页
              </button>
            </div>
          </div>
        )}
      </div>

      {showGuide && <DeploymentGuide />}

      <footer className="mt-12 text-center text-[12px] text-zinc-400 flex items-center justify-center gap-6">
        <div className="flex items-center gap-1.5"><Shield size={12}/> 支持全离线环境部署</div>
        <div className="flex items-center gap-1.5"><Zap size={12}/> 核心逻辑零网络依赖</div>
      </footer>
    </div>
  );
}
