// utils-attributes.js - FUNCIONES COMPARTIDAS PARA GENERACIÓN DE ATRIBUTOS
// ✅ Centraliza lógica de presentación de atributos para evitar duplicación

/**
 * Genera HTML con iconos y detalles de atributos basado en categoría
 * Usado por: home-logic.js, results-logic.js
 * 
 * @param {Object} attributes - Objeto de atributos (from atributos_clave JSONB)
 * @param {String} category - Categoría del anuncio
 * @param {String} subcategory - Subcategoría opcional
 * @returns {String} HTML con detalles y iconos
 */
export function generateAttributesHTML(attributes, category, subcategory) {
    if (!attributes || Object.keys(attributes).length === 0) {
        return '';
    }

    const categoria = category ? category.toLowerCase() : '';
    let detailsHTML = '';

    // --- DETALLES DE VEHÍCULOS (desde JSONB) ---
    if (categoria.includes('vehículo') || categoria.includes('auto') || categoria.includes('carro') || categoria.includes('moto')) {
        // Mostrar SOLO 3 atributos: Año, Combustible, Kilometraje
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
        // Mostrar SOLO 3 atributos: m², Habitaciones, Baños
            let details = [];
            if (attributes.m2) details.push(`<span><i class="fas fa-ruler-combined"></i> ${attributes.m2} m²</span>`);
            if (attributes.habitaciones) details.push(`<span><i class="fas fa-bed"></i> ${attributes.habitaciones} hab</span>`);
        if (attributes.baños || attributes.banos) details.push(`<span><i class="fas fa-bath"></i> ${(attributes.baños || attributes.banos)} baños</span>`);
            if (details.length > 0) {
            detailsHTML += `<div class="real-estate-details">${details.join('')}</div>`;
        }
    }

    // --- SECCIÓN: Iconos de atributos de electrónica ---
    const electronicsSubcats = ["celulares y teléfonos", "computadoras", "consolas y videojuegos", "audio y video", "fotografía", "electrónica"];
    if (electronicsSubcats.some(subcat => categoria.includes(subcat))) {
        let details = [];

        if (attributes.marca) details.push(`<span><i class="fas fa-tag"></i> ${attributes.marca}</span>`);
        if (attributes.modelo) details.push(`<span><i class="fas fa-mobile-alt"></i> ${attributes.modelo}</span>`);
        if (attributes.almacenamiento) details.push(`<span><i class="fas fa-hdd"></i> ${attributes.almacenamiento} GB</span>`);
        if (attributes.memoria_ram) details.push(`<span><i class="fas fa-microchip"></i> ${attributes.memoria_ram} GB RAM</span>`);
        if (attributes.procesador) details.push(`<span><i class="fas fa-microchip"></i> ${attributes.procesador}</span>`);
        if (attributes.tipo_computadora) details.push(`<span><i class="fas fa-laptop"></i> ${attributes.tipo_computadora}</span>`);
        if (attributes.plataforma) details.push(`<span><i class="fas fa-gamepad"></i> ${attributes.plataforma}</span>`);
        if (attributes.condicion) details.push(`<span><i class="fas fa-star"></i> ${attributes.condicion}</span>`);
        if (attributes.tipo_articulo) details.push(`<span><i class="fas fa-microchip"></i> ${attributes.tipo_articulo}</span>`);

        if (details.length > 0) {
            detailsHTML += `<div class="electronics-details">${details.slice(0, 3).join('')}</div>`;
        }
    }

    // --- SECCIÓN: Iconos de atributos de hogar y muebles ---
    const homeFurnitureSubcats = ["Artículos de Cocina", "Decoración", "Electrodomésticos", "Jardín y Exterior", "Muebles"];
    if (subcategory && homeFurnitureSubcats.includes(subcategory)) {
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

    // --- SECCIÓN: Iconos de atributos de moda y belleza ---
    const fashionSubcats = ["ropa de mujer", "ropa de hombre", "ropa de niños", "calzado", "bolsos y carteras", "accesorios", "joyería y relojes", "salud y belleza", "moda y belleza"];
    if (fashionSubcats.some(subcat => categoria.includes(subcat))) {
        let details = [];
        
        if (attributes.tipo_prenda) details.push(`<span><i class="fas fa-tshirt"></i> ${attributes.tipo_prenda}</span>`);
        if (attributes.tipo_calzado) details.push(`<span><i class="fas fa-shoe-prints"></i> ${attributes.tipo_calzado}</span>`);
        if (attributes.tipo_bolso) details.push(`<span><i class="fas fa-shopping-bag"></i> ${attributes.tipo_bolso}</span>`);
        if (attributes.tipo_accesorio) details.push(`<span><i class="fas fa-glasses"></i> ${attributes.tipo_accesorio}</span>`);
        if (attributes.tipo_joya) details.push(`<span><i class="fas fa-gem"></i> ${attributes.tipo_joya}</span>`);
        if (attributes.tipo_producto) details.push(`<span><i class="fas fa-spray-can"></i> ${attributes.tipo_producto}</span>`);
        if (attributes.talla) details.push(`<span><i class="fas fa-ruler"></i> Talla ${attributes.talla}</span>`);
        if (attributes.talla_calzado) details.push(`<span><i class="fas fa-ruler"></i> Talla ${attributes.talla_calzado}</span>`);
        if (attributes.marca) details.push(`<span><i class="fas fa-tag"></i> ${attributes.marca}</span>`);
        if (attributes.condicion) details.push(`<span><i class="fas fa-check-circle"></i> ${attributes.condicion}</span>`);
        
        if (details.length > 0) {
            detailsHTML += `<div class="fashion-details">${details.slice(0, 3).join('')}</div>`;
        }
    }

    // --- SECCIÓN: Iconos de atributos de deportes y hobbies ---
    const sportsSubcats = ["Bicicletas", "Coleccionables", "Deportes", "Instrumentos Musicales", "Libros, Revistas y Comics", "Otros Hobbies"];
    if (subcategory && sportsSubcats.includes(subcategory)) {
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

    // --- SECCIÓN: Iconos de atributos de mascotas ---
    const petsSubcats = ["Perros", "Gatos", "Aves", "Peces", "Otros Animales", "Accesorios para Mascotas"];
    if (subcategory && petsSubcats.includes(subcategory)) {
        let details = [];
        
        if (attributes.tipo_anuncio) details.push(`<span><i class="fas fa-paw"></i> ${attributes.tipo_anuncio}</span>`);
        if (attributes.tipo_accesorio) details.push(`<span><i class="fas fa-bone"></i> ${attributes.tipo_accesorio}</span>`);
        if (attributes.raza) details.push(`<span><i class="fas fa-dog"></i> ${attributes.raza}</span>`);
        if (attributes.edad_mascota) details.push(`<span><i class="fas fa-birthday-cake"></i> ${attributes.edad_mascota}</span>`);
        if (attributes.genero) details.push(`<span><i class="fas fa-venus-mars"></i> ${attributes.genero}</span>`);
        if (attributes.marca) details.push(`<span><i class="fas fa-tag"></i> ${attributes.marca}</span>`);
        
        if (details.length > 0) {
            detailsHTML += `<div class="pets-details">${details.slice(0, 3).join('')}</div>`;
        }
    }

    // --- SECCIÓN: Iconos de atributos de servicios ---
    const servicesSubcats = ["Servicios de Construcción", "Servicios de Educación", "Servicios de Eventos", "Servicios de Salud", "Servicios de Tecnología", "Servicios para el Hogar", "Otros Servicios"];
    if (subcategory && servicesSubcats.includes(subcategory)) {
        let details = [];
        
        if (attributes.tipo_servicio) details.push(`<span><i class="fas fa-wrench"></i> ${attributes.tipo_servicio}</span>`);
        if (attributes.modalidad) details.push(`<span><i class="fas fa-location-arrow"></i> ${attributes.modalidad}</span>`);
        if (attributes.experiencia) details.push(`<span><i class="fas fa-award"></i> ${attributes.experiencia}</span>`);
        
        if (details.length > 0) {
            detailsHTML += `<div class="services-details">${details.slice(0, 3).join('')}</div>`;
        }
    }

    // --- SECCIÓN: Iconos de atributos de negocios ---
    const businessSubcats = ["Equipos para Negocios", "Maquinaria para Negocios", "Negocios en Venta"];
    if (subcategory && businessSubcats.includes(subcategory)) {
        let details = [];
        
        if (attributes.tipo_negocio) details.push(`<span><i class="fas fa-briefcase"></i> ${attributes.tipo_negocio}</span>`);
        if (attributes.tipo_equipo) details.push(`<span><i class="fas fa-cogs"></i> ${attributes.tipo_equipo}</span>`);
        if (attributes.marca) details.push(`<span><i class="fas fa-tag"></i> ${attributes.marca}</span>`);
        if (attributes.modelo) details.push(`<span><i class="fas fa-barcode"></i> ${attributes.modelo}</span>`);
        if (attributes.años_operacion) details.push(`<span><i class="fas fa-calendar-check"></i> ${attributes.años_operacion}</span>`);
        if (attributes.incluye) details.push(`<span><i class="fas fa-check-circle"></i> ${attributes.incluye}</span>`);
        if (attributes.razon_venta) details.push(`<span><i class="fas fa-info-circle"></i> ${attributes.razon_venta}</span>`);
        if (attributes.condicion) details.push(`<span><i class="fas fa-star"></i> ${attributes.condicion}</span>`);
        
        if (details.length > 0) {
            detailsHTML += `<div class="business-details">${details.slice(0, 3).join('')}</div>`;
        }
    }

    // --- SECCIÓN: Iconos de atributos de comunidad ---
    const communitySubcats = ["Clases y Cursos", "Eventos", "Otros"];
    if (subcategory && communitySubcats.includes(subcategory)) {
        let details = [];
        
        if (attributes.tipo_evento) details.push(`<span><i class="fas fa-calendar-day"></i> ${attributes.tipo_evento}</span>`);
        if (attributes.tipo_actividad) details.push(`<span><i class="fas fa-users"></i> ${attributes.tipo_actividad}</span>`);
        if (attributes.tipo_clase) details.push(`<span><i class="fas fa-chalkboard-teacher"></i> ${attributes.tipo_clase}</span>`);
        if (attributes.nivel) details.push(`<span><i class="fas fa-chart-line"></i> ${attributes.nivel}</span>`);
        if (attributes.modalidad) details.push(`<span><i class="fas fa-map-marker-alt"></i> ${attributes.modalidad}</span>`);
        if (attributes.fecha_evento) details.push(`<span><i class="fas fa-calendar-alt"></i> ${attributes.fecha_evento}</span>`);
        
        if (details.length > 0) {
            detailsHTML += `<div class="community-details">${details.slice(0, 3).join('')}</div>`;
        }
    }

    return detailsHTML;
}
