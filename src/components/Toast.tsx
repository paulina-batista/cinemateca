import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import type { ToastMessage } from '../hooks/useToast';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
      role="region"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-lg border transition-all animate-fade-in ${
              isSuccess
                ? 'bg-[#fff5f6] border-[#f2c1c9] text-[#5c1a26]'
                : isError
                ? 'bg-[#fff0f2] border-[#f0abb7] text-[#781928]'
                : 'bg-white border-[#f0d5da] text-[#4a262e]'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#c56d7b]" />}
              {isError && <AlertCircle className="w-5 h-5 text-[#b02e42]" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-[#c56d7b]" />}
            </div>

            <div className="flex-1 text-sm">
              <p className="font-semibold text-xs uppercase tracking-wider opacity-90">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-[#704850] leading-relaxed">{toast.description}</p>
              )}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-[#9e767e] hover:text-[#5c1a26] p-1 rounded-full hover:bg-black/5 transition-colors"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
