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

    // Agregar información detallada de electrónica si existe
    addElectronicsDetails(ad);

    // Agregar información detallada de hogar y muebles si existe
    addHomeFurnitureDetails(ad);
    // Agregar información detallada de moda y belleza si existe
    addFashionDetails(ad);

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

function addElectronicsDetails(ad) {
    // Buscar si ya existe un contenedor de detalles de electrónica
    let electronicsDetailsContainer = document.querySelector('.electronics-details-container');

    // Si no existe, crearlo
    if (!electronicsDetailsContainer) {
        const descriptionContainer = document.querySelector('.description-container');
        if (descriptionContainer) {
            electronicsDetailsContainer = document.createElement('div');
            electronicsDetailsContainer.className = 'electronics-details-container';
            descriptionContainer.parentNode.insertBefore(electronicsDetailsContainer, descriptionContainer);
        }
    }

    // Verificar si el anuncio tiene información de electrónica en atributos_clave (JSONB)
    const hasElectronicsInfo = ad.atributos_clave && typeof ad.atributos_clave === 'object' && ad.atributos_clave.subcategoria;

    if (hasElectronicsInfo) {
        const attr = ad.atributos_clave;

        // Lista de subcategorías de electrónica para verificar
        const electronicsSubcats = ["Celulares y Teléfonos", "Computadoras", "Consolas y Videojuegos", "Audio y Video", "Fotografía"];

        // Solo procesar si es realmente electrónica
        if (!electronicsSubcats.includes(attr.subcategoria)) {
            if (electronicsDetailsContainer) {
                electronicsDetailsContainer.style.display = 'none';
            }
            return;
        }

        let specsHTML = '';

        // Mapeo de atributos a iconos y etiquetas
        const attrConfig = {
            marca: { icon: 'fas fa-tag', label: 'Marca' },
            modelo: { icon: 'fas fa-mobile-alt', label: 'Modelo' },
            almacenamiento: { icon: 'fas fa-hdd', label: 'Almacenamiento', suffix: ' GB' },
            memoria_ram: { icon: 'fas fa-microchip', label: 'Memoria RAM', suffix: ' GB' },
            procesador: { icon: 'fas fa-microchip', label: 'Procesador' },
            tipo_computadora: { icon: 'fas fa-laptop', label: 'Tipo' },
            tamano_pantalla: { icon: 'fas fa-desktop', label: 'Pantalla', suffix: '"' },
            plataforma: { icon: 'fas fa-gamepad', label: 'Plataforma' },
            tipo_articulo: { icon: 'fas fa-tag', label: 'Tipo de Artículo' },
            condicion: { icon: 'fas fa-star', label: 'Condición' }
        };

        // Generar HTML para cada atributo presente
        Object.keys(attrConfig).forEach(key => {
            if (attr[key]) {
                const config = attrConfig[key];
                const value = attr[key] + (config.suffix || '');
                specsHTML += `
                    <div class="spec-item">
                        <i class="${config.icon}"></i>
                        <div class="spec-content">
                            <span class="spec-label">${config.label}</span>
                            <span class="spec-value">${value}</span>
                        </div>
                    </div>
                `;
            }
        });

        if (specsHTML) {
            electronicsDetailsContainer.innerHTML = `
                <div class="electronics-specs-grid">
                    <h2>Especificaciones del Artículo Electrónico</h2>
                    <div class="specs-grid">
                        ${specsHTML}
                    </div>
                </div>
            `;
        }
    } else {
        // Si no hay información de electrónica, ocultar el contenedor
        if (electronicsDetailsContainer) {
            electronicsDetailsContainer.style.display = 'none';
        }
    }
}

