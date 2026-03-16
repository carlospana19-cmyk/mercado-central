-- Agregar columna para guardar el precio original cuando hay descuento
ALTER TABLE anuncios ADD COLUMN IF NOT EXISTS precio_original DECIMAL(12,2);

-- Esta columna guardará el precio anterior cuando el usuario baje el precio
-- Se usará para calcular el porcentaje de descuento en las tarjetas
