import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, Loader2, Bot, X, Trash2, 
  Copy, Check, Brain, Shield, Cpu, HelpCircle, BookOpen 
} from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Topic } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export type RoleMode = 'mentor' | 'feynman' | 'sabatinador' | 'arquiteto';

interface GeminiChatProps {
  onClose?: () => void;
  activeTopic?: Topic | null;
  topics?: Topic[];
}

const ROLES: Record<RoleMode, { name: string; tag: string; icon: React.ReactNode; desc: string }> = {
  mentor: {
    name: 'Mentor Executivo',
    tag: '80/20 & Governança',
    icon: <Sparkles size={13} className="text-amber-400" />,
    desc: 'Visão executiva, priorização e ROI de tecnologia'
  },
  feynman: {
    name: 'Facilitador Feynman',
    tag: 'Primeiros Princípios',
    icon: <Brain size={13} className="text-emerald-400" />,
    desc: 'Explicações intuitivas e desconstrução de jargões'
  },
  sabatinador: {
    name: 'Sabatinador Técnico',
    tag: 'Mock Interview / Board',
    icon: <Shield size={13} className="text-rose-400" />,
    desc: 'Perguntas críticas de desafio técnico e riscos'
  },
  arquiteto: {
    name: 'Arquiteto Staff+',
    tag: 'Arquitetura de Soluções',
    icon: <Cpu size={13} className="text-cyan-400" />,
    desc: 'Padrões de projeto, escalabilidade e observabilidade'
  }
};

const SAMPLE_PROMPTS = [
  "Como priorizar meus estudos em 2026 com a regra 80/20 de Pareto?",
  "Explique a diferença entre NIST AI RMF e ISO 42001 (Feynman)",
  "Simule 3 perguntas de sabatina para Diretor de TI em Segurança e Dados",
  "Quais os trade-offs arquiteturais entre RAG e Fine-Tuning?"
];

