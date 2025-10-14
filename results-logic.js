import { supabase } from './supabase-client.js';

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

    let queryBuilder = supabase.from('anuncios').select('*', { count: 'exact' });

    if (query) queryBuilder = queryBuilder.or(`titulo.ilike.%${query}%,descripcion.ilike.%${query}%`);
    if (location) queryBuilder = queryBuilder.ilike('ubicacion', `%${location}%`);

    if (selectedSubcategories.length > 0) {
        queryBuilder = queryBuilder.in('categoria', selectedSubcategories);
    } else if (mainCategory !== 'all') {
        const { data: parentCategory } = await supabase.from('categorias').select('id').eq('nombre', mainCategory).single();
        if (parentCategory) {
            const { data: subcategories } = await supabase.from('categorias').select('nombre').eq('parent_id', parentCategory.id);
            const allCategoryNames = [mainCategory, ...subcategories.map(s => s.nombre)];
            queryBuilder = queryBuilder.in('categoria', allCategoryNames);
        }
    }

    if (priceMin) queryBuilder = queryBuilder.gte('precio', priceMin);
    if (priceMax) queryBuilder = queryBuilder.lte('precio', priceMax);

    // --- Lógica de paginación en la consulta ---
    const from = (currentPage - 1) * RESULTS_PER_PAGE;
    const to = from + RESULTS_PER_PAGE - 1;
    
    console.log(`DEBUG: Paginación - currentPage: ${currentPage}, from: ${from}, to: ${to}`);
    queryBuilder = queryBuilder.range(from, to);

    const { data: products, error, count } = await queryBuilder;

    if (error) {
        console.error("Error al obtener los anuncios:", error, "Query:", queryBuilder.url);
        displayError("Hubo un error al cargar los anuncios.");
        return;
    }
    
    displayFilteredProducts(products || []);
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
            ${sub.nombre} <span style="color: #7f8c8d; font-size: 1.2rem;">(${sub.count})</span>
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

    const adsHTML = ads.map(ad => {
        const priceFormatted = new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(ad.precio);
        // Decide qué tarjeta usar. Aquí un ejemplo simple, puedes hacerlo más complejo.
        const cardClass = ad.is_premium ? 'tarjeta-auto' : 'box';

        // Detalles del vehículo o inmueble
        let vehicleDetailsHTML = '';
        if (ad.marca || ad.anio || ad.transmision || ad.combustible) {
            vehicleDetailsHTML = `
                <div class="vehicle-details">
                    ${ad.marca ? `<span><i class="fas fa-car"></i> ${ad.marca}</span>` : ''}
                    ${ad.anio ? `<span><i class="fas fa-calendar-alt"></i> ${ad.anio}</span>` : ''}
                    ${ad.transmision ? `<span><i class="fas fa-cogs"></i> ${ad.transmision}</span>` : ''}
                    ${ad.combustible ? `<span><i class="fas fa-gas-pump"></i> ${ad.combustible}</span>` : ''}
                </div>
            `;
        }

        // Detalles del inmueble
        let realEstateDetailsHTML = '';
        if (ad.m2 || ad.habitaciones || ad.baños) {
            realEstateDetailsHTML = `
                <div class="real-estate-details">
                    ${ad.m2 ? `<span><i class="fas fa-ruler-combined"></i> ${ad.m2} m²</span>` : ''}
                    ${ad.habitaciones ? `<span><i class="fas fa-bed"></i> ${ad.habitaciones} hab</span>` : ''}
                    ${ad.baños ? `<span><i class="fas fa-bath"></i> ${ad.baños} baños</span>` : ''}
                </div>
            `;
        }

        // --- SECCIÓN: Iconos de atributos de electrónica ---
        let electronicsDetailsHTML = '';
        if (ad.atributos_clave && typeof ad.atributos_clave === 'object') {
            const attr = ad.atributos_clave;
            let details = [];
            
            // Mostrar hasta 3 atributos más relevantes
            if (attr.marca) details.push(`<span><i class="fas fa-tag"></i> ${attr.marca}</span>`);
            if (attr.modelo) details.push(`<span><i class="fas fa-mobile-alt"></i> ${attr.modelo}</span>`);
            if (attr.almacenamiento) details.push(`<span><i class="fas fa-hdd"></i> ${attr.almacenamiento} GB</span>`);
            if (attr.memoria_ram) details.push(`<span><i class="fas fa-microchip"></i> ${attr.memoria_ram} GB RAM</span>`);
            if (attr.procesador) details.push(`<span><i class="fas fa-microchip"></i> ${attr.procesador}</span>`);
            if (attr.tipo_computadora) details.push(`<span><i class="fas fa-laptop"></i> ${attr.tipo_computadora}</span>`);
            if (attr.plataforma) details.push(`<span><i class="fas fa-gamepad"></i> ${attr.plataforma}</span>`);
            if (attr.condicion) details.push(`<span><i class="fas fa-star"></i> ${attr.condicion}</span>`);
            
            // Mostrar solo los primeros 3 atributos para no saturar la tarjeta
            if (details.length > 0) {
                electronicsDetailsHTML = `
                    <div class="electronics-details">
                        ${details.slice(0, 3).join('')}
                    </div>
                `;
            }
        }

            return `
                <div class="${cardClass}" onclick="window.location.href='detalle-producto.html?id=${ad.id}'">
                        <img src="${ad.url_portada || 'placeholder.jpg'}" alt="${ad.titulo}">
                    <div class="content">
                        <div class="price">${priceFormatted}</div>
                        <h3>${ad.titulo}</h3>
                        <div class="location"><i class="fas fa-map-marker-alt"></i> ${ad.ubicacion || 'N/A'}</div>
                        ${vehicleDetailsHTML}
                        ${realEstateDetailsHTML}
                        ${electronicsDetailsHTML}
                    <a href="#" class="btn-contact">Contactar</a>
                    </div>
                </div>
            `;
    }).join('');

    container.innerHTML = adsHTML;
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

            // --- LÓGICA DE CONTEO (ROBUSTA) ---
            const subcategoriesWithCounts = [];
            for (const sub of subcategories) {
                const { count, error } = await supabase
                    .from('anuncios')
                    .select('*', { count: 'exact', head: true }) // head:true hace que no traiga datos, solo el conteo. Es más rápido.
                    .eq('categoria', sub.nombre);

                if (!error) {
                    subcategoriesWithCounts.push({
                        nombre: sub.nombre,
                        count: count
                    });
                }
            }

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

        const categoriesWithCounts = [];
        for (const cat of allCategories) {
            const { count, error } = await supabase
                .from('anuncios')
                .select('*', { count: 'exact', head: true })
                .eq('categoria', cat.nombre);

            if (!error && count > 0) {
                categoriesWithCounts.push({
                    nombre: cat.nombre,
                    count: count
                });
            }
        }

        displaySubcategoryFilters(categoriesWithCounts);
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
