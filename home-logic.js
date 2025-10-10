// home-logic.js - VERSIÓN DE DIAGNÓSTICO

import { supabase } from './supabase-client.js';

export function initializeHomePage() {
    
    console.log("SENSOR 1: initializeHomePage() se ha ejecutado.");

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

            // Mapeamos los datos para crear el HTML
            const adsHTML = ads.map(ad => {
            const allImages = [ad.url_portada, ...(ad.url_galeria || [])].filter(Boolean);
                const priceFormatted = new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(ad.precio);

                return `
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
                            <div class="location"><i class="fas fa-map-marker-alt"></i> ${ad.ubicacion || 'N/A'}</div>
                        </div>
                    </div>`;
            }).join('');
            
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
