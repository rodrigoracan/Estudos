import React, { useState } from 'react';
import { X, Lock, CheckCircle, Database } from 'lucide-react';
import { User } from '../types';
import { googleSignIn } from '../src/lib/firebase.ts';

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
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setIsLoadingGoogle(true);
      setErrorMsg(null);
      const res = await googleSignIn();
      if (res && res.user) {
        onRegister({
          name: res.user.displayName || res.user.email?.split('@')[0] || 'Usuário',
          email: res.user.email || '',
          phone: res.user.phoneNumber || '',
          role: 'Liderança Executiva em TI'
        });
        onClose();
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setErrorMsg(err.message || 'Falha ao autenticar com Google');
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister({
      name: formData.name,
      email: formData.email,
      phone: formData.phone
    });
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-brand-surface border border-brand-primary/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-primary to-brand-accent p-6 text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={22} />
          </button>
          <div className="mx-auto bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-md">
            <Lock className="text-white" size={28} />
          </div>
          <h2 className="text-2xl font-bold text-white">Acesso & Integrações</h2>
          <p className="text-white/90 text-xs mt-1">Conecte sua conta para sincronizar Cloud SQL, Google Drive, Calendar e Tasks.</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Official Sign in with Google Button */}
          <div>
            <button
              onClick={handleGoogleLogin}
              disabled={isLoadingGoogle}
              className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-3 border border-gray-300 active:scale-[0.99] disabled:opacity-50"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span className="text-sm font-medium">
                {isLoadingGoogle ? 'Autenticando...' : 'Entrar com Google (Drive, Calendar & Tasks)'}
              </span>
            </button>

            <div className="flex items-center gap-2 justify-center mt-2 text-[11px] text-emerald-400">
              <Database size={13} />
              <span>Persistência em Cloud SQL PostgreSQL ativa</span>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full"></div>
            <span className="bg-brand-surface px-3 text-[11px] uppercase tracking-wider text-gray-500">ou perfil local</span>
            <div className="border-t border-white/10 w-full"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-gray-400 text-xs mb-1">Nome Completo</label>
              <input 
                required
                name="name"
                type="text" 
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-brand-accent transition-colors"
                placeholder="Rodrigo Rahal"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-xs mb-1">Email</label>
              <input 
                required
                name="email"
                type="email" 
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-brand-accent transition-colors"
                placeholder="rodrigorahal@gmail.com"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-brand-primary/20 hover:bg-brand-primary/30 border border-brand-primary/40 text-brand-accent font-bold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-2 mt-2"
            >
              <CheckCircle size={15} />
              Acessar com Perfil Manual
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
