-- =====================================================================
-- MIGRACIÓN 0001 — Corrige la vulnerabilidad rls_disabled_in_public
-- Proyecto Supabase: Mercados Central (ldtomnicwnwituyensmn)
-- ---------------------------------------------------------------------
-- Motivo: Security Advisor detecta tablas del esquema public con RLS
-- desactivado (cualquiera con la anon key podía leer/escribir todo).
--
-- Diseño de políticas según el uso REAL de la app (web + Flutter):
--   * anuncios            -> lectura pública (catálogo/listados) + CRUD del dueño
--   * categorias          -> SOLO lectura pública (escritura: backend service_role)
--   * provincias          -> SOLO lectura pública (escritura: backend service_role)
--   * profiles            -> lectura pública + insert/update del dueño (id = auth.uid())
--                            (bloquea auto-promoción a is_admin)
--   * reviews             -> lectura pública + insert/update/delete del dueño (reviewer_id)
--   * user_plans          -> lectura solo dueño + solo lectura para admins (panel admin)
--   * conversaciones      -> solo participantes (comprador_id / vendedor_id)
--   * mensajes            -> solo participantes de la conversación; insert solo el emisor
--   * seller_reviews      -> lectura pública + escritura del dueño (buyer_id)
--   * imagenes            -> lectura pública (los listados embeben imagenes(url_imagen))
--                            + escritura del dueño (user_id)
--
-- Notas:
--   * cortesias_aplicadas, plan_tokens, suscripciones, likes y chat_email_log
--     YA tienen RLS activo (verificado por REST: anon ve 0 filas donde el
--     service_role ve N); quedan fuera de esta migración.
--   * El contador de visitas de anuncios se incrementaba con un UPDATE
--     directo del visitante (incluidos anónimos). Con RLS owner-only eso
--     se rompería; se crea el RPC security-definer mc_incrementar_visitas()
--     y product-detail-logic.js pasa a llamarlo.
--   * PROHIBIDO aquí: USING (true) en escrituras, desactivar RLS, o exponer
--     la service_role key en el frontend.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0) Limpieza determinista: elimina políticas previas de las tablas
--    tocadas (evita que políticas dormidas u huérfanas amplíen acceso
--    cuando se activa RLS). Se recrean todas abajo.
-- ---------------------------------------------------------------------
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'anuncios', 'categorias', 'provincias', 'profiles', 'reviews',
              'user_plans', 'conversaciones', 'mensajes', 'seller_reviews', 'imagenes'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 1) Habilitar RLS en todas las tablas afectadas
-- ---------------------------------------------------------------------
ALTER TABLE public.anuncios       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provincias     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imagenes       ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 2) anuncios — columnas reales: id bigint, user_id uuid (dueño)
--    Uso real: lecturas públicas (home, resultados, detalle, perfil
--    vendedor, búsqueda); INSERT form-logic.js / publish_service.dart
--    (siempre con user_id = user.id); UPDATE/DELETE solo "mis anuncios"
--    (panel-unificado-logic.js, editar-anuncio-logic.js, my_ads_page.dart).
-- ---------------------------------------------------------------------
CREATE POLICY "select_publico" ON public.anuncios
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "insert_propio" ON public.anuncios
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_propio" ON public.anuncios
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_propio" ON public.anuncios
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3) categorias y provincias — catálogos de solo lectura pública.
--    Sin políticas de escritura: el backend usa service_role (ignora RLS).
-- ---------------------------------------------------------------------
CREATE POLICY "select_publico" ON public.categorias
    FOR SELECT TO anon, authenticated
    USING (true);


CREATE POLICY "select_publico" ON public.provincias
    FOR SELECT TO anon, authenticated
    USING (true);

-- ---------------------------------------------------------------------
-- 3b) Helper anti-recursión: ¿es admin el usuario actual?
--     SECURITY DEFINER (dueño: postgres): lee profiles sin pasar por las
--     políticas de profiles, de modo que el WITH CHECK de "update_propio"
--     no dispara evaluación recursiva de RLS sobre la misma tabla.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mc_es_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()),
        false
    );
$$;

REVOKE ALL ON FUNCTION public.mc_es_admin() FROM PUBLIC;

-- ---------------------------------------------------------------------
-- 4) profiles — columnas reales: id uuid (= auth.uid()), is_admin boolean,
--    email, telefono, whatsapp, ...
--    Uso real: lectura pública (fichas de vendedor, chats, tarjetas);
--    INSERT en el registro (auth-logic.js: id = user.id); UPDATE/upsert
--    solo el propio perfil (edit_profile_page.dart, panel-unificado).
--    El WITH CHECK impide que un usuario se auto-asigne is_admin = true.
-- ---------------------------------------------------------------------
CREATE POLICY "select_publico" ON public.profiles
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "insert_propio" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id AND NOT COALESCE(is_admin, false));

CREATE POLICY "update_propio" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND (
            NOT COALESCE(is_admin, false)
            OR public.mc_es_admin()
        )
    );

-- Sin DELETE: los perfiles solo se borran por backend (service_role).

-- ---------------------------------------------------------------------
-- 5) reviews — columnas reales: reviewer_id, seller_id, rating, comment.
--    Uso real: lectura pública (estadísticas y lista del vendedor);
--    INSERT solo el autor (reviews-logic.js, review_service.dart).
-- ---------------------------------------------------------------------
CREATE POLICY "select_publico" ON public.reviews
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "insert_propio" ON public.reviews
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "update_propio" ON public.reviews
    FOR UPDATE TO authenticated
    USING (auth.uid() = reviewer_id)
    WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "delete_propio" ON public.reviews
    FOR DELETE TO authenticated
    USING (auth.uid() = reviewer_id);

