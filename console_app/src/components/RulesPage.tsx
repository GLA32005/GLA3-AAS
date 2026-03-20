import { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function RulesPage() {
    const [rules, setRules] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>(null);

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/rules')
          .then(res => {
              setRules(res.data.rules);
              setMeta(res.data);
          })
          .catch(err => console.error("Failed to fetch rules:", err));
      }, []);

    if (!meta) return null;

    return (
        <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-medium text-zinc-800 tracking-tight flex items-center gap-2">
                        <Layers className="text-zinc-600" strokeWidth={1} />
                        检测规则基线
                    </h2>
                    <p className="text-[12px] text-zinc-500 mt-1">云端规则集与本地离线 ONNX 隔离模型状态</p>
                </div>
                
                <div className="flex gap-4 text-right">
                    <div>
                         <div className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1">规则版本</div>
                         <div className="text-sm font-medium text-zinc-700">{meta.version}</div>
                    </div>
                    <div>
                         <div className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1">最近同步时间</div>
                         <div className="text-sm font-mono text-zinc-600">{meta.last_sync}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-8 bg-white border-[0.5px] border-zinc-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b-[0.5px] border-zinc-200 bg-zinc-50 flex justify-between items-center">
                        <h3 className="text-[13px] font-medium text-zinc-700">启发式规则集 (Heuristics)</h3>
                        <span className="text-[11px] text-zinc-500 bg-white border border-zinc-200 px-2 py-0.5 rounded shadow-sm">共 {rules.length} 条启停规则</span>
                    </div>
                    <ul className="divide-y-[0.5px] divide-zinc-100">
                        {rules.map((rule: any) => (
                            <li key={rule.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    {rule.enabled ? (
                                        <CheckCircle2 size={16} strokeWidth={1.5} className="text-[#185b46]" />
                                    ) : (
                                        <XCircle size={16} strokeWidth={1.5} className="text-zinc-300" />
                                    )}
                                    <span className={cn("text-[13px] font-medium", rule.enabled ? "text-zinc-700" : "text-zinc-400")}>
                                        {rule.name}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 font-mono px-1.5 py-0.5 border border-zinc-200 rounded bg-white">{rule.id}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                     <span className="text-[11px] text-zinc-500">命中频度: <span className="font-mono">{rule.hits}</span> 次</span>
                                     <div className={cn("w-8 h-4 rounded-full flex items-center px-0.5 cursor-pointer transition-colors", rule.enabled ? "bg-[#b4b2e8] justify-end" : "bg-zinc-200 justify-start")}>
                                         <div className="w-3 h-3 rounded-full bg-white shadow-sm"></div>
                                     </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="col-span-4 space-y-6">
                    <div className="bg-[#f8fafc] border-[0.5px] border-[#b4b2e8]/40 rounded-lg p-5 shadow-sm">
                        <h3 className="text-[13px] font-medium text-[#323282] mb-4">ONNX AI 语义检测引擎</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[12px] text-zinc-500">加载模型</span>
                                <span className="text-[11px] font-mono text-zinc-700 bg-white border border-zinc-200 px-1.5 rounded">{meta.onnx_model.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[12px] text-zinc-500">评估准确率</span>
                                <span className="text-[12px] font-medium text-[#185b46]">{meta.onnx_model.accuracy}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[12px] text-zinc-500">误报控制 (FPR)</span>
                                <span className="text-[12px] font-medium text-[#8d5b2d]">{meta.onnx_model.fp_rate}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[12px] text-zinc-500">内存占用</span>
                                <span className="text-[12px] font-medium text-zinc-600">{meta.onnx_model.size}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
