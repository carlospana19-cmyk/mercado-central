// utilidades-ui.js — Ayudantes de presentación para las tarjetas (FASE 1) y fecha relativa (FASE 4).
// Funciones puras, sin dependencias de Supabase. Usadas por home-logic.js y results-logic.js.

// URL real del detalle de un anuncio (la misma que ya usa search-global.js y las tarjetas actuales).
export function urlDetalle(idAnuncio) {
    return `detalle-producto.html?id=${encodeURIComponent(idAnuncio)}`;
}

// Devuelve "B/. 450" con el precio real, o null si no hay precio (entonces la tarjeta muestra "A consultar").
export function precioTexto(anuncio) {
    const bruto = anuncio ? anuncio.precio : null;
    if (bruto === null || bruto === undefined || bruto === '') return null;
    const precio = Number(bruto);
    if (!isFinite(precio) || precio <= 0) return null;
    return 'B/. ' + precio.toLocaleString('es-PA');
}

// "Nuevo": el anuncio tiene menos de 24 horas (usa created_at o fecha_publicacion, campos reales).
export function esNuevo(anuncio) {
    const fecha = anuncio && (anuncio.created_at || anuncio.fecha_publicacion);
    if (!fecha) return false;
    const t = new Date(fecha).getTime();
    if (!isFinite(t)) return false;
    return (Date.now() - t) < 24 * 60 * 60 * 1000;
}

// Badges flotantes de la tarjeta, SOLO si aplican (usa campos reales; no inventa esquemas):
//  - "Destacado": plan de anuncio destacado según featured_plan (destacado/top/elite son los
//    niveles dorados/diamante que hoy ya reciben corona en el sitio).
//  - "Nuevo": publicado hace menos de 24 horas.
// Si no hay campo de verificación de vendedor, no se devuelve ningún badge de ese tipo (pendiente).
export function badgeDe(anuncio) {
    const badges = [];
    const plan = anuncio && anuncio.featured_plan ? String(anuncio.featured_plan).toLowerCase().trim() : '';
    if (plan === 'destacado' || plan === 'top' || plan === 'elite') {
        badges.push({ clase: 'mc-badge mc-badge-destacado', texto: 'Destacado' });
    }
    if (esNuevo(anuncio)) {
        badges.push({ clase: 'mc-badge mc-badge-nuevo', texto: 'Nuevo' });
    }
    return badges;
}

// Inicial del título para el fondo gris cuando el anuncio no tiene foto.
export function inicialDe(texto) {
    const t = (texto || '').trim();
    return t ? t.charAt(0).toUpperCase() : 'M';
}

// ============================================
// FASE 2: iconos y colores pastel suaves por categoría.
// Las claves son los nombres REALES de la tabla `categorias` (en minúsculas,
// con y sin acentos por si acaso). El naranja #FA6406 queda reservado para
// el hover/activo (ver mc-categorias.css) — nada de tonos teal.
// ============================================
const CATEGORIA_ICONOS = {
    'inmuebles': 'fa-house', 'bienes raices': 'fa-house', 'bienes raíces': 'fa-house',
    'vehículos': 'fa-car', 'vehiculos': 'fa-car',
    'electrónica': 'fa-mobile-screen-button', 'electronica': 'fa-mobile-screen-button',
    'hogar y muebles': 'fa-couch',
    'moda y belleza': 'fa-shirt',
    'deportes y hobbies': 'fa-dumbbell',
    'mascotas': 'fa-paw',
    'servicios': 'fa-screwdriver-wrench',
    'negocios': 'fa-briefcase',
    'comunidad': 'fa-people-group'
};

const CATEGORIA_COLORES = {
    'inmuebles': { fondo: '#E8F1FD', icono: '#2F6FED' },
    'bienes raices': { fondo: '#E8F1FD', icono: '#2F6FED' },
    'bienes raíces': { fondo: '#E8F1FD', icono: '#2F6FED' },
    'vehículos': { fondo: '#FDECEA', icono: '#D9534F' },
    'vehiculos': { fondo: '#FDECEA', icono: '#D9534F' },
    'electrónica': { fondo: '#EDEFFF', icono: '#5B5BD6' },
    'electronica': { fondo: '#EDEFFF', icono: '#5B5BD6' },
    'hogar y muebles': { fondo: '#FCF1E4', icono: '#B9770E' },
    'moda y belleza': { fondo: '#FDEDF3', icono: '#D64F8E' },
    'deportes y hobbies': { fondo: '#E9F7EE', icono: '#2F9E5B' },
    'mascotas': { fondo: '#FFF6E5', icono: '#DE9A26' },
    'servicios': { fondo: '#EEF1F4', icono: '#4A5568' },
    'negocios': { fondo: '#F1EDFB', icono: '#7C5CD6' },
    'comunidad': { fondo: '#FDEEE9', icono: '#C05621' }
};

export function iconoCategoria(nombre) {
    const clave = String(nombre || '').trim().toLowerCase();
    return CATEGORIA_ICONOS[clave] || 'fa-tag';
}

export function colorCategoria(nombre) {
    const clave = String(nombre || '').trim().toLowerCase();
    return CATEGORIA_COLORES[clave] || { fondo: '#F3F4F6', icono: '#374151' };
}