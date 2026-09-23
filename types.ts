export type TrackId = 'dados' | 'ia' | 'cyber';

export interface TrackInfo {
  id: TrackId;
  name: string;
  subtitle: string;
  description: string;
  color: string;
  accentColor: string;
  iconName: 'Database' | 'Brain' | 'ShieldAlert';
}

export interface Technique {
  id: string;
  name: string; // e.g., "Método Feynman", "Resumo Ativo", "Spaced Repetition", "Prática Hands-On"
  description?: string;
  completed: boolean;
}

export interface KeyTopic {
  id: string;
  title: string;
  details?: string;
  completed: boolean;
}

export interface Deliverable {
  title: string;
  description: string;
  codeSnippet?: string;
  completed: boolean;
  url?: string;
}

export interface StudyPrompt {
  label: string;
  prompt: string;
  category?: string;
}

export interface StudySessionLog {
  id: string;
  date: string;
  minutes: number;
  notes?: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'notebook' | 'article' | 'standard' | 'framework' | 'video' | 'book';
  url?: string;
  tag?: string;
}

export interface Topic {
  id: string;
  trackId: TrackId;
  code: string; // e.g. "1.1", "1.2", "2.1", "2.2", "3.1", "3.2", "3.3"
  title: string;
  category: string; // e.g., "Data Science", "Inteligência Artificial", "Cibersegurança"
  subtitle: string;
  learningObjective: string;
  progress: number; // 0 to 100
  confidenceLevel: number; // 1 to 5 (1=Iniciante, 3=Operacional, 5=Decisão Executiva)
  keyTopics: KeyTopic[];
  deliverable: Deliverable;
  recommendedPrompts: StudyPrompt[];
  techniques: Technique[];
  resources: Resource[];
  notes: string;
  architectureDecisions?: string;
  studyMinutes: number;
  lastStudied?: string;
  nextReviewDate?: string;
  history?: StudySessionLog[];
}

export interface User {
  name: string;
  email: string;
  role?: string;
  targetYear?: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  TRACK_DETAIL = 'TRACK_DETAIL',
  TOPIC_DETAIL = 'TOPIC_DETAIL',
  PARETO_MATRIX = 'PARETO_MATRIX'
}
