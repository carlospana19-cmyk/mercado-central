import { supabase } from './supabase-client.js';

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
    queryBuilder = queryBuilder.range(from, to);

    const { data: products, error, count } = await queryBuilder;

    if (error) {
        console.error("Error al obtener los anuncios:", error);
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

        // Detalles del vehículo
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

            return `
                <div class="${cardClass}" onclick="window.location.href='detalle-producto.html?id=${ad.id}'">
                        <img src="${ad.url_portada || 'placeholder.jpg'}" alt="${ad.titulo}">
                    <div class="content">
                        <div class="price">${priceFormatted}</div>
                        <h3>${ad.titulo}</h3>
                        <div class="location"><i class="fas fa-map-marker-alt"></i> ${ad.ubicacion || 'N/A'}</div>
                        ${vehicleDetailsHTML}
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