-- ---------------------------------------------------------------------
-- 6) user_plans — columnas reales: user_id, plan_type, status, ...
--    Uso real: el panel admin (admin-logic.js) lee los planes de todos
--    los usuarios; cada usuario puede leer su propio plan. No hay
--    escrituras desde el frontend (webhooks Stripe/tokens vía
--    service_role). NO se da SELECT público: las "coronas" de las
--    tarjetas salen de anuncios.featured_plan/plan_priority.
-- ---------------------------------------------------------------------
CREATE POLICY "select_propio" ON public.user_plans
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "select_admin" ON public.user_plans
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.is_admin IS TRUE
        )
    );

-- ---------------------------------------------------------------------
-- 7) conversaciones — columnas reales: comprador_id, vendedor_id,
--    anuncio_id, ultimo_mensaje_at.
--    Uso real: cada participante ve y actualiza sus conversaciones
--    (chat-logic.js, messages-logic.js, chat_page.dart); el comprador
--    crea la conversación; el borrado va por RPC fn_borrar_conversacion.
-- ---------------------------------------------------------------------
CREATE POLICY "select_participantes" ON public.conversaciones
    FOR SELECT TO authenticated
    USING (comprador_id = auth.uid() OR vendedor_id = auth.uid());

CREATE POLICY "insert_participante" ON public.conversaciones
    FOR INSERT TO authenticated
    WITH CHECK (comprador_id = auth.uid() OR vendedor_id = auth.uid());

CREATE POLICY "update_participantes" ON public.conversaciones
    FOR UPDATE TO authenticated
    USING (comprador_id = auth.uid() OR vendedor_id = auth.uid())
    WITH CHECK (comprador_id = auth.uid() OR vendedor_id = auth.uid());

CREATE POLICY "delete_participantes" ON public.conversaciones
    FOR DELETE TO authenticated
    USING (comprador_id = auth.uid() OR vendedor_id = auth.uid());

-- ---------------------------------------------------------------------
-- 8) mensajes — columnas reales: conversacion_id, emisor_id, leido,
--    borrado, contenido.
--    Uso real: los participantes leen; inserta solo el emisor
--    (emisor_id = auth.uid() y debe ser participante); los receptores
--    marcan leido = true (update con emisor_id <> auth.uid()).
-- ---------------------------------------------------------------------
CREATE POLICY "select_participantes" ON public.mensajes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversaciones c
            WHERE c.id = conversacion_id
              AND (c.comprador_id = auth.uid() OR c.vendedor_id = auth.uid())
        )
    );

CREATE POLICY "insert_participante" ON public.mensajes
    FOR INSERT TO authenticated
    WITH CHECK (
        emisor_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.conversaciones c
            WHERE c.id = conversacion_id
              AND (c.comprador_id = auth.uid() OR c.vendedor_id = auth.uid())
        )
    );

CREATE POLICY "update_participantes" ON public.mensajes
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversaciones c
            WHERE c.id = conversacion_id
              AND (c.comprador_id = auth.uid() OR c.vendedor_id = auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversaciones c
            WHERE c.id = conversacion_id
              AND (c.comprador_id = auth.uid() OR c.vendedor_id = auth.uid())
        )
    );

CREATE POLICY "delete_participantes" ON public.mensajes
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversaciones c
            WHERE c.id = conversacion_id
              AND (c.comprador_id = auth.uid() OR c.vendedor_id = auth.uid())
        )
    );

-- ---------------------------------------------------------------------
-- 9) seller_reviews — columnas reales: buyer_id (dueño), seller_id, ad_id.
--    Tabla legada hoy vacía; se le dan políticas coherentes con reviews:
--    lectura pública y escritura solo del comprador que reseña.
-- ---------------------------------------------------------------------
CREATE POLICY "select_publico" ON public.seller_reviews
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "insert_propio" ON public.seller_reviews
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "update_propio" ON public.seller_reviews
    FOR UPDATE TO authenticated
    USING (auth.uid() = buyer_id)
    WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "delete_propio" ON public.seller_reviews
    FOR DELETE TO authenticated
    USING (auth.uid() = buyer_id);

-- ---------------------------------------------------------------------
-- 10) imagenes — columnas reales: user_id (dueño), anuncio_id, url_imagen.
--     Tabla hoy vacía, pero los listados públicos la embeben
--     ('*, imagenes(url_imagen), profiles(...)'): se necesita SELECT
--     público para no romper home/resultados/detalle si vuelve a usarse.
-- ---------------------------------------------------------------------
CREATE POLICY "select_publico" ON public.imagenes
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "insert_propio" ON public.imagenes
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_propio" ON public.imagenes
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_propio" ON public.imagenes
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 11) RPC para el contador de visitas.
--     Antes: product-detail-logic.js hacía un UPDATE anónimo de
--     `visitas` con la anon key. Con RLS eso se bloquea (correcto), así
--     que el incremento pasa a un RPC SECURITY DEFINER que solo acepta
--     el id del anuncio (ningún campo controlado por el cliente).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mc_incrementar_visitas(p_anuncio_id bigint)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE public.anuncios
    SET visitas = COALESCE(visitas, 0) + 1
    WHERE id = p_anuncio_id;
$$;

REVOKE ALL ON FUNCTION public.mc_incrementar_visitas(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mc_incrementar_visitas(bigint) TO anon, authenticated;

COMMIT;

-- ---------------------------------------------------------------------
-- Verificación rápida tras aplicar (SQL Editor):
--   SELECT schemaname, tablename, rowsecurity
--   FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;
--   -> debe devolver 0 filas.
--
--   SELECT tablename, policyname, cmd, roles
--   FROM pg_policies WHERE schemaname = 'public'
--   ORDER BY tablename, policyname;
-- ---------------------------------------------------------------------