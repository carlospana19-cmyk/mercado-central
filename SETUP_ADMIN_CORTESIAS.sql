-- =====================================================
-- SISTEMA DE CORTESÍAS - PLAN TOP GRATIS
-- Fecha: 7 Enero 2026
-- Propósito: Control de tokens para dar plan TOP gratis
-- =====================================================

-- 1. Tabla de códigos de invitación/cortesía
CREATE TABLE IF NOT EXISTS plan_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    plan_tipo VARCHAR(20) NOT NULL DEFAULT 'top', -- 'top', 'destacado', 'premium'
    duracion_dias INTEGER NOT NULL DEFAULT 30,
    usado BOOLEAN DEFAULT FALSE,
    usado_por UUID REFERENCES auth.users(id),
    usado_en TIMESTAMP WITH TIME ZONE,
    creado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expira_en TIMESTAMP WITH TIME ZONE,
    notas TEXT,
    categoria_especifica VARCHAR(100), -- Ej: 'vehiculos', 'inmuebles', null = todos
    activo BOOLEAN DEFAULT TRUE
);

-- 2. Tabla de historial de cortesías aplicadas
CREATE TABLE IF NOT EXISTS cortesias_aplicadas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    anuncio_id UUID REFERENCES anuncios(id),
    plan_tipo VARCHAR(20) NOT NULL,
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    token_usado UUID REFERENCES plan_tokens(id),
    asignado_por UUID REFERENCES auth.users(id), -- admin que lo asignó
    metodo VARCHAR(20) NOT NULL, -- 'codigo' o 'manual'
    notas TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Índices para performance
CREATE INDEX idx_plan_tokens_codigo ON plan_tokens(codigo);
CREATE INDEX idx_plan_tokens_usado ON plan_tokens(usado);
CREATE INDEX idx_cortesias_user_id ON cortesias_aplicadas(user_id);
CREATE INDEX idx_cortesias_activo ON cortesias_aplicadas(activo);

-- 4. RLS (Row Level Security) - Solo admins pueden ver todo
ALTER TABLE plan_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE cortesias_aplicadas ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver solo sus propios tokens usados
CREATE POLICY "Ver tokens propios" ON plan_tokens
    FOR SELECT USING (auth.uid() = usado_por);

-- Política: Usuarios pueden usar (update) tokens disponibles
CREATE POLICY "Usar tokens disponibles" ON plan_tokens
    FOR UPDATE USING (usado = FALSE AND activo = TRUE);

-- Política: Ver cortesías propias
CREATE POLICY "Ver cortesias propias" ON cortesias_aplicadas
    FOR SELECT USING (auth.uid() = user_id);

-- 5. Función para validar y aplicar token
CREATE OR REPLACE FUNCTION validar_y_aplicar_token(
    p_codigo VARCHAR(20),
    p_user_id UUID,
    p_anuncio_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token_id UUID;
    v_plan_tipo VARCHAR(20);
    v_duracion_dias INTEGER;
    v_fecha_fin TIMESTAMP WITH TIME ZONE;
    v_categoria VARCHAR(100);
BEGIN
    -- Buscar token
    SELECT id, plan_tipo, duracion_dias, categoria_especifica
    INTO v_token_id, v_plan_tipo, v_duracion_dias, v_categoria
    FROM plan_tokens
    WHERE codigo = p_codigo 
      AND usado = FALSE 
      AND activo = TRUE
      AND (expira_en IS NULL OR expira_en > NOW());
    
    -- Si no existe o ya fue usado
    IF v_token_id IS NULL THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Código inválido o ya usado'
        );
    END IF;
    
    -- Calcular fecha de fin
    v_fecha_fin := NOW() + (v_duracion_dias || ' days')::INTERVAL;
    
    -- Marcar token como usado
    UPDATE plan_tokens
    SET usado = TRUE,
        usado_por = p_user_id,
        usado_en = NOW()
    WHERE id = v_token_id;
    
    -- Registrar cortesía aplicada
    INSERT INTO cortesias_aplicadas (
        user_id, anuncio_id, plan_tipo, fecha_fin, 
        token_usado, metodo, activo
    ) VALUES (
        p_user_id, p_anuncio_id, v_plan_tipo, v_fecha_fin,
        v_token_id, 'codigo', TRUE
    );
    
    -- Retornar éxito
    RETURN json_build_object(
        'success', TRUE,
        'plan', v_plan_tipo,
        'dias', v_duracion_dias,
        'fecha_fin', v_fecha_fin
    );
END;
$$;

-- 6. Función para generar código único
CREATE OR REPLACE FUNCTION generar_codigo_token()
RETURNS VARCHAR(20)
LANGUAGE plpgsql
AS $$
DECLARE
    v_codigo VARCHAR(20);
    v_existe BOOLEAN;
BEGIN
    LOOP
        -- Generar código: TOP-XXX-YYYY (TOP-VEH-A1B2)
        v_codigo := 'TOP-' || 
                    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 3)) || '-' ||
                    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
        
        -- Verificar si ya existe
        SELECT EXISTS(SELECT 1 FROM plan_tokens WHERE codigo = v_codigo) INTO v_existe;
        
        EXIT WHEN NOT v_existe;
    END LOOP;
    
    RETURN v_codigo;
END;
$$;

-- 7. Vista para admins - Resumen de tokens
CREATE OR REPLACE VIEW vista_admin_tokens AS
SELECT 
    pt.id,
    pt.codigo,
    pt.plan_tipo,
    pt.duracion_dias,
    pt.usado,
    pt.categoria_especifica,
    pt.created_at,
    pt.expira_en,
    pt.notas,
    pt.activo,
    p.email as usado_por_email,
    pt.usado_en,
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
    ca.id,
    p.email,
    p.nombre_negocio,
    ca.plan_tipo,
    ca.fecha_inicio,
    ca.fecha_fin,
    ca.metodo,
    ca.notas,
    ca.activo,
    CASE 
        WHEN ca.fecha_fin < NOW() THEN 'Expirado'
        WHEN ca.activo = FALSE THEN 'Inactivo'
        ELSE 'Activo'
    END as estado,
    DATE_PART('day', ca.fecha_fin - NOW()) as dias_restantes
FROM cortesias_aplicadas ca
JOIN profiles p ON ca.user_id = p.id
ORDER BY ca.fecha_inicio DESC;

-- 9. Insertar algunos códigos de ejemplo para pruebas
INSERT INTO plan_tokens (codigo, plan_tipo, duracion_dias, categoria_especifica, notas, activo)
VALUES 
    ('TOP-VEH-2026', 'top', 30, 'vehiculos', 'Lanzamiento - Vendedores vehículos', TRUE),
    ('TOP-INM-2026', 'top', 30, 'inmuebles', 'Lanzamiento - Vendedores inmuebles', TRUE),
    ('DEST-GRAL-01', 'destacado', 15, NULL, 'Promoción general 15 días', TRUE);

COMMENT ON TABLE plan_tokens IS 'Códigos de invitación para planes gratis';
COMMENT ON TABLE cortesias_aplicadas IS 'Historial de cortesías/tokens aplicados a usuarios';
COMMENT ON FUNCTION validar_y_aplicar_token IS 'Valida código y asigna plan gratis al usuario';
