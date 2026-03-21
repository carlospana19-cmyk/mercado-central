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
    
    // ⭐ TOP 3 ATRIBUTOS PRIORITARIOS POR CATEGORÍA (para tarjetas index/results)
    // Usado por UIComponents.renderAttributes() - exactamente 3 por categoría
    CATEGORY_ATTRIBUTES: {
        // 1. Vehículos ⭐
        1: ['marca', 'anio', 'kilometraje'],
        
        // 2. Inmuebles ⭐  
        2: ['m2', 'habitaciones', 'banos'],
        
        // 3. Electrónica ⭐
        3: ['marca', 'modelo', 'almacenamiento'],
        
        // 4. Hogar y Muebles ⭐
        4: ['tipo_electrodomestico', 'tipo_mueble', 'marca'],
        
        // 5. Moda y Belleza ⭐
        5: ['talla', 'marca', 'color'],
        
        // 6. Deportes y Hobbies ⭐
        6: ['tipo_bicicleta', 'tipo_instrumento', 'marca'],
        
        // 7. Mascotas ⭐
        7: ['raza', 'edad_mascota', 'genero'],
        
        // 8. Servicios ⭐
        8: ['tipo_servicio', 'modalidad', 'experiencia'],
        
        // 9. Negocios ⭐
        9: ['tipo_negocio', 'razon_venta', 'condicion'],
        
        // 10. Comunidad ⭐ (SOLICITADO)
        10: ['tipo_evento', 'tipo_clase', 'modalidad'],
        
        // Fallback genérico
        default: ['marca', 'condicion', 'precio']
    }
};

// Exponer al objeto window para compatibilidad
if (typeof window !== 'undefined') {
    window.APP_CONFIG = APP_CONFIG;
    console.log('✅ AppConfig cargado con TOP 3 por categoría:', APP_CONFIG.CATEGORY_ATTRIBUTES);
}

