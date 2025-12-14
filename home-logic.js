// home-logic.js - VERSIÓN DE DIAGNÓSTICO

import { supabase } from './supabase-client.js';

export function initializeHomePage() {

    console.log("SENSOR 1: initializeHomePage() se ha ejecutado.");

    // Inicializar carrusel del hero
    initializeHeroCarousel();

    async function loadFeaturedAds() {
        console.log("SENSOR 2: loadFeaturedAds() ha comenzado.");

        const container = document.querySelector('#products .box-container');
        if (!container) {
            console.error("FALLO CRÍTICO: No se encontró el contenedor '#products .box-container'.");
            return;
        }

        try {
            const { data: ads, error } = await supabase
                .from('anuncios')
                .select(`
                    *,
                    perfiles (
                        url_foto_perfil,
                        nombre_negocio
                    )
                `)
                .in('featured_plan', ['top', 'destacado', 'premium', 'basico'])
                .order('fecha_publicacion', { ascending: false })
                .limit(15); // Aumentamos el límite para tener suficientes anuncios

            if (error) throw error;
            
            // Aplanar los datos del perfil en el objeto del anuncio
            ads.forEach(ad => {
                if (ad.perfiles) {
                    ad.url_foto_perfil = ad.perfiles.url_foto_perfil;
                    ad.nombre_negocio = ad.perfiles.nombre_negocio;
                }
            });

            console.log("SENSOR 3: Datos recibidos de Supabase:", ads);

            // DIAGNÓSTICO: Verificar atributos_clave en cada anuncio
            ads.forEach((ad, index) => {
                console.log(`Anuncio ${index + 1} - ID: ${ad.id}, Título: ${ad.titulo}`);
                console.log(`Atributos_clave:`, ad.atributos_clave);
                console.log(`Categoría: ${ad.categoria}`);
                console.log(`---`);
            });

            if (!ads || ads.length === 0) {
                container.innerHTML = '<p>No hay anuncios destacados en este momento.</p>';
                return;
            }

            // === INICIO: Lógica de renderizado por filas personalizadas ===
            let adsHTML = '';
            let processedAds = 0;

            const generateCardHTML = (ad) => {
                const allImages = [ad.url_portada, ...(ad.url_galeria || [])].filter(Boolean);
                const priceFormatted = new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(ad.precio);
                
                const cardClass = ad.is_premium ? 'tarjeta-auto' : 'box';
// BADGE ESTELAR METÁLICO – versión SVG simple
let badgeHTML = '';
let cardExtraClass = '';

const badgeSVG = (colorClass) => `
<svg class="simple-badge-svg ${colorClass}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <!-- Aro de estrella (12 puntas) -->
    <path d="M50 2 
             L63.5 18.5 L84.5 15.5 
             L87.5 36.5 L100 50 
             L87.5 63.5 L84.5 84.5 
             L63.5 81.5 L50 98 
             L36.5 81.5 L15.5 84.5 
             L12.5 63.5 L0 50 
             L12.5 36.5 L15.5 15.5 
             L36.5 18.5 Z" 
          class="badge-star-bg"/>

    <!-- Círculo blanco de fondo -->
    <circle cx="50" cy="50" r="32" 
            fill="white" 
            stroke="white" 
            stroke-width="1"/>

    <!-- Estrella central - SOLO CONTORNO (stroke), sin relleno -->
    <polygon points="50,28 57,45 75,45 61,56 66,73 50,60 32,70 38,53 25,43 42,43" 
             class="badge-center-star"
             fill="none"
             stroke-width="2.5"
             stroke-linecap="round"
             stroke-linejoin="round"/>
</svg>
`;

if (ad.featured_plan === "top") {
  badgeHTML = badgeSVG("diamond-badge");
  cardExtraClass = "card-top";
} else if (ad.featured_plan === "destacado") {
  badgeHTML = badgeSVG("gold-badge");
  cardExtraClass = "card-destacado";
} else if (ad.featured_plan === "premium") {
  badgeHTML = badgeSVG("silver-badge");
  cardExtraClass = "card-premium";
} else if (ad.featured_plan === "basico") {
  badgeHTML = badgeSVG("bronze-badge");
  cardExtraClass = "card-basico";
}

                let urgentBadge = '';
                if (ad.enhancements && ad.enhancements.is_urgent) {
                    urgentBadge = '<span class="badge-urgent" title="Urgente"><i class="fas fa-clock"></i></span>';
                }

                // Foto de perfil del usuario (si existe)
                let profilePhotoHTML = '';
                if (ad.url_foto_perfil) {
                    profilePhotoHTML = `
                        <div class="card-seller-info">
                            <img src="${ad.url_foto_perfil}" alt="Foto de vendedor" class="seller-photo">
                            <div class="seller-details">
                                <p class="seller-name">${ad.nombre_negocio || 'Vendedor'}</p>
                            </div>
                        </div>
                    `;
                }

                return `
                    <div class="${cardClass} card ${cardExtraClass}" onclick="window.location.href='detalle-producto.html?id=${ad.id}'">
                       ${badgeHTML}
                         ${urgentBadge}
                         <div class="image-container">
                            <div class="swiper product-swiper">
                                <div class="swiper-wrapper">
                                    ${allImages.length > 0 ? allImages.map(img => `<div class="swiper-slide"><img src="${img}" alt="${ad.titulo}" loading="lazy"></div>`).join('') : ''}
                                </div>
                                <div class="swiper-button-prev"></div>
                                <div class="swiper-button-next"></div>
                            </div>
                        </div>
                        <div class="content">
                            <div class="price">${priceFormatted}</div>
                            <h3>${ad.titulo}</h3>
                            <div class="location"><i class="fas fa-map-marker-alt"></i> ${ad.provincia || 'N/A'}</div>
                            <div class="description">${ad.descripcion || ''}</div> <!-- Descripción detallada -->
                            ${generateAttributesHTML(ad.atributos_clave, ad.categoria)}
                            ${profilePhotoHTML}
                            <a href="#" class="btn-contact">Contactar</a>
                        </div>
                    </div>`;
            };

            // Fila 1: 2 columnas
            if (processedAds < ads.length) {
                const rowAds = ads.slice(processedAds, processedAds + 2);
                adsHTML += '<div class="ads-row row-2-cols">';
                adsHTML += rowAds.map(generateCardHTML).join('');
                adsHTML += '</div>';
                processedAds += rowAds.length;
            }

            // Fila 2: 3 columnas
            if (processedAds < ads.length) {
                const rowAds = ads.slice(processedAds, processedAds + 3);
                adsHTML += '<div class="ads-row row-3-cols">';
                adsHTML += rowAds.map(generateCardHTML).join('');
                adsHTML += '</div>';
                processedAds += rowAds.length;
            }

            // Filas restantes: 4 columnas
            while (processedAds < ads.length) {
                const rowAds = ads.slice(processedAds, processedAds + 4);
                adsHTML += '<div class="ads-row row-4-cols">';
                adsHTML += rowAds.map(generateCardHTML).join('');
                adsHTML += '</div>';
                processedAds += rowAds.length;
            }
            // === FIN: Lógica de renderizado ===

            container.innerHTML = adsHTML;
            console.log("SENSOR 5: HTML de anuncios insertado en el DOM.");

            // Inicializar Swiper para cada tarjeta
            document.querySelectorAll('.product-swiper').forEach(swiperEl => {
                new Swiper(swiperEl, {
                    loop: swiperEl.querySelectorAll('.swiper-slide').length > 1, // Activar loop solo si hay más de 1 imagen
                    navigation: {
                        nextEl: swiperEl.querySelector('.swiper-button-next'),
                        prevEl: swiperEl.querySelector('.swiper-button-prev'),
                    },
                });
            });
            console.log("SENSOR 6: Swipers inicializados.");

            // Desactivar la acción de abrir detalle cuando el clic proviene del carrusel de imágenes
            document.querySelectorAll('.box .image-container, .tarjeta-auto .image-container').forEach(imgContainer => {
                imgContainer.addEventListener('click', e => {
                    e.stopPropagation(); // Evita que el clic llegue al onclick del padre
                });
            });

        } catch (e) {
            console.error("FALLO CRÍTICO DURANTE LA CARGA:", e);
            if(container) container.innerHTML = `<p>Ocurrió un error al cargar los anuncios. Detalles: ${e.message}</p>`;
        }
    }

    // Ejecutar la carga
    loadFeaturedAds();
}

