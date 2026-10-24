import React, { useState } from 'react';
import { Wifi, WifiOff, Info, X, CheckCircle2, Shield } from 'lucide-react';

interface NetworkStatusIndicatorProps {
  isOnline: boolean;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({ isOnline }) => {
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  return (
    <>
      <button
        onClick={() => setShowExplanation(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all shadow-sm ${
          isOnline
            ? 'bg-[#f0faf3] text-[#1b6b33] border-[#bee5cc] hover:bg-[#e4f7eb]'
            : 'bg-[#fff5e6] text-[#9c5810] border-[#fcdba8] hover:bg-[#feecd2]'
        }`}
        title="Clique para saber como funciona o modo offline"
        aria-label={`Status da conexão: ${isOnline ? 'Online' : 'Offline'}`}
      >
        {isOnline ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Wifi className="w-3 h-3 text-emerald-600" />
            <span className="hidden sm:inline">Online</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <WifiOff className="w-3 h-3 text-amber-700" />
            <span>Modo Offline</span>
          </>
        )}
      </button>

      {/* Modal explicativo do funcionamento offline */}
      {showExplanation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="offline-info-title"
          onClick={() => setShowExplanation(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#fff9fa] rounded-3xl border border-[#f3ccd3] p-6 shadow-2xl animate-modal-pop text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowExplanation(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#fceeed] hover:bg-[#f7d6dc] text-[#704850] flex items-center justify-center transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-2xl bg-[#faeded] text-[#722330] flex items-center justify-center border border-[#f3ccd3]">
                <Shield className="w-4 h-4" />
              </div>
              <h3 id="offline-info-title" className="text-base font-bold font-serif text-[#3d121a]">
                Como funciona o Modo Offline?
              </h3>
            </div>

            <p className="text-xs text-[#704850] leading-relaxed mb-4">
              O Cinemateca é uma Progressive Web App (PWA) projetada com arquitetura local-first. Suas capas e dados ficam salvos diretamente no seu dispositivo.
            </p>

            <div className="space-y-2.5 text-xs text-[#4a1c24]">
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-[#edd1d6]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Cadastre, edite e exclua offline:</strong> Todas as alterações são gravadas no IndexedDB local imediatamente.
                </span>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-[#edd1d6]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Capas sempre disponíveis:</strong> As imagens selecionadas da galeria viram Blobs locais e continuam abrindo mesmo sem internet.
                </span>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#fff5f6] border border-[#f5ccd3]">
                <Info className="w-4 h-4 text-[#c56d7b] shrink-0 mt-0.5" />
                <span>
                  <strong>Atenção ao primeiro carregamento:</strong> É necessário abrir o aplicativo pelo menos uma vez com internet para que o navegador baixe os recursos e instale o Service Worker.
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowExplanation(false)}
                className="px-4 py-2 rounded-full bg-[#722330] text-white text-xs font-semibold hover:bg-[#8c2d3c] transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
