import { supabase } from './supabase-client.js';
import { generateAttributesHTML } from './utils-attributes.js';
import { DEFAULT_CATEGORIES } from './config-categories.js';

// --- CARRUSEL DE CATEGORÍA ---
function initializeCategoryHero() {
    const categorySlidesContainer = document.getElementById('category-slides');
    const categoryTitleEl = document.getElementById('category-title');
    const categorySubtitleEl = document.getElementById('category-subtitle');

    if (!categorySlidesContainer) return;

    // Obtener parámetros de la URL
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category') || 'all';
    const searchQuery = params.get('q') || '';

    // Configurar título y subtítulo según la categoría
    let categoryTitle = 'Resultados de Búsqueda';
    let categorySubtitle = 'Encuentra lo que buscas en nuestra plataforma';

    if (searchQuery) {
        categoryTitle = `Resultados para "${searchQuery}"`;
        categorySubtitle = `Anuncios relacionados con tu búsqueda`;
    } else if (categoryParam !== 'all') {
        const categoryNames = {
            'Bienes Raíces': 'Bienes Raíces',
            'Vehículos': 'Vehículos',
            'Electrónica': 'Electrónica',
            'Hogar y Muebles': 'Hogar y Muebles',
            'Moda y Belleza': 'Moda y Belleza',
            'Servicios': 'Servicios',
            'Empleos y Servicios': 'Empleos y Servicios',
            'Mascotas': 'Mascotas',
            'Negocios': 'Negocios',
            'Comunidad': 'Comunidad'
        };
        categoryTitle = categoryNames[categoryParam] || 'Resultados de Búsqueda';
        categorySubtitle = `Explora nuestra selección de ${categoryTitle.toLowerCase()}`;
    }

    if (categoryTitleEl) categoryTitleEl.textContent = categoryTitle;
    if (categorySubtitleEl) categorySubtitleEl.textContent = categorySubtitle;

    // Cargar imágenes según la categoría
    loadCategoryImages(categoryParam);

    function loadCategoryImages(category = 'all') {
        let images = [];

        switch(category) {
            case 'Bienes Raíces':
                images = [
                    {
                        src: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=600&fit=crop',
                        alt: 'Casa moderna con jardín',
                        title: 'Casas y Apartamentos'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=600&fit=crop',
                        alt: 'Apartamento con vista a la ciudad',
                        title: 'Propiedades Urbanas'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=600&fit=crop',
                        alt: 'Terreno amplio',
                        title: 'Terrenos Disponibles'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&h=600&fit=crop',
                        alt: 'Casa de lujo',
                        title: 'Propiedades de Lujo'
                    }
                ];
                break;

            case 'Vehículos':
                images = [
                    {
                        src: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&h=600&fit=crop',
                        alt: 'Auto deportivo rojo',
                        title: 'Autos Deportivos'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=600&fit=crop',
                        alt: 'Camioneta familiar',
                        title: 'Camionetas y SUVs'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200&h=600&fit=crop',
                        alt: 'Motocicleta deportiva',
                        title: 'Motocicletas'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=600&fit=crop',
                        alt: 'Auto clásico',
                        title: 'Autos Clásicos'
                    }
                ];
                break;

            case 'Electrónica':
                images = [
                    {
                        src: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&h=600&fit=crop',
                        alt: 'Laptop y dispositivos tecnológicos',
                        title: 'Computadoras'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=600&fit=crop',
                        alt: 'Smartphone moderno',
                        title: 'Teléfonos Móviles'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1200&h=600&fit=crop',
                        alt: 'Drone volando',
                        title: 'Drones y Gadgets'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&h=600&fit=crop',
                        alt: 'Consola de videojuegos',
                        title: 'Videojuegos'
                    }
                ];
                break;

            case 'Hogar y Muebles':
                images = [
                    {
                        src: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=600&fit=crop',
                        alt: 'Sala moderna',
                        title: 'Muebles para el Hogar'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=600&fit=crop',
                        alt: 'Cocina equipada',
                        title: 'Electrodomésticos'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=600&fit=crop',
                        alt: 'Decoración del hogar',
                        title: 'Decoración'
                    }
                ];
                break;

            case 'Moda y Belleza':
                images = [
                    {
                        src: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=600&fit=crop',
                        alt: 'Ropa moderna',
                        title: 'Ropa y Accesorios'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=600&fit=crop',
                        alt: 'Productos de belleza',
                        title: 'Belleza y Cuidado'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&h=600&fit=crop',
                        alt: 'Zapatos elegantes',
                        title: 'Calzado'
                    }
                ];
                break;

            default:
                images = [
                    {
                        src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=600&fit=crop',
                        alt: 'Productos diversos',
                        title: 'Todos los Productos'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=600&fit=crop',
                        alt: 'Servicios profesionales',
                        title: 'Servicios Disponibles'
                    },
                    {
                        src: 'https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?w=1200&h=600&fit=crop',
                        alt: 'Empleos y oportunidades',
                        title: 'Empleos'
                    }
                ];
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

        categorySlidesContainer.innerHTML = slidesHTML;

        // Inicializar Swiper
        initializeCategorySwiper();
    }

    function initializeCategorySwiper() {
        if (window.categorySwiper) {
            window.categorySwiper.destroy();
        }

        window.categorySwiper = new Swiper('.category-swiper', {
            loop: true,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            }
        });
    }
}

