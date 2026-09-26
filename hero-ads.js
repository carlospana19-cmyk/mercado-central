// =====================================================
// hero-ads.js — PANTALLA DE PUBLICIDAD DEL HERO
// =====================================================
// CÓMO PUBLICAR UN ANUNCIO DE EMPRESA:
//
// 1. Sube la imagen/video a Supabase → Storage → imagenes_anuncios
//    → carpeta "publicidad" → copia la URL pública
//
// 2. Copia un bloque { ... } de abajo, edítalo y descoméntalo
//
// 3. Campos:
//    tipo:        'imagen' | 'video' | 'link' (link = solo abre la URL del cliente)
//    activo:      true = visible | false = apagado
//    imagen:      URL horizontal (PC) — OBLIGATORIA para tipo imagen/video
//    imagen_movil: URL vertical (teléfono) — opcional, si no hay usa la horizontal
//    video:       URL .mp4 del video (solo para tipo 'video')
//    link:        página del cliente (opcional — muestra botón "Conocer más")
//    empresa:     nombre (accesibilidad)
//    texto_cta:   texto del botón (opcional, default "Conocer más")
//    fecha_inicio:'AAAA-MM-DD' — no aparece antes
//    fecha_fin:   'AAAA-MM-DD' — ¡expira solo!
// =====================================================

export const HERO_ADS = [

    /* ─── EJEMPLO IMAGEN (descomenta para publicar) ───
    {
        tipo: 'imagen',
        activo: true,
        imagen: 'https://URL-HORIZONTAL-1920x1080.jpg',
        imagen_movil: 'https://URL-VERTICAL-1080x1350.jpg',
        link: 'https://wa.me/50700000000',
        empresa: 'Energ Solutions',
        texto_cta: 'Cotiza tu energía solar',
        fecha_inicio: '2026-09-20',
        fecha_fin: '2026-10-20'
    },
    ─── ─── */

    /* ─── EJEMPLO SOLO IMAGEN SIN BOTÓN (descomenta para publicar) ───
    {
        tipo: 'imagen',
        activo: true,
        imagen: 'https://URL-HORIZONTAL.jpg',
        imagen_movil: 'https://URL-VERTICAL.jpg',
        empresa: 'Mi Empresa',
        fecha_inicio: '2026-09-20',
        fecha_fin: '2026-10-20'
    },
    ─── ─── */

    /* ─── EJEMPLO VIDEO (descomenta para publicar) ───
    {
        tipo: 'video',
        activo: true,
        video: 'https://URL-DEL-VIDEO.mp4',
        imagen: 'https://URL-PORTADA-HORIZONTAL.jpg',
        imagen_movil: 'https://URL-PORTADA-VERTICAL.jpg',
        link: 'https://wa.me/50700000000',
        empresa: 'Mi Empresa',
        texto_cta: 'Conocer más',
        fecha_inicio: '2026-09-20',
        fecha_fin: '2026-10-20'
    },
    ─── ─── */

];