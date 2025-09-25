// home-search.js - Lógica exclusiva para el buscador de la página de inicio

document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');

    searchButton.addEventListener('click', () => {
        const searchTerm = document.getElementById('mainSearchInput').value.trim();
        const category = document.getElementById('categorySelect').value;
        const location = document.getElementById('locationInput').value.trim();

        const searchURL = `resultados.html?query=${encodeURIComponent(searchTerm)}&category=${category}&location=${encodeURIComponent(location)}`;

        window.location.href = searchURL;
    });
});
