// AppConfig.js - LA ÚNICA FUENTE DE VERDAD
export const APP_CONFIG = {
    PLAN_LIMITS: {
        'free': { maxFotos: 3, label: 'Básico (Gratis)' },
        'basico': { maxFotos: 5, label: 'Bronce' },
        'premium': { maxFotos: 10, label: 'Premium' },
        'destacado': { maxFotos: 15, label: 'Destacado' },
        'top': { maxFotos: 20, label: 'Top' }
    },
    // Define aquí qué atributos necesita cada categoría principal (ID de config-categories)
    CATEGORY_ATTRIBUTES: {
        1: ['km', 'transmision', 'combustible'], // Vehículos
        2: ['habitaciones', 'banos', 'm2'],              // Inmuebles
        default: ['condicion']
    }
};

// Exponer al objeto window para compatibilidad con módulos sin build tools
if (typeof window !== 'undefined') {
    window.APP_CONFIG = APP_CONFIG;
}
