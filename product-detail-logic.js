import { supabase } from './supabase-client.js';
import { ReviewModal, hasUserReviewedSeller, getSellerReviews, getSellerReviewStats, generateReviewStatsHTML, generateReviewHTML } from './reviews-logic.js';
import { initDetailChatForm } from './chat-logic.js';
// Tu API Key de Google Maps
const MAPS_API_KEY_DETALLE = 'AIzaSyBijfhc6uDfEfzAreBjH_tJpYpc1yDvFas';

// ============================================
// FUNCIÓN: Esperar a que Google Maps esté listo (Poller)
// ============================================
function waitForGoogleMaps() {
    return new Promise((resolve) => {
        if (window.google && window.google.maps && window.google.maps.Map) {
            resolve();
        } else {
            const checkInterval = setInterval(() => {
                if (window.google && window.google.maps && window.google.maps.Map) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100); // Revisa cada 100ms
        }
    });
}

// ============================================
// FUNCIÓN: Geocodificar dirección usando Google Maps Geocoder
// ============================================
async function geocodeAddress(ad) {
    // Build address string from available fields
    const parts = [];
    if (ad.direccion_exacta) parts.push(ad.direccion_exacta);
    if (ad.distrito) parts.push(ad.distrito);
    if (ad.provincia) parts.push(ad.provincia);
    // Add country to improve geocoding accuracy
    parts.push('Panama');
    
    const address = parts.filter(Boolean).join(', ');
    if (!address) {
        return null;
    }
    
    // Ensure Google Maps is loaded
    await loadGoogleMapsScriptDetalle();
    await waitForGoogleMaps();
    
    if (!window.google || !window.google.maps) {
        console.error('Google Maps not available for geocoding');
        return null;
    }
    
    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve) => {
        geocoder.geocode({ address }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
                const first = results[0];
                resolve({
                    lat: first.geometry.location.lat(),
                    lng: first.geometry.location.lng(),
                    formatted_address: first.formatted_address
                });
            } else {
                resolve(null);
            }
        });
    });
}

// ============================================
// FUNCIÓN: Cargar mapa de solo lectura en detalle del producto
// ============================================
async function loadProductMap(lat, lng, address) {
    const mapContainer = document.getElementById('mapa-detalles');
    const navigateBtn = document.getElementById('btn-navegar-maps');
    
    if (!mapContainer) {
        console.warn('Contenedor del mapa no encontrado');
        return;
    }

    // Configurar botón de navegación
    if (navigateBtn) {
        navigateBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }

    // Cargar Google Maps API si no está disponible
    if (!window.google || !window.google.maps) {
        await loadGoogleMapsScriptDetalle();
    }

    // Esperar a que Google Maps esté listo
    await waitForGoogleMaps();

    // Crear el mapa de solo lectura (usando API clásica)
    const map = new window.google.maps.Map(mapContainer, {
        center: { lat: lat, lng: lng },
        zoom: 15,
        mapId: 'DEMO_MAP_ID',
        disableDefaultUI: true,
        gestureHandling: 'none',
        zoomControl: false,
        scrollwheel: false,
        disableDoubleClickZoom: true
    });

    // Crear marcador verde usando AdvancedMarkerElement
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    
    const marker = new AdvancedMarkerElement({
        position: { lat: lat, lng: lng },
        map: map,
        title: address || 'Ubicación del producto'
    });

    console.log('Mapa de detalles cargado en:', lat, lng);
}

