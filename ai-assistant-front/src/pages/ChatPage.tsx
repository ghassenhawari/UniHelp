import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Bot, User, FileText, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';
import type { Message, AskResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';

const ChatPage: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeSources, setActiveSources] = useState<AskResponse | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem('unihelp_chat_history');
        if (saved) setMessages(JSON.parse(saved));
    }, []);

    useEffect(() => {
        localStorage.setItem('unihelp_chat_history', JSON.stringify(messages));
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: uuidv4(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toISOString(),
            status: 'success'
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await api.ask(userMessage.content);

            const botMessage: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: response.answer,
                timestamp: new Date().toISOString(),
                answer: response,
                status: 'success'
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            const errorMessage: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: "Une erreur est survenue lors de la communication avec le serveur. Vérifiez que le backend et Ollama sont bien lancés.",
                timestamp: new Date().toISOString(),
                status: 'error'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        if (window.confirm('Effacer tout l\'historique ?')) {
            setMessages([]);
            localStorage.removeItem('unihelp_chat_history');
        }
    };

    const steps = [
        "Recherche des règlements officiels...",
        "Lecture du contexte trouvé...",
        "Analyse de votre question...",
        "Rédaction de la réponse UniHelp..."
    ];

    const [loadingStep, setLoadingStep] = useState(0);

    useEffect(() => {
        let interval: any;
        if (isLoading) {
            setLoadingStep(0);
            interval = setInterval(() => {
                setLoadingStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
            }, 6000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    return (
        <div className="flex-1 flex overflow-hidden relative">
            {/* Messages Column */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                            <Bot size={18} />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 leading-none">UniHelp AI</h2>
                            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Assistant RAG Actif</span>
                        </div>
                    </div>
                    <button
                        onClick={clearChat}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Réinitialiser"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>

                {/* Scrollable Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
                    <AnimatePresence initial={false}>
                        {messages.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="max-w-2xl mx-auto text-center py-20"
                            >
                                <div className="inline-flex p-4 rounded-3xl bg-brand-50 text-brand-600 mb-6 font-bold text-2xl rotate-3">
                                    🎓
                                </div>
                                <h3 className="text-3xl font-display font-bold text-slate-900 mb-4 tracking-tight">Bonjour ! Je suis UniHelp.</h3>
                                <p className="text-slate-500 text-lg mb-8 leading-relaxed max-w-md mx-auto">
                                    Posez-moi vos questions sur les règlements, inscriptions et procédures universitaires. Je réponds uniquement à partir des documents officiels.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto">
                                    {['Comment se réinscrire ?', 'Dossier de bourse', 'Recours académiques', 'Soutenance de stage'].map(q => (
                                        <button
                                            key={q}
                                            onClick={() => setInput(q)}
                                            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-left text-sm font-medium hover:border-brand-500 hover:bg-brand-50 transition-all text-slate-700"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            messages.map((msg) => (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg}
                                    onViewSources={() => setActiveSources(msg.answer || null)}
                                />
                            ))
                        )}
                        {isLoading && <LoadingBubble step={steps[loadingStep]} />}
                    </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className="p-4 lg:p-6 bg-white border-t border-slate-100">
                    <div className="max-w-4xl mx-auto relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 to-indigo-500 rounded-2xl blur opacity-10 group-focus-within:opacity-25 transition duration-1000"></div>
                        <div className="relative flex items-end gap-2 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm focus-within:shadow-md focus-within:border-brand-400 transition-all">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                                placeholder="Votre question administrative..."
                                className="flex-1 bg-transparent border-none focus:ring-0 p-3 text-[15px] max-h-40 min-h-[50px] resize-none"
                                rows={1}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className={`p-3 rounded-xl transition-all ${input.trim() ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' : 'bg-slate-100 text-slate-400'
                                    }`}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-3 text-center uppercase tracking-widest font-bold">
                            UniHelp AI · Réponses basées sur documents officiels uniquement
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Intelligence Panel (Sources) */}
            <AnimatePresence>
                {activeSources && (
                    <motion.div
                        initial={{ x: 400 }}
                        animate={{ x: 0 }}
                        exit={{ x: 400 }}
                        className="w-96 bg-slate-50 border-l border-slate-200 p-6 flex flex-col h-full overflow-y-auto hidden xl:flex"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-display font-bold text-xl text-slate-900">Sources & Justification</h3>
                            <button
                                onClick={() => setActiveSources(null)}
                                className="p-1 hover:bg-slate-200 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Confidence Meter */}
                            <div className="p-4 rounded-2xl bg-white shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-3 text-sm font-bold">
                                    <span className="text-slate-600">Confiance RAG</span>
                                    <span className={activeSources.confidence > 0.7 ? 'text-emerald-600' : 'text-amber-600'}>
                                        {(activeSources.confidence * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${activeSources.confidence * 100}%` }}
                                        className={`h-full ${activeSources.confidence > 0.7 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 mt-2 italic">
                                    Calculé à partir de la proximité sémantique moyenne des chunks trouvés.
                                </p>
                            </div>

                            {/* Source List */}
                            <div className="space-y-3">
                                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Documents Consultés</h4>
                                {activeSources.sources.map((src, i) => (
                                    <div key={i} className="group p-4 rounded-2xl bg-white hover:bg-brand-50 border border-slate-100 hover:border-brand-200 transition-all cursor-default">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-brand-100 text-slate-500 group-hover:text-brand-600">
                                                <FileText size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-slate-800 truncate mb-1">{src.documentName}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold uppercase">
                                                        Page {src.pageNumber || 'N/A'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium italic">
                                                        Match: {(src.similarity * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {activeSources.sources.length === 0 && (
                                    <div className="text-center py-10">
                                        <AlertTriangle className="mx-auto text-amber-500 mb-2" size={32} />
                                        <p className="text-sm text-slate-500">Aucune source pertinente trouvée.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Sub-components
const MessageBubble = ({ message, onViewSources }: { message: Message, onViewSources: () => void }) => {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, x: isUser ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`max-w-[85%] lg:max-w-[70%] group flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center gap-2 mb-1 px-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isUser ? 'bg-slate-200 text-slate-600' : 'bg-brand-100 text-brand-600'
                        }`}>
                        {isUser ? <User size={12} /> : <Bot size={12} />}
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                        {isUser ? 'Moi' : 'UniHelp Assistant'}
                    </span>
                    <span className="text-[10px] text-slate-300">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className={`relative px-5 py-4 rounded-3xl text-[15px] leading-relaxed shadow-sm ${isUser
                    ? 'bg-brand-600 text-white rounded-tr-none'
                    : message.status === 'error'
                        ? 'bg-rose-50 text-rose-700 border border-rose-100 rounded-tl-none'
                        : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                    }`}>
                    <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-slate'}`}>
                        <ReactMarkdown>
                            {message.content}
                        </ReactMarkdown>
                    </div>

                    {message.role === 'assistant' && message.answer && (
                        <button
                            onClick={onViewSources}
                            className="mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-full bg-slate-50 hover:bg-brand-50 text-slate-500 hover:text-brand-600 transition-colors border border-slate-100 hover:border-brand-200"
                        >
                            <FileText size={12} />
                            Voir les sources ({message.answer.sources.length})
                            <ChevronRight size={12} />
                        </button>
                    )}
                </div>

                {!isUser && message.answer?.found && (
                    <div className="flex items-center gap-1.5 mt-1.5 px-2 text-emerald-600">
                        <CheckCircle2 size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Information Officielle</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const LoadingBubble = ({ step }: { step: string }) => (
    <div className="flex justify-start">
        <div className="bg-white border border-slate-100 px-6 py-4 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-3">
            <Bot size={16} className="text-brand-400 animate-bounce" />
            <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                    <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-2 h-2 rounded-full bg-brand-400"
                    />
                ))}
            </div>
            <span className="text-[12px] text-slate-400 font-medium italic ml-2">{step}</span>
        </div>
    </div>
);

const X = ({ size }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

export default ChatPage;
