-- ============================================================
-- MIGRACIÓN 0006 — Reportes de anuncios (moderación)
-- ============================================================
-- Google Play / App Store exigen poder REPORTAR contenido de usuarios.
-- Ejecutar todo el archivo en el SQL Editor de Supabase.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.reportes (
    id                   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reporter_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anuncio_id           bigint      REFERENCES public.anuncios(id) ON DELETE CASCADE,
    usuario_reportado_id uuid,
    motivo               text        NOT NULL,
    detalle              text,
    estado               text        NOT NULL DEFAULT 'pendiente',
    created_at           timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT reportes_motivo_chk CHECK (motivo IN (
        'fraude', 'contenido_inapropiado', 'producto_prohibido',
        'informacion_falsa', 'spam', 'otro')),
    CONSTRAINT reportes_estado_chk CHECK (estado IN ('pendiente', 'revisado', 'descartado')),
    CONSTRAINT reportes_detalle_chk CHECK (detalle IS NULL OR char_length(detalle) <= 500),
    CONSTRAINT reportes_objetivo_chk CHECK (anuncio_id IS NOT NULL OR usuario_reportado_id IS NOT NULL)
);

-- Un usuario solo puede reportar una vez el mismo anuncio.
CREATE UNIQUE INDEX IF NOT EXISTS reportes_unico_por_usuario_anuncio
    ON public.reportes (reporter_id, anuncio_id)
    WHERE anuncio_id IS NOT NULL;

ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_propio" ON public.reportes;
CREATE POLICY "insert_propio" ON public.reportes
    FOR INSERT TO authenticated
    WITH CHECK (reporter_id = auth.uid() AND estado = 'pendiente');

DROP POLICY IF EXISTS "select_propio" ON public.reportes;
CREATE POLICY "select_propio" ON public.reportes
    FOR SELECT TO authenticated
    USING (reporter_id = auth.uid());

DROP POLICY IF EXISTS "select_admin" ON public.reportes;
CREATE POLICY "select_admin" ON public.reportes
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin IS TRUE));

DROP POLICY IF EXISTS "update_admin" ON public.reportes;
CREATE POLICY "update_admin" ON public.reportes
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin IS TRUE))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin IS TRUE));

REVOKE ALL ON public.reportes FROM anon;
GRANT SELECT, INSERT ON public.reportes TO authenticated;
GRANT UPDATE (estado) ON public.reportes TO authenticated;

COMMIT;

-- Ver reportes pendientes (SQL Editor):
--   SELECT r.id, r.motivo, r.detalle, r.anuncio_id, a.titulo, r.created_at
--   FROM public.reportes r LEFT JOIN public.anuncios a ON a.id = r.anuncio_id
--   WHERE r.estado = 'pendiente' ORDER BY r.created_at DESC;
