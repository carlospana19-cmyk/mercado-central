// home-search.js - VERSIÓN CON FILTRADO EN TIEMPO REAL

import { supabase } from './supabase-client.js';

export async function loadSearchCategories() {
  const categorySelect = document.getElementById('categorySelect');
  if (!categorySelect) return;

  try {
    const { data: categories, error } = await supabase
      .from('categorias')
      .select('id, nombre')
      .is('parent_id', null)
      .order('nombre');

    if (error) throw error;

    console.log('Categorías cargadas:', categories.map(c => c.nombre));

    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.nombre;
      option.textContent = category.nombre;
      categorySelect.appendChild(option);
    });

    // Cargar categorías para los iconos
    loadCategoryIcons(categories);

    // Cargar estadísticas dinámicas
    loadDynamicStats();
  } catch (error) {
    console.error('Error al cargar categorías:', error);
  }
}

async function loadDynamicStats() {
  try {
    // Contar anuncios activos
    const { count: adsCount, error: adsError } = await supabase
      .from('anuncios')
      .select('*', { count: 'exact', head: true });

    // Contar usuarios registrados directamente de la tabla profiles
    let usersCount = 0;
    let usersError = null;  // Definir fuera del try para que esté disponible después
    try {
      const { count: profilesCount, error: profilesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      usersError = profilesError;

      if (!usersError && profilesCount !== null) {
        usersCount = profilesCount;
      } else {
        // Fallback: usar un conteo aproximado o mostrar "150+"
        usersCount = 150; // Valor aproximado
        console.log('Usando conteo aproximado de usuarios');
      }
    } catch (error) {
      // Si la tabla no existe o hay error, usar aproximado
      usersCount = 150;
      console.log('Tabla profiles no disponible, usando aproximado');
    }

    if (adsError) console.error('Error al contar anuncios:', adsError);
    if (usersError) console.error('Error al contar usuarios:', usersError);

    // Actualizar las estadísticas en el DOM
    const adsElement = document.getElementById('ads-count');
    const usersElement = document.getElementById('users-count');

    if (adsElement && adsCount !== null) {
      adsElement.textContent = adsCount.toLocaleString() + '+';
    }

    if (usersElement && usersCount !== null) {
      usersElement.textContent = usersCount.toLocaleString() + '+';
    }

    console.log(`Estadísticas actualizadas: ${adsCount} anuncios, ${usersCount} usuarios`);

  } catch (error) {
    console.error('Error al cargar estadísticas dinámicas:', error);
  }
}

function loadCategoryIcons(categories) {
  const categoryItems = document.querySelectorAll('.category-item');

  console.log('Categorías disponibles para iconos:', categories.map(c => c.nombre));

  // Mapear los iconos del HTML con las categorías de la base de datos
  const categoryMapping = [
    'Inmuebles',     // fa-home (antes "Bienes Raíces")
    'Vehículos',     // fa-car
    'Electrónica',   // fa-laptop
    'Hogar y Muebles', // fa-couch (antes "Hogar")
    'Moda y Belleza', // fa-tshirt (antes "Moda")
    'Servicios'      // fa-briefcase
  ];

  categoryItems.forEach((item, index) => {
    const categoryName = categoryMapping[index];
    const category = categories.find(cat => cat.nombre === categoryName);

    console.log(`Icono ${index} (${categoryName}): ${category ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);

    if (category) {
      // Agregar data-category para filtrado en tiempo real
      item.setAttribute('data-category', category.nombre);
      
      item.addEventListener('click', (e) => {
        e.preventDefault();
        // Filtrar en tiempo real en la página actual
        filterByCategory(category.nombre);
      });
      // Cambiar cursor para indicar que es clickeable
      item.style.cursor = 'pointer';
    }
  });
}

// =====================================================
// FILTRADO EN TIEMPO REAL
// =====================================================

let currentCategoryFilter = null;
let currentSearchTerm = '';

/**
 * Filtra las tarjetas por categoría en tiempo real
 * @param {string} categoryName - Nombre de la categoría o null para mostrar todas
 */
function filterByCategory(categoryName) {
  currentCategoryFilter = categoryName;
  
  // Actualizar estado visual de los iconos de categoría
  document.querySelectorAll('.category-item').forEach(item => {
    if (item.getAttribute('data-category') === categoryName) {
      item.classList.add('category-active');
    } else {
      item.classList.remove('category-active');
    }
  });
  
  // Aplicar filtros combinados
  applyFilters();
  
  // Actualizar el select de categoría
  const categorySelect = document.getElementById('categorySelect');
  if (categorySelect) {
    categorySelect.value = categoryName || 'all';
  }
  
  console.log(`Filtro de categoría: ${categoryName || 'Todas'}`);
}

/**
 * Filtra las tarjetas por término de búsqueda en tiempo real
 * @param {string} searchTerm - Término de búsqueda
 */
function filterBySearchTerm(searchTerm) {
  currentSearchTerm = searchTerm.toLowerCase().trim();
  applyFilters();
  console.log(`Filtro de búsqueda: "${currentSearchTerm}"`);
}

/**
 * Aplica los filtros combinados (categoría + búsqueda) a las tarjetas
 */
function applyFilters() {
  const cards = document.querySelectorAll('.box');
  let visibleCount = 0;
  
  cards.forEach(card => {
    const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
    const description = card.querySelector('.description')?.textContent?.toLowerCase() || '';
    const cardCategory = card.getAttribute('data-category') || '';
    
    // Verificar si coincide con el filtro de categoría
    const matchesCategory = !currentCategoryFilter || 
                           cardCategory === currentCategoryFilter ||
                           cardCategory.includes(currentCategoryFilter);
    
    // Verificar si coincide con el filtro de búsqueda
    const matchesSearch = !currentSearchTerm || 
                         title.includes(currentSearchTerm) || 
                         description.includes(currentSearchTerm);
    
    // Mostrar u ocultar la tarjeta
    if (matchesCategory && matchesSearch) {
      card.style.display = '';
      card.classList.remove('card-hidden');
      visibleCount++;
    } else {
      card.style.display = 'none';
      card.classList.add('card-hidden');
    }
  });
  
  // Mostrar mensaje si no hay resultados
  showNoResultsMessage(visibleCount === 0);
  
  // Actualizar Swipers después del filtrado
  updateSwipersAfterFilter();
}

/**
 * Muestra u oculta el mensaje de "sin resultados"
 */
function showNoResultsMessage(show) {
  const container = document.querySelector('#products .box-container');
  if (!container) return;
  
  let noResultsEl = document.getElementById('no-results-message');
  
  if (show) {
    if (!noResultsEl) {
      noResultsEl = document.createElement('div');
      noResultsEl.id = 'no-results-message';
      noResultsEl.className = 'no-results-message';
      noResultsEl.innerHTML = `
        <div class="no-results-content">
          <i class="fas fa-search"></i>
          <h3>No se encontraron resultados</h3>
          <p>Intenta con otros términos de búsqueda o categoría</p>
          <button class="btn-clear-filters" onclick="window.clearAllFilters()">
            <i class="fas fa-times"></i> Limpiar filtros
          </button>
        </div>
      `;
      container.appendChild(noResultsEl);
    }
    noResultsEl.style.display = 'block';
  } else if (noResultsEl) {
    noResultsEl.style.display = 'none';
  }
}

/**
 * Limpia todos los filtros y muestra todas las tarjetas
 */
export function clearAllFilters() {
  currentCategoryFilter = null;
  currentSearchTerm = '';
  
  // Limpiar input de búsqueda
  const searchInput = document.getElementById('mainSearchInput');
  if (searchInput) searchInput.value = '';
  
  // Limpiar select de categoría
  const categorySelect = document.getElementById('categorySelect');
  if (categorySelect) categorySelect.value = 'all';
  
  // Quitar clase activa de todos los iconos de categoría
  document.querySelectorAll('.category-item').forEach(item => {
    item.classList.remove('category-active');
  });
  
  // Mostrar todas las tarjetas
  document.querySelectorAll('.box').forEach(card => {
    card.style.display = '';
    card.classList.remove('card-hidden');
  });
  
  // Ocultar mensaje de sin resultados
  showNoResultsMessage(false);
  
  // Actualizar Swipers
  updateSwipersAfterFilter();
  
  console.log('Filtros limpiados');
}

/**
 * Actualiza los Swipers después del filtrado
 */
function updateSwipersAfterFilter() {
  // Actualizar instancias de Swiper existentes
  if (window.activeSwipers) {
    window.activeSwipers.forEach(swiper => {
      swiper.update();
    });
  }
  
  // Actualizar carruseles de filas
  document.querySelectorAll('.row-carousel').forEach(swiperEl => {
    if (swiperEl.swiper) {
      swiperEl.swiper.update();
    }
  });
}

// Exponer función globalmente para el botón de limpiar filtros
window.clearAllFilters = clearAllFilters;

function performSearch() {
  const searchTerm = document.getElementById('mainSearchInput').value.trim();
  const category = document.getElementById('categorySelect').value;
  const location = document.getElementById('locationInput').value.trim();

  // Siempre ir a la página de resultados cuando se hace click en Buscar
  const queryParams = new URLSearchParams();
  if (searchTerm) queryParams.set('q', searchTerm);
  if (category && category !== 'all') queryParams.set('category', category);
  if (location) queryParams.set('location', location);
  
  // Redirigir a resultados.html con los parámetros de búsqueda
  window.location.href = `resultados.html?${queryParams.toString()}`;
}

export function initializeSearchButton() {
  const searchButton = document.getElementById('searchButton');
  const searchInput = document.getElementById('mainSearchInput');
  const categorySelect = document.getElementById('categorySelect');

  if (searchButton) {
    searchButton.addEventListener('click', performSearch);
  }
  
  // Filtrado en tiempo real mientras escribe
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterBySearchTerm(e.target.value);
    });
    
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        performSearch();
      }
    });
  }
  
  // Filtrado cuando cambia la categoría en el select
  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      const category = e.target.value;
      currentCategoryFilter = category !== 'all' ? category : null;
      
      // Actualizar estado visual de los iconos
      document.querySelectorAll('.category-item').forEach(item => {
        if (item.getAttribute('data-category') === category) {
          item.classList.add('category-active');
        } else {
          item.classList.remove('category-active');
        }
      });
      
      applyFilters();
    });
  }
}
