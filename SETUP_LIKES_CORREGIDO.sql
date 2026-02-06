-- SETUP_LIKES_CORREGIDO.sql - Sistema de Likes para Mercado Central

-- Eliminar funciones existentes primero
DROP FUNCTION IF EXISTS has_user_liked_anuncio(UUID, BIGINT);
DROP FUNCTION IF EXISTS get_anuncio_likes_count(BIGINT);
DROP FUNCTION IF EXISTS toggle_like(BIGINT, UUID);
DROP FUNCTION IF EXISTS toggle_like(UUID, BIGINT);

-- Crear tabla de likes si no existe
CREATE TABLE IF NOT EXISTS likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anuncio_id BIGINT NOT NULL REFERENCES anuncios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, anuncio_id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_likes_anuncio_id ON likes(anuncio_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_anuncio ON likes(user_id, anuncio_id);

-- Funcion para verificar si un usuario dio like
CREATE OR REPLACE FUNCTION has_user_liked_anuncio(user_uuid UUID, p_anuncio_id BIGINT)
RETURNS BOOLEAN AS
$BODY$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM likes
        WHERE user_id = user_uuid AND likes.anuncio_id = p_anuncio_id
    );
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcion para contar likes
CREATE OR REPLACE FUNCTION get_anuncio_likes_count(p_anuncio_id BIGINT)
RETURNS INTEGER AS
$BODY$
DECLARE
    likes_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO likes_count
    FROM likes
    WHERE likes.anuncio_id = p_anuncio_id;
    RETURN likes_count;
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcion para toggle like
CREATE OR REPLACE FUNCTION toggle_like(p_anuncio_id BIGINT, user_uuid UUID)
RETURNS JSON AS
$BODY$
DECLARE
    result JSON;
    liked BOOLEAN;
    likes_count INTEGER;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM likes
        WHERE user_id = user_uuid AND likes.anuncio_id = p_anuncio_id
    ) INTO liked;

    IF liked THEN
        DELETE FROM likes
        WHERE user_id = user_uuid AND likes.anuncio_id = p_anuncio_id;
        SELECT COUNT(*) INTO likes_count
        FROM likes
        WHERE likes.anuncio_id = p_anuncio_id;
        result := json_build_object('action', 'removed', 'liked', false, 'likes_count', likes_count);
    ELSE
        INSERT INTO likes (user_id, anuncio_id) VALUES (user_uuid, p_anuncio_id);
        SELECT COUNT(*) INTO likes_count
        FROM likes
        WHERE likes.anuncio_id = p_anuncio_id;
        result := json_build_object('action', 'added', 'liked', true, 'likes_count', likes_count);
    END IF;
    RETURN result;
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politicas RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own likes" ON likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public can view likes count" ON likes FOR SELECT USING (true);

-- Permisos
GRANT SELECT, INSERT, DELETE ON likes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
