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

        // Incrementar contador de visitas
        try {
            const { error: updateError } = await supabase
                .from('anuncios')
                .update({ visitas: (ad.visitas || 0) + 1 })
                .eq('id', adId);

            if (updateError) {
                console.warn('Error al actualizar visitas:', updateError);
            } else {
                console.log('Visitas incrementadas');
            }
        } catch (error) {
            console.error('Error al incrementar visitas:', error);
        }
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

    // Mostrar visitas
    const productVisitsEl = document.getElementById('product-visits');
    if (productVisitsEl) {
        productVisitsEl.textContent = ad.visitas || 0;
    }

    // Mostrar información de contacto del vendedor
    loadSellerContactInfo(ad);

    // Calcular y mostrar fecha de publicación
    if (ad.fecha_publicacion) {
        const fechaPublicacion = new Date(ad.fecha_publicacion);
        const ahora = new Date();
        const diffTiempo = Math.abs(ahora - fechaPublicacion);
        const diffDias = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));

        let textoFecha;
        if (diffDias === 0) {
            textoFecha = "Publicado hoy";
        } else if (diffDias === 1) {
            textoFecha = "Publicado hace 1 día";
        } else if (diffDias < 30) {
            textoFecha = `Publicado hace ${diffDias} días`;
        } else if (diffDias < 60) {
            textoFecha = "Publicado hace 1 mes";
        } else {
            textoFecha = `Publicado hace ${Math.floor(diffDias / 30)} meses`;
        }

        document.getElementById('product-date').textContent = textoFecha;
    } else {
        document.getElementById('product-date').textContent = "Fecha no disponible";
    }

    // Agregar información detallada del vehículo si existe
    addVehicleDetails(ad);

    // Agregar información detallada del inmueble si existe
    addRealEstateDetails(ad);

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
            // Removed debugging styles

            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = `Imagen ${index + 1} del producto`;
            // Removed debugging styles
            img.onerror = () => {
                console.warn('Error al cargar imagen del carrusel:', imageUrl); // Reverted to warn
                img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L2F2Zz4=';
            };

            slide.appendChild(img);
            galleryWrapperEl.appendChild(slide);
        });
        // Removed console.log('Se han agregado imágenes al carrusel.');

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
            observer: true, // Added to observe changes in Swiper and its parents
            observeParents: true, // Added to observe changes in parent elements
        });

        console.log('Carrusel Swiper inicializado');

        // Removed debugging: Log DOM structure after Swiper initialization
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

function addVehicleDetails(ad) {
    // Buscar si ya existe un contenedor de detalles del vehículo
    let vehicleDetailsContainer = document.querySelector('.vehicle-details-container');

    // Si no existe, crearlo
    if (!vehicleDetailsContainer) {
        const descriptionContainer = document.querySelector('.description-container');
        if (descriptionContainer) {
            vehicleDetailsContainer = document.createElement('div');
            vehicleDetailsContainer.className = 'vehicle-details-container';
            descriptionContainer.parentNode.insertBefore(vehicleDetailsContainer, descriptionContainer);
        }
    }

    // Verificar si el anuncio tiene información de vehículo
    const hasVehicleInfo = ad.marca || ad.anio || ad.kilometraje || ad.transmision || ad.combustible;

    if (hasVehicleInfo) {
        vehicleDetailsContainer.innerHTML = `
            <div class="vehicle-specs-grid">
                <h2>Especificaciones del Vehículo</h2>
                <div class="specs-grid">
                    ${ad.marca ? `
                        <div class="spec-item">
                            <i class="fas fa-car"></i>
                            <div class="spec-content">
                                <span class="spec-label">Marca</span>
                                <span class="spec-value">${ad.marca}</span>
                            </div>
                        </div>
                    ` : ''}
                    ${ad.anio ? `
                        <div class="spec-item">
                            <i class="fas fa-calendar-alt"></i>
                            <div class="spec-content">
                                <span class="spec-label">Año</span>
                                <span class="spec-value">${ad.anio}</span>
                            </div>
                        </div>
                    ` : ''}
                    ${ad.kilometraje ? `
                        <div class="spec-item">
                            <i class="fas fa-tachometer-alt"></i>
                            <div class="spec-content">
                                <span class="spec-label">Kilometraje</span>
                                <span class="spec-value">${ad.kilometraje.toLocaleString('es-PA')} km</span>
                            </div>
                        </div>
                    ` : ''}
                    ${ad.transmision ? `
                        <div class="spec-item">
                            <i class="fas fa-cogs"></i>
                            <div class="spec-content">
                                <span class="spec-label">Transmisión</span>
                                <span class="spec-value">${ad.transmision}</span>
                            </div>
                        </div>
                    ` : ''}
                    ${ad.combustible ? `
                        <div class="spec-item">
                            <i class="fas fa-gas-pump"></i>
                            <div class="spec-content">
                                <span class="spec-label">Combustible</span>
                                <span class="spec-value">${ad.combustible}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    } else {
        // Si no hay información de vehículo, ocultar el contenedor
        if (vehicleDetailsContainer) {
            vehicleDetailsContainer.style.display = 'none';
        }
    }
}

