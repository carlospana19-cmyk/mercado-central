import { supabase } from './supabase-client.js';
import { ReviewModal, hasUserReviewedSeller, getSellerReviews, getSellerReviewStats, generateReviewStatsHTML, generateReviewHTML } from './reviews-logic.js';
import { initDetailChatForm } from './chat-logic.js';
import { tarjetaAnuncioHTML } from './tarjeta-anuncio.js';
import { initializeAllCardLikes } from './likes-logic.js';
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
// FASE 1-C: Ficha técnica sobria — tabla de dos columnas
// (etiqueta en gris → valor en oscuro semibold), SIN iconos, SIN burbujas.
// Solo datos reales del anuncio: si el vendedor escribió "121", se muestra
// "121" tal cual (sin inventar unidades). Si un atributo no aplica, no hay fila.
// ============================================
const SPEC_LABELS = {
    condicion: 'Condición', estado: 'Estado', procesador: 'Procesador', memoria_ram: 'Memoria RAM',
    almacenamiento: 'Almacenamiento', marca: 'Marca', modelo: 'Modelo', color: 'Color',
    anio: 'Año', kilometraje: 'Kilometraje', combustible: 'Combustible', transmision: 'Transmisión',
    puertas: 'Puertas', vidrios: 'Vidrios', direccion: 'Dirección', frenos: 'Frenos', airbags: 'Airbags',
    rines: 'Rines', tapiz: 'Tapicería', m2: 'Superficie (m²)', habitaciones: 'Habitaciones',
    banos: 'Baños', piso: 'Piso', estacionamiento: 'Estacionamientos', amueblado: 'Amueblado',
    ascensor: 'Ascensor', jardin: 'Jardín', piscina: 'Piscina', tipo_propiedad: 'Tipo de propiedad',
    anio_construccion: 'Año de construcción', raza: 'Raza', genero: 'Género', edad_mascota: 'Edad',
    talla: 'Talla', material: 'Material', garantia: 'Garantía', bateria: 'Batería'
};