// --- PAGINACIÓN ---
const RESULTS_PER_PAGE = 12; // Número de resultados por página
let currentPage = 1; // Página actual

// --- FUNCIÓN PRINCIPAL DE CARGA Y FILTRADO ---
async function loadAndFilterResults() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q')?.toLowerCase() || '';
    const mainCategory = params.get('category') || 'all';
    const location = params.get('location')?.toLowerCase() || '';

    const selectedSubcategories = Array.from(document.querySelectorAll('input[name="subcategory"]:checked')).map(cb => cb.value);
    const priceMin = document.getElementById('price-min').value;
    const priceMax = document.getElementById('price-max').value;

    const now = new Date().toISOString();

    let queryBuilder = supabase
      .from('anuncios')
      .select('*, imagenes(url_imagen), profiles(nombre_negocio, url_foto_perfil)', { count: 'exact' })
      // Prioridad: premium y destacados activos primero
      .order('featured_plan', { ascending: false })
      .order('featured_until', { ascending: false, nullsFirst: false })
      .order('fecha_publicacion', { ascending: false });

    // Filtros existentes (mantener igual)
    if (query) queryBuilder = queryBuilder.or(`titulo.ilike.%${query}%,descripcion.ilike.%${query}%`);
    if (location) queryBuilder = queryBuilder.ilike('ubicacion', `%${location}%`);

    if (mainCategory !== 'all') {
      queryBuilder = queryBuilder.eq('categoria', mainCategory);
    }

    if (selectedSubcategories.length > 0) {
      queryBuilder = queryBuilder.in('subcategoria', selectedSubcategories);
    }

    if (priceMin) queryBuilder = queryBuilder.gte('precio', priceMin);
    if (priceMax) queryBuilder = queryBuilder.lte('precio', priceMax);

    // Paginación
    const from = (currentPage - 1) * RESULTS_PER_PAGE;
    const to = from + RESULTS_PER_PAGE - 1;
    queryBuilder = queryBuilder.limit(RESULTS_PER_PAGE).range(from, to);

    const { data: products, error, count } = await queryBuilder;

    if (error) {
        console.error("Error al obtener los anuncios:", error, "Query:", queryBuilder.url);
        displayError("Hubo un error al cargar los anuncios.");
        return;
    }

    // ORDENAMIENTO POR PRIORIDAD DE PLAN
    products.sort((a, b) => {
        // Primero por prioridad de plan
        const priorityA = a.plan_priority || 0;
        const priorityB = b.plan_priority || 0;
        
        if (priorityA !== priorityB) {
            return priorityB - priorityA; // Mayor prioridad primero
        }
        
        // Si mismo plan, por fecha
        return new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion);
    });

    // Load subcategories with counts for filtering
    let subcategoriesWithCounts = [];
    if (mainCategory !== 'all') {
        const parentCategory = DEFAULT_CATEGORIES.find(cat => cat.nombre === mainCategory && cat.parent_id === null);
        if (parentCategory) {
            const subcats = DEFAULT_CATEGORIES.filter(cat => cat.parent_id === parentCategory.id);
            if (subcats && subcats.length > 0) {
                // Get counts for each subcategory
                const countsPromises = subcats.map(async (subcat) => {
                    const { count } = await supabase
                        .from('anuncios')
                        .select('*', { count: 'exact', head: true })
                        .eq('categoria', mainCategory)
                        .eq('subcategoria', subcat.nombre);
                    return { nombre: subcat.nombre, count: count || 0 };
                });
                subcategoriesWithCounts = await Promise.all(countsPromises);
            }
        }
    }

    displayFilteredProducts(products || []);
    displaySubcategoryFilters(subcategoriesWithCounts);
    updateSummary(query, mainCategory, count || 0);
    displayPaginationControls(count || 0); // Mostrar controles de paginación
}

