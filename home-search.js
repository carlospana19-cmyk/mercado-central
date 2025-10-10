// home-search.js - VERSIÓN SIMPLE Y FUNCIONAL

import { supabase } from './supabase-client.js';

export async function loadSearchCategories() {
  const categorySelect = document.getElementById('categorySelect');
  if (!categorySelect) return;

  try {
    const { data: categories, error } = await supabase
      .from('categorias')
      .select('nombre')
      .is('parent_id', null)
      .order('nombre');

    if (error) throw error;

    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.nombre;
      option.textContent = category.nombre;
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar categorías:', error);
  }
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
