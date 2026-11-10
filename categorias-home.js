// categorias-home.js — FASE 1-D: tarjetas de categorías con FOTO (estilo E24) en la home.
// Los nombres son los valores REALES de categorías del sitio (tabla `categorias` /
// config-categories.js) — no se inventan valores. Las fotos son archivos locales del
// sitio en img/categorias/ (las incluye el dueño). Clic = resultados.html?category=
// <nombre-exacto> con encodeURIComponent (mismo formato que search-global.js).
// Si una foto no carga (onerror), se muestra el icono Font Awesome sobre fondo gris
// suave — nunca una imagen rota.
const CATEGORIAS = [
    { nombre: 'Inmuebles', foto: 'img/categorias/bienes-raices.jpg' },
    { nombre: 'Vehículos', foto: 'img/categorias/vehiculos.jpg' },
    { nombre: 'Electrónica', foto: 'img/categorias/electronica.jpg' },
    { nombre: 'Hogar y Muebles', foto: 'img/categorias/hogar.jpg' },
    { nombre: 'Moda y Belleza', foto: 'img/categorias/moda.jpg' },
    { nombre: 'Servicios', foto: 'img/categorias/servicios.jpg' }
];

const REINTENTOS_MAX = 150; // 150 x 100ms = 15 s (mismo patrón esperarElemento de busqueda-visual.js)

function esperarElemento(id) {
    return new Promise((resolve) => {
        let intentos = 0;
        const tick = () => {
            const el = document.getElementById(id);
            if (el) return resolve(el);
            intentos += 1;
            if (intentos >= REINTENTOS_MAX) return resolve(null);
            setTimeout(tick, 100);
        };
        tick();
    });
}

function renderCategorias(container) {
    container.innerHTML = CATEGORIAS.map(cat => `
        <a class="categoria-tarjeta" href="resultados.html?category=${encodeURIComponent(cat.nombre)}" aria-label="Ver ${cat.nombre}">
            <span class="categoria-foto">
                <img src="${cat.foto}" alt="${cat.nombre}" loading="lazy"
                     onerror="this.closest('.categoria-foto').classList.add('sin-foto'); this.remove();">
                <span class="categoria-inicial" aria-hidden="true">${cat.nombre.charAt(0)}</span>
            </span>
            <span class="categoria-nombre">${cat.nombre}</span>
        </a>`).join('');
}

async function iniciar() {
    const container = await esperarElemento('categorias-grid');
    if (!container) return;
    renderCategorias(container);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
} else {
    iniciar();
}