function addHomeFurnitureDetails(ad) {
    // Buscar si ya existe un contenedor de detalles de hogar
    let homeFurnitureDetailsContainer = document.querySelector('.home-furniture-details-container');

    // Si no existe, crearlo
    if (!homeFurnitureDetailsContainer) {
        const descriptionContainer = document.querySelector('.description-container');
        if (descriptionContainer) {
            homeFurnitureDetailsContainer = document.createElement('div');
            homeFurnitureDetailsContainer.className = 'home-furniture-details-container';
            descriptionContainer.parentNode.insertBefore(homeFurnitureDetailsContainer, descriptionContainer);
        }
    }

    // Verificar si el anuncio tiene información de hogar/muebles en atributos_clave (JSONB)
    const hasHomeFurnitureInfo = ad.atributos_clave && typeof ad.atributos_clave === 'object' && ad.atributos_clave.subcategoria;

    if (hasHomeFurnitureInfo) {
        const attr = ad.atributos_clave;

        // Lista de subcategorías de hogar para verificar
        const homeFurnitureSubcats = ["Muebles de Sala", "Muebles de Dormitorio", "Cocina y Comedor", "Electrodomésticos", "Decoración", "Jardín"];

        // Solo procesar si es realmente hogar/muebles
        if (!homeFurnitureSubcats.includes(attr.subcategoria)) {
            if (homeFurnitureDetailsContainer) {
                homeFurnitureDetailsContainer.style.display = 'none';
            }
            return;
        }

        // Verificar si es Hogar (no Electrónica)
        if (attr.tipo_mueble || attr.tipo_articulo || attr.tipo_electrodomestico || attr.tipo_decoracion || attr.material) {
            let specsHTML = '';

            // Mapeo de atributos a iconos y etiquetas
            const attrConfig = {
                tipo_mueble: { icon: 'fas fa-couch', label: 'Tipo de Mueble' },
                tipo_articulo: { icon: 'fas fa-utensils', label: 'Tipo de Artículo' },
                tipo_decoracion: { icon: 'fas fa-paint-brush', label: 'Tipo' },
                marca: { icon: 'fas fa-copyright', label: 'Marca' },
                material: { icon: 'fas fa-cube', label: 'Material' },
                color: { icon: 'fas fa-palette', label: 'Color' },
                dimensiones: { icon: 'fas fa-ruler-combined', label: 'Dimensiones' },
                condicion: { icon: 'fas fa-check-circle', label: 'Condición' }
            };

            // Iconos específicos para electrodomésticos
            if (attr.tipo_electrodomestico) {
                const electroIcon = {
                    'Refrigerador': 'fas fa-snowflake',
                    'Lavadora': 'fas fa-tint',
                    'Microondas': 'fas fa-fire',
                    'Estufa': 'fas fa-fire-alt',
                    'Licuadora': 'fas fa-blender',
                    'Aspiradora': 'fas fa-wind'
                };
                const icon = electroIcon[attr.tipo_electrodomestico] || 'fas fa-plug';
                specsHTML += `
                    <div class="spec-item">
                        <i class="${icon}"></i>
                        <div class="spec-content">
                            <span class="spec-label">Tipo</span>
                            <span class="spec-value">${attr.tipo_electrodomestico}</span>
                        </div>
                    </div>
                `;
            }

            // Agregar modelo solo si existe y no es electrodoméstico (para evitar duplicados)
            if (attr.modelo) {
                specsHTML += `
                    <div class="spec-item">
                        <i class="fas fa-barcode"></i>
                        <div class="spec-content">
                            <span class="spec-label">Modelo</span>
                            <span class="spec-value">${attr.modelo}</span>
                        </div>
                    </div>
                `;
            }

            // Generar HTML para cada atributo presente
            Object.keys(attrConfig).forEach(key => {
                if (attr[key]) {
                    const config = attrConfig[key];
                    specsHTML += `
                        <div class="spec-item">
                            <i class="${config.icon}"></i>
                            <div class="spec-content">
                                <span class="spec-label">${config.label}</span>
                                <span class="spec-value">${attr[key]}</span>
                            </div>
                        </div>
                    `;
                }
            });

            if (specsHTML) {
                homeFurnitureDetailsContainer.innerHTML = `
                    <div class="home-furniture-specs-grid">
                        <h2>Detalles del Artículo</h2>
                        <div class="specs-grid">${specsHTML}</div>
                    </div>
                `;
            }
        }
    } else {
        // Si no hay información de hogar, ocultar el contenedor
        if (homeFurnitureDetailsContainer) {
            homeFurnitureDetailsContainer.style.display = 'none';
        }
    }
}

