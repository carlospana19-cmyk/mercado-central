// dashboard-logic.js (VERSIÓN ESTABLE)
document.addEventListener('DOMContentLoaded', async () => {
    // 1. VERIFICAR SI HAY UN USUARIO CONECTADO
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        alert('Debes iniciar sesión para ver tu panel.');
        window.location.href = 'login.html';
        return;
    }
    
    loadUserAds(user.id);
    
    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });
});

async function loadUserAds(userId) {
    const container = document.querySelector('#my-ads-container .box-container');
    if (!container) return; // Salida segura
    
    const { data: ads, error } = await supabaseClient.from('anuncios').select('*').eq('user_id', userId);
        
    if (error || !ads || ads.length === 0) {
        container.innerHTML = '<p>Aún no has publicado ningún anuncio. <a href="publicar.html">¡Publica el primero!</a></p>';
        return;
    }
    
    container.innerHTML = '';
    ads.forEach(ad => {
        const adElement = document.createElement('div');
        adElement.className = 'box'; // Esta clase es la que aplica el estilo de tarjeta
        adElement.innerHTML = `
            <img src="${ad.url_portada}" alt="${ad.titulo}">
            <h3>${ad.titulo}</h3>
            <div class="price">$${ad.precio}</div>
            <div class="dashboard-ad-actions">
                <button class="btn-edit" onclick="editAd('${ad.id}')">Editar</button>
                <button class="btn-delete" onclick="deleteAd('${ad.id}', this)">Borrar</button>
            </div>
        `;
        container.appendChild(adElement);
    });
}

async function deleteAd(adId, buttonElement) {
    if (confirm("¿Estás seguro de que quieres borrar este anuncio?")) {
        buttonElement.textContent = "Borrando...";
        const { error } = await supabaseClient.from('anuncios').delete().eq('id', adId);
        if (error) {
            alert("Hubo un error al borrar el anuncio.");
            buttonElement.textContent = "Borrar";
        } else {
            buttonElement.closest('.box').remove();
        }
    }
}

function editAd(adId) {
    window.location.href = `editar-anuncio.html?id=${adId}`;
}
