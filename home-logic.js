// home-logic.js - VERSIÓN DE DIAGNÓSTICO

import { supabase } from './supabase-client.js';

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
            const { data: ads, error } = await supabase
            .from('anuncios')
                .select('*')
                .eq('is_featured', true)
                .limit(8);

        if (error) {
                // Esto lanzará un error que veremos en la consola.
                throw error;
            }
            
            console.log("SENSOR 3: Datos recibidos de Supabase:", ads);

            if (!ads || ads.length === 0) {
                container.innerHTML = '<p>No hay anuncios destacados en este momento.</p>';
                console.log("SENSOR 4: No se encontraron anuncios destacados.");
            return;
        }

            // Crear filas con diferentes números de columnas
            let adsHTML = '';

            // Primera fila: 2 columnas
            if (ads.length >= 2) {
                adsHTML += '<div class="ads-row row-2-cols">';
                for (let i = 0; i < 2 && i < ads.length; i++) {
                    const ad = ads[i];
                    console.log("DEBUG: Procesando anuncio:", ad.titulo, "Categoría:", ad.categoria, "Atributos:", ad.atributos_clave);
                    const allImages = [ad.url_portada, ...(ad.url_galeria || [])].filter(Boolean);
                    const priceFormatted = new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(ad.precio);

                    adsHTML += `
                        <div class="box">
                            <div class="image-container">
                    <div class="swiper product-swiper">
                        <div class="swiper-wrapper">
                                        ${allImages.length > 0 ? allImages.map(img => `<div class="swiper-slide"><img src="${img}" alt="${ad.titulo}" loading="lazy"></div>`).join('') : ''}
                        </div>
                        <div class="swiper-button-prev"></div>
                        <div class="swiper-button-next"></div>
                    </div>
                            </div>
                            <div class="content">
                                <div class="price">${priceFormatted}</div>
                    <h3>${ad.titulo}</h3>
                                <div class="location"><i class="fas fa-map-marker-alt"></i> ${ad.provincia || 'N/A'}</div>
                                ${generateElectronicsDetails(ad)}
                            </div>
                        </div>`;
                }
                adsHTML += '</div>';
            }

            // Segunda fila: 3 columnas
            if (ads.length >= 5) {
                adsHTML += '<div class="ads-row row-3-cols">';
                for (let i = 2; i < 5 && i < ads.length; i++) {
                    const ad = ads[i];
                    const allImages = [ad.url_portada, ...(ad.url_galeria || [])].filter(Boolean);
                    const priceFormatted = new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(ad.precio);

                    adsHTML += `
                        <div class="box">
                            <div class="image-container">
                    <div class="swiper product-swiper">
                        <div class="swiper-wrapper">
                                        ${allImages.length > 0 ? allImages.map(img => `<div class="swiper-slide"><img src="${img}" alt="${ad.titulo}" loading="lazy"></div>`).join('') : ''}
                        </div>
                        <div class="swiper-button-prev"></div>
                        <div class="swiper-button-next"></div>
                    </div>
                            </div>
                            <div class="content">
                                <div class="price">${priceFormatted}</div>
                    <h3>${ad.titulo}</h3>
                                <div class="location"><i class="fas fa-map-marker-alt"></i> ${ad.provincia || 'N/A'}</div>
                                ${generateElectronicsDetails(ad)}
                            </div>
                        </div>`;
                }
                adsHTML += '</div>';
            }

            // Tercera fila: 4 columnas
            if (ads.length > 5) {
                adsHTML += '<div class="ads-row row-4-cols">';
                for (let i = 5; i < ads.length; i++) {
                    const ad = ads[i];
                    const allImages = [ad.url_portada, ...(ad.url_galeria || [])].filter(Boolean);
                    const priceFormatted = new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(ad.precio);

                    adsHTML += `
                        <div class="box">
                            <div class="image-container">
                    <div class="swiper product-swiper">
                        <div class="swiper-wrapper">
                                        ${allImages.length > 0 ? allImages.map(img => `<div class="swiper-slide"><img src="${img}" alt="${ad.titulo}" loading="lazy"></div>`).join('') : ''}
                        </div>
                        <div class="swiper-button-prev"></div>
                        <div class="swiper-button-next"></div>
                    </div>
                            </div>
                            <div class="content">
                                <div class="price">${priceFormatted}</div>
                    <h3>${ad.titulo}</h3>
                                <div class="location"><i class="fas fa-map-marker-alt"></i> ${ad.provincia || 'N/A'}</div>
                                ${generateElectronicsDetails(ad)}
                            </div>
                        </div>`;
                }
                adsHTML += '</div>';
            }
            
            container.innerHTML = adsHTML;
            console.log("SENSOR 5: HTML de anuncios insertado en el DOM.");

            // Inicializar Swiper
            new Swiper('.product-swiper', {
                loop: true,
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
            });
            console.log("SENSOR 6: Swiper inicializado.");

        } catch (e) {
            console.error("FALLO CRÍTICO DURANTE LA CARGA:", e);
            if(container) container.innerHTML = `<p>Ocurrió un error al cargar los anuncios. Detalles: ${e.message}</p>`;
        }
    }

    // Ejecutar la carga
    loadFeaturedAds();
}

// Mapeo de campos de electrónica a iconos y etiquetas
const electronicsFieldMap = {
    "marca": { icon: "fas fa-tag", label: "Marca" },
    "modelo": { icon: "fas fa-mobile-alt", label: "Modelo" },
    "almacenamiento": { icon: "fas fa-hdd", label: "Almacenamiento" },
    "memoria_ram": { icon: "fas fa-memory", label: "RAM" },
    "condicion": { icon: "fas fa-star", label: "Condición" },
    "tipo_computadora": { icon: "fas fa-laptop", label: "Tipo" },
    "procesador": { icon: "fas fa-microchip", label: "Procesador" },
    "tamano_pantalla": { icon: "fas fa-desktop", label: "Pantalla" },
    "plataforma": { icon: "fas fa-gamepad", label: "Plataforma" },
    "tipo_articulo": { icon: "fas fa-camera", label: "Tipo" }
};

function generateElectronicsDetails(ad) {
    let detailsHtml = '';
    if (ad.categoria && ad.categoria.toLowerCase().includes('electrónica') && ad.atributos_clave) {
        const atributos = ad.atributos_clave;
        detailsHtml += '<div class="electronics-details-card">';
        for (const key in atributos) {
            if (atributos.hasOwnProperty(key) && key !== 'subcategoria') {
                const fieldInfo = electronicsFieldMap[key];
                if (fieldInfo) {
                    let value = atributos[key];
                    if (key === 'almacenamiento' || key === 'memoria_ram') {
                        value += ' GB';
                    } else if (key === 'tamano_pantalla') {
                        value += ' pulgadas';
                    }
                    detailsHtml += `
                        <div class="detail-item">
                            <i class="${fieldInfo.icon}"></i>
                            <span>${fieldInfo.label}: ${value}</span>
                        </div>`;
                }
            }
        }
        detailsHtml += '</div>';
    }
    return detailsHtml;
}

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
}

// Función para actualizar el carrusel cuando se cambia de categoría
export function updateHeroForCategory(categoryName) {
    if (window.updateHeroCarousel) {
        window.updateHeroCarousel(categoryName);
    }
}
