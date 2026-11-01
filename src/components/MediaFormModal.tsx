import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Film,
  Tv,
  Upload,
  X,
  AlertCircle,
  Loader2,
  ImagePlus,
  Star,
  CheckCircle2,
  Bookmark,
  Clock,
  Calendar,
  Layers,
  Hash,
  Minus,
  Plus,
} from 'lucide-react';
import type { CreateMediaDTO, MediaItem, MediaType, UpdateMediaDTO } from '../types/media';
import { TYPE_LABELS, migrateLegacyStatus } from '../types/media';
import { getGenresForType } from '../utils/genres';
import { createBlobUrl, processImageToBlob, revokeBlobUrl, validateImageFile } from '../utils/image';

interface MediaFormModalProps {
  isOpen: boolean;
  initialData?: MediaItem | null;
  existingItems?: MediaItem[];
  onClose: () => void;
  onSubmit: (data: CreateMediaDTO | UpdateMediaDTO) => Promise<void>;
}

// ─── Seletor de Status (Apenas Assistido e Na lista) ──────────────────────────
const StatusSelector: React.FC<{
  value: string;
  onChange: (v: 'Assistido' | 'Na lista') => void;
}> = ({ value, onChange }) => {
  const options: Array<{ id: 'Assistido' | 'Na lista'; label: string; desc: string; icon: React.ReactNode }> = [
    {
      id: 'Assistido',
      label: 'Assistido',
      desc: 'Já assisti e avaliei',
      icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'Na lista',
      label: 'Na lista',
      desc: 'Pretendo assistir',
      icon: <Bookmark className="w-4 h-4 shrink-0" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {options.map((opt) => {
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              isSelected
                ? opt.id === 'Assistido'
                  ? 'bg-[#781D33] text-white border-[#781D33] shadow-[0_4px_14px_rgba(120,29,51,0.25)]'
                  : 'bg-[#C99A4E] text-[#1E080D] border-[#C99A4E] shadow-[0_4px_14px_rgba(201,154,78,0.25)] font-medium'
                : 'bg-white text-[#1E080D] border-[#F0D5DA] hover:bg-[#FBF6F6]'
            }`}
          >
            <div className="flex items-center gap-1.5 w-full">
              <span className={isSelected ? (opt.id === 'Assistido' ? 'text-white' : 'text-[#1E080D]') : 'text-[#781D33]'}>
                {opt.icon}
              </span>
              <span className={`text-xs font-bold ${isSelected && opt.id === 'Assistido' ? 'text-white' : ''}`}>
                {opt.label}
              </span>
            </div>
            <span
              className={`text-[10px] mt-1 line-clamp-1 ${
                isSelected
                  ? opt.id === 'Assistido'
                    ? 'text-white/80'
                    : 'text-[#1E080D]/80'
                  : 'text-[#781D33]/60'
              }`}
            >
              {opt.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ─── Avaliação por estrelas interativa (Inicia sempre em 0, passos de 0.5) ───
const StarRatingInput: React.FC<{
  rating: number;
  onChange: (r: number) => void;
}> = ({ rating, onChange }) => {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? rating;

  const handleStep = (delta: number) => {
    const next = Math.max(0, Math.min(5, Math.round((rating + delta) * 2) / 2));
    onChange(next);
  };

  const handleClear = () => onChange(0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Estrelas */}
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHover(null)}
          role="group"
          aria-label="Avaliação em estrelas"
        >
          {[1, 2, 3, 4, 5].map((starIdx) => {
            const half = starIdx - 0.5;
            const full = starIdx;
            const isFull = active >= full;
            const isHalf = !isFull && active >= half;

            return (
              <div key={starIdx} className="relative w-7 h-7 sm:w-8 sm:h-8 cursor-pointer group">
                {/* Estrela de fundo vazia */}
                <Star
                  className="w-full h-full absolute inset-0 text-[#e8cfd4] fill-transparent transition-colors group-hover:text-[#dab3bc]"
                  aria-hidden="true"
                />

                {/* Estrela cheia */}
                {isFull && (
                  <Star
                    className="w-full h-full absolute inset-0 text-[#C99A4E] fill-[#C99A4E] drop-shadow-[0_1px_4px_rgba(201,154,78,0.4)] transition-all"
                    aria-hidden="true"
                  />
                )}

                {/* Meia estrela */}
                {isHalf && (
                  <div className="absolute inset-0 overflow-hidden w-1/2 pointer-events-none">
                    <Star
                      className="w-7 h-7 sm:w-8 sm:h-8 text-[#C99A4E] fill-[#C99A4E] drop-shadow-[0_1px_4px_rgba(201,154,78,0.4)]"
                      aria-hidden="true"
                    />
                  </div>
                )}

                {/* Clique na metade esquerda (incremento 0.5) */}
                <button
                  type="button"
                  className="absolute left-0 top-0 w-1/2 h-full z-10 opacity-0 cursor-pointer"
                  onClick={() => onChange(half)}
                  onMouseEnter={() => setHover(half)}
                  aria-label={`${half} estrelas`}
                />

                {/* Clique na metade direita (estrela inteira) */}
                <button
                  type="button"
                  className="absolute right-0 top-0 w-1/2 h-full z-10 opacity-0 cursor-pointer"
                  onClick={() => onChange(full)}
                  onMouseEnter={() => setHover(full)}
                  aria-label={`${full} estrelas`}
                />
              </div>
            );
          })}
        </div>

        {/* Botões de incremento rápido (+ / -) e indicação numérica */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center border border-[#F0D5DA] rounded-full bg-white p-0.5">
            <button
              type="button"
              disabled={rating <= 0}
              onClick={() => handleStep(-0.5)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#781D33] hover:bg-[#F6EEEE] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Diminuir 0,5 estrela"
              aria-label="Diminuir 0,5 estrela"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={rating >= 5}
              onClick={() => handleStep(0.5)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#781D33] hover:bg-[#F6EEEE] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Aumentar 0,5 estrela"
              aria-label="Aumentar 0,5 estrela"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-right min-w-[4rem]">
            {rating === 0 ? (
              <span className="text-xs text-[#A88B91] font-medium">Não avaliado</span>
            ) : (
              <span className="text-sm font-bold text-[#781D33]">
                {rating.toFixed(1).replace('.0', '').replace('.', ',')}{' '}
                <span className="text-[10px] text-[#C99A4E] font-semibold">/ 5</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {rating > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] text-[#781D33]/60 hover:text-[#781D33] underline cursor-pointer transition-colors"
          >
            Redefinir para 0 (não avaliado)
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Modal Principal de Cadastro / Edição ─────────────────────────────────────
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
  const [year, setYear] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [seasons, setSeasons] = useState<string>('');
  const [episodes, setEpisodes] = useState<string>('');
  const [status, setStatus] = useState<'Assistido' | 'Na lista'>('Assistido');
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(initialData);

  useEffect(() => {
    let url = '';
    if (initialData) {
      setTitle(initialData.title || '');
      const itemType: MediaType =
        initialData.type === 'movie' || initialData.type === 'series'
          ? (initialData.type as MediaType)
          : 'movie';
      setType(itemType);

      const genres = getGenresForType(itemType);
      const isPreset = (genres as readonly string[]).includes(initialData.genre);
      setGenre(isPreset ? initialData.genre : 'custom');
      setCustomGenre(isPreset ? '' : initialData.genre);

      setYear(initialData.year ? String(initialData.year) : '');
      setDuration(initialData.duration || '');
      setSeasons(initialData.seasons ? String(initialData.seasons) : '');
      setEpisodes(initialData.episodes ? String(initialData.episodes) : '');

      // Migração segura para apenas Assistido ou Na lista
      const normalizedStatus = migrateLegacyStatus(initialData.status);
      setStatus(normalizedStatus === 'Na lista' ? 'Na lista' : 'Assistido');

      // Rating: aceita 0
      setRating(typeof initialData.rating === 'number' ? initialData.rating : 0);
      setNotes(initialData.notes || '');
      setCoverBlob(initialData.coverBlob || null);

      if (initialData.remoteCoverUrl) {
        setPreviewUrl(initialData.remoteCoverUrl);
      } else if (initialData.coverBlob && initialData.coverBlob.size > 0) {
        url = createBlobUrl(initialData.coverBlob);
        setPreviewUrl(url);
      } else {
        setPreviewUrl('');
      }
    } else {
      // Novo cadastro: SEMPRE começa com 0 estrelas
      setTitle('');
      setType('movie');
      const genres = getGenresForType('movie');
      setGenre(genres[0]);
      setCustomGenre('');
      setYear('');
      setDuration('');
      setSeasons('');
      setEpisodes('');
      setStatus('Assistido');
      setRating(0); // Inicia sempre com ZERO
      setNotes('');
      setCoverBlob(null);
      setPreviewUrl('');
    }
    setErrorMessage(null);
    return () => {
      if (url) revokeBlobUrl(url);
    };
  }, [initialData, isOpen]);

  const handleTypeChange = (newType: MediaType) => {
    setType(newType);
    const genres = getGenresForType(newType);
    setGenre(genres[0]);
    setCustomGenre('');
  };

  const processFile = useCallback(
    async (file: File) => {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Arquivo de imagem inválido.');
        return;
      }
      try {
        const blob = await processImageToBlob(file);
        setCoverBlob(blob);
        if (previewUrl && previewUrl.startsWith('blob:')) revokeBlobUrl(previewUrl);
        setPreviewUrl(createBlobUrl(blob));
        setErrorMessage(null);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Falha ao processar imagem.');
      }
    },
    [previewUrl]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage('Por favor, informe o título da obra.');
      return;
    }

    // Validação de duplicata no catálogo
    const norm = trimmedTitle.toLowerCase();
    const isDup = existingItems.some((item) => {
      if (isEditing && item.id === initialData?.id) return false;
      return item.type === type && item.title.trim().toLowerCase() === norm;
    });
    if (isDup) {
      setErrorMessage(`"${trimmedTitle}" já está cadastrado como ${TYPE_LABELS[type]}.`);
      return;
    }

    const finalGenre = genre === 'custom' ? customGenre.trim() : genre.trim();
    if (!finalGenre) {
      setErrorMessage('Por favor, selecione ou informe o gênero.');
      return;
    }

    if (rating < 0 || rating > 5) {
      setErrorMessage('A avaliação deve ser entre 0 e 5 estrelas.');
      return;
    }

    if (!coverBlob && !previewUrl) {
      setErrorMessage('A imagem de capa é obrigatória. Selecione um cartaz da galeria.');
      return;
    }

    const parsedYear = year.trim() ? parseInt(year.trim(), 10) : null;
    if (year.trim() && (isNaN(parsedYear!) || parsedYear! < 1880 || parsedYear! > 2100)) {
      setErrorMessage('Informe um ano de lançamento válido (ex: 2024).');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: trimmedTitle,
        type,
        genre: finalGenre,
        year: parsedYear,
        duration: type === 'movie' ? duration.trim() || null : null,
        seasons: type === 'series' ? seasons.trim() || null : null,
        episodes: type === 'series' ? episodes.trim() || null : null,
        rating,
        status,
        coverBlob: coverBlob || (initialData?.coverBlob as Blob),
        notes: notes.trim(),
      } as CreateMediaDTO);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Falha ao salvar a obra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentGenres = getGenresForType(type);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1E080D]/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#FFFDFD] rounded-2xl sm:rounded-3xl border border-[#F0D5DA] shadow-[0_25px_60px_rgba(30,8,13,0.4)] overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Elegante */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#F0D5DA] flex items-center justify-between bg-[#FBF6F6] shrink-0">
          <div>
            <h2 id="form-modal-title" className="text-lg sm:text-xl font-bold font-serif text-[#1E080D]">
              {isEditing ? `Editar ${TYPE_LABELS[type]}` : 'Cadastrar no Kino'}
            </h2>
            <p className="text-[11px] text-[#781D33]/70 mt-0.5">
              Curadoria de cinema e séries com estética e sincronização na nuvem
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F6EEEE] hover:bg-[#EBD2D7] text-[#781D33] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário com 2 Colunas no Desktop e 1 no Celular */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-5 sm:gap-7">
            {/* ══════════ COLUNA ESQUERDA: Capa Oficial ══════════ */}
            <div className="w-40 sm:w-56 md:w-64 mx-auto sm:mx-0 shrink-0 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1E080D] uppercase tracking-wider flex items-center gap-1">
                  Capa Oficial <span className="text-[#781D33]">*</span>
                </label>
                <span className="text-[10px] text-[#781D33]/60 font-medium">Proporção 2:3</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                id="kino-cover-file-input"
              />

              {/* Área do Cartaz */}
              <div
                className={`group relative w-full aspect-[2/3] rounded-2xl border-2 overflow-hidden transition-all cursor-pointer shadow-sm ${
                  isDragging
                    ? 'border-[#781D33] bg-[#FFF2F4]'
                    : previewUrl
                    ? 'border-[#F0D5DA] hover:border-[#781D33]'
                    : 'border-dashed border-[#E5BDC5] hover:border-[#781D33] bg-[#FBF6F6] hover:bg-[#F6EEEE]'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Prévia do cartaz"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-white text-center">
                      <ImagePlus className="w-6 h-6 mb-1 text-[#C99A4E]" />
                      <span className="text-xs font-semibold">Substituir cartaz</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#F6EEEE] text-[#781D33] flex items-center justify-center shadow-inner">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1E080D] leading-snug">
                        Toque para selecionar
                      </p>
                      <p className="text-[10px] text-[#781D33]/70 mt-0.5">
                        ou arraste um cartaz aqui
                      </p>
                    </div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#F6EEEE] text-[#781D33]">
                      PNG, JPG ou WEBP
                    </span>
                  </div>
                )}
              </div>

              {previewUrl && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-[#F6EEEE] text-[#781D33] hover:bg-[#EBD2D7] transition-colors cursor-pointer border border-[#F0D5DA]"
                >
                  <ImagePlus className="w-3.5 h-3.5 text-[#C99A4E]" />
                  Alterar imagem
                </button>
              )}
            </div>

            {/* ══════════ COLUNA DIREITA: Grupos de Informações ══════════ */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
              {/* Mensagem de Erro */}
              {errorMessage && (
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FFF2F4] border border-[#F0B8C2] text-[#781D33] text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#781D33]" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
              )}

              {/* 1. Categorias (Apenas Filme e Série) */}
              <div>
                <label className="block text-xs font-bold text-[#1E080D] uppercase tracking-wider mb-1.5">
                  Categoria <span className="text-[#781D33]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['movie', 'series'] as MediaType[]).map((t) => {
                    const isSelected = type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleTypeChange(t)}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#781D33] text-white border-[#781D33] shadow-sm'
                            : 'bg-white text-[#781D33] border-[#F0D5DA] hover:bg-[#FBF6F6]'
                        }`}
                      >
                        {t === 'movie' ? (
                          <Film className={`w-3.5 h-3.5 ${isSelected ? 'text-[#C99A4E]' : ''}`} />
                        ) : (
                          <Tv className={`w-3.5 h-3.5 ${isSelected ? 'text-[#C99A4E]' : ''}`} />
                        )}
                        {TYPE_LABELS[t]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Título da Obra */}
              <div>
                <label
                  htmlFor="kino-title-input"
                  className="block text-xs font-bold text-[#1E080D] uppercase tracking-wider mb-1.5"
                >
                  Título da Obra <span className="text-[#781D33]">*</span>
                </label>
                <input
                  id="kino-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={type === 'movie' ? 'ex: A Colina Escarlate, Interestelar...' : 'ex: Anne com E, Dark...'}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#F0D5DA] text-sm text-[#1E080D] placeholder-[#A88B91] focus:outline-none focus:ring-2 focus:ring-[#781D33]/30 focus:border-[#781D33] shadow-sm transition-all"
                />
              </div>

              {/* 3. Gênero e Ano de Lançamento em Linha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Gênero */}
                <div>
                  <label
                    htmlFor="kino-genre-select"
                    className="block text-xs font-bold text-[#1E080D] uppercase tracking-wider mb-1.5"
                  >
                    Gênero <span className="text-[#781D33]">*</span>
                  </label>
                  <select
                    id="kino-genre-select"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#F0D5DA] text-sm text-[#1E080D] focus:outline-none focus:ring-2 focus:ring-[#781D33]/30 focus:border-[#781D33] shadow-sm cursor-pointer"
                  >
                    {currentGenres.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                    <option value="custom">Outro gênero...</option>
                  </select>
                  {genre === 'custom' && (
                    <input
                      type="text"
                      value={customGenre}
                      onChange={(e) => setCustomGenre(e.target.value)}
                      placeholder="Digite o gênero..."
                      className="mt-2 w-full px-3.5 py-2 rounded-2xl bg-white border border-[#F0D5DA] text-sm text-[#1E080D] focus:outline-none focus:ring-2 focus:ring-[#781D33]/30 shadow-sm"
                    />
                  )}
                </div>

                {/* Ano de Lançamento */}
                <div>
                  <label
                    htmlFor="kino-year-input"
                    className="block text-xs font-bold text-[#1E080D] uppercase tracking-wider mb-1.5 flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#C99A4E]" />
                    Ano de Lançamento
                  </label>
                  <input
                    id="kino-year-input"
                    type="number"
                    min="1888"
                    max="2100"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="ex: 2024"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#F0D5DA] text-sm text-[#1E080D] placeholder-[#A88B91] focus:outline-none focus:ring-2 focus:ring-[#781D33]/30 focus:border-[#781D33] shadow-sm transition-all"
                  />
                </div>
              </div>

              {/* 4. Campos Específicos da Categoria (Duração para filmes; Temporadas/Episódios para séries) */}
              {type === 'movie' ? (
                <div>
                  <label
                    htmlFor="kino-duration-input"
                    className="block text-xs font-bold text-[#1E080D] uppercase tracking-wider mb-1.5 flex items-center gap-1"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#C99A4E]" />
                    Duração
                    <span className="text-[10px] text-[#781D33]/60 font-normal lowercase">(opcional)</span>
                  </label>
                  <input
                    id="kino-duration-input"
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="ex: 1h 59m ou 119 min"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#F0D5DA] text-sm text-[#1E080D] placeholder-[#A88B91] focus:outline-none focus:ring-2 focus:ring-[#781D33]/30 focus:border-[#781D33] shadow-sm transition-all"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="kino-seasons-input"
                      className="block text-xs font-bold text-[#1E080D] uppercase tracking-wider mb-1.5 flex items-center gap-1"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#C99A4E]" />
                      Temporadas
                    </label>
                    <input
                      id="kino-seasons-input"
                      type="text"
                      value={seasons}
                      onChange={(e) => setSeasons(e.target.value)}
                      placeholder="ex: 3"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#F0D5DA] text-sm text-[#1E080D] placeholder-[#A88B91] focus:outline-none focus:ring-2 focus:ring-[#781D33]/30 focus:border-[#781D33] shadow-sm transition-all"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="kino-episodes-input"
                      className="block text-xs font-bold text-[#1E080D] uppercase tracking-wider mb-1.5 flex items-center gap-1"
                    >
                      <Hash className="w-3.5 h-3.5 text-[#C99A4E]" />
                      Episódios
                    </label>
                    <input
                      id="kino-episodes-input"
                      type="text"
                      value={episodes}
                      onChange={(e) => setEpisodes(e.target.value)}
                      placeholder="ex: 24"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#F0D5DA] text-sm text-[#1E080D] placeholder-[#A88B91] focus:outline-none focus:ring-2 focus:ring-[#781D33]/30 focus:border-[#781D33] shadow-sm transition-all"
                    />
                  </div>
                </div>
              )}

              {/* 5. Status (Somente Assistido e Na lista) */}
              <div>
                <label className="block text-xs font-bold text-[#1E080D] uppercase tracking-wider mb-1.5">
                  Status <span className="text-[#781D33]">*</span>
                </label>
                <StatusSelector value={status} onChange={setStatus} />
              </div>

              {/* 6. Avaliação Pessoal (Começa em zero, escala 0 a 5 com passos de 0.5) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#1E080D] uppercase tracking-wider">
                    Sua Avaliação
                  </label>
                  <span className="text-[10px] text-[#781D33]/60 font-medium">
                    {rating === 0 ? 'Começa vazia • Opcional' : 'Escala de 0 a 5'}
                  </span>
                </div>
                <div className="p-3.5 bg-white rounded-2xl border border-[#F0D5DA]">
                  <StarRatingInput rating={rating} onChange={setRating} />
                </div>
              </div>

              {/* 7. Diário, Anotações & Resenha Pessoal */}
              <div>
                <label
                  htmlFor="kino-notes-textarea"
                  className="block text-xs font-bold text-[#1E080D] uppercase tracking-wider mb-1.5"
                >
                  Diário & Anotações Pessoais
                  <span className="ml-1 text-[10px] text-[#781D33]/60 font-normal lowercase">(opcional)</span>
                </label>
                <textarea
                  id="kino-notes-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="O que achou deste filme ou série? Citações, momentos marcantes, direção..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#F0D5DA] text-sm text-[#1E080D] placeholder-[#A88B91] focus:outline-none focus:ring-2 focus:ring-[#781D33]/30 focus:border-[#781D33] shadow-sm resize-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Footer com Ações */}
          <div className="px-5 sm:px-6 py-4 border-t border-[#F0D5DA] flex items-center justify-between bg-[#FBF6F6] shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] text-[#781D33]/70 font-medium">
              <Star className="w-3.5 h-3.5 fill-[#C99A4E] text-[#C99A4E]" />
              <span>Sincronização em nuvem e cache local ativo</span>
            </div>
            <div className="flex items-center gap-2.5">
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
                id="kino-form-submit"
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-bold bg-[#781D33] text-white hover:bg-[#8C253E] border border-[#C99A4E]/30 disabled:opacity-60 shadow-[0_4px_14px_rgba(120,29,51,0.25)] transition-all cursor-pointer"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Salvar no Kino'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
