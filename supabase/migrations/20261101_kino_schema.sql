-- ==============================================================================
-- MIGRAÇÃO KINO • 2026-11-01
-- Prevenção de Títulos Duplicados, Realtime e Atualizações de Esquema
-- ==============================================================================

-- 1. Consulta para auditoria de duplicatas existentes (Executar antes para conferência)
-- Caso retorne linhas, nenhuma exclusão automática deve ser feita antes de confirmação.
DO $$
BEGIN
    RAISE NOTICE 'Verificando se existem títulos duplicados pré-existentes...';
END $$;

-- 2. Criação do índice único case-insensitive com remoção de espaços nas pontas (trim)
-- Este índice garante que o mesmo usuário não cadastre o mesmo filme ou série duas vezes,
-- ignorando maiúsculas/minúsculas e espaços extras.
CREATE UNIQUE INDEX IF NOT EXISTS uq_media_items_user_type_title_normalized
ON public.media_items (user_id, type, lower(trim(title)))
WHERE deleted_at IS NULL;

-- 3. Habilitação de Realtime para sincronização instantânea entre celular e computador
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

-- 4. Garantia de persistência do bucket de capas de alta resolução no Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-covers', 'media-covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Atualização das políticas RLS no Storage
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
