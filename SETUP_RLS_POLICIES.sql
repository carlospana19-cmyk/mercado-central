-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- Tablas: profiles, user_plans, plan_tokens
-- =====================================================

-- =====================================================
-- HABILITAR RLS
-- =====================================================

-- Profiles: todos pueden leer, solo admins pueden modificar
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de perfiles a usuarios autenticados"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir actualización de perfiles al propio usuario o admin"
ON profiles FOR UPDATE
TO authenticated
USING (
    auth.uid() = id 
    OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- =====================================================
-- USER_PLANS: Solo admins pueden leer y escribir
-- =====================================================

ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admins pueden leer user_plans"
ON user_plans FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Solo admins pueden insertar user_plans"
ON user_plans FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Solo admins pueden actualizar user_plans"
ON user_plans FOR UPDATE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Solo admins pueden eliminar user_plans"
ON user_plans FOR DELETE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- =====================================================
-- PLAN_TOKENS: Solo admins pueden leer y escribir
-- =====================================================

ALTER TABLE plan_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admins pueden leer plan_tokens"
ON plan_tokens FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Solo admins pueden insertar plan_tokens"
ON plan_tokens FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Solo admins pueden actualizar plan_tokens"
ON plan_tokens FOR UPDATE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Solo admins pueden eliminar plan_tokens"
ON plan_tokens FOR DELETE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- =====================================================
-- CORTESIAS: Solo admins pueden gestionar
-- =====================================================

ALTER TABLE cortesias_aplicadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admins pueden leer cortesias"
ON cortesias_aplicadas FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Solo admins pueden insertar cortesias"
ON cortesias_aplicadas FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Solo admins pueden actualizar cortesias"
ON cortesias_aplicadas FOR UPDATE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Solo admins pueden eliminar cortesias"
ON cortesias_aplicadas FOR DELETE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- =====================================================
-- ANUNCIOS: Solo admins pueden ver todos
-- =====================================================

ALTER TABLE anuncios ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propios anuncios
CREATE POLICY "Usuarios ven sus propios anuncios"
ON anuncios FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Los admins ven todos los anuncios
CREATE POLICY "Admins ven todos los anuncios"
ON anuncios FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
