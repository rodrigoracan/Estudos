import React, { useState } from 'react';
import { 
  ArrowLeft, CheckCircle2, Circle, BookOpen, FileText, Share2, 
  Save, Layout, ExternalLink, Code2, Sparkles, Brain, Clock, 
  Calendar, Star, Send, Copy, Check, Download, AlertTriangle, 
  Play, ShieldCheck, ChevronRight
} from 'lucide-react';
import { Topic, KeyTopic, Technique, StudySessionLog } from '../types';
import { GlassCard } from './ui/GlassCard';
import { GoogleGenAI } from '@google/genai';

interface TopicDetailProps {
  topic: Topic;
  onBack: () => void;
  onUpdateTopic: (updatedTopic: Topic) => void;
  onStartPomodoroForTopic?: (topic: Topic) => void;
}

export const TopicDetail: React.FC<TopicDetailProps> = ({ 
  topic, 
  onBack, 
  onUpdateTopic,
  onStartPomodoroForTopic 
}) => {
  const [activeTab, setActiveTab] = useState<'evolution' | 'notes' | 'deliverable' | 'mentor'>('evolution');
  const [localNotes, setLocalNotes] = useState(topic.notes);
  const [localArchDecisions, setLocalArchDecisions] = useState(topic.architectureDecisions || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedNotes, setCopiedNotes] = useState(false);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [newSessionMinutes, setNewSessionMinutes] = useState(30);

  // Gemini Mentor state
  const [mentorQuery, setMentorQuery] = useState('');
  const [mentorMessages, setMentorMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    {
      role: 'model',
      text: `Olá! Sou seu Mentor Especialista em Métodos de Estudo para ${topic.title} (${topic.code}). Posso te ajudar a aplicar o Princípio de Pareto (80/20), estruturar seu caderno de notas, simular testes de perguntas executivas ou gerar código do entregável do notebook.`
    }
  ]);
  const [isGeneratingMentor, setIsGeneratingMentor] = useState(false);

  // Toggle key topic
  const toggleKeyTopic = (ktId: string) => {
    const updatedKeyTopics = topic.keyTopics.map(kt => 
      kt.id === ktId ? { ...kt, completed: !kt.completed } : kt
    );
    recalculateProgress(updatedKeyTopics, topic.techniques, topic.deliverable.completed);
  };

  // Toggle study technique
  const toggleTechnique = (techId: string) => {
    const updatedTechniques = topic.techniques.map(t => 
      t.id === techId ? { ...t, completed: !t.completed } : t
    );
    recalculateProgress(topic.keyTopics, updatedTechniques, topic.deliverable.completed);
  };

  // Toggle deliverable
  const toggleDeliverable = () => {
    const newDeliverable = {
      ...topic.deliverable,
      completed: !topic.deliverable.completed
    };
    recalculateProgress(topic.keyTopics, topic.techniques, newDeliverable.completed, newDeliverable);
  };

  // Recalculate progress based on Pareto weights:
  // Key Topics: 50%, Deliverable: 25%, Techniques: 25%
  const recalculateProgress = (
    keyTopics: KeyTopic[], 
    techniques: Technique[], 
    deliverableCompleted: boolean,
    customDeliverable?: typeof topic.deliverable
  ) => {
    const completedKt = keyTopics.filter(kt => kt.completed).length;
    const ktScore = keyTopics.length > 0 ? (completedKt / keyTopics.length) * 50 : 0;

    const completedTech = techniques.filter(t => t.completed).length;
    const techScore = techniques.length > 0 ? (completedTech / techniques.length) * 25 : 0;

    const deliverableScore = deliverableCompleted ? 25 : 0;

    const totalProgress = Math.min(100, Math.round(ktScore + techScore + deliverableScore));

    onUpdateTopic({
      ...topic,
      keyTopics,
      techniques,
      deliverable: customDeliverable || { ...topic.deliverable, completed: deliverableCompleted },
      progress: totalProgress
    });
  };

  // Set confidence level
  const setConfidence = (stars: number) => {
    onUpdateTopic({
      ...topic,
      confidenceLevel: stars
    });
  };

  // Save notes & decisions
  const handleSaveNotes = () => {
    onUpdateTopic({
      ...topic,
      notes: localNotes,
      architectureDecisions: localArchDecisions,
      lastStudied: new Date().toISOString().split('T')[0]
    });
    setSavedStatus('Anotações salvas com sucesso!');
    setTimeout(() => setSavedStatus(null), 2500);
  };

  // Add study session log
  const handleAddSession = () => {
    if (newSessionMinutes <= 0) return;
    const newHistory: StudySessionLog = {
      id: `session-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      minutes: Number(newSessionMinutes),
      notes: `Sessão de estudos em ${topic.title}`
    };
    const updatedHistory = [...(topic.history || []), newHistory];
    const updatedMinutes = (topic.studyMinutes || 0) + Number(newSessionMinutes);

    onUpdateTopic({
      ...topic,
      studyMinutes: updatedMinutes,
      lastStudied: new Date().toISOString().split('T')[0],
      history: updatedHistory
    });

    setSavedStatus(`+${newSessionMinutes} min registrados!`);
    setTimeout(() => setSavedStatus(null), 2000);
  };

  // Copy code snippet
  const handleCopyCode = () => {
    if (topic.deliverable.codeSnippet) {
      navigator.clipboard.writeText(topic.deliverable.codeSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Copy full notes
  const handleCopyNotes = () => {
    const textToCopy = `# ${topic.code} - ${topic.title}\n\n## Objetivo de Aprendizado\n${topic.learningObjective}\n\n## Anotações Executivas\n${localNotes}\n\n## Decisões de Arquitetura\n${localArchDecisions}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  // Download Markdown file
  const handleDownloadMarkdown = () => {
    const textContent = `# ${topic.code} - ${topic.title}
Data: ${new Date().toLocaleDateString('pt-BR')}
Trilha: ${topic.category}
Progresso Pareto: ${Math.round(topic.progress)}%
Nível de Confiança Executiva: ${topic.confidenceLevel}/5

---

## 🎯 Objetivo de Aprendizado
${topic.learningObjective}

## 📋 Tópicos-Chave
${topic.keyTopics.map(kt => `- [${kt.completed ? 'x' : ' '}] **${kt.title}**: ${kt.details}`).join('\n')}

## 💼 Entregável Prático do Notebook
**${topic.deliverable.title}** (Status: ${topic.deliverable.completed ? 'Concluído' : 'Pendente'})
${topic.deliverable.description}

\`\`\`python
${topic.deliverable.codeSnippet || '# Sem código anexado'}
\`\`\`

---

## 📝 Caderno Digital & Anotações de Estudo
${localNotes}

## 🏛️ Diretrizes de Arquitetura & Governança (Liderança de TI)
${localArchDecisions}
`;

    const blob = new Blob([textContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RACAN_2026_${topic.code.replace('.', '_')}_${topic.title.replace(/[\s/]/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Set next review interval
  const scheduleReview = (days: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const dateStr = targetDate.toISOString().split('T')[0];
    onUpdateTopic({
      ...topic,
      nextReviewDate: dateStr
    });
    setSavedStatus(`Próxima revisão agendada para ${targetDate.toLocaleDateString('pt-BR')} (D+${days})`);
    setTimeout(() => setSavedStatus(null), 3000);
  };

  // Send query to Gemini Mentor
  const handleSendMentorPrompt = async (promptText?: string) => {
    const textToSend = promptText || mentorQuery;
    if (!textToSend.trim()) return;

    setMentorMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    if (!promptText) setMentorQuery('');
    setIsGeneratingMentor(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `Você é um mentor especialista em métodos de estudo acelerado (Princípio de Pareto 80/20, Feynman, Active Recall, Ebbinghaus) e liderança executiva em TI. 
O aluno é um Gestor de TI se preparando para 2026.
O tópico atual é: ${topic.code} - ${topic.title} (${topic.category}).
Objetivo da matéria: ${topic.learningObjective}.
Seja técnico, pragmático, focado em arquitetura, governança, decisões executivas e exemplos práticos de código quando solicitado. Responda em português.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: textToSend,
          config: {
            systemInstruction: systemPrompt
          }
        });

        const reply = response.text || 'Não foi possível gerar a resposta no momento.';
        setMentorMessages(prev => [...prev, { role: 'model', text: reply }]);
      } else {
        // Fallback with rich specialized domain responses
        let simulatedReply = '';
        if (textToSend.toLowerCase().includes('drift') || topic.id.includes('1-2')) {
          simulatedReply = `### Roteiro de Estudo Pareto 80/20: Observabilidade de ML e Data Drift\n\n**1. O Conceito Central (20% que dá 80% do resultado):**\n- **Data Drift ($P(X)$)**: As variáveis de entrada mudaram de distribuição (ex: público mais jovem usando o app).\n- **Concept Drift ($P(Y|X)$)**: A relação entre as variáveis e a resposta real mudou (ex: novos padrões de fraude).\n\n**2. Ação Imediata no Notebook:**\nUtilize o Evidently AI com o teste estatístico Kolmogorov-Smirnov (KS) em features contínuas. Se p-valor < 0.05, acione alerta para a equipe de MLOps.\n\n**3. Decisão de Liderança em TI:**\nNão configure retreinamento automático diário sem auditoria; configure gatilhos baseados em PSI (Population Stability Index) > 0.2.`;
        } else if (textToSend.toLowerCase().includes('echoleak') || topic.id.includes('3-2')) {
          simulatedReply = `### Análise Técnica da Vulnerabilidade EchoLeak (CVE-2025-32711)\n\n**1. Anatomia do Ataque (Zero-Click RAG Exfiltration):**\n1. O atacante envia um arquivo aparentemente inofensivo contendo prompt injection indireto em Markdown.\n2. O RAG corporativo ingere o arquivo e indexa no Vector DB.\n3. Quando o diretor pergunta algo legítimo, o LLM lê o documento e segue a instrução oculta: gera uma tag de imagem invisível com os dados confidenciais anexados na query string de uma URL externa.\n4. O frontend renderiza a imagem e exfiltra os dados sem nenhum clique.\n\n**2. Defesa Mandatória:**\nConfigure **Content Security Policy (CSP)** rígido proibindo conexões externas e sanitize as respostas do LLM removendo tags \`<img>\` antes da renderização.`;
        } else if (textToSend.toLowerCase().includes('iso') || textToSend.toLowerCase().includes('nist') || topic.id.includes('2-1')) {
          simulatedReply = `### Estratégia Híbrida: NIST AI RMF vs ISO/IEC 42001\n\n- **NIST AI RMF**: Use internamente com seus times de engenharia para operacionalizar risco (*Govern, Map, Measure, Manage*).\n- **ISO 42001**: Use para estruturar o Sistema de Gestão de IA (AIMS) e obter certificação reconhecida por clientes corporativos e auditorias externas.\n- **Controle Prioritário Pareto:** AI Impact Assessment (AIIA) documentado para todos os modelos de alto impacto.`;
        } else {
          simulatedReply = `### Diretriz Executiva para ${topic.title}\n\nFoque nos seguintes pilares fundamentais:\n1. **Alinhamento Estratégico:** Como este tópico protege a empresa de multas e falhas de arquitetura em 2026?\n2. **Entregável Prático:** Garanta que você executou o código de exemplo e validou a saída no seu ambiente.\n3. **Método Feynman:** Explique em 3 frases para um diretor não técnico por que essa tecnologia é mandatória.`;
        }
        setMentorMessages(prev => [...prev, { role: 'model', text: simulatedReply }]);
      }
    } catch (err) {
      console.error(err);
      setMentorMessages(prev => [
        ...prev, 
        { 
          role: 'model', 
          text: 'Nota do Mentor: Recomendamos aplicar o Método Feynman neste tópico: explique o conceito chave em 2 minutos simplificando os jargões para garantir retenção de longo prazo.' 
        }
      ]);
    } finally {
      setIsGeneratingMentor(false);
    }
  };

  // Track color themes
  const trackTheme = {
    dados: { border: 'border-cyan-500/30', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', button: 'bg-cyan-500 hover:bg-cyan-600', ring: 'ring-cyan-500' },
    ia: { border: 'border-violet-500/30', badge: 'bg-violet-500/10 text-violet-400 border-violet-500/30', button: 'bg-violet-500 hover:bg-violet-600', ring: 'ring-violet-500' },
    cyber: { border: 'border-rose-500/30', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30', button: 'bg-rose-500 hover:bg-rose-600', ring: 'ring-rose-500' },
  }[topic.trackId] || { border: 'border-brand-primary/30', badge: 'bg-brand-primary/10 text-brand-primary border-brand-primary/30', button: 'bg-brand-primary hover:bg-brand-primary/80', ring: 'ring-brand-primary' };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto animate-fade-in space-y-6">
      
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white transition-all text-sm border border-white/10"
          >
            <ArrowLeft size={16} />
            <span>Voltar para Trilha</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Trilhas 2026</span>
            <ChevronRight size={14} />
            <span className={`px-2 py-0.5 rounded-full border ${trackTheme.badge} font-medium`}>
              {topic.category}
            </span>
            <ChevronRight size={14} />
            <span className="text-white font-mono font-semibold">Tópico {topic.code}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onStartPomodoroForTopic && (
            <button
              onClick={() => onStartPomodoroForTopic(topic)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40 rounded-xl text-xs font-semibold transition-all"
              title="Iniciar Pomodoro para esta matéria"
            >
              <Play size={14} className="fill-red-400" />
              <span>Estudar com Pomodoro</span>
            </button>
          )}

          <button
            onClick={handleCopyNotes}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-medium transition-all"
            title="Copiar resumo e notas em Markdown"
          >
            {copiedNotes ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            <span>{copiedNotes ? 'Copiado!' : 'Copiar Notas'}</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-medium transition-all"
            title="Baixar arquivo Markdown (.md)"
          >
            <Download size={14} />
            <span>Exportar .md</span>
          </button>

          <button
            onClick={handleSaveNotes}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-accent hover:opacity-95 text-white font-semibold rounded-xl text-xs shadow-lg transition-all"
          >
            <Save size={14} />
            <span>Salvar Anotações</span>
          </button>
        </div>
      </div>

      {savedStatus && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-medium flex items-center justify-between animate-fade-in">
          <span>{savedStatus}</span>
          <CheckCircle2 size={16} />
        </div>
      )}

      {/* Main Subject Header Card */}
      <GlassCard className="relative overflow-hidden border-l-4 border-l-brand-accent">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-brand-accent/20 text-brand-accent border border-brand-accent/30">
                {topic.code}
              </span>
              <span className="text-xs text-gray-400 uppercase tracking-wider">{topic.subtitle}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {topic.title}
            </h1>
            
            <p className="text-sm text-gray-300 leading-relaxed max-w-4xl bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="text-brand-accent font-semibold">Objetivo de Aprendizado: </span>
              {topic.learningObjective}
            </p>
          </div>

          {/* Quick Metrics & Confidence */}
          <div className="flex lg:flex-col items-center justify-between lg:justify-center gap-4 bg-brand-dark/40 p-4 rounded-xl border border-white/5 min-w-[220px]">
            {/* Progress Radial Badge */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full border-4 border-white/10 bg-brand-surface flex items-center justify-center text-white font-extrabold text-base shadow-inner relative">
                {Math.round(topic.progress)}%
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/10"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="text-brand-accent drop-shadow"
                    strokeDasharray={`${topic.progress}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>
              </div>
              <div className="text-left">
                <span className="text-xs text-gray-400 block">Domínio Pareto</span>
                <span className="text-xs font-bold text-brand-accent">
                  {topic.progress >= 80 ? 'Dominado (80/20)' : topic.progress >= 40 ? 'Em Andamento' : 'Iniciado'}
                </span>
              </div>
            </div>

            {/* Confidence Stars */}
            <div className="text-left lg:text-center w-full pt-2 border-t border-white/5">
              <span className="text-[11px] text-gray-400 block mb-1">Nível de Confiança Executiva:</span>
              <div className="flex items-center gap-1 justify-start lg:justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setConfidence(star)}
                    className="p-0.5 hover:scale-110 transition-transform"
                    title={`Nível ${star} de 5`}
                  >
                    <Star 
                      size={18} 
                      className={star <= (topic.confidenceLevel || 1) ? 'text-amber-400 fill-amber-400' : 'text-gray-600'} 
                    />
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {topic.confidenceLevel === 5 ? 'Decisão Executiva Completa' : topic.confidenceLevel >= 3 ? 'Operacional / Autonomia' : 'Compreensão Básica'}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto custom-scrollbar">
        <button 
          onClick={() => setActiveTab('evolution')}
          className={`px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'evolution' 
              ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Brain size={16} /> Acompanhamento de Evolução
        </button>

        <button 
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'notes' 
              ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText size={16} /> Caderno de Anotações & Governança
        </button>

        <button 
          onClick={() => setActiveTab('deliverable')}
          className={`px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'deliverable' 
              ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Code2 size={16} /> Entregável Prático (Notebook)
          {topic.deliverable.completed && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
          )}
        </button>

        <button 
          onClick={() => setActiveTab('mentor')}
          className={`px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'mentor' 
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles size={16} className="text-amber-300" /> Mentor Especialista AI
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: ACOMPANHAMENTO DE EVOLUÇÃO (PARETO 80/20)               */}
      {/* ============================================================== */}
      {activeTab === 'evolution' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main 2 columns: Key Topics & Methods */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tópicos-Chave da Ementa (Pareto 80/20) */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-brand-accent" />
                    Tópicos-Chave para Estudo (Pareto 80/20)
                  </h3>
                  <p className="text-xs text-gray-400">
                    Os 20% do conteúdo estruturante com maior impacto em decisões de liderança em TI.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-1 rounded-full text-brand-accent">
                  {topic.keyTopics.filter(kt => kt.completed).length} / {topic.keyTopics.length} Concluídos
                </span>
              </div>

              <div className="space-y-3">
                {topic.keyTopics.map((kt, idx) => (
                  <div 
                    key={kt.id}
                    onClick={() => toggleKeyTopic(kt.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 group ${
                      kt.completed 
                        ? 'bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/20' 
                        : 'bg-white/5 border-white/10 hover:border-brand-primary/50'
                    }`}
                  >
                    <button className="mt-0.5 text-gray-500 group-hover:text-brand-primary transition-colors">
                      {kt.completed ? (
                        <CheckCircle2 className="text-emerald-400" size={20} />
                      ) : (
                        <Circle className="text-gray-500" size={20} />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400">#{idx + 1}</span>
                        <h4 className={`text-sm font-semibold ${kt.completed ? 'text-emerald-300 line-through' : 'text-white'}`}>
                          {kt.title}
                        </h4>
                      </div>
                      {kt.details && (
                        <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                          {kt.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Métodos de Estudo Especialistas Aplicados */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Brain size={20} className="text-purple-400" />
                    Métodos de Estudo para Retenção Máxima
                  </h3>
                  <p className="text-xs text-gray-400">
                    Aplicação ativa das técnicas de alta performance cognitiva.
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {topic.techniques.filter(t => t.completed).length}/{topic.techniques.length} Validadas
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topic.techniques.map((tech) => (
                  <div
                    key={tech.id}
                    onClick={() => toggleTechnique(tech.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      tech.completed
                        ? 'bg-purple-500/10 border-purple-500/40 text-purple-200'
                        : 'bg-white/5 border-white/10 hover:border-purple-400/40 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        {tech.name}
                      </span>
                      {tech.completed ? (
                        <CheckCircle2 size={18} className="text-purple-400" />
                      ) : (
                        <Circle size={18} className="text-gray-500" />
                      )}
                    </div>
                    {tech.description && (
                      <p className="text-xs text-gray-400 leading-snug">
                        {tech.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Entregável Prático Preview */}
            <GlassCard className="border border-brand-accent/30 bg-gradient-to-br from-brand-surface to-brand-dark">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-brand-accent/20 rounded-lg text-brand-accent">
                    <Code2 size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-brand-accent uppercase tracking-wider">Entregável Prático para Notebook</span>
                    <h4 className="text-base font-bold text-white">{topic.deliverable.title}</h4>
                  </div>
                </div>

                <button
                  onClick={toggleDeliverable}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    topic.deliverable.completed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  }`}
                >
                  {topic.deliverable.completed ? <Check size={14} /> : <Circle size={14} />}
                  <span>{topic.deliverable.completed ? 'Notebook Finalizado' : 'Marcar Concluído'}</span>
                </button>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed mb-4">
                {topic.deliverable.description}
              </p>

              <button
                onClick={() => setActiveTab('deliverable')}
                className="text-xs font-semibold text-brand-accent hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Visualizar e Copiar Código Python/SQL</span>
                <ChevronRight size={14} />
              </button>
            </GlassCard>

          </div>

          {/* Right Column: Sessions, Ebbinghaus & Quick Links */}
          <div className="space-y-6">
            
            {/* Tempo Total e Registro de Estudo */}
            <GlassCard>
              <h4 className="text-xs uppercase text-gray-400 font-semibold mb-3 flex items-center gap-2">
                <Clock size={16} className="text-brand-accent" />
                Tempo Investido na Matéria
              </h4>

              <div className="p-4 bg-brand-dark/50 rounded-xl border border-white/5 text-center mb-4">
                <span className="text-3xl font-extrabold text-white font-mono">
                  {Math.floor((topic.studyMinutes || 0) / 60)}h {(topic.studyMinutes || 0) % 60}m
                </span>
                <span className="block text-[11px] text-gray-400 mt-1">
                  Último estudo: {topic.lastStudied || 'Ainda não registrado'}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400 block font-medium">Registrar sessão avulsa:</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    min="5" 
                    step="5"
                    value={newSessionMinutes}
                    onChange={(e) => setNewSessionMinutes(Number(e.target.value))}
                    className="w-20 bg-slate-900 border border-white/10 rounded-lg px-2 text-center text-sm font-mono text-white focus:outline-none focus:border-brand-primary"
                  />
                  <span className="text-xs text-gray-400 self-center">minutos</span>
                  <button 
                    onClick={handleAddSession}
                    className="flex-1 py-1.5 px-3 bg-brand-primary hover:bg-brand-primary/80 rounded-lg text-xs font-bold text-white transition-colors"
                  >
                    + Adicionar
                  </button>
                </div>
              </div>
            </GlassCard>

            {/* Agendador de Repetição Espaçada (Curva de Ebbinghaus) */}
            <GlassCard>
              <h4 className="text-xs uppercase text-gray-400 font-semibold mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-amber-400" />
                Repetição Espaçada (Ebbinghaus)
              </h4>
              <p className="text-xs text-gray-400 mb-3">
                Programe os ciclos de revisão para combater o esquecimento biológico:
              </p>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => scheduleReview(1)}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 font-medium transition-colors"
                >
                  ⚡ D+1 (24 Horas)
                </button>
                <button
                  onClick={() => scheduleReview(7)}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 font-medium transition-colors"
                >
                  📅 D+7 (1 Semana)
                </button>
                <button
                  onClick={() => scheduleReview(21)}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 font-medium transition-colors"
                >
                  🎯 D+21 (3 Semanas)
                </button>
                <button
                  onClick={() => scheduleReview(30)}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 font-medium transition-colors"
                >
                  🏆 D+30 (1 Mês)
                </button>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <span className="text-[11px] text-amber-300 block font-semibold">Próxima Revisão Agendada:</span>
                <span className="text-sm font-bold text-white">
                  {topic.nextReviewDate 
                    ? new Date(topic.nextReviewDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                    : 'Nenhuma agendada'}
                </span>
              </div>
            </GlassCard>

            {/* Recursos Recomendados da Matéria */}
            <GlassCard>
              <h4 className="text-xs uppercase text-gray-400 font-semibold mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-cyan-400" />
                Recursos Oficiais & Guias
              </h4>
              <div className="space-y-2">
                {topic.resources.map((res) => (
                  <a
                    key={res.id}
                    href={res.url || '#'}
                    target={res.url ? '_blank' : '_self'}
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-xs group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-brand-dark text-brand-accent">
                        {res.type === 'framework' || res.type === 'notebook' ? <Code2 size={12} /> : <FileText size={12} />}
                      </span>
                      <span className="text-gray-200 group-hover:text-white font-medium line-clamp-1">{res.title}</span>
                    </div>
                    {res.url ? <ExternalLink size={12} className="text-gray-500 group-hover:text-brand-accent" /> : null}
                  </a>
                ))}
              </div>
            </GlassCard>

          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: TELAS PARA ANOTAÇÕES E DIRETRIZES DE ARQUITETURA        */}
      {/* ============================================================== */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Caderno Digital Executivo */}
            <GlassCard className="flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FileText className="text-brand-accent" size={18} />
                  <h3 className="text-base font-bold text-white">Caderno de Anotações & Insights</h3>
                </div>
                <span className="text-[11px] text-gray-400">Markdown format suportado</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Registre os 20% fundamentais: conceitos-chave, analogias de Feynman, anotações de aula ou livros.
              </p>
              <textarea 
                className="flex-1 w-full bg-slate-900/60 border border-white/10 rounded-xl p-4 text-gray-200 text-sm font-mono leading-relaxed focus:outline-none focus:border-brand-accent/50 resize-y min-h-[360px]"
                placeholder="Digite suas anotações estratégicas aqui...
Exemplo:
- O que é crucial entender neste tópico?
- Qual o impacto no negócio se ignorarmos isso?
- Resumo em minhas próprias palavras:"
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
              />
            </GlassCard>

            {/* Diretrizes & Decisões de Arquitetura (Para Liderança de TI) */}
            <GlassCard className="flex flex-col min-h-[500px] border border-brand-primary/30">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-brand-primary" size={18} />
                  <h3 className="text-base font-bold text-white">Decisões de Arquitetura & Governança</h3>
                </div>
                <span className="text-[11px] text-brand-primary font-semibold">Liderança Executiva</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Diretrizes que você, como Gestor de TI, deve impor à sua equipe de engenharia e dados para 2026.
              </p>
              <textarea 
                className="flex-1 w-full bg-slate-900/60 border border-white/10 rounded-xl p-4 text-gray-200 text-sm font-mono leading-relaxed focus:outline-none focus:border-brand-primary/50 resize-y min-h-[360px]"
                placeholder="Diretrizes para a equipe:
Exemplo:
1. Política de Deploy: Obrigatório relatório de Data Drift no CI/CD.
2. Segurança: Agentes RAG não terão acesso a endpoints sem validação CSP.
3. Conformidade: Mapeamento de risco PL 2338/2023 antes da contratação de vendors de IA."
                value={localArchDecisions}
                onChange={(e) => setLocalArchDecisions(e.target.value)}
              />
            </GlassCard>

          </div>

          {/* Bottom Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="text-xs text-gray-400">
              💡 Suas anotações são salvas com segurança no navegador e podem ser exportadas em formato Markdown (.md).
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyNotes}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all border border-white/10 flex items-center gap-1.5"
              >
                {copiedNotes ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                <span>Copiar Tudo</span>
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-6 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent hover:opacity-95 text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center gap-2"
              >
                <Save size={15} />
                <span>Salvar Anotações</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: ENTREGÁVEL PRÁTICO (NOTEBOOK E CÓDIGO)                   */}
      {/* ============================================================== */}
      {activeTab === 'deliverable' && (
        <div className="space-y-6">
          <GlassCard>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-mono font-semibold text-brand-accent uppercase">Roteiro Prático de Execução</span>
                <h3 className="text-xl font-bold text-white mt-1">{topic.deliverable.title}</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-2xl">{topic.deliverable.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
                >
                  {copiedCode ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Código Copiado!' : 'Copiar Script'}</span>
                </button>

                <button
                  onClick={toggleDeliverable}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    topic.deliverable.completed
                      ? 'bg-emerald-500 text-white'
                      : 'bg-brand-primary hover:bg-brand-primary/80 text-white'
                  }`}
                >
                  {topic.deliverable.completed ? <Check size={14} /> : <Circle size={14} />}
                  <span>{topic.deliverable.completed ? 'Concluído no Notebook' : 'Marcar como Executado'}</span>
                </button>
              </div>
            </div>

            {/* Code Block Container */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-white/10 text-xs text-gray-400 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
                  <span className="ml-2">deliverable_{topic.code.replace('.', '_')}.py</span>
                </div>
                <span>Python 3.11+ / Jupyter</span>
              </div>
              <pre className="p-4 sm:p-6 overflow-x-auto text-xs sm:text-sm font-mono text-gray-200 leading-relaxed custom-scrollbar">
                <code>{topic.deliverable.codeSnippet || '# Nenhum código fornecido para este entregável'}</code>
              </pre>
            </div>
          </GlassCard>

          {/* Quick Prompts from Syllabus */}
          <GlassCard>
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              Prompts Recomendados na Ementa para este Tópico
            </h4>
            <p className="text-xs text-gray-400 mb-4">
              Clique em um dos prompts abaixo para enviar imediatamente ao Mentor de Estudos AI:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topic.recommendedPrompts.map((rp, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    setActiveTab('mentor');
                    handleSendMentorPrompt(rp.prompt);
                  }}
                  className="p-3.5 bg-white/5 hover:bg-brand-primary/10 border border-white/10 hover:border-brand-primary/40 rounded-xl cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-brand-accent group-hover:text-white">{rp.label}</span>
                    <ChevronRight size={14} className="text-gray-500 group-hover:text-brand-accent" />
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2 italic">
                    "{rp.prompt}"
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: MENTOR DE ESTUDOS ESPECIALISTA (GEMINI AI)              */}
      {/* ============================================================== */}
      {activeTab === 'mentor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chat Window (2 cols) */}
          <GlassCard className="lg:col-span-2 flex flex-col min-h-[550px] relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-brand-primary to-brand-accent text-white">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Mentor de Estudos: {topic.title}</h3>
                  <p className="text-[11px] text-gray-400">Especialista em Metodologia Pareto 80/20 & Liderança em TI</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300">
                Gemini 2.5 Flash
              </span>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 custom-scrollbar max-h-[420px]">
              {mentorMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-primary text-white rounded-tr-sm'
                      : 'bg-slate-900/90 text-gray-200 border border-white/10 rounded-tl-sm'
                  }`}>
                    {msg.role === 'model' && (
                      <div className="flex items-center gap-1.5 mb-2 text-[10px] text-brand-accent font-semibold uppercase tracking-wider">
                        <Brain size={12} />
                        <span>RACAN AI MENTOR</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                </div>
              ))}
              {isGeneratingMentor && (
                <div className="flex justify-start">
                  <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-white/10 text-xs text-brand-accent flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-accent animate-ping"></span>
                    <span>Analisando matriz de estudo e formulando resposta executiva...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="relative pt-2 border-t border-white/10">
              <input
                type="text"
                value={mentorQuery}
                onChange={(e) => setMentorQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMentorPrompt()}
                placeholder="Pergunte ao mentor sobre o tópico, peça um quiz ou simulação..."
                className="w-full bg-slate-950/80 border border-white/20 rounded-xl py-3 pl-4 pr-12 text-xs sm:text-sm text-white focus:outline-none focus:border-brand-accent transition-colors"
                disabled={isGeneratingMentor}
              />
              <button
                onClick={() => handleSendMentorPrompt()}
                disabled={isGeneratingMentor || !mentorQuery.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-accent text-slate-950 font-bold hover:opacity-90 rounded-lg transition-all disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
          </GlassCard>

          {/* Quick Prompts & Study Tips */}
          <div className="space-y-4">
            <GlassCard>
              <h4 className="text-xs uppercase text-gray-400 font-semibold mb-3">Atalhos da Ementa Oficial</h4>
              <div className="space-y-2">
                {topic.recommendedPrompts.map((rp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMentorPrompt(rp.prompt)}
                    className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-brand-primary/20 border border-white/5 hover:border-brand-primary/40 transition-all text-xs"
                  >
                    <span className="font-bold text-white block mb-0.5">{rp.label}</span>
                    <span className="text-gray-400 text-[11px] line-clamp-2">{rp.prompt}</span>
                  </button>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <h4 className="text-xs uppercase text-gray-400 font-semibold mb-2">Simulação de Decisão Executiva</h4>
              <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                Clique para simular um teste onde o Mentor atua como o Conselho de Administração questionando suas decisões técnicas:
              </p>
              <button
                onClick={() => handleSendMentorPrompt(`Atue como o Conselho de Administração de uma grande corporação e me faça 3 perguntas difíceis e decisivas sobre ${topic.title} para testar se estou pronto para liderar essa área em 2026.`)}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <ShieldCheck size={14} />
                <span>Simular Sabatina do Conselho</span>
              </button>
            </GlassCard>
          </div>

        </div>
      )}

    </div>
  );
};
