-- SETUP_LIKES.sql - Sistema de Likes para Mercado Central
-- Crear tabla de likes y funciones relacionadas

-- =================================================
-- TABLA DE LIKES
-- =================================================

CREATE TABLE IF NOT EXISTS likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anuncio_id BIGINT NOT NULL REFERENCES anuncios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Un usuario solo puede dar like una vez por anuncio
    UNIQUE(user_id, anuncio_id)
);

-- =================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =================================================

-- Índice para consultas rápidas por anuncio
CREATE INDEX IF NOT EXISTS idx_likes_anuncio_id ON likes(anuncio_id);

-- Índice para consultas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- Índice compuesto para optimizar consultas de likes por usuario y anuncio
CREATE INDEX IF NOT EXISTS idx_likes_user_anuncio ON likes(user_id, anuncio_id);

-- =================================================
-- FUNCIONES PARA GESTIÓN DE LIKES
-- =================================================

-- Función para verificar si un usuario dio like a un anuncio
CREATE OR REPLACE FUNCTION has_user_liked_anuncio(user_uuid UUID, p_anuncio_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM likes
        WHERE user_id = user_uuid AND likes.anuncio_id = p_anuncio_id
    );
END;
$;

-- Función para contar likes de un anuncio
CREATE OR REPLACE FUNCTION get_anuncio_likes_count(p_anuncio_id BIGINT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
    likes_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO likes_count
    FROM likes
    WHERE likes.anuncio_id = p_anuncio_id;

    RETURN likes_count;
END;
$;

-- Función para dar/quitar like (toggle)
CREATE OR REPLACE FUNCTION toggle_like(user_uuid UUID, p_anuncio_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
    result JSON;
    liked BOOLEAN;
    likes_count INTEGER;
BEGIN
    -- Verificar si ya existe el like
    SELECT EXISTS(
        SELECT 1 FROM likes
        WHERE user_id = user_uuid AND likes.anuncio_id = p_anuncio_id
    ) INTO liked;

    IF liked THEN
        -- Quitar like
        DELETE FROM likes
        WHERE user_id = user_uuid AND likes.anuncio_id = p_anuncio_id;

        -- Contar likes restantes
        SELECT COUNT(*) INTO likes_count
        FROM likes
        WHERE likes.anuncio_id = p_anuncio_id;

        result := json_build_object(
            'action', 'removed',
            'liked', false,
            'likes_count', likes_count
        );
    ELSE
        -- Agregar like
        INSERT INTO likes (user_id, anuncio_id)
        VALUES (user_uuid, p_anuncio_id);

        -- Contar likes totales
        SELECT COUNT(*) INTO likes_count
        FROM likes
        WHERE likes.anuncio_id = p_anuncio_id;

        result := json_build_object(
            'action', 'added',
            'liked', true,
            'likes_count', likes_count
        );
    END IF;

    RETURN result;
END;
$;

-- =================================================
-- POLÍTICAS RLS (Row Level Security)
-- =================================================

-- Habilitar RLS en la tabla likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver sus propios likes
CREATE POLICY "Users can view their own likes" ON likes
    FOR SELECT USING (auth.uid() = user_id);

-- Política para que los usuarios puedan insertar sus propios likes
CREATE POLICY "Users can insert their own likes" ON likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios puedan eliminar sus propios likes
CREATE POLICY "Users can delete their own likes" ON likes
    FOR DELETE USING (auth.uid() = user_id);

-- Política para que todos puedan ver el conteo de likes (para mostrar en tarjetas)
-- Esta política permite SELECT para funciones que cuentan likes
CREATE POLICY "Public can view likes count" ON likes
    FOR SELECT USING (true);

-- =================================================
-- PERMISOS
-- =================================================

-- Otorgar permisos a authenticated users
GRANT SELECT, INSERT, DELETE ON likes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- =================================================
-- DATOS DE PRUEBA (opcional)
-- =================================================

-- Insertar algunos likes de prueba (descomentar si se necesitan)
-- INSERT INTO likes (user_id, anuncio_id) VALUES
-- ('user-uuid-1', 'anuncio-uuid-1'),
-- ('user-uuid-2', 'anuncio-uuid-1'),
-- ('user-uuid-3', 'anuncio-uuid-2');

-- =================================================
-- COMENTARIOS FINALES
-- =================================================

COMMENT ON TABLE likes IS 'Tabla que almacena los likes de usuarios a anuncios';
COMMENT ON COLUMN likes.user_id IS 'ID del usuario que dio like';
COMMENT ON COLUMN likes.anuncio_id IS 'ID del anuncio que recibió like';
COMMENT ON FUNCTION has_user_liked_anuncio(UUID, BIGINT) IS 'Verifica si un usuario dio like a un anuncio específico';
COMMENT ON FUNCTION get_anuncio_likes_count(BIGINT) IS 'Retorna el número total de likes de un anuncio';
COMMENT ON FUNCTION toggle_like(UUID, BIGINT) IS 'Agrega o quita un like, retornando el estado actualizado';