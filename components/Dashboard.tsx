import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, Pause, RefreshCw, Calendar as CalendarIcon, 
  Youtube, TrendingUp, BrainCircuit, 
  Database, Brain, ShieldAlert, CheckCircle2, 
  Clock, Zap, Code2, ArrowRight, ChevronLeft, ChevronRight, HardDrive
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine, Label
} from 'recharts';
import { GlassCard } from './ui/GlassCard';
import { YouTubeBrandLogo, GoogleDriveBrandLogo } from './ui/BrandLogos';
import { Topic, TrackId } from '../types';
import { TRACKS_DATA } from '../syllabusData';

interface DashboardProps {
  topics: Topic[];
  onSelectTrack: (trackId: TrackId) => void;
  onSelectTopic: (topic: Topic) => void;
  onProtectedAction: (action: () => void) => void;
  onUpdateTopic?: (updatedTopic: Topic) => void;
  activePomodoroTopicId?: string | null;
  setActivePomodoroTopicId?: (topicId: string | null) => void;
  onOpenWorkspace?: () => void;
}

// Dados baseados na Curva de Ebbinghaus
const forgettingData = [
  { name: 'Imediato', retention: 100 },
  { name: '20 min', retention: 58 },
  { name: '1h', retention: 44 },
  { name: '9h', retention: 36 },
  { name: '1 dia', retention: 33 },
  { name: '2 dias', retention: 28 },
  { name: '6 dias', retention: 25 },
  { name: '31 dias', retention: 21 },
];

