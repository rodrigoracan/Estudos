import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-brand-surface/70 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl ${onClick ? 'cursor-pointer hover:border-brand-accent/50 transition-all duration-300' : ''} ${className}`}
    >
      {children}
    </div>
  );
};