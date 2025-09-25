// home-logic.js

// CONFIGURACIÓN DE LA CONEXIÓN A SUPABASE
const SUPABASE_URL = 'https://tinjpodtyydloleepbmb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpbmpwb2R0eXlkbG9sZWVwYm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTUxMTMsImV4cCI6MjA3NDEzMTExM30.OJmuyJW3MfQ3JtAtBApZ32jks2qc1UzTBY_hbnFksYk';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    const productsContainer = document.querySelector('.products .box-container');
    if (!productsContainer) {
        console.error('No se encontró el contenedor de productos en index.html');
        return;
    }

    productsContainer.innerHTML = '<p>Cargando anuncios recientes...</p>';

    const { data: ads, error } = await supabaseClient
        .from('anuncios')
        .select('*')
        .limit(8);

    if (error) {
        console.error("Error al cargar anuncios recientes:", error);
        productsContainer.innerHTML = '<p>No se pudieron cargar los anuncios. Intenta más tarde.</p>';
        return;
    }

    if (ads.length === 0) {
        productsContainer.innerHTML = '<p>¡Sé el primero en publicar! Aún no hay anuncios.</p>';
        return;
    }

    productsContainer.innerHTML = '';
    ads.forEach(ad => {
        const adElement = document.createElement('div');
        adElement.className = 'box';
        adElement.innerHTML = `
            <img src="${ad.url_imagen}" alt="${ad.titulo}">
            <h3>${ad.titulo}</h3>
            <div class="price">$${ad.precio}</div>
            <div class="stars">
                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
            </div>
            <a href="detalle-producto.html?id=${ad.anuncio_id}" class="btn">Ver detalles</a>
        `;
        productsContainer.appendChild(adElement);
    });
});
