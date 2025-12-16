-- ============================================
-- SQL: AGREGAR COLUMNAS DE PERFIL A TABLA perfiles
-- ============================================
-- Ejecutar en Supabase SQL Editor

-- 1. VERIFICAR ESTRUCTURA ACTUAL
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'perfiles';

-- 2. AGREGAR COLUMNAS FALTANTES (si no existen)

ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS correo VARCHAR(255);
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS nombre_negocio VARCHAR(255);
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS tipo_negocio VARCHAR(100);
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS provincia VARCHAR(100);
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS distrito VARCHAR(100);
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS url_foto_perfil VARCHAR(500);
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS url_portada VARCHAR(500);
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS calificacion DECIMAL(3,1) DEFAULT 5.0;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS total_ventas INTEGER DEFAULT 0;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 3. COLUMNAS PRINCIPALES (son_nombre_completo)
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS nombre_completo VARCHAR(255);

-- ============================================
-- TABLA COMPLETA DE perfiles (REFERENCIA)
-- ============================================

-- CREATE TABLE public.perfiles (
--     id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
--     user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
--     nombre_completo VARCHAR(255),
--     correo VARCHAR(255),
--     telefono VARCHAR(20),
--     whatsapp VARCHAR(20),
--     nombre_negocio VARCHAR(255),
--     tipo_negocio VARCHAR(100),
--     descripcion TEXT,
--     provincia VARCHAR(100),
--     distrito VARCHAR(100),
--     direccion TEXT,
--     url_foto_perfil VARCHAR(500),
--     url_portada VARCHAR(500),
--     verificado BOOLEAN DEFAULT FALSE,
--     calificacion DECIMAL(3,1) DEFAULT 5.0,
--     total_ventas INTEGER DEFAULT 0,
--     fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- ============================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================

-- 1. PERMITIR A LOS USUARIOS VER SU PROPIO PERFIL
CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.perfiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- 2. PERMITIR A LOS USUARIOS ACTUALIZAR SU PROPIO PERFIL
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.perfiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. PERMITIR A LOS USUARIOS INSERTAR SU PERFIL
CREATE POLICY "Usuarios pueden crear su perfil" ON public.perfiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 4. PERMITIR QUE TODOS VEAN PERFILES PÚBLICOS (para búsquedas)
CREATE POLICY "Todos pueden ver perfiles verificados" ON public.perfiles
    FOR SELECT
    USING (verificado = TRUE);

-- ============================================
-- ÍNDICES PARA OPTIMIZAR BÚSQUEDAS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_perfiles_user_id ON public.perfiles(user_id);
CREATE INDEX IF NOT EXISTS idx_perfiles_nombre_negocio ON public.perfiles(nombre_negocio);
CREATE INDEX IF NOT EXISTS idx_perfiles_provincia ON public.perfiles(provincia);
CREATE INDEX IF NOT EXISTS idx_perfiles_verificado ON public.perfiles(verificado);

-- ============================================
-- TRIGGER PARA ACTUALIZAR fecha_actualizacion
-- ============================================

CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_fecha_actualizacion ON public.perfiles;

CREATE TRIGGER trigger_update_fecha_actualizacion
BEFORE UPDATE ON public.perfiles
FOR EACH ROW
EXECUTE FUNCTION update_fecha_actualizacion();

-- ============================================
-- VERIFICAR ESTRUCTURA FINAL
-- ============================================
-- SELECT * FROM information_schema.columns 
-- WHERE table_name = 'perfiles' 
-- ORDER BY ordinal_position;
