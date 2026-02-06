// Configuración de Stripe
export const STRIPE_PUBLIC_KEY = 'pk_test_your_key';

// Configuración de planes
export const STRIPE_PLANS = {
    basico: {
        price_id: 'price_basic_test',
        amount: 5.00,
        name: 'Plan Básico',
        features: [
            'Hasta 5 fotos',
            'Destaca sobre anuncios gratis',
            'Acceso a 2000+ compradores',
            'Reposicionamiento diario'
        ]
    },
    premium: {
        price_id: 'price_premium_test',
        amount: 10.00,
        name: 'Plan Premium',
        features: [
            'Hasta 10 fotos + carrusel',
            'Destacado en resultados',
            'Acceso a 5000+ compradores',
            'Estadísticas básicas',
            'Reposicionamiento cada 6 horas'
        ]
    },
    destacado: {
        price_id: 'price_destacado_test',
        amount: 20.00,
        name: 'Plan Destacado',
        features: [
            'Hasta 15 fotos + carrusel',
            'Posición premium en búsquedas',
            'Acceso a 10000+ compradores',
            'Estadísticas detalladas',
            'Reposicionamiento cada 3 horas',
            '1 video HD'
        ]
    },
    top: {
        price_id: 'price_top_test',
        amount: 25.00,
        name: 'Plan TOP',
        features: [
            'Hasta 20 fotos + 2 videos',
            'Posición top en todas búsquedas',
            'Acceso a 25000+ compradores',
            'Estadísticas en tiempo real',
            'Reposicionamiento cada hora',
            'Promoción en redes sociales',
            'Soporte prioritario 24/7'
        ]
    }
};