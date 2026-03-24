import { useState, useEffect } from 'react';
import { ChevronRight, ShieldAlert, History, Play, Info, Layers, Code, Shield, CheckCircle2, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import axios from 'axios';
import { API_ENDPOINTS } from '../lib/api';

interface AlertDetailViewProps {
  onBack: () => void;
  alertId?: string;
}

export function AlertDetailView({ alertId = '1', onBack }: AlertDetailViewProps) {
  const [activeTab, setActiveTab] = useState('chain');
  const [feedbackStatus, setFeedbackStatus] = useState<null | 'sending' | 'success'>(null);
  const [approvalStatus, setApprovalStatus] = useState<null | 'approving' | 'approved' | 'rejected'>(null);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [current, setCurrent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (alertId) {
      axios.get(`${API_ENDPOINTS.ALERTS}/${alertId}`)
        .then(res => {
          setCurrent(res.data);
          setError(null);
        })
        .catch(err => {
          console.error("Failed to fetch alert detail:", err);
          setError("无法获取告警详情，请确认后端 API 服务状态。");
        });
    }
  }, [alertId]);

  const handleApprove = async (action: 'approve' | 'reject') => {
    setApprovalStatus(action === 'approve' ? 'approving' : 'rejected' as any);
    try {
      await axios.post(`${API_ENDPOINTS.ALERTS}/action`, {
        ids: [alertId],
        action: action === 'approve' ? 'resolved' : 'muted'
      });
      setApprovalStatus(action === 'approve' ? 'approved' : 'rejected');
      // 3秒后返回列表
      setTimeout(onBack, 1500);
    } catch (err) {
      console.error("Action failed:", err);
      setApprovalStatus(null);
    }
  };

  const runStaticScan = async (agentName: string) => {
    setIsScanning(true);
    try {
      const res = await axios.get(`${API_ENDPOINTS.SCANNER}/analyze/${agentName}`);
      setScanResults(res.data.findings || []);
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFeedback = async (isFalsePositive: boolean) => {
    if (!current) return;
    setFeedbackStatus('sending');
    try {
      await axios.post(`${API_ENDPOINTS.ALERTS}/feedback`, {
        alert_id: alertId,
        is_false_positive: isFalsePositive
      });
      setFeedbackStatus('success');
    } catch (err) {
      console.error("Feedback failed:", err);
      setFeedbackStatus(null);
    }
  };

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
        <ShieldAlert size={24} />
      </div>
      <h2 className="text-zinc-800 font-bold text-lg">告警数据回溯失败</h2>
      <p className="text-zinc-500 text-sm max-w-md">{error}</p>
      <button 
        onClick={onBack}
        className="mt-6 px-4 py-2 bg-zinc-900 text-white rounded-md text-[12px] font-medium hover:bg-zinc-800 transition-all font-sans"
      >
        返回告警中心
      </button>
    </div>
  );

  if (!current) return (
    <div className="flex items-center justify-center h-full text-zinc-400 text-sm italic">
      正在回溯攻击现场数据...
    </div>
  );

  const [selectedDecision, setSelectedDecision] = useState('d1');

  const decisions = {
    d1: { 
      title: '确认拦截 + 补充规则', 
      desc: '确认本次拦截有效，并将检测漏洞点自动提交至规则库，补齐防御层解析规则。',
      label: '推荐方案',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      code: `# 自动生成的检测规则补丁 (v2.0)
{
  "rule_id": "auto-patch-${alertId}",
  "dimension": "${current.hook_point === 'on_retriever_end' ? 'External Attack' : 'Config Defect'}",
  "hook": "${current.hook_point}",
  "pattern": "detect_semantic_violation",
  "action": "block"
}`
    },
    d2: { 
      title: '确认拦截 + 封禁会话', 
      desc: `拦截该请求并立即终止当前会话 ${alertId}，防止攻击扩散。`,
      label: '高压管控',
      color: 'text-zinc-600 bg-zinc-50 border-zinc-200',
      code: `agentsec.sessions.terminate("${alertId}", reason="security_violation")`
    },
    d3: { 
      title: '标记误报 + 放行规则', 
      desc: '判断为系统内部误报，将该资产的相关行为加入信任白名单。',
      label: '谨慎操作',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      code: `agentsec.exceptions.add(agent="${current.agent}", hook="${current.hook_point}")`
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[12px] text-zinc-400 mb-2">
        <span className="hover:text-zinc-600 cursor-pointer transition-colors" onClick={onBack}>告警中心</span>
        <ChevronRight size={12} strokeWidth={1} />
        <span className="text-zinc-800 font-medium">告警研判处置 (SOP)</span>
      </div>

      {/* Hero Alert Banner */}
      <div className={cn(
        "border-[0.5px] border-l-[4px] rounded-lg p-6 flex flex-col shadow-sm",
        current.level === 'Critical' ? "bg-[#fdf2f2] border-[#e5a8a8] border-l-[#9a2828]" : "bg-[#fffbeb] border-[#fde68a] border-l-[#d97706]"
      )}>
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <h1 className={cn("text-lg font-medium", current.level === 'Critical' ? "text-[#9a2828]" : "text-[#d97706]")}>
              {current.title}
            </h1>
            <p className="text-[12px] text-zinc-500 max-w-[800px]">{current.desc}</p>
          </div>
          <span className={cn(
            "text-[10px] px-2 py-1 rounded border font-bold uppercase tracking-widest",
            current.level === 'Critical' ? "bg-[#fdf2f2] text-[#9a2828] border-[#e5a8a8]" : "bg-[#fffbeb] text-[#d97706] border-[#fde68a]"
          )}>{current.level}</span>
        </div>
        
        <div className="flex flex-wrap gap-x-8 gap-y-3 pt-6 border-t border-zinc-200/50">
           <div className="text-[11px] text-zinc-400">Agent <span className="text-zinc-800 font-medium ml-1">{current.agent}</span></div>
           <div className="text-[11px] text-zinc-400">检测点 <span className="text-zinc-800 font-semibold ml-1">{current.hook_point}</span></div>
           <div className="text-[11px] text-zinc-400">时间 <span className="text-zinc-800 font-medium ml-1">刚刚</span></div>
           <div className="text-[11px] text-zinc-400">置信度 <span className="text-zinc-800 font-bold ml-1">{current.confidence}</span></div>
           <div className="text-[11px] text-zinc-400">处置状态 <span className="text-amber-600 font-bold ml-1">{current.status}</span></div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="bg-white border-[0.5px] border-zinc-200 rounded-lg shadow-sm flex flex-col overflow-hidden min-h-[500px]">
        <div className="flex border-b border-zinc-100 px-4 pt-1 bg-zinc-50/50">
          {[
            { id: 'chain', label: '调用链还原', icon: Play },
            { id: 'decision', label: '处置决策', icon: ShieldAlert },
            { id: 'whitelist', label: '白名单配置', icon: Layers },
            { id: 'history', label: '历史趋势', icon: History }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-5 py-3 text-[12px] font-medium flex items-center gap-2 border-b-2 transition-all relative overflow-hidden",
                activeTab === tab.id 
                  ? "text-[#4c1d95] border-[#4c1d95] bg-white" 
                  : "text-zinc-400 border-transparent hover:text-zinc-600"
              )}
            >
              <tab.icon size={13} strokeWidth={activeTab === tab.id ? 2 : 1.5} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-8">
          {/* Tab 1: Chain */}
          {activeTab === 'chain' && (
            <div className="space-y-6">
               <h3 className="text-[13px] font-medium text-zinc-800 tracking-tight">攻击路径链深度回溯 (Chain Recovery)</h3>
                <div className="space-y-0 pl-2">
                  {current.steps && Array.isArray(current.steps) ? current.steps.map((s: any, i: number) => (
                    <div key={i} className="flex gap-6 relative pb-10 group last:pb-0">
                      {i !== current.steps.length - 1 && <div className="absolute left-2 top-5 bottom-0 w-[1px] bg-zinc-100 group-hover:bg-zinc-200 transition-colors"></div>}
                      <div className={cn("w-4 h-4 rounded-full border-2 bg-white mt-1.5 z-10 shrink-0", s.status === 'danger' ? "border-[#9a2828]" : s.status === 'warn' ? "border-[#8d5b2d]" : "border-zinc-200")}>
                         <div className={cn("w-1 h-1 rounded-full m-auto mt-0.5", s.status === 'danger' ? "bg-[#9a2828]" : s.status === 'warn' ? "bg-[#8d5b2d]" : "bg-zinc-200")}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-[13px] font-medium text-zinc-800 uppercase tracking-tight">STEP {s.id}: {s.title}</div>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold uppercase", s.status === 'danger' ? "bg-red-50 text-red-600 border border-red-100" : s.status === 'warn' ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-zinc-50 text-zinc-400")}>
                            {s.tag}
                          </span>
                        </div>
                        <div className="text-[12px] text-zinc-500 mt-2 p-3 bg-zinc-50 rounded italic border border-zinc-100">
                          {s.desc}
                        </div>
                      </div>
                     </div>
                  )) : (
                    <div className="text-zinc-400 text-[12px] italic py-4">暂无调用链数据</div>
                  )}
               </div>
               <div className="mt-6 p-4 bg-[#eff0ff] border border-[#b4b2e8] rounded-md flex items-start gap-4 shadow-sm shadow-indigo-100/50">
                  <Info size={16} className="text-[#323282] mt-0.5" />
                  <div className="text-[12px] text-[#323282] leading-relaxed">
                    <strong>SOP 诊断结论：</strong> 该事件被识别为 <strong>{current.hook_point === 'on_retriever_end' ? '维度一：外部间接注入' : current.hook_point === 'on_llm_start' ? '维度二：敏感信息合规风险' : '维度二：高危工具幻觉风险'}</strong>。建议执行 <strong>方案1 (自动规则升级)</strong> 以实现全局闭环防御。
                  </div>
               </div>
            </div>
          )}

          {/* Tab 2: Decision */}
          {activeTab === 'decision' && (
            <div className="space-y-6">
               <h3 className="text-[13px] font-medium text-zinc-800 tracking-tight">选择针对该告警的最佳处置 SOP</h3>
               <div className="grid grid-cols-3 gap-4">
                  {(Object.keys(decisions) as Array<keyof typeof decisions>).map(id => (
                    <div 
                      key={id} 
                      onClick={() => setSelectedDecision(id)}
                      className={cn(
                        "p-4 border-[0.5px] rounded-lg cursor-pointer transition-all flex flex-col justify-between",
                        selectedDecision === id ? "border-[#4c1d95] bg-[#f5f3ff] shadow-md shadow-indigo-100/50 ring-1 ring-indigo-100" : "border-zinc-200 hover:border-zinc-300 bg-white"
                      )}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                           <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-bold uppercase", decisions[id].color)}>{decisions[id].label}</span>
                        </div>
                        <div className="text-[13px] font-semibold text-zinc-800">{decisions[id].title}</div>
                        <div className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{decisions[id].desc}</div>
                      </div>
                      <div className="mt-4 flex justify-end">
                         <div className={cn("w-3 h-3 rounded-full border-2 flex items-center justify-center", selectedDecision === id ? "border-[#4c1d95]" : "border-zinc-200")}>
                           {selectedDecision === id && <div className="w-1.5 h-1.5 rounded-full bg-[#4c1d95]" />}
                         </div>
                      </div>
                    </div>
                  ))}
               </div>

               <div className="p-6 bg-zinc-900 rounded-lg shadow-xl shadow-zinc-200 relative group overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
                       <Code size={12} strokeWidth={1.5} /> 执行内容预览 (Action Preview)
                    </div>
                    <button className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1.5 bg-zinc-800 px-2 py-1 rounded transition-colors group-hover:bg-zinc-700">可复制内容</button>
                  </div>
                  <pre className="text-[12px] text-white font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
                    {decisions[selectedDecision as keyof typeof decisions].code}
                  </pre>
               </div>

               <div className="pt-4 flex gap-2">
            <button 
              onClick={() => handleFeedback(true)}
              disabled={feedbackStatus !== null}
              className={cn(
                "px-4 py-2 text-[12px] font-medium rounded-md flex items-center gap-2 transition-all",
                feedbackStatus === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              )}
            >
              {feedbackStatus === 'sending' ? '正在提交反馈...' : (feedbackStatus === 'success' ? <><CheckCircle2 size={14}/> 已标记为误报并启动规则优化</> : <><RotateCcw size={14}/> 标记为误报</>)}
            </button>
            
            {current.status === '等候决策' ? (
              <div className="flex gap-2">
                <button 
                  onClick={() => handleApprove('approve')}
                  disabled={approvalStatus !== null}
                  className="px-4 py-2 bg-emerald-600 text-white text-[12px] font-medium rounded-md hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  {approvalStatus === 'approved' ? <><CheckCircle2 size={14}/> 批准执行 (已下发)</> : '批准执行 (双人审计)'}
                </button>
                <button 
                  onClick={() => handleApprove('reject')}
                  className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-[12px] font-medium rounded-md hover:bg-red-100 transition-all"
                >
                  驳回请求
                </button>
              </div>
            ) : (
              <button className="px-4 py-2 bg-zinc-900 text-white text-[12px] font-medium rounded-md hover:bg-zinc-800 transition-all">
                立即执行推荐处置
              </button>
            )}
          </div>
            </div>
          )}

          {/* Tab 3: Whitelist */}
          {activeTab === 'whitelist' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h3 className="text-[13px] font-medium text-zinc-800 tracking-tight">Agent 工具权限对比分析 (Dimension 2)</h3>
                  <span className="text-[11px] text-[#9a2828] bg-red-50 px-2.5 py-1 rounded border border-red-100 font-bold tracking-widest uppercase">最小权限核查中</span>
               </div>
               
               <div className="border border-zinc-200 rounded-lg overflow-hidden shrink-0">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-widest font-bold text-[10px]">
                      <tr>
                        <th className="px-6 py-4">工具集名称</th>
                        <th className="px-6 py-4">风险等级</th>
                        <th className="px-6 py-4">处置建议</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {scanResults.length > 0 ? scanResults.map((tool, i) => (
                        <tr key={i} className="hover:bg-red-50/30 transition-colors">
                          <td className="px-6 py-4 font-mono text-zinc-700 font-bold">{tool.tool}</td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                               <span className="font-bold text-red-700 uppercase tracking-wider text-[10px]">High Risk</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-zinc-500 italic">{tool.advice}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-zinc-400 italic">
                            尚未执行实时权限扫描。点击下方按钮，SDK 将分析该 Agent 的静态工具集定义并识别过度配置风险。
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
               </div>

               <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-zinc-400" />
                    <div>
                      <div className="text-[12px] font-bold text-zinc-700">自动执行最小化权限策略？</div>
                      <div className="text-[10px] text-zinc-400">将为该 Agent 生成专属的工具过滤器，阻断所有未授权的高危调用。</div>
                    </div>
                  </div>
                   <button 
                    onClick={() => runStaticScan(current.agent)}
                    disabled={isScanning}
                    className="px-4 py-1.5 bg-zinc-900 text-white rounded text-[11px] font-medium hover:bg-zinc-800 transition-all flex items-center gap-2"
                   >
                    {isScanning ? '正在扫描...' : '执行实时权限扫描 ↗'}
                   </button>
               </div>
            </div>
          )}

          {/* Tab 4: History */}
          {activeTab === 'history' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h3 className="text-[13px] font-medium text-zinc-800 tracking-tight">Agent 关联风险历史</h3>
                  <div className="text-right">
                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">历史告警严重度分布</div>
                    <div className="flex gap-1 mt-1">
                      <div className="w-8 h-1 bg-[#9a2828] rounded"></div>
                      <div className="w-4 h-1 bg-[#d97706] rounded"></div>
                      <div className="w-12 h-1 bg-zinc-100 rounded"></div>
                    </div>
                  </div>
               </div>

               <div className="space-y-3">
                  {[
                    { title: 'delete_file 越权拦截', time: '刚刚', level: 'Critical', status: '待处置' },
                    { title: 'RAG 检索结果注入特征命中', time: '2小时前', level: 'High', status: '已自动响应' },
                    { title: '多轮对话意图漂移警告', time: '1天前', level: 'Medium', status: '系统观测中' },
                    { title: 'Agent 间未认证消息传播记录', time: '3天前', level: 'High', status: '监控捕获' }
                  ].map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white border border-zinc-100 rounded-lg hover:border-zinc-200 transition-all group">
                       <div className="flex items-center gap-4">
                          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", h.level === 'Critical' ? "bg-red-500 animate-pulse" : h.level === 'High' ? "bg-amber-500" : "bg-zinc-300")}></div>
                          <div>
                            <div className="text-[12px] font-medium text-zinc-700">{h.title}</div>
                            <div className="text-[10px] text-zinc-400 mt-1">{h.time} · {h.status}</div>
                          </div>
                       </div>
                       <ChevronRight size={14} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                    </div>
                  ))}
               </div>

               {/* Cross-Agent Correlation Analysis (P2) */}
               <div className="mt-8 pt-6 border-t border-zinc-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1 px-2 rounded bg-indigo-50 text-indigo-600 font-bold text-[9px] uppercase tracking-widest">进阶分析 (P2)</div>
                        <h4 className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest">跨 Agent 攻击关联分析 (Correlation)</h4>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        发现 2 个关联资产受影响
                    </span>
                  </div>
                  <div className="bg-indigo-50/10 border border-indigo-100 rounded-xl p-4">
                    <p className="text-[11px] text-zinc-600 leading-relaxed mb-4 italic">
                        “Payload 特征串 <span className="font-mono font-bold text-red-600">[SYSTEM_OVERRIDE]</span> 曾在其它 2 个 Agent 中出现过，
                        这标志着一次针对业务系统的横向穿透尝试。”
                    </p>
                    <div className="flex gap-4">
                        {[
                            { icon: '🤖', name: 'data-analyst-agent', time: '18h前', hits: 2 },
                            { icon: '💼', name: 'hr-assistant-agent', time: '2d前', hits: 1 }
                        ].map((a, i) => (
                            <div key={i} className="flex-1 bg-white p-3 rounded-lg border border-indigo-100/50 shadow-sm group hover:scale-[1.05] transition-transform cursor-pointer">
                                <div className="text-xl mb-1">{a.icon}</div>
                                <div className="text-[11px] font-bold text-zinc-800 truncate">{a.name}</div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-[9px] text-zinc-400 font-mono">{a.time}</span>
                                    <span className="text-[9px] text-indigo-500 font-bold uppercase">{a.hits} Hits</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-4 py-2 bg-white border border-dashed border-indigo-200 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 transition-all uppercase rounded-lg tracking-widest">
                        查看完整攻击路径图谱 ↗
                    </button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
