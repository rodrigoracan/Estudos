import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { TrackInfo } from '../types';
import { TrackIcon, AVAILABLE_TRACK_ICONS } from './ui/TrackIcon';

interface TrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (track: TrackInfo) => void;
  initialTrack?: TrackInfo | null;
}

const COLOR_PRESETS = [
  { label: 'Ciano', color: '#06b6d4', accent: '#0ea5e9' },
  { label: 'Violeta', color: '#8b5cf6', accent: '#a855f7' },
  { label: 'Rosa Carmim', color: '#f43f5e', accent: '#fb7185' },
  { label: 'Esmeralda', color: '#10b981', accent: '#34d399' },
  { label: 'Âmbar / Dourado', color: '#f59e0b', accent: '#fbbf24' },
  { label: 'Azul Real', color: '#3b82f6', accent: '#60a5fa' },
  { label: 'Índigo', color: '#6366f1', accent: '#818cf8' },
  { label: 'Fúcsia', color: '#d946ef', accent: '#e879f9' },
  { label: 'Laranja', color: '#f97316', accent: '#fb923c' },
  { label: 'Teal', color: '#14b8a6', accent: '#2dd4bf' },
];

export const TrackModal: React.FC<TrackModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTrack
}) => {
  const isEdit = Boolean(initialTrack);

  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#06b6d4');
  const [accentColor, setAccentColor] = useState('#0ea5e9');
  const [iconName, setIconName] = useState('Database');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTrack) {
      setName(initialTrack.name || '');
      setSubtitle(initialTrack.subtitle || '');
      setDescription(initialTrack.description || '');
      setColor(initialTrack.color || '#06b6d4');
      setAccentColor(initialTrack.accentColor || '#0ea5e9');
      setIconName(initialTrack.iconName || 'Database');
    } else {
      // Defaults for new track
      setName('');
      setSubtitle('');
      setDescription('');
      setColor('#06b6d4');
      setAccentColor('#0ea5e9');
      setIconName('Layers');
    }
    setError(null);
  }, [initialTrack, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome da área de estudo.');
      return;
    }

    // Generate clean ID if creating
    const id = initialTrack?.id || `trilha-${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)}`;

    const trackData: TrackInfo = {
      id,
      name: name.trim(),
      subtitle: subtitle.trim() || 'Plano de Estudos & Especialização',
      description: description.trim() || 'Domínio dos 20% de Pareto com foco prático e cadernos executivos.',
      color,
      accentColor,
      iconName
    };

    onSave(trackData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-brand-surface border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{ backgroundColor: `${color}25`, border: `1px solid ${color}60` }}
            >
              <TrackIcon name={iconName} size={20} style={{ color }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEdit ? 'Editar Área de Estudo' : 'Nova Área de Estudo'}
              </h2>
              <p className="text-xs text-gray-400">
                {isEdit ? 'Atualize as informações, cores e ícone da trilha' : 'Crie uma nova trilha com a mesma estrutura executiva e métricas'}
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

        {/* Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Nome da Área */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Nome da Área de Estudo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Engenharia de Prompt & Agentes de IA"
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent transition-colors"
              autoFocus
            />
          </div>

          {/* Subtítulo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Subtítulo / Especialidade
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Ex: Arquitetura Multi-Agente & Avaliação de LLMs"
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Descrição Estratégica
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Ex: Domínio dos 20% de Pareto na criação de fluxos autônomos, guardrails e orquestração de modelos de linguagem para produção."
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent transition-colors resize-none"
            />
          </div>

          {/* Seletor de Cores */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
              Cor Temática da Trilha
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {COLOR_PRESETS.map((preset) => {
                const isSelected = color === preset.color;
                return (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => {
                      setColor(preset.color);
                      setAccentColor(preset.accent);
                    }}
                    className={`h-9 rounded-xl flex items-center justify-center transition-all relative border ${
                      isSelected ? 'ring-2 ring-white scale-105 shadow-lg' : 'hover:scale-105 border-white/10'
                    }`}
                    style={{ backgroundColor: preset.color }}
                    title={preset.label}
                  >
                    {isSelected && <Check size={14} className="text-white drop-shadow-md" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seletor de Ícone */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
              Ícone Representativo
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVAILABLE_TRACK_ICONS.map((item) => {
                const isSelected = iconName === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIconName(item.name)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      isSelected 
                        ? 'bg-white/15 border-white shadow-md text-white' 
                        : 'bg-slate-950/50 hover:bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                    style={isSelected ? { borderColor: color, color } : {}}
                    title={item.label}
                  >
                    <item.icon size={20} />
                    <span className="text-[10px] truncate max-w-full font-medium">
                      {item.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
              Pré-visualização do Bloco
            </span>
            <div 
              className="p-4 rounded-2xl border bg-slate-950/80 relative overflow-hidden flex items-center gap-4"
              style={{ borderColor: `${color}40` }}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shrink-0"
                style={{ backgroundColor: `${color}25`, border: `1px solid ${color}60` }}
              >
                <TrackIcon name={iconName} size={24} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white text-base truncate">
                  {name || 'Nome da Nova Área'}
                </h4>
                <p className="text-xs text-gray-300 truncate">
                  {subtitle || 'Subtítulo da Especialidade'}
                </p>
                <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                  {description || 'Descrição dos objetivos executivos e práticos.'}
                </p>
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
              style={{ backgroundColor: color }}
            >
              <Sparkles size={14} />
              <span>{isEdit ? 'Salvar Alterações' : 'Criar Área de Estudo'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
