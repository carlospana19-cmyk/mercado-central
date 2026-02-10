-- ========================================
-- SETUP COMPLETO DE PLANES DE PAGO
-- ========================================

-- 1. AGREGAR CAMPOS FALTANTES A TABLA ANUNCIOS
-- ========================================
ALTER TABLE anuncios 
ADD COLUMN IF NOT EXISTS url_video VARCHAR(500),
ADD COLUMN IF NOT EXISTS publicar_redes BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS videos_count INTEGER DEFAULT 0;

-- 2. CREAR TABLA DE SUSCRIPCIONES
-- ========================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ad_id UUID REFERENCES anuncios(id) ON DELETE CASCADE,
    plan VARCHAR(20) CHECK (plan IN ('free', 'basico', 'premium', 'destacado', 'top')),
    payment_id VARCHAR(100),
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'expired')),
    stripe_session_id VARCHAR(200),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CREAR TABLA DE TRANSACCIONES
-- ========================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. POLÍTICAS RLS PARA SUSCRIPCIONES
-- ========================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propias suscripciones"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuarios autenticados pueden crear suscripciones"
    ON subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus suscripciones"
    ON subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- 5. POLÍTICAS RLS PARA TRANSACCIONES
-- ========================================
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propias transacciones"
    ON payment_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuarios autenticados pueden crear transacciones"
    ON payment_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 6. ÍNDICES PARA RENDIMIENTO
-- ========================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_ad_id ON subscriptions(ad_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_session ON payment_transactions(stripe_session_id);

-- 7. FUNCIÓN PARA ACTUALIZAR updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers si no existen
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. VERIFICAR QUE LOS CAMPOS EXISTEN
-- ========================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anuncios' AND column_name = 'url_video'
    ) THEN
        ALTER TABLE anuncios ADD COLUMN url_video VARCHAR(500);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'anuncios' AND column_name = 'publicar_redes'
    ) THEN
        ALTER TABLE anuncios ADD COLUMN publicar_redes BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- ========================================
-- VERIFICACIÓN
-- ========================================
SELECT 'Tabla subscriptions creada' AS status FROM information_schema.tables WHERE table_name = 'subscriptions';
SELECT 'Tabla payment_transactions creada' AS status FROM information_schema.tables WHERE table_name = 'payment_transactions';
SELECT 'Campo url_video verificado' AS status FROM information_schema.columns WHERE table_name = 'anuncios' AND column_name = 'url_video';
