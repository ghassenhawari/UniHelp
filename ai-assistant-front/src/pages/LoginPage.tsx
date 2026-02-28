import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await api.login(email, password);
            navigate('/app');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur de connexion. Vérifiez vos identifiants.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-brand-900 overflow-hidden relative font-sans">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-brand-600/20 to-transparent pointer-events-none"></div>
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/20 rounded-full blur-[100px]"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full glass-card border-white/10 rounded-[2.5rem] p-10 z-10 shadow-2xl backdrop-blur-xl"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-brand-400 to-brand-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-brand-500/20 rotate-3">
                        <LogIn size={40} className="text-white" />
                    </div>
                    <h2 className="text-4xl font-display font-bold text-white text-center mb-2 tracking-tight">Bon retour !</h2>
                    <p className="text-brand-100/60 text-center text-sm px-4">
                        Connectez-vous pour accéder à votre assistant UniHelp.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-200 text-sm"
                        >
                            <AlertCircle size={18} className="shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    <div className="space-y-4">
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-400 transition-colors" size={20} />
                            <input
                                type="email"
                                required
                                placeholder="votre@email.fr"
                                className="w-full pl-12 pr-5 py-4 bg-white/5 rounded-2xl border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all font-medium"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-400 transition-colors" size={20} />
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full pl-12 pr-5 py-4 bg-white/5 rounded-2xl border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all font-medium"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Link to="/forgot-password" className="text-xs font-bold text-brand-300 hover:text-white transition-colors">
                            Mot de passe oublié ?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-white text-brand-900 rounded-2xl font-bold text-lg hover:bg-brand-50 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] shadow-lg shadow-white/10 disabled:opacity-50"
                    >
                        {isLoading ? 'Connexion...' : (
                            <>
                                Se connecter <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-white/5 text-center">
                    <p className="text-brand-100/40 text-sm">
                        Pas encore de compte ?{' '}
                        <Link to="/register" className="text-white font-bold hover:underline decoration-brand-400 underline-offset-4 flex items-center justify-center gap-1 mt-2 group">
                            <UserPlus size={16} className="text-brand-400 group-hover:scale-110 transition-transform" /> Créer un compte
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
