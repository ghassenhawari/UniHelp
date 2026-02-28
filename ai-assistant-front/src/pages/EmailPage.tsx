import React, { useState, useEffect } from 'react';
import { Mail, Copy, Check, RefreshCw, Send, ChevronRight, Info, User, Book, MapPin, AlertCircle, Sparkles, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import type { StudentInfo, EmailGenerateResponse } from '../types';

const EmailPage: React.FC = () => {
    const [emailTypes, setEmailTypes] = useState<any[]>([]);
    const [selectedType, setSelectedType] = useState<string>('attestation');
    const [studentInfo, setStudentInfo] = useState<StudentInfo>({
        fullName: '',
        studentId: '',
        department: '',
        level: '',
    });
    const [extra, setExtra] = useState<Record<string, string>>({});
    const [generated, setGenerated] = useState<EmailGenerateResponse | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        api.getEmailTypes().then(data => setEmailTypes(data.types)).catch(() => { });
    }, []);

    const handleGenerate = async () => {
        if (!studentInfo.fullName || !studentInfo.studentId) return;

        setIsGenerating(true);
        setGenerated(null);
        try {
            const result = await api.generateEmail({
                emailType: selectedType,
                studentInfo,
                extra,
                lang: 'fr'
            });
            setGenerated(result);
        } catch (err) {
            alert("Erreur lors de la génération. Le service de rédaction est peut-être indisponible.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (generated) {
            navigator.clipboard.writeText(`${generated.subject}\n\n${generated.body}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const currentType = emailTypes.find(t => t.id === selectedType);

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-10 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-600 font-bold text-[10px] uppercase tracking-widest mb-4">
                        <Sparkles size={12} /> Rédaction Administrative IA
                    </div>
                    <h1 className="text-4xl font-display font-bold text-slate-900 mb-4 tracking-tight">Générateur de documents</h1>
                    <p className="text-slate-500 text-lg max-w-2xl">
                        Produisez des emails officiels en quelques secondes. Renseignez vos informations et l'IA s'occupe de la structure et du ton administratif.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Form Column */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="glass-card rounded-3xl p-6 lg:p-8 space-y-8">
                            {/* Type Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Nature de la demande</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {emailTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setSelectedType(type.id)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedType === type.id
                                                ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm shadow-brand-100'
                                                : 'bg-white border-slate-100 text-slate-600 hover:border-brand-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${selectedType === type.id ? 'bg-brand-100' : 'bg-slate-50'}`}>
                                                    <Mail size={18} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-sm leading-tight">{type.label}</p>
                                                    <p className="text-[11px] opacity-70 leading-tight mt-1">{type.description}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className={selectedType === type.id ? 'opacity-100' : 'opacity-20'} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-slate-100 w-full" />

                            {/* Student Info */}
                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Informations Étudiant</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <User size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Nom complet"
                                            className="input-field pl-10"
                                            value={studentInfo.fullName}
                                            onChange={(e) => setStudentInfo({ ...studentInfo, fullName: e.target.value })}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Info size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="N° Étudiant / Matricule"
                                            className="input-field pl-10"
                                            value={studentInfo.studentId}
                                            onChange={(e) => setStudentInfo({ ...studentInfo, studentId: e.target.value })}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Book size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Département / Filière"
                                            className="input-field pl-10"
                                            value={studentInfo.department}
                                            onChange={(e) => setStudentInfo({ ...studentInfo, department: e.target.value })}
                                        />
                                    </div>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Année / Niveau (ex: L3, M2)"
                                            className="input-field pl-10"
                                            value={studentInfo.level}
                                            onChange={(e) => setStudentInfo({ ...studentInfo, level: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Extras */}
                            {currentType?.requiredExtras.length > 0 && (
                                <div className="space-y-4">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Précisions supplémentaires</label>
                                    <div className="space-y-3">
                                        {currentType.requiredExtras.map((extraKey: string) => (
                                            <input
                                                key={extraKey}
                                                type="text"
                                                placeholder={`Saisir : ${extraKey.charAt(0).toUpperCase() + extraKey.slice(1)}`}
                                                className="input-field"
                                                onChange={(e) => setExtra({ ...extra, [extraKey]: e.target.value })}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !studentInfo.fullName || !studentInfo.studentId}
                                className={`btn-primary w-full h-14 rounded-2xl text-lg ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={20} />
                                        Rédaction en cours...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        Lancer la génération
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3">
                            <AlertCircle size={20} className="text-amber-500 shrink-0" />
                            <p className="text-[13px] text-amber-800 leading-snug">
                                <strong>Important :</strong> Ce service génère des modèles basés sur les données saisies. Relisez toujours le contenu avant envoi pour garantir l'exactitude des informations.
                            </p>
                        </div>
                    </div>

                    {/* Results Column */}
                    <div className="lg:col-span-7 h-full">
                        <AnimatePresence mode="wait">
                            {!generated && !isGenerating ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full min-h-[500px] border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center"
                                >
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
                                        <Mail size={40} />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-800 mb-2">Prêt à rédiger ?</h4>
                                    <p className="text-slate-500 max-w-sm">
                                        Configurez votre demande à gauche puis cliquez sur "Lancer la génération" pour voir l'aperçu ici.
                                    </p>
                                </motion.div>
                            ) : isGenerating ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full min-h-[500px] bg-white rounded-[2.5rem] p-12 shadow-inner border border-slate-100 flex flex-col items-center justify-center space-y-8"
                                >
                                    <div className="relative">
                                        <div className="w-24 h-24 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
                                        <Bot size={40} className="absolute inset-0 m-auto text-brand-600 animate-pulse" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">L'IA analyse vos informations</h3>
                                        <p className="text-slate-500 italic">Mise en forme du protocole administratif...</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100"
                                >
                                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-slate-900">Modèle de Courriel Généré</h3>
                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Copiez le contenu ci-dessous</p>
                                        </div>
                                        <button
                                            onClick={handleCopy}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm ${copied ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'bg-brand-600 text-white hover:bg-brand-700'
                                                }`}
                                        >
                                            {copied ? <><Check size={16} /> Copié !</> : <><Copy size={16} /> Tout copier</>}
                                        </button>
                                    </div>
                                    <div className="p-8 lg:p-12 space-y-8 min-h-[500px]">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">Objet</label>
                                            <div className="text-lg font-bold text-slate-900 bg-brand-50/30 p-4 rounded-xl border border-brand-100/50">
                                                {generated?.subject}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">Corps du message</label>
                                            <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-[15px] bg-slate-50/50 p-6 lg:p-10 rounded-3xl border border-slate-100 min-h-[300px]">
                                                {generated?.body}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
                                        <Info size={14} />
                                        Généré à {generated ? new Date(generated.generatedAt).toLocaleString() : '—'} · UniHelp Intelligence Service
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailPage;
