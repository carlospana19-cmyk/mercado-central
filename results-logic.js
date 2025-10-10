import { supabase } from './supabase-client.js';

// --- FUNCIÓN PRINCIPAL DE CARGA Y FILTRADO ---
async function loadAndFilterResults() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q')?.toLowerCase() || '';
    const mainCategory = params.get('category') || 'all';
    const location = params.get('location')?.toLowerCase() || '';

    const selectedSubcategories = Array.from(document.querySelectorAll('input[name="subcategory"]:checked')).map(cb => cb.value);
    const priceMin = document.getElementById('price-min').value;
    const priceMax = document.getElementById('price-max').value;

    let queryBuilder = supabase.from('anuncios').select('*', { count: 'exact' }); // Usamos count para el total

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

    const { data: products, error, count } = await queryBuilder;

    if (error) {
        console.error("Error al obtener los anuncios:", error);
        displayError("Hubo un error al cargar los anuncios.");
        return;
    }
    
    displayFilteredProducts(products || []);
    updateSummary(query, mainCategory, count || 0);
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
// ... (El resto de funciones displayFilteredProducts, updateSummary, displayError se mantienen igual)
function displayFilteredProducts(productsToDisplay) {
    const container = document.getElementById('results-container');
    if (!container) return;
    container.innerHTML = "";

    if (productsToDisplay.length === 0) {
        container.innerHTML = `<p class="no-results">No se encontraron anuncios con estos filtros.</p>`;
        return;
    }

    container.innerHTML = productsToDisplay.map(product => {
        const isVehicle = product.anio || product.marca || product.kilometraje;

        if (isVehicle) {
            // --- TARJETA PREMIUM PARA VEHÍCULOS ---
            return `
            <article class="tarjeta-auto">
                <img src="${product.url_portada || 'images/placeholder.jpg'}" alt="${product.titulo}">
                <div class="contenido-auto">
                    <div class="cabecera-auto">
                        <h2>${product.titulo}</h2>
                        <p class="precio">${new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(product.precio)}</p>
                    </div>
                    <div class="detalles-principales">
                        ${product.anio ? `<div class="detalle-item"><i class="fas fa-calendar-alt"></i><span>${product.anio}</span></div>` : ''}
                        ${product.kilometraje ? `<div class="detalle-item"><i class="fas fa-tachometer-alt"></i><span>${product.kilometraje.toLocaleString('es-PA')} km</span></div>` : ''}
                        ${product.transmision ? `<div class="detalle-item"><i class="fas fa-cogs"></i><span>${product.transmision}</span></div>` : ''}
                        ${product.combustible ? `<div class="detalle-item"><i class="fas fa-gas-pump"></i><span>${product.combustible}</span></div>` : ''}
                    </div>
                    <div class="ubicacion">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${product.distrito || product.provincia || 'N/A'}</span>
                    </div>
                    <a href="detalle-producto.html?id=${product.id}" class="btn-ver-detalles">Ver Detalles</a>
                </div>
            </article>
            `;
        } else {
            // --- TARJETA GENÉRICA SIMPLE ---
            return `
            <div class="box">
                <div class="image-container">
                    <img src="${product.url_portada || 'images/placeholder.jpg'}" alt="${product.titulo}">
                </div>
                <div class="content">
                    <div class="price">${new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(product.precio)}</div>
                <h3>${product.titulo}</h3>
                    <p class="location">${product.distrito || product.provincia || 'N/A'}</p>
                    <a href="detalle-producto.html?id=${product.id}" class="btn-contact">Contactar</a>
                </div>
            </div>
        `;
        }
    }).join('');
}
function updateSummary(query, category, count) { /* ... sin cambios ... */ 
    const summaryElement = document.getElementById('results-summary');
    if (!summaryElement) return;
    let text = `Encontrados <strong>${count}</strong> anuncios`;
    if (category !== 'all') text += ` en <strong>${category}</strong>`;
    summaryElement.innerHTML = text;
}
function displayError(message) { /* ... sin cambios ... */ 
    const container = document.getElementById('results-container');
    if (container) container.innerHTML = `<p class="no-results">${message}</p>`;
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
            
            // --- NUEVA LÓGICA DE CONTEO (ROBUSTA) ---
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
        }
    }

    await loadAndFilterResults();

    const applyBtn = document.getElementById('apply-filters-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', loadAndFilterResults);
    }
});
