import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Excluir',
  cancelText = 'Cancelar',
  isDanger = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-brand-surface border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5">
        
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            isDanger ? 'bg-red-500/15 border border-red-500/30 text-red-400' : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
          }`}>
            <AlertTriangle size={24} />
          </div>

          <div className="space-y-1 flex-1">
            <h3 className="text-base font-bold text-white">
              {title}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-lg hover:opacity-90 ${
              isDanger ? 'bg-red-600 hover:bg-red-500' : 'bg-brand-primary hover:bg-brand-accent'
            }`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};
