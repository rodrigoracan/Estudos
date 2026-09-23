import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, Sparkles, Trash2, Bot, User as UserIcon, 
  Copy, Check, BookOpen, ChevronDown, RefreshCw, AlertCircle,
  HelpCircle, Shield, Brain, Cpu, MessageSquare
} from 'lucide-react';
import { Topic } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export type RoleMode = 'mentor' | 'feynman' | 'sabatinador' | 'arquiteto';

interface GeminiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTopic?: Topic | null;
  topics?: Topic[];
}

const ROLE_DEFINITIONS: Record<RoleMode, { label: string; desc: string; icon: React.ReactNode }> = {
  mentor: {
    label: 'Mentor Executivo (80/20)',
    desc: 'Visão estratégica, ROI, governança e liderança em TI',
    icon: <Sparkles size={14} className="text-amber-400" />
  },
  feynman: {
    label: 'Facilitador Feynman',
    desc: 'Explicações cristalinas pelos primeiros princípios',
    icon: <Brain size={14} className="text-emerald-400" />
  },
  sabatinador: {
    label: 'Sabatinador Executivo',
    desc: 'Simulações de entrevistas e perguntas desafiadoras',
    icon: <Shield size={14} className="text-rose-400" />
  },
  arquiteto: {
    label: 'Arquiteto de Soluções (Staff+)',
    desc: 'Padrões de projeto, escalabilidade e trade-offs técnicos',
    icon: <Cpu size={14} className="text-cyan-400" />
  }
};

const SUGGESTED_QUESTIONS = [
  "Qual o 80/20 essencial de Big Data para um Diretor de TI?",
  "Como justificar o ROI de RAG versus Fine-Tuning de LLMs?",
  "Quais os 3 pilares de Zero Trust para apresentar ao Board?",
  "Simule 3 perguntas difíceis sobre MLOps e Data Drift"
];

