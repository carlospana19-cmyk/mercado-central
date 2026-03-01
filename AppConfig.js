// AppConfig.js - LA ÚNICA FUENTE DE VERDAD
export const APP_CONFIG = {
    PLAN_LIMITS: {
        'free': { 
            maxFotos: 3, 
            label: 'Básico (Gratis)',
            hasVideo: false,
            priority: 0 
        },
        'basico': { 
            maxFotos: 5, 
            label: 'Bronce',
            hasVideo: false,
            priority: 1 
        },
        'premium': { 
            maxFotos: 10, 
            label: 'Premium',
            hasVideo: false,
            priority: 2 
        },
        'destacado': { 
            maxFotos: 15, 
            label: 'Destacado',
            hasVideo: false,
            priority: 3 
        },
        'top': { 
            maxFotos: 20, 
            label: 'Top',
            hasVideo: true,
            priority: 4 
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
