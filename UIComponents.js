import { APP_CONFIG } from './AppConfig.js';

export const UIComponents = {
    /**
     * Genera el HTML de una tarjeta unificada
     */
    generateCardHTML(ad) {
        const attributes = this.renderAttributes(ad);
        const precioFormateado = ad.precio ? Number(ad.precio).toLocaleString('en-US') : '0.00';
        const imagenPortada = ad.url_portada || 'img/placeholder.jpg';
        const planClass = ad.featured_plan ? `card-${ad.featured_plan}` : 'card-free';
        
        // Badge según el plan
        const badgeHTML = ad.featured_plan === 'top' ? '<span class="badge-top">TOP</span>' : 
                          ad.featured_plan === 'destacado' ? '<span class="badge-destacado">Destacado</span>' :
                          ad.featured_plan === 'premium' ? '<span class="badge-premium">Premium</span>' : '';

        return `
            <div class="property-card ${planClass}" data-id="${ad.id}">
                <div class="property-image">
                    ${badgeHTML}
                    <img src="${imagenPortada}" alt="${ad.titulo || 'Anuncio'}" loading="lazy">
                </div>
                <div class="property-details">
                    <div class="property-price">${precioFormateado}</div>
                    <h3 class="property-title">${ad.titulo || 'Sin título'}</h3>
                    <div class="property-location">
                        <i class="fas fa-map-marker-alt"></i> 
                        ${ad.corregimiento ? ad.corregimiento + ', ' : ''}${ad.distrito || ''}, ${ad.provincia || ''}
                    </div>
                    <div class="property-attributes">
                        ${attributes}
                    </div>
                    <a href="detalle-producto.html?id=${ad.id}" class="btn-contact-card">Contactar</a>
                </div>
            </div>
        `;
    },

    /**
     * Versión para la cuadrícula de resultados
     */
    generateCompactCardHTML(ad) {
        return this.generateCardHTML(ad);
    },

    /**
     * Renderiza atributos con iconos basado en la categoría
     * Versión unificada que reemplaza generateAttributesHTML de utils-attributes.js
     * @param {Object} ad - Objeto del anuncio con atributos_clave y categoria
     * @returns {String} HTML con iconos y atributos
     */
    renderAttributes(ad) {
        const attributes = ad.atributos_clave || {};
        const category = ad.categoria || '';
        const categoria = category.toLowerCase();
        const subcategory = ad.subcategoria || attributes.subcategoria || '';
        let detailsHTML = '';

        // --- DETALLES DE VEHÍCULOS (desde JSONB) ---
        if (categoria.includes('vehículo') || categoria.includes('auto') || categoria.includes('carro') || categoria.includes('moto')) {
            let details = [];
            if (attributes.anio) details.push(`<span><i class="fas fa-calendar-alt"></i> ${attributes.anio}</span>`);
            if (attributes.combustible) details.push(`<span><i class="fas fa-gas-pump"></i> ${attributes.combustible}</span>`);
            if (attributes.kilometraje) details.push(`<span><i class="fas fa-tachometer-alt"></i> ${attributes.kilometraje.toLocaleString()} km</span>`);
            if (details.length > 0) {
                detailsHTML += `<div class="vehicle-details">${details.join('')}</div>`;
            }
        }
        
        // --- DETALLES DE INMUEBLES (desde JSONB) ---
        if (categoria.includes('inmueble') || categoria.includes('casa') || categoria.includes('apartamento') || categoria.includes('propiedad')) {
            let details = [];
            if (attributes.m2) details.push(`<span><i class="fas fa-ruler-combined"></i> ${attributes.m2} m²</span>`);
            if (attributes.habitaciones) details.push(`<span><i class="fas fa-bed"></i> ${attributes.habitaciones} hab</span>`);
            if (attributes.baños || attributes.banos) details.push(`<span><i class="fas fa-bath"></i> ${(attributes.baños || attributes.banos)} baños</span>`);
            if (details.length > 0) {
                detailsHTML += `<div class="real-estate-details">${details.join('')}</div>`;
            }
        }

        // --- ELECTRÓNICA (Iconos más tecnológicos y precisos) ---
        const electronicsSubcats = ["celulares y teléfonos", "computadoras", "consolas y videojuegos", "audio y video", "fotografía", "electrónica"];
        if (electronicsSubcats.some(subcat => categoria.includes(subcat))) {
            let details = [];

            if (attributes.marca) details.push(`<span><i class="fas fa-cube"></i> ${attributes.marca}</span>`); // Cubo 3D en lugar de etiqueta
            if (attributes.modelo) details.push(`<span><i class="fas fa-laptop-code"></i> ${attributes.modelo}</span>`); // Laptop moderna
            if (attributes.almacenamiento) details.push(`<span><i class="fas fa-database"></i> ${attributes.almacenamiento} GB</span>`); // Base de datos (más pro)
            if (attributes.memoria_ram) details.push(`<span><i class="fas fa-memory"></i> ${attributes.memoria_ram} GB RAM</span>`); // Chip de memoria real
            if (attributes.procesador) details.push(`<span><i class="fas fa-microchip"></i> ${attributes.procesador}</span>`);
            if (attributes.condicion) details.push(`<span><i class="fas fa-award"></i> ${attributes.condicion}</span>`); // Medalla/Premio en lugar de estrella

            if (details.length > 0) {
                detailsHTML += `<div class="electronics-details">${details.slice(0, 3).join('')}</div>`;
            }
        }

        // --- HOGAR Y MUEBLES ---
        const homeFurnitureSubcats = ["Artículos de Cocina", "Decoración", "Electrodomésticos", "Jardín y Exterior", "Muebles"];
        if (attributes.subcategoria && homeFurnitureSubcats.includes(attributes.subcategoria)) {
            let details = [];
            if (attributes.tipo_electrodomestico) {
                const electroIcon = {
                    'Refrigerador': 'fas fa-snowflake',
                    'Lavadora': 'fas fa-tint',
                    'Microondas': 'fas fa-fire',
                    'Estufa': 'fas fa-fire-alt',
                    'Licuadora': 'fas fa-blender',
                    'Aspiradora': 'fas fa-wind'
                };
                const icon = electroIcon[attributes.tipo_electrodomestico] || 'fas fa-plug';
                details.push(`<span><i class="${icon}"></i> ${attributes.tipo_electrodomestico}</span>`);
            }
            if (attributes.tipo_mueble) details.push(`<span><i class="fas fa-couch"></i> ${attributes.tipo_mueble}</span>`);
            if (attributes.tipo_articulo) details.push(`<span><i class="fas fa-couch"></i> ${attributes.tipo_articulo}</span>`);
            if (attributes.tipo_decoracion) details.push(`<span><i class="fas fa-paint-brush"></i> ${attributes.tipo_decoracion}</span>`);
            if (attributes.material) details.push(`<span><i class="fas fa-cube"></i> ${attributes.material}</span>`);
            if (attributes.marca) details.push(`<span><i class="fas fa-tag"></i> ${attributes.marca}</span>`);
            if (attributes.color) details.push(`<span><i class="fas fa-palette"></i> ${attributes.color}</span>`);
            if (attributes.condicion) details.push(`<span><i class="fas fa-check-circle"></i> ${attributes.condicion}</span>`);
            if (details.length > 0) {
                detailsHTML += `<div class="home-furniture-details">${details.slice(0, 3).join('')}</div>`;
            }
        }

        // --- MODA Y BELLEZA (Iconos de estilo) ---
        if (categoria.includes('moda') || categoria.includes('belleza') || categoria.includes('ropa')) {
            let details = [];
            
            if (attributes.marca) details.push(`<span><i class="fas fa-tag"></i> ${attributes.marca}</span>`); // Etiqueta de marca
            if (attributes.talla) details.push(`<span><i class="fas fa-tshirt"></i> Talla: ${attributes.talla}</span>`); // Prenda de ropa
            if (attributes.color) details.push(`<span><i class="fas fa-palette"></i> ${attributes.color}</span>`); // Paleta de colores
            if (attributes.condicion) details.push(`<span><i class="fas fa-gem"></i> ${attributes.condicion}</span>`); // Diamante de calidad
            if (attributes.edad) details.push(`<span><i class="fas fa-child"></i> Edad: ${attributes.edad}</span>`); // Para ropa de niños
            
            if (details.length > 0) {
                detailsHTML += `<div class="fashion-details">${details.slice(0, 3).join('')}</div>`;
            }
        }

        // --- DEPORTES Y HOBBIES ---
        const sportsSubcats = ["Bicicletas", "Coleccionables", "Deportes", "Instrumentos Musicales", "Libros, Revistas y Comics", "Otros Hobbies"];
        if (attributes.subcategoria && sportsSubcats.includes(attributes.subcategoria)) {
            let details = [];
            if (attributes.tipo_bicicleta) details.push(`<span><i class="fas fa-bicycle"></i> ${attributes.tipo_bicicleta}</span>`);
            if (attributes.tipo_instrumento) details.push(`<span><i class="fas fa-music"></i> ${attributes.tipo_instrumento}</span>`);
            if (attributes.tipo_articulo) details.push(`<span><i class="fas fa-trophy"></i> ${attributes.tipo_articulo}</span>`);
            if (attributes.marca) details.push(`<span><i class="fas fa-tag"></i> ${attributes.marca}</span>`);
            if (attributes.aro) details.push(`<span><i class="fas fa-circle-notch"></i> Aro ${attributes.aro}</span>`);
            if (attributes.condicion) details.push(`<span><i class="fas fa-star"></i> ${attributes.condicion}</span>`);
            if (details.length > 0) {
                detailsHTML += `<div class="sports-details">${details.slice(0, 3).join('')}</div>`;
            }
        }

        // --- MASCOTAS (Iconos dinámicos y amigables) ---
        if (categoria.includes('mascota') || categoria.includes('animales')) {
            let details = [];
            
            // Magia: Cambiamos el icono principal dependiendo de si es perro, gato o ave
            let iconMascota = '<i class="fas fa-paw"></i>'; // Huella por defecto
            if (subcategory) {
                const sub = subcategory.toLowerCase();
                if (sub.includes('perro')) iconMascota = '<i class="fas fa-dog"></i>';
                else if (sub.includes('gato')) iconMascota = '<i class="fas fa-cat"></i>';
                else if (sub.includes('ave') || sub.includes('pájaro')) iconMascota = '<i class="fas fa-dove"></i>';
                else if (sub.includes('pez') || sub.includes('peces')) iconMascota = '<i class="fas fa-fish"></i>';
            }

            if (attributes.raza) details.push(`<span>${iconMascota} ${attributes.raza}</span>`);
            if (attributes.genero) details.push(`<span><i class="fas fa-venus-mars"></i> ${attributes.genero}</span>`); // Símbolo de género
            
            // Validamos si la edad ya trae texto para no duplicar la palabra "años"
            if (attributes.edad_mascota) {
                const edad = attributes.edad_mascota;
                const textoEdad = isNaN(edad) ? edad : `${edad} años`;
                details.push(`<span><i class="fas fa-birthday-cake"></i> ${textoEdad}</span>`); 
            }
            
            if (attributes.tipo_anuncio) details.push(`<span><i class="fas fa-bullhorn"></i> ${attributes.tipo_anuncio}</span>`);

            if (details.length > 0) {
                detailsHTML += `<div class="pets-details">${details.slice(0, 3).join('')}</div>`;
            }
        }

        // --- SERVICIOS ---
        const servicesSubcats = ["Servicios de Construcción", "Servicios de Educación", "Servicios de Eventos", "Servicios de Salud", "Servicios de Tecnología", "Servicios para el Hogar", "Otros Servicios"];
        if (attributes.subcategoria && servicesSubcats.includes(attributes.subcategoria)) {
            let details = [];
            if (attributes.tipo_servicio) details.push(`<span><i class="fas fa-wrench"></i> ${attributes.tipo_servicio}</span>`);
            if (attributes.modalidad) details.push(`<span><i class="fas fa-location-arrow"></i> ${attributes.modalidad}</span>`);
            if (attributes.experiencia) details.push(`<span><i class="fas fa-award"></i> ${attributes.experiencia}</span>`);
            if (details.length > 0) {
                detailsHTML += `<div class="services-details">${details.slice(0, 3).join('')}</div>`;
            }
        }

        // --- NEGOCIOS (Iconos corporativos y serios) ---
        const businessSubcats = ["Equipos para Negocios", "Maquinaria para Negocios", "Negocios en Venta"];
        if (attributes.subcategoria && businessSubcats.includes(attributes.subcategoria)) {
            let details = [];
            
            if (attributes.tipo_negocio) details.push(`<span><i class="fas fa-building"></i> ${attributes.tipo_negocio}</span>`); // Edificio corporativo
            if (attributes.razon_venta) details.push(`<span><i class="fas fa-handshake"></i> ${attributes.razon_venta}</span>`); // Apretón de manos
            if (attributes.condicion) details.push(`<span><i class="fas fa-gem"></i> ${attributes.condicion}</span>`); // Diamante (Calidad/Condición)
            
            if (details.length > 0) {
                detailsHTML += `<div class="business-details">${details.slice(0, 3).join('')}</div>`;
            }
        }

        // --- COMUNIDAD, CLASES Y EVENTOS (Iconos dinámicos) ---
        const communitySubcats = ["Clases y Cursos", "Eventos", "Otros"];
        if (attributes.subcategoria && communitySubcats.includes(attributes.subcategoria)) {
            let details = [];
            
            if (attributes.tipo_evento) details.push(`<span><i class="fas fa-ticket-alt"></i> ${attributes.tipo_evento}</span>`); // Ticket de entrada
            if (attributes.tipo_actividad) details.push(`<span><i class="fas fa-user-friends"></i> ${attributes.tipo_actividad}</span>`); // Grupo de personas
            if (attributes.tipo_clase) details.push(`<span><i class="fas fa-book-reader"></i> ${attributes.tipo_clase}</span>`); // Persona leyendo
            if (attributes.nivel) details.push(`<span><i class="fas fa-layer-group"></i> ${attributes.nivel}</span>`); // Capas/Niveles
            if (attributes.modalidad) details.push(`<span><i class="fas fa-globe"></i> ${attributes.modalidad}</span>`); // Globo terráqueo (Online/Global)
            if (attributes.fecha_evento) details.push(`<span><i class="far fa-calendar-check"></i> ${attributes.fecha_evento}</span>`); // Calendario con check
            
            if (details.length > 0) {
                detailsHTML += `<div class="community-details">${details.slice(0, 3).join('')}</div>`;
            }
        }

        // Si hay atributos pero no coincidieron con ninguna categoría, devolvemos vacío
        if (detailsHTML === '') {
            return '';
        }

        return detailsHTML;
    },

    /**
     * Método fallback que usa APP_CONFIG para renderizar atributos genéricos
     */
    _renderAttributesFallback(ad) {
        const categoryMap = { 
            'Vehículos': 1, 'Vehiculos': 1, 'Autos': 1, 'Auto': 1, 'Carros': 1, 'Carro': 1, 
            'Motos': 1, 'Moto': 1, 'Motocicleta': 1, 'Motocicleta': 1,
            'Inmuebles': 2, 'Bienes Raíces': 2, 'Bienes Raices': 2, 'Casas': 2, 'Casa': 2, 
            'Apartamentos': 2, 'Apartamento': 2, 'Propiedad': 2, 'Propiedades': 2,
            'Electrónica': 3, 'Electronica': 3, 'Tecnología': 3, 'Tecnologia': 3,
            'Hogar y Muebles': 4, 'Hogar': 4, 'Muebles': 4, 'Mueble': 4
        };

        const catId = categoryMap[ad.categoria] || ad.category_id || 0;
        const fields = APP_CONFIG.CATEGORY_ATTRIBUTES[catId] || APP_CONFIG.CATEGORY_ATTRIBUTES.default;
        
        const attrs = ad.atributos_clave || {};
        
        const iconMap = {
            'habitaciones': 'fa-bed', 'recamaras': 'fa-bed', 'rooms': 'fa-bed',
            'banos': 'fa-bath', 'baños': 'fa-bath', 'toilettes': 'fa-bath',
            'm2': 'fa-ruler-combined', 'superficie': 'fa-ruler-combined',
            'km': 'fa-tachometer-alt', 'kilometraje': 'fa-tachometer-alt',
            'transmision': 'fa-cog',
            'combustible': 'fa-gas-pump',
            'condicion': 'fa-info-circle'
        };

        const fieldSynonyms = {
            'habitaciones': ['habitaciones', 'recamaras', 'rooms'],
            'banos': ['banos', 'baños', 'toilettes'],
            'm2': ['m2', 'superficie', 'area'],
            'km': ['km', 'kilometraje'],
            'transmision': ['transmision'],
            'combustible': ['combustible'],
            'condicion': ['condicion']
        };

        let html = '';
        
        fields.forEach(field => {
            const synonyms = fieldSynonyms[field] || [field];
            let value = null;
            
            for (const synonym of synonyms) {
                if (attrs[synonym] !== undefined && attrs[synonym] !== null && attrs[synonym] !== '0' && attrs[synonym] !== 0 && attrs[synonym] !== 'N/A') {
                    value = attrs[synonym];
                    break;
                }
            }
            
            if (value) {
                const icon = iconMap[field] || iconMap[synonyms.find(s => iconMap[s])] || 'fa-check';
                const displayValue = value.toString().length > 15 ? value.toString().substring(0, 12) + '...' : value;
                html += `<span><i class="fas ${icon}"></i> ${displayValue}</span>`;
            }
        });

        return html || '';
    }
};

/**
 * Alias para compatibilidad con código existente
 * Función que era exportada por utils-attributes.js
 */
export function generateAttributesHTML(attributes, category, subcategory) {
    // 1. SI NO HAY ATRIBUTOS, NO DEVOLVEMOS NADA (tarjeta limpia)
    if (!attributes || Object.keys(attributes).length === 0) {
        return '';
    }

    // Crear un objeto "ad" falso para usar el método unificado
    const ad = {
        atributos_clave: attributes,
        categoria: category,
        subcategoria: subcategory
    };
    return UIComponents.renderAttributes(ad);
}

// Compatibilidad global segura - solo asigna si no existe
if (typeof window !== 'undefined') {
    if (!window.UIComponents) {
        window.UIComponents = UIComponents;
    }
    if (!window.generateAttributesHTML) {
        window.generateAttributesHTML = generateAttributesHTML;
    }
}
