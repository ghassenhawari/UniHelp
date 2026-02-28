import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import {
    MessageSquare,
    Mail,
    BookOpen,
    ShieldCheck,
    Menu,
    X,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './api';
import type { HealthStatus } from './types';

const AppLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const navigate = useNavigate();
    const user = api.getCurrentUser();

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const data = await api.checkHealth();
                setHealth(data);
            } catch (err) {
                setHealth({ status: 'error' } as any);
            }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        api.logoutLocal();
        navigate('/login');
    };

    const navItems = [
        { to: '/app', icon: MessageSquare, label: 'Chat Assist' },
        { to: '/app/emails', icon: Mail, label: 'Générateur Email' },
        { to: '/app/sources', icon: BookOpen, label: 'Sources & Docs' },
        { to: '/app/admin', icon: ShieldCheck, label: 'Administration' },
    ];

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.aside
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                        className="w-72 bg-white border-r border-slate-200 flex flex-col h-full z-20 shadow-xl lg:shadow-none absolute lg:relative"
                    >
                        {/* Logo */}
                        <div className="p-6 flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-200 rotate-3">
                                <span className="text-white font-display font-bold text-xl">U</span>
                            </div>
                            <div>
                                <h1 className="font-display font-bold text-xl tracking-tight text-slate-900">UniHelp</h1>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-brand-600">Assistant Officiel</p>
                            </div>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="ml-auto p-2 hover:bg-slate-100 rounded-lg lg:hidden"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-4 py-4 space-y-2">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `nav-link ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <item.icon size={22} className="text-slate-400 group-[.active]:text-white" />
                                    <span className="font-medium">{item.label}</span>
                                </NavLink>
                            ))}
                        </nav>

                        {/* Footer / Status / User */}
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 space-y-3">
                            {/* User Profile */}
                            {user && (
                                <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                                        {user.fullName.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-xs truncate leading-none mb-1">{user.fullName}</p>
                                        <p className="text-[9px] text-white/70 uppercase tracking-widest">{user.role}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                        title="Déconnexion"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-slate-100 shadow-sm">
                                <div className={`w-2 h-2 rounded-full animate-pulse ${health?.status === 'ok' ? 'bg-emerald-500' :
                                    health?.status === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'
                                    }`} />
                                <div className="flex-1 text-[11px]">
                                    <p className="font-bold text-slate-700">Ollama Status</p>
                                    <p className="text-slate-500 truncate">{health?.services?.ollama?.model || 'Connexion...'}</p>
                                </div>
                                {health?.status === 'error' && <AlertCircle size={14} className="text-rose-500" />}
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-white lg:bg-slate-50 relative">
                {/* Top Header Mobile */}
                <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 flex items-center lg:hidden sticky top-0 z-10">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="ml-4 font-display font-bold text-lg">UniHelp</div>
                </header>

                {/* Content Outlet */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AppLayout;