function addFashionDetails(ad) {
    // Buscar si ya existe un contenedor de detalles de moda
    let fashionDetailsContainer = document.querySelector('.fashion-details-container');

    // Si no existe, crearlo
    if (!fashionDetailsContainer) {
        const descriptionContainer = document.querySelector('.description-container');
        if (descriptionContainer) {
            fashionDetailsContainer = document.createElement('div');
            fashionDetailsContainer.className = 'fashion-details-container';
            descriptionContainer.parentNode.insertBefore(fashionDetailsContainer, descriptionContainer);
        }
    }

    // Verificar si el anuncio tiene información de moda en atributos_clave (JSONB)
    const hasFashionInfo = ad.atributos_clave && typeof ad.atributos_clave === 'object' && ad.atributos_clave.subcategoria;

    if (hasFashionInfo) {
        const attr = ad.atributos_clave;
        
        // Lista de subcategorías de moda para verificar
        const fashionSubcats = ["Ropa de Mujer", "Ropa de Hombre", "Ropa de Niños", "Calzado", "Bolsos y Carteras", "Accesorios", "Joyería y Relojes", "Salud y Belleza"];
        
        // Solo procesar si es realmente moda/belleza
        if (fashionSubcats.includes(attr.subcategoria)) {
            let specsHTML = '';

            // Mapeo de atributos a iconos y etiquetas
            const attrConfig = {
                tipo_prenda: { icon: 'fas fa-tshirt', label: 'Tipo de Prenda' },
                tipo_calzado: { icon: 'fas fa-shoe-prints', label: 'Tipo de Calzado' },
                tipo_bolso: { icon: 'fas fa-shopping-bag', label: 'Tipo de Bolso' },
                tipo_accesorio: { icon: 'fas fa-glasses', label: 'Tipo de Accesorio' },
                tipo_joya: { icon: 'fas fa-gem', label: 'Tipo de Joya' },
                tipo_producto: { icon: 'fas fa-spray-can', label: 'Tipo de Producto' },
                talla: { icon: 'fas fa-ruler', label: 'Talla' },
                talla_calzado: { icon: 'fas fa-ruler', label: 'Talla' },
                edad: { icon: 'fas fa-child', label: 'Edad' },
                marca: { icon: 'fas fa-tag', label: 'Marca' },
                material: { icon: 'fas fa-cube', label: 'Material' },
                color: { icon: 'fas fa-palette', label: 'Color' },
                categoria_producto: { icon: 'fas fa-list', label: 'Categoría' },
                condicion: { icon: 'fas fa-check-circle', label: 'Condición' }
            };

            // Generar HTML para cada atributo presente
            Object.keys(attrConfig).forEach(key => {
                if (attr[key]) {
                    const config = attrConfig[key];
                    specsHTML += `
                        <div class="spec-item">
                            <i class="${config.icon}"></i>
                            <div class="spec-content">
                                <span class="spec-label">${config.label}</span>
                                <span class="spec-value">${attr[key]}</span>
                            </div>
                        </div>
                    `;
                }
            });

            if (specsHTML) {
                fashionDetailsContainer.innerHTML = `
                    <div class="fashion-specs-grid">
                        <h2>Detalles del Artículo</h2>
                        <div class="specs-grid">${specsHTML}</div>
                    </div>
                `;
            }
        }
    } else {
        // Si no hay información de moda, ocultar el contenedor
        if (fashionDetailsContainer) {
            fashionDetailsContainer.style.display = 'none';
        }
    }
}

