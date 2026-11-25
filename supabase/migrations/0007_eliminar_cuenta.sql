-- ============================================================
-- MIGRACIÓN 0007 — Eliminar mi cuenta (RPC mc_eliminar_mi_cuenta)
-- ============================================================
-- Google Play / App Store exigen poder eliminar la cuenta y sus datos.
-- Ejecutar DESPUÉS de 0006. Ejecutar todo el archivo en el SQL Editor.
--
-- Qué borra (solo del usuario autenticado, nunca de otro):
--   mensajes, conversaciones, likes, reseñas, anuncios, perfil, tokens/planes
--   y el usuario de auth. Para tablas con FK sin ON DELETE CASCADE hacia
--   anuncios / profiles / auth.users consulta pg_constraint y borra primero
--   esas filas, así no falla por tablas que este archivo no conoce.
--
-- Los ARCHIVOS de Storage (bucket imagenes_anuncios, carpeta {user_id}/) los
-- borra el cliente (app y web) ANTES de llamar al RPC: borrar storage.objects
-- por SQL deja los archivos huérfanos.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.mc_eliminar_mi_cuenta()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    r     record;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'No autenticado' USING ERRCODE = '28000';
    END IF;

    -- a) Chat: mensajes y conversaciones donde participa o sobre sus anuncios
    DELETE FROM public.mensajes
    WHERE emisor_id = v_uid
       OR conversacion_id IN (
            SELECT c.id FROM public.conversaciones c
            WHERE c.comprador_id = v_uid
               OR c.vendedor_id  = v_uid
               OR c.anuncio_id IN (SELECT a.id FROM public.anuncios a WHERE a.user_id = v_uid)
       );

    DELETE FROM public.conversaciones
    WHERE comprador_id = v_uid
       OR vendedor_id  = v_uid
       OR anuncio_id IN (SELECT a.id FROM public.anuncios a WHERE a.user_id = v_uid);

    -- b) Datos propios en tablas conocidas (solo si la tabla y columna existen)
    FOR r IN
        SELECT t.tabla, t.columna
        FROM (VALUES
            ('likes',               'user_id'),
            ('reviews',             'reviewer_id'),
            ('reviews',             'seller_id'),
            ('seller_reviews',      'buyer_id'),
            ('seller_reviews',      'seller_id'),
            ('imagenes',            'user_id'),
            ('cortesias_aplicadas', 'user_id'),
            ('suscripciones',       'user_id'),
            ('user_plans',          'user_id'),
            ('reportes',            'reporter_id')
        ) AS t(tabla, columna)
        WHERE EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_schema = 'public'
              AND c.table_name   = t.tabla
              AND c.column_name  = t.columna
        )
    LOOP
        EXECUTE format('DELETE FROM public.%I WHERE %I = $1', r.tabla, r.columna) USING v_uid;
    END LOOP;

    -- c) Filas que dependen de SUS anuncios (FK sin cascade): likes de otros,
    --    cortesías, imágenes, reportes, etc.
    FOR r IN
        SELECT c.conrelid::regclass AS tabla, a.attname AS columna
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
        WHERE c.contype = 'f'
          AND c.confrelid = 'public.anuncios'::regclass
          AND c.conrelid <> c.confrelid
          AND c.confdeltype IN ('a', 'r')
          AND array_length(c.conkey, 1) = 1
    LOOP
        EXECUTE format(
            'DELETE FROM %s WHERE %I IN (SELECT id FROM public.anuncios WHERE user_id = $1)',
            r.tabla, r.columna) USING v_uid;
    END LOOP;

    DELETE FROM public.anuncios WHERE user_id = v_uid;

    -- d) Filas que dependen de su PERFIL (FK sin cascade)
    FOR r IN
        SELECT c.conrelid::regclass AS tabla, a.attname AS columna
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
        WHERE c.contype = 'f'
          AND c.confrelid = 'public.profiles'::regclass
          AND c.conrelid <> c.confrelid
          AND c.confdeltype IN ('a', 'r')
          AND array_length(c.conkey, 1) = 1
    LOOP
        EXECUTE format('DELETE FROM %s WHERE %I = $1', r.tabla, r.columna) USING v_uid;
    END LOOP;

    DELETE FROM public.profiles WHERE id = v_uid;

    -- e) Filas de public que dependen del usuario de auth (FK sin cascade)
    FOR r IN
        SELECT c.conrelid::regclass AS tabla, a.attname AS columna
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
        WHERE c.contype = 'f'
          AND c.confrelid = 'auth.users'::regclass
          AND c.connamespace = 'public'::regnamespace
          AND c.confdeltype IN ('a', 'r')
          AND array_length(c.conkey, 1) = 1
    LOOP
        EXECUTE format('DELETE FROM %s WHERE %I = $1', r.tabla, r.columna) USING v_uid;
    END LOOP;

    -- f) Por último, el usuario de autenticación (cascada a sesiones e identidades)
    DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.mc_eliminar_mi_cuenta() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mc_eliminar_mi_cuenta() FROM anon;
GRANT EXECUTE ON FUNCTION public.mc_eliminar_mi_cuenta() TO authenticated;

COMMIT;

-- Verificación:
--   SELECT proname FROM pg_proc WHERE proname = 'mc_eliminar_mi_cuenta';
