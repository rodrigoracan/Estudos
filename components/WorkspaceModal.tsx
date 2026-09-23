import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, CheckSquare, HardDrive, 
  ExternalLink, Upload, Plus, RefreshCw, AlertCircle
} from 'lucide-react';
import { 
  listDriveFiles, 
  createDriveStudyNote, 
  listCalendarEvents, 
  createCalendarStudySession, 
  listGoogleTasks, 
  createGoogleTask, 
  updateGoogleTaskStatus,
  DriveFileItem,
  CalendarEventItem,
  GoogleTaskItem
} from '../src/lib/googleWorkspace.ts';
import { getAccessToken, googleSignIn } from '../src/lib/firebase.ts';
import { Topic } from '../types';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
}

type TabType = 'drive' | 'calendar' | 'tasks';

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({ isOpen, onClose, topics }) => {
  const [activeTab, setActiveTab] = useState<TabType>('drive');
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  
  // Calendar state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [newSessionTitle, setNewSessionTitle] = useState('Revisão Pareto 80/20');
  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSessionTime, setNewSessionTime] = useState('19:00');
  
  // Tasks state
  const [tasks, setTasks] = useState<GoogleTaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Confirmation dialog state for destructive/mutating actions
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkTokenAndLoad();
    }
  }, [isOpen, activeTab]);

  const checkTokenAndLoad = async () => {
    setError(null);
    setSuccessMsg(null);
    const existingToken = await getAccessToken();
    setToken(existingToken);

    if (existingToken) {
      loadTabData(existingToken);
    }
  };

  const handleConnectWorkspace = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await googleSignIn();
      if (res?.accessToken) {
        setToken(res.accessToken);
        await loadTabData(res.accessToken);
      }
    } catch (err: any) {
      console.error('Workspace connect error:', err);
      setError(err.message || 'Falha ao autorizar Google Workspace');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTabData = async (accessToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'drive') {
        const files = await listDriveFiles(accessToken);
        setDriveFiles(files);
      } else if (activeTab === 'calendar') {
        const events = await listCalendarEvents(accessToken);
        setCalendarEvents(events);
      } else if (activeTab === 'tasks') {
        const taskList = await listGoogleTasks(accessToken);
        setTasks(taskList);
      }
    } catch (err: any) {
      console.error(`Error loading ${activeTab}:`, err);
      setError(`Erro ao carregar ${activeTab}: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Drive: Backup Notes
  const handleBackupNotesToDrive = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Salvar Backup das Matérias no Google Drive?',
      description: 'Isso criará um novo arquivo de anotações (Markdown) na sua conta do Google Drive com o resumo atualizado do RACAN LEARN PLAN 2026.',
      onConfirm: async () => {
        if (!token) return;
        setIsLoading(true);
        try {
          const content = `# RACAN LEARN PLAN 2026 - BACKUP DE ESTUDOS\nData: ${new Date().toLocaleString()}\n\n` +
            topics.map(t => `## [${t.code}] ${t.title} (${t.category})\nProgresso: ${t.progress}%\nHoras: ${Math.round(((t.studyMinutes || 0)/60)*10)/10}h\nNotas: ${t.notes || 'Sem anotações'}\n\n`).join('\n');
          
          const created = await createDriveStudyNote(token, `RACAN_Plano_Estudos_2026_${new Date().toISOString().split('T')[0]}.md`, content);
          setSuccessMsg(`Arquivo salvo com sucesso no Google Drive: ${created.name}`);
          await loadTabData(token);
        } catch (err: any) {
          setError(err.message || 'Erro ao salvar no Google Drive');
        } finally {
          setIsLoading(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  // Google Calendar: Schedule Session
  const handleScheduleCalendar = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Agendar Sessão no Google Calendar?',
      description: `Será agendado o evento "${newSessionTitle}" para ${newSessionDate} às ${newSessionTime} (duração de 45 minutos) com lembretes automáticos.`,
      onConfirm: async () => {
        if (!token) return;
        setIsLoading(true);
        try {
          const startDateTime = `${newSessionDate}T${newSessionTime}:00`;
          const endObj = new Date(new Date(startDateTime).getTime() + 45 * 60 * 1000);
          const endDateTime = endObj.toISOString().slice(0, 19);

          await createCalendarStudySession(token, {
            summary: `RACAN Study: ${newSessionTitle}`,
            description: 'Sessão focada do plano de estudos 2026 (Método Pareto 80/20 & Feynman).',
            startDateTime: new Date(startDateTime).toISOString(),
            endDateTime: endObj.toISOString(),
          });
          setSuccessMsg('Evento agendado com sucesso no Google Calendar!');
          await loadTabData(token);
        } catch (err: any) {
          setError(err.message || 'Erro ao agendar no Calendar');
        } finally {
          setIsLoading(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  // Google Tasks: Sync Topics as Tasks
  const handleSyncTopicsToTasks = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Sincronizar Matérias no Google Tasks?',
      description: `Criar tarefas individuais na sua lista padrão do Google Tasks para as ${topics.length} matérias do cronograma 2026.`,
      onConfirm: async () => {
        if (!token) return;
        setIsLoading(true);
        try {
          let count = 0;
          for (const topic of topics) {
            await createGoogleTask(token, {
              title: `[${topic.code}] Estudar ${topic.title}`,
              notes: `Trilha: ${topic.category} | Entregável: ${topic.deliverable?.title || 'Notebook 80/20'}`,
            });
            count++;
          }
          setSuccessMsg(`${count} matérias adicionadas ao seu Google Tasks!`);
          await loadTabData(token);
        } catch (err: any) {
          setError(err.message || 'Erro ao sincronizar com Google Tasks');
        } finally {
          setIsLoading(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  // Google Tasks: Create single task
  const handleCreateSingleTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newTaskTitle.trim()) return;
    setIsLoading(true);
    try {
      await createGoogleTask(token, { title: newTaskTitle.trim() });
      setNewTaskTitle('');
      setSuccessMsg('Tarefa criada no Google Tasks!');
      await loadTabData(token);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar tarefa');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Tasks: Toggle status
  const handleToggleTaskStatus = (task: GoogleTaskItem) => {
    const nextCompleted = task.status !== 'completed';
    setConfirmDialog({
      isOpen: true,
      title: nextCompleted ? 'Marcar Tarefa como Concluída?' : 'Reabrir Tarefa no Google Tasks?',
      description: `Atualizar o status de "${task.title}" diretamente na sua conta do Google Tasks.`,
      onConfirm: async () => {
        if (!token) return;
        setIsLoading(true);
        try {
          await updateGoogleTaskStatus(token, task.id, nextCompleted);
          await loadTabData(token);
        } catch (err: any) {
          setError(err.message || 'Erro ao atualizar tarefa');
        } finally {
          setIsLoading(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-brand-surface border border-brand-primary/30 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-brand-surface to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white shadow-md">
              <HardDrive size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Google Workspace Integrado</h2>
              <p className="text-xs text-gray-400">Google Drive • Google Calendar • Google Tasks</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Banners */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckSquare size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="px-6 pt-4 flex gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab('drive')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all ${
              activeTab === 'drive'
                ? 'border-brand-accent text-brand-accent bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <HardDrive size={15} />
            Google Drive
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all ${
              activeTab === 'calendar'
                ? 'border-brand-accent text-brand-accent bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Calendar size={15} />
            Google Calendar
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all ${
              activeTab === 'tasks'
                ? 'border-brand-accent text-brand-accent bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <CheckSquare size={15} />
            Google Tasks
          </button>

          {token && (
            <button
              onClick={() => loadTabData(token)}
              disabled={isLoading}
              className="ml-auto p-2 text-gray-400 hover:text-white transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {!token ? (
            <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-white/5 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center text-brand-accent">
                <HardDrive size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Conecte sua Conta Google</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                  Autorize o acesso ao Google Drive (backup de notas), Google Calendar (agendamento de revisões) e Google Tasks (tarefas de matérias).
                </p>
              </div>
              <button
                onClick={handleConnectWorkspace}
                disabled={isLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white font-bold rounded-xl text-xs shadow-lg hover:opacity-90 transition-all inline-flex items-center gap-2"
              >
                {isLoading ? 'Conectando...' : 'Conectar com Google Workspace'}
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: GOOGLE DRIVE */}
              {activeTab === 'drive' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div>
                      <h4 className="text-sm font-bold text-white">Backup do Plano de Estudos</h4>
                      <p className="text-xs text-gray-400">Gera arquivo Markdown com o resumo das 7 matérias e anotações.</p>
                    </div>
                    <button
                      onClick={handleBackupNotesToDrive}
                      disabled={isLoading}
                      className="px-4 py-2 bg-brand-primary/30 hover:bg-brand-primary/50 border border-brand-primary/50 text-brand-accent text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0"
                    >
                      <Upload size={14} />
                      Fazer Backup no Drive
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-300">Arquivos Recentes no seu Google Drive</span>
                      <a
                        href="https://drive.google.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        Abrir Drive <ExternalLink size={12} />
                      </a>
                    </div>

                    {driveFiles.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-400 bg-slate-900/40 rounded-xl border border-white/5">
                        {isLoading ? 'Carregando arquivos...' : 'Nenhum arquivo listado ou permissão pendente.'}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {driveFiles.map(file => (
                          <div
                            key={file.id}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <HardDrive size={16} className="text-brand-accent shrink-0" />
                              <span className="text-xs font-medium text-white truncate max-w-sm">{file.name}</span>
                            </div>
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-400 hover:text-cyan-400 p-1 transition-colors"
                                title="Visualizar no Drive"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: GOOGLE CALENDAR */}
              {activeTab === 'calendar' && (
                <div className="space-y-4">
                  {/* Schedule Box */}
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Calendar size={16} className="text-brand-accent" />
                      Agendar Nova Sessão de Estudo no Calendar
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={newSessionTitle}
                        onChange={e => setNewSessionTitle(e.target.value)}
                        placeholder="Título do estudo"
                        className="bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white sm:col-span-1"
                      />
                      <input
                        type="date"
                        value={newSessionDate}
                        onChange={e => setNewSessionDate(e.target.value)}
                        className="bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="time"
                        value={newSessionTime}
                        onChange={e => setNewSessionTime(e.target.value)}
                        className="bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <button
                      onClick={handleScheduleCalendar}
                      disabled={isLoading}
                      className="w-full py-2 bg-brand-primary/30 hover:bg-brand-primary/50 border border-brand-primary/50 text-brand-accent text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={14} />
                      Agendar no Google Calendar
                    </button>
                  </div>

                  {/* Upcoming events list */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-300">Próximos Eventos de Estudo</span>
                      <a
                        href="https://calendar.google.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        Abrir Calendar <ExternalLink size={12} />
                      </a>
                    </div>

                    {calendarEvents.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-400 bg-slate-900/40 rounded-xl border border-white/5">
                        {isLoading ? 'Carregando eventos...' : 'Nenhum evento futuro encontrado no calendário primário.'}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {calendarEvents.map(evt => (
                          <div
                            key={evt.id}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 flex items-center justify-between transition-colors"
                          >
                            <div>
                              <p className="text-xs font-bold text-white">{evt.summary}</p>
                              <p className="text-[11px] text-gray-400">
                                {evt.start.dateTime 
                                  ? new Date(evt.start.dateTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                                  : evt.start.date}
                              </p>
                            </div>
                            {evt.htmlLink && (
                              <a
                                href={evt.htmlLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-400 hover:text-cyan-400 p-1 transition-colors"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: GOOGLE TASKS */}
              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  {/* Sync all topics button */}
                  <div className="flex items-center justify-between gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div>
                      <h4 className="text-sm font-bold text-white">Sincronizar Ementa 2026</h4>
                      <p className="text-xs text-gray-400">Cria tarefas para as 7 matérias com código e entregáveis.</p>
                    </div>
                    <button
                      onClick={handleSyncTopicsToTasks}
                      disabled={isLoading}
                      className="px-4 py-2 bg-brand-primary/30 hover:bg-brand-primary/50 border border-brand-primary/50 text-brand-accent text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0"
                    >
                      <Plus size={14} />
                      Sincronizar Matérias
                    </button>
                  </div>

                  {/* Add single task */}
                  <form onSubmit={handleCreateSingleTask} className="flex gap-2">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      placeholder="Nova tarefa de estudo no Google Tasks..."
                      className="flex-1 bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-accent"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !newTaskTitle.trim()}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      Adicionar
                    </button>
                  </form>

                  {/* Tasks list */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-gray-300">Suas Tarefas no Google Tasks</span>

                    {tasks.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-400 bg-slate-900/40 rounded-xl border border-white/5">
                        {isLoading ? 'Carregando tarefas...' : 'Nenhuma tarefa encontrada na sua lista.'}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {tasks.map(task => (
                          <div
                            key={task.id}
                            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 flex items-center justify-between gap-3 transition-colors"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <input
                                type="checkbox"
                                checked={task.status === 'completed'}
                                onChange={() => handleToggleTaskStatus(task)}
                                className="w-4 h-4 rounded text-brand-accent bg-slate-800 border-gray-600 focus:ring-0 cursor-pointer"
                              />
                              <div>
                                <p className={`text-xs font-medium text-white truncate max-w-sm ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                                  {task.title}
                                </p>
                                {task.notes && (
                                  <p className="text-[10px] text-gray-400 truncate max-w-sm">{task.notes}</p>
                                )}
                              </div>
                            </div>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                              task.status === 'completed' 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {task.status === 'completed' ? 'Concluída' : 'Pendente'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Confirmation Dialog Modal (Mandatory User Confirmation for Destructive/Mutating operations) */}
        {confirmDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4 animate-fade-in">
            <div className="bg-slate-900 border border-amber-500/40 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-amber-400">
                <AlertCircle size={24} />
                <h3 className="text-base font-bold text-white">{confirmDialog.title}</h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {confirmDialog.description}
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-gray-300 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => confirmDialog.onConfirm()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md"
                >
                  Confirmar Operação
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
