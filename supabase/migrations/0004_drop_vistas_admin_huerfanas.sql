-- ============================================================
-- MIGRACIÓN 0004 — Cierre de fuga: DROP de vistas admin huérfanas
-- Fecha: 2026-11-11
-- Origen: Security Advisor (0010 security_definer_view) x3
-- ============================================================
-- CONTEXTO:
-- vista_admin_tokens y vista_admin_cortesias fueron creadas en
-- d79616e (2026-01-07, SETUP_ADMIN_CORTESIAS.sql, borrado del repo
-- en 1fcc994). vista_admin_user_plans se creó ad hoc vía dashboard.
-- Son SECURITY DEFINER (owner postgres): bypasean el RLS de las tablas
-- subyacentes y anon tiene SELECT por los privilegios por defecto.
-- Sondas REST confirmaron HTTP 200 para anon con datos reales:
-- códigos de tokens canjeables y PII (emails, nombres).
--
-- DECISIÓN — DROP en lugar de security_invoker, porque:
--   1. 0 referencias en código (web JS y Flutter): el panel admin
--      consulta las tablas directas (plan_tokens, user_plans, profiles).
--   2. DROP elimina vistas + grants + endpoint REST de una sola vez.
--   3. Sin CASCADE: si existiera una dependencia oculta, el DROP
--      falla de forma visible en vez de romperla en silencio.
-- ============================================================

DROP VIEW IF EXISTS public.vista_admin_tokens;
DROP VIEW IF EXISTS public.vista_admin_cortesias;
DROP VIEW IF EXISTS public.vista_admin_user_plans;

/* ============================================================
   DEFINICIONES ORIGINALES (preservadas por si se reconstruyen
   algún día — en ese caso usar WITH (security_invoker = true)
   y GRANT SELECT solo a un rol admin dedicado).

-- 7. Vista para admins - Resumen de tokens
CREATE OR REPLACE VIEW vista_admin_tokens AS
SELECT
    pt.id, pt.codigo, pt.plan_tipo, pt.duracion_dias, pt.usado,
    pt.categoria_especifica, pt.created_at, pt.expira_en, pt.notas, pt.activo,
    p.email as usado_por_email, pt.usado_en,
    CASE
        WHEN pt.usado THEN 'Usado'
        WHEN pt.expira_en < NOW() THEN 'Expirado'
        WHEN pt.activo = FALSE THEN 'Inactivo'
        ELSE 'Disponible'
    END as estado
FROM plan_tokens pt
LEFT JOIN auth.users u ON pt.usado_por = u.id
LEFT JOIN profiles p ON u.id = p.id
ORDER BY pt.created_at DESC;

-- 8. Vista para admins - Cortesías activas
CREATE OR REPLACE VIEW vista_admin_cortesias AS
SELECT
    ca.id, p.email, p.nombre_negocio, ca.plan_tipo,
    ca.fecha_inicio, ca.fecha_fin, ca.metodo, ca.notas, ca.activo,
    CASE
        WHEN ca.fecha_fin < NOW() THEN 'Expirado'
        WHEN ca.activo = FALSE THEN 'Inactivo'
        ELSE 'Activo'
    END as estado,
    DATE_PART('day', ca.fecha_fin - NOW()) as dias_restantes
FROM cortesias_aplicadas ca
JOIN profiles p ON ca.user_id = p.id
ORDER BY ca.fecha_inicio DESC;

(vista_admin_user_plans se creó ad hoc vía dashboard: join de
user_plans + profiles con email, nombre, plan_type, status,
payment_method, amount_paid, currency.)
   ============================================================ */