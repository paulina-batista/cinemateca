import React, { useState, useEffect, useRef } from 'react';
import { Film, Tv, BookOpen, Gamepad2, Upload, X, AlertCircle, Loader2, ImagePlus, Minus, Plus } from 'lucide-react';
import type { CreateMediaDTO, MediaItem, MediaType, UpdateMediaDTO } from '../types/media';
import { VALID_RATINGS, STATUS_BY_TYPE, DEFAULT_STATUS, TYPE_LABELS } from '../types/media';
import { getGenresForType } from '../utils/genres';
import { createBlobUrl, processImageToBlob, revokeBlobUrl, validateImageFile } from '../utils/image';
import { StarRating } from './StarRating';

interface MediaFormModalProps {
  isOpen: boolean;
  initialData?: MediaItem | null;
  onClose: () => void;
  onSubmit: (data: CreateMediaDTO | UpdateMediaDTO) => Promise<void>;
}

export const MediaFormModal: React.FC<MediaFormModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState<string>('');
  const [type, setType] = useState<MediaType>('movie');
  const [genre, setGenre] = useState<string>('');
  const [customGenre, setCustomGenre] = useState<string>('');
  const [status, setStatus] = useState<string>('Assistido');
  const [rating, setRating] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');

  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(initialData);

  // Inicializa o formulário com dados existentes se for edição, ou com valores padrão
  useEffect(() => {
    let currentCreatedUrl = '';
    if (initialData) {
      setTitle(initialData.title);
      setType(initialData.type);

      const availableGenres = getGenresForType(initialData.type);
      const isPreset = (availableGenres as readonly string[]).includes(initialData.genre);
      if (isPreset) {
        setGenre(initialData.genre);
        setCustomGenre('');
      } else {
        setGenre('custom');
        setCustomGenre(initialData.genre);
      }

      setStatus(initialData.status || DEFAULT_STATUS[initialData.type]);
      setRating(initialData.rating);
      setNotes(initialData.notes || '');
      setCoverBlob(initialData.coverBlob);

      if (initialData.coverBlob) {
        currentCreatedUrl = createBlobUrl(initialData.coverBlob);
        setPreviewUrl(currentCreatedUrl);
      } else {
        setPreviewUrl('');
      }
    } else {
      setTitle('');
      setType('movie');
      setGenre(getGenresForType('movie')[0]);
      setCustomGenre('');
      setStatus(DEFAULT_STATUS.movie);
      setRating(5);
      setNotes('');
      setCoverBlob(null);
      setPreviewUrl('');
    }
    setErrorMessage(null);

    return () => {
      if (currentCreatedUrl) {
        revokeBlobUrl(currentCreatedUrl);
      }
    };
  }, [initialData, isOpen]);

  // Ao alterar o tipo manualmente no cadastro, atualiza gênero padrão e status correspondente
  const handleTypeChange = (newType: MediaType) => {
    setType(newType);
    const newGenres = getGenresForType(newType);
    setGenre(newGenres[0]);
    setCustomGenre('');
    setStatus(DEFAULT_STATUS[newType]);
  };

  if (!isOpen) return null;

  // Lida com seleção de arquivo da galeria/armazenamento
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Arquivo de imagem inválido.');
      return;
    }

    try {
      const blob = await processImageToBlob(file);
      setCoverBlob(blob);

      if (previewUrl) {
        revokeBlobUrl(previewUrl);
      }
      const newUrl = createBlobUrl(blob);
      setPreviewUrl(newUrl);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Falha ao processar imagem.';
      setErrorMessage(msg);
    }
  };

  // Ajuste fino com botões de -0.5 e +0.5 para facilidade no celular
  const handleStepRating = (delta: number) => {
    setRating((prev) => {
      const next = Math.round((prev + delta) * 10) / 10;
      if (next < 0.5) return 0.5;
      if (next > 5.0) return 5.0;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage('Por favor, informe o título.');
      return;
    }

    const finalGenre = genre === 'custom' ? customGenre.trim() : genre.trim();
    if (!finalGenre) {
      setErrorMessage('Por favor, selecione ou informe o gênero.');
      return;
    }

    const isValidRating = VALID_RATINGS.includes(rating as (typeof VALID_RATINGS)[number]);
    if (!isValidRating || rating < 0.5 || rating > 5) {
      setErrorMessage('Por favor, atribua uma avaliação válida entre 0,5 e 5 estrelas.');
      return;
    }

    if (!coverBlob) {
      setErrorMessage('A imagem de capa é obrigatória. Selecione uma imagem da galeria.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: CreateMediaDTO = {
        title: trimmedTitle,
        type,
        genre: finalGenre,
        rating,
        status: status || DEFAULT_STATUS[type],
        coverBlob,
        notes: notes.trim(),
      };

      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      console.error('Erro ao salvar registro:', err);
      const msg = err instanceof Error ? err.message : 'Falha ao gravar no banco de dados local.';
      setErrorMessage(`Erro ao salvar: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedRating = rating.toFixed(1).replace('.0', '').replace('.', ',');
  const currentGenres = getGenresForType(type);
  const currentStatuses = STATUS_BY_TYPE[type] || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#fff9fa] rounded-2xl sm:rounded-3xl border border-[#f3d0d6] shadow-[0_25px_60px_rgba(72,16,25,0.25)] overflow-hidden animate-modal-pop max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-[#f3d9de] flex items-center justify-between bg-white/70">
          <div>
            <h2 id="modal-title" className="text-lg sm:text-xl font-bold font-serif text-[#3d121a]">
              {isEditing ? `Editar ${TYPE_LABELS[type]}` : 'Cadastrar Item'}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#704850]">
              {isEditing ? 'Atualize as informações do registro' : 'Adicione à sua biblioteca digital'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#fceeed] hover:bg-[#f7d6dc] text-[#704850] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar formulário"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário com Scroll Suave */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1">
          {/* Mensagem de Erro */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-[#fff0f2] border border-[#f5b3be] text-[#781928] text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#b02e42]" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Campo 1: Categoria (Filme, Série, Livro, Jogo) */}
          <div>
            <label className="block text-xs font-semibold text-[#5c2a33] uppercase tracking-wider mb-1.5">
              Categoria <span className="text-[#b02e42]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('movie')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl sm:rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                  type === 'movie'
                    ? 'bg-[#722330] text-white border-[#722330] shadow-sm'
                    : 'bg-white text-[#6b434b] border-[#edd1d6] hover:bg-[#fff5f6]'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                Filme
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('series')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl sm:rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                  type === 'series'
                    ? 'bg-[#722330] text-white border-[#722330] shadow-sm'
                    : 'bg-white text-[#6b434b] border-[#edd1d6] hover:bg-[#fff5f6]'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                Série
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('book')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl sm:rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                  type === 'book'
                    ? 'bg-[#722330] text-white border-[#722330] shadow-sm'
                    : 'bg-white text-[#6b434b] border-[#edd1d6] hover:bg-[#fff5f6]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Livro
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('game')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl sm:rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                  type === 'game'
                    ? 'bg-[#722330] text-white border-[#722330] shadow-sm'
                    : 'bg-white text-[#6b434b] border-[#edd1d6] hover:bg-[#fff5f6]'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                Jogo
              </button>
            </div>
          </div>

          {/* Campo 2: Seleção de Imagem de Capa (Obrigatório) */}
          <div>
            <label className="block text-xs font-semibold text-[#5c2a33] uppercase tracking-wider mb-1.5">
              Capa <span className="text-[#b02e42]">*</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border border-[#edd1d6] bg-white">
                <div className="w-16 h-24 sm:w-20 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-[#faeded] border border-[#f3d0d6] shadow-sm">
                  <img src={previewUrl} alt="Prévia da capa" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#4a1c24] truncate">Imagem selecionada</p>
                  <p className="text-[11px] text-[#80555e] mt-0.5">
                    Salva localmente no dispositivo para visualização offline.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#faeded] text-[#722330] hover:bg-[#f5d9de] transition-colors cursor-pointer"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    Alterar capa
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[#e6b8c0] hover:border-[#c56d7b] rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center bg-white/50 hover:bg-[#fff5f6] transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#fdebed] text-[#c56d7b] group-hover:scale-105 flex items-center justify-center mb-1.5 transition-transform">
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-xs font-semibold text-[#5c2a33] text-center">
                  Toque para escolher uma imagem do celular
                </span>
                <span className="text-[10px] sm:text-[11px] text-[#91666e] mt-0.5">
                  PNG, JPG ou WEBP (armazenada offline)
                </span>
              </button>
            )}
          </div>

          {/* Campo 3: Título (Obrigatório) */}
          <div>
            <label htmlFor="media-title" className="block text-xs font-semibold text-[#5c2a33] uppercase tracking-wider mb-1.5">
              Título <span className="text-[#b02e42]">*</span>
            </label>
            <input
              id="media-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Orgulho e Preconceito, Elden Ring, etc."
              required
              className="w-full px-3.5 py-2 rounded-2xl bg-white border border-[#edd1d6] text-base sm:text-sm text-[#3d121a] placeholder-[#ab868e] focus:outline-none focus:ring-2 focus:ring-[#c56d7b]/40 focus:border-[#c56d7b] shadow-sm transition-all"
            />
          </div>

          {/* Campo 4: Gênero e Status (Lado a Lado no tablet/desktop, vertical no celular) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Gênero */}
            <div>
              <label htmlFor="media-genre-select" className="block text-xs font-semibold text-[#5c2a33] uppercase tracking-wider mb-1.5">
                Gênero <span className="text-[#b02e42]">*</span>
              </label>
              <select
                id="media-genre-select"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl bg-white border border-[#edd1d6] text-base sm:text-sm text-[#3d121a] focus:outline-none focus:ring-2 focus:ring-[#c56d7b]/40 focus:border-[#c56d7b] shadow-sm transition-all cursor-pointer"
              >
                {currentGenres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
                <option value="custom">Outro gênero personalizado...</option>
              </select>

              {genre === 'custom' && (
                <input
                  type="text"
                  value={customGenre}
                  onChange={(e) => setCustomGenre(e.target.value)}
                  placeholder="Digite o gênero personalizado..."
                  className="mt-2 w-full px-3.5 py-2 rounded-2xl bg-white border border-[#edd1d6] text-base sm:text-sm text-[#3d121a] focus:outline-none focus:ring-2 focus:ring-[#c56d7b]/40 shadow-sm"
                />
              )}
            </div>

            {/* Status Pessoal por Categoria */}
            <div>
              <label htmlFor="media-status-select" className="block text-xs font-semibold text-[#5c2a33] uppercase tracking-wider mb-1.5">
                Status <span className="text-[#b02e42]">*</span>
              </label>
              <select
                id="media-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl bg-white border border-[#edd1d6] text-base sm:text-sm text-[#3d121a] focus:outline-none focus:ring-2 focus:ring-[#c56d7b]/40 focus:border-[#c56d7b] shadow-sm transition-all cursor-pointer"
              >
                {currentStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Campo 5: Avaliação com Meias Estrelas (0,5 a 5,0) */}
          <div>
            <label className="block text-xs font-semibold text-[#5c2a33] uppercase tracking-wider mb-1.5">
              Sua Avaliação (0,5 a 5 estrelas) <span className="text-[#b02e42]">*</span>
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-white rounded-2xl border border-[#edd1d6]">
              <div className="flex items-center gap-3">
                <StarRating rating={rating} onChange={(val) => setRating(val)} size="lg" />
                <span className="text-base font-bold text-[#722330]">
                  {formattedRating} <span className="text-xs text-[#996a74] font-normal">/ 5 ★</span>
                </span>
              </div>

              {/* Botões de -0.5 e +0.5 para celulares */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleStepRating(-0.5)}
                  disabled={rating <= 0.5}
                  className="w-8 h-8 rounded-full bg-[#fdebed] text-[#722330] hover:bg-[#f7d3d9] disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Diminuir meia estrela"
                  title="-0,5 estrela"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStepRating(0.5)}
                  disabled={rating >= 5.0}
                  className="w-8 h-8 rounded-full bg-[#fdebed] text-[#722330] hover:bg-[#f7d3d9] disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Aumentar meia estrela"
                  title="+0,5 estrela"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Campo 6: Anotações / Observações */}
          <div>
            <label htmlFor="media-notes" className="block text-xs font-semibold text-[#5c2a33] uppercase tracking-wider mb-1.5">
              Anotações Pessoais <span className="text-[10px] text-[#966b73] font-normal lowercase">(opcional)</span>
            </label>
            <textarea
              id="media-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Momentos marcantes, opiniões, data de término..."
              className="w-full px-3.5 py-2 rounded-2xl bg-white border border-[#edd1d6] text-base sm:text-sm text-[#3d121a] placeholder-[#ab868e] focus:outline-none focus:ring-2 focus:ring-[#c56d7b]/40 focus:border-[#c56d7b] shadow-sm transition-all resize-none"
            />
          </div>

          {/* Rodapé do Modal */}
          <div className="pt-2 sm:pt-3 border-t border-[#f3d9de] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-full text-xs font-semibold text-[#704850] hover:bg-[#faeded] transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-[#722330] text-white hover:bg-[#8c2d3c] disabled:opacity-60 shadow-[0_4px_14px_rgba(114,35,48,0.2)] transition-all cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Salvar no IorHub'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
