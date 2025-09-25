// product-detail-logic.js (VERSIÓN CON GALERÍA)

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const adId = params.get('id');

    if (!adId) {
        displayError("No se especificó ningún producto.");
        return;
    }

    // Usamos Promise.all para hacer ambas peticiones a la vez y mejorar el rendimiento
    const [adResponse, imagesResponse] = await Promise.all([
        // Petición 1: Obtener los datos del anuncio
        supabaseClient.from('anuncios').select('*').eq('id', adId).single(),
        // Petición 2: Obtener las imágenes de la galería
        supabaseClient.from('imagenes').select('url_imagen').eq('anuncio_id', adId)
    ]);

    const { data: ad, error: adError } = adResponse;
    const { data: images, error: imagesError } = imagesResponse;

    if (adError || !ad) {
        console.error("Error al obtener el detalle del producto:", adError);
        displayError("El anuncio que buscas no existe o ha sido eliminado.");
    } else {
        displayProductDetails(ad, images || []);
    }
});

function displayProductDetails(ad, galleryImages) {
    document.title = `${ad.titulo} - Mercado Central`;
    
    // Rellenar datos de texto
    document.getElementById('product-name').textContent = ad.titulo;
    document.getElementById('product-price').textContent = `$${ad.precio}`;
    document.getElementById('product-location').textContent = ad.ubicacion || 'No especificada';
    document.getElementById('product-description').textContent = ad.descripcion;

    // Construir la galería
    const mainImage = document.getElementById('main-image');
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    
    // Creamos una lista con la portada primero, y luego las de la galería
    const allImages = [ad.url_portada, ...galleryImages.map(img => img.url_imagen)].filter(Boolean); // .filter(Boolean) elimina URLs nulas

    if (allImages.length > 0) {
        mainImage.src = allImages[0]; // Mostramos la primera imagen (la portada)
        thumbnailsContainer.innerHTML = '';

        allImages.forEach((imageUrl, index) => {
            const thumb = document.createElement('img');
            thumb.src = imageUrl;
            thumb.className = 'thumbnail-img';
            if (index === 0) {
                thumb.classList.add('active');
            }
            
            thumb.addEventListener('click', () => {
                mainImage.src = imageUrl;
                document.querySelector('.thumbnail-img.active')?.classList.remove('active');
                thumb.classList.add('active');
            });

            thumbnailsContainer.appendChild(thumb);
        });
    } else {
        // Si no hay imágenes, mostramos un placeholder
        mainImage.src = 'images/placeholder.jpg'; // Asegúrate de tener una imagen placeholder
    }
}

function displayError(message) {
    const container = document.getElementById('product-detail-container');
    if (container) {
        container.innerHTML = `<h1>Error</h1><p>${message}</p>`;
    }
}