export const Dashboard: React.FC<DashboardProps> = ({ 
  topics, 
  onSelectTrack,
  onSelectTopic, 
  onProtectedAction,
  onUpdateTopic,
  onOpenWorkspace,
}) => {
  // Pomodoro State (sem dropdown de seleção de matérias para interface limpa)
  const [pomodoroDuration, setPomodoroDuration] = useState<number>(30 * 60); // 30 min default
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [isActive, setIsActive] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Pomodoro interval
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      // Auto-log session to first available topic or general stats
      if (topics[0] && onUpdateTopic) {
        const addedMinutes = Math.round(pomodoroDuration / 60);
        onUpdateTopic({
          ...topics[0],
          studyMinutes: (topics[0].studyMinutes || 0) + addedMinutes,
          lastStudied: new Date().toISOString().split('T')[0]
        });
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, pomodoroDuration, topics, onUpdateTopic]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = (durationMinutes: number = 30) => {
    setIsActive(false);
    setPomodoroDuration(durationMinutes * 60);
    setTimeLeft(durationMinutes * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const changeDay = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + offset);
    setCurrentDate(newDate);
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    const daysInNewMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
    newDate.setDate(Math.min(currentDate.getDate(), daysInNewMonth));
    setCurrentDate(newDate);
  };

  const selectDay = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Metrics computation across tracks
  const statsOverview = useMemo(() => {
    const totalTopics = topics.length;
    const avgProgress = totalTopics > 0 
      ? Math.round(topics.reduce((acc, t) => acc + (t.progress || 0), 0) / totalTopics)
      : 0;
    const totalMinutes = topics.reduce((acc, t) => acc + (t.studyMinutes || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const completedDeliverables = topics.filter(t => t.deliverable?.completed).length;
    const masteredTopics = topics.filter(t => (t.progress || 0) >= 80).length;

    return {
      avgProgress,
      totalHours,
      completedDeliverables,
      masteredTopics,
      totalTopics
    };
  }, [topics]);

  // Track specific stats
  const trackStats = useMemo(() => {
    return TRACKS_DATA.map(track => {
      const trackTopics = topics.filter(t => t.trackId === track.id);
      const total = trackTopics.length;
      const progress = total > 0 
        ? Math.round(trackTopics.reduce((acc, t) => acc + (t.progress || 0), 0) / total)
        : 0;
      const deliverablesDone = trackTopics.filter(t => t.deliverable?.completed).length;
      const studyMinutes = trackTopics.reduce((acc, t) => acc + (t.studyMinutes || 0), 0);

      return {
        ...track,
        totalTopics: total,
        progress,
        deliverablesDone,
        studyHours: Math.round((studyMinutes / 60) * 10) / 10,
        topics: trackTopics
      };
    });
  }, [topics]);

  // Aggregated study techniques data for BarChart
  const techniqueData = useMemo(() => {
    const stats: Record<string, { name: string; completed: number; total: number }> = {};
    topics.forEach(topic => {
      topic.techniques?.forEach(tech => {
        if (!stats[tech.name]) {
          stats[tech.name] = { name: tech.name, completed: 0, total: 0 };
        }
        stats[tech.name].total += 1;
        if (tech.completed) {
          stats[tech.name].completed += 1;
        }
      });
    });
    return Object.values(stats).sort((a, b) => b.completed - a.completed);
  }, [topics]);

  // Topics needing review today or soon
  const reviewDueTopics = useMemo(() => {
    return topics.filter(t => t.nextReviewDate).slice(0, 3);
  }, [topics]);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-fade-in max-w-[1600px] mx-auto">
      
      {/* ============================================================== */}
      {/* PARETO METRICS BAR (LIMPO & ELEGANTE)                          */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-surface/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg">
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-gray-400 font-medium">Domínio Pareto</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono mt-1 block">
              {statsOverview.avgProgress}%
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Zap size={20} />
          </div>
        </div>

        <div className="bg-brand-surface/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg">
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-gray-400 font-medium">Tempo Estudado</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-mono mt-1 block">
              {statsOverview.totalHours}h
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-brand-surface/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg">
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-gray-400 font-medium">Notebooks Feitos</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono mt-1 block">
              {statsOverview.completedDeliverables}/{statsOverview.totalTopics}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Code2 size={20} />
          </div>
        </div>

        <div className="bg-brand-surface/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg">
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-gray-400 font-medium">Matérias 80/20</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono mt-1 block">
              {statsOverview.masteredTopics}/{statsOverview.totalTopics}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. QUADRO SUPERIOR (ACIMA): TEMPO, CALENDÁRIO & VIDEO/GOOGLE   */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* CARD 1: TEMPO DE FOCO (SEM SELEÇÃO DE MATÉRIAS, TOTALMENTE LIMPO) */}
        <GlassCard className="flex flex-col justify-between border-red-500/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-amber-500"></div>

          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-xs uppercase text-gray-300 font-bold tracking-wider flex items-center gap-1.5">
                <Clock size={15} className="text-red-400" />
                Tempo de Foco
              </span>

              {/* Botões de Duração */}
              <div className="flex gap-1">
                {[25, 30, 50].map((min) => (
                  <button
                    key={min}
                    onClick={() => resetTimer(min)}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                      pomodoroDuration === min * 60 
                        ? 'bg-red-500 text-white shadow-sm' 
                        : 'bg-white/5 hover:bg-white/10 text-gray-400'
                    }`}
                  >
                    {min}m
                  </button>
                ))}
              </div>
            </div>

            {/* Display do Relógio */}
            <div className="text-center py-4">
              <div className="text-5xl sm:text-6xl font-extrabold font-mono text-white tabular-nums tracking-tighter">
                {formatTime(timeLeft)}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {isActive ? 'Sessão em andamento' : 'Pronto para iniciar'}
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-2 border-t border-white/10">
            <button 
              onClick={toggleTimer}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all ${
                isActive 
                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
              }`}
            >
              {isActive ? <><Pause size={16} /> Pausar</> : <><Play size={16} /> Iniciar Foco</>}
            </button>

            <button 
              onClick={() => resetTimer(Math.round(pomodoroDuration / 60))}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors border border-white/5"
              title="Reiniciar timer"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </GlassCard>

        {/* CARD 2: CALENDÁRIO */}
        <GlassCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <span className="text-xs uppercase text-gray-300 font-bold tracking-wider flex items-center gap-1.5">
                <CalendarIcon size={15} className="text-brand-accent" />
                Calendário
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={goToToday}
                  className="text-[10px] text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded font-medium transition-colors"
                  title="Voltar para a data de hoje"
                >
                  Hoje
                </button>
                <span className="text-[10px] text-brand-accent bg-brand-primary/20 px-2.5 py-0.5 rounded-full font-mono font-bold border border-brand-primary/30">
                  {currentDate.getFullYear()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3 px-1">
              <button 
                onClick={() => changeDay(-1)} 
                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Dia anterior"
              >
                <ChevronLeft size={18}/>
              </button>
              <div className="text-center">
                <span className="block text-lg font-bold text-white">
                  {monthNames[currentDate.getMonth()]}
                </span>
              </div>
              <button 
                onClick={() => changeDay(1)} 
                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Próximo dia"
              >
                <ChevronRight size={18}/>
              </button>
            </div>
          </div>

          <div className="text-center p-4 bg-brand-dark/60 rounded-xl border border-white/5 my-1">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">Sessão Ativa</p>
            <p className="text-4xl font-extrabold text-brand-accent font-mono">{currentDate.getDate()}</p>
            <p className="text-gray-300 text-xs capitalize mt-0.5 font-medium">
              {currentDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
            </p>
          </div>

          <div className="pt-2 text-center border-t border-white/5 text-[11px] text-gray-500">
            Ciclo diário de estudos ativo
          </div>
        </GlassCard>

        {/* CARD 3: YOUTUBE & GOOGLE DRIVE (SEM FUNDO / TRANSPARENTE, APENAS OS LOGOS COM ESCRITA BRANCA) */}
        <div className="flex flex-col justify-between gap-4">
          
          {/* YOUTUBE */}
          <div 
            onClick={() => onProtectedAction(() => window.open('https://youtube.com', '_blank'))} 
            className="flex-1 flex items-center justify-between px-6 py-6 rounded-2xl bg-transparent hover:bg-white/5 border border-white/10 hover:border-red-500/40 group cursor-pointer transition-all shadow-sm"
            title="Abrir YouTube"
          >
            <YouTubeBrandLogo />
            <ArrowRight size={18} className="text-gray-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
          </div>

          {/* GOOGLE DRIVE */}
          <div 
            onClick={() => {
              if (onOpenWorkspace) {
                onOpenWorkspace();
              } else {
                onProtectedAction(() => window.open('https://drive.google.com', '_blank'));
              }
            }} 
            className="flex-1 flex items-center justify-between px-6 py-6 rounded-2xl bg-transparent hover:bg-white/5 border border-white/10 hover:border-cyan-500/40 group cursor-pointer transition-all shadow-sm"
            title="Abrir Google Drive"
          >
            <GoogleDriveBrandLogo />
            <ArrowRight size={18} className="text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>

        </div>

      </div>

      {/* ============================================================== */}
      {/* 2. TRILHA DO CONHECIMENTO (LOGO ABAIXO DO QUADRO SUPERIOR)     */}
      {/* ============================================================== */}
      <div className="space-y-4 pt-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trackStats.map((track) => {
            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track.id)}
                className="group cursor-pointer rounded-2xl p-6 transition-all duration-300 relative overflow-hidden border bg-brand-surface/90 hover:bg-brand-surface border-white/10 hover:border-white/30 hover:scale-[1.01] shadow-xl hover:shadow-2xl flex flex-col justify-between"
              >
                {/* Glow suave */}
                <div 
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-15 pointer-events-none group-hover:opacity-30 transition-opacity"
                  style={{ backgroundColor: track.color }}
                />

                <div>
                  {/* Topo do Card da Trilha: Ícone + Número de Matérias */}
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105"
                      style={{ backgroundColor: `${track.color}25`, border: `1px solid ${track.color}60` }}
                    >
                      {track.iconName === 'Database' && <Database size={24} style={{ color: track.color }} />}
                      {track.iconName === 'Brain' && <Brain size={24} style={{ color: track.color }} />}
                      {track.iconName === 'ShieldAlert' && <ShieldAlert size={24} style={{ color: track.color }} />}
                    </div>

                    <span 
                      className="text-xs font-mono font-bold px-3 py-1 rounded-full border"
                      style={{ 
                        backgroundColor: `${track.color}15`, 
                        color: track.color, 
                        borderColor: `${track.color}40` 
                      }}
                    >
                      {track.totalTopics} Matérias
                    </span>
                  </div>

                  {/* Nome Principal da Trilha */}
                  <h3 className="text-xl font-bold text-white group-hover:text-white transition-colors mb-4">
                    {track.name}
                  </h3>
                </div>

                <div className="space-y-4 pt-2 border-t border-white/10">
                  {/* Progresso da Trilha */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-400">Progresso</span>
                      <span className="font-mono font-bold text-white">{track.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full rounded-full transition-all duration-700"
                        style={{ 
                          width: `${track.progress}%`,
                          backgroundColor: track.color 
                        }}
                      />
                    </div>
                  </div>

                  {/* Horas, Notebooks e Acesso a Matérias */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                    <span className="text-gray-400 font-mono text-[11px]">
                      ⏱️ {track.studyHours}h • 💻 {track.deliverablesDone}/{track.totalTopics} Notebooks
                    </span>
                    
                    <span 
                      className="font-bold inline-flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
                      style={{ color: track.color }}
                    >
                      Acessar Matérias
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. QUADRO DE ANÁLISE: CURVA, APLICAÇÃO DE ESTUDO & REVISÃO     */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* CARD 1: CURVA DE ESQUECIMENTO (EBBINGHAUS) */}
        <GlassCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-white font-bold text-sm flex items-center gap-2">
                <TrendingUp size={16} className="text-cyan-400" />
                Curva de Esquecimento
              </h4>
              <span className="text-[10px] text-cyan-400 font-mono">Ebbinghaus</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">Retenção de memória ao longo do tempo.</p>
          </div>
          
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forgettingData}>
                <defs>
                  <linearGradient id="colorRetentionDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={9} 
                  tick={{fill: '#94a3b8'}}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={9} 
                  unit="%" 
                  tick={{fill: '#94a3b8'}} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`${value}%`, 'Retenção']}
                />
                <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3">
                  <Label value="Zona Crítica" position="insideTopRight" fill="#ef4444" fontSize={9} offset={5} />
                </ReferenceLine>
                <Area type="monotone" dataKey="retention" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorRetentionDash)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* CARD 2: APLICAÇÃO DE MÉTODOS DE ESTUDO */}
        <GlassCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-white font-bold text-sm flex items-center gap-2">
                <BrainCircuit size={16} className="text-purple-400" />
                Aplicação de Estudo
              </h4>
              <span className="text-[10px] text-purple-400 font-mono">4 Métodos</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">Técnicas aplicadas nas 7 matérias.</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={techniqueData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#cbd5e1" 
                  fontSize={10} 
                  width={120} 
                  tick={{fill: '#cbd5e1'}}
                />
                <Tooltip 
                  cursor={{fill: '#ffffff10'}}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="completed" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={14} name="Concluídos">
                  {techniqueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.completed === entry.total && entry.total > 0 ? '#10b981' : '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* CARD 3: REVISÕES AGENDADAS */}
        <GlassCard className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <h4 className="text-xs uppercase text-gray-300 font-bold tracking-wider flex items-center gap-1.5">
                <Clock size={15} className="text-amber-400" />
                Revisão
              </h4>
              <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono">
                D+1, D+7, D+21
              </span>
            </div>

            <div className="space-y-2.5">
              {reviewDueTopics.length > 0 ? (
                reviewDueTopics.map(t => (
                  <div
                    key={t.id}
                    onClick={() => onProtectedAction(() => onSelectTopic(t))}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-400 block">{t.code}</span>
                      <span className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors line-clamp-1">{t.title}</span>
                    </div>
                    <span className="text-[11px] font-mono text-gray-400 group-hover:text-white">
                      {t.nextReviewDate ? new Date(t.nextReviewDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '-'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-5 rounded-xl bg-white/5 border border-dashed border-white/10 text-center my-2">
                  <p className="text-xs text-gray-400 font-medium">Nenhuma revisão pendente.</p>
                  <p className="text-[10px] text-gray-500 mt-1">O ciclo de repetição espaçada é atualizado conforme você estuda.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 text-center border-t border-white/5 text-[11px] text-gray-500">
            Repetição espaçada para fixação a longo prazo
          </div>
        </GlassCard>

      </div>

    </div>
  );
};
