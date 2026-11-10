-- =====================================================================
-- MIGRACIÓN 0002 — Privacidad de profiles + storage seguro
-- Proyecto Supabase: Mercados Central (ldtomnicwnwituyensmn)
-- ---------------------------------------------------------------------
-- Objetivos:
--   1) anon NO puede leer email / is_admin / whatsapp ni otras columnas
--      privadas de profiles (grant de columnas públicas; la RLS de la
--      0001 sigue filtrando filas, esto restringe COLUMNAS solo para anon).
--   2) El bucket imagenes_anuncios deja de ser escribible por anónimos y
--      authenticated solo puede escribir en su propia carpeta <uid>/.
--   3) Flujos admin: la auditoría NO encontró escrituras cross-usuario
--      sobre anuncios con clave authenticated (admin-logic.js solo
--      actualiza plan_tokens), así que NO se agregan cláusulas de admin
--      a las políticas de anuncios (ver reporte).
--
-- Evidencia de la auditoría (FASE 1):
--   * Columnas reales de profiles: id, telefono, email, created_at,
--     updated_at, nombre_completo, whatsapp, nombre_negocio, tipo_negocio,
--     descripcion, provincia, distrito, direccion, url_foto_perfil,
--     is_admin (spec REST con service_role / information_schema).
--   * Único uso público de profiles (embeds y selects con anon):
--     id, nombre_completo, nombre_negocio, url_foto_perfil, telefono
--     (home-logic.js 80/96/121, results-logic.js 269, product-detail-logic.js
--     856 y 767, perfil-vendedor-logic.js 74 y 43, panel-unificado-logic.js
--     105, featured_ads.dart 40, mercado_search_delegate.dart 82/89,
--     ad_details_page.dart 163, messages-logic.js CONV_SELECT).
--   * telefono SÍ se usa en páginas públicas (botones "Chat por WhatsApp"
--     y "Llamar" en detalle web/perfil vendedor/detalle Flutter) -> queda
--     en el grant, según la regla acordada.
--   * email se renderizaba públicamente (mailto en detalle web y botón
--     Email en Flutter): UI ELIMINADA en este mismo cambio (product-detail-
--     logic.js, detalle-producto.html, ad_details_page.dart), alineando la
--     app con privacidad.html:60 ("el correo NO se muestra públicamente").
--   * whatsapp (columna) sin uso público -> excluida.
--   * Storage: bucket imagenes_anuncios public=true (lectura pública OK,
--     probe 200 sobre una imagen real); PROBE REST demostró que anon podía
--     SUBIR archivos (raíz del bucket y carpeta ajena -> HTTP 200), o sea
--     que existen políticas permisivas preexistentes. Todos los uploads
--     del código ya usan carpeta <uid>/ (form-logic.js 79/90, editar-
--     anuncio-logic.js 1773/1816, panel-unificado-logic.js 301,
--     publish_service.dart 37, upload_page.dart 78, edit_profile_page 118):
--     NO se cambian rutas de upload. La app nunca hace .remove() en storage.
--
-- PROHIBIDO aquí: desactivar RLS, dar SELECT de email a anon, tocar las
-- políticas de la 0001 ni políticas de otros buckets.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1) PRIVACIDAD PROFILES: grant por columnas para anon
--    - Se revoca el SELECT de tabla para anon y se concede SOLO la lista
--      pública. RLS de la 0001 intacta (filas); esto limita columnas.
--    - authenticated NO cambia (mantiene el grant de tabla completo y lee
--      su propio perfil completo vía las políticas de la 0001).
--    - Con column-grants, un select=* de anon devuelve solo las columnas
--      permitidas; pedir una excluida da error de permisos (los selects
--      públicos del frontend ya pedían solo columnas del grant).
-- ---------------------------------------------------------------------
REVOKE SELECT ON public.profiles FROM anon;

GRANT SELECT (
    id,
    nombre_completo,
    nombre_negocio,
    url_foto_perfil,
    telefono
) ON public.profiles TO anon;

-- Excluidas para anon SIEMPRE: email, is_admin, whatsapp y el resto sin
-- uso público verificado (created_at, updated_at, tipo_negocio,
-- descripcion, provincia, distrito, direccion).


-- ---------------------------------------------------------------------
-- 2) STORAGE imagenes_anuncios
-- ---------------------------------------------------------------------

-- 2a) Bucket público en LECTURA (idempotente; ya lo estaba: public=true).
UPDATE storage.buckets
SET public = true
WHERE id = 'imagenes_anuncios';

-- 2b) Cortar la ESCRITURA anon a nivel de PRIVILEGIOS.
--     El probe REST demostró que anon podía subir (raíz y carpeta ajena).
--     Se revocan INSERT/UPDATE/DELETE de storage.objects SOLO para anon:
--     esto anula cualquier política permisiva preexistente para anon en
--     ESTE bucket sin necesidad de borrar políticas (regla: no tocar
--     políticas de otros buckets). authenticated y service_role no cambian.
--     La lectura pública no se afecta (bucket public=true).
REVOKE INSERT ON storage.objects FROM anon;
REVOKE UPDATE ON storage.objects FROM anon;
REVOKE DELETE ON storage.objects FROM anon;

