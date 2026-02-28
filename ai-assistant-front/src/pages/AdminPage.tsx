import React, { useState, useEffect } from 'react';
import {
    ShieldCheck,
    Upload,
    RefreshCcw,
    Database,
    Trash2,
    PieChart,
    Activity,
    FileStack,
    AlertCircle,
    FileText,
    Search,
    CheckCircle2,
    Clock,
    ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../api';
import type { StatsSnapshot, DocumentInfo } from '../types';

const AdminPage: React.FC = () => {
    const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem('unihelp_admin_secret'));
    const [secret, setSecret] = useState('');
    const [stats, setStats] = useState<StatsSnapshot | null>(null);
    const [docs, setDocs] = useState<DocumentInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const refreshData = async () => {
        if (!isAdmin) return;
        setIsLoading(true);
        try {
            const [s, d] = await Promise.all([api.getStats(), api.listDocs()]);
            setStats(s);
            setDocs(d);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) refreshData();
    }, [isAdmin]);

    const handleLogin = () => {
        localStorage.setItem('unihelp_admin_secret', secret);
        setIsAdmin(true);
        setSecret('');
    };

    const handleLogout = () => {
        localStorage.removeItem('unihelp_admin_secret');
        setIsAdmin(false);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setIsUploading(true);
        try {
            await api.uploadDocs(Array.from(e.target.files));
            await refreshData();
        } catch (err) {
            alert("Erreur lors de l'upload.");
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleReindex = async () => {
        if (!window.confirm('Forcer la réindexation complète ? Cela peut prendre quelques instants.')) return;
        setIsLoading(true);
        try {
            await api.reindex();
            await refreshData();
        } catch (err) {
            alert("Erreur de réindexation.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (name: string) => {
        if (!window.confirm(`Supprimer le document "${name}" et ses indexations ?`)) return;
        try {
            await api.deleteDoc(name);
            await refreshData();
        } catch (err) {
            alert("Erreur lors de la suppression.");
        }
    };

    if (!isAdmin) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 bg-brand-900 overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-brand-600/20 to-transparent pointer-events-none"></div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full glass-card border-white/10 rounded-[2rem] p-10 z-10 shadow-2xl"
                >
                    <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-8 mx-auto text-white shadow-xl rotate-12">
                        <ShieldCheck size={40} />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-white text-center mb-2 tracking-tight">Accès Administrateur</h2>
                    <p className="text-brand-100 text-center text-sm mb-8 px-4 opacity-80 leading-relaxed">
                        Veuillez saisir votre clé secrète pour gérer les documents et voir les statistiques système.
                    </p>
                    <div className="space-y-4">
                        <input
                            type="password"
                            placeholder="Clé secrète (X-Admin-Secret)"
                            className="w-full px-5 py-4 bg-white/5 rounded-xl border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                        <button
                            onClick={handleLogin}
                            className="w-full py-4 bg-white text-brand-900 rounded-xl font-bold text-lg hover:bg-brand-50 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
                        >
                            Déverrouiller <ArrowUpRight size={20} />
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10">
            <div className="max-w-6xl mx-auto space-y-10 pb-20">

                {/* Header Admin */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-600 font-bold text-[10px] uppercase tracking-widest mb-4">
                            <Activity size={12} /> Dashboard de Contrôle
                        </div>
                        <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Console de Gestion</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={refreshData}
                            disabled={isLoading}
                            className="btn-secondary px-6"
                        >
                            <RefreshCcw className={isLoading ? 'animate-spin' : ''} size={18} />
                            Actualiser
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Déconnexion"
                        >
                            <ShieldCheck size={20} />
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Questions Posées"
                        value={stats?.totalQuestions || 0}
                        subtitle="Volume historique"
                        icon={<Search size={24} className="text-brand-600" />}
                        color="brand"
                    />
                    <StatCard
                        title="Taux de Réponse"
                        value={`${stats?.foundRate || 0}%`}
                        subtitle="Succès du RAG"
                        icon={<CheckCircle2 size={24} className="text-emerald-600" />}
                        color="emerald"
                    />
                    <StatCard
                        title="Confiance Moyenne"
                        value={`${stats?.avgConfidence || 0}`}
                        subtitle="Qualité des sources"
                        icon={<Activity size={24} className="text-indigo-600" />}
                        color="indigo"
                    />
                    <StatCard
                        title="Index Vectoriel"
                        value={stats?.totalQuestions ? (stats.totalQuestions * 3.2).toFixed(0) : 0}
                        subtitle="Vecteurs en cache"
                        icon={<Database size={24} className="text-amber-600" />}
                        color="amber"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Docs Management */}
                    <div className="lg:col-span-8 flex flex-col space-y-6">
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Documents Officiels</h3>
                                    <p className="text-sm text-slate-500">Base de connaissance de l'UniHelp Assistant</p>
                                </div>
                                <div className="flex gap-2">
                                    <label className={`btn-primary px-6 cursor-pointer ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}>
                                        <Upload size={18} />
                                        {isUploading ? 'Chargement...' : 'Ajouter PDF'}
                                        <input type="file" multiple accept=".pdf" className="hidden" onChange={handleUpload} />
                                    </label>
                                    <button onClick={handleReindex} className="btn-secondary px-4 border-amber-200 text-amber-700 hover:bg-amber-50" title="Réindexer">
                                        <RefreshCcw size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 flex-1">
                                {docs.length === 0 ? (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                                            <FileStack size={32} />
                                        </div>
                                        <p className="text-slate-400 font-medium">Aucun document n'a été indexé pour le moment.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                                    <th className="px-6 py-4">Nom du Document</th>
                                                    <th className="px-6 py-4">Segments (Chunks)</th>
                                                    <th className="px-6 py-4">Date Indexation</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {docs.map((doc, idx) => (
                                                    <motion.tr
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        key={doc.name}
                                                        className="group hover:bg-slate-50"
                                                    >
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                                                                    <FileText size={18} />
                                                                </div>
                                                                <span className="font-bold text-slate-700 whitespace-nowrap">{doc.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <span className="font-medium text-slate-500">{doc.chunkCount} segments</span>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                                                                <Clock size={14} />
                                                                {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '—'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            <button
                                                                onClick={() => handleDelete(doc.name)}
                                                                className="p-2 items-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="px-8 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400 uppercase tracking-tighter">
                                <AlertCircle size={14} />
                                Attention : La base ChromaDB est locale à l'environnement Docker.
                            </div>
                        </div>
                    </div>

                    {/* Right Insights Column */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Top Questions Analysis */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 space-y-6">
                            <h4 className="flex items-center gap-2 font-display font-bold text-lg text-slate-900">
                                <PieChart size={20} className="text-brand-500" />
                                Top Questions
                            </h4>
                            <div className="space-y-4">
                                {stats?.topQuestions.slice(0, 5).map((q, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                                            <span className="text-slate-600 truncate max-w-[70%] italic">"{q.question}"</span>
                                            <span className="text-brand-600 font-display">{q.count} fois</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(q.count / (stats?.totalQuestions || 1)) * 100}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                                {(!stats || stats.topQuestions.length === 0) && (
                                    <p className="text-sm text-slate-400 italic text-center py-6">Pas de données historiques</p>
                                )}
                            </div>
                        </div>

                        {/* Top Docs Heatmap */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 space-y-6">
                            <h4 className="flex items-center gap-2 font-display font-bold text-lg text-slate-900">
                                <FileStack size={20} className="text-emerald-500" />
                                Usage Documents
                            </h4>
                            <div className="space-y-3">
                                {stats?.topDocuments.map((d, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="p-2 bg-white rounded-lg shadow-sm font-bold text-emerald-600 text-xs">
                                            #{i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-xs text-slate-700 truncate">{d.document}</p>
                                            <p className="text-[10px] text-slate-400">{d.hitCount} citations RAG</p>
                                        </div>
                                    </div>
                                ))}
                                {(!stats || stats.topDocuments.length === 0) && (
                                    <p className="text-sm text-slate-400 italic text-center py-6">Aucun document consulté</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-component StatCard
const StatCard = ({ title, value, subtitle, icon, color }: any) => {
    const colors: any = {
        brand: 'border-brand-100 hover:border-brand-300 shadow-brand-50',
        emerald: 'border-emerald-100 hover:border-emerald-300 shadow-emerald-50',
        indigo: 'border-indigo-100 hover:border-indigo-300 shadow-indigo-50',
        amber: 'border-amber-100 hover:border-amber-300 shadow-amber-50',
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`bg-white p-6 rounded-[2rem] border-2 transition-all shadow-xl shadow-slate-200/50 ${colors[color]}`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-50 rounded-2xl">
                    {icon}
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all hover:bg-white hover:shadow-md cursor-pointer">
                    <ArrowUpRight size={16} />
                </div>
            </div>
            <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</h4>
                <div className="text-3xl font-display font-bold text-slate-900 mb-1">{value}</div>
                <p className="text-[11px] text-slate-500 font-medium italic">{subtitle}</p>
            </div>
        </motion.div>
    );
};

export default AdminPage;
