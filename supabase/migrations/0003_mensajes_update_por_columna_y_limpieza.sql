-- ============================================================
-- MIGRACIÓN 0003 — mensajes: UPDATE restringido a 'leido' (column-grants)
--                   + DROP de la tabla huérfana seller_reviews
-- PASO 0 verificado: fn_borrar_mensaje es SECURITY DEFINER (propietario
--   postgres) y solo ejecuta SET borrado = true → no depende de estos
--   grants; el cliente no necesita UPDATE(borrado).
-- Garantías: no toca políticas RLS (0001 intacta), no toca service_role,
--            el DDL auto-recarga el caché de PostgREST (pgrst_ddl_watch).
-- ============================================================

-- ------------------------------------------------------------
-- 1) mensajes — cerrar el agujero de 'contenido'
-- ------------------------------------------------------------
-- Antes: authenticated tenía UPDATE de tabla completa; update_participantes
-- (0001) solo exige pertenencia a la conversación → un participante podía
-- editar el 'contenido' (u otras columnas) de cualquier mensaje, incluidos
-- los del otro lado.
-- Después: solo se concede SET 'leido' — lo único que el cliente actualiza
-- (messages-logic.js:159-163 y chat_page.dart:204-208, ambos leido:true).
-- El soft-delete sigue por RPC fn_borrar_mensaje (SECURITY DEFINER,
-- autorización propia: solo el emisor borra su mensaje; sin cambios).

REVOKE UPDATE ON TABLE public.mensajes FROM authenticated;
REVOKE UPDATE ON TABLE public.mensajes FROM anon;  -- higiene (RLS ya lo bloqueaba)
GRANT UPDATE (leido) ON TABLE public.mensajes TO authenticated;

-- SELECT explícito para que el WHERE del update (conversacion_id, emisor_id)
-- tenga siempre lectura garantizada:
GRANT SELECT ON TABLE public.mensajes TO authenticated;

-- ------------------------------------------------------------
-- 2) seller_reviews — tabla huérfana: 0 filas (también con service_role),
--    0 lectores/escritores en el código (el widget real consulta 'reviews').
--    Sin CASCADE: si hubiera FK/vistas dependientes, el DROP falla y se
--    reporta — nunca forzar.
-- ------------------------------------------------------------
DROP TABLE IF EXISTS public.seller_reviews;

/*
-- Definición preservada para recrearla si algún día se necesitara
-- (defaults inferidos del spec REST; confirmar antes de reusar):
--   seller_reviews(id uuid PK default gen_random_uuid(), created_at timestamptz default now(),
--                  seller_id uuid, buyer_id uuid, rating integer, "comment" text, ad_id uuid)
--   Políticas 0001: select_publico(anon,authenticated USING true);
--                   insert/update/delete_propio(authenticated, buyer_id = auth.uid())
*/