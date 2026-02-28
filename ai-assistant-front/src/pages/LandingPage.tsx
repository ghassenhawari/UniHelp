import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Cpu,
    Zap,
    Shield,
    Rocket,
    ArrowRight,
    GraduationCap,
    FileText,
    MessageSquare
} from 'lucide-react';
import { api } from '../api';

const LandingPage: React.FC = () => {
    const user = api.getCurrentUser();

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-brand-500/30 overflow-x-hidden">
            {/* Header / Navbar */}
            <header className="fixed top-0 w-full z-50 px-8 py-6 backdrop-blur-xl border-b border-white/5 bg-transparent">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                            <Cpu size={24} className="text-white" />
                        </div>
                        <span className="text-2xl font-display font-bold tracking-tight">UniHelp <span className="text-brand-400">AI</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-10">
                        <a href="#demo" className="text-sm font-medium hover:text-brand-400 transition-colors">Démo</a>
                        <a href="#features" className="text-sm font-medium hover:text-brand-400 transition-colors">Fonctionnalités</a>
                        {user ? (
                            <Link to="/app" className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 rounded-full text-sm font-bold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2">
                                Accéder au Dashboard <ArrowRight size={16} />
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-bold transition-all">Connexion</Link>
                                <Link to="/register" className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 rounded-full text-sm font-bold shadow-lg shadow-brand-500/20 transition-all">S'inscrire</Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-48 pb-32 px-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-600/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500/10 border border-brand-500/20 rounded-full text-brand-400 text-sm font-bold mb-8">
                            <Zap size={14} className="fill-current" />
                            <span>Propulsé par Llama 3.2 (Ollama)</span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-display font-black leading-[0.9] mb-8 tracking-tighter">
                            L'IA qui simplifie <br />
                            <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">votre vie</span> <br />
                            universitaire.
                        </h1>

                        <p className="text-xl text-slate-400 leading-relaxed mb-10 max-w-xl">
                            UniHelp analyse les règlements complexes, décode les procédures administratives et répond à vos questions en quelques secondes.
                            Finis les emails perdus et les recherches interminables.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to={user ? "/app" : "/register"}
                                className="px-10 py-5 bg-brand-500 hover:bg-brand-400 rounded-2xl flex items-center justify-center gap-3 font-bold text-xl shadow-2xl shadow-brand-500/20 transition-all group"
                            >
                                {user ? "Aller au Chat" : "Commencer maintenant"} <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a href="#demo" className="px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-xl transition-all flex items-center justify-center">
                                Voir la démo
                            </a>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="relative z-10 p-2 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl skew-y-3 hover:skew-y-0 transition-transform duration-700">
                            <img
                                src="/unihelp_hero_image_premium_1772252792916.png"
                                alt="Dashboard preview"
                                className="rounded-[2rem] shadow-2xl w-full h-auto brightness-90"
                            />

                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="absolute -top-10 -right-10 bg-indigo-500 p-6 rounded-2xl shadow-xl flex items-center gap-4 border border-white/10"
                            >
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <FileText size={20} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-white/60 tracking-widest">Indexé</p>
                                    <p className="text-lg font-black text-white">+45 Documents</p>
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 20, 0] }}
                                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                                className="absolute -bottom-10 -left-10 p-6 rounded-2xl shadow-xl flex items-center gap-4 bg-white/10 backdrop-blur-2xl border border-white/20"
                            >
                                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                    <MessageSquare size={20} className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest">En ligne</p>
                                    <p className="text-lg font-black text-white">Prêt à répondre</p>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section id="features" className="py-24 bg-brand-900/50 relative">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-display font-black mb-6">Tout ce dont vous avez besoin.</h2>
                        <div className="w-24 h-2 bg-brand-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: GraduationCap,
                                title: "Réponses Officielles",
                                desc: "L'IA ne base ses réponses que sur vos documents officiels. Pas d'hallucinations.",
                                color: "bg-blue-500"
                            },
                            {
                                icon: Rocket,
                                title: "Générateur d'Email",
                                desc: "Besoin de justifier une absence ou de demander un stage ? Générez l'email parfait.",
                                color: "bg-purple-500"
                            },
                            {
                                icon: Shield,
                                title: "Sécurité Maximale",
                                desc: "Vos documents et vos données sont protégés dans un environnement sécurisé.",
                                color: "bg-brand-500"
                            }
                        ].map((feat, i) => (
                            <div key={i} className="group p-10 bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2rem] hover:bg-white/10 transition-all">
                                <div className={`w-14 h-14 ${feat.color} rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                                    <feat.icon size={28} className="text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{feat.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="py-20 border-t border-white/5 text-center bg-[#020617]">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="flex items-center justify-center gap-2 mb-10">
                        <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center">
                            <Cpu size={28} className="text-white" />
                        </div>
                        <span className="text-3xl font-display font-bold tracking-tight">UniHelp AI</span>
                    </div>
                    <p className="text-slate-500 mb-10 max-w-lg mx-auto">
                        Conçu pour les étudiants, par une équipe passionnée par l'innovation universitaire.
                        Hackathon Project 2024.
                    </p>
                    <div className="flex items-center justify-center gap-8 mb-16">
                        <Link to="/" className="text-slate-400 hover:text-white transition-colors">Politique de confidentialité</Link>
                        <a href="https://github.com" className="text-slate-400 hover:text-white transition-colors">GitHub</a>
                        <Link to="/" className="text-slate-400 hover:text-white transition-colors">Contact</Link>
                    </div>
                    <div className="text-slate-600 text-[10px] uppercase tracking-[0.2em] font-black">
                        © 2024 UniHelp AI · System Status: Operational
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