const AMP = String.fromCharCode(38); // "&" sin escribir la entidad literal
const escaparHtml = (texto) => String(texto)
    .replace(/&/g, AMP + 'amp;')
    .replace(/</g, AMP + 'lt;')
    .replace(/>/g, AMP + 'gt;')
    .replace(/"/g, AMP + 'quot;')
    .replace(/'/g, AMP + '#39;');

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

    // Excluir keys de control interno y valores vacíos (si no aplica, no se muestra la fila)
    const excludePatterns = ['step', 'categoria', 'subcategoria', 'provincia', 'distrito', 'attr-'];
    const validEntries = Object.entries(atributos || {}).filter(([key, val]) => {
        const isValidKey = !excludePatterns.some(pattern => key.includes(pattern) || key.startsWith(pattern));
        const isValidValue = val !== undefined && val !== null && String(val).trim() !== '' && String(val) !== 'N/A' && String(val) !== '{}';
        return isValidKey && isValidValue;
    });

    if (validEntries.length === 0) {
        container.style.display = 'none';
        return;
    }

    // ✅ FASE 1-F: características colapsables — primeras 5 filas por defecto;
    // si hay más, enlace "Ver más detalles ▾" que muestra TODAS y pasa a "Ver menos ▴".
    const MOSTRAR = 5;
    const filaHTML = ([key, val]) => {
        const etiqueta = SPEC_LABELS[key] || String(key).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const valor = (val && typeof val === 'object') ? JSON.stringify(val) : val;
        return `<div class="spec-row"><dt>${escaparHtml(etiqueta)}</dt><dd>${escaparHtml(valor)}</dd></div>`;
    };

    if (validEntries.length > MOSTRAR) {
        const visibles = validEntries.slice(0, MOSTRAR).map(filaHTML).join('');
        const ocultas = validEntries.slice(MOSTRAR).map(filaHTML).join('');
        container.style.display = 'block';
        container.innerHTML = `<dl class="spec-table">${visibles}</dl>
            <dl class="spec-table spec-extra" style="display:none">${ocultas}</dl>
            <button type="button" class="ver-mas-detalles" id="ver-mas-detalles">Ver más detalles <i class="fas fa-chevron-down"></i></button>`;

        const btnMas = document.getElementById('ver-mas-detalles');
        const extra = container.querySelector('.spec-extra');
        btnMas.addEventListener('click', () => {
            const abierto = extra.style.display !== 'none';
            extra.style.display = abierto ? 'none' : 'block';
            btnMas.innerHTML = abierto
                ? 'Ver más detalles <i class="fas fa-chevron-down"></i>'
                : 'Ver menos <i class="fas fa-chevron-up"></i>';
        });
    } else {
        container.style.display = 'block';
        container.innerHTML = `<dl class="spec-table">${validEntries.map(filaHTML).join('')}</dl>`;
    }
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
    var _id = new URLSearchParams(location.search).get('id');
    if (_id) document.getElementById('mc-canonical').href =
      'https://www.mercadoscentral.com/detalle-producto.html?id=' + encodeURIComponent(_id);

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
            galleryImages = ['img/placeholder.jpg'];
            console.log('🟢 [Detail] Sin imágenes, usando placeholder');
        }

        // Incrementar contador de visitas
        // (RPC security-definer: con RLS activado, un visitante anónimo ya
        //  no puede hacer UPDATE directo sobre anuncios; el incremento lo
        //  hace la función mc_incrementar_visitas del lado del servidor).
        try {
            const { error: updateError } = await supabase
                .rpc('mc_incrementar_visitas', { p_anuncio_id: adId });

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
    
    // Formatear precio con moneda panameña (B/. 25.00 — espacio después de B/.) y dos decimales
    const priceFormatted = new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(ad.precio || 0);
    productPriceEl.textContent = priceFormatted;
    productPriceEl.textContent = priceFormatted;
    productDescriptionEl.textContent = ad.descripcion || 'Sin descripción';
    productPriceEl.textContent = priceFormatted;
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

    // ✅ COMPARTIR ANUNCIO (PARTE 2): fila "Compartir" junto a las acciones de contacto
    // (WhatsApp / Facebook / Instagram / Copiar enlace) con URL canónica del anuncio.
    try {
        if (typeof initShareActions === 'function') initShareActions(ad);
    } catch(e) { console.warn('Error con initShareActions:', e); }
    // ✅ FASE 2: sección "Más anuncios de [Nombre]" al final del detalle
    try {
        if (ad.user_id) loadSellerMoreAds(ad);
    } catch(e) { console.warn('Error con más anuncios del vendedor:', e); }

    // ✅ FASE 2: sección "Más anuncios de [Nombre]" al final del detalle
    try {
        if (ad.user_id) loadSellerMoreAds(ad);
    } catch(e) { console.warn('Error con más anuncios del vendedor:', e); }

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
    
    // ✅ FASE 1-E: Galería moderna — foto principal GRANDE (4:3, cover), miniaturas
    // de 80px con estado activo (borde naranja), botón de ampliar y VISOR propio
    // (lightbox, JS puro sin librerías). Fallback local: nunca una imagen rota.
    console.log('Imágenes válidas para mostrar:', galleryImages);

    const FOTO_RESPALDO = 'img/placeholder.jpg';

    if (galleryImages.length > 0) {
        const galleryWrapper = document.getElementById('gallery-wrapper');
        const tieneVarias = galleryImages.length >= 2;
        const badgeConteo = tieneVarias
            ? `<span class="mc-foto-conteo"><i class="fas fa-camera" aria-hidden="true"></i> ${galleryImages.length}</span>`
            : '';
        const btnAmpliar = `<button type="button" class="btn-ampliar" title="Ver en grande"><i class="fas fa-expand" aria-hidden="true"></i></button>`;

        let galleryHTML = `
            <div class="gallery-main">
                ${badgeConteo}
                <img id="main-product-image" src="${galleryImages[0]}" alt="${ad.titulo}" loading="eager" onerror="this.src='${FOTO_RESPALDO}'">
                ${btnAmpliar}
            </div>
        `;

        if (tieneVarias) {
            galleryHTML += `
                <div class="gallery-thumbnails">
                    ${galleryImages.map((img, index) => `
                        <button type="button" class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                            <img src="${img}" alt="Miniatura ${index + 1}" loading="lazy" onerror="this.src='${FOTO_RESPALDO}'">
                        </button>
                    `).join('')}
                </div>
            `;
        }

        galleryWrapper.innerHTML = galleryHTML;

        const mainImageElement = document.getElementById('main-product-image');
        mainImageElement.style.transition = 'opacity 0.2s ease';
        let indiceActivo = 0;

        // ✅ Cambio de foto al hacer clic en las miniaturas
        const thumbnailElements = galleryWrapper.querySelectorAll('.thumbnail');
        thumbnailElements.forEach((thumb, index) => {
            thumb.addEventListener('click', (e) => {
                e.stopPropagation(); // elegir miniatura no debe abrir el visor
                thumbnailElements.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
                indiceActivo = index;
                mainImageElement.style.opacity = '0';
                setTimeout(() => {
                    mainImageElement.src = galleryImages[index];
                    mainImageElement.style.opacity = '1';
                }, 200);
            });
        });

        // ✅ Clic en la foto principal (o en la lupa) abre el visor en grande
        const abrirDesdeGaleria = () => abrirVisor(galleryImages, indiceActivo);
        mainImageElement.addEventListener('click', abrirDesdeGaleria);
        const btnAmpliarEl = galleryWrapper.querySelector('.btn-ampliar');
        if (btnAmpliarEl) btnAmpliarEl.addEventListener('click', (e) => { e.stopPropagation(); abrirDesdeGaleria(); });

        console.log('Galería con miniaturas inicializada');
        // ✅ FASE 1-E: VISOR "SOLO PARA VER EN GRANDE" (lightbox, JS puro, sin librerías)
        function abrirVisor(fotos, indice) {
            cerrarVisor();
            const overlay = document.createElement('div');
            overlay.className = 'visor-overlay' + (fotos.length < 2 ? ' visor-una-foto' : '');
            overlay.innerHTML = `
                <button type="button" class="visor-cerrar" aria-label="Cerrar">✕</button>
                <button type="button" class="visor-flecha visor-prev" aria-label="Foto anterior"><i class="fas fa-chevron-left" aria-hidden="true"></i></button>
                <img class="visor-foto" src="${fotos[indice]}" alt="${ad.titulo}">
                <button type="button" class="visor-flecha visor-next" aria-label="Foto siguiente"><i class="fas fa-chevron-right" aria-hidden="true"></i></button>
                <div class="visor-contador">${indice + 1} / ${fotos.length}</div>
            `;
            overlay.dataset.indice = String(indice);
            overlay.dataset.total = String(fotos.length);
            overlay.dataset.fotos = JSON.stringify(fotos);
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden'; // bloquea el scroll del fondo

            const alTecla = (e) => {
                if (e.key === 'Escape') { cerrarVisor(); return; }
                if (e.key === 'ArrowLeft') cambiarFotoVisor(overlay, -1);
                if (e.key === 'ArrowRight') cambiarFotoVisor(overlay, 1);
            };
            document.addEventListener('keydown', alTecla);
            overlay._alTecla = alTecla;

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay || e.target.closest('.visor-cerrar')) { cerrarVisor(); return; }
                if (e.target.closest('.visor-prev')) cambiarFotoVisor(overlay, -1);
                if (e.target.closest('.visor-next')) cambiarFotoVisor(overlay, 1);
            });

            let toqueX = null;
            overlay.addEventListener('touchstart', (e) => { toqueX = e.changedTouches[0].clientX; }, { passive: true });
            overlay.addEventListener('touchend', (e) => {
                if (toqueX === null) return;
                const delta = e.changedTouches[0].clientX - toqueX;
                if (Math.abs(delta) > 40) cambiarFotoVisor(overlay, delta < 0 ? 1 : -1);
                toqueX = null;
            }, { passive: true });
        }

        function pintarVisor(overlay) {
            const fotos = JSON.parse(overlay.dataset.fotos);
            const indice = Number(overlay.dataset.indice);
            overlay.querySelector('.visor-foto').src = fotos[indice];
            overlay.querySelector('.visor-contador').textContent = `${indice + 1} / ${fotos.length}`;
            overlay.querySelector('.visor-prev').disabled = indice === 0;
            overlay.querySelector('.visor-next').disabled = indice === fotos.length - 1;
        }

        function cambiarFotoVisor(overlay, delta) {
            const nuevo = Math.min(Math.max(Number(overlay.dataset.indice) + delta, 0), Number(overlay.dataset.total) - 1);
            if (nuevo === Number(overlay.dataset.indice)) return;
            overlay.dataset.indice = String(nuevo);
            pintarVisor(overlay);
        }

        function cerrarVisor() {
            const overlay = document.querySelector('.visor-overlay');
            if (!overlay) return;
            if (overlay._alTecla) document.removeEventListener('keydown', overlay._alTecla);
            overlay.remove();
            document.body.style.overflow = '';
        }
    } else {
        console.log('No hay imágenes disponibles, usando placeholder local');
        galleryWrapperEl.innerHTML = `
            <div class="gallery-main sin-foto">
                <img src="${FOTO_RESPALDO}" alt="Sin imagen disponible">
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
            // ✅ FASE 1-F: enlace discreto (JAMÁS display:block — esa era la burbuja gigante)
            editButton.style.display = 'inline-flex';
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

// ============================================
// ✅ COMPARTIR ANUNCIO (PARTE 2)
// URL canónica del anuncio + botones WhatsApp / Facebook / Instagram / Copiar
// enlace. Todo con encodeURIComponent y degradación con gracia donde
// navigator.share / navigator.clipboard no existan.
// ============================================

// URL pública canónica del anuncio: base del <link rel="canonical" id="mc-canonical">
// (URL pública del detalle) + ?id=<id codificado>. Fallback: la URL actual.
function buildShareUrl(ad) {
    let base = '';
    const canonicalEl = document.getElementById('mc-canonical');
    if (canonicalEl && canonicalEl.href) {
        base = canonicalEl.href.split('?')[0].split('#')[0];
    }
    if (!base || !/^https?:\/\//i.test(base)) {
        base = window.location.origin + window.location.pathname;
    }
    return `${base}?id=${encodeURIComponent(ad.id)}`;
}

// Copiar al portapapeles con degradación: Clipboard API → document.execCommand('copy')
async function copiarAlPortapapeles(texto) {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(texto);
            return true;
        } catch (e) { /* continúa al fallback */ }
    }
    // Fallback: textarea temporal fuera de pantalla + execCommand
    try {
        const ta = document.createElement('textarea');
        ta.value = texto;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, texto.length);
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
    } catch (e) {
        return false;
    }
}

// Toast del sistema (reutiliza tokens de mc-detail.css: .mc-toast-compartir)
function mcToastCompartir(mensaje) {
    const toast = document.createElement('div');
    toast.className = 'mc-toast-compartir';
    toast.setAttribute('role', 'status');
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
}

// Conecta la fila "Compartir" del detalle con el anuncio actual
function initShareActions(ad) {
    const shareRow = document.getElementById('share-row');
    if (!shareRow || !ad) return;

    const titulo = ad.titulo || 'Anuncio en Mercados Central';
    const url = buildShareUrl(ad);

    // Canonical SEO del anuncio (regla 4: la URL compartida es la canónica)
    const canonicalEl = document.getElementById('mc-canonical');
    if (canonicalEl) canonicalEl.setAttribute('href', url);

    // WhatsApp: texto = título + URL, TODO codificado con encodeURIComponent
    const waEl = document.getElementById('share-whatsapp');
    if (waEl) {
        waEl.href = `https://wa.me/?text=${encodeURIComponent(`${titulo} ${url}`)}`;
    }

    // Facebook: sharer oficial con la URL codificada
    const fbEl = document.getElementById('share-facebook');
    if (fbEl) {
        fbEl.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    }

    // Instagram: no tiene URL de compartir en web → navigator.share (menú del
    // sistema en móvil, incluido Instagram); sin soporte → copiar enlace + toast.
    const igEl = document.getElementById('share-instagram');
    if (igEl) {
        igEl.addEventListener('click', async () => {
            if (navigator.share) {
                try {
                    await navigator.share({ title: titulo, text: titulo, url: url });
                    return; // usuario completó (o canceló) el menú del sistema
                } catch (err) {
                    if (err && err.name === 'AbortError') return; // cancelado por el usuario
                    // Error real del navegador → degradar a copiar enlace
                }
            }
            const ok = await copiarAlPortapapeles(url);
            mcToastCompartir(ok ? 'Enlace copiado: pégalo en tu historia o bio' : 'No se pudo copiar el enlace');
        });
    }

    // Copiar enlace: clipboard + fallback, con toast de confirmación
    const copyEl = document.getElementById('share-copiar');
    if (copyEl) {
        copyEl.addEventListener('click', async () => {
            const ok = await copiarAlPortapapeles(url);
            mcToastCompartir(ok ? 'Enlace copiado' : 'No se pudo copiar el enlace');
        });
    }

    shareRow.style.display = 'block';
}

