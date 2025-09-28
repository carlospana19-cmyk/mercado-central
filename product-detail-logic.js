// product-detail-logic.js (VERSIÓN CON GALERÍA)

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const adId = params.get('id');

    if (!adId) {
        displayError("No se especificó ningún producto.");
        return;
    }

    // Hacemos ambas peticiones a la vez
    const [adResponse, imagesResponse] = await Promise.all([
        supabaseClient.from('anuncios').select('*').eq('id', adId).single(),
        supabaseClient.from('imagenes').select('url_imagen').eq('anuncio_id', adId)
    ]);

    const { data: ad, error: adError } = adResponse;
    const { data: images, error: imagesError } = imagesResponse;

    if (adError || !ad) {
        displayError("El anuncio que buscas no existe.");
    } else {
        displayProductDetails(ad, images || []);
    }
});

async function displayProductDetails(ad, galleryImages) {
    document.title = `${ad.titulo} - Mercado Central`;
    
    // Rellenar datos de texto
    document.getElementById('product-name').textContent = ad.titulo;
    document.getElementById('product-price').textContent = `${ad.precio}`;
    document.getElementById('product-location').textContent = ad.ubicacion || 'No especificada';
    document.getElementById('product-description').textContent = ad.descripcion;

    // Construir la galería
    const mainImage = document.getElementById('main-image');
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    
    const allImages = [ad.url_portada, ...galleryImages.map(img => img.url_imagen)].filter(Boolean);

    if (allImages.length > 0) {
        mainImage.src = allImages[0];
        thumbnailsContainer.innerHTML = '';

        allImages.forEach((imageUrl, index) => {
            const thumb = document.createElement('img');
            thumb.src = imageUrl;
            thumb.className = 'thumbnail-img';
            if (index === 0) thumb.classList.add('active');
            
            thumb.addEventListener('click', () => {
                mainImage.src = imageUrl;
                document.querySelector('.thumbnail-img.active')?.classList.remove('active');
                thumb.classList.add('active');
            });

            thumbnailsContainer.appendChild(thumb);
        });
    } else {
        mainImage.src = 'images/placeholder.jpg';
    }

    // --- LÓGICA DEL BOTÓN DE EDICIÓN ---
    const { data: { user } } = await supabaseClient.auth.getUser();
    const editButton = document.getElementById('edit-ad-button');

    // Comprobamos si hay un usuario logueado Y si su ID coincide con el del dueño del anuncio
    if (user && ad.user_id === user.id && editButton) {
        editButton.href = `editar-anuncio.html?id=${ad.id}`;
        editButton.style.display = 'block'; // Lo hacemos visible
    }
}

function displayError(message) {
    const container = document.getElementById('product-detail-container');
    if (container) {
        container.innerHTML = `<h1>Error</h1><p>${message}</p>`;
    }
}
