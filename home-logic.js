// home-logic.js - VERSIÓN DE DIAGNÓSTICO

import { supabase } from './supabase-client.js';
import { generateAttributesHTML } from './utils-attributes.js';

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
                .select('*, imagenes(url_imagen), profiles(nombre_negocio, url_foto_perfil)')
                .in('featured_plan', ['top', 'destacado'])
                .order('fecha_publicacion', { ascending: false })
                .limit(10);

            if (premiumError) throw premiumError;

            // ✅ CARGAR RESTO DE ANUNCIOS (premium, basico) para otras filas
            let { data: regularAds, error } = await supabase
                .from('anuncios')
                .select('*, imagenes(url_imagen), profiles(nombre_negocio, url_foto_perfil)')
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
                    .select('*, profiles(nombre_negocio, url_foto_perfil)')
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

            // === INICIO: Lógica de renderizado por filas personalizadas ===
            let adsHTML = '';
            let processedAds = 0;

            // Función para convertir URL de YouTube/Vimeo a embed
            const getVideoEmbedUrl = (videoUrl) => {
                if (!videoUrl) return null;
                
                // YouTube
                const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
                const youtubeMatch = videoUrl.match(youtubeRegex);
                if (youtubeMatch) {
                    return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`;
                }
                
                // Vimeo
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
                const vendorAvatar = vendorPhoto ? `<div class="vendor-avatar" title="${vendorName}">
                    <img src="${vendorPhoto}" alt="${vendorName}" class="vendor-avatar-img">
                    <span class="vendor-name-tooltip">${vendorName}</span>
                </div>` : '';

                return `
                    <div class="${cardClass} card ${cardExtraClass} ${soldClass}" ${dataAdId} style="${ad.is_sold ? 'cursor: not-allowed;' : 'cursor: pointer;'}">
                       ${badgeHTML}
                         ${urgentBadge}
                         ${soldBadgeHome}
                         <div class="image-container ${ad.is_sold ? 'image-sold' : ''}">
                            <div class="swiper product-swiper" id="swiper-${ad.id}">
                                <div class="swiper-wrapper">
                                    ${videoEmbedUrl ? `<div class="swiper-slide"><iframe src="${videoEmbedUrl}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius: 8px;"></iframe></div>` : ''}
                                    ${allImages.length > 0 ? allImages.map(img => `<div class="swiper-slide"><img src="${img}" alt="${ad.titulo}" loading="lazy"></div>`).join('') : ''}
                                </div>
                                <div class="swiper-button-prev"></div>
                                <div class="swiper-button-next"></div>
                                <div class="swiper-pagination"></div>
                            </div>
                        </div>
                        <div class="content ${ad.is_sold ? 'content-sold' : ''}">
                            <div class="price">${priceFormatted}</div>
                            <h3>${ad.titulo}</h3>
                            <div class="location"><i class="fas fa-map-marker-alt"></i> ${ad.provincia || 'N/A'}</div>
                            <div class="description-with-avatar">
                                <div class="description">${ad.descripcion || ''}</div>
                                ${vendorAvatar}
                            </div>
                            ${generateAttributesHTML(ad.atributos_clave, ad.categoria)}
                            ${profilePhotoHTML}
                            <a href="#" class="btn-contact">Contactar</a>
                        </div>
                    </div>`;
            };

            // Fila 1: 2 columnas
            if (processedAds < ads.length) {
                const rowAds = ads.slice(processedAds, processedAds + 2);
                adsHTML += '<div class="ads-row row-2-cols">';
                adsHTML += rowAds.map(generateCardHTML).join('');
                adsHTML += '</div>';
                processedAds += rowAds.length;
            }

            // Fila 2: 3 columnas
            if (processedAds < ads.length) {
                const rowAds = ads.slice(processedAds, processedAds + 3);
                adsHTML += '<div class="ads-row row-3-cols">';
                adsHTML += rowAds.map(generateCardHTML).join('');
                adsHTML += '</div>';
                processedAds += rowAds.length;
            }

            // Filas restantes: 4 columnas
            while (processedAds < ads.length) {
                const rowAds = ads.slice(processedAds, processedAds + 4);
                adsHTML += '<div class="ads-row row-4-cols">';
                adsHTML += rowAds.map(generateCardHTML).join('');
                adsHTML += '</div>';
                processedAds += rowAds.length;
            }
            // === FIN: Lógica de renderizado ===

            container.innerHTML = adsHTML;
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
                });
                window.activeSwipers.push(swiper);
                
                // Prevenir propagación de clicks en flechas del carrusel
                const nextBtn = swiperEl.querySelector('.swiper-button-next');
                const prevBtn = swiperEl.querySelector('.swiper-button-prev');
                if (nextBtn) nextBtn.addEventListener('click', (e) => e.stopPropagation());
                if (prevBtn) prevBtn.addEventListener('click', (e) => e.stopPropagation());
            });
            console.log("SENSOR 6: Swipers inicializados.");

            // ✅ Agregar listeners para clicks en tarjetas (delegación de eventos)
            if (container._cardClickListener) {
                container.removeEventListener('click', container._cardClickListener);
            }
            
            container._cardClickListener = (e) => {
                // Solo responder al botón de contactar
                const btnContact = e.target.closest('.btn-contact');
                if (!btnContact) return;
                
                e.preventDefault();
                const adId = btnContact.closest('.card')?.getAttribute('data-ad-id');
                
                if (adId) {
                    window.location.href = `detalle-producto.html?id=${adId}`;
                }
            };
            
            container.addEventListener('click', container._cardClickListener, false);

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

// Función para actualizar el carrusel cuando se cambia de categoría
export function updateHeroForCategory(categoryName) {
    if (window.updateHeroCarousel) {
        window.updateHeroCarousel(categoryName);
    }
}
