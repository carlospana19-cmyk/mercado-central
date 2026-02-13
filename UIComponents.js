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

        return `
            <div class="property-card ${planClass}" data-id="${ad.id}">
                <div class="property-image">
                    <img src="${imagenPortada}" alt="${ad.titulo || 'Anuncio'}" loading="lazy">
                </div>
                <div class="property-details">
                    <div class="property-price">$${precioFormateado}</div>
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
     * Extrae y renderiza los atributos desde el JSONB atributos_clave
     */
    renderAttributes(ad) {
        // 1. Mapeo de Categoría (Texto a ID de AppConfig) - Con variaciones
        const categoryMap = { 
            // Vehículos
            'Vehículos': 1, 'Vehiculos': 1, 'Autos': 1, 'Auto': 1, 'Carros': 1, 'Carro': 1, 
            'Motos': 1, 'Moto': 1, 'Motocicleta': 1, 'Motocicletas': 1,
            // Inmuebles
            'Inmuebles': 2, 'Bienes Raíces': 2, 'Bienes Raices': 2, 'Casas': 2, 'Casa': 2, 
            'Apartamentos': 2, 'Apartamento': 2, 'Propiedad': 2, 'Propiedades': 2,
            // Electrónica
            'Electrónica': 3, 'Electronica': 3, 'Tecnología': 3, 'Tecnologia': 3,
            // Hogar y Muebles
            'Hogar y Muebles': 4, 'Hogar': 4, 'Muebles': 4, 'Mueble': 4
        };

        const catId = categoryMap[ad.categoria] || ad.category_id || 0;
        const fields = APP_CONFIG.CATEGORY_ATTRIBUTES[catId] || APP_CONFIG.CATEGORY_ATTRIBUTES.default;
        
        // 2. Acceso al JSONB de Supabase
        const attrs = ad.atributos_clave || {};
        
        // 3. IconMap ultra-flexible con sinónimos
        const iconMap = {
            'habitaciones': 'fa-bed', 'recamaras': 'fa-bed', 'rooms': 'fa-bed',
            'banos': 'fa-bath', 'baños': 'fa-bath', 'toilettes': 'fa-bath',
            'm2': 'fa-ruler-combined', 'superficie': 'fa-ruler-combined',
            'km': 'fa-tachometer-alt', 'kilometraje': 'fa-tachometer-alt',
            'transmision': 'fa-cog',
            'combustible': 'fa-gas-pump',
            'condicion': 'fa-info-circle'
        };

        // 4. Mapear campos a sus posibles nombres en los datos
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
            // Buscar el valor usando los sinónimos
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
                // Si el valor es muy largo, lo cortamos para que no rompa la tarjeta
                const displayValue = value.toString().length > 15 ? value.toString().substring(0, 12) + '...' : value;
                html += `<span><i class="fas ${icon}"></i> ${displayValue}</span>`;
            }
        });

        // Si no hay atributos, mostramos un mensaje genérico para no dejar el espacio vacío
        return html || '<span><i class="fas fa-info-circle"></i> Ver detalles</span>';
    }
};

// Exponer al objeto window para uso global
window.UIComponents = UIComponents;
