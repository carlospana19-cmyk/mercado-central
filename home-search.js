// home-search.js - Lógica exclusiva para el buscador de la página de inicio

document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('mainSearchInput');
    const categorySelect = document.getElementById('categorySelect');

    searchButton.addEventListener('click', () => {
        const searchInput = document.getElementById('mainSearchInput');
        const categorySelect = document.getElementById('categorySelect');
        const locationInput = document.getElementById('locationInput'); // <--- AÑADIDO

        const searchTerm = searchInput.value.trim();
        const category = categorySelect.value;
        const location = locationInput.value.trim(); // <--- AÑADIDO

        // URL actualizada con el nuevo parámetro de ubicación
        const searchURL = `resultados.html?query=${encodeURIComponent(searchTerm)}&category=${category}&location=${encodeURIComponent(location)}`;

        window.location.href = searchURL;
    });
});