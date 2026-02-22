// home-logic.js - VERSIÓN DE DIAGNÓSTICO

import { supabase } from './supabase-client.js';
import { generateAttributesHTML } from './utils-attributes.js';
import { generateLikeButtonHTML, initializeAllCardLikes } from './likes-logic.js';
import { UIComponents } from './UIComponents.js';
import { getSellerReviewStats } from './reviews-logic.js';

export function initializeHomePage() {

    console.log("SENSOR 1: initializeHomePage() se ha ejecutado.");

    // Inicializar carrusel del hero
    initializeHeroCarousel();

    async function loadFeaturedAds() {
        console.log("SENSOR 2: loadFeaturedAds() ha comenzado.");

        const container = document.querySelector('#products .box-container');
        if (!container) {
            console.error("FALLO CRÍTICO: No se encontró el contenedor '#products .box-container'.");
            return;
        }

        try {
            // ✅ CARGAR ANUNCIOS TOP Y DESTACADO PRIMERO (para fila de 2 columnas)
            let { data: premiumAds, error: premiumError } = await supabase
                .from('anuncios')
                .select('*, imagenes(url_imagen), profiles(id, nombre_negocio, url_foto_perfil)')
                .in('featured_plan', ['top', 'destacado'])
                .order('fecha_publicacion', { ascending: false })
                .limit(20); // Aumentado para tener más tarjetas en el carrusel

            if (premiumError) throw premiumError;

            // ✅ CARGAR RESTO DE ANUNCIOS (premium, basico) para otras filas
            let { data: regularAds, error } = await supabase
                .from('anuncios')
                .select('*, imagenes(url_imagen), profiles(id, nombre_negocio, url_foto_perfil)')
                .in('featured_plan', ['premium', 'basico'])
                .order('fecha_publicacion', { ascending: false })
                .limit(10);

            // Combinar: primero TOP/Destacado, luego el resto
            let ads = [...(premiumAds || []), ...(regularAds || [])];

            // ✅ Si la columna is_sold no existe, intentar sin el filtro
            if (error && error.code === '42703') {
                console.warn('⚠️ Columna is_sold no existe. Mostrando todos los anuncios.');
                const { data: adsWithoutFilter, error: error2 } = await supabase
                    .from('anuncios')
                    .select('*, profiles(id, nombre_negocio, url_foto_perfil)')
                    .in('featured_plan', ['top', 'destacado', 'premium', 'basico'])
                    .order('fecha_publicacion', { ascending: false })
                    .limit(15);
                ads = adsWithoutFilter;
                error = error2;
            }

            if (error) throw error;

            console.log("SENSOR 3: Datos recibidos de Supabase:", ads);

            // DIAGNÓSTICO: Verificar atributos_clave en cada anuncio
            ads.forEach((ad, index) => {
                console.log(`Anuncio ${index + 1} - ID: ${ad.id}, Título: ${ad.titulo}`);
                console.log(`Atributos_clave:`, ad.atributos_clave);
                console.log(`Categoría: ${ad.categoria}`);
                console.log(`---`);
            });

            if (!ads || ads.length === 0) {
                container.innerHTML = '<p>No hay anuncios destacados en este momento.</p>';
                return;
            }

            // ✅ Obtener estadísticas de reseñas de todos los vendedores únicos
            const uniqueSellerIds = [...new Set(ads.map(ad => ad.profiles?.id).filter(Boolean))];
            const sellerStatsMap = {};
            
            if (uniqueSellerIds.length > 0) {
                // Obtener estadísticas para cada vendedor
                for (const sellerId of uniqueSellerIds) {
                    try {
                        const stats = await getSellerReviewStats(sellerId);
                        sellerStatsMap[sellerId] = stats;
                    } catch (e) {
                        console.warn('Error obteniendo estadísticas del vendedor:', sellerId, e);
                        sellerStatsMap[sellerId] = { total_reviews: 0, average_rating: 0 };
                    }
                }
            }
            
            console.log('Estadísticas de vendedores:', sellerStatsMap);

            // === INICIO: Lógica de renderizado por filas personalizadas ===
            let adsHTML = '';
            let processedAds = 0;

            // Función interna para convertir URL de YouTube/Vimeo a embed
const getVideoEmbedUrl = (videoUrl) => {
    if (!videoUrl) return null;
    
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = videoUrl.match(youtubeRegex);
    if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`;
    }
    
    const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
    const vimeoMatch = videoUrl.match(vimeoRegex);
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return null;
};

            const generateCardHTML = (ad) => {
                const allImages = [ad.url_portada, ...(ad.url_galeria || [])].filter(Boolean);
                const priceFormatted = new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(ad.precio);
                const videoEmbedUrl = getVideoEmbedUrl(ad.url_video);
                
                const cardClass = ad.is_premium ? 'tarjeta-auto' : 'box';
// BADGE ESTELAR METÁLICO – versión SVG simple
let badgeHTML = '';
let cardExtraClass = '';

const badgeSVG = (colorClass) => `
<svg class="simple-badge-svg ${colorClass}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <!-- Aro de estrella (12 puntas) -->
    <path d="M50 2 
             L63.5 18.5 L84.5 15.5 
             L87.5 36.5 L100 50 
             L87.5 63.5 L84.5 84.5 
             L63.5 81.5 L50 98 
             L36.5 81.5 L15.5 84.5 
             L12.5 63.5 L0 50 
             L12.5 36.5 L15.5 15.5 
             L36.5 18.5 Z" 
          class="badge-star-bg"/>

    <!-- Círculo blanco de fondo -->
    <circle cx="50" cy="50" r="32" 
            fill="white" 
            stroke="white" 
            stroke-width="1"/>

    <!-- Estrella central - SOLO CONTORNO (stroke), sin relleno -->
    <polygon points="50,28 57,45 75,45 61,56 66,73 50,60 32,70 38,53 25,43 42,43" 
             class="badge-center-star"
             fill="none"
             stroke-width="2.5"
             stroke-linecap="round"
             stroke-linejoin="round"/>
</svg>
`;

if (ad.featured_plan === "top") {
  badgeHTML = badgeSVG("diamond-badge");
  cardExtraClass = "card-top";
} else if (ad.featured_plan === "destacado") {
  badgeHTML = badgeSVG("gold-badge");
  cardExtraClass = "card-destacado";
} else if (ad.featured_plan === "premium") {
  badgeHTML = badgeSVG("silver-badge");
  cardExtraClass = "card-premium";
} else if (ad.featured_plan === "basico") {
  badgeHTML = badgeSVG("bronze-badge");
  cardExtraClass = "card-basico";
}

                let urgentBadge = '';
                if (ad.enhancements && ad.enhancements.is_urgent) {
                    urgentBadge = '<span class="badge-urgent" title="Urgente"><i class="fas fa-clock"></i></span>';
                }

                // Foto de perfil del usuario (si existe)
                let profilePhotoHTML = '';
                if (ad.url_foto_perfil) {
                    profilePhotoHTML = `
                        <div class="card-seller-info">
                            <img src="${ad.url_foto_perfil}" alt="Foto de vendedor" class="seller-photo">
                            <div class="seller-details">
                                <p class="seller-name">${ad.nombre_negocio || 'Vendedor'}</p>
                            </div>
                        </div>
                    `;
                }

                // ✅ BADGE VENDIDO EN TARJETAS DEL HOME
                const soldBadgeHome = ad.is_sold ? '<span class="badge-sold-home" title="Vendido"><i class="fas fa-check-circle"></i> VENDIDO</span>' : '';
                const soldClass = ad.is_sold ? 'card-sold' : '';
                // ✅ Guardar el id del anuncio en un atributo data
                const dataAdId = `data-ad-id="${ad.id}" data-is-sold="${ad.is_sold ? 'true' : 'false'}"`;
                
                // Avatar del vendedor - Solo mostrar si tiene foto
                const vendorProfile = ad.profiles ? (Array.isArray(ad.profiles) ? ad.profiles[0] : ad.profiles) : null;
                const vendorPhoto = vendorProfile?.url_foto_perfil;
                const vendorName = vendorProfile?.nombre_negocio || 'Usuario';
                const vendorId = vendorProfile?.id;
                
                // ✅ Obtener estadísticas de reseñas del vendedor
                const vendorStats = vendorId ? (sellerStatsMap[vendorId] || { total_reviews: 0, average_rating: 0 }) : { total_reviews: 0, average_rating: 0 };
                const starsDisplay = vendorStats.total_reviews > 0 
                    ? `<span class="vendor-rating"><i class="fas fa-star"></i> ${vendorStats.average_rating.toFixed(1)} (${vendorStats.total_reviews})</span>`
                    : '';
                
                const vendorAvatar = vendorPhoto ? `<div class="vendor-avatar" title="${vendorName}">
                    <img src="${vendorPhoto}" alt="${vendorName}" class="vendor-avatar-img">
                    <span class="vendor-name-tooltip">${vendorName}${starsDisplay ? '<br>' + starsDisplay : ''}</span>
                </div>` : '';

                // ✅ Agregar data-category para filtrado en tiempo real
                const dataCategory = ad.categoria ? `data-category="${ad.categoria}"` : '';

                return `
                    <div class="${cardClass} card ${cardExtraClass} ${soldClass}" ${dataAdId} ${dataCategory} style="${ad.is_sold ? 'cursor: not-allowed;' : 'cursor: pointer;'}">
                       ${badgeHTML}
                         ${urgentBadge}
                         ${soldBadgeHome}
                         <div class="card-actions">
                            ${generateLikeButtonHTML(ad.id, 0, false)}
                         </div>
                         <div class="image-container ${ad.is_sold ? 'image-sold' : ''}">
                            <div class="swiper product-swiper" id="swiper-${ad.id}">
                                <div class="swiper-wrapper">
                                    ${videoEmbedUrl ? `<div class="swiper-slide video-slide"><iframe src="${videoEmbedUrl}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius: 8px;"></iframe><div class="swiper-edge-left"></div><div class="swiper-edge-right"></div></div>` : ''}
                                    ${allImages.length > 0 ? allImages.map(img => `<div class="swiper-slide"><img src="${img}" alt="${ad.titulo}" loading="lazy"></div>`).join('') : ''}
                                </div>
                                <div class="swiper-button-prev"></div>
                                <div class="swiper-button-next"></div>
                                <div class="swiper-pagination"></div>
                            </div>
                        </div>
                        <div class="content ${ad.is_sold ? 'content-sold' : ''}">
                            <div class="price-row">
                                <div class="price">${priceFormatted}</div>
                                ${vendorAvatar}
                            </div>
                            <h3>${ad.titulo}</h3>
                            <div class="location"><i class="fas fa-map-marker-alt"></i> ${ad.corregimiento ? ad.corregimiento + ', ' : ''}${ad.distrito || ad.ubicacion || ''}, ${ad.provincia || 'N/A'}</div>
                            <div class="description">${ad.descripcion || ''}</div>
                            ${generateAttributesHTML(ad.atributos_clave, ad.categoria)}
                            ${profilePhotoHTML}
                            <a href="detalle-producto.html?id=${ad.id}&chat=true" class="btn-contact" data-ad-id="${ad.id}">Contactar</a>
                        </div>
                    </div>`;
            };

            // === RENDERIZADO POR FILAS REORGANIZADO ===

            // Separar anuncios por tipo
            const topDestacadoAds = ads.filter(ad => ['top', 'destacado'].includes(ad.featured_plan));
            const premiumAdsFiltered = ads.filter(ad => ad.featured_plan === 'premium');
            const basicoAds = ads.filter(ad => ad.featured_plan === 'basico');

            let adIndex = 0;

            // === FUNCIÓN PARA GENERAR SLIDE DE BANNER DE ELITE ===
            const generateEliteSlideHTML = (ad, index) => {
                const allImages = [ad.url_portada, ...(ad.url_galeria || [])].filter(Boolean);
                const mainImage = allImages[0] || 'https://via.placeholder.com/800x400?text=Sin+Imagen';
                const priceFormatted = new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(ad.precio);
                
                // Avatar del vendedor
                const vendorProfile = ad.profiles ? (Array.isArray(ad.profiles) ? ad.profiles[0] : ad.profiles) : null;
                const vendorPhoto = vendorProfile?.url_foto_perfil;
                const vendorName = vendorProfile?.nombre_negocio || 'Vendedor';
                const vendorId = vendorProfile?.id;
                
                // Estadísticas de reseñas del vendedor
                const vendorStats = vendorId ? (sellerStatsMap[vendorId] || { total_reviews: 0, average_rating: 0 }) : { total_reviews: 0, average_rating: 0 };
                const starsDisplay = vendorStats.total_reviews > 0 
                    ? `<i class="fas fa-star"></i> ${vendorStats.average_rating.toFixed(1)} (${vendorStats.total_reviews})`
                    : '<span style="color: rgba(255,255,255,0.5);">Sin reseñas</span>';
                
                // Atributos del producto
                const attributesHTML = generateAttributesHTML(ad.atributos_clave, ad.categoria);
                // Extraer solo los spans de atributos para el banner
                const attributeMatches = attributesHTML.match(/<span[^>]*>.*?<\/span>/g) || [];
                const eliteAttributes = attributeMatches.slice(0, 4).map(attr => {
                    // Limpiar y adaptar para el estilo del banner
                    return attr.replace(/class="[^"]*"/, 'class="elite-attribute"');
                }).join('');
                
                // Badge de urgencia
                const urgentBadge = ad.enhancements?.is_urgent 
                    ? '<span class="elite-badge-urgent"><i class="fas fa-bolt"></i> URGENTE</span>' 
                    : '';
                
                // Badge de vendido
                const soldBadge = ad.is_sold 
                    ? '<span class="elite-badge-sold"><i class="fas fa-check-circle"></i> VENDIDO</span>' 
                    : '';
                
                // Clase para estado vendido
                const soldClass = ad.is_sold ? 'elite-banner-sold' : '';
                const soldPointer = ad.is_sold ? 'pointer-events: none; opacity: 0.85;' : '';
                
                // Clase activa para el primer slide
                const activeClass = index === 0 ? 'active' : '';
                
                // === DETECTAR SI ES VIDEO O IMAGEN ===
                const videoUrl = ad.url_video;
                const isVideo = videoUrl && (videoUrl.includes('.mp4') || videoUrl.includes('.webm') || videoUrl.includes('.mov'));
                
                // Tag de patrocinado (si el anuncio tiene marca de sponsor)
                const sponsoredTag = ad.is_sponsored 
                    ? '<span class="sponsored-tag"><i class="fas fa-ad"></i> Patrocinado</span>' 
                    : '';
                
                // Tag orgánico (para anuncios TOP normales)
                const organicTag = !ad.is_sponsored && ad.featured_plan === 'top'
                    ? '<span class="organic-tag"><i class="fas fa-check-circle"></i> Verificado</span>'
                    : '';
                
                // Media container (video o imagen)
                let mediaHTML = '';
                if (isVideo) {
                    mediaHTML = `
                        <div class="elite-banner-video-container">
                            <video autoplay muted loop playsinline class="elite-video-bg" id="elite-video-${ad.id}">
                                <source src="${videoUrl}" type="video/mp4">
                            </video>
                            <div class="video-playing-indicator">
                                <i class="fas fa-circle"></i> Video
                            </div>
                        </div>`;
                } else {
                    mediaHTML = `
                        <div class="elite-banner-image">
                            <img src="${mainImage}" alt="${ad.titulo}" loading="${index === 0 ? 'eager' : 'lazy'}">
                        </div>`;
                }

                return `
                <div class="elite-banner-slide ${activeClass}" data-slide-index="${index}" data-has-video="${isVideo}">
                    <div class="elite-banner ${soldClass}" style="${soldPointer}" data-ad-id="${ad.id}" onclick="window.location.href='detalle-producto.html?id=${ad.id}'">
                        ${sponsoredTag}
                        ${organicTag}
                        ${urgentBadge}
                        ${soldBadge}
                        ${mediaHTML}
                        <div class="elite-banner-content">
                            <span class="elite-badge-gold">
                                <i class="fas fa-check-circle"></i> VERIFICADO
                            </span>
                            <div class="elite-banner-price">${priceFormatted}</div>
                            <h3 class="elite-banner-title">${ad.titulo}</h3>
                            <div class="elite-banner-location">
                                <i class="fas fa-map-marker-alt"></i>
                                ${ad.corregimiento ? ad.corregimiento + ', ' : ''}${ad.distrito || ad.ubicacion || ''}, ${ad.provincia || 'N/A'}
                            </div>
                            <div class="elite-banner-attributes">
                                ${eliteAttributes}
                            </div>
                            ${vendorPhoto ? `
                            <div class="elite-banner-seller">
                                <div class="elite-seller-avatar">
                                    <img src="${vendorPhoto}" alt="${vendorName}">
                                </div>
                                <div class="elite-seller-info">
                                    <span class="elite-seller-name">${vendorName}</span>
                                    <span class="elite-seller-rating">${starsDisplay}</span>
                                </div>
                            </div>
                            ` : ''}
                            <a href="detalle-producto.html?id=${ad.id}&chat=true" class="elite-banner-btn" onclick="event.stopPropagation();">
                                <i class="fas fa-comment-dots"></i>
                                Contactar
                            </a>
                        </div>
                    </div>
                </div>`;
            };

            // === FUNCIÓN PARA GENERAR INDICADORES DE PROGRESO ===
            const generateProgressIndicators = (count) => {
                let indicators = '';
                for (let i = 0; i < count; i++) {
                    const activeClass = i === 0 ? 'active' : '';
                    indicators += `<div class="elite-progress-bar ${activeClass}" data-progress-index="${i}"><div class="progress-fill"></div></div>`;
                }
                return indicators;
            };

            // === SLIDER DE BANNERS DE ELITE: Múltiples anuncios TOP con rotación ===
            if (topDestacadoAds.length > 0) {
                // Determinar cuántos anuncios TOP mostrar en el slider (máximo 5)
                const eliteAds = topDestacadoAds.slice(0, Math.min(5, topDestacadoAds.length));
                const hasMultipleSlides = eliteAds.length > 1;
                
                // Abrir contenedor principal que sincroniza anchos
                adsHTML += `
                <div class="main-content-wrapper">
                    <div class="elite-banner-container">
                        <div class="elite-banner-label">
                            <span class="elite-label-text"><i class="fas fa-crown"></i> Top Selección</span>
                            <div class="elite-label-line"></div>
                        </div>
                        <div class="elite-slider-wrapper" id="elite-slider">
                            ${eliteAds.map((ad, index) => generateEliteSlideHTML(ad, index)).join('')}
                            ${hasMultipleSlides ? `
                                <button class="elite-slider-nav prev" aria-label="Anterior">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                                <button class="elite-slider-nav next" aria-label="Siguiente">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                                <div class="elite-progress-indicators">
                                    ${generateProgressIndicators(eliteAds.length)}
                                </div>
                            ` : ''}
                        </div>
                    </div>`;
                
                // Los anuncios que se mostraron en el slider no se repiten en el grid
                adIndex = eliteAds.length;
                
                // Los siguientes anuncios TOP/Destacado en grid de 3 columnas
                if (topDestacadoAds.length > eliteAds.length) {
                    const row1Ads = topDestacadoAds.slice(adIndex, adIndex + 3);
                    if (row1Ads.length > 0) {
                        adsHTML += `
                        <div class="ads-row row-3-cols">
                            ${row1Ads.map(ad => generateCardHTML(ad)).join('')}
                        </div>`;
                        adIndex += row1Ads.length;
                    }
                }
                
                // Cerrar contenedor principal
                adsHTML += `</div>`;
            }

            // Fila 2: Grid de 3 columnas para los siguientes anuncios TOP/Destacado
            if (adIndex < topDestacadoAds.length) {
                const row2Ads = topDestacadoAds.slice(adIndex, adIndex + 3);
                adsHTML += `
                <div class="ads-row row-3-cols">
                    ${row2Ads.map(ad => generateCardHTML(ad)).join('')}
                </div>`;
                adIndex += row2Ads.length;
            }

            // Fila 3: Carrusel de 4 columnas para anuncios TOP/Destacado restantes + Premium
            const remainingTopDestacado = topDestacadoAds.slice(adIndex);
            const combinedAdsForRow3 = [...remainingTopDestacado, ...premiumAdsFiltered];

            if (combinedAdsForRow3.length > 0) {
                const row3Ads = combinedAdsForRow3.slice(0, Math.min(8, combinedAdsForRow3.length));
                adsHTML += `
                <div class="carousel-row-wrapper">
                    <div class="swiper row-carousel row-4-swiper" id="row-carousel-3">
                        <div class="swiper-wrapper">`;
                row3Ads.forEach(ad => {
                    adsHTML += `<div class="swiper-slide">${generateCardHTML(ad)}</div>`;
                });
                adsHTML += `
                        </div>
                    </div>
                    <button class="row-nav-prev row-nav-4" aria-label="Anterior"><i class="fas fa-chevron-left"></i></button>
                    <button class="row-nav-next row-nav-4" aria-label="Siguiente"><i class="fas fa-chevron-right"></i></button>
                </div>`;
            }

            // Fila 4+: Carruseles de 4 columnas para anuncios restantes (basico)
            let remainingBasicoAds = basicoAds;
            if (combinedAdsForRow3.length > 8) {
                remainingBasicoAds = [...combinedAdsForRow3.slice(8), ...basicoAds];
            }

            let rowCounter = 4;
            let basicoIndex = 0;
            while (basicoIndex < remainingBasicoAds.length) {
                const rowAds = remainingBasicoAds.slice(basicoIndex, Math.min(basicoIndex + 8, remainingBasicoAds.length));
                adsHTML += `
                <div class="carousel-row-wrapper">
                    <div class="swiper row-carousel row-4-swiper" id="row-carousel-${rowCounter}">
                        <div class="swiper-wrapper">`;
                rowAds.forEach(ad => {
                    adsHTML += `<div class="swiper-slide">${generateCardHTML(ad)}</div>`;
                });
                adsHTML += `
                        </div>
                    </div>
                    <button class="row-nav-prev row-nav-4" aria-label="Anterior"><i class="fas fa-chevron-left"></i></button>
                    <button class="row-nav-next row-nav-4" aria-label="Siguiente"><i class="fas fa-chevron-right"></i></button>
                </div>`;
                basicoIndex += rowAds.length;
                rowCounter++;
            }
            // === FIN: Lógica de renderizado ===

            container.innerHTML = adsHTML;
            
            // Limpiar cualquier elemento suelto de navegación que pueda haber quedado
            const parentSection = container.closest('#products');
            if (parentSection) {
                const orphanButtons = parentSection.querySelectorAll('button:not(.featured-prev):not(.featured-next):not(.row-nav-prev):not(.row-nav-next):not(.btn-contact)');
                orphanButtons.forEach(btn => {
                    if (!btn.closest('.box-container')) {
                        btn.remove();
                    }
                });
            }
            
            console.log("SENSOR 5: HTML de anuncios insertado en el DOM.");

            // ✅ FIJAR: Destruir Swipers previos antes de crear nuevos
            const existingSwipers = window.activeSwipers || [];
            existingSwipers.forEach(swiper => swiper.destroy());
            window.activeSwipers = [];

            // Inicializar Swiper para cada tarjeta
            document.querySelectorAll('.product-swiper').forEach(swiperEl => {
                const slides = swiperEl.querySelectorAll('.swiper-slide').length;
                const swiper = new Swiper(swiperEl, {
                    loop: slides > 1,
                    navigation: {
                        nextEl: swiperEl.querySelector('.swiper-button-next'),
                        prevEl: swiperEl.querySelector('.swiper-button-prev'),
                    },
                    pagination: {
                        el: swiperEl.querySelector('.swiper-pagination'),
                        clickable: true,
                        dynamicBullets: true,
                    },
                    slidesPerView: 1,
                    spaceBetween: 0,
                    speed: 400,
                    preloadImages: true,
                    updateOnImagesReady: true,
                    touchRatio: 1,
                    touchAngle: 45,
                    grabCursor: true,
                    simulateTouch: true,
                    resistanceRatio: 0.85,
                    allowTouchMove: true,
                    touchStartPreventDefault: false,
                    touchMoveStopPropagation: true,
                    preventClicks: false,
                    preventClicksPropagation: false,
                });
                window.activeSwipers.push(swiper);
                
                // Prevenir propagación de clicks en flechas del carrusel
                const nextBtn = swiperEl.querySelector('.swiper-button-next');
                const prevBtn = swiperEl.querySelector('.swiper-button-prev');
                if (nextBtn) nextBtn.addEventListener('click', (e) => e.stopPropagation());
                if (prevBtn) prevBtn.addEventListener('click', (e) => e.stopPropagation());
            });
            console.log("SENSOR 6: Swipers inicializados.");

            // La primera fila ya no es carrusel, es grid estático
            // initializeFeaturedCarousel();

            // Inicializar carruseles de filas
            initializeRowCarousels();

            // ✅ Agregar listeners para clicks en tarjetas (delegación de eventos)
            // Limpiar eventos anteriores completamente
            if (container._cardClickListener) {
                container.removeEventListener('click', container._cardClickListener);
                container._cardClickListener = null;
            }
            
            // El botón Contactar ahora es un enlace directo con href.
            // No necesitamos JavaScript para redirigir - el navegador lo hace automáticamente.
            // Solo prevenimos la propagación para evitar conflictos con otros elementos.
            
            container._cardClickListener = (e) => {
                // Solo responder al botón de contactar
                const btnContact = e.target.closest('.btn-contact');
                if (!btnContact) return;
                
                // No prevenimos el comportamiento por defecto - dejamos que el href funcione
                console.log('Click en Contactar - ID:', btnContact.getAttribute('data-ad-id'));
            };
            
            container.addEventListener('click', container._cardClickListener, false);

            // Inicializar likes en todas las tarjetas
            console.log('Inicializando likes en tarjetas del home...');
            try {
                initializeAllCardLikes();
                console.log('Likes inicializados correctamente en home');
            } catch (error) {
                console.error('Error inicializando likes en home:', error);
            }

            // ✅ INICIALIZAR SLIDER DE BANNERS DE ELITE
            initializeEliteSlider();

        } catch (e) {
            console.error("FALLO CRÍTICO DURANTE LA CARGA:", e);
            if(container) container.innerHTML = `<p>Ocurrió un error al cargar los anuncios. Detalles: ${e.message}</p>`;
        }
    }

    // Ejecutar la carga
    loadFeaturedAds();
}

// ✅ generateAttributesHTML importada desde utils-attributes.js

// Función para inicializar el carrusel del hero
function initializeHeroCarousel() {
    const heroSlidesContainer = document.getElementById('hero-slides');
    if (!heroSlidesContainer) {
        console.warn('Contenedor de slides del hero no encontrado');
        return;
    }

    // Imágenes por defecto para la página principal (todas las categorías)
    const defaultImages = [
        {
            src: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=600&fit=crop',
            alt: 'Casa moderna con jardín',
            title: 'Bienes Raíces'
        },
        {
            src: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&h=600&fit=crop',
            alt: 'Auto deportivo rojo',
            title: 'Vehículos'
        },
        {
            src: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&h=600&fit=crop',
            alt: 'Laptop y dispositivos tecnológicos',
            title: 'Electrónica'
        }
    ];

    // Función para cargar imágenes según la categoría
    function loadCategoryImages(category = 'all') {
        let images = [];

        switch(category) {
            case 'Bienes Raíces':
            case 'Inmuebles':
                images = [
                    {
                        src: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=600&fit=crop',
                        alt: 'Casa moderna con jardín',
                        title: 'Casas Modernas'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=600&fit=crop',
                        alt: 'Apartamento con vista a la ciudad',
                        title: 'Apartamentos'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=600&fit=crop',
                        alt: 'Terreno amplio',
                        title: 'Terrenos'
                    }
                ];
                break;

            case 'Vehículos':
            case 'Autos':
                images = [
                    {
                        src: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&h=600&fit=crop',
                        alt: 'Auto deportivo rojo',
                        title: 'Autos Deportivos'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=600&fit=crop',
                        alt: 'Camioneta familiar',
                        title: 'Camionetas'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200&h=600&fit=crop',
                        alt: 'Motocicleta deportiva',
                        title: 'Motocicletas'
                    }
                ];
                break;

            case 'Electrónica':
            case 'Tecnología':
                images = [
                    {
                        src: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&h=600&fit=crop',
                        alt: 'Laptop y dispositivos tecnológicos',
                        title: 'Laptops'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=600&fit=crop',
                        alt: 'Smartphone moderno',
                        title: 'Smartphones'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1200&h=600&fit=crop',
                        alt: 'Drone volando',
                        title: 'Drones'
                    }
                ];
                break;

            default:
                images = defaultImages;
        }

        // Generar HTML de los slides
        const slidesHTML = images.map(image => `
            <div class="swiper-slide">
                <img src="${image.src}" alt="${image.alt}" loading="lazy">
                <div class="slide-overlay">
                    <h2 class="slide-title">${image.title}</h2>
                </div>
            </div>
        `).join('');

        heroSlidesContainer.innerHTML = slidesHTML;

        // Inicializar o reinicializar Swiper
        initializeHeroSwiper();
    }

    // Función para inicializar Swiper del hero
    function initializeHeroSwiper() {
        // Destruir instancia anterior si existe
        if (window.heroSwiper) {
            window.heroSwiper.destroy();
        }

        window.heroSwiper = new Swiper('.hero-swiper', {
            loop: true,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            }
        });
    }

    // Detectar categoría de la URL o usar por defecto
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category') || 'all';

    loadCategoryImages(categoryParam);

    // Exponer función global para cambiar imágenes dinámicamente
    window.updateHeroCarousel = loadCategoryImages;

// Ejecutar solo si estamos en el index
document.addEventListener('DOMContentLoaded', () => {
  if (document.body.id === 'index-page') {
    document.querySelectorAll('.hero-swiper').forEach(swiperEl => {
      swiperEl.addEventListener('click', e => {
        e.stopPropagation();
      });
    });
  }
});
}

// Función para inicializar el carrusel de tarjetas TOP/Destacado
function initializeFeaturedCarousel() {
    const featuredSwiper = document.querySelector('.featured-swiper');
    if (!featuredSwiper) return;
    
    const swiperInstance = new Swiper('.featured-swiper', {
        slidesPerView: 2,
        slidesPerGroup: 2,
        spaceBetween: 24,
        loop: false,
        navigation: {
            nextEl: '.featured-next',
            prevEl: '.featured-prev',
        },
        pagination: {
            el: '.featured-pagination',
            clickable: true,
        },
        breakpoints: {
            0: {
                slidesPerView: 1,
                slidesPerGroup: 1,
                spaceBetween: 16,
            },
            900: {
                slidesPerView: 2,
                slidesPerGroup: 2,
                spaceBetween: 24,
            }
        },
        on: {
            init: function() {
                updateArrowsVisibility(this);
            },
            slideChange: function() {
                updateArrowsVisibility(this);
            }
        }
    });
    
    function updateArrowsVisibility(swiper) {
        const prevBtn = document.querySelector('.featured-prev');
        const nextBtn = document.querySelector('.featured-next');
        
        // Si todas las slides caben en la vista, ocultar ambas flechas
        const totalSlides = swiper.slides.length;
        const slidesPerView = swiper.params.slidesPerView;
        
        if (totalSlides <= slidesPerView) {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            return;
        }
        
        if (prevBtn) {
            if (swiper.isBeginning) {
                prevBtn.style.display = 'none';
            } else {
                prevBtn.style.display = 'flex';
            }
        }
        
        if (nextBtn) {
            if (swiper.isEnd) {
                nextBtn.style.display = 'none';
            } else {
                nextBtn.style.display = 'flex';
            }
        }
    }
    
    console.log("Carrusel de tarjetas TOP/Destacado inicializado");
}

// Función para inicializar los carruseles de filas de tarjetas
function initializeRowCarousels() {
    // Inicializar carruseles de 3 columnas
    document.querySelectorAll('.row-3-swiper').forEach((swiperEl, index) => {
        const wrapper = swiperEl.closest('.carousel-row-wrapper');
        const prevBtn = wrapper?.querySelector('.row-nav-prev');
        const nextBtn = wrapper?.querySelector('.row-nav-next');
        
        const swiperInstance = new Swiper(swiperEl, {
            slidesPerView: 3,
            slidesPerGroup: 1,
            spaceBetween: 24,
            loop: false,
            navigation: {
                nextEl: nextBtn,
                prevEl: prevBtn,
            },
            breakpoints: {
                0: {
                    slidesPerView: 1,
                    spaceBetween: 16,
                },
                768: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 24,
                }
            }
        });
    });
    
    // Inicializar carruseles de 4 columnas
    document.querySelectorAll('.row-4-swiper').forEach((swiperEl, index) => {
        const wrapper = swiperEl.closest('.carousel-row-wrapper');
        const prevBtn = wrapper?.querySelector('.row-nav-prev');
        const nextBtn = wrapper?.querySelector('.row-nav-next');
        
        // Crear contenedor de paginación si no existe
        let paginationEl = wrapper?.querySelector('.swiper-pagination');
        if (!paginationEl && wrapper) {
            paginationEl = document.createElement('div');
            paginationEl.className = 'swiper-pagination row-carousel-pagination';
            wrapper.appendChild(paginationEl);
        }
        
        const swiperInstance = new Swiper(swiperEl, {
            slidesPerView: 1,
            slidesPerGroup: 1,
            spaceBetween: 20,
            loop: false,
            touchMove: true,
            touchRatio: 1,
            resistance: true,
            resistanceRatio: 0.85,
            grabCursor: true,
            centeredSlides: false,
            navigation: {
                nextEl: nextBtn,
                prevEl: prevBtn,
            },
            pagination: {
                el: paginationEl,
                clickable: true,
                dynamicBullets: false,
            },
            breakpoints: {
                640: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                },
                1100: {
                    slidesPerView: 3,
                    spaceBetween: 20,
                }
            }
        });
    });
    
    console.log("Carruseles de filas de tarjetas inicializados");
}

// =====================================================
// === SLIDER DE BANNERS DE ELITE ===
// Rotación automática con transiciones de fundido
// Soporte para video e imágenes
// =====================================================
function initializeEliteSlider() {
    const sliderWrapper = document.getElementById('elite-slider');
    if (!sliderWrapper) {
        console.log('No hay slider de elite en esta página');
        return;
    }

    const slides = sliderWrapper.querySelectorAll('.elite-banner-slide');
    const progressBars = sliderWrapper.querySelectorAll('.elite-progress-bar');
    const prevBtn = sliderWrapper.querySelector('.elite-slider-nav.prev');
    const nextBtn = sliderWrapper.querySelector('.elite-slider-nav.next');
    
    if (slides.length <= 1) {
        console.log('Solo hay un slide, no se necesita rotación');
        // Asegurar que el video se reproduzca si es el único slide
        const video = slides[0]?.querySelector('.elite-video-bg');
        if (video) {
            video.play().catch(e => console.log('Autoplay de video bloqueado:', e));
        }
        return;
    }

    let currentSlide = 0;
    let autoPlayInterval = null;
    let isPaused = false;
    const SLIDE_DURATION = 6000; // 6 segundos es el punto dulce entre leer y aburrirse
    const TRANSITION_SPEED = 800; // Hace que el cambio sea "sedoso"

    // === FUNCIÓN PARA MANEJAR VIDEOS ===
    function handleVideoPlayback(slideIndex, play) {
        const slide = slides[slideIndex];
        if (!slide) return;
        
        const video = slide.querySelector('.elite-video-bg');
        if (video) {
            if (play) {
                video.currentTime = 0; // Reiniciar video
                video.play().catch(e => console.log('Autoplay de video bloqueado:', e));
            } else {
                video.pause();
            }
        }
    }

    // Función para ir a un slide específico
    function goToSlide(index) {
        // Pausar video del slide actual
        handleVideoPlayback(currentSlide, false);
        
        // Remover clase active del slide actual
        slides[currentSlide].classList.remove('active');
        if (progressBars[currentSlide]) {
            progressBars[currentSlide].classList.remove('active');
            progressBars[currentSlide].classList.add('completed');
            // Resetear la animación
            const fill = progressBars[currentSlide].querySelector('.progress-fill');
            if (fill) fill.style.width = '0%';
        }

        // Calcular nuevo índice
        currentSlide = index;
        if (currentSlide >= slides.length) currentSlide = 0;
        if (currentSlide < 0) currentSlide = slides.length - 1;

        // Añadir clase active al nuevo slide
        slides[currentSlide].classList.add('active');
        if (progressBars[currentSlide]) {
            progressBars[currentSlide].classList.remove('completed');
            progressBars[currentSlide].classList.add('active');
        }
        
        // Reproducir video del nuevo slide
        handleVideoPlayback(currentSlide, true);

        console.log(`Slider Elite: Mostrando slide ${currentSlide + 1} de ${slides.length}`);
    }

    // Función para avanzar al siguiente slide
    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    // Función para retroceder al slide anterior
    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    // Iniciar reproducción automática
    function startAutoPlay() {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        
        // Activar el primer progress bar
        if (progressBars[currentSlide]) {
            progressBars[currentSlide].classList.add('active');
        }
        
        // Reproducir video del slide actual
        handleVideoPlayback(currentSlide, true);

        autoPlayInterval = setInterval(() => {
            if (!isPaused) {
                nextSlide();
            }
        }, SLIDE_DURATION);
    }

    // Pausar/reanudar al hacer hover
    sliderWrapper.addEventListener('mouseenter', () => {
        isPaused = true;
        // Pausar animación de progress bar
        progressBars.forEach(bar => {
            const fill = bar.querySelector('.progress-fill');
            if (fill) fill.style.animationPlayState = 'paused';
        });
        // Pausar video actual
        handleVideoPlayback(currentSlide, false);
    });

    sliderWrapper.addEventListener('mouseleave', () => {
        isPaused = false;
        // Reanudar animación de progress bar
        progressBars.forEach(bar => {
            const fill = bar.querySelector('.progress-fill');
            if (fill) fill.style.animationPlayState = 'running';
        });
        // Reanudar video actual
        handleVideoPlayback(currentSlide, true);
    });

    // Navegación con flechas
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            prevSlide();
            startAutoPlay(); // Reiniciar el timer
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            nextSlide();
            startAutoPlay(); // Reiniciar el timer
        });
    }

    // Navegación con indicadores de progreso
    progressBars.forEach((bar, index) => {
        bar.addEventListener('click', (e) => {
            e.stopPropagation();
            goToSlide(index);
            startAutoPlay(); // Reiniciar el timer
        });
    });

    // Soporte para swipe táctil
    let touchStartX = 0;
    let touchEndX = 0;

    sliderWrapper.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    sliderWrapper.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextSlide(); // Swipe izquierda
            } else {
                prevSlide(); // Swipe derecha
            }
            startAutoPlay();
        }
    }

    // Navegación con teclado
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
            startAutoPlay();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            startAutoPlay();
        }
    });

    // Iniciar reproducción automática
    startAutoPlay();
    console.log(`Slider de Elite inicializado con ${slides.length} slides`);
}

// Función para actualizar el carrusel cuando se cambia de categoría
export function updateHeroForCategory(categoryName) {
    if (window.updateHeroCarousel) {
        window.updateHeroCarousel(categoryName);
    }
}
