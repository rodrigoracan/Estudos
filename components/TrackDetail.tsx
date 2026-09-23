import React, { useMemo } from 'react';
import { 
  ArrowLeft, CheckCircle2, Clock, Star, ArrowUpRight, 
  Database, Brain, ShieldAlert, BookOpen, Sparkles, Zap, ChevronRight, FileText
} from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Topic, TrackInfo, TrackId } from '../types';

interface TrackDetailProps {
  track: TrackInfo;
  topics: Topic[];
  onBack: () => void;
  onSelectTopic: (topic: Topic) => void;
  onSelectOtherTrack: (trackId: TrackId) => void;
  allTracks: TrackInfo[];
}

export const TrackDetail: React.FC<TrackDetailProps> = ({
  track,
  topics,
  onBack,
  onSelectTopic,
  onSelectOtherTrack,
  allTracks
}) => {
  const trackTopics = useMemo(() => {
    return topics.filter(t => t.trackId === track.id);
  }, [topics, track.id]);

  const stats = useMemo(() => {
    const total = trackTopics.length;
    const progress = total > 0 
      ? Math.round(trackTopics.reduce((acc, t) => acc + (t.progress || 0), 0) / total)
      : 0;
    const totalMinutes = trackTopics.reduce((acc, t) => acc + (t.studyMinutes || 0), 0);
    const studyHours = Math.round((totalMinutes / 60) * 10) / 10;
    const notebooksDone = trackTopics.filter(t => t.deliverable?.completed).length;
    const masteredCount = trackTopics.filter(t => (t.progress || 0) >= 80).length;

    return { total, progress, studyHours, notebooksDone, masteredCount };
  }, [trackTopics]);

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in max-w-[1600px] mx-auto">
      
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/10 text-xs font-semibold"
          >
            <ArrowLeft size={16} />
            <span>Voltar ao Dashboard</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <span>Dashboard</span>
            <ChevronRight size={14} />
            <span className="text-white font-medium">Trilha: {track.name}</span>
          </div>
        </div>

        {/* Quick switcher between tracks */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-gray-500 font-medium hidden md:inline">Outras trilhas:</span>
          {allTracks.map((t) => {
            const isCurrent = t.id === track.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectOtherTrack(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                  isCurrent
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/5'
                }`}
                style={isCurrent ? { borderColor: t.color, color: t.color } : {}}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Track Banner / Hero */}
      <div 
        className="rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-r from-slate-900 via-brand-surface to-slate-900"
      >
        <div 
          className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: track.color }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl"
                style={{ backgroundColor: `${track.color}25`, border: `1px solid ${track.color}60` }}
              >
                {track.iconName === 'Database' && <Database size={26} style={{ color: track.color }} />}
                {track.iconName === 'Brain' && <Brain size={26} style={{ color: track.color }} />}
                {track.iconName === 'ShieldAlert' && <ShieldAlert size={26} style={{ color: track.color }} />}
              </div>
              <div>
                <span 
                  className="text-xs font-mono font-bold uppercase tracking-wider block"
                  style={{ color: track.color }}
                >
                  Trilha Especialista 2026
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {track.name}
                </h1>
              </div>
            </div>

            <p className="text-sm font-semibold text-gray-300">
              {track.subtitle}
            </p>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              {track.description}
            </p>
          </div>

          {/* Quick Metrics of this track */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-brand-dark/70 border border-white/10 rounded-2xl p-4 text-center">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono" style={{ color: track.color }}>
                {stats.progress}%
              </span>
              <span className="block text-[11px] uppercase tracking-wider text-gray-400 mt-1">Domínio da Trilha</span>
            </div>

            <div className="bg-brand-dark/70 border border-white/10 rounded-2xl p-4 text-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {stats.studyHours}h
              </span>
              <span className="block text-[11px] uppercase tracking-wider text-gray-400 mt-1">Horas de Estudo</span>
            </div>

            <div className="bg-brand-dark/70 border border-white/10 rounded-2xl p-4 text-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                {stats.notebooksDone}/{stats.total}
              </span>
              <span className="block text-[11px] uppercase tracking-wider text-gray-400 mt-1">Notebooks Feitos</span>
            </div>

            <div className="bg-brand-dark/70 border border-white/10 rounded-2xl p-4 text-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                {stats.masteredCount}/{stats.total}
              </span>
              <span className="block text-[11px] uppercase tracking-wider text-gray-400 mt-1">Matérias 80/20</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <FileText size={20} style={{ color: track.color }} />
            Matérias Integradas nesta Trilha ({trackTopics.length})
          </h2>
          <p className="text-xs text-gray-400">
            Selecione qualquer matéria para abrir o Caderno Digital de Anotações, Diretrizes de Arquitetura e o Entregável Prático.
          </p>
        </div>
      </div>

      {/* Cards List of Topics belonging to this Track */}
      <div className="grid grid-cols-1 gap-4">
        {trackTopics.map((topic) => {
          const completedKeyTopics = topic.keyTopics.filter(kt => kt.completed).length;
          const totalKeyTopics = topic.keyTopics.length;

          return (
            <GlassCard 
              key={topic.id}
              onClick={() => onSelectTopic(topic)}
              className="group relative overflow-hidden transition-all duration-300 hover:border-brand-accent/60 cursor-pointer border-l-4"
              style={{ borderLeftColor: track.color }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Main Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span 
                      className="font-mono font-bold text-xs px-2.5 py-0.5 rounded border"
                      style={{ 
                        backgroundColor: `${track.color}15`, 
                        borderColor: `${track.color}40`,
                        color: track.color 
                      }}
                    >
                      {topic.code}
                    </span>
                    <span className="text-xs font-semibold text-gray-400">
                      {topic.category}
                    </span>
                    {topic.deliverable?.completed && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Notebook Pronto
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-brand-accent transition-colors">
                    {topic.title}
                  </h3>

                  <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                    {topic.learningObjective}
                  </p>

                  {/* Key Topics Checklist Preview */}
                  <div className="pt-2 flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1 text-gray-300 font-medium">
                      <CheckCircle2 size={14} className={completedKeyTopics === totalKeyTopics && totalKeyTopics > 0 ? 'text-emerald-400' : 'text-gray-500'} />
                      {completedKeyTopics}/{totalKeyTopics} tópicos-chave
                    </span>

                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {Math.floor((topic.studyMinutes || 0) / 60)}h {(topic.studyMinutes || 0) % 60}m
                    </span>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          size={12} 
                          className={s <= (topic.confidenceLevel || 1) ? 'text-amber-400 fill-amber-400' : 'text-gray-600'} 
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side Progress & Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5 min-w-[150px]">
                  <div className="text-left sm:text-right">
                    <span className="text-2xl font-extrabold text-white font-mono">
                      {Math.round(topic.progress)}%
                    </span>
                    <span className="block text-[10px] uppercase text-gray-400 font-semibold">
                      Domínio Pareto
                    </span>
                  </div>

                  <div className="w-24 sm:w-28 bg-slate-900 h-2 rounded-full overflow-hidden border border-white/10">
                    <div 
                      className="h-full rounded-full transition-all duration-700"
                      style={{ 
                        width: `${topic.progress}%`,
                        backgroundColor: track.color
                      }}
                    />
                  </div>

                  <div className="text-xs font-bold text-brand-accent hover:text-white flex items-center gap-1 pt-1 transition-colors">
                    <span>Acessar Anotações</span>
                    <ArrowUpRight size={14} />
                  </div>
                </div>

              </div>
            </GlassCard>
          );
        })}
      </div>

    </div>
  );
};