-- 2c) Reemplazo de políticas preexistentes de ESCRITURA para anon que
--     estén SCOPEADAS explícitamente al bucket imagenes_anuncios: se
--     localizan por su definición (los nombres reales no se conocen desde
--     el cliente) y se eliminan. Las políticas SIN scope de bucket no se
--     tocan (regla: no afectar otros buckets); su efecto para anon ya
--     quedó anulado por 2b y se reportan como residuales.
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT policyname, cmd
        FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
          AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
          AND (
              coalesce(qual, '') LIKE '%imagenes_anuncios%'
              OR coalesce(with_check, '') LIKE '%imagenes_anuncios%'
          )
    LOOP
        EXECUTE format('DROP POLICY %I ON storage.objects', r.policyname);
        RAISE NOTICE 'Eliminada política de escritura anon sobre imagenes_anuncios: % (%)', r.policyname, r.cmd;
    END LOOP;
END $$;

-- 2d) Políticas mc_ del bucket (DROP IF EXISTS solo de estos nombres nuevos).
--     Carpeta propia: (storage.foldername(name))[1] = auth.uid()::text
--     (todos los uploads de la app ya cumplen <uid>/<archivo>).
DROP POLICY IF EXISTS "mc_imagenes_anuncios_select" ON storage.objects;
CREATE POLICY "mc_imagenes_anuncios_select" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'imagenes_anuncios');

DROP POLICY IF EXISTS "mc_imagenes_anuncios_insert" ON storage.objects;
CREATE POLICY "mc_imagenes_anuncios_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'imagenes_anuncios'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "mc_imagenes_anuncios_update" ON storage.objects;
CREATE POLICY "mc_imagenes_anuncios_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'imagenes_anuncios'
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'imagenes_anuncios'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "mc_imagenes_anuncios_delete" ON storage.objects;
CREATE POLICY "mc_imagenes_anuncios_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'imagenes_anuncios'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- 2e) Asegurar privilegios DML para authenticated (estado por defecto de
--     Supabase, idempotente) para que las políticas mc_ sean operativas.
GRANT INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

COMMIT;

-- =====================================================================
-- VERIFICACIÓN POST-APLICACIÓN (SQL Editor y REST)
-- =====================================================================
-- 1) Políticas de profiles intactas (deben seguir las de la 0001):
--    SELECT policyname, cmd, roles
--    FROM pg_policies WHERE schemaname='public' AND tablename='profiles';
--
-- 2) Anon ya NO ve columnas privadas de profiles:
--    SET ROLE anon;
--    SELECT * FROM public.profiles LIMIT 1;  -- devuelve SOLO: id,
--        -- nombre_completo, nombre_negocio, url_foto_perfil, telefono
--    SELECT email FROM public.profiles LIMIT 1;    -- ERROR permission denied
--    SELECT is_admin FROM public.profiles LIMIT 1; -- ERROR permission denied
--    RESET ROLE;
--
-- 3) Lecturas públicas de la app siguen funcionando (con la anon key):
--    GET /rest/v1/profiles?select=telefono,nombre_negocio,nombre_completo,url_foto_perfil&id=eq.<uid>  -> 200
--    Embeds públicos de home/resultados/detalle ('*, imagenes(url_imagen),
--    profiles(...)') -> 200 (solo piden columnas del grant).
--
-- 4) Storage:
--    a) anon ya NO puede escribir (probe con anon key):
--       POST /storage/v1/object/imagenes_anuncios/__probe.txt -> 400/403
--       (antes devolvía 200: vulnerabilidad confirmada en la auditoría)
--    b) Lectura pública sigue OK:
--       GET /storage/v1/object/public/imagenes_anuncios/<uid>/<archivo> -> 200
--    c) Con sesión de usuario: subir foto (publicar/editar/perfil) funciona
--       porque la ruta siempre es <uid>/<archivo> (verificado en código).
--
-- 5) Políticas resultantes de storage.objects (revisar el estado final):
--    SELECT policyname, cmd, roles, qual, with_check
--    FROM pg_policies
--    WHERE schemaname='storage' AND tablename='objects'
--    ORDER BY policyname;
--    Deben aparecer las 4 mc_imagenes_anuncios_* y NO debe quedar ninguna
--    política de escritura con rol anon scoped a imagenes_anuncios.
--    Si aparecen políticas de escritura SIN scope de bucket (qual y
--    with_check sin mención de bucket_id), pégalas para revisión: quedaron
--    en su sitio (no afectan a anon por el REVOKE 2b, pero podrían ampliar
--    el alcance de authenticated a otras carpetas/buckets).
--
-- 6) Privilegios resultantes:
--    SELECT grantee, privilege_type FROM information_schema.role_table_grants
--    WHERE table_schema='storage' AND table_name='objects'
--      AND grantee IN ('anon','authenticated') ORDER BY grantee;
--    Esperado: anon -> solo SELECT; authenticated -> SELECT/INSERT/UPDATE/DELETE.
--
-- 7) Flujos admin (solo lectura, sin cambios en 0002):
--    El panel admin sigue leyendo profiles con email/is_admin como
--    authenticated (grants de anon no lo afectan).
-- =====================================================================