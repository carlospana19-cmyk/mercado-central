document.addEventListener('DOMContentLoaded', () => {
    
    // Función para cargar y mostrar los anuncios destacados
    async function loadFeaturedAds() {
        const container = document.querySelector('#products .box-container');
        if (!container) {
            console.error('No se encontró el contenedor de anuncios destacados.');
            return;
        }
        
        // 1. CONSULTA A SUPABASE
        const { data: featuredAds, error } = await supabaseClient
            .from('anuncios')
            .select('*') // Pedimos todos los datos del anuncio
            .eq('is_featured', true) // Filtramos solo los destacados
            .limit(6); // Limitamos a 6 para la portada

        if (error) {
            console.error('Error al cargar anuncios destacados:', error);
            container.innerHTML = '<p>No se pudieron cargar los anuncios destacados.</p>';
            return;
        }

        if (featuredAds.length === 0) {
            container.innerHTML = '<p>Aún no hay anuncios destacados. ¡Sé el primero!</p>';
            return;
        }

        // 2. RENDERIZADO DE LAS TARJETAS
        container.innerHTML = ''; // Limpiamos el "Cargando..."
        featuredAds.forEach(ad => {
            // Combinamos portada y galería para el carrusel
            const allImages = [ad.url_portada, ...(ad.url_galeria || [])].filter(Boolean);
            
            const adElement = document.createElement('div');
            adElement.className = 'box'; // Usamos la misma clase que en resultados.html
            adElement.innerHTML = `
                ${ad.is_featured ? '<div class="featured-badge"><i class="fas fa-star"></i> Destacado</div>' : ''}
                <div class="swiper product-swiper">
                    <div class="swiper-wrapper">
                        ${allImages.length > 0 ? allImages.map(imgUrl => `
                            <div class="swiper-slide"><img src="${imgUrl}" alt="${ad.titulo}"></div>
                        `).join('') : `<div class="swiper-slide"><img src="images/placeholder.jpg" alt="Sin imagen"></div>`}
                    </div>
                    <div class="swiper-button-prev"></div>
                    <div class="swiper-button-next"></div>
                </div>
                <h3>${ad.titulo}</h3>
                <div class="price">$${ad.precio}</div>
                <a href="detalle-producto.html?id=${ad.id}" class="btn">Ver detalles</a>
            `;
            container.appendChild(adElement);
        });

        // 3. INICIALIZACIÓN DE SWIPER.JS
        const swiperElements = document.querySelectorAll('.product-swiper');
        swiperElements.forEach(swiperEl => {
            const slides = swiperEl.querySelectorAll('.swiper-slide');
            new Swiper(swiperEl, {
                loop: slides.length > 1,
                navigation: {
                    nextEl: swiperEl.querySelector('.swiper-button-next'),
                    prevEl: swiperEl.querySelector('.swiper-button-prev'),
                },
            });
        });
    }

    // --- INICIO DE LA EJECUCIÓN ---
    loadFeaturedAds();

});
