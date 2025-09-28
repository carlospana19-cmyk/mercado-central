document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('query')?.toLowerCase() || '';
    const category = params.get('category') || 'all';
    const location = params.get('location')?.toLowerCase() || '';

    // 1. OBTENER LOS ANUNCIOS PRINCIPALES
    let queryBuilder = supabaseClient
        .from('anuncios')
        // ¡IMPORTANTE! Ya no pedimos url_galeria
        .select('id, titulo, precio, ubicacion, url_portada, is_featured');

    if (query) {
        queryBuilder = queryBuilder.or(`titulo.ilike.%${query}%,descripcion.ilike.%${query}%`);
    }
    if (category !== 'all') {
        queryBuilder = queryBuilder.eq('categoria', category);
    }
    if (location) {
        queryBuilder = queryBuilder.ilike('ubicacion', `%${location}%`);
    }

    const { data: products, error } = await queryBuilder;

    if (error) {
        console.error("Error al obtener los anuncios:", error);
        displayError("Hubo un error al cargar los anuncios.");
        return;
    }
    
    // Si no hay productos, terminamos aquí.
    if (products.length === 0) {
        displayFilteredProducts([]);
        updateSummary(query, category, location, 0);
        return;
    }

    // 2. OBTENER LAS IMÁGENES DE GALERÍA PARA ESOS ANUNCIOS
    // Creamos un array con todos los IDs de los anuncios encontrados
    const productIds = products.map(p => p.id);

    const { data: images, error: imagesError } = await supabaseClient
        .from('imagenes')
        .select('anuncio_id, url_imagen')
        .in('anuncio_id', productIds); // .in() busca en una lista de IDs

    if (imagesError) {
        console.error("Error al obtener imágenes de galería:", imagesError);
        // Podemos decidir continuar y mostrar los anuncios sin galería
    }

    // 3. COMBINAR LOS DATOS
    // Añadimos a cada producto su array de imágenes de galería
    const productsWithImages = products.map(product => {
        const gallery = images 
            ? images.filter(img => img.anuncio_id === product.id)
            : [];
        return {
            ...product,
            galleryImages: gallery.map(img => img.url_imagen) // Creamos un array simple de URLs
        };
    });

    displayFilteredProducts(productsWithImages);
    updateSummary(query, category, location, products.length);
});

// La función displayFilteredProducts ahora espera que cada producto tenga una propiedad `galleryImages`
function displayFilteredProducts(productsToDisplay) {
    const container = document.getElementById('results-container');
    if (!container) return;
    container.innerHTML = "";

    if (productsToDisplay.length === 0) {
        container.innerHTML = `<p class="no-results">No se encontraron anuncios.</p>`;
        return;
    }

    let allProductsHTML = "";
    productsToDisplay.forEach(product => {
        const allImages = [product.url_portada, ...(product.galleryImages || [])].filter(Boolean);

        const productBoxHTML = `
            <div class="box">
                ${product.is_featured ? '<div class="featured-badge"><i class="fas fa-star"></i> Destacado</div>' : ''}
                <div class="swiper product-swiper">
                    <div class="swiper-wrapper">
                        ${allImages.length > 0 ? allImages.map(imgUrl => `
                            <div class="swiper-slide"><img src="${imgUrl}" alt="${product.titulo}" loading="lazy"></div>
                        `).join('') : `<div class="swiper-slide"><img src="images/placeholder.jpg" alt="Sin imagen"></div>`}
                    </div>
                    <div class="swiper-button-prev"></div>
                    <div class="swiper-button-next"></div>
                </div>
                <h3>${product.titulo}</h3>
                <div class="price">$${product.precio}</div>
                <div class="stars">
                    <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
                </div>
                <a href="detalle-producto.html?id=${product.id}" class="btn">Ver detalles</a>
            </div>
        `;
        allProductsHTML += productBoxHTML;
    });

    container.innerHTML = allProductsHTML;

    new Swiper('.product-swiper', {
        loop: true,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
    });
}

function updateSummary(query, category, location, count) {
    const summaryElement = document.getElementById('results-summary');
    if (!summaryElement) return;
    let text = `Encontrados <strong>${count}</strong> anuncios`;
    if (query) text += ` para "<strong>${query}</strong>"`;
    if (location) text += ` en "<strong>${location}</strong>"`;
    if (category !== 'all') text += ` en <strong>${category}</strong>`;
    summaryElement.innerHTML = text;
}

function displayError(message) {
    const container = document.getElementById('results-container');
    if (container) container.innerHTML = `<p class="no-results">${message}</p>`;
}
