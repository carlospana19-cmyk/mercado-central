// results-logic.js



document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('query')?.toLowerCase() || '';
    const category = params.get('category') || 'all';
    const location = params.get('location')?.toLowerCase() || ''; // <--- AÑADIDO

    // --- ACTUALIZACIÓN DE LA CONSULTA A SUPABASE ---
    // Empezamos la consulta base
    let queryBuilder = supabaseClient.from('anuncios').select('id, titulo, precio, url_portada, url_galeria');

    // Añadimos el filtro de texto si existe
    if (query) {
        // Usamos .ilike() para búsquedas insensibles a mayúsculas y que contengan el texto
        queryBuilder = queryBuilder.ilike('titulo', `%${query}%`);
    }

    // Añadimos el filtro de categoría si no es "all"
    if (category !== 'all') {
        queryBuilder = queryBuilder.eq('categoria', category);
    }

    // Añadimos el filtro de ubicación si existe
    if (location) {
        queryBuilder = queryBuilder.ilike('ubicacion', `%${location}%`); // <--- AÑADIDO
    }

    const { data: products, error } = await queryBuilder;
    
    // (El resto del código para manejar el error y mostrar los productos no necesita cambios)
    if (error) {
        console.error("Error al obtener los anuncios:", error);
        const container = document.getElementById('results-container');
        if (container) {
            container.innerHTML = `<p class="no-results">Hubo un error al cargar los anuncios. Por favor, intenta más tarde.</p>`;
        }
        return;
    }

    console.log("Anuncios obtenidos con éxito:", products);

    displayFilteredProducts(products);
    updateSummary(query, category, location, products.length);
});

function displayFilteredProducts(productsToDisplay) {
    const container = document.getElementById('results-container');
    if (!container) return;

    if (productsToDisplay.length === 0) {
        container.innerHTML = `<p class="no-results">No se encontraron anuncios que coincidan con tu búsqueda.</p>`;
        return;
    }

    let allProductsHTML = "";

    productsToDisplay.forEach(product => {
        // Creamos un array unificado de imágenes. Ponemos la portada primero.
        // Nos aseguramos de que url_galeria sea un array, aunque esté vacío.
        const allImages = [product.url_portada, ...(product.url_galeria || [])];

        const productBoxHTML = `
            <div class="box">
                <!-- INICIO DE LA ESTRUCTURA DEL CARRUSEL SWIPER -->
                <div class="swiper product-swiper">
                    <div class="swiper-wrapper">
                        ${allImages.map(imgUrl => `
                            <div class="swiper-slide">
                                <img src="${imgUrl}" alt="${product.titulo}" loading="lazy">
                            </div>
                        `).join('')}
                    </div>
                    <!-- Botones de Navegación -->
                    <div class="swiper-button-prev"></div>
                    <div class="swiper-button-next"></div>
                </div>
                <!-- FIN DE LA ESTRUCTURA DEL CARRUSEL -->

                <h3>${product.titulo}</h3>
                <div class="price">${product.precio}</div>
                <div class="stars">
                    <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
                </div>
                <a href="detalle-producto.html?id=${product.id}" class="btn">Ver detalles</a>
            </div>
        `;
        allProductsHTML += productBoxHTML;
    });

    // Inyectamos todo el HTML de una vez en el contenedor.
    container.innerHTML = allProductsHTML;

    // INICIALIZAMOS TODOS LOS SWIPERS A LA VEZ
    // Es importante hacerlo DESPUÉS de que el HTML está en el DOM.
    const swipers = new Swiper('.product-swiper', {
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
    if (query) {
        text += ` para "<strong>${query}</strong>"`;
    }
    if (location) {
        text += ` en "<strong>${location}</strong>"`; // <--- AÑADIDO
    }
    if (category !== 'all') {
        const categoryName = category.replace(/-/g, ' ');
        text += ` en la categoría <strong>${categoryName}</strong>`;
    }
    summaryElement.innerHTML = text;
}
