// home-search.js - VERSIÓN SIMPLE Y FUNCIONAL

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

    // Contar usuarios registrados usando auth.users
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

    let usersCount = 0;
    if (!usersError && usersData && usersData.users) {
      usersCount = usersData.users.length;
    } else {
      console.log('Error al contar usuarios:', usersError);
    }

    if (adsError) console.error('Error al contar anuncios:', adsError);
    if (usersError) console.error('Error al contar usuarios:', usersError);

    // Actualizar las estadísticas en el DOM
    const adsElement = document.querySelector('.stat-item:nth-child(1) .stat-number');
    const usersElement = document.querySelector('.stat-item:nth-child(2) .stat-number');

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
      item.addEventListener('click', () => {
        // Redirigir a resultados con la categoría seleccionada
        window.location.href = `resultados.html?category=${encodeURIComponent(category.nombre)}`;
      });
      // Cambiar cursor para indicar que es clickeable
      item.style.cursor = 'pointer';
    }
  });
}

function performSearch() {
        const searchTerm = document.getElementById('mainSearchInput').value.trim();
        const category = document.getElementById('categorySelect').value;
        const location = document.getElementById('locationInput').value.trim();

  const queryParams = new URLSearchParams();
  if (searchTerm) queryParams.set('q', searchTerm);
  if (category && category !== 'all') queryParams.set('category', category);
  if (location) queryParams.set('location', location);

  window.location.href = `resultados.html?${queryParams.toString()}`;
}

export function initializeSearchButton() {
  const searchButton = document.getElementById('searchButton');
  const searchInput = document.getElementById('mainSearchInput');

  if (searchButton) {
    searchButton.addEventListener('click', performSearch);
  }
  if (searchInput) {
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        performSearch();
      }
});
  }
}