// --- FUNCIONES DE RENDERIZADO ---
function displaySubcategoryFilters(subcategoriesWithCounts) {
    const container = document.getElementById('subcategory-filter-container');
    if (!container) return;
    if (!subcategoriesWithCounts || subcategoriesWithCounts.length === 0) {
        container.innerHTML = "<p>No hay subcategorías.</p>";
        return;
    }
    container.innerHTML = subcategoriesWithCounts.map(sub => `
        <label class="subcategory-label">
            <input type="checkbox" name="subcategory" value="${sub.nombre}">
            ${sub.nombre} ${sub.count !== undefined && sub.count !== null
                ? `<span style="color:#7f8c8d; font-size:1.2rem;">(${sub.count})</span>`
                : ''}
        </label>
    `).join('');
    }

function displayFilteredProducts(ads) {
    const container = document.getElementById('results-container');
    const summary = document.getElementById('results-summary');

    if (!container || !summary) {
        console.error("Error crítico: No se encontraron los contenedores de resultados.");
        return;
    }

    if (!ads || ads.length === 0) {
        summary.innerHTML = `<p><strong>0 anuncios encontrados.</strong> Prueba con otros filtros.</p>`;
        container.innerHTML = '';
        return;
    }

    summary.innerHTML = `<p><strong>Encontrados ${ads.length} anuncios</strong></p>`;
    // NO cambiar la clase, mantener el ID #results-container para que los media queries funcionen

    // Función para convertir URL de YouTube/Vimeo a embed
    const getVideoEmbedUrl = (videoUrl) => {
        if (!videoUrl) return null;
        
        // YouTube
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const youtubeMatch = videoUrl.match(youtubeRegex);
        if (youtubeMatch) {
            return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`;
        }
        
        // Vimeo
        const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
        const vimeoMatch = videoUrl.match(vimeoRegex);
        if (vimeoMatch) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }
        
        return null;
    };

    const adsHTML = ads.map(ad => {
        const videoEmbedUrl = getVideoEmbedUrl(ad.url_video);
        const priceFormatted = new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(ad.precio);
        const cardClass = ad.is_premium ? 'tarjeta-auto' : 'box';
        const categoria = ad.categoria ? ad.categoria.toLowerCase() : '';
        
        // SISTEMA DE DESTACADOS: Badges con estrellas
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
        
        // Badge de urgente con ícono de reloj
        let urgentBadge = '';
        if (ad.enhancements && ad.enhancements.is_urgent) {
            urgentBadge = '<span class="badge-urgent" title="Urgente"><i class="fas fa-clock"></i></span>';
        }

        // --- DETALLES DE VEHÍCULOS (desde JSONB) ---
        let vehicleDetailsHTML = '';
        if (ad.atributos_clave && typeof ad.atributos_clave === 'object' && ad.categoria) {
            const attr = ad.atributos_clave;
            const categoria = ad.categoria.toLowerCase();
            
            // SOLO mostrar si es categoría de VEHÍCULO
            if (categoria.includes('vehículo') || categoria.includes('auto') || categoria.includes('carro') || categoria.includes('moto')) {
                if (attr.marca || attr.anio || attr.transmision || attr.combustible || attr.kilometraje) {
                    let details = [];
                    if (attr.marca) details.push(`<span><i class="fas fa-car"></i> ${attr.marca}</span>`);
                    if (attr.anio) details.push(`<span><i class="fas fa-calendar-alt"></i> ${attr.anio}</span>`);
                    if (attr.kilometraje) details.push(`<span><i class="fas fa-tachometer-alt"></i> ${attr.kilometraje.toLocaleString()} km</span>`);
                    if (attr.transmision) details.push(`<span><i class="fas fa-cogs"></i> ${attr.transmision}</span>`);
                    if (attr.combustible) details.push(`<span><i class="fas fa-gas-pump"></i> ${attr.combustible}</span>`);
                    
                    if (details.length > 0) {
                        vehicleDetailsHTML = `<div class="vehicle-details">${details.slice(0, 3).join('')}</div>`;
                    }
                }
            }
        }
        
        // --- DETALLES DE INMUEBLES (desde JSONB) ---
        let realEstateDetailsHTML = '';
        if (ad.atributos_clave && typeof ad.atributos_clave === 'object' && ad.categoria) {
            const attr = ad.atributos_clave;
            const categoria = ad.categoria.toLowerCase();
            
            // SOLO mostrar si es categoría de INMUEBLE
            if (categoria.includes('inmueble') || categoria.includes('casa') || categoria.includes('apartamento') || categoria.includes('propiedad')) {
                if (attr.m2 || attr.habitaciones || attr.baños) {
                    let details = [];
                    if (attr.m2) details.push(`<span><i class="fas fa-ruler-combined"></i> ${attr.m2} m²</span>`);
                    if (attr.habitaciones) details.push(`<span><i class="fas fa-bed"></i> ${attr.habitaciones} hab</span>`);
                    if (attr.baños) details.push(`<span><i class="fas fa-bath"></i> ${attr.baños} baños</span>`);
                    
                    if (details.length > 0) {
                        realEstateDetailsHTML = `<div class="real-estate-details">${details.join('')}</div>`;
                    }
                }
            }
        }

        // --- SECCIÓN: Iconos de atributos de electrónica ---
        let electronicsDetailsHTML = '';
        if (ad.atributos_clave && typeof ad.atributos_clave === 'object' && ad.categoria) {
            const attr = ad.atributos_clave;

            // Lista de subcategorías de electrónica
            const electronicsSubcats = ["celulares y teléfonos", "computadoras", "consolas y videojuegos", "audio y video", "fotografía", "electrónica"];

            // Solo mostrar si es categoría Electrónica
            if (electronicsSubcats.some(subcat => categoria.includes(subcat))) {
                let details = [];

                if (attr.marca) details.push(`<span><i class="fas fa-tag"></i> ${attr.marca}</span>`);
                if (attr.modelo) details.push(`<span><i class="fas fa-mobile-alt"></i> ${attr.modelo}</span>`);
                if (attr.almacenamiento) details.push(`<span><i class="fas fa-hdd"></i> ${attr.almacenamiento} GB</span>`);
                if (attr.memoria_ram) details.push(`<span><i class="fas fa-microchip"></i> ${attr.memoria_ram} GB RAM</span>`);
                if (attr.procesador) details.push(`<span><i class="fas fa-microchip"></i> ${attr.procesador}</span>`);
                if (attr.tipo_computadora) details.push(`<span><i class="fas fa-laptop"></i> ${attr.tipo_computadora}</span>`);
                if (attr.plataforma) details.push(`<span><i class="fas fa-gamepad"></i> ${attr.plataforma}</span>`);
                if (attr.condicion) details.push(`<span><i class="fas fa-star"></i> ${attr.condicion}</span>`);
                if (attr.tipo_articulo) details.push(`<span><i class="fas fa-microchip"></i> ${attr.tipo_articulo}</span>`);

                // Mostrar solo los primeros 3 atributos para no saturar la tarjeta
                if (details.length > 0) {
                    electronicsDetailsHTML = `
                        <div class="electronics-details">
                            ${details.slice(0, 3).join('')}
                        </div>
                    `;
                }
            }
        }

        // --- SECCIÓN: Iconos de atributos de hogar y muebles ---
        let homeFurnitureDetailsHTML = '';
        if (ad.atributos_clave && typeof ad.atributos_clave === 'object' && ad.categoria) {
            const attr = ad.atributos_clave;

            // Lista de subcategorías de hogar
            const homeFurnitureSubcats = ["Artículos de Cocina", "Decoración", "Electrodomésticos", "Jardín y Exterior", "Muebles"];

            // Solo mostrar si es categoría Hogar/Muebles
            if (attr.subcategoria && homeFurnitureSubcats.includes(attr.subcategoria)) {
                let details = [];

                // Iconos específicos por tipo de electrodoméstico
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
                    details.push(`<span><i class="${icon}"></i> ${attr.tipo_electrodomestico}</span>`);
                }

                if (attr.tipo_mueble) details.push(`<span><i class="fas fa-couch"></i> ${attr.tipo_mueble}</span>`);
                if (attr.tipo_articulo) details.push(`<span><i class="fas fa-couch"></i> ${attr.tipo_articulo}</span>`);
                if (attr.tipo_decoracion) details.push(`<span><i class="fas fa-paint-brush"></i> ${attr.tipo_decoracion}</span>`);
                if (attr.material) details.push(`<span><i class="fas fa-cube"></i> ${attr.material}</span>`);
                if (attr.marca) details.push(`<span><i class="fas fa-tag"></i> ${attr.marca}</span>`);
                if (attr.color) details.push(`<span><i class="fas fa-palette"></i> ${attr.color}</span>`);
                if (attr.condicion) details.push(`<span><i class="fas fa-check-circle"></i> ${attr.condicion}</span>`);

                // Mostrar solo los primeros 3 atributos
                if (details.length > 0) {
                    homeFurnitureDetailsHTML = `
                        <div class="home-furniture-details">
                            ${details.slice(0, 3).join('')}
                        </div>
                    `;
                }
            }
        }
        // --- SECCIÓN: Iconos de atributos de moda y belleza ---
        let fashionDetailsHTML = '';
        if (ad.atributos_clave && typeof ad.atributos_clave === 'object' && ad.categoria) {
            const attr = ad.atributos_clave;
            
            // Lista de subcategorías de moda
            const fashionSubcats = ["ropa de mujer", "ropa de hombre", "ropa de niños", "calzado", "bolsos y carteras", "accesorios", "joyería y relojes", "salud y belleza", "moda y belleza"];
            
            // Solo mostrar si es categoría Moda y Belleza
            if (fashionSubcats.some(subcat => categoria.includes(subcat))) {
                let details = [];
                
                if (attr.tipo_prenda) details.push(`<span><i class="fas fa-tshirt"></i> ${attr.tipo_prenda}</span>`);
                if (attr.tipo_calzado) details.push(`<span><i class="fas fa-shoe-prints"></i> ${attr.tipo_calzado}</span>`);
                if (attr.tipo_bolso) details.push(`<span><i class="fas fa-shopping-bag"></i> ${attr.tipo_bolso}</span>`);
                if (attr.tipo_accesorio) details.push(`<span><i class="fas fa-glasses"></i> ${attr.tipo_accesorio}</span>`);
                if (attr.tipo_joya) details.push(`<span><i class="fas fa-gem"></i> ${attr.tipo_joya}</span>`);
                if (attr.tipo_producto) details.push(`<span><i class="fas fa-spray-can"></i> ${attr.tipo_producto}</span>`);
                if (attr.talla) details.push(`<span><i class="fas fa-ruler"></i> Talla ${attr.talla}</span>`);
                if (attr.talla_calzado) details.push(`<span><i class="fas fa-ruler"></i> Talla ${attr.talla_calzado}</span>`);
                if (attr.marca) details.push(`<span><i class="fas fa-tag"></i> ${attr.marca}</span>`);
                if (attr.condicion) details.push(`<span><i class="fas fa-check-circle"></i> ${attr.condicion}</span>`);
                
                // Mostrar solo los primeros 3 atributos
                if (details.length > 0) {
                    fashionDetailsHTML = `
                        <div class="fashion-details">
                            ${details.slice(0, 3).join('')}
                        </div>
                    `;
                }
            }
        }

        // --- SECCIÓN: Iconos de atributos de deportes y hobbies ---
        let sportsDetailsHTML = '';
        if (ad.atributos_clave && typeof ad.atributos_clave === 'object' && ad.categoria) {
            const attr = ad.atributos_clave;
            const categoria = ad.categoria.toLowerCase();
            
            const sportsSubcats = ["Bicicletas", "Coleccionables", "Deportes", "Instrumentos Musicales", "Libros, Revistas y Comics", "Otros Hobbies"];
            
            if (attr.subcategoria && sportsSubcats.includes(attr.subcategoria)) {
                let details = [];
                
                // Iconos específicos por subcategoría
                if (attr.tipo_bicicleta) details.push(`<span><i class="fas fa-bicycle"></i> ${attr.tipo_bicicleta}</span>`);
                if (attr.tipo_instrumento) details.push(`<span><i class="fas fa-music"></i> ${attr.tipo_instrumento}</span>`);
                if (attr.tipo_articulo) details.push(`<span><i class="fas fa-trophy"></i> ${attr.tipo_articulo}</span>`);
                if (attr.marca) details.push(`<span><i class="fas fa-tag"></i> ${attr.marca}</span>`);
                if (attr.aro) details.push(`<span><i class="fas fa-circle-notch"></i> Aro ${attr.aro}</span>`);
                if (attr.condicion) details.push(`<span><i class="fas fa-star"></i> ${attr.condicion}</span>`);
                
                if (details.length > 0) {
                    sportsDetailsHTML = `
                        <div class="sports-details">
                            ${details.slice(0, 3).join('')}
                        </div>
                    `;
                }
            }
        }

        // --- SECCIÓN: Iconos de atributos de mascotas ---
        let petsDetailsHTML = '';
        if (ad.atributos_clave && typeof ad.atributos_clave === 'object' && ad.categoria) {
            const attr = ad.atributos_clave;
            const categoria = ad.categoria.toLowerCase();
            
            const petsSubcats = ["Perros", "Gatos", "Aves", "Peces", "Otros Animales", "Accesorios para Mascotas"];
            
            if (attr.subcategoria && petsSubcats.includes(attr.subcategoria)) {
                let details = [];
                
                if (attr.tipo_anuncio) details.push(`<span><i class="fas fa-paw"></i> ${attr.tipo_anuncio}</span>`);
                if (attr.tipo_accesorio) details.push(`<span><i class="fas fa-bone"></i> ${attr.tipo_accesorio}</span>`);
                if (attr.raza) details.push(`<span><i class="fas fa-dog"></i> ${attr.raza}</span>`);
                if (attr.edad_mascota) details.push(`<span><i class="fas fa-birthday-cake"></i> ${attr.edad_mascota}</span>`);
                if (attr.genero) details.push(`<span><i class="fas fa-venus-mars"></i> ${attr.genero}</span>`);
                if (attr.marca) details.push(`<span><i class="fas fa-tag"></i> ${attr.marca}</span>`);
                
                if (details.length > 0) {
                    petsDetailsHTML = `
                        <div class="pets-details">
                            ${details.slice(0, 3).join('')}
                        </div>
                    `;
                }
            }
        }

        // --- SECCIÓN: Iconos de atributos de servicios ---
        let servicesDetailsHTML = '';
        if (ad.atributos_clave && typeof ad.atributos_clave === 'object' && ad.categoria) {
            const attr = ad.atributos_clave;
            const categoria = ad.categoria.toLowerCase();
            
            const servicesSubcats = ["Servicios de Construcción", "Servicios de Educación", "Servicios de Eventos", "Servicios de Salud", "Servicios de Tecnología", "Servicios para el Hogar", "Otros Servicios"];
            
            if (attr.subcategoria && servicesSubcats.includes(attr.subcategoria)) {
                let details = [];
                
                if (attr.tipo_servicio) details.push(`<span><i class="fas fa-wrench"></i> ${attr.tipo_servicio}</span>`);
                if (attr.modalidad) details.push(`<span><i class="fas fa-location-arrow"></i> ${attr.modalidad}</span>`);
                if (attr.experiencia) details.push(`<span><i class="fas fa-award"></i> ${attr.experiencia}</span>`);
                
                if (details.length > 0) {
                    servicesDetailsHTML = `
                        <div class="services-details">
                            ${details.slice(0, 3).join('')}
                        </div>
                    `;
                }
            }
        }

        // --- SECCIÓN: Iconos de atributos de negocios ---
        let businessDetailsHTML = '';
        if (ad.atributos_clave && typeof ad.atributos_clave === 'object' && ad.categoria) {
            const attr = ad.atributos_clave;
            const categoria = ad.categoria.toLowerCase();
            
            const businessSubcats = ["Equipos para Negocios", "Maquinaria para Negocios", "Negocios en Venta"];
            
            if (attr.subcategoria && businessSubcats.includes(attr.subcategoria)) {
                let details = [];
                
                if (attr.tipo_negocio) details.push(`<span><i class="fas fa-briefcase"></i> ${attr.tipo_negocio}</span>`);
                if (attr.tipo_equipo) details.push(`<span><i class="fas fa-cogs"></i> ${attr.tipo_equipo}</span>`);
                if (attr.marca) details.push(`<span><i class="fas fa-tag"></i> ${attr.marca}</span>`);
                if (attr.modelo) details.push(`<span><i class="fas fa-barcode"></i> ${attr.modelo}</span>`);
                if (attr.años_operacion) details.push(`<span><i class="fas fa-calendar-check"></i> ${attr.años_operacion}</span>`);
                if (attr.incluye) details.push(`<span><i class="fas fa-check-circle"></i> ${attr.incluye}</span>`);
                if (attr.razon_venta) details.push(`<span><i class="fas fa-info-circle"></i> ${attr.razon_venta}</span>`);
                if (attr.condicion) details.push(`<span><i class="fas fa-star"></i> ${attr.condicion}</span>`);
                
                if (details.length > 0) {
                    businessDetailsHTML = `
                        <div class="business-details">
                            ${details.slice(0, 3).join('')}
                        </div>
                    `;
                }
            }
        }

        // --- SECCIÓN: Iconos de atributos de comunidad ---
        let communityDetailsHTML = '';
        if (ad.atributos_clave && typeof ad.atributos_clave === 'object' && ad.categoria) {
            const attr = ad.atributos_clave;
            const categoria = ad.categoria.toLowerCase();

            const communitySubcats = ["Clases y Cursos", "Eventos", "Otros"];
            
            if (attr.subcategoria && communitySubcats.includes(attr.subcategoria)) {
                let details = [];
                
                if (attr.tipo_evento) details.push(`<span><i class="fas fa-calendar-day"></i> ${attr.tipo_evento}</span>`);
                if (attr.tipo_actividad) details.push(`<span><i class="fas fa-users"></i> ${attr.tipo_actividad}</span>`);
                if (attr.tipo_clase) details.push(`<span><i class="fas fa-chalkboard-teacher"></i> ${attr.tipo_clase}</span>`);
                if (attr.nivel) details.push(`<span><i class="fas fa-chart-line"></i> ${attr.nivel}</span>`);
                if (attr.modalidad) details.push(`<span><i class="fas fa-map-marker-alt"></i> ${attr.modalidad}</span>`);
                if (attr.fecha_evento) details.push(`<span><i class="fas fa-calendar-alt"></i> ${attr.fecha_evento}</span>`);
                
                if (details.length > 0) {
                    communityDetailsHTML = `
                        <div class="community-details">
                            ${details.slice(0, 3).join('')}
                        </div>
                    `;
                }
            }
        }

        console.log('Anuncio:', ad.featured_plan, ad.url_portada, ad.url_galeria);

        // ✅ Si está vendido, no permite ir a detalles
        const soldClass = ad.is_sold ? 'card-sold' : '';
        const soldBadgeResults = ad.is_sold ? '<span class="badge-sold-home" title="Vendido"><i class="fas fa-check-circle"></i> VENDIDO</span>' : '';
        
        // ✅ Avatar del vendedor - Solo mostrar si tiene foto
        const vendorProfile = ad.profiles ? (Array.isArray(ad.profiles) ? ad.profiles[0] : ad.profiles) : null;
        const vendorPhoto = vendorProfile?.url_foto_perfil;
        const vendorName = vendorProfile?.nombre_negocio || 'Usuario';
        const vendorAvatar = vendorPhoto ? `<div class="vendor-avatar" title="${vendorName}">
            <img src="${vendorPhoto}" alt="${vendorName}" class="vendor-avatar-img">
            <span class="vendor-name-tooltip">${vendorName}</span>
        </div>` : '';

return `
        <div class="property-card card ${cardExtraClass} ${soldClass}" style="${ad.is_sold ? 'cursor: default;' : 'cursor: pointer;'}">
                ${badgeHTML}
                ${urgentBadge}
                ${soldBadgeResults}
                <div class="property-image">
                        ${['premium','destacado','top'].includes(ad.featured_plan)
                            ? `
                            <div class="tarjeta-auto">
                            <div class="swiper product-gallery-swiper mini-gallery" id="swiper-${ad.id}">
                                <div class="swiper-wrapper">
                                    ${videoEmbedUrl ? `<div class="swiper-slide video-slide"><iframe src="${videoEmbedUrl}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius: 8px;"></iframe></div>` : ''}
                                    ${Array.isArray(ad.url_galeria) && ad.url_galeria.length
                                        ? ad.url_galeria.map(img =>
                                                `<div class="swiper-slide"><img src="${img}" alt="${ad.titulo}" loading="lazy"></div>`
                                            ).join('')
                                        : `<div class="swiper-slide"><img src="${ad.url_portada}" alt="${ad.titulo}" loading="lazy"></div>`}
                                </div>
                                <div class="swiper-pagination"></div>
                                </div>
                            </div>`
                            : `<img src="${ad.url_portada || 'placeholder.jpg'}" alt="${ad.titulo}" class="dashboard-ad-image" loading="lazy">`}
                </div>
        
                <div class="property-details">
                        <div class="property-header">
                                <div class="property-seller-name">${ad.contact_name || 'Usuario Verificado'}</div>
                                <div class="property-price-and-tag">
                                        <span class="property-price">${priceFormatted}</span>
                                        ${ad.enhancements && ad.enhancements.is_urgent ? '<span class="tag-oportunidad">Oportunidad</span>' : ''}
                                </div>
                                <div class="property-location">
                                        <i class="fas fa-map-marker-alt"></i>
                                        ${ad.provincia || 'Panamá'}, ${ad.distrito || ad.ubicacion || 'N/A'}
                                </div>
                                <h2 class="property-title">${ad.titulo}</h2>
                                <div class="description-with-avatar">
                                        <p class="property-description">${ad.descripcion ? ad.descripcion.substring(0, 100) + '...' : ''}</p>
                                        ${vendorAvatar}
                                </div>
                        </div>
            
                        <div class="property-attributes">
                ${generateAttributesHTML(ad.atributos_clave, ad.categoria)}
                        </div>
            
            <button class="btn-contact-card" data-contact-id="${ad.id}" data-contact-phone="${ad.contact_phone || ''}">
                Contactar ahora
            </button>
                </div>
        </div>
`;
    }).join('');

    container.innerHTML = adsHTML;

    // ✅ FIJAR: Destruir Swipers previos y guardar referencias
    const existingGallerySwipers = window.activeGallerySwipers || [];
    existingGallerySwipers.forEach(swiper => swiper.destroy());
    window.activeGallerySwipers = [];

    // Inicializar Swiper para cada tarjeta .mini-gallery
    document.querySelectorAll('.mini-gallery').forEach(el => {
      const slides = el.querySelectorAll('.swiper-slide').length;
      const swiper = new Swiper(el, {
        loop: slides > 1,
        pagination: { el: el.querySelector('.swiper-pagination'), clickable: true },
        navigation: {
          nextEl: el.querySelector('.swiper-button-next'),
          prevEl: el.querySelector('.swiper-button-prev'),
        },
        slidesPerView: 1,
        autoplay: false,
      });
      window.activeGallerySwipers.push(swiper);
    });

    // ✅ FIJAR: Usar event delegation en lugar de listeners duplicados
    if (container._propertyImageListener) {
        container.removeEventListener('click', container._propertyImageListener);
    }
    
    container._propertyImageListener = (e) => {
      if (e.target.closest('.property-image')) {
        e.stopPropagation();
      }
    };
    container.addEventListener('click', container._propertyImageListener);
    
    // ✅ Evento delegado SOLO para botón Contactar
    container.addEventListener('click', (e) => {
      const contactLink = e.target.closest('.btn-contact-card');
      if (!contactLink) return;
      
      e.preventDefault();
      const contactId = contactLink.dataset.contactId;
      
      if (contactId) {
        window.location.href = `detalle-producto.html?id=${contactId}`;
      }
    });
}

// ✅ FUNCIÓN DE CONTACTO - Abre WhatsApp o muestra diálogo
function contactar(adId, contactPhone) {
    if (!contactPhone) {
        alert('No hay número de teléfono disponible para contactar.');
        return;
    }
    
    // Limpiar números (solo dígitos y +)
    const cleanPhone = contactPhone.replace(/\D/g, '');
    
    if (cleanPhone) {
        // Abrir WhatsApp Web con mensaje predeterminado
        const message = encodeURIComponent('Hola, estoy interesado en tu anuncio. ¿Podrías brindarme más información?');
        window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    }
}

function updateSummary(query, category, count) {
    const summaryElement = document.getElementById('results-summary');
    if (!summaryElement) return;
    let text = `Encontrados <strong>${count}</strong> anuncios`;
    if (category !== 'all') text += ` en <strong>${category}</strong>`;
    summaryElement.innerHTML = text;
}

function displayError(message) {
    const container = document.getElementById('results-container');
    if (container) container.innerHTML = `<p class="no-results">${message}</p>`;
}

// --- FUNCIÓN DE PAGINACIÓN ---
function displayPaginationControls(totalCount) {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(totalCount / RESULTS_PER_PAGE);
    paginationContainer.innerHTML = ''; // Limpiar controles existentes

    if (totalPages <= 1) return; // No mostrar paginación si solo hay una página

    // Botón "Anterior"
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Anterior';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        currentPage--;
        loadAndFilterResults();
    });
    paginationContainer.appendChild(prevButton);

    // Números de página
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.toggle('active', i === currentPage);
        pageButton.addEventListener('click', () => {
            currentPage = i;
            loadAndFilterResults();
        });
        paginationContainer.appendChild(pageButton);
    }

    // Botón "Siguiente"
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Siguiente';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        currentPage++;
        loadAndFilterResults();
    });
    paginationContainer.appendChild(nextButton);
}

// --- INICIALIZACIÓN Y EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar carrusel del hero de categoría
    initializeCategoryHero();

    const params = new URLSearchParams(window.location.search);
    const mainCategoryName = params.get('category');

    if (mainCategoryName && mainCategoryName !== 'all') {
        const { data: parentCategory } = await supabase.from('categorias').select('id').eq('nombre', mainCategoryName).single();

        if (parentCategory) {
            const { data: subcategories, error: subcatError } = await supabase.from('categorias').select('nombre').eq('parent_id', parentCategory.id);
            if(subcatError) { console.error(subcatError); return; }

            // Calcular la cantidad de anuncios por subcategoría
            const subcategoriesWithCounts = await Promise.all(
              subcategories.map(async sub => {
                const { data, count, error: countError } = await supabase
                  .from('anuncios')
                  .select('id', { count: 'exact' })
                  .eq('categoria', sub.nombre);

                if (countError) console.error('Error al contar', sub.nombre, countError);
                return { ...sub, count: count || 0 };
              })
            );

            // Mostrar el resultado completo
            displaySubcategoryFilters(subcategoriesWithCounts);
        } else {
            // Si no hay categoría padre, mostrar mensaje de no subcategorías
            displaySubcategoryFilters([]);
        }
    } else {
        // Si no hay categoría específica, cargar todas las categorías disponibles con conteos
        const { data: allCategories, error: catError } = await supabase.from('categorias').select('nombre');
        if (catError) {
            console.error(catError);
            displaySubcategoryFilters([]);
            return;
        }

        // Bloque de conteo de categorías eliminado para optimización.
        const allCategoriesWithCounts = await Promise.all(
          allCategories.map(async cat => {
            const { data, count, error: countError } = await supabase
              .from('anuncios')
              .select('id', { count: 'exact' })
              .eq('categoria', cat.nombre);
            if (countError) console.error('Error al contar', cat.nombre, countError);
            return { ...cat, count: count || 0 };
          })
        );
        displaySubcategoryFilters(allCategoriesWithCounts); // Mostrar todas las categorías
    }

    await loadAndFilterResults();

    const applyBtn = document.getElementById('apply-filters-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            currentPage = 1; // Resetear a la primera página al aplicar filtros
            loadAndFilterResults();
        });
    }
});