export const GeminiChat: React.FC<GeminiChatProps> = ({ onClose, activeTopic, topics = [] }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('racan_gemini_history_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read chat history', e);
    }
    return [
      {
        id: 'init-msg',
        role: 'model',
        text: 'Olá! Sou seu **Mentor Executivo de IA (Gemini 3.8 Flash)** para o RACAN LEARN PLAN 2026.\n\nAplico o **Princípio de Pareto (80/20)** e a **Técnica Feynman** para acelerar seu domínio em **Ciência de Dados**, **Inteligência Artificial & LLMs** e **Cibersegurança**.\n\nQual matéria ou decisão estratégica você deseja explorar agora?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roleMode, setRoleMode] = useState<RoleMode>('mentor');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(activeTopic?.id || 'all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (activeTopic) {
      setSelectedTopicId(activeTopic.id);
    }
  }, [activeTopic]);

  useEffect(() => {
    try {
      localStorage.setItem('racan_gemini_history_v2', JSON.stringify(messages));
    } catch (e) {
      console.warn('Storage limit for chat history', e);
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isLoading) return;

    setErrorMsg(null);
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, newMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      // Find topic context
      const topicObj = topics.find(t => t.id === selectedTopicId) || activeTopic;
      const topicContext = topicObj ? {
        code: topicObj.code,
        title: topicObj.title,
        category: topicObj.category,
        keyPoints: topicObj.studyItems?.map(i => i.title),
      } : undefined;

      // Pass multi-turn history to server-side endpoint
      const payload = {
        messages: newHistory.map(m => ({
          role: m.role,
          content: m.text
        })),
        topicContext,
        roleMode,
        model: 'gemini-3.8-flash'
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Erro HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.success || !data.reply) {
        throw new Error(data.error || 'Resposta vazia do Gemini');
      }

      const replyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, replyMsg]);
    } catch (error: any) {
      console.error('Gemini error:', error);
      setErrorMsg(error.message || 'Falha ao conectar com o Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    const resetList: ChatMessage[] = [
      {
        id: 'reset',
        role: 'model',
        text: 'Histórico limpo. Qual conceito das trilhas do RACAN LEARN PLAN você deseja acelerar agora?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(resetList);
    localStorage.removeItem('racan_gemini_history_v2');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderFormatted = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Bold rendering
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const elements = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-2">
            <span className="text-brand-accent shrink-0 mt-0.5">•</span>
            <span className="text-gray-200">{elements}</span>
          </div>
        );
      }

      if (line.trim().startsWith('### ')) {
        return <h4 key={idx} className="text-xs font-bold text-brand-accent mt-2 mb-0.5">{line.replace('### ', '')}</h4>;
      }
      if (line.trim().startsWith('## ')) {
        return <h3 key={idx} className="text-sm font-bold text-white mt-3 mb-1 border-b border-white/10 pb-0.5">{line.replace('## ', '')}</h3>;
      }

      return (
        <p key={idx} className={`min-h-[1.1rem] ${line.trim() === '' ? 'h-1.5' : ''} text-gray-200 leading-relaxed`}>
          {elements}
        </p>
      );
    });
  };

  return (
    <GlassCard className="h-full flex flex-col relative overflow-hidden border-brand-accent/40 shadow-2xl bg-slate-950/95 backdrop-blur-xl">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-brand-accent to-indigo-500"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-brand-primary to-brand-accent rounded-xl text-white shadow-md">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">Mentor Executivo Gemini</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-brand-primary/30 text-brand-accent border border-brand-primary/40">
                gemini-3.8-flash
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Multi-turn • Princípio 80/20 & Técnica Feynman</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleClearHistory}
            title="Limpar conversa"
            className="p-1.5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 rounded-lg transition-colors"
          >
            <Trash2 size={15} />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Role and Context Bar */}
      <div className="py-2 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        {/* Role Pills */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5">
          {(Object.keys(ROLES) as RoleMode[]).map(mode => {
            const role = ROLES[mode];
            const active = roleMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setRoleMode(mode)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
                  active
                    ? 'bg-brand-primary/40 text-brand-accent border border-brand-accent/50'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                }`}
                title={role.desc}
              >
                {role.icon}
                <span>{role.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Topic Context Dropdown */}
        {topics.length > 0 && (
          <div className="flex items-center gap-1 text-gray-400 shrink-0">
            <BookOpen size={12} />
            <select
              value={selectedTopicId}
              onChange={e => setSelectedTopicId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-md px-1.5 py-0.5 text-[10px] text-gray-300 focus:outline-none focus:border-brand-accent max-w-[150px] truncate"
            >
              <option value="all">Todas as matérias</option>
              {topics.map(t => (
                <option key={t.id} value={t.id}>[{t.code}] {t.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Quick Prompts Suggestions */}
      {messages.length <= 2 && (
        <div className="flex gap-1.5 overflow-x-auto py-2 custom-scrollbar">
          {SAMPLE_PROMPTS.map((sp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sp)}
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white whitespace-nowrap transition-colors shrink-0 flex items-center gap-1"
            >
              <HelpCircle size={11} className="text-brand-accent" />
              <span>{sp}</span>
            </button>
          ))}
        </div>
      )}

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1 custom-scrollbar min-h-[240px] max-h-[420px]">
        {messages.map((msg) => {
          const isModel = msg.role === 'model';
          return (
            <div key={msg.id} className={`flex ${isModel ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed group relative shadow-md ${
                isModel 
                  ? 'bg-slate-900/90 text-gray-200 border border-white/10 rounded-tl-sm' 
                  : 'bg-brand-primary text-white rounded-tr-sm border border-brand-accent/30'
              }`}>
                {isModel && (
                  <div className="flex items-center justify-between gap-1.5 mb-1 text-brand-accent opacity-90 pb-1 border-b border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Bot size={13} />
                      <span className="text-[10px] uppercase font-mono tracking-wider">
                        {ROLES[roleMode]?.tag || 'MENTOR RACAN'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity text-[10px] text-gray-400 flex items-center gap-1"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check size={11} className="text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                <div className="space-y-1">
                  {renderFormatted(msg.text)}
                </div>

                <div className={`text-[9px] text-gray-500 mt-1 ${isModel ? 'text-left' : 'text-right'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-900/90 border border-white/10 p-3 rounded-2xl rounded-tl-sm flex items-center gap-2.5">
              <Loader2 size={15} className="animate-spin text-brand-accent" />
              <span className="text-xs text-gray-400 font-medium">Gemini 3.8 Flash sintetizando resposta executiva...</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="pt-2 border-t border-white/10">
        <div className="relative">
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Pergunte ao Gemini sobre conceitos 80/20, arquitetura ou simulação de sabatinas..."
            className="w-full bg-slate-950/80 border border-white/20 rounded-xl py-2 pl-3 pr-12 text-xs text-white focus:outline-none focus:border-brand-accent resize-none placeholder-gray-500 transition-colors"
            disabled={isLoading}
          />
          <button 
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-lg transition-all shadow-md disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
            title="Enviar mensagem"
          >
            <Send size={13} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-gray-500">
          <span>Enter para enviar • Shift + Enter para quebra</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Gemini Conectado
          </span>
        </div>
      </div>
    </GlassCard>
  );
};
