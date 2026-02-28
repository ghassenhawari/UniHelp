import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setIsLoading(true);

        try {
            await api.register({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || "Une erreur est survenue lors de l'inscription.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-brand-900 overflow-hidden relative font-sans">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full glass-card border-white/10 rounded-[2.5rem] p-10 z-10 text-center shadow-2xl backdrop-blur-xl"
                >
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-8 mx-auto shadow-xl shadow-emerald-500/20">
                        <CheckCircle2 size={40} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-white mb-4">Inscription réussie !</h2>
                    <p className="text-brand-100/60 mb-8 leading-relaxed">
                        Un email de vérification a été envoyé à <strong>{formData.email}</strong>.
                        Veuillez cliquer sur le lien dans l'email pour activer votre compte.
                    </p>
                    <Link
                        to="/login"
                        className="w-full py-4 bg-white text-brand-900 rounded-2xl font-bold text-lg hover:bg-brand-50 transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={20} /> Retour à la connexion
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-brand-900 overflow-hidden relative font-sans">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-brand-600/20 to-transparent pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full glass-card border-white/10 rounded-[2.5rem] p-10 z-10 shadow-2xl backdrop-blur-xl"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-brand-500/20 rotate-3">
                        <UserPlus size={32} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-white text-center mb-1 tracking-tight">Créer un compte</h2>
                    <p className="text-brand-100/60 text-center text-sm px-4">
                        Rejoignez UniHelp et facilitez vos démarches.
                    </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
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

                    <div className="space-y-3">
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-400 transition-colors" size={18} />
                            <input
                                name="fullName"
                                type="text"
                                required
                                placeholder="Nom complet"
                                className="w-full pl-12 pr-5 py-3.5 bg-white/5 rounded-2xl border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm"
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-400 transition-colors" size={18} />
                            <input
                                name="email"
                                type="email"
                                required
                                placeholder="votre@email.fr"
                                className="w-full pl-12 pr-5 py-3.5 bg-white/5 rounded-2xl border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-400 transition-colors" size={18} />
                            <input
                                name="password"
                                type="password"
                                required
                                placeholder="Mot de passe"
                                className="w-full pl-12 pr-5 py-3.5 bg-white/5 rounded-2xl border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-400 transition-colors" size={18} />
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                placeholder="Confirmer le mot de passe"
                                className="w-full pl-12 pr-5 py-3.5 bg-white/5 rounded-2xl border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-white text-brand-900 rounded-2xl font-bold text-lg hover:bg-brand-50 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] shadow-lg shadow-white/10 disabled:opacity-50 mt-4"
                    >
                        {isLoading ? 'Création...' : (
                            <>
                                S'inscrire <ArrowRight size={20} />
                            </>
                        )}
                    </button>

                    <p className="text-[10px] text-brand-100/30 text-center uppercase tracking-widest font-bold mt-4">
                        En vous inscrivant, vous acceptez nos conditions d'utilisation
                    </p>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-brand-100/40 text-sm">
                        Déjà un compte ?{' '}
                        <Link to="/login" className="text-white font-bold hover:underline decoration-brand-400 underline-offset-4">
                            Connectez-vous
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