function addRealEstateDetails(ad) {
    // Buscar si ya existe un contenedor de detalles del inmueble
    let realEstateDetailsContainer = document.querySelector('.real-estate-details-container');

    // Si no existe, crearlo
    if (!realEstateDetailsContainer) {
        const descriptionContainer = document.querySelector('.description-container');
        if (descriptionContainer) {
            realEstateDetailsContainer = document.createElement('div');
            realEstateDetailsContainer.className = 'real-estate-details-container';
            descriptionContainer.parentNode.insertBefore(realEstateDetailsContainer, descriptionContainer);
        }
    }

    // Verificar si el anuncio tiene información de inmueble
    const hasRealEstateInfo = ad.m2 || ad.habitaciones || ad.baños;

    if (hasRealEstateInfo) {
        realEstateDetailsContainer.innerHTML = `
            <div class="real-estate-specs-grid">
                <h2>Detalles del Inmueble</h2>
                <div class="specs-grid">
                    ${ad.m2 ? `
                        <div class="spec-item">
                            <i class="fas fa-ruler-combined"></i>
                            <div class="spec-content">
                                <span class="spec-label">Metros Cuadrados</span>
                                <span class="spec-value">${ad.m2} m²</span>
                            </div>
                        </div>
                    ` : ''}
                    ${ad.habitaciones ? `
                        <div class="spec-item">
                            <i class="fas fa-bed"></i>
                            <div class="spec-content">
                                <span class="spec-label">Habitaciones</span>
                                <span class="spec-value">${ad.habitaciones}</span>
                            </div>
                        </div>
                    ` : ''}
                    ${ad.baños ? `
                        <div class="spec-item">
                            <i class="fas fa-bath"></i>
                            <div class="spec-content">
                                <span class="spec-label">Baños</span>
                                <span class="spec-value">${ad.baños}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    } else {
        // Si no hay información de inmueble, ocultar el contenedor
        if (realEstateDetailsContainer) {
            realEstateDetailsContainer.style.display = 'none';
        }
    }
}

async function loadSellerContactInfo(ad) {
    try {
        // Obtener información del usuario vendedor desde la tabla profiles
        const { data: sellerProfile, error } = await supabase
            .from('profiles')
            .select('telefono, email')
            .eq('id', ad.user_id)
            .single();

        if (error) {
            console.warn('Error al obtener información del vendedor:', error);
            // Fallback: mostrar datos no disponibles
            const sellerPhoneEl = document.getElementById('seller-phone');
            const sellerEmailEl = document.getElementById('seller-email');
            const whatsappLinkEl = document.getElementById('whatsapp-link');
            const emailLinkEl = document.getElementById('email-link');

            if (sellerPhoneEl) sellerPhoneEl.textContent = 'No disponible';
            if (sellerEmailEl) sellerEmailEl.textContent = 'No disponible';
            if (whatsappLinkEl) whatsappLinkEl.style.display = 'none';
            if (emailLinkEl) emailLinkEl.style.display = 'none';
            return;
        }

        // Mostrar información de contacto
        const whatsappLinkEl = document.getElementById('whatsapp-link');
        const emailLinkEl = document.getElementById('email-link');
        const phoneLinkEl = document.getElementById('phone-link');

        if (whatsappLinkEl && sellerProfile?.telefono) {
            whatsappLinkEl.onclick = () => {
                // Mostrar el número de teléfono como fondo
                whatsappLinkEl.style.background = `linear-gradient(135deg, #25D366, #128C7E)`;
                whatsappLinkEl.innerHTML = `<i class="fab fa-whatsapp"></i> ${sellerProfile.telefono}`;
                setTimeout(() => {
                    window.open(`https://wa.me/${sellerProfile.telefono.replace(/\D/g, '')}?text=Hola, estoy interesado en tu anuncio: ${ad.titulo}`, '_blank');
                    whatsappLinkEl.innerHTML = `<i class="fab fa-whatsapp"></i> WhatsApp`;
                }, 1000);
            };
            whatsappLinkEl.style.display = 'inline-block';
        } else {
            if (whatsappLinkEl) whatsappLinkEl.style.display = 'none';
        }

        if (emailLinkEl && sellerProfile?.email) {
            emailLinkEl.onclick = () => {
                // Mostrar el email como fondo
                emailLinkEl.style.background = `linear-gradient(135deg, #007bff, #0056b3)`;
                emailLinkEl.innerHTML = `<i class="fas fa-envelope"></i> ${sellerProfile.email}`;
                setTimeout(() => {
                    window.open(`mailto:${sellerProfile.email}?subject=Interesado en tu anuncio: ${ad.titulo}&body=Hola, estoy interesado en tu anuncio y me gustaría tener más detalles.`, '_blank');
                    emailLinkEl.innerHTML = `<i class="fas fa-envelope"></i> Email`;
                }, 1000);
            };
            emailLinkEl.style.display = 'inline-block';
        } else {
            if (emailLinkEl) emailLinkEl.style.display = 'none';
        }

        if (phoneLinkEl && sellerProfile?.telefono) {
            phoneLinkEl.onclick = () => {
                // Mostrar el número de teléfono como fondo
                phoneLinkEl.style.background = `linear-gradient(135deg, #28a745, #1e7e34)`;
                phoneLinkEl.innerHTML = `<i class="fas fa-phone-alt"></i> ${sellerProfile.telefono}`;
                setTimeout(() => {
                    window.open(`tel:${sellerProfile.telefono}`, '_blank');
                    phoneLinkEl.innerHTML = `<i class="fas fa-phone-alt"></i> Teléfono`;
                }, 1000);
            };
            phoneLinkEl.style.display = 'inline-block';
        } else {
            if (phoneLinkEl) phoneLinkEl.style.display = 'none';
        }

    } catch (error) {
        console.error('Error al cargar información de contacto del vendedor:', error);
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
