-- =====================================================
-- CONFIGURACIÓN DE GEOLOCALIZACIÓN PARA ANUNCIOS
-- =====================================================
-- Este script agrega las columnas necesarias para guardar
-- coordenadas geográficas en la tabla de anuncios
-- =====================================================

-- OPCIÓN 1: Usando columnas numéricas simples (RECOMENDADO)
-- Agregar columnas para latitud y longitud
ALTER TABLE anuncios 
ADD COLUMN IF NOT EXISTS latitud DOUBLE PRECISION;

ALTER TABLE anuncios 
ADD COLUMN IF NOT EXISTS longitud DOUBLE PRECISION;

-- Agregar columna para almacenar la dirección exacta
ALTER TABLE anuncios 
ADD COLUMN IF NOT EXISTS direccion_exacta TEXT;

-- OPCIÓN 2: PostGIS (solo si tienes PostGIS habilitado)
-- ALTER TABLE anuncios 
-- ADD COLUMN IF NOT EXISTS location_point geography(POINT, 4326);

-- Crear índice para búsquedas por coordenadas
CREATE INDEX IF NOT EXISTS idx_anuncios_coordenadas 
ON anuncios (latitud, longitud);

-- =====================================================
-- NOTAS PARA SUPABASE DASHBOARD:
-- =====================================================
-- Para ejecutar este script:
-- 1. Ve a SQL Editor en tu proyecto de Supabase
-- 2. Copia y pega este script
-- 3. Ejecuta el script
--
-- Para agregar manualmente desde Table Editor:
-- 1. Table Editor > selecciona tabla "anuncios"
-- 2. Agrega columna "latitud" tipo "double precision"
-- 3. Agrega columna "longitud" tipo "double precision"  
-- 4. Agrega columna "direccion_exacta" tipo "text"
-- =====================================================