// ============================================
// FUNCIÓN: Cargar script de Google Maps
// ============================================
function loadGoogleMapsScriptDetalle() {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY_DETALLE}&loading=async&language=es`;
        
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Error al cargar Google Maps'));
        
        document.head.appendChild(script);
    });
}

// ============================================
// FUNCIÓN UNIFICADA: Burbujas Uniformes para TODOS los Atributos
// ============================================
function displayAllAttributesComprehensive(ad) {
    const container = document.getElementById('lista-detalles-completa');
    if (!container) return;

    let atributos = {};
    try {
        atributos = typeof ad.atributos_clave === 'string' ? JSON.parse(ad.atributos_clave) : ad.atributos_clave;
    } catch (e) { 
        console.error("Error al leer atributos", e); 
        return; 
    }

    const categoria = ad.categoria?.toLowerCase() || '';
    const iconMap = { 
        // Inmuebles
        'superficie': 'fa-ruler-combined', 'm2': 'fa-ruler-combined', 'habitaciones': 'fa-bed', 
        'banos': 'fa-bath', 'piso': 'fa-building', 'estacionamiento': 'fa-parking', 
        'amueblado': 'fa-couch', 'ascensor': 'fa-elevator', 'jardin': 'fa-leaf', 
        'piscina': 'fa-swimmer', 'tipo_propiedad': 'fa-home',
        // Vehículos
        'kilometraje': 'fa-tachometer-alt', 'anio': 'fa-calendar-alt', 'combustible': 'fa-gas-pump',
        'marca': 'fa-car', 'modelo': 'fa-car-side', 'color': 'fa-palette', 
        'rines': 'fa-circle-notch', 'tapiz': 'fa-couch', 'transmision': 'fa-cogs', 
        'puertas': 'fa-door-open', 'vidrios': 'fa-window-restore', 'direccion': 'fa-steering-wheel', 
        'frenos': 'fa-stop-circle', 'airbags': 'fa-shield-alt', 'estado': 'fa-star',
        // Electrónica
        'memoria_ram': 'fa-microchip', 'almacenamiento': 'fa-hdd', 'procesador': 'fa-microchip', 'condicion': 'fa-check-circle',
        // Mascotas
        'raza': 'fa-dog', 'genero': 'fa-venus-mars', 'edad_mascota': 'fa-birthday-cake',
        // Genéricos
        'talla': 'fa-ruler', 'material': 'fa-cube'
    };

    // Excluir keys de control interno
    const excludePatterns = ['step', 'categoria', 'subcategoria', 'provincia', 'distrito', 'attr-'];
    const validEntries = Object.entries(atributos).filter(([key, val]) => {
        const isValidKey = !excludePatterns.some(pattern => key.includes(pattern) || key.startsWith(pattern));
        const isValidValue = val && val !== '' && val !== 'N/A' && val !== '{}' && val !== null;
        return isValidKey && isValidValue;
    });

    if (validEntries.length === 0) {
        container.style.display = 'none';
        return;
    }

    // Configuración dinámico TOP 3 BURBUJAS por categoría
    let topKeys = ['anio', 'kilometraje', 'combustible']; // Default vehículos
    if (categoria.includes('inmuebl')) topKeys = ['m2', 'habitaciones', 'banos'];
    else if (['electronica', 'celular', 'computadora'].some(c => categoria.includes(c))) topKeys = ['condicion', 'almacenamiento', 'memoria_ram'];
    else if (['mascota', 'perro', 'gato'].some(c => categoria.includes(c))) topKeys = ['raza', 'genero', 'edad_mascota'];
    else topKeys = validEntries.slice(0,3).map(([k]) => k); // Fallback: primeros 3

    const topBurbujas = validEntries.filter(([key]) => topKeys.includes(key));
    
        let htmlTop = '';
    if (topBurbujas.length > 0) {
        htmlTop = '<div class="attr-bubbles-top">';
        topBurbujas.forEach(([key, val]) => {
            const icon = iconMap[key] || 'fa-tag';
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            let value = val;
            if (key === 'kilometraje') value += ' km';
            else if (key === 'm2') value += ' m²';
            htmlTop += `
                <div class="attr-bubble">
                    <i class="fas ${icon}"></i>
                    <span class="attr-bubble-value">${value}</span>
                    <span class="attr-bubble-label">${label}</span>
                </div>`;
        });
        htmlTop += '</div>';
    }

    // GRUPO 2: LISTA 2 COL (resto attrs)
    const bottomEntries = validEntries.filter(([key]) => !topKeys.includes(key));
    let htmlBottom = '<div class="attr-list-bottom">';
    
    bottomEntries.forEach(([key, val]) => {
        const icon = iconMap[key] || 'fa-info-circle';
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        htmlBottom += `
            <div class="attr-row">
                <i class="fas ${icon}"></i>
                <span class="attr-row-label">${label}:</span>
                <span class="attr-row-value">${val}</span>
            </div>`;
    });
    htmlBottom += '</div>';

    container.style.display = 'block'; 
    container.innerHTML = htmlTop + htmlBottom;
}



// ============================================
// FUNCIÓN AUXILIAR: Convertir rutas de imágenes a URLs completas
// ============================================
const convertToFullUrl = (imagePath) => {
    if (!imagePath) return null;
    // Si ya es una URL completa (http/https), devolverla tal cual
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    // Si es una ruta relativa, convertirla a URL completa de Supabase
    try {
        const { data: { publicUrl } } = supabase.storage
            .from('imagenes_anuncios')
            .getPublicUrl(imagePath);
        return publicUrl;
    } catch (error) {
        console.warn('Error convirtiendo imagen:', imagePath, error);
        return imagePath; // Devolver la ruta original como fallback
    }
};

// product-detail-logic.js (VERSIÓN CON GALERÍA Y MEJOR MANEJO DE ERRORES)

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔔 DOMContentLoaded disparado - Iniciando carga del detalle...');
    
    // Poner esto apenas inicia la carga de la página de detalle
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    console.log('Iniciando carga del detalle del producto...');

    const params = new URLSearchParams(window.location.search);
    const adId = params.get('id');
    const openChat = params.get('chat') === 'true';

    console.log('ID del anuncio:', adId);
    console.log('Abrir chat automáticamente:', openChat);

    if (!adId) {
        console.error('No se especificó ningún ID de producto');
        displayError("No se especificó ningún producto.");
        return;
    }

    try {
        console.log('🔔 Inside try block');
        // Primero cargar el anuncio
        console.log('Cargando anuncio con ID:', adId);
        const { data: ad, error: adError } = await supabase
            .from('anuncios')
            .select('*')
            .eq('id', adId)
            .single();

        console.log('Respuesta del anuncio:', { ad, adError });

        if (adError) {
            console.error('Error al cargar el anuncio:', adError);
            displayError("Error al cargar el anuncio. Por favor, intenta de nuevo.");
            return;
        }

        if (!ad) {
            console.error('Anuncio no encontrado');
            displayError("El anuncio que buscas no existe.");
            return;
        }

        console.log("Datos del anuncio:", ad);
        console.log("🟢 [Detail] Keys del objeto ad:", Object.keys(ad));
        
        // Procesar imágenes: Usar url_galeria como fuente principal (la tabla imagenes puede fallar)
        let galleryImages = [];
        
        // PRIORIDAD 1: url_galeria (array de strings - fuente principal)
        if (ad.url_galeria) {
        if (Array.isArray(ad.url_galeria) && ad.url_galeria.length > 0) {
                galleryImages = ad.url_galeria.map(url => convertToFullUrl(url));
            } else if (typeof ad.url_galeria === 'string' && ad.url_galeria.trim() !== '') {
                galleryImages = [convertToFullUrl(ad.url_galeria)];
            }
            console.log('🟢 [Detail] Usando url_galeria:', galleryImages.length);
        }
        // PRIORIDAD 2: url_portada
        else if (ad.url_portada && ad.url_portada.trim() !== '') {
            galleryImages = [convertToFullUrl(ad.url_portada)];
            console.log('🟢 [Detail] Usando url_portada');
        }
        // ULTIMO RESORT: placeholder
        if (galleryImages.length === 0) {
            galleryImages = ['https://via.placeholder.com/500x400?text=Sin+Imagen'];
            console.log('🟢 [Detail] Sin imágenes, usando placeholder');
        }

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
        
        // ✅ LLAMAR A displayProductDetails PARA MOSTRAR LOS DATOS
        console.log('🔔 LLAMANDO displayProductDetails con galleryImages:', galleryImages);
        await displayProductDetails(ad, openChat, galleryImages);
        console.log('🔔 displayProductDetails completado');
    } catch (error) {
        console.error('Error inesperado al cargar el producto:', error);
        displayError("Error inesperado al cargar el producto. Por favor, intenta de nuevo.");
    }
});

async function displayProductDetails(ad, openChat = false, galleryImages = []) {
    console.log('Mostrando detalles del producto:', ad);
    console.log('¿Abrir chat automáticamente?:', openChat);
    console.log('Imágenes de la galería:', galleryImages);

    // Verificar que los elementos del DOM existan
    const productNameEl = document.getElementById('product-name');
    const productPriceEl = document.getElementById('product-price');
    const productDescriptionEl = document.getElementById('product-description');
    const galleryWrapperEl = document.getElementById('gallery-wrapper');

    if (!productNameEl || !productPriceEl || !productDescriptionEl || !galleryWrapperEl) {
        console.error('Elementos del DOM no encontrados');
        displayError('Error al cargar la interfaz del producto.');
        return;
    }

    document.title = `${ad.titulo} - Mercados Central`;

    // Rellenar datos de texto
    productNameEl.textContent = ad.titulo || 'Sin título';
    
    // Establecer mensaje por defecto en el textarea de contacto
    try {
        const mensajeInput = document.getElementById('message-input');
        if (mensajeInput && ad.titulo) {
            mensajeInput.value = `Hola, estoy interesado en tu anuncio: ${ad.titulo}. ¿Sigue disponible?`;
        }
    } catch(e) { console.warn('Error con message-input:', e); }
    
    // Formatear precio con moneda panameña (B/. ) y dos decimales
    const priceFormatted = new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(ad.precio || 0);
    productPriceEl.textContent = priceFormatted;
    productDescriptionEl.textContent = ad.descripcion || 'Sin descripción';

    // Mostrar visitas
    try {
        const productVisitsEl = document.getElementById('product-visits');
        if (productVisitsEl) {
            productVisitsEl.textContent = ad.visitas || 0;
        }
    } catch(e) { console.warn('Error con visits:', e); }

    // Mostrar información de contacto del vendedor (opcional)
    try {
        if (typeof loadSellerContactInfo === 'function') loadSellerContactInfo(ad);
    } catch(e) { console.warn('Error con loadSellerContactInfo:', e); }
        // ✅ FASE 4: conectar el formulario de mensaje directo al chat interno
    try {
        initDetailChatForm(ad);
    } catch(e) { console.warn('Error iniciando chat:', e); }

    // Configurar botón de reseñas (opcional)
    try {
        if (typeof setupReviewButton === 'function') setupReviewButton(ad);
    } catch(e) { console.warn('Error con setupReviewButton:', e); }

    // ✅ Cargar y mostrar reseñas del vendedor (opcional)
    try {
        if (ad.user_id && typeof loadSellerReviewsSection === 'function') {
            loadSellerReviewsSection(ad.user_id);
        }
    } catch(e) { console.warn('Error con loadSellerReviewsSection:', e); }

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


    // ⭐️ VISIBILIDAD UNIFICADA: SOLO LA FUNCIÓN PRINCIPAL (sin duplicidad)
    displayAllAttributesComprehensive(ad);
    
    // ✅ Construir la galería con imagen principal y miniaturas
    // Las imágenes ya vienen procesadas del parámetro galleryImages
    console.log('Imágenes válidas para mostrar:', galleryImages);

    if (galleryImages.length > 0) {
        const galleryWrapper = document.getElementById('gallery-wrapper');
        
        // ✅ Estructura: Imagen principal + miniaturas
        const mainImage = galleryImages[0];
        const thumbnails = galleryImages.slice(1);
        
        // Construir HTML de la galería con miniaturas
        let galleryHTML = `
            <div class="gallery-main">
                <img id="main-product-image" src="${mainImage}" alt="${ad.titulo}" style="width: 100%; height: 500px; min-height: 400px; max-height: 600px; object-fit: cover; object-position: center;" onerror="this.src='https://via.placeholder.com/500x400?text=Sin+Imagen'">
            </div>
        `;
        
        if (thumbnails.length > 0) {
            galleryHTML += `
                <div class="gallery-thumbnails">
                    ${galleryImages.map((img, index) => `
                        <div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                            <img src="${img}" alt="Minitura ${index + 1}" onerror="this.src='https://via.placeholder.com/500x400?text=Sin+Imagen'">
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        galleryWrapper.innerHTML = galleryHTML;
        
        // ✅ Agregar event listeners a las miniaturas
        const thumbnailElements = galleryWrapper.querySelectorAll('.thumbnail');
        const mainImageElement = document.getElementById('main-product-image');
        
        thumbnailElements.forEach((thumb, index) => {
            thumb.addEventListener('click', () => {
                // Quitar clase active de todas las miniaturas
                thumbnailElements.forEach(t => t.classList.remove('active'));
                // Agregar clase active a la miniatura seleccionada
                thumb.classList.add('active');
                // Cambiar la imagen principal con transición
                mainImageElement.style.opacity = '0';
                setTimeout(() => {
                    mainImageElement.src = galleryImages[index];
                    mainImageElement.style.opacity = '1';
                }, 200);
            });
        });
        
        // ✅ Transición suave para la imagen principal
        mainImageElement.style.transition = 'opacity 0.2s ease';
        
        console.log('Galería con miniaturas inicializada');
    } else {
        console.log('No hay imágenes disponibles, usando placeholder');
        galleryWrapperEl.innerHTML = `
            <div class="gallery-main">
                <img src="https://via.placeholder.com/500x400?text=Sin+Imagen" alt="Sin imagen disponible" onerror="this.src='https://via.placeholder.com/500x400?text=Sin+Imagen'">
            </div>
        `;
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

    // --- MAPA DE UBICACIÓN DEL PRODUCTO ---
    // Mostrar la sección del mapa por defecto (se ocultará solo si no hay ubicación en absoluto)
    const mapSection = document.getElementById('product-location-section');
    if (mapSection) {
        mapSection.style.display = 'block';
    }

    // Intentar cargar el mapa con coordenadas precisas si están disponibles
    if (ad.latitud && ad.longitud) {
        await loadProductMap(ad.latitud, ad.longitud, ad.ubicacion);
    } else {
        // Si no hay coordenadas precisas, intentar geocodificar con la dirección textual
        const geocoded = await geocodeAddress(ad);
        if (geocoded) {
            // Si geocodificación exitosa, mostrar mapa con coordenadas aproximadas
            await loadProductMap(geocoded.lat, geocoded.lng, geocoded.formatted_address || ad.ubicacion);
        } else {
            // Si también falla la geocodificación, ocultar el mapa y mostrar mensaje
            if (mapSection) {
                mapSection.style.display = 'none';
            }
            // Mostrar mensaje de ubicación no especificada
            const mapContainer = document.getElementById('mapa-detalles');
            if (mapContainer) {
                mapContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Ubicación no especificada</div>';
            }
        }
    }
}

async function loadSellerContactInfo(ad) {
    try {
        // Obtener información del usuario vendedor desde la tabla profiles
        const { data: sellerProfile, error } = await supabase
            .from('profiles')
            .select('telefono, email, nombre_negocio, nombre_completo')
            .eq('id', ad.user_id)
            .single();

        // Nombre del vendedor (estructura Fase 3)
        const sellerLineEl = document.getElementById('seller-line');
        if (sellerLineEl && sellerProfile) {
            const sellerName = sellerProfile?.nombre_negocio || sellerProfile?.nombre_completo || 'Usuario Verificado';
            sellerLineEl.innerHTML = `<i class="fas fa-user"></i> ${sellerName}`;
        }

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

        // ✅ WhatsApp: Enlace directo con mensaje prellenado
        if (whatsappLinkEl && sellerProfile?.telefono) {
            const phoneNumber = sellerProfile.telefono.replace(/\D/g, ''); // Solo dígitos, eliminar cualquier carácter no numérico
            const message = `Hola! Estoy interesado en el anuncio: ${ad.titulo}`;
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
            whatsappLinkEl.href = whatsappUrl;
            whatsappLinkEl.target = '_blank';
            whatsappLinkEl.rel = 'noopener noreferrer';
            console.log('URL de WhatsApp:', whatsappUrl);
            whatsappLinkEl.style.display = 'flex';
        } else {
            if (whatsappLinkEl) whatsappLinkEl.style.display = 'none';
        }

        // ✅ Email: Enlace mailto con asunto y cuerpo
        if (emailLinkEl && sellerProfile?.email) {
            const subject = encodeURIComponent(`Interesado en tu anuncio: ${ad.titulo}`);
            const body = encodeURIComponent(`Hola, estoy interesado en tu anuncio "${ad.titulo}" y me gustaría tener más detalles.`);
            emailLinkEl.href = `mailto:${sellerProfile.email}?subject=${subject}body=${body}`;
            emailLinkEl.style.display = 'flex';
        } else {
            if (emailLinkEl) emailLinkEl.style.display = 'none';
        }

        // ✅ Teléfono: Enlace tel para llamar directamente
        if (phoneLinkEl && sellerProfile?.telefono) {
            phoneLinkEl.href = `tel:${sellerProfile.telefono}`;
            phoneLinkEl.style.display = 'flex';
        } else {
            if (phoneLinkEl) phoneLinkEl.style.display = 'none';
        }

    } catch (error) {
        console.error('Error al cargar información de contacto del vendedor:', error);
    }
}

async function setupReviewButton(ad) {
    const reviewBtn = document.getElementById('leave-review-btn');

    if (!reviewBtn) return;

    try {
        // Verificar si el usuario está autenticado
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            // Usuario no autenticado - ocultar botón
            reviewBtn.style.display = 'none';
            return;
        }

        // Verificar si el usuario actual es el propietario del anuncio
        if (user.id === ad.user_id) {
            // Es el propietario - ocultar botón
            reviewBtn.style.display = 'none';
            return;
        }

        // Verificar si el usuario ya reseñó a este vendedor
        let alreadyReviewed = false;
        try {
            alreadyReviewed = await hasUserReviewedSeller(ad.user_id);
        } catch (error) {
            console.warn('Función has_user_reviewed_seller no disponible, asumiendo que no ha reseñado:', error.message);
            // Si la función no existe, asumimos que no ha reseñado para permitir el flujo
            alreadyReviewed = false;
        }

        if (alreadyReviewed) {
            // Ya reseñó - mostrar mensaje y ocultar botón
            reviewBtn.style.display = 'none';
            const reviewSection = document.querySelector('.review-seller-section p');
            if (reviewSection) {
                reviewSection.textContent = 'Ya has calificado a este vendedor.';
            }
            return;
        }

        // Usuario puede reseñar - mostrar botón
        reviewBtn.style.display = 'block';

        // Configurar evento click (solo una vez)
        if (!reviewBtn.dataset.reviewListenerAdded) {
            reviewBtn.addEventListener('click', async () => {
                console.log('Click en botón de reseña detectado');
                try {
                    // Verificar si ya existe un modal
                    const existingModal = document.getElementById('review-modal');
                    if (existingModal) {
                        console.log('Removiendo modal existente');
                        existingModal.remove();
                    }

                    // Obtener nombre del vendedor
                    const sellerName = ad.profiles?.nombre_negocio || 'este vendedor';
                    console.log('Creando modal para:', sellerName, ad.user_id);

                    // Crear modal de reseña
                    const reviewModal = new ReviewModal(ad.user_id, sellerName, (newReview) => {
                        // Callback cuando se envía la reseña
                        console.log('Reseña enviada:', newReview);
                        // Recargar la página o actualizar la UI
                        window.location.reload();
                    });

                    console.log('Modal creado, mostrando...');
                    // Mostrar modal
                    reviewModal.show();
                    console.log('Modal mostrado exitosamente');

                } catch (error) {
                    console.error('Error al abrir modal de reseña:', error);
                    alert('Error al abrir el modal de reseña: ' + error.message);
                }
            });
            reviewBtn.dataset.reviewListenerAdded = 'true';
        }

    } catch (error) {
        console.error('Error configurando botón de reseñas:', error);
        reviewBtn.style.display = 'none';
    }
}

function displayError(message) {
    console.error('Mostrando error:', message);

    // Verificar si existe el contenedor principal
    const mainContainer = document.querySelector('.detail-page');
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

// ✅ Función para cargar y mostrar las reseñas del vendedor
async function loadSellerReviewsSection(sellerId) {
    const section = document.getElementById('seller-reviews-section');
    const statsContainer = document.getElementById('seller-reviews-stats');
    const listContainer = document.getElementById('seller-reviews-list');
    
    if (!section || !statsContainer || !listContainer) {
        console.warn('Contenedores de reseñas no encontrados en el DOM');
        return;
    }
    
    try {
        // Obtener estadísticas y reseñas del vendedor
        const [stats, reviews] = await Promise.all([
            getSellerReviewStats(sellerId),
            getSellerReviews(sellerId)
        ]);
        
        // Mostrar la sección
        section.style.display = 'block';
        
        // Generar estadísticas
        if (stats.total_reviews > 0) {
            statsContainer.innerHTML = generateReviewStatsHTML(stats);
        } else {
            statsContainer.innerHTML = '<p class="no-reviews"><i class="far fa-star" style="color: #4a6fa5; margin-right: 8px;"></i>Este vendedor aún no tiene reseñas. <strong>¡Sé el primero en calificarlo!</strong></p>';
        }
        
        // Generar lista de reseñas
        
        if (reviews && reviews.length > 0) {
            listContainer.innerHTML = `
                <div class="reviews-list">
                    ${reviews.map(review => generateReviewHTML(review)).join('')}
                </div>
            `;
        } else {
            listContainer.innerHTML = '<p class="no-reviews">No hay opiniones sobre este vendedor todavía.</p>';
        }
        
    } catch (error) {
        console.error('Error cargando reseñas del vendedor:', error);
        section.style.display = 'none';
    }
}

// --- FORZAR LA PANTALLA ARRIBA AL CARGAR LOS DETALLES ---
window.addEventListener('load', () => {
    // Un pequeño retraso de 150ms para ganarle a Google Maps y a la Galería
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, 150);
});
