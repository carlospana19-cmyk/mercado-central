-- ============================================================
-- MIGRACIÓN 0005 — Ciclo de vida de anuncios (pg_cron)
-- ============================================================
-- REGLA DE NEGOCIO:
--   * Todos los planes duran 30 días.
--   * Plan de pago (basico / premium / destacado):
--       día 0-30   → plan de pago           (anuncios.featured_until)
--       día 30-60  → pasa a GRATIS          (este job lo baja)
--       día 60     → se ELIMINA             (anuncios.fecha_eliminacion)
--   * Plan gratis: 30 días y se ELIMINA     (fecha_eliminacion = +30d)
--
-- Las fechas ya las escriben form-logic.js (web) y publish_service.dart
-- (app). Lo que faltaba era quien las ejecutara: esta migración.
--
-- ANTES DE EJECUTAR:
--   1. Habilitar pg_cron: Dashboard → Database → Extensions → pg_cron.
--   2. Ejecutar todo este archivo en el SQL Editor.
--
-- NOTAS:
--   * Anuncios de pago publicados ANTES de este cambio no tienen
--     featured_until (NULL) → no se bajan a gratis; solo se eliminan en
--     su fecha_eliminacion. Ver bloque opcional al final.
--   * plan_priority: la app usa 1-4 (gratis = 1, ver plan_limits.dart);
--     la web no lo escribe. Al bajar a gratis se deja en 1.
--   * El DELETE no borra los archivos de Storage (imagenes_anuncios).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ------------------------------------------------------------
-- 1) Función del ciclo de vida
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mc_ciclo_vida_anuncios()
RETURNS TABLE (bajados_a_gratis integer, eliminados integer, desactivados integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_bajados      integer := 0;
    v_eliminados   integer := 0;
    v_desactivados integer := 0;
    r              record;
BEGIN
    -- a) Plan de pago vencido → pasa a GRATIS (sigue publicado hasta fecha_eliminacion)
    UPDATE public.anuncios
    SET featured_plan = 'free',
        selected_plan = 'free',
        plan_priority = 1,
        featured_until = NULL,
        plan = CASE WHEN plan IS NULL THEN NULL ELSE 'free' END
    WHERE featured_until IS NOT NULL
      AND featured_until < now()
      AND lower(coalesce(featured_plan, '')) NOT IN ('', 'free', 'gratis');
    GET DIAGNOSTICS v_bajados = ROW_COUNT;

    -- b) Anuncios vencidos → ELIMINAR.
    --    Por fila: si una FK impide borrar (p. ej. una conversación), ese
    --    anuncio se desactiva y el resto sigue. No frena todo el job.
    FOR r IN
        SELECT id FROM public.anuncios
        WHERE fecha_eliminacion IS NOT NULL
          AND fecha_eliminacion < now()
    LOOP
        BEGIN
            DELETE FROM public.anuncios WHERE id = r.id;
            v_eliminados := v_eliminados + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'mc_ciclo_vida_anuncios: no se pudo borrar anuncio % (%): se desactiva',
                r.id, SQLERRM;
            UPDATE public.anuncios SET activo = false WHERE id = r.id AND activo IS DISTINCT FROM false;
            v_desactivados := v_desactivados + 1;
        END;
    END LOOP;

    -- c) Cortesías (tokens) vencidas → inactivas
    UPDATE public.cortesias_aplicadas
    SET activo = false
    WHERE activo = true
      AND fecha_fin IS NOT NULL
      AND fecha_fin < now();

    RETURN QUERY SELECT v_bajados, v_eliminados, v_desactivados;
END;
$$;

-- Solo el job (postgres) y service_role pueden ejecutarla; nunca el cliente.
REVOKE ALL ON FUNCTION public.mc_ciclo_vida_anuncios() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mc_ciclo_vida_anuncios() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mc_ciclo_vida_anuncios() TO service_role;

-- ------------------------------------------------------------
-- 2) Programación: cada hora, en el minuto 0
-- ------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mc_ciclo_vida_anuncios') THEN
        PERFORM cron.unschedule('mc_ciclo_vida_anuncios');
    END IF;
END $$;

SELECT cron.schedule(
    'mc_ciclo_vida_anuncios',
    '0 * * * *',
    $$ SELECT public.mc_ciclo_vida_anuncios(); $$
);

-- ------------------------------------------------------------
-- 3) Verificación (ejecutar a mano tras aplicar)
-- ------------------------------------------------------------
-- Job creado:
--   SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'mc_ciclo_vida_anuncios';
-- Últimas corridas:
--   SELECT status, return_message, start_time FROM cron.job_run_details
--   ORDER BY start_time DESC LIMIT 5;
-- Prueba manual (¡borra anuncios vencidos de verdad!):
--   SELECT * FROM public.mc_ciclo_vida_anuncios();
-- Ver qué se afectaría ANTES de correrla:
--   SELECT id, featured_plan, featured_until, fecha_eliminacion FROM public.anuncios
--   WHERE (featured_until < now() AND lower(coalesce(featured_plan,'')) NOT IN ('','free','gratis'))
--      OR fecha_eliminacion < now();

/* ------------------------------------------------------------
   OPCIONAL — anuncios de pago antiguos sin featured_until
   (publicados antes de este cambio). Les asigna 30 días desde su
   fecha de publicación; los que ya pasaron bajarán a gratis en la
   próxima corrida. Revisar antes con un SELECT.

UPDATE public.anuncios
SET featured_until = fecha_publicacion + interval '30 days'
WHERE featured_until IS NULL
  AND lower(coalesce(featured_plan, '')) IN ('basico', 'premium', 'destacado', 'top')
  AND fecha_publicacion IS NOT NULL;
   ------------------------------------------------------------ */
