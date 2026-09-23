import React, { useState } from 'react';
import { X, Lock, CheckCircle } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      onRegister({
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      });
      onClose();
    }, 800);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-brand-surface border border-brand-primary/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-accent p-6 text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-3 backdrop-blur-md">
            <Lock className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white">Desbloqueie seu Potencial</h2>
          <p className="text-white/90 text-sm mt-1">Cadastre-se gratuitamente para acessar o RACAN LEARN PLAN completo.</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1 ml-1">Nome Completo</label>
              <input 
                required
                name="name"
                type="text" 
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-colors"
                placeholder="Seu nome"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-gray-400 text-sm mb-1 ml-1">Telefone</label>
                <input 
                    required
                    name="phone"
                    type="tel" 
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-colors"
                    placeholder="(XX) 99999-9999"
                />
                </div>
                <div>
                <label className="block text-gray-400 text-sm mb-1 ml-1">Email</label>
                <input 
                    required
                    name="email"
                    type="email" 
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-colors"
                    placeholder="seu@email.com"
                />
                </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1 ml-1">Senha</label>
              <input 
                required
                name="password"
                type="password" 
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-colors"
                placeholder="Criar senha segura"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-brand-primary to-brand-accent hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-primary/20 transition-all transform hover:scale-[1.02] mt-4 flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} />
              ACESSAR AGORA
            </button>
          </form>
          <p className="text-center text-gray-500 text-xs mt-4">
            Ao se cadastrar, você concorda com nossos termos de uso e política de privacidade.
          </p>
        </div>
      </div>
    </div>
  );
};