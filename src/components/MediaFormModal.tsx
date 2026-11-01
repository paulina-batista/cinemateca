import React, { useState, useEffect, useRef } from 'react';
import { Film, Tv, Upload, X, AlertCircle, Loader2, ImagePlus, Minus, Plus } from 'lucide-react';
import type { CreateMediaDTO, MediaItem, MediaType, UpdateMediaDTO } from '../types/media';
import { VALID_RATINGS, STATUS_BY_TYPE, DEFAULT_STATUS, TYPE_LABELS } from '../types/media';
import { getGenresForType } from '../utils/genres';
import { createBlobUrl, processImageToBlob, revokeBlobUrl, validateImageFile } from '../utils/image';
import { StarRating } from './StarRating';

interface MediaFormModalProps {
  isOpen: boolean;
  initialData?: MediaItem | null;
  existingItems?: MediaItem[];
  onClose: () => void;
  onSubmit: (data: CreateMediaDTO | UpdateMediaDTO) => Promise<void>;
}

export const MediaFormModal: React.FC<MediaFormModalProps> = ({
  isOpen,
  initialData,
  existingItems = [],
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

  useEffect(() => {
    let currentCreatedUrl = '';
    if (initialData) {
      setTitle(initialData.title);
      // Garante que se for um tipo legado seja mapeado para filme
      const itemType = (initialData.type === 'movie' || initialData.type === 'series')
        ? initialData.type
        : 'movie';
      setType(itemType);

      const availableGenres = getGenresForType(itemType);
      const isPreset = (availableGenres as readonly string[]).includes(initialData.genre);
      if (isPreset) {
        setGenre(initialData.genre);
        setCustomGenre('');
      } else {
        setGenre('custom');
        setCustomGenre(initialData.genre);
      }

      setStatus(initialData.status || DEFAULT_STATUS[itemType]);
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

  const handleTypeChange = (newType: MediaType) => {
    setType(newType);
    const newGenres = getGenresForType(newType);
    setGenre(newGenres[0]);
    setCustomGenre('');
    setStatus(DEFAULT_STATUS[newType]);
  };

  if (!isOpen) return null;

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

    // Regra Obrigatória: Prevenção rigorosa contra duplicatas (case-insensitive + trim)
    const normalizedNewTitle = trimmedTitle.toLowerCase();
    const isDuplicate = existingItems.some((item) => {
      if (isEditing && item.id === initialData?.id) return false;
      return item.type === type && item.title.trim().toLowerCase() === normalizedNewTitle;
    });

    if (isDuplicate) {
      setErrorMessage('Este título já está na sua biblioteca.');
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
      setErrorMessage('A imagem de capa é obrigatória. Selecione uma imagem da sua galeria.');
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
      console.error('Erro ao salvar no Kino:', err);
      const msg = err instanceof Error ? err.message : 'Falha ao gravar registro.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedRating = rating.toFixed(1).replace('.0', '').replace('.', ',');
  const currentGenres = getGenresForType(type);
  const currentStatuses = STATUS_BY_TYPE[type] || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1E080D]/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#FFFDFD] rounded-2xl sm:rounded-3xl border border-[#F0D5DA] shadow-[0_25px_60px_rgba(30,8,13,0.35)] overflow-hidden animate-modal-pop max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-[#F0D5DA] flex items-center justify-between bg-[#FBF6F6]">
          <div>
            <h2 id="modal-title" className="text-lg sm:text-xl font-bold font-serif text-[#1E080D]">
              {isEditing ? `Editar ${TYPE_LABELS[type]}` : 'Adicionar ao Kino'}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#781D33]/80">
              {isEditing ? 'Atualize as informações do título' : 'Adicione à sua curadoria pessoal'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F6EEEE] hover:bg-[#EBD2D7] text-[#781D33] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar formulário"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário com Scroll Suave */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1">
          {/* Mensagem de Erro / Alerta de Duplicata */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FFF2F4] border border-[#F0B8C2] text-[#781D33] text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#781D33]" />
              <div className="flex-1 font-semibold">{errorMessage}</div>
            </div>
          )}

          {/* Campo 1: Categoria — Exclusivamente Filmes e Séries */}
          <div>
            <label className="block text-xs font-semibold text-[#1E080D] uppercase tracking-wider mb-1.5">
              Categoria <span className="text-[#781D33]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleTypeChange('movie')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl sm:rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                  type === 'movie'
                    ? 'bg-[#781D33] text-white border-[#781D33] shadow-sm'
                    : 'bg-white text-[#781D33] border-[#F0D5DA] hover:bg-[#FBF6F6]'
                }`}
              >
                <Film className="w-4 h-4" />
                Filme
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('series')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl sm:rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
                  type === 'series'
                    ? 'bg-[#781D33] text-white border-[#781D33] shadow-sm'
                    : 'bg-white text-[#781D33] border-[#F0D5DA] hover:bg-[#FBF6F6]'
                }`}
              >
                <Tv className="w-4 h-4" />
                Série
              </button>
            </div>
          </div>

          {/* Campo 2: Capa */}
          <div>
            <label className="block text-xs font-semibold text-[#1E080D] uppercase tracking-wider mb-1.5">
              Capa Oficial <span className="text-[#781D33]">*</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border border-[#F0D5DA] bg-white">
                <div className="w-16 h-24 sm:w-20 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-[#FBF6F6] border border-[#F0D5DA] shadow-sm">
                  <img src={previewUrl} alt="Prévia da capa" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1E080D] truncate">Imagem selecionada</p>
                  <p className="text-[11px] text-[#781D33]/70 mt-0.5">
                    Sincronizada automaticamente entre seus dispositivos.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F6EEEE] text-[#781D33] hover:bg-[#EBD2D7] transition-colors cursor-pointer"
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
                className="w-full border-2 border-dashed border-[#E5BDC5] hover:border-[#781D33] rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center bg-[#FBF6F6]/50 hover:bg-[#F6EEEE] transition-all group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-[#F6EEEE] text-[#781D33] group-hover:scale-105 flex items-center justify-center mb-1.5 transition-transform">
                  <Upload className="w-5 h-5 text-[#781D33]" />
                </div>
                <span className="text-xs font-semibold text-[#1E080D] text-center">
                  Toque para escolher o cartaz ou foto da galeria
                </span>
                <span className="text-[10px] sm:text-[11px] text-[#781D33]/70 mt-0.5">
                  PNG, JPG ou WEBP (armazenamento otimizado)
                </span>
              </button>
            )}
          </div>

          {/* Campo 3: Título com Validação */}
          <div>
            <label htmlFor="media-title" className="block text-xs font-semibold text-[#1E080D] uppercase tracking-wider mb-1.5">
              Título <span className="text-[#781D33]">*</span>
            </label>
            <input
              id="media-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: A Colina Escarlate, Interestelar..."
              required
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#F0D5DA] text-base sm:text-sm text-[#1E080D] placeholder-[#A88B91] focus:outline-none focus:ring-2 focus:ring-[#781D33]/30 focus:border-[#781D33] shadow-sm transition-all"
            />
          </div>

          {/* Campo 4: Gênero e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label htmlFor="media-genre-select" className="block text-xs font-semibold text-[#1E080D] uppercase tracking-wider mb-1.5">
                Gênero <span className="text-[#781D33]">*</span>
              </label>
              <select
                id="media-genre-select"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#F0D5DA] text-base sm:text-sm text-[#1E080D] focus:outline-none focus:ring-2 focus:ring-[#781D33]/30 focus:border-[#781D33] shadow-sm transition-all cursor-pointer"
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
                  className="mt-2 w-full px-3.5 py-2 rounded-2xl bg-white border border-[#F0D5DA] text-base sm:text-sm text-[#1E080D] focus:outline-none focus:ring-2 focus:ring-[#781D33]/30 shadow-sm"
                />
              )}
            </div>

            <div>
              <label htmlFor="media-status-select" className="block text-xs font-semibold text-[#1E080D] uppercase tracking-wider mb-1.5">
                Status <span className="text-[#781D33]">*</span>
              </label>
              <select
                id="media-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#F0D5DA] text-base sm:text-sm text-[#1E080D] focus:outline-none focus:ring-2 focus:ring-[#781D33]/30 focus:border-[#781D33] shadow-sm transition-all cursor-pointer"
              >
                {currentStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Campo 5: Avaliação com Estrelas Douradas */}
          <div>
            <label className="block text-xs font-semibold text-[#1E080D] uppercase tracking-wider mb-1.5">
              Sua Avaliação (0,5 a 5 estrelas) <span className="text-[#781D33]">*</span>
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-white rounded-2xl border border-[#F0D5DA]">
              <div className="flex items-center gap-3">
                <StarRating rating={rating} onChange={(val) => setRating(val)} size="lg" />
                <span className="text-base font-bold text-[#781D33]">
                  {formattedRating} <span className="text-xs text-[#C99A4E] font-semibold">/ 5 ★</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleStepRating(-0.5)}
                  disabled={rating <= 0.5}
                  className="w-8 h-8 rounded-full bg-[#F6EEEE] text-[#781D33] hover:bg-[#EBD2D7] disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Diminuir meia estrela"
                  title="-0,5 estrela"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStepRating(0.5)}
                  disabled={rating >= 5.0}
                  className="w-8 h-8 rounded-full bg-[#F6EEEE] text-[#781D33] hover:bg-[#EBD2D7] disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Aumentar meia estrela"
                  title="+0,5 estrela"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Campo 6: Anotações */}
          <div>
            <label htmlFor="media-notes" className="block text-xs font-semibold text-[#1E080D] uppercase tracking-wider mb-1.5">
              Anotações e Crítica Pessoal <span className="text-[10px] text-[#781D33]/60 font-normal lowercase">(opcional)</span>
            </label>
            <textarea
              id="media-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Diretor, atmosfera visual, citações, impressões..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#F0D5DA] text-base sm:text-sm text-[#1E080D] placeholder-[#A88B91] focus:outline-none focus:ring-2 focus:ring-[#781D33]/30 focus:border-[#781D33] shadow-sm transition-all resize-none"
            />
          </div>

          {/* Rodapé do Modal */}
          <div className="pt-2 sm:pt-3 border-t border-[#F0D5DA] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-full text-xs font-semibold text-[#781D33] hover:bg-[#F6EEEE] transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-semibold bg-[#781D33] text-white hover:bg-[#8C253E] border border-[#C99A4E]/30 disabled:opacity-60 shadow-[0_4px_14px_rgba(120,29,51,0.25)] transition-all cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Adicionar ao Kino'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