function generateAttributesHTML(attributes, category) {
    console.log('🔍 generateAttributesHTML called with:', { attributes, category });

    if (!attributes || Object.keys(attributes).length === 0) {
        console.log('❌ No attributes or empty, returning empty string');
        return '';
    }

    const categoria = category ? category.toLowerCase() : '';
    console.log('📝 Category processed:', categoria);

    let detailsHTML = '';

    // --- DETALLES DE VEHÍCULOS (desde JSONB) ---
    if (categoria.includes('vehículo') || categoria.includes('auto') || categoria.includes('carro') || categoria.includes('moto')) {
        if (attributes.marca || attributes.anio || attributes.transmision || attributes.combustible || attributes.kilometraje) {
            let details = [];
            if (attributes.marca) details.push(`<span><i class="fas fa-car"></i> ${attributes.marca}</span>`);
            if (attributes.anio) details.push(`<span><i class="fas fa-calendar-alt"></i> ${attributes.anio}</span>`);
            if (attributes.kilometraje) details.push(`<span><i class="fas fa-tachometer-alt"></i> ${attributes.kilometraje.toLocaleString()} km</span>`);
            if (attributes.transmision) details.push(`<span><i class="fas fa-cogs"></i> ${attributes.transmision}</span>`);
            if (attributes.combustible) details.push(`<span><i class="fas fa-gas-pump"></i> ${attributes.combustible}</span>`);
            
            if (details.length > 0) {
                detailsHTML += `<div class="vehicle-details">${details.slice(0, 3).join('')}</div>`;
            }
        }
    }
    
    // --- DETALLES DE INMUEBLES (desde JSONB) ---
    if (categoria.includes('inmueble') || categoria.includes('casa') || categoria.includes('apartamento') || categoria.includes('propiedad')) {
        if (attributes.m2 || attributes.habitaciones || attributes.baños) {
            let details = [];
            if (attributes.m2) details.push(`<span><i class="fas fa-ruler-combined"></i> ${attributes.m2} m²</span>`);
            if (attributes.habitaciones) details.push(`<span><i class="fas fa-bed"></i> ${attributes.habitaciones} hab</span>`);
            if (attributes.baños) details.push(`<span><i class="fas fa-bath"></i> ${attributes.baños} baños</span>`);
            
            if (details.length > 0) {
                detailsHTML += `<div class="real-estate-details">${details.join('')}</div>`;
            }
        }
    }

    // --- SECCIÓN: Iconos de atributos de electrónica ---
    const electronicsSubcats = ["celulares y teléfonos", "computadoras", "consolas y videojuegos", "audio y video", "fotografía", "electrónica"];
    if (electronicsSubcats.some(subcat => categoria.includes(subcat))) {
        let details = [];

        if (attributes.marca) details.push(`<span><i class="fas fa-tag"></i> ${attributes.marca}</span>`);
        if (attributes.modelo) details.push(`<span><i class="fas fa-mobile-alt"></i> ${attributes.modelo}</span>`);
        if (attributes.almacenamiento) details.push(`<span><i class="fas fa-hdd"></i> ${attributes.almacenamiento} GB</span>`);
        if (attributes.memoria_ram) details.push(`<span><i class="fas fa-microchip"></i> ${attributes.memoria_ram} GB RAM</span>`);
        if (attributes.procesador) details.push(`<span><i class="fas fa-microchip"></i> ${attributes.procesador}</span>`);
        if (attributes.tipo_computadora) details.push(`<span><i class="fas fa-laptop"></i> ${attributes.tipo_computadora}</span>`);
        if (attributes.plataforma) details.push(`<span><i class="fas fa-gamepad"></i> ${attributes.plataforma}</span>`);
        if (attributes.condicion) details.push(`<span><i class="fas fa-star"></i> ${attributes.condicion}</span>`);
        if (attributes.tipo_articulo) details.push(`<span><i class="fas fa-microchip"></i> ${attributes.tipo_articulo}</span>`);

        if (details.length > 0) {
            detailsHTML += `<div class="electronics-details">${details.slice(0, 3).join('')}</div>`;
        }
    }

    // --- SECCIÓN: Iconos de atributos de hogar y muebles ---
    const homeFurnitureSubcats = ["Artículos de Cocina", "Decoración", "Electrodomésticos", "Jardín y Exterior", "Muebles"];
    if (attributes.subcategoria && homeFurnitureSubcats.includes(attributes.subcategoria)) {
        let details = [];

        if (attributes.tipo_electrodomestico) {
            const electroIcon = {
                'Refrigerador': 'fas fa-snowflake',
                'Lavadora': 'fas fa-tint',
                'Microondas': 'fas fa-fire',
                'Estufa': 'fas fa-fire-alt',
                'Licuadora': 'fas fa-blender',
                'Aspiradora': 'fas fa-wind'
            };
            const icon = electroIcon[attributes.tipo_electrodomestico] || 'fas fa-plug';
            details.push(`<span><i class="${icon}"></i> ${attributes.tipo_electrodomestico}</span>`);
        }

        if (attributes.tipo_mueble) details.push(`<span><i class="fas fa-couch"></i> ${attributes.tipo_mueble}</span>`);
        if (attributes.tipo_articulo) details.push(`<span><i class="fas fa-couch"></i> ${attributes.tipo_articulo}</span>`);
        if (attributes.tipo_decoracion) details.push(`<span><i class="fas fa-paint-brush"></i> ${attributes.tipo_decoracion}</span>`);
        if (attributes.material) details.push(`<span><i class="fas fa-cube"></i> ${attributes.material}</span>`);
        if (attributes.marca) details.push(`<span><i class="fas fa-tag"></i> ${attributes.marca}</span>`);
        if (attributes.color) details.push(`<span><i class="fas fa-palette"></i> ${attributes.color}</span>`);
        if (attributes.condicion) details.push(`<span><i class="fas fa-check-circle"></i> ${attributes.condicion}</span>`);

        if (details.length > 0) {
            detailsHTML += `<div class="home-furniture-details">${details.slice(0, 3).join('')}</div>`;
        }
    }

    // --- SECCIÓN: Iconos de atributos de moda y belleza ---
    const fashionSubcats = ["ropa de mujer", "ropa de hombre", "ropa de niños", "calzado", "bolsos y carteras", "accesorios", "joyería y relojes", "salud y belleza", "moda y belleza"];
    if (fashionSubcats.some(subcat => categoria.includes(subcat))) {
        let details = [];
        
        if (attributes.tipo_prenda) details.push(`<span><i class="fas fa-tshirt"></i> ${attributes.tipo_prenda}</span>`);
        if (attributes.tipo_calzado) details.push(`<span><i class="fas fa-shoe-prints"></i> ${attributes.tipo_calzado}</span>`);
        if (attributes.tipo_bolso) details.push(`<span><i class="fas fa-shopping-bag"></i> ${attributes.tipo_bolso}</span>`);
        if (attributes.tipo_accesorio) details.push(`<span><i class="fas fa-glasses"></i> ${attributes.tipo_accesorio}</span>`);
        if (attributes.tipo_joya) details.push(`<span><i class="fas fa-gem"></i> ${attributes.tipo_joya}</span>`);
        if (attributes.tipo_producto) details.push(`<span><i class="fas fa-spray-can"></i> ${attributes.tipo_producto}</span>`);
        if (attributes.talla) details.push(`<span><i class="fas fa-ruler"></i> Talla ${attributes.talla}</span>`);
        if (attributes.talla_calzado) details.push(`<span><i class="fas fa-ruler"></i> Talla ${attributes.talla_calzado}</span>`);
        if (attributes.marca) details.push(`<span><i class="fas fa-tag"></i> ${attributes.marca}</span>`);
        if (attributes.condicion) details.push(`<span><i class="fas fa-check-circle"></i> ${attributes.condicion}</span>`);
        
        if (details.length > 0) {
            detailsHTML += `<div class="fashion-details">${details.slice(0, 3).join('')}</div>`;
        }
    }

    // --- SECCIÓN: Iconos de atributos de deportes y hobbies ---
    const sportsSubcats = ["Bicicletas", "Coleccionables", "Deportes", "Instrumentos Musicales", "Libros, Revistas y Comics", "Otros Hobbies"];
    if (attributes.subcategoria && sportsSubcats.includes(attributes.subcategoria)) {
        let details = [];
        
        if (attributes.tipo_bicicleta) details.push(`<span><i class="fas fa-bicycle"></i> ${attributes.tipo_bicicleta}</span>`);
        if (attributes.tipo_instrumento) details.push(`<span><i class="fas fa-music"></i> ${attributes.tipo_instrumento}</span>`);
        if (attributes.tipo_articulo) details.push(`<span><i class="fas fa-trophy"></i> ${attributes.tipo_articulo}</span>`);
        if (attributes.marca) details.push(`<span><i class="fas fa-tag"></i> ${attributes.marca}</span>`);
        if (attributes.aro) details.push(`<span><i class="fas fa-circle-notch"></i> Aro ${attributes.aro}</span>`);
        if (attributes.condicion) details.push(`<span><i class="fas fa-star"></i> ${attributes.condicion}</span>`);
        
        if (details.length > 0) {
            detailsHTML += `<div class="sports-details">${details.slice(0, 3).join('')}</div>`;
        }
    }

    // --- SECCIÓN: Iconos de atributos de mascotas ---
    const petsSubcats = ["Perros", "Gatos", "Aves", "Peces", "Otros Animales", "Accesorios para Mascotas"];
    if (attributes.subcategoria && petsSubcats.includes(attributes.subcategoria)) {
        let details = [];
        
        if (attributes.tipo_anuncio) details.push(`<span><i class="fas fa-paw"></i> ${attributes.tipo_anuncio}</span>`);
        if (attributes.tipo_accesorio) details.push(`<span><i class="fas fa-bone"></i> ${attributes.tipo_accesorio}</span>`);
        if (attributes.raza) details.push(`<span><i class="fas fa-dog"></i> ${attributes.raza}</span>`);
        if (attributes.edad_mascota) details.push(`<span><i class="fas fa-birthday-cake"></i> ${attributes.edad_mascota}</span>`);
        if (attributes.genero) details.push(`<span><i class="fas fa-venus-mars"></i> ${attributes.genero}</span>`);
        if (attributes.marca) details.push(`<span><i class="fas fa-tag"></i> ${attributes.marca}</span>`);
        
        if (details.length > 0) {
            detailsHTML += `<div class="pets-details">${details.slice(0, 3).join('')}</div>`;
        }
    }

    // --- SECCIÓN: Iconos de atributos de servicios ---
    const servicesSubcats = ["Servicios de Construcción", "Servicios de Educación", "Servicios de Eventos", "Servicios de Salud", "Servicios de Tecnología", "Servicios para el Hogar", "Otros Servicios"];
    if (attributes.subcategoria && servicesSubcats.includes(attributes.subcategoria)) {
        let details = [];
        
        if (attributes.tipo_servicio) details.push(`<span><i class="fas fa-wrench"></i> ${attributes.tipo_servicio}</span>`);
        if (attributes.modalidad) details.push(`<span><i class="fas fa-location-arrow"></i> ${attributes.modalidad}</span>`);
        if (attributes.experiencia) details.push(`<span><i class="fas fa-award"></i> ${attributes.experiencia}</span>`);
        
        if (details.length > 0) {
            detailsHTML += `<div class="services-details">${details.slice(0, 3).join('')}</div>`;
        }
    }

    // --- SECCIÓN: Iconos de atributos de negocios ---
    const businessSubcats = ["Equipos para Negocios", "Maquinaria para Negocios", "Negocios en Venta"];
    if (attributes.subcategoria && businessSubcats.includes(attributes.subcategoria)) {
        let details = [];
        
        if (attributes.tipo_negocio) details.push(`<span><i class="fas fa-briefcase"></i> ${attributes.tipo_negocio}</span>`);
        if (attributes.tipo_equipo) details.push(`<span><i class="fas fa-cogs"></i> ${attributes.tipo_equipo}</span>`);
        if (attributes.marca) details.push(`<span><i class="fas fa-tag"></i> ${attributes.marca}</span>`);
        if (attributes.modelo) details.push(`<span><i class="fas fa-barcode"></i> ${attributes.modelo}</span>`);
        if (attributes.años_operacion) details.push(`<span><i class="fas fa-calendar-check"></i> ${attributes.años_operacion}</span>`);
        if (attributes.incluye) details.push(`<span><i class="fas fa-check-circle"></i> ${attributes.incluye}</span>`);
        if (attributes.razon_venta) details.push(`<span><i class="fas fa-info-circle"></i> ${attributes.razon_venta}</span>`);
        if (attributes.condicion) details.push(`<span><i class="fas fa-star"></i> ${attributes.condicion}</span>`);
        
        if (details.length > 0) {
            detailsHTML += `<div class="business-details">${details.slice(0, 3).join('')}</div>`;
        }
    }

    // --- SECCIÓN: Iconos de atributos de comunidad ---
    const communitySubcats = ["Clases y Cursos", "Eventos", "Otros"];
    if (attributes.subcategoria && communitySubcats.includes(attributes.subcategoria)) {
        let details = [];
        
        if (attributes.tipo_evento) details.push(`<span><i class="fas fa-calendar-day"></i> ${attributes.tipo_evento}</span>`);
        if (attributes.tipo_actividad) details.push(`<span><i class="fas fa-users"></i> ${attributes.tipo_actividad}</span>`);
        if (attributes.tipo_clase) details.push(`<span><i class="fas fa-chalkboard-teacher"></i> ${attributes.tipo_clase}</span>`);
        if (attributes.nivel) details.push(`<span><i class="fas fa-chart-line"></i> ${attributes.nivel}</span>`);
        if (attributes.modalidad) details.push(`<span><i class="fas fa-map-marker-alt"></i> ${attributes.modalidad}</span>`);
        if (attributes.fecha_evento) details.push(`<span><i class="fas fa-calendar-alt"></i> ${attributes.fecha_evento}</span>`);
        
        if (details.length > 0) {
            detailsHTML += `<div class="community-details">${details.slice(0, 3).join('')}</div>`;
        }
    }

    console.log('✅ generateAttributesHTML returning:', detailsHTML);
    return detailsHTML;
}

