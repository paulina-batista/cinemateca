-- ==============================================================================
-- SCHEMA OFICIAL SUPABASE • KINO
-- Tabela de Títulos, Políticas de Segurança (RLS), Prevenção de Duplicatas e Storage
-- ==============================================================================

-- 1. Criação da tabela principal de filmes e séries
CREATE TABLE IF NOT EXISTS public.media_items (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('movie', 'series')),
    genre TEXT NOT NULL,
    rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0),
    cover_url TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Índices de alta performance
CREATE INDEX IF NOT EXISTS idx_media_items_user_id ON public.media_items(user_id);
CREATE INDEX IF NOT EXISTS idx_media_items_updated_at ON public.media_items(updated_at);
CREATE INDEX IF NOT EXISTS idx_media_items_deleted_at ON public.media_items(deleted_at);

-- Índice Único para Prevenção de Títulos Duplicados (case-insensitive + trim)
CREATE UNIQUE INDEX IF NOT EXISTS uq_media_items_user_type_title_normalized
ON public.media_items (user_id, type, lower(trim(title)))
WHERE deleted_at IS NULL;

-- 2. Habilitação de Row Level Security (RLS)
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para isolamento estrito entre usuários
DROP POLICY IF EXISTS "Usuários podem ver apenas seus próprios títulos" ON public.media_items;
CREATE POLICY "Usuários podem ver apenas seus próprios títulos"
    ON public.media_items FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir seus próprios títulos" ON public.media_items;
CREATE POLICY "Usuários podem inserir seus próprios títulos"
    ON public.media_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios títulos" ON public.media_items;
CREATE POLICY "Usuários podem atualizar seus próprios títulos"
    ON public.media_items FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem excluir seus próprios títulos" ON public.media_items;
CREATE POLICY "Usuários podem excluir seus próprios títulos"
    ON public.media_items FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Habilitação de Supabase Realtime para sincronização automática
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'media_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.media_items;
    END IF;
END $$;

-- 4. Criação do Bucket de Armazenamento de Capas (Supabase Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-covers', 'media-covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Segurança no Storage para a pasta do usuário: media-covers/{user_id}/*
DROP POLICY IF EXISTS "Capas de filmes são públicas para leitura" ON storage.objects;
CREATE POLICY "Capas de filmes são públicas para leitura"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'media-covers');

DROP POLICY IF EXISTS "Usuários autenticados podem enviar capas" ON storage.objects;
CREATE POLICY "Usuários autenticados podem enviar capas"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'media-covers' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar suas capas" ON storage.objects;
CREATE POLICY "Usuários autenticados podem atualizar suas capas"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'media-covers' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Usuários autenticados podem excluir suas capas" ON storage.objects;
CREATE POLICY "Usuários autenticados podem excluir suas capas"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'media-covers' AND (storage.foldername(name))[1] = auth.uid()::text);
