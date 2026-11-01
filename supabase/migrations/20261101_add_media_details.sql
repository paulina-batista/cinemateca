-- ==============================================================================
-- MIGRAÇÃO KINO • 2026-11-01 (DETALHES DE OBRAS & STATUS)
-- ==============================================================================

-- 1. Garante que a coluna status existe com padrão 'Assistido'
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Assistido';

-- 2. Garante que a constraint de rating aceita notas de 0 a 5.0
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'media_items_rating_check'
        AND conrelid = 'public.media_items'::regclass
    ) THEN
        ALTER TABLE public.media_items DROP CONSTRAINT media_items_rating_check;
    END IF;
    ALTER TABLE public.media_items ADD CONSTRAINT media_items_rating_check
        CHECK (rating >= 0 AND rating <= 5.0);
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 3. Detalhes adicionais da obra
-- Ano de lançamento (ex: 2024)
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT NULL;

-- Duração para filmes (ex: "1h 48m" ou "108 min")
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT NULL;

-- Temporadas para séries (ex: "3" ou "3 Temporadas")
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS seasons TEXT DEFAULT NULL;

-- Episódios para séries (ex: "24" ou "24 Episódios")
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS episodes TEXT DEFAULT NULL;