// Función para inicializar el carrusel del hero
function initializeHeroCarousel() {
    const heroSlidesContainer = document.getElementById('hero-slides');
    if (!heroSlidesContainer) {
        console.warn('Contenedor de slides del hero no encontrado');
        return;
    }

    // Imágenes por defecto para la página principal (todas las categorías)
    const defaultImages = [
        {
            src: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=600&fit=crop',
            alt: 'Casa moderna con jardín',
            title: 'Bienes Raíces'
        },
        {
            src: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&h=600&fit=crop',
            alt: 'Auto deportivo rojo',
            title: 'Vehículos'
        },
        {
            src: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&h=600&fit=crop',
            alt: 'Laptop y dispositivos tecnológicos',
            title: 'Electrónica'
        }
    ];

    // Función para cargar imágenes según la categoría
    function loadCategoryImages(category = 'all') {
        let images = [];

        switch(category) {
            case 'Bienes Raíces':
            case 'Inmuebles':
                images = [
                    {
                        src: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=600&fit=crop',
                        alt: 'Casa moderna con jardín',
                        title: 'Casas Modernas'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=600&fit=crop',
                        alt: 'Apartamento con vista a la ciudad',
                        title: 'Apartamentos'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=600&fit=crop',
                        alt: 'Terreno amplio',
                        title: 'Terrenos'
                    }
                ];
                break;

            case 'Vehículos':
            case 'Autos':
                images = [
                    {
                        src: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&h=600&fit=crop',
                        alt: 'Auto deportivo rojo',
                        title: 'Autos Deportivos'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=600&fit=crop',
                        alt: 'Camioneta familiar',
                        title: 'Camionetas'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200&h=600&fit=crop',
                        alt: 'Motocicleta deportiva',
                        title: 'Motocicletas'
                    }
                ];
                break;

            case 'Electrónica':
            case 'Tecnología':
                images = [
                    {
                        src: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&h=600&fit=crop',
                        alt: 'Laptop y dispositivos tecnológicos',
                        title: 'Laptops'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=600&fit=crop',
                        alt: 'Smartphone moderno',
                        title: 'Smartphones'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1200&h=600&fit=crop',
                        alt: 'Drone volando',
                        title: 'Drones'
                    }
                ];
                break;

            default:
                images = defaultImages;
        }

        // Generar HTML de los slides
        const slidesHTML = images.map(image => `
            <div class="swiper-slide">
                <img src="${image.src}" alt="${image.alt}" loading="lazy">
                <div class="slide-overlay">
                    <h2 class="slide-title">${image.title}</h2>
                </div>
            </div>
        `).join('');

        heroSlidesContainer.innerHTML = slidesHTML;

        // Inicializar o reinicializar Swiper
        initializeHeroSwiper();
    }

    // Función para inicializar Swiper del hero
    function initializeHeroSwiper() {
        // Destruir instancia anterior si existe
        if (window.heroSwiper) {
            window.heroSwiper.destroy();
        }

        window.heroSwiper = new Swiper('.hero-swiper', {
            loop: true,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            }
        });
    }

    // Detectar categoría de la URL o usar por defecto
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category') || 'all';

    loadCategoryImages(categoryParam);

    // Exponer función global para cambiar imágenes dinámicamente
    window.updateHeroCarousel = loadCategoryImages;

// Ejecutar solo si estamos en el index
document.addEventListener('DOMContentLoaded', () => {
  if (document.body.id === 'index-page') {
    document.querySelectorAll('.hero-swiper').forEach(swiperEl => {
      swiperEl.addEventListener('click', e => {
        e.stopPropagation();
      });
    });
  }
});
}

// Función para actualizar el carrusel cuando se cambia de categoría
export function updateHeroForCategory(categoryName) {
    if (window.updateHeroCarousel) {
        window.updateHeroCarousel(categoryName);
    }
}
