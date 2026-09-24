import React from 'react';
import { 
  Database, Brain, ShieldAlert, Code, Terminal, Cpu, 
  Sparkles, Layers, Globe, BookOpen, GraduationCap, 
  BarChart3, Lock, Folder, Server, Cloud, Binary, 
  Compass, Workflow, Boxes, LucideProps 
} from 'lucide-react';

interface TrackIconProps extends LucideProps {
  name: string;
}

export const AVAILABLE_TRACK_ICONS = [
  { name: 'Database', label: 'Dados & Banco', icon: Database },
  { name: 'Brain', label: 'Inteligência Artificial', icon: Brain },
  { name: 'ShieldAlert', label: 'Cibersegurança', icon: ShieldAlert },
  { name: 'Cpu', label: 'Hardware & Processamento', icon: Cpu },
  { name: 'Terminal', label: 'Terminal / CLI', icon: Terminal },
  { name: 'Code', label: 'Desenvolvimento / Código', icon: Code },
  { name: 'Layers', label: 'Arquitetura / Camadas', icon: Layers },
  { name: 'Globe', label: 'Web & Redes', icon: Globe },
  { name: 'Cloud', label: 'Nuvem / Cloud', icon: Cloud },
  { name: 'Server', label: 'Servidores & DevOps', icon: Server },
  { name: 'BookOpen', label: 'Conhecimento Geral', icon: BookOpen },
  { name: 'GraduationCap', label: 'Acadêmico & Pesquisa', icon: GraduationCap },
  { name: 'BarChart3', label: 'BI & Estatística', icon: BarChart3 },
  { name: 'Sparkles', label: 'Inovação / LLMs', icon: Sparkles },
  { name: 'Boxes', label: 'Microsserviços', icon: Boxes },
  { name: 'Lock', label: 'Privacidade & Criptografia', icon: Lock },
];

export const TrackIcon: React.FC<TrackIconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'Database':
      return <Database {...props} />;
    case 'Brain':
      return <Brain {...props} />;
    case 'ShieldAlert':
      return <ShieldAlert {...props} />;
    case 'Cpu':
      return <Cpu {...props} />;
    case 'Terminal':
      return <Terminal {...props} />;
    case 'Code':
      return <Code {...props} />;
    case 'Layers':
      return <Layers {...props} />;
    case 'Globe':
      return <Globe {...props} />;
    case 'Cloud':
      return <Cloud {...props} />;
    case 'Server':
      return <Server {...props} />;
    case 'BookOpen':
      return <BookOpen {...props} />;
    case 'GraduationCap':
      return <GraduationCap {...props} />;
    case 'BarChart3':
      return <BarChart3 {...props} />;
    case 'Sparkles':
      return <Sparkles {...props} />;
    case 'Boxes':
      return <Boxes {...props} />;
    case 'Lock':
      return <Lock {...props} />;
    case 'Binary':
      return <Binary {...props} />;
    case 'Compass':
      return <Compass {...props} />;
    case 'Workflow':
      return <Workflow {...props} />;
    default:
      return <Layers {...props} />;
  }
};
