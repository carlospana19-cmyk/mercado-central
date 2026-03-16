// home-logic.js - VERSIÓN DE DIAGNÓSTICO

import { supabase } from './supabase-client.js';
import { generateAttributesHTML, UIComponents, cleanLocationString } from './UIComponents.js';
import { generateLikeButtonHTML, initializeAllCardLikes } from './likes-logic.js';
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
            // ✅ CARGAR SOLO ANUNCIOS DESTACADOS PARA LA PÁGINA PRINCIPAL
            // Solo mostramos anuncios Destacados en la sección Recién Agregado
            let { data: premiumAds, error: premiumError } = await supabase
                .from('anuncios')
                .select('*, imagenes(url_imagen), profiles(id, nombre_negocio, url_foto_perfil, nombre_completo)')
                .eq('featured_plan', 'destacado')
                .order('created_at', { ascending: false })
                .limit(100);

            if (premiumError) throw premiumError;

            // No cargamos anuncios de otros planes (premium, basico, gratis, free) en el Index
            // Solo anuncios Destacados tienen derecho a la sección Recién Agregado
            let ads = premiumAds || [];

            // ✅ Si la columna is_sold no existe, intentar sin el filtro
            if (premiumError && premiumError.code === '42703') {
                console.warn('⚠️ Columna is_sold no existe. Mostrando todos los anuncios Destacados.');
                const { data: adsWithoutFilter, error: error2 } = await supabase
                    .from('anuncios')
                    .select('*, profiles(id, nombre_negocio, url_foto_perfil, nombre_completo)')
                    .eq('featured_plan', 'destacado')
                    .order('created_at', { ascending: false })
                    .limit(20);
                ads = adsWithoutFilter || [];
                premiumError = error2;
            }

            if (premiumError) throw premiumError;

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

            // === FUNCIÓN PARA GENERAR SLIDE DE BANNER ELITE ===
            const generateEliteSlideHTML = (ad, index) => {
                // Fallback unificado de imagen
                let mainImage = null;
                if (ad.imagen_portada) {
                    mainImage = ad.imagen_portada;
                } else if (ad.imagenes && ad.imagenes[0]?.url_imagen) {
                    mainImage = ad.imagenes[0].url_imagen;
                } else if (ad.url_portada) {
                    mainImage = ad.url_portada;
                } else if (Array.isArray(ad.url_galeria) && ad.url_galeria.length > 0) {
                    mainImage = ad.url_galeria[0];
                } else {
                    mainImage = 'https://via.placeholder.com/800x400?text=Sin+Imagen';
                }
                const priceFormatted = new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(ad.precio);
                
                const vendorProfile = ad.profiles ? (Array.isArray(ad.profiles) ? ad.profiles[0] : ad.profiles) : null;
                const vendorPhoto = vendorProfile?.url_foto_perfil;
                const vendorName = vendorProfile?.nombre_negocio || 'Vendedor';
                const vendorId = vendorProfile?.id;
                
                const vendorStats = vendorId ? (sellerStatsMap[vendorId] || { total_reviews: 0, average_rating: 0 }) : { total_reviews: 0, average_rating: 0 };
                const starsDisplay = vendorStats.total_reviews > 0 
                    ? `<i class="fas fa-star"></i> ${vendorStats.average_rating.toFixed(1)} (${vendorStats.total_reviews})`
                    : '<span class="no-reviews">Sin reseñas</span>';
                
                const attributesHTML = generateAttributesHTML(ad.atributos_clave, ad.categoria, ad.atributos_clave?.subcategoria);
                const attributeMatches = attributesHTML.match(/<span[^>]*>.*?<\/span>/g) || [];
                const eliteAttributes = attributeMatches.slice(0, 4).map(attr => {
                    return attr.replace(/class="[^"]*"/, 'class="elite-attribute"');
                }).join('');
                
                const urgentBadge = ad.enhancements?.is_urgent 
                    ? '<span class="elite-badge-urgent"><i class="fas fa-bolt"></i> URGENTE</span>' 
                    : '';
                
                const soldBadge = ad.is_sold 
                    ? '<span class="elite-badge-sold"><i class="fas fa-check-circle"></i> VENDIDO</span>' 
                    : '';
                
                const soldClass = ad.is_sold ? 'elite-banner-sold' : '';
                const activeClass = index === 0 ? 'active' : '';
                
                const videoUrl = ad.url_video;
                const isVideo = videoUrl && (videoUrl.includes('.mp4') || videoUrl.includes('.webm') || videoUrl.includes('.mov'));
                
                const sponsoredTag = ad.is_sponsored 
                    ? '<span class="sponsored-tag"><i class="fas fa-ad"></i> Patrocinado</span>' 
                    : '';
                
                const organicTag = !ad.is_sponsored && ad.featured_plan === 'top'
                    ? '<span class="organic-tag"><i class="fas fa-check-circle"></i> Verificado</span>'
                    : '';
                
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
                    <div class="elite-banner ${soldClass}" data-ad-id="${ad.id}">
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
                                ${cleanLocationString(ad.corregimiento ? ad.corregimiento + ', ' : '' + (ad.distrito || ad.ubicacion || '') + ', ' + (ad.provincia || 'N/A'))}
                            </div>
                            <div class="elite-banner-attributes">
                                ${eliteAttributes}
                            </div>
                            <div class="elite-banner-seller">
                                <div class="elite-seller-avatar ${vendorPhoto ? 'has-image' : ''}">
                                    ${vendorPhoto ? `<img src="${vendorPhoto}" alt="${vendorName}">` : ''}
                                </div>
                                <div class="elite-seller-info">
                                    <span class="elite-seller-name">${vendorName}</span>
                                    <span class="elite-seller-rating">${starsDisplay}</span>
                                </div>
                            </div>
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

            const generateCardHTML = (ad) => {
                // Fallback unificado de imagen
                let allImages = [];
                if (ad.imagen_portada) {
                    allImages = [ad.imagen_portada];
                } else if (ad.imagenes && ad.imagenes[0]?.url_imagen) {
                    allImages = [ad.imagenes[0].url_imagen, ...(ad.url_galeria || [])];
                } else if (ad.url_portada) {
                    allImages = [ad.url_portada, ...(ad.url_galeria || [])];
                } else if (Array.isArray(ad.url_galeria)) {
                    allImages = ad.url_galeria;
                }
                allImages = allImages.filter(Boolean);
                const priceFormatted = new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(ad.precio);
                const videoEmbedUrl = getVideoEmbedUrl(ad.url_video);
                
                const cardClass = 'property-card';
                
                // ✅ BADGES ELIMINADOS - Ahora usamos section-header como separador elegante
                let badgeHTML = '';
                let cardExtraClass = '';

                // === LÓGICA DE BADGES CON CORONAS SEGÚN EL PLAN ===
                const plan = ad.featured_plan ? ad.featured_plan.toLowerCase() : 'free';
                let crownBadgeHTML = '';
                
                if (plan === 'basico') {
                    crownBadgeHTML = `<div class="card-crown-badge"><i class="fas fa-crown crown-bronze"></i></div>`;
                } else if (plan === 'premium') {
                    crownBadgeHTML = `<div class="card-crown-badge"><i class="fas fa-crown crown-silver"></i></div>`;
                } else if (plan === 'top' || plan === 'destacado') {
                    crownBadgeHTML = `<div class="card-crown-badge"><i class="fas fa-crown crown-gold"></i></div>`;
                } else if (plan === 'elite') {
                    crownBadgeHTML = `<div class="card-crown-badge"><i class="fas fa-gem crown-diamond"></i></div>`;
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
                
                // Avatar del vendedor - SIEMPRE mostrar (con foto o placeholder)
                const vendorProfile = ad.profiles ? (Array.isArray(ad.profiles) ? ad.profiles[0] : ad.profiles) : null;
                const vendorPhoto = vendorProfile?.url_foto_perfil;
                const vendorName = vendorProfile?.nombre_negocio || 'Usuario';
                const vendorFullName = vendorProfile?.nombre_completo || '';
                const vendorId = vendorProfile?.id;
                
                // ✅ Obtener estadísticas de reseñas del vendedor
                const vendorStats = vendorId ? (sellerStatsMap[vendorId] || { total_reviews: 0, average_rating: 0 }) : { total_reviews: 0, average_rating: 0 };
                const starsDisplay = vendorStats.total_reviews > 0 
                    ? `<span class="vendor-rating"><i class="fas fa-star"></i> ${vendorStats.average_rating.toFixed(1)} (${vendorStats.total_reviews})</span>`
                    : '';
                
                // ✅ Avatar: invisible por defecto (visibility: hidden), solo visible si hay foto (clase .has-image)
                const vendorAvatar = vendorPhoto 
                    ? `<div class="vendor-avatar has-image" title="${vendorName}">
                        <img src="${vendorPhoto}" alt="${vendorName}" class="vendor-avatar-img">
                        <span class="vendor-name-tooltip">${vendorName}${starsDisplay ? '<br>' + starsDisplay : ''}</span>
                    </div>` 
                    : `<div class="vendor-avatar" title="${vendorName}"></div>`;

                // ✅ Agregar data-category para filtrado en tiempo real
                const dataCategory = ad.categoria ? `data-category="${ad.categoria}"` : '';

                return `
                    <div class="${cardClass} card ${cardExtraClass} ${soldClass}" ${dataAdId} ${dataCategory}>
                       ${crownBadgeHTML}
                         ${urgentBadge}
                         ${soldBadgeHome}
                         <div class="card-actions">
                            ${generateLikeButtonHTML(ad.id, 0, false)}
                         </div>
                         <div class="property-image ${ad.is_sold ? 'image-sold' : ''}">
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
                        <div class="property-details ${ad.is_sold ? 'content-sold' : ''}">
                            <div class="property-seller-name">${ad.contact_name || vendorFullName || vendorName || 'Usuario Verificado'}</div>
                            <div class="property-price-and-tag">
                                <span class="property-price">${priceFormatted}</span>
                                ${vendorAvatar}
                            </div>
                            <h3 class="property-title">${ad.titulo}</h3>
                            <p class="property-location"><i class="fas fa-map-marker-alt"></i> ${cleanLocationString(ad.direccion_exacta || (ad.corregimiento ? ad.corregimiento + ', ' : '') + (ad.distrito || ad.ubicacion || '') + ', ' + (ad.provincia || 'N/A'))}</p>
                            ${(() => {
                                const attrHTML = generateAttributesHTML(ad.atributos_clave, ad.categoria, ad.atributos_clave?.subcategoria);
                                // Solo creamos el contenedor si attrHTML tiene contenido real
                                return attrHTML && attrHTML !== '' && attrHTML !== '<span></span>' 
                                    ? `<div class="property-specs">${attrHTML}</div>` 
                                    : ''; 
                            })()}
                            ${profilePhotoHTML}
                            <a href="detalle-producto.html?id=${ad.id}&chat=true" class="btn-contact" data-ad-id="${ad.id}">Contactar</a>
                        </div>
                    </div>`;
            };

            // --- EL EMBUDO DE CASCADA PERFECTA ---

            // 1. Traemos 100 anuncios de Supabase (o más)
            const allGoldAds = (premiumAds || []).sort((a, b) => {
                const dateA = new Date(a.created_at || a.fecha_publicacion || 0);
                const dateB = new Date(b.created_at || b.fecha_publicacion || 0);
                return dateB - dateA; // Los más recientes primero
            });

            // Nivel 1: BANNER PRINCIPAL (Los 5 más recientes)
            const bannerAds = allGoldAds.slice(0, 5);

            // Nivel 2: CUADRÍCULA DE IMPACTO (Los siguientes 6)
            const gridAds = allGoldAds.slice(5, 11);

            // Nivel 3: LOS CARRUSELES (A partir del 11 en adelante)
            const adsForCarousels = allGoldAds.slice(11);

            // Filtramos por categoría
            const vehiculosAll = adsForCarousels.filter(ad => ['Vehículos', 'Autos', 'Motos'].includes(ad.categoria));
            const inmueblesAll = adsForCarousels.filter(ad => ['Inmuebles', 'Bienes Raíces'].includes(ad.categoria));
            const destacadosAll = adsForCarousels.filter(ad => !['Vehículos', 'Autos', 'Motos', 'Inmuebles', 'Bienes Raíces'].includes(ad.categoria));

            // Llenamos los carruseles (MÁXIMO 15)
            const carruselVehiculos = vehiculosAll.slice(0, 15);
            const carruselInmuebles = inmueblesAll.slice(0, 15);
            const carruselDestacados = destacadosAll.slice(0, 15);

            // === RENDER FASE 1: BANNER ELITE ===
            if (bannerAds.length > 0) {
                const hasMultipleSlides = bannerAds.length > 1;

                adsHTML += `
                <div class="main-content-wrapper">
                    <div class="elite-banner-container">
                        <div class="elite-banner-label">
                            <span class="elite-label-text"><i class="fas fa-crown"></i> Recién Agregado</span>
                            <div class="elite-label-line"></div>
                        </div>
                        <div class="elite-slider-wrapper" id="elite-slider">
                            ${bannerAds.map((ad, index) => generateEliteSlideHTML(ad, index)).join('')}
                            ${hasMultipleSlides ? `
                                <button class="elite-slider-nav prev" aria-label="Anterior"><i class="fas fa-chevron-left"></i></button>
                                <button class="elite-slider-nav next" aria-label="Siguiente"><i class="fas fa-chevron-right"></i></button>
                                <div class="elite-progress-indicators">${generateProgressIndicators(bannerAds.length)}</div>
                            ` : ''}
                        </div>
                    </div>`;
            }

            // === RENDER FASE 2: COLUMNAS DE IMPACTO (6 tarjetas) ===
            if (gridAds && gridAds.length > 0) {
                // Fila 1 de impacto (3 tarjetas)
                const row1Ads = gridAds.slice(0, 3);
                if (row1Ads.length > 0) {
                    adsHTML += `<div class="ads-row row-3-cols">${row1Ads.map(ad => generateCardHTML(ad)).join('')}</div>`;
                }
                // Cerramos el main-content-wrapper si se abrió en el banner
                if (bannerAds.length > 0) {
                    adsHTML += `</div>`;
                }

                // Fila 2 de impacto (3 tarjetas)
                const row2Ads = gridAds.slice(3, 6);
                if (row2Ads.length > 0) {
                    adsHTML += `<div class="ads-row row-3-cols">${row2Ads.map(ad => generateCardHTML(ad)).join('')}</div>`;
                }
            } else if (bannerAds.length > 0) {
                // Si hay banner pero no grid, cerramos el wrapper
                adsHTML += `</div>`;
            }

            // === RENDER CARRUSEL VEHÍCULOS (Máximo 15) ===
            if (carruselVehiculos.length > 0) {
                adsHTML += `
                <div class="section-header-golden">
                    <div class="header-line-golden"></div>
                    <h2 class="header-title-golden">VEHÍCULOS DESTACADOS</h2>
                    <div class="header-line-golden"></div>
                </div>
                <div class="carousel-row-wrapper">
                    <div class="swiper row-carousel row-4-swiper" id="row-carousel-vehiculos">
                        <div class="swiper-wrapper">
                            ${carruselVehiculos.map(ad => `<div class="swiper-slide">${generateCardHTML(ad)}</div>`).join('')}
                        </div>
                    </div>
                    <button class="row-nav-prev row-nav-4" aria-label="Anterior"><i class="fas fa-chevron-left"></i></button>
                    <button class="row-nav-next row-nav-4" aria-label="Siguiente"><i class="fas fa-chevron-right"></i></button>
                </div>`;
            }

            // === RENDER CARRUSEL INMUEBLES (Máximo 15) ===
            if (carruselInmuebles.length > 0) {
                adsHTML += `
                <div class="section-header-golden">
                    <div class="header-line-golden"></div>
                    <h2 class="header-title-golden">BIENES RAÍCES DESTACADOS</h2>
                    <div class="header-line-golden"></div>
                </div>
                <div class="carousel-row-wrapper">
                    <div class="swiper row-carousel row-4-swiper" id="row-carousel-inmuebles">
                        <div class="swiper-wrapper">
                            ${carruselInmuebles.map(ad => `<div class="swiper-slide">${generateCardHTML(ad)}</div>`).join('')}
                        </div>
                    </div>
                    <button class="row-nav-prev row-nav-4" aria-label="Anterior"><i class="fas fa-chevron-left"></i></button>
                    <button class="row-nav-next row-nav-4" aria-label="Siguiente"><i class="fas fa-chevron-right"></i></button>
                </div>`;
            }

            // === RENDER CARRUSEL MÁS DESTACADOS (Máximo 15) ===
            if (carruselDestacados.length > 0) {
                adsHTML += `
                <div class="section-header-golden">
                    <div class="header-line-golden"></div>
                    <h2 class="header-title-golden">MÁS DESTACADOS</h2>
                    <div class="header-line-golden"></div>
                </div>
                <div class="carousel-row-wrapper">
                    <div class="swiper row-carousel row-4-swiper" id="row-carousel-premium">
                        <div class="swiper-wrapper">
                            ${carruselDestacados.map(ad => `<div class="swiper-slide">${generateCardHTML(ad)}</div>`).join('')}
                        </div>
                    </div>
                    <button class="row-nav-prev row-nav-4" aria-label="Anterior"><i class="fas fa-chevron-left"></i></button>
                    <button class="row-nav-next row-nav-4" aria-label="Siguiente"><i class="fas fa-chevron-right"></i></button>
                </div>`;
            }

            // === FIN: Lógica de renderizado ===

            container.innerHTML = adsHTML;

            // Destruir swipers anteriores
            const existingSwipers = window.activeSwipers || [];
            existingSwipers.forEach(swiper => swiper.destroy());
            window.activeSwipers = [];

            // Inicializar Swiper para cada tarjeta (carrusel individual de imágenes)
            document.querySelectorAll('.product-swiper').forEach(swiperEl => {
                const slides = swiperEl.querySelectorAll('.swiper-slide').length;
                // Solo inicializar si hay más de 1 slide (necesario para carrusel)
                if (slides > 1) {
                    const swiper = new Swiper(swiperEl, {
                        // CARRUSEL INDIVIDUAL: 1 imagen a la vez
                        slidesPerView: 1,
                        slidesPerGroup: 1,
                        spaceBetween: 0,
                        loop: false,
                        centeredSlides: false,
                        rewind: false,
                        watchOverflow: true,
                        effect: 'slide', // Efecto de deslizamiento
                        watchSlidesProgress: true,
                        // Habilitar swipe táctil para móviles
                        allowTouchMove: true,
                        touchRatio: 1,
                        touchAngle: 45,
                        grabCursor: true,
                        simulateTouch: true,
                        navigation: {
                            nextEl: swiperEl.querySelector('.swiper-button-next'),
                            prevEl: swiperEl.querySelector('.swiper-button-prev'),
                        },
                        pagination: {
                            el: swiperEl.querySelector('.swiper-pagination'),
                            clickable: true,
                            dynamicBullets: true,
                        },
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
                }
            });
            console.log("SENSOR 6: Swipers inicializados.");

            // La primera fila ya no es carrusel, es grid estático
            // initializeFeaturedCarousel();

            // Inicializar carruseles de filas
            initializeRowCarousels();
            
            // ✅ Recalcular espacios vacíos al cambiar el tamaño de ventana
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    // Actualizar Swiper
                    document.querySelectorAll('.row-carousel').forEach(el => {
                        if (el.swiper) el.swiper.update();
                    });
                }, 250);
            });

            // ✅ Agregar listeners para clicks en tarjetas (delegación de eventos)
            // Limpiar eventos anteriores completamente
            if (container._cardClickListener) {
                container.removeEventListener('click', container._cardClickListener);
                container._cardClickListener = null;
            }
            
            // El botón Contactar ahora es un enlace directo con href.
            // No necesitamos JavaScript para redirigir - el navegador lo hace automáticamente.
            // Solo prevenimos el comportamiento por defecto si es necesario
            container._cardClickListener = (e) => {
                // Si hace click en el botón de contactar, dejar que el href funcione normalmente
                const btnContact = e.target.closest('.btn-contact');
                if (btnContact) {
                    console.log('Click en Contactar - ID:', btnContact.getAttribute('data-ad-id'));
                    return; // No prevenimos el comportamiento
                }
                
                // Si hace click en el botón de like, permitir que funcione
                const btnLike = e.target.closest('.like-button, .btn-like');
                if (btnLike) {
                    return; // No prevenimos el comportamiento
                }
                
                // Si hace click en las flechas del carrusel, permitir que funcionen
                const carouselNav = e.target.closest('.swiper-button-next, .swiper-button-prev');
                if (carouselNav) {
                    return;
                }
                
                // Para cualquier otro elemento de la tarjeta, NO redirigir - solo el botón Contactar debe hacerlo
                // La tarjeta en sí ya no es clickeable
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

            // === INICIALIZAR CARRUSELES DE FILAS ===
            // Opciones base para los carruseles de 4 columnas (Efecto asomado 1.2 en móvil)
            const createSwiperOptions = (slideCount) => {
                const minSlidesForLoop = 5;
                const shouldLoop = slideCount >= minSlidesForLoop;
                
                return {
                    slidesPerView: 1.2,
                    spaceBetween: 15,
                    loop: shouldLoop,
                    loopAdditionalSlides: shouldLoop ? 3 : 0,
                    watchOverflow: !shouldLoop,
                    breakpoints: {
                        640: { slidesPerView: 2.2, spaceBetween: 20 },
                        768: { slidesPerView: 3, spaceBetween: 20 },
                        1024: { slidesPerView: 4, spaceBetween: 25 },
                    }
                };
            };

            // Inicializar Vehículos
            if (document.querySelector('#row-carousel-vehiculos')) {
                const vehiculosSwiperEl = document.querySelector('#row-carousel-vehiculos');
                const vehiculosWrapper = vehiculosSwiperEl.closest('.carousel-row-wrapper');
                const vehiculosSlides = vehiculosSwiperEl.querySelectorAll('.swiper-slide').length;
                new Swiper('#row-carousel-vehiculos', {
                    ...createSwiperOptions(vehiculosSlides),
                    navigation: {
                        nextEl: vehiculosWrapper.querySelector('.row-nav-next'),
                        prevEl: vehiculosWrapper.querySelector('.row-nav-prev'),
                    }
                });
            }

            // Inicializar Bienes Raíces
            if (document.querySelector('#row-carousel-inmuebles')) {
                const inmueblesSwiperEl = document.querySelector('#row-carousel-inmuebles');
                const inmueblesWrapper = inmueblesSwiperEl.closest('.carousel-row-wrapper');
                const inmueblesSlides = inmueblesSwiperEl.querySelectorAll('.swiper-slide').length;
                new Swiper('#row-carousel-inmuebles', {
                    ...createSwiperOptions(inmueblesSlides),
                    navigation: {
                        nextEl: inmueblesWrapper.querySelector('.row-nav-next'),
                        prevEl: inmueblesWrapper.querySelector('.row-nav-prev'),
                    }
                });
            }

            // Inicializar Selección Premium
            if (document.querySelector('#row-carousel-premium')) {
                const premiumSwiperEl = document.querySelector('#row-carousel-premium');
                const premiumWrapper = premiumSwiperEl.closest('.carousel-row-wrapper');
                const premiumSlides = premiumSwiperEl.querySelectorAll('.swiper-slide').length;
                new Swiper('#row-carousel-premium', {
                    ...createSwiperOptions(premiumSlides),
                    navigation: {
                        nextEl: premiumWrapper.querySelector('.row-nav-next'),
                        prevEl: premiumWrapper.querySelector('.row-nav-prev'),
                    }
                });
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
            loop: false,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
                stopOnLastSlide: true,
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
        slidesPerView: 'auto',
        slidesPerGroup: 1,
        spaceBetween: 12,
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
            // ✅ CARRUSEL FINITO CON AUTO
            loop: false,
            slidesPerView: 'auto',
            slidesPerGroup: 1,
            spaceBetween: 12,
            navigation: {
                nextEl: nextBtn,
                prevEl: prevBtn,
            },
            breakpoints: {
                0: {
                    slidesPerView: 1,
                    spaceBetween: 12,
                },
                768: {
                    slidesPerView: 2,
                    spaceBetween: 12,
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 12,
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
            // ✅ CARRUSEL FINITO - Sin loop, muestra todos los slides
            slidesPerView: 'auto',
            slidesPerGroup: 1,
            spaceBetween: 12,
            loop: false,
            centeredSlides: false,
            watchOverflow: true,
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
                480: {
                    slidesPerView: 1,
                    spaceBetween: 12
                },
                768: {
                    slidesPerView: 2,
                    spaceBetween: 12
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 20
                },
                1400: {
                    slidesPerView: 4,
                    spaceBetween: 25
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

/**
 * Mueve el carrusel SIN loop - tope con pared
 * @param {string} direction - 'next' o 'prev'
 * @param {string} trackId - ID del contenedor de las tarjetas
 */
export function navigateCarousel(direction, trackId) {
    const track = document.getElementById(trackId);
    if (!track) {
        console.warn(`No se encontró el elemento con ID: ${trackId}`);
        return;
    }
    
    // Calcula cuánto deslizar (el ancho visible del contenedor)
    const scrollAmount = track.clientWidth; 
    
    if (direction === 'next') {
        // Solo avanza. Si topa al final, la función scrollBy simplemente se detiene.
        // ¡Se acabó el efecto de volver a empezar!
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    } else {
        // Solo retrocede. Si topa al inicio, se queda ahí.
        track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
}

// Hacer la función disponible globalmente para uso en onclick
export function initCarouselNavigation() {
    // Asignar la función al objeto window para uso global
    window.navigateCarousel = navigateCarousel;
    console.log('Navegación de carrusel inicializada');
}