async function loadSellerContactInfo(ad) {
    try {
        // Obtener información del usuario vendedor desde la tabla profiles
        const { data: sellerProfile, error } = await supabase
            .from('profiles')
            .select('telefono, nombre_negocio, nombre_completo, url_foto_perfil')
            .eq('id', ad.user_id)
            .single();
        // Nombre del vendedor (estructura Fase 3) + enlace a su perfil (FASE 2)
        const sellerLineEl = document.getElementById('seller-line');
        if (sellerLineEl && sellerProfile) {
            const sellerName = sellerProfile?.nombre_negocio || sellerProfile?.nombre_completo || 'Usuario Verificado';
            // ✅ FASE 1-F: foto real del vendedor (url_foto_perfil) o inicial — sin ícono genérico de persona
            const fotoUrl = sellerProfile?.url_foto_perfil;
            const avatarHTML = fotoUrl
                ? `<img class="seller-avatar" src="${escaparHtml(fotoUrl)}" alt="">`
                : `<span class="seller-avatar seller-avatar-inicial" aria-hidden="true">${escaparHtml(sellerName.trim().charAt(0).toUpperCase())}</span>`;
            sellerLineEl.innerHTML = `${avatarHTML}<a class="seller-link" href="perfil-vendedor.html?id=${encodeURIComponent(ad.user_id)}">${sellerName}</a>`;
            // Enlace pequeño gris debajo del nombre: "Ver todos sus anuncios →"
            const verTodosEl = document.getElementById('seller-ver-todos');
            if (verTodosEl) {
                verTodosEl.href = `perfil-vendedor.html?id=${encodeURIComponent(ad.user_id)}`;
                verTodosEl.style.display = 'inline-flex';
            }
        }

        if (error) {
            console.warn('Error al obtener información del vendedor:', error);
            // Fallback: mostrar datos no disponibles
            const sellerPhoneEl = document.getElementById('seller-phone');
            const whatsappLinkEl = document.getElementById('whatsapp-link');

            if (sellerPhoneEl) sellerPhoneEl.textContent = 'No disponible';
            if (whatsappLinkEl) whatsappLinkEl.style.display = 'none';
            return;
        }

        // Mostrar información de contacto
        const whatsappLinkEl = document.getElementById('whatsapp-link');
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

// ✅ FASE 2: sección "Más anuncios de [Nombre]" — hasta 8 tarjetas del mismo
// vendedor, excluyendo el anuncio actual. Si no hay más anuncios, la sección
// NO se muestra (nada de huecos vacíos). Solo lectura, mismo cliente de Supabase.
async function loadSellerMoreAds(ad) {
    const sectionEl = document.getElementById('mas-anuncios-section');
    if (!sectionEl || !ad.user_id) return;

    try {
        const { data: ads, error } = await supabase
            .from('anuncios')
            .select('*, imagenes(url_imagen), profiles(nombre_negocio, nombre_completo, url_foto_perfil)')
            .eq('user_id', ad.user_id)
            .order('fecha_publicacion', { ascending: false })
            .limit(200);

        if (error) {
            console.warn('Error al obtener más anuncios del vendedor:', error);
            return; // la sección permanece oculta
        }

        const otros = (ads || []).filter(Boolean).filter(a => String(a.id) !== String(ad.id));
        if (otros.length === 0) return; // no hay más anuncios: la sección NO se muestra

        // Nombre del vendedor: la MISMA fuente que la tarjeta de contacto
        let nombreVendedor = ad.profiles?.nombre_negocio || ad.profiles?.nombre_completo;
        if (!nombreVendedor) {
            try {
                const { data: sellerProfile } = await supabase
                    .from('profiles')
                    .select('nombre_negocio, nombre_completo')
                    .eq('id', ad.user_id)
                    .single();
                nombreVendedor = sellerProfile?.nombre_negocio || sellerProfile?.nombre_completo || 'este vendedor';
            } catch (e) {
                nombreVendedor = 'este vendedor';
            }
        }

        const tituloEl = document.getElementById('mas-anuncios-titulo');
        if (tituloEl) tituloEl.textContent = `Más anuncios de ${nombreVendedor}`;

        const gridEl = document.getElementById('mas-anuncios-grid');
        if (gridEl) {
            gridEl.innerHTML = otros.slice(0, 8).map(tarjetaAnuncioHTML).join('');
            try {
                initializeAllCardLikes();
            } catch (e) { console.warn('Error inicializando likes (más anuncios):', e); }

            // Navegación de las tarjetas (misma delegación que resultados.html)
            let puntoInicio = null;
            gridEl.addEventListener('pointerdown', (e) => {
                puntoInicio = { x: e.clientX, y: e.clientY };
            }, true);
            gridEl.addEventListener('click', (e) => {
                if (puntoInicio && Math.abs(e.clientX - puntoInicio.x) + Math.abs(e.clientY - puntoInicio.y) > 12) return;
                const btnLike = e.target.closest('.like-btn, .like-button, .btn-like');
                if (btnLike) return;
                const tarjeta = e.target.closest('.mc-card');
                if (tarjeta && !tarjeta.classList.contains('card-sold')) {
                    window.location.href = tarjeta.dataset.url || `detalle-producto.html?id=${encodeURIComponent(tarjeta.dataset.adId)}`;
                }
            });
            gridEl.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const tarjeta = e.target.closest('.mc-card');
                if (tarjeta && !tarjeta.classList.contains('card-sold')) {
                    e.preventDefault();
                    window.location.href = tarjeta.dataset.url || `detalle-producto.html?id=${encodeURIComponent(tarjeta.dataset.adId)}`;
                }
            });
        }

        const linkEl = document.getElementById('mas-anuncios-link');
        if (linkEl) linkEl.href = `perfil-vendedor.html?id=${encodeURIComponent(ad.user_id)}`;

        sectionEl.style.display = 'block';
    } catch (error) {
        console.error('Error inesperado en más anuncios del vendedor:', error);
    }
}

async function setupReviewButton(ad) {
    const reviewBtn = document.getElementById('leave-review-btn');    if (!reviewBtn) return;

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