function addVehicleDetails(ad) {
    let vehicleDetailsContainer = document.querySelector('.vehicle-details-container');

    if (!vehicleDetailsContainer) {
        const descriptionContainer = document.querySelector('.description-container');
        if (descriptionContainer) {
            vehicleDetailsContainer = document.createElement('div');
            vehicleDetailsContainer.className = 'vehicle-details-container';
            descriptionContainer.parentNode.insertBefore(vehicleDetailsContainer, descriptionContainer);
        }
    }

    // ✅ LEER DESDE JSONB
    const attr = ad.atributos_clave || {};
    const hasVehicleInfo = attr.marca || attr.anio || attr.kilometraje || attr.transmision || attr.combustible;

    if (hasVehicleInfo) {
        vehicleDetailsContainer.innerHTML = `
            <div class="vehicle-specs-grid">
                <h2>Especificaciones del Vehículo</h2>
                <div class="specs-grid">
                    ${attr.marca ? `
                        <div class="spec-item">
                            <i class="fas fa-car"></i>
                            <div class="spec-content">
                                <span class="spec-label">Marca</span>
                                <span class="spec-value">${attr.marca}</span>
                            </div>
                        </div>
                    ` : ''}
                    ${attr.anio ? `
                        <div class="spec-item">
                            <i class="fas fa-calendar-alt"></i>
                            <div class="spec-content">
                                <span class="spec-label">Año</span>
                                <span class="spec-value">${attr.anio}</span>
                            </div>
                        </div>
                    ` : ''}
                    ${attr.kilometraje ? `
                        <div class="spec-item">
                            <i class="fas fa-tachometer-alt"></i>
                            <div class="spec-content">
                                <span class="spec-label">Kilometraje</span>
                                <span class="spec-value">${attr.kilometraje.toLocaleString('es-PA')} km</span>
                            </div>
                        </div>
                    ` : ''}
                    ${attr.transmision ? `
                        <div class="spec-item">
                            <i class="fas fa-cogs"></i>
                            <div class="spec-content">
                                <span class="spec-label">Transmisión</span>
                                <span class="spec-value">${attr.transmision}</span>
                            </div>
                        </div>
                    ` : ''}
                    ${attr.combustible ? `
                        <div class="spec-item">
                            <i class="fas fa-gas-pump"></i>
                            <div class="spec-content">
                                <span class="spec-label">Combustible</span>
                                <span class="spec-value">${attr.combustible}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    } else {
        if (vehicleDetailsContainer) {
            vehicleDetailsContainer.style.display = 'none';
        }
    }
}

function addRealEstateDetails(ad) {
    let realEstateDetailsContainer = document.querySelector('.real-estate-details-container');

    if (!realEstateDetailsContainer) {
        const descriptionContainer = document.querySelector('.description-container');
        if (descriptionContainer) {
            realEstateDetailsContainer = document.createElement('div');
            realEstateDetailsContainer.className = 'real-estate-details-container';
            descriptionContainer.parentNode.insertBefore(realEstateDetailsContainer, descriptionContainer);
        }
    }

    // ✅ LEER DESDE JSONB
    const attr = ad.atributos_clave || {};
    const hasRealEstateInfo = attr.m2 || attr.habitaciones || attr.baños;

    if (hasRealEstateInfo) {
        realEstateDetailsContainer.innerHTML = `
            <div class="real-estate-specs-grid">
                <h2>Detalles del Inmueble</h2>
                <div class="specs-grid">
                    ${attr.m2 ? `
                        <div class="spec-item">
                            <i class="fas fa-ruler-combined"></i>
                            <div class="spec-content">
                                <span class="spec-label">Metros Cuadrados</span>
                                <span class="spec-value">${attr.m2} m²</span>
                            </div>
                        </div>
                    ` : ''}
                    ${attr.habitaciones ? `
                        <div class="spec-item">
                            <i class="fas fa-bed"></i>
                            <div class="spec-content">
                                <span class="spec-label">Habitaciones</span>
                                <span class="spec-value">${attr.habitaciones}</span>
                            </div>
                        </div>
                    ` : ''}
                    ${attr.baños ? `
                        <div class="spec-item">
                            <i class="fas fa-bath"></i>
                            <div class="spec-content">
                                <span class="spec-label">Baños</span>
                                <span class="spec-value">${attr.baños}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    } else {
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
