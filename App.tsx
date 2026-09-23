import React, { useState, useEffect } from 'react';
import { User, Topic, ViewState, TrackId, TrackInfo } from './types';
import { AuthModal } from './components/AuthModal';
import { WorkspaceModal } from './components/WorkspaceModal';
import { Dashboard } from './components/Dashboard';
import { TrackDetail } from './components/TrackDetail';
import { TopicDetail } from './components/TopicDetail';
import { GeminiChat } from './components/GeminiChat';
import { INITIAL_SYLLABUS_TOPICS, TRACKS_DATA } from './syllabusData';
import { initAuth, getIdToken } from './src/lib/firebase';
import { 
  LogOut, Instagram, Sparkles, RotateCcw, BrainCircuit, 
  CheckCircle2, Clock, BookOpen, UserCheck, MessageSquare 
} from 'lucide-react';

const STORAGE_KEY_TOPICS = 'racan_learn_plan_2026_topics_v3';
const STORAGE_KEY_USER = 'racan_learn_plan_2026_user';

const DEFAULT_USER: User = {
  name: 'Rodrigo Rahal',
  email: 'rodrigorahal@gmail.com',
  role: 'Gestor de TI / Liderança Executiva',
  targetYear: '2026'
};

function App() {
  // Load persisted user or default
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      return savedUser ? JSON.parse(savedUser) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [selectedTrackId, setSelectedTrackId] = useState<TrackId | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [activePomodoroTopicId, setActivePomodoroTopicId] = useState<string | null>(null);
  const [showGlobalChat, setShowGlobalChat] = useState(false);

  // Load persisted topics or default
  const [topics, setTopics] = useState<Topic[]>(() => {
    try {
      const savedTopics = localStorage.getItem(STORAGE_KEY_TOPICS);
      if (savedTopics) {
        const parsed = JSON.parse(savedTopics);
        if (Array.isArray(parsed) && parsed.length >= 7) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Error reading localStorage topics:", e);
    }
    return INITIAL_SYLLABUS_TOPICS;
  });

  // Sync Firebase Auth with Cloud SQL backend
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, _accessToken, idToken) => {
        setUser({
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Rodrigo Rahal',
          email: firebaseUser.email || 'rodrigorahal@gmail.com',
          phone: firebaseUser.phoneNumber || '',
          role: 'Liderança Executiva em TI'
        });

        // Sync with Cloud SQL via Express backend
        if (idToken) {
          try {
            await fetch('/api/auth/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                name: firebaseUser.displayName || 'Rodrigo Rahal',
              }),
            });

            // Load saved topic progress from Cloud SQL
            const progRes = await fetch('/api/topics/progress', {
              headers: { Authorization: `Bearer ${idToken}` },
            });
            if (progRes.ok) {
              const resData = await progRes.json();
              if (resData.success && Array.isArray(resData.data) && resData.data.length > 0) {
                setTopics(prev => {
                  return prev.map(t => {
                    const match = resData.data.find((p: any) => p.topicId === t.id);
                    if (match) {
                      return {
                        ...t,
                        progress: match.progress ?? t.progress,
                        studyMinutes: match.studyMinutes ?? t.studyMinutes,
                        notes: match.notes ?? t.notes,
                        lastStudied: match.lastStudied ?? t.lastStudied,
                        nextReviewDate: match.nextReviewDate ?? t.nextReviewDate,
                        deliverable: t.deliverable ? {
                          ...t.deliverable,
                          completed: match.deliverableCompleted ?? t.deliverable.completed,
                          url: match.deliverableUrl ?? t.deliverable.url,
                        } : undefined,
                      };
                    }
                    return t;
                  });
                });
              }
            }
          } catch (err) {
            console.error('Error syncing with Cloud SQL:', err);
          }
        }
      }
    );
    return () => unsubscribe();
  }, []);

  // Save topics whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TOPICS, JSON.stringify(topics));
    } catch (e) {
      console.error("Error saving topics to localStorage:", e);
    }
  }, [topics]);

  // Save user whenever they change
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } catch (e) {
      console.error("Error saving user to localStorage:", e);
    }
  }, [user]);

  // Gatekeeper function - allows logged in users or opens modal
  const handleProtectedAction = (action: () => void) => {
    action();
  };

  const handleRegister = (newUser: User) => {
    setUser(newUser);
    setShowAuthModal(false);
  };

  const handleSelectTrack = (trackId: TrackId) => {
    setSelectedTrackId(trackId);
    setCurrentView(ViewState.TRACK_DETAIL);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setCurrentView(ViewState.TOPIC_DETAIL);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateTopic = async (updatedTopic: Topic) => {
    setTopics(prev => prev.map(t => t.id === updatedTopic.id ? updatedTopic : t));
    if (selectedTopic && selectedTopic.id === updatedTopic.id) {
      setSelectedTopic(updatedTopic);
    }

    // Persist to Cloud SQL PostgreSQL
    try {
      const idToken = await getIdToken();
      if (idToken) {
        await fetch('/api/topics/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            topicId: updatedTopic.id,
            progress: updatedTopic.progress,
            studyMinutes: updatedTopic.studyMinutes,
            notes: updatedTopic.notes,
            deliverableCompleted: updatedTopic.deliverable?.completed,
            deliverableUrl: updatedTopic.deliverable?.url,
            lastStudied: updatedTopic.lastStudied,
            nextReviewDate: updatedTopic.nextReviewDate,
            techniquesCompleted: updatedTopic.techniques?.filter(tc => tc.completed).map(tc => tc.id),
          }),
        });
      }
    } catch (err) {
      console.error('Error saving progress to Cloud SQL:', err);
    }
  };

  const handleResetToSyllabus = () => {
    if (window.confirm("Deseja restaurar as 7 matérias e dados da ementa oficial para o estado original? Suas anotações locais serão substituídas.")) {
      setTopics(INITIAL_SYLLABUS_TOPICS);
      if (selectedTopic) {
        const refreshed = INITIAL_SYLLABUS_TOPICS.find(t => t.id === selectedTopic.id);
        if (refreshed) setSelectedTopic(refreshed);
      }
    }
  };

  const handleStartPomodoroForTopic = (topic: Topic) => {
    setActivePomodoroTopicId(topic.id);
    setCurrentView(ViewState.DASHBOARD);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Quick stats for top bar
  const totalMinutesStudied = topics.reduce((acc, t) => acc + (t.studyMinutes || 0), 0);
  const totalHoursStudied = Math.round((totalMinutesStudied / 60) * 10) / 10;
  const completedNotebooks = topics.filter(t => t.deliverable?.completed).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-brand-primary selection:text-white flex flex-col">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div 
            onClick={() => {
              setCurrentView(ViewState.DASHBOARD);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-brand-primary via-indigo-600 to-brand-accent rounded-xl flex items-center justify-center font-extrabold text-xl shadow-lg shadow-brand-primary/30 group-hover:scale-105 transition-transform text-white">
              R
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                RACAN <span className="text-brand-accent font-light">LEARN PLAN</span>
              </h1>
            </div>
          </div>

          {/* Right Actions: Mentor IA & User Login */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* AI Assistant Quick Toggle */}
            <button
              onClick={() => setShowGlobalChat(!showGlobalChat)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                showGlobalChat 
                  ? 'bg-brand-accent text-slate-950 border-brand-accent shadow-md font-bold' 
                  : 'bg-white/5 hover:bg-white/10 text-brand-accent border-white/10 hover:border-brand-accent/40'
              }`}
              title="Abrir Mentor Gemini IA para Pesquisa"
            >
              <Sparkles size={15} />
              <span>Mentor IA</span>
            </button>
            
            {/* User Profile / Login */}
            {user ? (
              <div 
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                title="Perfil de Acesso"
              >
                <div className="w-7 h-7 rounded-full bg-brand-primary/40 border border-brand-primary/60 flex items-center justify-center text-xs font-bold text-brand-accent">
                  {user.name.charAt(0)}
                </div>
                <span className="text-xs font-bold text-white max-w-[130px] truncate">
                  {user.name}
                </span>
                <UserCheck size={14} className="text-gray-400" />
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-md"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto py-6">
        {currentView === ViewState.DASHBOARD && (
          <Dashboard 
            topics={topics}
            onSelectTrack={handleSelectTrack}
            onSelectTopic={handleSelectTopic}
            onProtectedAction={handleProtectedAction}
            onUpdateTopic={handleUpdateTopic}
            activePomodoroTopicId={activePomodoroTopicId}
            setActivePomodoroTopicId={setActivePomodoroTopicId}
            onOpenWorkspace={() => setShowWorkspaceModal(true)}
          />
        )}

        {currentView === ViewState.TRACK_DETAIL && selectedTrackId && (
          <TrackDetail 
            track={TRACKS_DATA.find(t => t.id === selectedTrackId) || TRACKS_DATA[0]}
            topics={topics}
            onBack={() => {
              setCurrentView(ViewState.DASHBOARD);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectTopic={handleSelectTopic}
            onSelectOtherTrack={(trackId) => setSelectedTrackId(trackId)}
            allTracks={TRACKS_DATA}
          />
        )}

        {currentView === ViewState.TOPIC_DETAIL && selectedTopic && (
          <TopicDetail 
            topic={selectedTopic}
            onBack={() => {
              if (selectedTopic.trackId) {
                setSelectedTrackId(selectedTopic.trackId);
                setCurrentView(ViewState.TRACK_DETAIL);
              } else {
                setCurrentView(ViewState.DASHBOARD);
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onUpdateTopic={handleUpdateTopic}
            onStartPomodoroForTopic={handleStartPomodoroForTopic}
          />
        )}
      </main>

      {/* Global AI Mentor Drawer / Modal */}
      {showGlobalChat && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md sm:max-w-xl shadow-2xl animate-fade-in-up">
          <div className="relative">
            <GeminiChat 
              onClose={() => setShowGlobalChat(false)} 
              activeTopic={selectedTopic}
              topics={topics}
            />
          </div>
        </div>
      )}

      {/* Floating Gemini AI Launcher Button */}
      {!showGlobalChat && (
        <button
          onClick={() => setShowGlobalChat(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-brand-primary via-indigo-600 to-brand-accent text-white rounded-full shadow-2xl hover:scale-105 transition-all group border border-white/20"
          title="Abrir Mentor Executivo Gemini"
        >
          <div className="relative">
            <Sparkles size={18} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <span className="text-xs font-bold tracking-wide">Mentor Gemini</span>
        </button>
      )}

      {/* Auth / Profile Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onRegister={handleRegister}
      />

      {/* Google Workspace Modal (Drive, Calendar, Tasks) */}
      <WorkspaceModal
        isOpen={showWorkspaceModal}
        onClose={() => setShowWorkspaceModal(false)}
        topics={topics}
      />

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950 py-6 text-center text-xs text-gray-400">
        <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-center">
          <p>2026 RACAN BUSINESS TECHNOLOGY</p>
        </div>
      </footer>

    </div>
  );
}

export default App;
