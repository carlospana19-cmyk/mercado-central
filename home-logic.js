document.addEventListener('DOMContentLoaded', async () => {
    const productsContainer = document.querySelector('.products .box-container');
    if (!productsContainer) {
        console.error('No se encontró el contenedor de productos en index.html');
        return;
    }

    productsContainer.innerHTML = '<p>Cargando anuncios destacados...</p>';

    const { data: ads, error } = await supabaseClient
        .from('anuncios')
        .select('*')
        .eq('es_destacado', true)
        .limit(8);

    if (error) {
        console.error("Error al cargar anuncios destacados:", error);
        productsContainer.innerHTML = '<p>No se pudieron cargar los anuncios. Intenta más tarde.</p>';
        return;
    }

    if (ads.length === 0) {
        productsContainer.innerHTML = '<p>No hay anuncios destacados en este momento.</p>';
        return;
    }

    productsContainer.innerHTML = '';
    ads.forEach(ad => {
        const adElement = document.createElement('div');
        adElement.className = 'box';
        adElement.innerHTML = `
            <img src="${ad.url_portada}" alt="${ad.titulo}">
            <h3>${ad.titulo}</h3>
            <div class="price">$${ad.precio}</div>
            <div class="stars">
                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
            </div>
            <a href="detalle-producto.html?id=${ad.id}" class="btn">Ver detalles</a>
        `;
        productsContainer.appendChild(adElement);
    });
});
