import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { cn } from '../lib/utils';

interface LoginPageProps {
    onLoginSuccess: (token: string) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }

        setLoading(true);
        try {
            const resp = await axios.post('http://127.0.0.1:8000/api/auth/login', {
                username,
                password
            });
            if (resp.data.status === 'success' && resp.data.token) {
                onLoginSuccess(resp.data.token);
            } else {
                setError('Authentication failed. Valid token not received.');
            }
        } catch (err: any) {
            if (err.response && err.response.status === 401) {
                setError('Incorrect username or password. (Hint: admin / admin123)');
            } else {
                setError('Network error. Is the backend server running?');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-purple-500/30">
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4c1d95] rounded-full blur-[120px] opacity-20 mix-blend-screen"></div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="flex justify-center flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4c1d95] to-[#6d28d9] flex justify-center items-center shadow-lg shadow-purple-900/50 mb-6">
                        <Shield className="text-white" size={32} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-center text-3xl font-bold tracking-tight text-white mb-2">
                        AgentSec
                    </h2>
                    <p className="text-center text-[13px] text-zinc-400 font-mono tracking-widest uppercase">
                        Zero-Trust A.I. Governance
                    </p>
                </div>

                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[400px]">
                    <div className="bg-zinc-900/80 backdrop-blur-xl py-10 px-6 shadow-2xl rounded-2xl border border-zinc-800/80">
                        <form className="space-y-6" onSubmit={handleLogin}>
                            <div>
                                <label className="block text-[12px] font-medium text-zinc-400 mb-2 uppercase tracking-wide">
                                    Username
                                </label>
                                <div className="mt-1 relative">
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3 border border-zinc-700 rounded-xl bg-zinc-950/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#4c1d95] focus:border-transparent transition-all sm:text-sm"
                                        placeholder="Enter admin"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[12px] font-medium text-zinc-400 mb-2 uppercase tracking-wide">
                                    Password
                                </label>
                                <div className="mt-1 relative">
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3 border border-zinc-700 rounded-xl bg-zinc-950/50 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#4c1d95] focus:border-transparent transition-all sm:text-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            
                            {error && (
                                <div className="rounded-lg bg-red-950/30 p-3 border border-red-900/50 flex animate-in fade-in duration-300">
                                    <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={16} />
                                    <div className="ml-3">
                                        <p className="text-[12px] text-red-200">
                                            {error}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-[#4c1d95] hover:bg-[#5b21b6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-[#4c1d95] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <>
                                            <Lock size={16} />
                                            Sign In to Console
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                        
                        <div className="mt-8 text-center text-[11px] text-zinc-600 font-mono">
                            <p>For MVP Review: Use admin / admin123</p>
                            <p className="mt-2 text-zinc-700">Protected by AgentSec Auth Layer v1.5</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
