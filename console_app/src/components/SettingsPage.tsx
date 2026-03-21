import { Settings, Save, Shield, RefreshCcw, Database, UserCheck, Globe, Bell, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { cn } from '../lib/utils';
import { API_ENDPOINTS } from '../lib/api';

export function SettingsPage() {
    const [globalConfig, setGlobalConfig] = useState({
        default_mode: 'block',
        onnx_enabled: true,
        cloud_api_enabled: false,
        human_review_enabled: false,
        sync_interval: 60
    });
    const [pushConfig, setPushConfig] = useState({
        webhook_url: '',
        critical_only: true,
        enabled: true
    });
    const [saveStatus, setSaveStatus] = useState<null | 'saving' | 'saved'>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const [globalRes, pushRes] = await Promise.all([
                    axios.get(`${API_ENDPOINTS.SETTINGS}/global`),
                    axios.get(`${API_ENDPOINTS.SETTINGS}/push`)
                ]);
                setGlobalConfig(globalRes.data);
                setPushConfig(pushRes.data);
            } catch (err) {
                console.error("Failed to fetch settings:", err);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaveStatus('saving');
        try {
            await Promise.all([
                axios.post(`${API_ENDPOINTS.SETTINGS}/global`, globalConfig),
                axios.post(`${API_ENDPOINTS.SETTINGS}/push`, pushConfig)
            ]);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 2000);
        } catch (err) {
            console.error("Save failed:", err);
            setSaveStatus(null);
        }
    };

    return (
        <div className="p-8 space-y-6 max-w-[1000px] mx-auto animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-medium text-zinc-800 tracking-tight flex items-center gap-2">
                        <Settings className="text-zinc-600" strokeWidth={1} />
                        系统级配置
                    </h2>
                    <p className="text-[12px] text-zinc-500 mt-1">调整 AgentSec 处理大盘全局行为及 SDK 节点安全策略推送</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 text-[13px] font-medium rounded-md shadow-lg transition-all",
                        saveStatus === 'saved' ? "bg-emerald-600 text-white shadow-emerald-100" : "bg-[#4c1d95] text-white shadow-purple-100 hover:bg-[#3b157a]"
                    )}
                >
                    {saveStatus === 'saved' ? <CheckCircle2 size={14} /> : <Save size={14} strokeWidth={2} />}
                    {saveStatus === 'saving' ? '正在同步...' : (saveStatus === 'saved' ? '已更新至全球节点' : '下发全局变更 ↗')}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Left Column: Logic & Sync */}
                <div className="space-y-6">
                    <div className="bg-white border-[0.5px] border-zinc-200 rounded-lg p-6 shadow-sm space-y-5">
                        <h3 className="text-[13px] font-bold text-zinc-800 flex items-center gap-2 mb-2 uppercase tracking-widest">
                            <Shield size={14} className="text-indigo-500" />
                            检测策略重心
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[12px] font-medium text-zinc-700">默认运行模式 (Default Mode)</div>
                                    <div className="text-[10px] text-zinc-400 mt-0.5">warn = 仅审计，block = 实时拦截风险载荷。</div>
                                </div>
                                <div className="flex border border-zinc-200 rounded-md overflow-hidden text-[10px] font-bold">
                                    <button 
                                        onClick={() => setGlobalConfig({...globalConfig, default_mode: 'warn'})}
                                        className={cn(
                                            "px-3 py-1.5 transition-colors border-r border-zinc-200 uppercase",
                                            globalConfig.default_mode === 'warn' ? "bg-indigo-50 text-indigo-600" : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100"
                                        )}
                                    >Warn</button>
                                    <button 
                                        onClick={() => setGlobalConfig({...globalConfig, default_mode: 'block'})}
                                        className={cn(
                                            "px-3 py-1.5 transition-colors uppercase",
                                            globalConfig.default_mode === 'block' ? "bg-indigo-50 text-indigo-600" : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100"
                                        )}
                                    >Block</button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[12px] font-medium text-zinc-700 flex items-center gap-1.5">
                                        <Database size={11} className="text-zinc-400" />
                                        ONNX 离线推理引擎
                                    </div>
                                    <div className="text-[10px] text-zinc-400 mt-0.5">启用本地蒸馏模型进行异步语义检测，不产生网络延迟。</div>
                                </div>
                                <div 
                                    onClick={() => setGlobalConfig({...globalConfig, onnx_enabled: !globalConfig.onnx_enabled})}
                                    className={cn(
                                        "w-8 h-4 rounded-full flex items-center px-0.5 cursor-pointer transition-all shadow-inner",
                                        globalConfig.onnx_enabled ? "bg-emerald-500 justify-end" : "bg-zinc-200 justify-start"
                                    )}
                                >
                                    <div className="w-3 h-3 rounded-full bg-white shadow-sm"></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[12px] font-medium text-zinc-700 flex items-center gap-1.5">
                                        <Globe size={11} className="text-zinc-400" />
                                        云端检测 API (Opt-in)
                                    </div>
                                    <div className="text-[10px] text-zinc-400 mt-0.5">将匿名特征上传至 AgentSec 安全云，获取最高精度防护。</div>
                                </div>
                                <div 
                                    onClick={() => setGlobalConfig({...globalConfig, cloud_api_enabled: !globalConfig.cloud_api_enabled})}
                                    className={cn(
                                        "w-8 h-4 rounded-full flex items-center px-0.5 cursor-pointer transition-all shadow-inner",
                                        globalConfig.cloud_api_enabled ? "bg-emerald-500 justify-end" : "bg-zinc-200 justify-start"
                                    )}
                                >
                                    <div className="w-3 h-3 rounded-full bg-white shadow-sm"></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[12px] font-medium text-zinc-700 flex items-center gap-1.5">
                                        <UserCheck size={11} className="text-zinc-400" />
                                        人工审核介入层
                                    </div>
                                    <div className="text-[10px] text-zinc-400 mt-0.5">针对 delete/email 等高危 Tool 强制挂起并推送人工决策。</div>
                                </div>
                                <div 
                                    onClick={() => setGlobalConfig({...globalConfig, human_review_enabled: !globalConfig.human_review_enabled})}
                                    className={cn(
                                        "w-8 h-4 rounded-full flex items-center px-0.5 cursor-pointer transition-all shadow-inner",
                                        globalConfig.human_review_enabled ? "bg-emerald-500 justify-end" : "bg-zinc-200 justify-start"
                                    )}
                                >
                                    <div className="w-3 h-3 rounded-full bg-white shadow-sm"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border-[0.5px] border-zinc-200 rounded-lg p-6 shadow-sm space-y-5">
                        <h3 className="text-[13px] font-bold text-zinc-800 flex items-center gap-2 mb-2 uppercase tracking-widest">
                            <RefreshCcw size={14} className="text-indigo-500" />
                            规则同步计划
                        </h3>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">同步模式</label>
                                <select className="px-3 py-2 text-[12px] bg-zinc-50 border border-zinc-200 rounded-md outline-none focus:border-indigo-300 transition-all font-sans">
                                    <option>在线自动同步 (AgentSec Default)</option>
                                    <option>内网私有源同步</option>
                                    <option>Air-gapped 完全离线手动上传</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">同步频率评估</label>
                                    <span className="text-[11px] font-bold text-indigo-600 tabular-nums bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{globalConfig.sync_interval} Mins</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="15" 
                                    max="240" 
                                    step="15" 
                                    value={globalConfig.sync_interval} 
                                    onChange={(e) => setGlobalConfig({...globalConfig, sync_interval: Number(e.target.value)})}
                                    className="w-full accent-indigo-600 h-1 bg-zinc-100 rounded-lg cursor-pointer" 
                                />
                                <p className="text-[10px] text-zinc-400">目前 v2.41 规则包约每小时更新一次全局威胁指纹。</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Alerts & Data */}
                <div className="space-y-6">
                    <div className="bg-white border-[0.5px] border-zinc-200 rounded-lg p-6 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-[13px] font-bold text-zinc-800 mb-4 border-b border-zinc-100 pb-2 uppercase tracking-widest">告警触达 (Webhook)</h3>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1.5 cursor-text">
                                    <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">SDK 数据回流端点</label>
                                    <input type="text" readOnly value={`${API_ENDPOINTS.AGENTS.replace('/agents', '/sdk/events')}`} className="px-3 py-2 text-[12px] bg-zinc-50 border border-zinc-200 rounded-md font-mono text-zinc-500 outline-none select-all" />
                                    <p className="text-[10px] text-zinc-400">所有纳管 Agent 必须配置此地址作为 security_callback 的远端汇聚点。</p>
                                </div>
                                <div className="flex flex-col gap-1.5 cursor-text">
                                    <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                                        <span>企业级 IM 机器人推送 (SOP)</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-zinc-400 font-normal lowercase">启用推送</span>
                                            <input 
                                                type="checkbox" 
                                                checked={pushConfig.enabled} 
                                                onChange={(e) => setPushConfig({...pushConfig, enabled: e.target.checked})}
                                                className="w-3 h-3 accent-indigo-600"
                                            />
                                        </div>
                                    </label>
                                    <div className="relative group">
                                        <input 
                                            type="text" 
                                            value={pushConfig.webhook_url}
                                            onChange={(e) => setPushConfig({...pushConfig, webhook_url: e.target.value})}
                                            placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..." 
                                            className="w-full px-3 py-2 text-[12px] bg-white border border-zinc-200 rounded-md focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 outline-none transition-all placeholder:text-zinc-300 pr-10" 
                                        />
                                        <Bell size={14} className="absolute right-3 top-2.5 text-zinc-300 group-focus-within:text-indigo-400" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between bg-zinc-50 p-3 rounded-md border border-zinc-100">
                                    <div>
                                        <div className="text-[11px] font-medium text-zinc-700">推送频率限制</div>
                                        <div className="text-[10px] text-zinc-400 mt-0.5">仅在 Critical 级别风险发生时立即触发推送。</div>
                                    </div>
                                    <button 
                                        onClick={() => setPushConfig({...pushConfig, critical_only: !pushConfig.critical_only})}
                                        className={cn(
                                            "text-[10px] px-2 py-1 rounded border transition-all font-bold",
                                            pushConfig.critical_only ? "bg-red-50 text-red-600 border-red-200" : "bg-zinc-200 text-zinc-500 border-zinc-300"
                                        )}
                                    >
                                        {pushConfig.critical_only ? 'LEVEL: CRITICAL' : 'ALL EVENTS'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[13px] font-bold text-zinc-800 mb-4 border-b border-zinc-100 pb-2 uppercase tracking-widest">隐私与脱敏隔离</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[12px] font-medium text-zinc-700">Payload 载荷哈希化 (Masking)</div>
                                        <div className="text-[10px] text-zinc-400 mt-0.5">在告警日志中隐匿具体的非法指令文本，仅作指纹留存。</div>
                                    </div>
                                    <div className="w-8 h-4 rounded-full bg-indigo-500 flex items-center px-0.5 cursor-pointer justify-end shadow-inner">
                                        <div className="w-3 h-3 rounded-full bg-white shadow-sm"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[12px] font-medium text-zinc-700">敏感数据 0 存储 (Zero-Store)</div>
                                        <div className="text-[10px] text-zinc-400 mt-0.5">启用后，控制台数据库不保存任何用户 Prompt 明文。</div>
                                    </div>
                                    <div className="w-8 h-4 rounded-full bg-zinc-200 flex items-center px-0.5 cursor-pointer justify-start shadow-inner">
                                        <div className="w-3 h-3 rounded-full bg-white shadow-sm"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-[11px] text-zinc-500 leading-relaxed italic">
                        注意：修改全局配置后，所有在线连接的 SDK 节点将在下个同步周期内（约 15s 后）热加载生效。高风险变更建议先在灰度环境验证。
                    </div>
                </div>
            </div>
        </div>
    );
}
