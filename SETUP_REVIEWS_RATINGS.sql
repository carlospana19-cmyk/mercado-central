-- =================================================
-- SISTEMA DE RESEÑAS Y CALIFICACIONES
-- Mercado Central
-- =================================================

-- =================================================
-- 1. TABLA PRINCIPAL DE RESEÑAS
-- =================================================

CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Un usuario solo puede dejar una reseña por vendedor
    UNIQUE(reviewer_id, seller_id),

    -- El reviewer no puede reseñarse a sí mismo
    CONSTRAINT no_self_review CHECK (reviewer_id != seller_id)
);

-- =================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =================================================

-- Índice para buscar reseñas por vendedor (más común)
CREATE INDEX IF NOT EXISTS idx_reviews_seller_id ON reviews(seller_id);

-- Índice para buscar reseñas por reviewer
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);

-- Índice compuesto para ordenar por fecha
CREATE INDEX IF NOT EXISTS idx_reviews_seller_created ON reviews(seller_id, created_at DESC);

-- Índice para rating (útil para estadísticas)
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- =================================================
-- 3. POLÍTICAS DE SEGURIDAD (RLS)
-- =================================================

-- Habilitar RLS en la tabla
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver todas las reseñas (lectura pública)
CREATE POLICY "Reviews are viewable by everyone" ON reviews
    FOR SELECT USING (true);

-- Política: Solo usuarios autenticados pueden crear reseñas
CREATE POLICY "Authenticated users can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Política: Solo el autor puede actualizar su reseña
CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = reviewer_id);

-- Política: Solo el autor puede eliminar su reseña
CREATE POLICY "Users can delete their own reviews" ON reviews
    FOR DELETE USING (auth.uid() = reviewer_id);

-- =================================================
-- 4. FUNCIONES ÚTILES
-- =================================================

-- Función para obtener estadísticas de reseñas de un vendedor
CREATE OR REPLACE FUNCTION get_seller_review_stats(seller_uuid UUID)
RETURNS TABLE(
    total_reviews BIGINT,
    average_rating NUMERIC,
    rating_5_stars BIGINT,
    rating_4_stars BIGINT,
    rating_3_stars BIGINT,
    rating_2_stars BIGINT,
    rating_1_star BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_reviews,
        ROUND(AVG(rating)::numeric, 1) as average_rating,
        COUNT(*) FILTER (WHERE rating = 5) as rating_5_stars,
        COUNT(*) FILTER (WHERE rating = 4) as rating_4_stars,
        COUNT(*) FILTER (WHERE rating = 3) as rating_3_stars,
        COUNT(*) FILTER (WHERE rating = 2) as rating_2_stars,
        COUNT(*) FILTER (WHERE rating = 1) as rating_1_star
    FROM reviews
    WHERE seller_id = seller_uuid;
END;
$$;

-- Función para verificar si un usuario ya reseñó a un vendedor
CREATE OR REPLACE FUNCTION has_user_reviewed_seller(reviewer_uuid UUID, seller_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM reviews
        WHERE reviewer_id = reviewer_uuid AND seller_id = seller_uuid
    );
END;
$$;

-- =================================================
-- 5. TRIGGER PARA UPDATED_AT
-- =================================================

CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- =================================================
-- 6. DATOS DE EJEMPLO (OPCIONAL)
-- =================================================

-- Nota: Solo ejecutar si quieres datos de ejemplo
-- Comenta estas líneas si no las necesitas

/*
-- Obtener algunos IDs de usuarios existentes para ejemplo
-- (Reemplaza estos UUIDs con IDs reales de tu base de datos)

-- Ejemplo de reseñas (descomenta y ajusta los UUIDs)
/*
INSERT INTO reviews (reviewer_id, seller_id, rating, comment) VALUES
('user-uuid-1', 'seller-uuid-1', 5, 'Excelente vendedor, muy confiable y rápido en las entregas.'),
('user-uuid-2', 'seller-uuid-1', 4, 'Buen producto, llegó en perfectas condiciones.'),
('user-uuid-3', 'seller-uuid-2', 5, 'Increíble atención al cliente, lo recomiendo totalmente.'),
('user-uuid-4', 'seller-uuid-2', 3, 'Producto bueno pero tardó un poco en llegar.'),
('user-uuid-5', 'seller-uuid-3', 4, 'Vendedor serio y responsable.');
*/
*/

-- =================================================
-- 7. VISTAS PARA ADMINISTRACIÓN (OPCIONAL)
-- =================================================

-- Vista para admins: reseñas con información de usuarios
CREATE OR REPLACE VIEW admin_reviews AS
SELECT
    r.id,
    r.rating,
    r.comment,
    r.created_at,
    r.updated_at,
    reviewer.nombre_negocio as reviewer_name,
    reviewer.email as reviewer_email,
    seller.nombre_negocio as seller_name,
    seller.email as seller_email
FROM reviews r
JOIN profiles reviewer ON r.reviewer_id = reviewer.id
JOIN profiles seller ON r.seller_id = seller.id
ORDER BY r.created_at DESC;

-- Otorgar permisos de lectura a admins (si tienes rol de admin)
-- GRANT SELECT ON admin_reviews TO authenticated;
-- Nota: Ajusta según tu sistema de roles

-- =================================================
-- 8. CONSULTAS ÚTILES PARA TESTING
-- =================================================

-- Ver todas las reseñas
-- SELECT * FROM reviews ORDER BY created_at DESC;

-- Ver estadísticas de un vendedor
-- SELECT * FROM get_seller_review_stats('seller-uuid');

-- Ver si un usuario ya reseñó a un vendedor
-- SELECT has_user_reviewed_seller('reviewer-uuid', 'seller-uuid');

-- Ver reseñas de un vendedor con info de reviewer
-- SELECT r.*, p.nombre_negocio, p.url_foto_perfil
-- FROM reviews r
-- JOIN profiles p ON r.reviewer_id = p.id
-- WHERE r.seller_id = 'seller-uuid'
-- ORDER BY r.created_at DESC;

-- =================================================
-- FIN DEL SETUP
-- =================================================

-- Instrucciones de uso:
-- 1. Copia todo este contenido
-- 2. Pégalo en el SQL Editor de Supabase
-- 3. Ejecuta la consulta
-- 4. Verifica que las tablas se crearon correctamente
-- 5. Opcional: Descomenta y ejecuta los INSERTs de ejemplo