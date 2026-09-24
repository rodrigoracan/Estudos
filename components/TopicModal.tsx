import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Sparkles, BookOpen, Code2, CheckCircle2 } from 'lucide-react';
import { Topic, KeyTopic, Deliverable, Technique } from '../types';

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (topic: Topic) => void;
  trackId: string;
  trackName: string;
  trackColor?: string;
  initialTopic?: Topic | null;
  existingCount?: number;
}

export const TopicModal: React.FC<TopicModalProps> = ({
  isOpen,
  onClose,
  onSave,
  trackId,
  trackName,
  trackColor = '#06b6d4',
  initialTopic,
  existingCount = 0
}) => {
  const isEdit = Boolean(initialTopic);

  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [learningObjective, setLearningObjective] = useState('');
  const [keyTopicsList, setKeyTopicsList] = useState<Array<{ title: string; details: string }>>([
    { title: '', details: '' }
  ]);
  const [deliverableTitle, setDeliverableTitle] = useState('');
  const [deliverableDesc, setDeliverableDesc] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTopic) {
      setCode(initialTopic.code || '');
      setTitle(initialTopic.title || '');
      setCategory(initialTopic.category || trackName);
      setSubtitle(initialTopic.subtitle || '');
      setLearningObjective(initialTopic.learningObjective || '');
      setKeyTopicsList(
        initialTopic.keyTopics?.length > 0 
          ? initialTopic.keyTopics.map(kt => ({ title: kt.title, details: kt.details || '' }))
          : [{ title: '', details: '' }]
      );
      setDeliverableTitle(initialTopic.deliverable?.title || '');
      setDeliverableDesc(initialTopic.deliverable?.description || '');
      setConfidenceLevel(initialTopic.confidenceLevel || 1);
    } else {
      // Suggest module code e.g. "1.1", "2.1", "4.1"
      const suggestedCode = `${existingCount + 1}.1`;
      setCode(suggestedCode);
      setTitle('');
      setCategory(trackName);
      setSubtitle(`Módulo ${existingCount + 1}: Fundamentos & Aplicação Prática`);
      setLearningObjective('');
      setKeyTopicsList([
        { title: '', details: '' },
        { title: '', details: '' }
      ]);
      setDeliverableTitle('Notebook Executivo / Script Prático');
      setDeliverableDesc('Implementação hands-on do conceito aplicando regras de negócio e validações em código.');
      setConfidenceLevel(1);
    }
    setError(null);
  }, [initialTopic, isOpen, trackName, existingCount]);

  if (!isOpen) return null;

  const handleAddKeyTopicRow = () => {
    setKeyTopicsList([...keyTopicsList, { title: '', details: '' }]);
  };

  const handleRemoveKeyTopicRow = (index: number) => {
    if (keyTopicsList.length <= 1) return;
    setKeyTopicsList(keyTopicsList.filter((_, i) => i !== index));
  };

  const handleKeyTopicChange = (index: number, field: 'title' | 'details', value: string) => {
    const updated = [...keyTopicsList];
    updated[index][field] = value;
    setKeyTopicsList(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor, informe o título da matéria.');
      return;
    }

    const filteredKeyTopics: KeyTopic[] = keyTopicsList
      .filter(kt => kt.title.trim() !== '')
      .map((kt, idx) => ({
        id: initialTopic?.keyTopics?.[idx]?.id || `kt-${Date.now()}-${idx}`,
        title: kt.title.trim(),
        details: kt.details.trim(),
        completed: initialTopic?.keyTopics?.[idx]?.completed || false
      }));

    if (filteredKeyTopics.length === 0) {
      filteredKeyTopics.push({
        id: `kt-${Date.now()}-1`,
        title: 'Fundamentos e Conceitos Estruturais',
        details: 'Compreensão teórica e domínio dos 20% essenciais.',
        completed: false
      });
    }

    const defaultTechniques: Technique[] = initialTopic?.techniques || [
      { id: `tech-feynman-${Date.now()}`, name: 'Método Feynman', description: 'Explicar o conceito com analogias simples em até 3 minutos.', completed: false },
      { id: `tech-active-${Date.now()}`, name: 'Resumo Ativo (Active Recall)', description: 'Responder às principais perguntas sem consultar as anotações.', completed: false },
      { id: `tech-handson-${Date.now()}`, name: 'Prática Hands-On', description: 'Executar e testar a implementação no ambiente de laboratório.', completed: false },
      { id: `tech-spaced-${Date.now()}`, name: 'Spaced Repetition', description: 'Revisão ativa programada baseada na curva de esquecimento.', completed: false },
    ];

    const deliverable: Deliverable = {
      title: deliverableTitle.trim() || 'Projeto Prático / Notebook de Aplicação',
      description: deliverableDesc.trim() || 'Construção da solução prática para consolidar o aprendizado.',
      completed: initialTopic?.deliverable?.completed || false,
      codeSnippet: initialTopic?.deliverable?.codeSnippet || `# Exemplo Prático de ${title.trim()}\n# Implementação dos conceitos estudados\n\ndef executar_solucao():\n    print("Solução executada com sucesso")\n    return True\n`,
      url: initialTopic?.deliverable?.url || ''
    };

    const topicId = initialTopic?.id || `topic-${trackId}-${Date.now()}`;

    const savedTopic: Topic = {
      id: topicId,
      trackId: trackId,
      code: code.trim() || `${existingCount + 1}.1`,
      title: title.trim(),
      category: category.trim() || trackName,
      subtitle: subtitle.trim() || `Módulo: ${title.trim()}`,
      learningObjective: learningObjective.trim() || `Dominar as técnicas e arquitetura de ${title.trim()} para tomada de decisão e aplicação executiva.`,
      progress: initialTopic?.progress || 0,
      confidenceLevel,
      keyTopics: filteredKeyTopics,
      deliverable,
      techniques: defaultTechniques,
      resources: initialTopic?.resources || [
        { id: `res-1-${Date.now()}`, title: 'Documentação Oficial e Guias de Referência', type: 'standard', tag: 'Oficial' }
      ],
      recommendedPrompts: initialTopic?.recommendedPrompts || [
        { label: 'Explicar Conceito', prompt: `Explique os 20% essenciais de ${title.trim()} de forma executiva e direta.` },
        { label: 'Simular Caso Real', prompt: `Crie um estudo de caso corporativo sobre ${title.trim()} para testar minha tomada de decisão.` }
      ],
      notes: initialTopic?.notes || '',
      architectureDecisions: initialTopic?.architectureDecisions || '',
      studyMinutes: initialTopic?.studyMinutes || 0,
      lastStudied: initialTopic?.lastStudied,
      nextReviewDate: initialTopic?.nextReviewDate,
      history: initialTopic?.history || []
    };

    onSave(savedTopic);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-brand-surface border border-white/10 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md text-white font-mono font-bold text-sm"
              style={{ backgroundColor: `${trackColor}25`, border: `1px solid ${trackColor}60`, color: trackColor }}
            >
              {code || '+'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEdit ? 'Editar Matéria / Módulo' : 'Nova Matéria na Área'}
              </h2>
              <p className="text-xs text-gray-400">
                Área de Estudo: <span className="font-semibold text-white">{trackName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Código e Título */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-1 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Código
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: 1.1"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-brand-accent placeholder-gray-500 focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>

            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Título da Matéria <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Camada Semântica & Metrics Layer"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Subtítulo / Módulo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Subtítulo do Módulo
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Ex: Módulo 1: Infraestrutura Semântica e Observabilidade"
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>

          {/* Objetivo de Aprendizado */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Objetivo de Aprendizado (Regra de Pareto 80/20)
            </label>
            <textarea
              value={learningObjective}
              onChange={(e) => setLearningObjective(e.target.value)}
              rows={2}
              placeholder="Ex: Dominar a arquitetura moderna para unificar KPIs e evitar alucinações em Agentes de IA."
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent transition-colors resize-none"
            />
          </div>

          {/* Tópicos-Chave (Dinâmicos) */}
          <div className="space-y-2.5 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  Tópicos-Chave (Checklist de Domínio)
                </label>
                <p className="text-[11px] text-gray-400">
                  Os conceitos fundamentais que respondem pelos 80% dos resultados práticos.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddKeyTopicRow}
                className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-brand-accent text-xs font-bold border border-white/10 flex items-center gap-1 transition-colors"
              >
                <Plus size={14} />
                <span>Adicionar Tópico</span>
              </button>
            </div>

            <div className="space-y-2">
              {keyTopicsList.map((kt, index) => (
                <div key={index} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                  <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs font-mono text-gray-400 shrink-0 mt-1">
                    {index + 1}
                  </span>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={kt.title}
                      onChange={(e) => handleKeyTopicChange(index, 'title', e.target.value)}
                      placeholder={`Título do tópico ${index + 1} (ex: Diferença entre Camadas Semânticas)`}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent"
                    />
                    <input
                      type="text"
                      value={kt.details}
                      onChange={(e) => handleKeyTopicChange(index, 'details', e.target.value)}
                      placeholder="Detalhes ou diretrizes práticas (opcional)"
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1 text-[11px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-brand-accent"
                    />
                  </div>
                  {keyTopicsList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyTopicRow(index)}
                      className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors mt-1"
                      title="Remover tópico"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Entregável Prático (Notebook / Script) */}
          <div className="space-y-2.5 pt-2 border-t border-white/10">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Code2 size={14} className="text-brand-accent" />
              Entregável Prático (Notebook / Projeto)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <input
                  type="text"
                  value={deliverableTitle}
                  onChange={(e) => setDeliverableTitle(e.target.value)}
                  placeholder="Nome do Notebook (ex: Script de Métricas & RAG)"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent"
                />
              </div>
              <div className="space-y-1">
                <input
                  type="text"
                  value={deliverableDesc}
                  onChange={(e) => setDeliverableDesc(e.target.value)}
                  placeholder="Descrição do que será construído na prática"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-lg hover:opacity-90 flex items-center gap-2"
              style={{ backgroundColor: trackColor }}
            >
              <Sparkles size={14} />
              <span>{isEdit ? 'Salvar Alterações' : 'Criar Matéria'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
