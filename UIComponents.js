import { APP_CONFIG } from './AppConfig.js';

export const UIComponents = {
    /**
     * Genera el HTML de una tarjeta unificada
     */
    // 4. GENERADOR DE HTML PARA LA TARJETA COMPLETA (UNIFICADO Y CORREGIDO)
    generateCardHTML: function(ad) {
        const attributes = this.renderAttributes(ad);
        const precioFormateado = ad.precio ? Number(ad.precio).toLocaleString('en-US') : '0.00';
        
        // 1. Fallback estricto de imagen
        let imagenPortada = 'https://via.placeholder.com/500x400?text=Sin+Imagen';
        if (ad.imagen_portada && ad.imagen_portada.trim() !== '') {
            imagenPortada = ad.imagen_portada;
        } else if (ad.url_portada && ad.url_portada.trim() !== '') {
            imagenPortada = ad.url_portada;
        } else if (Array.isArray(ad.url_galeria) && ad.url_galeria.length > 0) {
            imagenPortada = ad.url_galeria[0];
        } else if (typeof ad.url_galeria === 'string' && ad.url_galeria.trim() !== '') {
            imagenPortada = ad.url_galeria;
        }

        // 2. MAGIA DEL TIEMPO (LECTOR INTELIGENTE DE BADGES)
        let badgeHTML = '';
        if (ad.featured_until) {
            const ahora = new Date();
            const finDestacado = new Date(ad.featured_until);
            
            if (ahora < finDestacado) {
                const nombrePlan = ad.plan || ad.selected_plan || ad.featured_plan || 'Destacado';
                if (nombrePlan.toLowerCase() !== 'free' && nombrePlan.toLowerCase() !== 'gratis') {
                    badgeHTML = `
                        <div class="badge-plan" style="position: absolute; top: 10px; left: 10px; background: #FFD700; color: #333; padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 0.75rem; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.2); text-transform: uppercase; letter-spacing: 1px;">
                            <i class="fas fa-star" style="margin-right: 4px;"></i> ${nombrePlan}
                        </div>`;
                }
            }
        }

        // 3. Ensamblaje de la Tarjeta
        return `
            <div class="property-card" data-id="${ad.id}" style="position: relative; border-radius: 12px; overflow: hidden; background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.08);">
                <div class="property-image" style="position: relative; height: 200px;">
                    ${badgeHTML}
                    <img src="${imagenPortada}" alt="${ad.titulo || 'Anuncio'}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/500x400?text=Sin+Imagen'">
                </div>
                <div class="property-details" style="padding: 15px;">
                    <div class="property-price" style="font-size: 1.3rem; font-weight: bold; color: #2d3436; margin-bottom: 5px;">$${precioFormateado}</div>
                    <h3 class="property-title" style="font-size: 1.05rem; margin-bottom: 8px; color: #2d3436; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ad.titulo || 'Sin título'}</h3>
                    <div class="property-location" style="color: #636e72; font-size: 0.85rem; margin-bottom: 12px;">
                        <i class="fas fa-map-marker-alt"></i> ${ad.corregimiento ? ad.corregimiento + ', ' : ''}${ad.distrito || ''}, ${ad.provincia || 'Panamá'}
                    </div>
                    <div class="property-attributes" style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 5px;">
                        ${attributes}
                    </div>
                    <a href="detalle-producto.html?id=${ad.id}" class="btn-contact-card" style="margin-top: 15px; display: block; text-align: center; background: #00bfae; color: white; padding: 10px; border-radius: 8px; text-decoration: none; font-weight: bold; transition: all 0.2s ease;">Ver Detalles</a>
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
            if (attributes.piso) details.push(`<span><i class="fas fa-building"></i> Piso ${attributes.piso}</span>`);
            if (attributes.estacionamiento) details.push(`<span><i class="fas fa-parking"></i> ${attributes.estacionamiento} estacionamiento(s)</span>`);
            if (attributes.amueblado) details.push(`<span><i class="fas fa-couch"></i> ${attributes.amueblado}</span>`);
            if (attributes.ascensor) details.push(`<span><i class="fas fa-elevator"></i> ${attributes.ascensor}</span>`);
            if (attributes.jardin) details.push(`<span><i class="fas fa-leaf"></i> ${attributes.jardin}</span>`);
            if (attributes.piscina) details.push(`<span><i class="fas fa-swimming-pool"></i> ${attributes.piscina}</span>`);
            if (attributes.tipo_propiedad) details.push(`<span><i class="fas fa-home"></i> ${attributes.tipo_propiedad}</span>`);
            if (attributes.anio_construccion) details.push(`<span><i class="fas fa-calendar-alt"></i> ${attributes.anio_construccion}</span>`);
            if (attributes.estado_conservacion) details.push(`<span><i class="fas fa-check-circle"></i> ${attributes.estado_conservacion}</span>`);
            if (attributes.calefaccion) details.push(`<span><i class="fas fa-fire"></i> ${attributes.calefaccion}</span>`);
            if (attributes.aire_acondicionado) details.push(`<span><i class="fas fa-snowflake"></i> ${attributes.aire_acondicionado}</span>`);
            if (attributes.seguridad) details.push(`<span><i class="fas fa-shield-alt"></i> ${attributes.seguridad}</span>`);
            if (attributes.orientacion) details.push(`<span><i class="fas fa-compass"></i> ${attributes.orientacion}</span>`);
            if (details.length > 0) {
                detailsHTML += `<div class="real-estate-details">${details.join('')}</div>`;
            }
        }

        // --- ELECTRÓNICA (Iconos más tecnológicos y precisos) ---
        const electronicsSubcats = ["celulares y teléfonos", "computadoras", "consolas y videojuegos", "audio y video", "fotografía", "electrónica"];
        if (electronicsSubcats.some(subcat => categoria.includes(subcat))) {
            let details = [];

            if (attributes.marca) details.push(`<span><i class="fas fa-cube"></i> ${attributes.marca}</span>`);
            if (attributes.modelo) details.push(`<span><i class="fas fa-laptop-code"></i> ${attributes.modelo}</span>`);
            if (attributes.almacenamiento) details.push(`<span><i class="fas fa-database"></i> ${attributes.almacenamiento} GB</span>`);
            if (attributes.memoria_ram) details.push(`<span><i class="fas fa-memory"></i> ${attributes.memoria_ram} GB RAM</span>`);
            if (attributes.procesador) details.push(`<span><i class="fas fa-microchip"></i> ${attributes.procesador}</span>`);
            if (attributes.condicion) details.push(`<span><i class="fas fa-award"></i> ${attributes.condicion}</span>`);

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
            
            if (attributes.marca) details.push(`<span><i class="fas fa-tag"></i> ${attributes.marca}</span>`);
            if (attributes.talla) details.push(`<span><i class="fas fa-tshirt"></i> Talla: ${attributes.talla}</span>`);
            if (attributes.color) details.push(`<span><i class="fas fa-palette"></i> ${attributes.color}</span>`);
            if (attributes.condicion) details.push(`<span><i class="fas fa-gem"></i> ${attributes.condicion}</span>`);
            if (attributes.edad) details.push(`<span><i class="fas fa-child"></i> Edad: ${attributes.edad}</span>`);
            
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
            let iconMascota = '<i class="fas fa-paw"></i>';
            if (subcategory) {
                const sub = subcategory.toLowerCase();
                if (sub.includes('perro')) iconMascota = '<i class="fas fa-dog"></i>';
                else if (sub.includes('gato')) iconMascota = '<i class="fas fa-cat"></i>';
                else if (sub.includes('ave') || sub.includes('pájaro')) iconMascota = '<i class="fas fa-dove"></i>';
                else if (sub.includes('pez') || sub.includes('peces')) iconMascota = '<i class="fas fa-fish"></i>';
            }

            if (attributes.raza) details.push(`<span>${iconMascota} ${attributes.raza}</span>`);
            if (attributes.genero) details.push(`<span><i class="fas fa-venus-mars"></i> ${attributes.genero}</span>`);
            
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
            
            if (attributes.tipo_negocio) details.push(`<span><i class="fas fa-building"></i> ${attributes.tipo_negocio}</span>`);
            if (attributes.razon_venta) details.push(`<span><i class="fas fa-handshake"></i> ${attributes.razon_venta}</span>`);
            if (attributes.condicion) details.push(`<span><i class="fas fa-gem"></i> ${attributes.condicion}</span>`);
            
            if (details.length > 0) {
                detailsHTML += `<div class="business-details">${details.slice(0, 3).join('')}</div>`;
            }
        }

        // --- COMUNIDAD, CLASES Y EVENTOS (Iconos dinámicos) ---
        const communitySubcats = ["Clases y Cursos", "Eventos", "Otros"];
        if (attributes.subcategoria && communitySubcats.includes(attributes.subcategoria)) {
            let details = [];
            
            if (attributes.tipo_evento) details.push(`<span><i class="fas fa-ticket-alt"></i> ${attributes.tipo_evento}</span>`);
            if (attributes.tipo_actividad) details.push(`<span><i class="fas fa-user-friends"></i> ${attributes.tipo_actividad}</span>`);
            if (attributes.tipo_clase) details.push(`<span><i class="fas fa-book-reader"></i> ${attributes.tipo_clase}</span>`);
            if (attributes.nivel) details.push(`<span><i class="fas fa-layer-group"></i> ${attributes.nivel}</span>`);
            if (attributes.modalidad) details.push(`<span><i class="fas fa-globe"></i> ${attributes.modalidad}</span>`);
            if (attributes.fecha_evento) details.push(`<span><i class="far fa-calendar-check"></i> ${attributes.fecha_evento}</span>`);
            
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
    if (!window.cleanLocationString) {
        window.cleanLocationString = cleanLocationString;
    }
}

/**
 * Limpia una dirección geocodificada para hacerla amigable
 * @param {string} fullAddress - La dirección completa del mapa
 * @returns {string} - La dirección limpia (Ej: "El Dorado, Vía J. Alfaro")
 */
export function cleanLocationString(fullAddress) {
    if (!fullAddress) return 'Ubicación no especificada';
    
    // 1. Convertir a minúsculas para facilitar la búsqueda, pero guardar el original
    let cleanStr = fullAddress;
    
    // 2. Lista de palabras/frases a eliminar (Ajustar según necesidad de Panamá)
    const wordsToRemove = [
        ', panamá', 
        ', panama',
        'provincia de panamá',
        'provincia de panama',
        'ciudad de panamá',
        'ciudad de panama',
        'distrito de',
        'corregimiento de',
        'corregimiento'
    ];
    
    // 3. Reemplazar ignorando mayúsculas/minúsculas usando Regex
    wordsToRemove.forEach(word => {
        const regex = new RegExp(word, 'gi');
        cleanStr = cleanStr.replace(regex, '');
    });
    
    // 4. Limpiar comas huérfanas o dobles espacios que hayan quedado
    cleanStr = cleanStr.replace(/,(\s*,)+/g, ',');
    cleanStr = cleanStr.replace(/,\s*$/, '');
    cleanStr = cleanStr.replace(/^\s*,\s*/, '');
    cleanStr = cleanStr.trim();
    
    // Si después de limpiar quedó vacío, devolvemos el original truncado a 30 caracteres
    if (!cleanStr || cleanStr.length < 3) {
        return fullAddress.length > 30 ? fullAddress.substring(0, 30) + '...' : fullAddress;
    }
    
    return cleanStr;
}
