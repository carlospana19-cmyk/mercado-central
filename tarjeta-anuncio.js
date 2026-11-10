// tarjeta-anuncio.js — FASE 2: tarjeta de anuncio COMPARTIDA.
// El mismo HTML que pinta resultados.html (retoque 1-B) se usa ahora en el
// perfil del vendedor y en la sección "Más anuncios" del detalle.
// Función pura, sin dependencias de Supabase. Toma el anuncio crudo (como viene
// de la tabla `anuncios` con sus joins) y normaliza la imagen de portada.
import { urlDetalle, precioTexto, badgeDe, inicialDe } from './utilidades-ui.js';
import { cleanLocationString } from './UIComponents.js';

export function tarjetaAnuncioHTML(product) {
    // 1. Extraer la imagen correcta - formato unificado para todos los planes
    // Prioridad: imagen_portada > imagenes[0] > url_portada > url_galeria > placeholder
    let imagenUrl = null;
    if (product.imagen_portada) {
        imagenUrl = product.imagen_portada;
    } else if (product.imagenes && product.imagenes[0]?.url_imagen) {
        imagenUrl = product.imagenes[0].url_imagen;
    } else if (product.url_portada) {
        imagenUrl = product.url_portada;
    } else if (Array.isArray(product.url_galeria) && product.url_galeria.length > 0) {
        imagenUrl = product.url_galeria[0];
    } else if (product.url_galeria && typeof product.url_galeria === 'string') {
        imagenUrl = product.url_galeria;
    } else {
        imagenUrl = 'img/placeholder.jpg';
    }

    // 2. Asegurar que atributos_clave sea un objeto para la tarjeta
    let attrs = product.atributos_clave || {};
    if (typeof attrs === 'string') {
        try { attrs = JSON.parse(attrs); } catch(e) { attrs = {}; }
    }

    // 3. Crear el objeto limpio para la tarjeta
    const ad = { ...product, url_portada: imagenUrl, atributos_clave: attrs };

    // Sistema de destacados: clase extra por plan (coronas de mc-tarjeta-2026.css)
    let cardExtraClass = '';
    const plan = ad.featured_plan ? ad.featured_plan.toLowerCase() : 'free';
    if (plan === 'basico') cardExtraClass = 'card-basico';
    else if (plan === 'premium') cardExtraClass = 'card-premium';
    else if (plan === 'top') cardExtraClass = 'card-top';
    else if (plan === 'destacado') cardExtraClass = 'card-destacado';
    else if (plan === 'elite') cardExtraClass = 'card-elite';

    // ✅ Si está vendido, la tarjeta se muestra apagada y no navega al detalle
    const soldClass = ad.is_sold ? 'card-sold' : '';
    const soldBadgeResults = ad.is_sold ? '<span class="badge-sold-home" title="Vendido"><i class="fas fa-check-circle"></i> VENDIDO</span>' : '';

    // FASE 1: píldoras sobre la foto, SOLO si aplican (utilidades-ui.js)
    const pildoras = [];
    if (ad.enhancements && ad.enhancements.is_urgent) {
        pildoras.push('<span class="mc-badge mc-badge-urgente"><i class="fas fa-clock"></i> Urgente</span>');
    }
    badgeDe(ad).forEach(b => pildoras.push(`<span class="${b.clase}">${b.texto}</span>`));
    const badgesHTML = pildoras.length ? `<div class="mc-badges">${pildoras.join('')}</div>` : '';

    // ¿El anuncio tiene al menos una foto real? (si no, fondo gris con la inicial del título)
    const tieneFotoReal = !!(product.imagen_portada
        || (product.imagenes && product.imagenes[0]?.url_imagen)
        || (product.url_portada && product.url_portada.trim() !== '')
        || (Array.isArray(product.url_galeria) && product.url_galeria.length > 0)
        || (typeof product.url_galeria === 'string' && product.url_galeria.trim() !== ''));

    // FASE 1-B: foto ESTÁTICA (siempre la primera); el carrusel vive solo en la página de detalle
    // Galería real del anuncio (portada + galería, sin duplicados): alimenta la foto y el conteo 📷
    let galeria = [];
    if (tieneFotoReal) {
        if (ad.url_portada && ad.url_portada.trim() !== '' && !ad.url_portada.includes('placeholder')) galeria.push(ad.url_portada);
        if (Array.isArray(ad.url_galeria)) ad.url_galeria.forEach(u => { if (u && u.trim() !== '' && !galeria.includes(u)) galeria.push(u); });
    }
    const totalFotos = galeria.length;
    const conteoFotosHTML = totalFotos >= 2 ? `<span class="mc-foto-conteo"><i class="fas fa-camera" aria-hidden="true"></i> ${totalFotos}</span>` : '';
    const fotoHTML = totalFotos > 0
        ? `<img src="${galeria[0]}" alt="${ad.titulo}" loading="lazy">`
        : `<div class="mc-card-foto-vacia" aria-hidden="true">${inicialDe(ad.titulo)}</div>`;

    // Precio en B/. (o "A consultar") y ubicación en una línea
    const precio = precioTexto(ad);
    const ubicacionTexto = cleanLocationString(ad.direccion_exacta || (ad.provincia || 'Panamá') + ', ' + (ad.distrito || ad.ubicacion || 'N/A'));

    return `
        <div class="mc-card card ${cardExtraClass} ${soldClass}" data-ad-id="${ad.id}" data-url="${urlDetalle(ad.id)}" role="link" tabindex="0" aria-label="${ad.titulo}"${ad.is_sold ? ' style="cursor: default;"' : ''}>
                ${badgesHTML}
                ${soldBadgeResults}
                <div class="mc-card-foto ${ad.is_sold ? 'image-sold' : ''}">${conteoFotosHTML}${fotoHTML}</div>
                <div class="mc-card-cuerpo">
                        <div class="mc-card-precio">
                                <span class="${precio ? 'mc-precio-valor' : 'mc-precio-vacio'}">${precio || 'A consultar'}</span>
                                <button class="like-btn" data-anuncio-id="${ad.id}" data-liked="false" title="Dar me gusta">
                                        <i class="far fa-heart"></i>
                                        <span class="likes-count">0</span>
                                </button>
                        </div>
                        <h2 class="mc-card-titulo">${ad.titulo}</h2>
                        <p class="mc-card-meta"><i class="fas fa-map-marker-alt" aria-hidden="true"></i><span>${ubicacionTexto}</span></p>
                </div>
        </div>
    `;
}
