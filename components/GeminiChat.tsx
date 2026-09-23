import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Bot, X } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface GeminiChatProps {
  onClose?: () => void;
}

export const GeminiChat: React.FC<GeminiChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: 'Olá! Sou o Mentor Especialista em Métodos de Estudo (Pareto 80/20) para o RACAN LEARN PLAN 2026. Como posso ajudar você a acelerar seu aprendizado nas trilhas de Dados, Inteligência Artificial e Cibersegurança hoje?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim()) return;

    if (!customPrompt) setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: textToSend,
          config: {
            systemInstruction: `Você é um mentor executivo sênior especialista em métodos de estudo acelerado (Princípio de Pareto 80/20, Método Feynman, Active Recall, Ebbinghaus) para Gestores de TI.
O aluno estuda três trilhas centrais para 2026:
1. Ciência de Dados: Camada Semântica (Metrics-as-Code) e MLOps/Observabilidade (Data Drift com Evidently AI).
2. Inteligência Artificial: Governança Global (NIST AI RMF vs ISO/IEC 42001) e Marco Legal da IA no Brasil (PL 2338/2023).
3. Cibersegurança em Dados & IA: SecMLOps (OWASP LLM Top 10), Ataque EchoLeak CVE-2025-32711 e Governança de Shadow AI com DLP Cognitivo.
Seja direto, técnico-executivo e prático. Sugira roteiros de cadernos, testes de autoavaliação ou códigos Python/SQL. Responda em português.`,
          },
        });

        const text = response.text || "Desculpe, não consegui processar sua resposta no momento.";
        setMessages(prev => [...prev, { role: 'model', text }]);
      } else {
        // Fallback response
        let fallback = "Com base no Princípio de Pareto (80/20), foque em dominar a arquitetura antes de tentar decorar sintaxe:\n1. Em **Dados**: Compreenda por que a camada semântica evita alucinações em RAG.\n2. Em **IA**: Priorize a ISO 42001 e o Art. 8º (XAI) do PL 2338.\n3. Em **Cibersegurança**: Conheça a anatomia do ataque EchoLeak (CVE-2025-32711) e aplique Content Security Policy (CSP).";
        setMessages(prev => [...prev, { role: 'model', text: fallback }]);
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'model', 
          text: "Dica do Mentor: Use o Método Feynman agora mesmo no seu caderno digital — resuma em poucas palavras o conceito que você acabou de revisar para fixar na memória de longo prazo." 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const samplePrompts = [
    "Como estruturar meu plano de estudos de 2026 com a regra 80/20?",
    "Quais as diferenças práticas entre o NIST AI RMF e a ISO 42001?",
    "Explique a vulnerabilidade EchoLeak de forma simples (Feynman)",
    "Como demonstrar Data Drift usando Evidently AI em um notebook?"
  ];

  return (
    <GlassCard className="h-full flex flex-col relative overflow-hidden border-brand-accent/40 shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-brand-accent to-purple-500"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-brand-accent/20 rounded-xl">
            <Sparkles size={18} className="text-brand-accent" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Consultor de Estudos Gemini</h3>
            <p className="text-[11px] text-gray-400">Mentor Pareto 80/20 para Liderança de TI</p>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Quick Prompts Suggestions */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 custom-scrollbar">
        {samplePrompts.map((sp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sp)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white whitespace-nowrap transition-colors flex-shrink-0"
          >
            {sp}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 custom-scrollbar min-h-[250px] max-h-[380px]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-brand-primary text-white rounded-tr-sm' 
                : 'bg-slate-900/90 text-gray-200 border border-white/10 rounded-tl-sm'
            }`}>
              {msg.role === 'model' && (
                <div className="flex items-center gap-1.5 mb-1.5 text-brand-accent opacity-90">
                  <Bot size={12} />
                  <span className="text-[10px] uppercase font-mono tracking-wider">RACAN AI MENTOR</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-900/90 border border-white/10 p-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-brand-accent" />
              <span className="text-xs text-gray-400">Consultando metodologia de estudo...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Pergunte sobre as matérias, métodos ou notebooks..."
          className="w-full bg-slate-950/80 border border-white/20 rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-white focus:outline-none focus:border-brand-accent transition-colors"
          disabled={isLoading}
        />
        <button 
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-brand-accent/20 hover:bg-brand-accent text-brand-accent hover:text-slate-950 rounded-lg transition-all disabled:opacity-40"
        >
          <Send size={14} />
        </button>
      </div>
    </GlassCard>
  );
};
