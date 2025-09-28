document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        alert('Debes iniciar sesión para ver tu panel.');
        window.location.href = 'login.html';
        return;
    }
    
    // Llamamos a la función principal para cargar los anuncios
    loadUserAds(user.id);
    
    const logoutButton = document.getElementById('logout-button');
    if(logoutButton) {
        logoutButton.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        });
    }
});

async function loadUserAds(userId) {
    const container = document.querySelector('#my-ads-container .box-container');
    if (!container) return;
    
    // 1. OBTENEMOS LOS ANUNCIOS DEL USUARIO, ASEGURÁNDONOS DE PEDIR LA url_portada
    const { data: ads, error } = await supabaseClient
        .from('anuncios')
        .select('id, titulo, precio, url_portada') // Pedimos explícitamente las columnas necesarias
        .eq('user_id', userId);
        
    // Depuración: Verificamos qué datos estamos recibiendo
    console.log('Anuncios del usuario para el dashboard:', ads);

    if (error || !ads || ads.length === 0) {
        container.innerHTML = '<p>Aún no has publicado ningún anuncio. <a href="publicar.html">¡Publica el primero!</a></p>';
        return;
    }
    
    // 2. CONSTRUIMOS EL HTML PARA CADA ANUNCIO
    container.innerHTML = ''; // Limpiamos el contenedor
    ads.forEach(ad => {
        const adElement = document.createElement('div');
        adElement.className = 'box'; // La clase que define la tarjeta

        // Usamos la estructura Swiper para compatibilidad de estilos
        // y un placeholder si la url_portada es nula
        adElement.innerHTML = `
            <div class="swiper product-swiper">
                <div class="swiper-wrapper">
                    <div class="swiper-slide">
                        <img src="${ad.url_portada || 'images/placeholder.jpg'}" alt="${ad.titulo}">
                    </div>
                </div>
            </div>
            <h3>${ad.titulo}</h3>
            <div class="price">$${ad.precio}</div>
            <div class="dashboard-ad-actions">
                <a href="editar-anuncio.html?id=${ad.id}" class="btn-edit">Editar</a>
                <button class="btn-delete" data-ad-id="${ad.id}">Borrar</button>
            </div>
        `;
        container.appendChild(adElement);
    });

    // 3. INICIALIZAMOS SWIPER.JS (CRUCIAL PARA EL RENDERIZADO VISUAL)
    new Swiper('.product-swiper', {
        // No se necesitan opciones de navegación, solo inicializarlo
    });

    // 4. AÑADIMOS EVENT LISTENERS PARA LOS BOTONES DE BORRAR (MÁS SEGURO)
    container.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', () => {
            const adId = button.dataset.adId;
            deleteAd(adId, button);
        });
    });
}

async function deleteAd(adId, buttonElement) {
    if (confirm("¿Estás seguro de que quieres borrar este anuncio? Esta acción no se puede deshacer.")) {
        buttonElement.textContent = "Borrando...";
        buttonElement.disabled = true;

        // Aquí iría la lógica completa de borrado (tabla 'imagenes', Storage y luego tabla 'anuncios')
        // Por ahora, solo borramos de 'anuncios' para probar
        const { error } = await supabaseClient.from('anuncios').delete().eq('id', adId);
        
        if (error) {
            alert("Hubo un error al borrar el anuncio.");
            console.error("Error al borrar:", error);
            buttonElement.textContent = "Borrar";
            buttonElement.disabled = false;
        } else {
            buttonElement.closest('.box').remove();
        }
    }
}