export const GeminiChatModal: React.FC<GeminiChatModalProps> = ({
  isOpen,
  onClose,
  activeTopic,
  topics = []
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('racan_gemini_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
    return [
      {
        id: 'welcome',
        role: 'model',
        content: `Olá! Sou seu **Mentor Executivo de IA (Gemini 3.8 Flash)**.\n\nEstou aqui para acelerar sua trilha de liderança em **Ciência de Dados, IA & LLMs e Cibersegurança** aplicando a regra **80/20 de Pareto** e a **Técnica Feynman**.\n\nComo posso ajudar seus estudos ou tomadas de decisão técnica hoje?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleMode, setRoleMode] = useState<RoleMode>('mentor');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(activeTopic?.id || 'all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modelChoice, setModelChoice] = useState<string>('gemini-3.8-flash');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (activeTopic) {
      setSelectedTopicId(activeTopic.id);
    }
  }, [activeTopic]);

  useEffect(() => {
    try {
      localStorage.setItem('racan_gemini_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.warn('Storage limit reached for chat history', e);
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, messages, isLoading]);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm('Deseja limpar todo o histórico de conversa com o Gemini?')) {
      const resetMessages: ChatMessage[] = [
        {
          id: 'welcome-reset',
          role: 'model',
          content: 'Histórico resetado. Em que assunto executivo deseja focar agora?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(resetMessages);
      localStorage.removeItem('racan_gemini_chat_history');
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isLoading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setIsLoading(true);

    try {
      // Find topic context if selected
      const currentTopic = topics.find(t => t.id === selectedTopicId) || activeTopic;
      const topicContext = currentTopic ? {
        code: currentTopic.code,
        title: currentTopic.title,
        category: currentTopic.category,
        keyPoints: currentTopic.studyItems?.map(i => i.title),
      } : undefined;

      // Prepare payload with multi-turn conversation history
      const payloadMessages = updatedHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: payloadMessages,
          topicContext,
          roleMode,
          model: modelChoice
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro de conexão com o Gemini (${res.status})`);
      }

      const data = await res.json();
      if (!data.success || !data.reply) {
        throw new Error(data.error || 'Nenhuma resposta válida recebida do Gemini.');
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Gemini chat error:', err);
      setError(err.message || 'Falha ao se comunicar com o Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to format basic markdown-style text safely
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Bold rendering
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      // Bullets
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={i} className="flex items-start gap-2 my-1 pl-2">
            <span className="text-brand-accent shrink-0 mt-1">•</span>
            <span className="text-gray-200">{formattedLine}</span>
          </div>
        );
      }

      if (line.trim().startsWith('### ')) {
        return <h4 key={i} className="text-sm font-bold text-brand-accent mt-3 mb-1">{line.replace('### ', '')}</h4>;
      }
      if (line.trim().startsWith('## ')) {
        return <h3 key={i} className="text-base font-bold text-white mt-4 mb-1 border-b border-white/10 pb-1">{line.replace('## ', '')}</h3>;
      }

      return (
        <p key={i} className={`min-h-[1.25rem] ${line.trim() === '' ? 'h-2' : ''} text-gray-200 leading-relaxed`}>
          {formattedLine}
        </p>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-fade-in">
      <div className="bg-slate-900 border border-brand-primary/40 w-full max-w-4xl h-[88vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-primary via-indigo-600 to-brand-accent flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Mentor Executivo Gemini</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-brand-primary/20 text-brand-accent border border-brand-primary/30">
                  {modelChoice}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Multi-turn IA generativa conectada ao RACAN LEARN PLAN 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearHistory}
              title="Limpar histórico do chat"
              className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-xs flex items-center gap-1.5"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Limpar</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Subheader: Role selection and Topic focus filter */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          
          {/* Role selector buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            <span className="text-gray-400 text-[11px] font-medium shrink-0 mr-1">Papel da IA:</span>
            {(Object.keys(ROLE_DEFINITIONS) as RoleMode[]).map(mode => {
              const def = ROLE_DEFINITIONS[mode];
              const isSelected = roleMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setRoleMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all shrink-0 ${
                    isSelected
                      ? 'bg-brand-primary/30 text-white border border-brand-accent/50 shadow-sm'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/5 hover:border-white/10'
                  }`}
                  title={def.desc}
                >
                  {def.icon}
                  {def.label.split(' ')[0]}
                </button>
              );
            })}
          </div>

          {/* Topic Context selector */}
          <div className="flex items-center gap-2">
            <BookOpen size={13} className="text-gray-400" />
            <select
              value={selectedTopicId}
              onChange={e => setSelectedTopicId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-gray-200 focus:outline-none focus:border-brand-accent max-w-[200px] truncate"
            >
              <option value="all">Visão Geral (Todas as Trilhas)</option>
              {topics.map(t => (
                <option key={t.id} value={t.id}>
                  [{t.code}] {t.title}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Scrollable Messages Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Suggested Quick Prompts if conversation is short */}
          {messages.length <= 2 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-300">
                <HelpCircle size={14} className="text-brand-accent" />
                <span>Perguntas Rápidas Sugeridas (Pareto 80/20)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    disabled={isLoading}
                    className="text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-brand-primary/20 border border-white/5 hover:border-brand-primary/40 text-xs text-gray-300 hover:text-white transition-all line-clamp-2"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => {
            const isModel = msg.role === 'model';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[90%] sm:max-w-[82%] ${
                  isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-md ${
                    isModel
                      ? 'bg-gradient-to-tr from-brand-primary to-brand-accent text-white'
                      : 'bg-slate-700 text-white'
                  }`}
                >
                  {isModel ? <Bot size={16} /> : <UserIcon size={16} />}
                </div>

                {/* Message Bubble */}
                <div className="group relative">
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs shadow-md ${
                      isModel
                        ? 'bg-slate-800/90 text-gray-200 border border-white/10'
                        : 'bg-brand-primary text-white border border-brand-accent/30'
                    }`}
                  >
                    <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-1">
                      {renderFormattedText(msg.content)}
                    </div>
                  </div>

                  {/* Message Meta & Action */}
                  <div
                    className={`flex items-center gap-2 mt-1 px-1 text-[10px] text-gray-500 ${
                      isModel ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {isModel && (
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity flex items-center gap-1"
                        title="Copiar mensagem"
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
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-[80%] mr-auto items-center animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-accent text-white flex items-center justify-center shrink-0">
                <Sparkles size={16} className="animate-spin" />
              </div>
              <div className="bg-slate-800/90 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-accent animate-ping" />
                <span className="text-xs text-gray-300">Gemini 3.8 Flash está estruturando a resposta executiva...</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 bg-slate-950 border-t border-white/10 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2 bg-slate-900 border border-slate-700 rounded-2xl p-2 focus-within:border-brand-accent transition-colors"
          >
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte ao Gemini sobre conceitos 80/20, arquitetura, MLOps, governança ou sabatinas..."
              className="flex-1 bg-transparent border-0 text-white text-xs px-2 py-1 focus:outline-none resize-none placeholder-gray-500"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 shrink-0"
            >
              {isLoading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <>
                  <span>Enviar</span>
                  <Send size={13} />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-gray-400">
            <span>Pressione <kbd className="bg-slate-800 px-1 py-0.5 rounded text-gray-300">Enter</kbd> para enviar, <kbd className="bg-slate-800 px-1 py-0.5 rounded text-gray-300">Shift + Enter</kbd> para nova linha</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Gemini Ativo
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
