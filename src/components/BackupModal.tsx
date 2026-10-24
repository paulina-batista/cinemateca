import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  X,
  FileCheck2,
  AlertTriangle,
  Loader2,
  Archive,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import type { MediaItem } from '../types/media';
import type { CinematecaBackup, RestoreConflictStrategy, RestorePreviewStats } from '../types/backup';
import { backupService } from '../services/backup/backupService';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentItems: MediaItem[];
  onRestoreSuccess: () => Promise<void>;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  currentItems,
  onRestoreSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'restore'>('export');

  // Estados de Exportação
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Estados de Restauração
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validatedBackup, setValidatedBackup] = useState<CinematecaBackup | null>(null);
  const [previewStats, setPreviewStats] = useState<RestorePreviewStats | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [conflictStrategy, setConflictStrategy] = useState<RestoreConflictStrategy>('merge-keep-existing');
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreResult, setRestoreResult] = useState<{ addedCount: number; updatedCount: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Lógica de Exportação
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportSuccessMessage(null);
      const backup = await backupService.exportBackup(currentItems);
      backupService.downloadBackupFile(backup);
      setExportSuccessMessage(`Backup de ${backup.itemCount} títulos gerado e baixado com sucesso!`);
    } catch (err: unknown) {
      console.error(err);
      alert('Falha ao exportar backup. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  // Lógica de Seleção e Validação do Arquivo para Restauração
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setValidatedBackup(null);
    setPreviewStats(null);
    setValidationError(null);
    setRestoreResult(null);

    try {
      const text = await file.text();
      const validation = backupService.validateBackupFile(text, currentItems);

      if (!validation.valid || !validation.backup || !validation.stats) {
        setValidationError(validation.error || 'Arquivo de backup inválido.');
        return;
      }

      setValidatedBackup(validation.backup);
      setPreviewStats(validation.stats);
    } catch {
      setValidationError('Não foi possível ler o arquivo selecionado.');
    }
  };

  // Execução da Restauração
  const handleConfirmRestore = async () => {
    if (!validatedBackup) return;

    try {
      setIsRestoring(true);
      setValidationError(null);

      const result = await backupService.restoreBackup(validatedBackup, conflictStrategy, currentItems);
      setRestoreResult(result);
      await onRestoreSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha durante a restauração.';
      setValidationError(`Erro ao restaurar: ${msg}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const resetRestoreState = () => {
    setSelectedFile(null);
    setValidatedBackup(null);
    setPreviewStats(null);
    setValidationError(null);
    setRestoreResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#fff9fa] rounded-3xl border border-[#f3d0d6] shadow-[0_25px_60px_rgba(72,16,25,0.25)] overflow-hidden animate-modal-pop max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-[#f3d9de] flex items-center justify-between bg-white/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#faeded] text-[#722330] flex items-center justify-center border border-[#f3ccd3]">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h2 id="backup-title" className="text-lg font-bold font-serif text-[#3d121a]">
                Gerenciamento de Dados & Backup
              </h2>
              <p className="text-xs text-[#704850]">
                Exporte sua biblioteca ou restaure arquivos anteriores com segurança
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#fceeed] hover:bg-[#f7d6dc] text-[#704850] flex items-center justify-center transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs de Seleção */}
        <div className="flex border-b border-[#f3d9de] bg-[#fdf2f4]/60 px-6 pt-3 gap-3">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-[#722330] text-[#722330]'
                : 'border-transparent text-[#704850] hover:text-[#3d121a]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Backup
          </button>

          <button
            onClick={() => {
              setActiveTab('restore');
              resetRestoreState();
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'restore'
                ? 'border-[#722330] text-[#722330]'
                : 'border-transparent text-[#704850] hover:text-[#3d121a]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Restaurar Backup
          </button>
        </div>

        {/* Conteúdo da Aba */}
        <div className="overflow-y-auto p-6 flex-1 space-y-5">
          {activeTab === 'export' ? (
            /* SEÇÃO EXPORTAÇÃO */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#edd1d6] shadow-sm">
                <h3 className="text-sm font-bold text-[#4a1c24] mb-1">
                  Exportação Completa da Biblioteca
                </h3>
                <p className="text-xs text-[#704850] leading-relaxed">
                  O arquivo gerado conterá todos os seus {currentItems.length} registros, capas em alta resolução codificadas em Base64, notas e avaliações com meias estrelas. O arquivo é independente do navegador e pode ser salvo onde você desejar.
                </p>

                <div className="mt-3.5 flex items-center gap-2 text-[11px] text-[#80555e] bg-[#fdf6f7] p-2.5 rounded-xl border border-[#f3ccd3]">
                  <ShieldCheck className="w-4 h-4 text-[#c56d7b] shrink-0" />
                  <span>Seus dados nunca saem do seu dispositivo; todo o processo é gerado localmente.</span>
                </div>
              </div>

              {exportSuccessMessage && (
                <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-[#f0fbf4] border border-[#a7e2b7] text-[#145a27] text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{exportSuccessMessage}</span>
                </div>
              )}

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-semibold bg-[#722330] text-white hover:bg-[#8c2d3c] disabled:opacity-60 shadow-[0_4px_14px_rgba(114,35,48,0.2)] transition-all"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando capas e gerando arquivo...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Exportar e Baixar Backup (.json)
                  </>
                )}
              </button>
            </div>
          ) : (
            /* SEÇÃO RESTAURAÇÃO */
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,application/json"
                className="hidden"
              />

              {!validatedBackup && !restoreResult && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#e6b8c0] hover:border-[#c56d7b] rounded-2xl p-6 flex flex-col items-center justify-center bg-white/50 hover:bg-[#fff5f6] transition-all cursor-pointer text-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#fdebed] text-[#c56d7b] group-hover:scale-105 flex items-center justify-center mb-2 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-[#5c2a33]">
                    {selectedFile ? selectedFile.name : 'Selecione um arquivo de backup (.json)'}
                  </span>
                  <span className="text-[11px] text-[#91666e] mt-0.5">
                    Clique aqui para carregar o arquivo exportado anteriormente
                  </span>
                </div>
              )}

              {/* Erro de Validação */}
              {validationError && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#fff0f2] border border-[#f5b3be] text-[#781928] text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#b02e42]" />
                  <div className="flex-1 font-medium">{validationError}</div>
                </div>
              )}

              {/* Resultado pós-restauração */}
              {restoreResult && (
                <div className="p-4 rounded-2xl bg-[#f0fbf4] border border-[#a7e2b7] text-[#145a27] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Restauração Concluída com Sucesso!
                  </div>
                  <p className="text-xs">
                    {restoreResult.addedCount} títulos adicionados e {restoreResult.updatedCount} títulos atualizados no IndexedDB.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-2 px-4 py-2 rounded-full bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors"
                  >
                    Fechar e Ver Biblioteca
                  </button>
                </div>
              )}

              {/* Painel de Validação e Escolha da Estratégia */}
              {validatedBackup && previewStats && !restoreResult && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white border border-[#edd1d6] shadow-sm space-y-2">
                    <div className="flex items-center gap-2 text-[#722330] font-semibold text-xs">
                      <FileCheck2 className="w-4 h-4" />
                      Backup Válido (IorHub v{validatedBackup.version})
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-[#5c2a33]">
                      <div className="p-2 rounded-xl bg-[#faeded]">
                        Total no arquivo: <span className="font-bold">{previewStats.totalInBackup}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#faeded]">
                        Novos títulos: <span className="font-bold text-emerald-700">{previewStats.newCount}</span>
                      </div>
                    </div>
                    {previewStats.conflictingCount > 0 && (
                      <p className="text-[11px] text-[#9c2436] font-medium pt-1">
                        Atenção: {previewStats.conflictingCount} título(s) já existem na sua biblioteca atual com o mesmo ID.
                      </p>
                    )}
                  </div>

                  {/* Seleção de Política de Mesclagem */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[#5c2a33] uppercase tracking-wider">
                      Política de Restauração:
                    </label>

                    <div className="space-y-2 text-xs">
                      <label className="flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-colors bg-white border-[#edd1d6] hover:bg-[#fff5f6]">
                        <input
                          type="radio"
                          name="conflictStrategy"
                          value="merge-keep-existing"
                          checked={conflictStrategy === 'merge-keep-existing'}
                          onChange={() => setConflictStrategy('merge-keep-existing')}
                          className="mt-0.5 accent-[#722330]"
                        />
                        <div>
                          <span className="font-bold text-[#4a1c24]">Mesclar e preservar existentes (Recomendado)</span>
                          <p className="text-[11px] text-[#704850] mt-0.5">
                            Adiciona apenas os títulos novos. Se algum título já existir na biblioteca, o seu registro atual não será alterado.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-colors bg-white border-[#edd1d6] hover:bg-[#fff5f6]">
                        <input
                          type="radio"
                          name="conflictStrategy"
                          value="merge-overwrite"
                          checked={conflictStrategy === 'merge-overwrite'}
                          onChange={() => setConflictStrategy('merge-overwrite')}
                          className="mt-0.5 accent-[#722330]"
                        />
                        <div>
                          <span className="font-bold text-[#4a1c24]">Mesclar e atualizar</span>
                          <p className="text-[11px] text-[#704850] mt-0.5">
                            Adiciona novos títulos e atualiza os registros existentes com as notas e capas vindas do backup.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-colors bg-[#fff5f6] border-[#f0b5be] hover:bg-[#fdebed]">
                        <input
                          type="radio"
                          name="conflictStrategy"
                          value="replace-all"
                          checked={conflictStrategy === 'replace-all'}
                          onChange={() => setConflictStrategy('replace-all')}
                          className="mt-0.5 accent-[#722330]"
                        />
                        <div>
                          <span className="font-bold text-[#9c2436]">Substituir biblioteca integralmente</span>
                          <p className="text-[11px] text-[#704850] mt-0.5">
                            Substitui todos os dados locais pelos itens contidos exclusivamente neste arquivo de backup.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={resetRestoreState}
                      disabled={isRestoring}
                      className="px-4 py-2 rounded-full text-xs font-semibold text-[#704850] hover:bg-[#faeded]"
                    >
                      Escolher outro arquivo
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmRestore}
                      disabled={isRestoring}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#722330] text-white hover:bg-[#8c2d3c] shadow-sm disabled:opacity-60"
                    >
                      {isRestoring ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Restaurando...
                        </>
                      ) : (
                        'Confirmar e Aplicar Restauração'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
