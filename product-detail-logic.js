import { supabase } from './supabase-client.js';

// product-detail-logic.js (VERSIÓN CON GALERÍA Y MEJOR MANEJO DE ERRORES)

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando carga del detalle del producto...');

    const params = new URLSearchParams(window.location.search);
    const adId = params.get('id');

    console.log('ID del anuncio:', adId);

    if (!adId) {
        console.error('No se especificó ningún ID de producto');
        displayError("No se especificó ningún producto.");
        return;
    }

    try {
        // Hacemos ambas peticiones a la vez
        console.log('Realizando consultas a la base de datos...');
        const [adResponse, imagesResponse] = await Promise.all([
            supabase.from('anuncios').select('*').eq('id', adId).single(),
            supabase.from('imagenes').select('url_imagen').eq('anuncio_id', adId)
        ]);

        const { data: ad, error: adError } = adResponse;
        const { data: images, error: imagesError } = imagesResponse;

        console.log('Respuesta del anuncio:', { ad, adError });
        console.log('Respuesta de imágenes:', { images, imagesError });

        if (adError) {
            console.error('Error al cargar el anuncio:', adError);
            displayError("Error al cargar el anuncio. Por favor, intenta de nuevo.");
            return;
        }

        if (imagesError) {
            console.warn('Error al cargar las imágenes:', imagesError);
            // No fallamos completamente si solo hay error en imágenes
        }

        if (!ad) {
            console.error('Anuncio no encontrado');
            displayError("El anuncio que buscas no existe.");
            return;
        }

        displayProductDetails(ad, images || []);
    } catch (error) {
        console.error('Error inesperado al cargar el producto:', error);
        displayError("Error inesperado al cargar el producto. Por favor, intenta de nuevo.");
    }
});

async function displayProductDetails(ad, galleryImages) {
    console.log('Mostrando detalles del producto:', ad);
    console.log('Imágenes de galería:', galleryImages);

    // Verificar que los elementos del DOM existan
    const productNameEl = document.getElementById('product-name');
    const productPriceEl = document.getElementById('product-price');
    const productLocationEl = document.getElementById('product-location');
    const productDescriptionEl = document.getElementById('product-description');
    const galleryWrapperEl = document.getElementById('gallery-wrapper');

    if (!productNameEl || !productPriceEl || !productLocationEl || !productDescriptionEl || !galleryWrapperEl) {
        console.error('Elementos del DOM no encontrados');
        displayError('Error al cargar la interfaz del producto.');
        return;
    }

    document.title = `${ad.titulo} - Mercado Central`;

    // Rellenar datos de texto
    productNameEl.textContent = ad.titulo;
    productPriceEl.textContent = `$${ad.precio}`;
    productLocationEl.textContent = ad.ubicacion || 'No especificada';
    productDescriptionEl.textContent = ad.descripcion;

    // Construir la galería con validación de URLs
    const allImages = [ad.url_portada, ...galleryImages.map(img => img.url_imagen)].filter(url => {
        if (!url) return false;
        try {
            new URL(url);
            return true;
        } catch {
            console.warn('URL de imagen inválida:', url);
            return false;
        }
    });

    console.log('Imágenes válidas para mostrar:', allImages);

    if (allImages.length > 0) {
        galleryWrapperEl.innerHTML = '';

        allImages.forEach((imageUrl, index) => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';

            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = `Imagen ${index + 1} del producto`;
            img.onerror = () => {
                console.warn('Error al cargar imagen del carrusel:', imageUrl);
                img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
            };

            slide.appendChild(img);
            galleryWrapperEl.appendChild(slide);
        });

        // Inicializar Swiper después de agregar las imágenes
        const swiper = new Swiper('.product-gallery-swiper', {
            loop: true,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
            },
        });

        console.log('Carrusel Swiper inicializado');
    } else {
        console.log('No hay imágenes disponibles, usando placeholder');
        galleryWrapperEl.innerHTML = `
            <div class="swiper-slide">
                <img src="https://via.placeholder.com/500x400?text=Sin+Imagen" alt="Sin imagen disponible">
            </div>
        `;

        // Inicializar Swiper con una sola imagen
        const swiper = new Swiper('.product-gallery-swiper', {
            loop: false,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            autoplay: false, // Desactivar autoplay para una sola imagen
        });
    }

    // --- LÓGICA DEL BOTÓN DE EDICIÓN ---
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
            console.warn('Error al obtener usuario:', userError);
            return;
        }

        const editButton = document.getElementById('edit-ad-button');

        // Comprobamos si hay un usuario logueado Y si su ID coincide con el del dueño del anuncio
        if (user && ad.user_id === user.id && editButton) {
            editButton.href = `editar-anuncio.html?id=${ad.id}`;
            editButton.style.display = 'block'; // Lo hacemos visible
        }
    } catch (error) {
        console.error('Error en lógica de edición:', error);
    }
}

function displayError(message) {
    console.error('Mostrando error:', message);

    // Verificar si existe el contenedor principal
    const mainContainer = document.querySelector('.detalle-page-container');
    if (mainContainer) {
        mainContainer.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem; background: white; border-radius: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h1 style="color: #e74c3c; margin-bottom: 1rem;">Error</h1>
                <p style="font-size: 1.6rem; color: #666; margin-bottom: 2rem;">${message}</p>
                <button onclick="window.history.back()" style="padding: 1rem 2rem; background: var(--color-primario); color: white; border: none; border-radius: 6px; font-size: 1.6rem; cursor: pointer;">
                    Volver atrás
                </button>
            </div>
        `;
    } else {
        // Fallback si no hay contenedor principal
        document.body.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
                <div>
                    <h1 style="color: #e74c3c; margin-bottom: 1rem;">Error</h1>
                    <p style="font-size: 1.6rem; color: #666; margin-bottom: 2rem;">${message}</p>
                    <button onclick="window.history.back()" style="padding: 1rem 2rem; background: #00bfae; color: white; border: none; border-radius: 6px; font-size: 1.6rem; cursor: pointer;">
                        Volver atrás
                    </button>
                </div>
            </div>
        `;
    }
}
