// perfil-vendedor-logic.js — FASE 2: página de perfil/tienda del vendedor.
// Mismo origen de datos que la página de detalle: profiles.id = anuncios.user_id.
// El nombre y el teléfono de contacto salen de la tabla `profiles` (la misma que
// usa el detalle para "Carlos Navarro" y su WhatsApp). Sin datos inventados.
import { supabase } from './supabase-client.js';
import { tarjetaAnuncioHTML } from './tarjeta-anuncio.js';
import { initializeAllCardLikes } from './likes-logic.js';

// Paginación simple: "Cargar más" a partir de 24 anuncios
const PAGE_SIZE = 24;

const params = new URLSearchParams(window.location.search);
const vendedorId = params.get('id');

const avatarEl = document.getElementById('perfil-avatar');
const nombreEl = document.getElementById('perfil-nombre');
const desdeEl = document.getElementById('perfil-desde');
const countEl = document.getElementById('perfil-count');
const whatsappEl = document.getElementById('whatsapp-link');
const phoneEl = document.getElementById('phone-link');
const tituloEl = document.getElementById('perfil-anuncios-titulo');
const gridEl = document.getElementById('perfil-anuncios');
const vacioEl = document.getElementById('perfil-vacio');
const cargarMasEl = document.getElementById('perfil-cargar-mas');

let anuncios = [];
let anunciosMostrados = 0;

if (!vendedorId) {
    // Sin id: estado vacío, sin página rota
    if (vacioEl) vacioEl.style.display = 'block';
    if (nombreEl) nombreEl.textContent = 'Vendedor no encontrado';
    if (countEl) countEl.textContent = '';
} else {
    cargarPerfil();
}

async function cargarPerfil() {
    try {
        // 1. Perfil del vendedor (misma fuente que la página de detalle)
        const { data: sellerProfile, error: sellerError } = await supabase
            .from('profiles')
            .select('nombre_negocio, nombre_completo, url_foto_perfil, telefono')
            .eq('id', vendedorId)
            .single();

        if (sellerError) {
            console.warn('Vendedor no encontrado:', sellerError);
            if (vacioEl) vacioEl.style.display = 'block';
            if (nombreEl) nombreEl.textContent = 'Vendedor no encontrado';
            if (countEl) countEl.textContent = '';
            return;
        }

        const nombre = sellerProfile?.nombre_negocio || sellerProfile?.nombre_completo || 'Vendedor';
        if (nombreEl) nombreEl.textContent = nombre;
        document.title = `Anuncios de ${nombre} — MercadosCentral`;
        if (tituloEl) tituloEl.textContent = `Anuncios de ${nombre}`;

        // Avatar: foto real si existe; si no, círculo con la inicial
        if (avatarEl) {
            if (sellerProfile?.url_foto_perfil) {
                avatarEl.innerHTML = `<img src="${sellerProfile.url_foto_perfil}" alt="${nombre}" loading="lazy">`;
                avatarEl.classList.add('con-foto');
            } else {
                avatarEl.textContent = (nombre || 'V').trim().charAt(0).toUpperCase();
            }
        }

        // 2. Anuncios del vendedor (misma consulta que resultados.html: la visibilidad
        //    la aplican las RLS de Supabase; no se inventa un filtro de estado)
        const { data: ads, error: adsError } = await supabase
            .from('anuncios')
            .select('*, imagenes(url_imagen), profiles(nombre_negocio, nombre_completo, url_foto_perfil)')
            .eq('user_id', vendedorId)
            .order('fecha_publicacion', { ascending: false })
            .limit(200);

        if (adsError) {
            console.warn('Error al obtener los anuncios del vendedor:', adsError);
            if (vacioEl) vacioEl.style.display = 'block';
            if (countEl) countEl.textContent = '0 anuncios activos';
            return;
        }

        anuncios = (ads || []).filter(Boolean);
        if (countEl) countEl.textContent = `${anuncios.length} anuncios activos`;

        // "Vende desde [mes año]" con la fecha más antigua de sus anuncios (opcional)
        if (desdeEl) {
            const fechas = anuncios
                .map(a => new Date(a.created_at || a.fecha_publicacion || 0).getTime())
                .filter(t => isFinite(t) && t > 0);
            if (fechas.length > 0) {
                const masAntigua = new Date(Math.min(...fechas));
                const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                desdeEl.textContent = `Vende desde ${MES[masAntigua.getMonth()]} ${masAntigua.getFullYear()}`;
                desdeEl.style.display = 'block';
            }
        }

        // 3. Contacto IGUALES a los del detalle (mismo número y mensaje)
        if (sellerProfile?.telefono) {
            const phoneNumber = sellerProfile.telefono.replace(/\D/g, '');
            if (whatsappEl) {
                const message = `Hola! Vi tu anuncio en MercadosCentral.`;
                whatsappEl.href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                whatsappEl.target = '_blank';
                whatsappEl.rel = 'noopener noreferrer';
                whatsappEl.style.display = 'flex';
            }
            if (phoneEl) {
                phoneEl.href = `tel:${sellerProfile.telefono}`;
                phoneEl.style.display = 'flex';
            }
        }

        // 4. Estado vacío o primera página de tarjetas
        if (anuncios.length === 0) {
            if (vacioEl) vacioEl.style.display = 'block';
            if (countEl) countEl.textContent = '0 anuncios activos';
            return;
        }

        mostrarAnuncios();
    } catch (error) {
        console.error('Error inesperado al cargar el perfil:', error);
        if (vacioEl) vacioEl.style.display = 'block';
        if (countEl) countEl.textContent = '';
    }
}

function mostrarAnuncios() {
    const siguiente = anuncios.slice(anunciosMostrados, anunciosMostrados + PAGE_SIZE);
    if (gridEl && siguiente.length > 0) {
        gridEl.insertAdjacentHTML('beforeend', siguiente.map(tarjetaAnuncioHTML).join(''));
    }
    anunciosMostrados += siguiente.length;

    // "Cargar más" solo si quedan anuncios por mostrar
    if (cargarMasEl) {
        if (anunciosMostrados < anuncios.length) {
            cargarMasEl.style.display = 'block';
            if (!cargarMasEl.dataset.listener) {
                cargarMasEl.addEventListener('click', mostrarAnuncios);
                cargarMasEl.dataset.listener = 'true';
            }
        } else {
            cargarMasEl.style.display = 'none';
        }
    }

    // Likes en las tarjetas nuevas
    try {
        initializeAllCardLikes();
    } catch (e) {
        console.warn('Error inicializando likes:', e);
    }
}

// --- Navegación de la tarjeta (misma delegación de resultados.html) ---
// Tarjeta completa clicable; el like funciona solo; no navega si está vendida.
if (gridEl) {
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
