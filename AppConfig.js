// AppConfig.js - LA ÚNICA FUENTE DE VERDAD
export const APP_CONFIG = {
    PLAN_LIMITS: {
        'free': { 
            maxFotos: 5, 
            price: 0,
            label: 'Gratis',
            hasVideo: false,
            priority: 0 
        },
        'basico': { 
            maxFotos: 10, 
            price: 10,
            label: 'Básico',
            hasVideo: false,
            priority: 1 
        },
        'premium': { 
            maxFotos: 15, 
            price: 20,
            label: 'Premium',
            hasVideo: false,
            priority: 2 
        },
        'destacado': { 
            maxFotos: 20, 
            price: 30,
            label: 'Destacado',
            hasVideo: true,
            priority: 3 
        }
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
