import { supabase } from './supabase-client.js';

export async function initializeDashboardPage() {
    const container = document.querySelector('#my-ads-container');
    if (!container) { return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // 1. PEDIMOS LOS NUEVOS CAMPOS A SUPABASE
    const { data: ads, error } = await supabase
        .from('anuncios')
        .select('*, imagenes(url_imagen)') // Seleccionamos todos los campos del anuncio
        .eq('user_id', user.id);

    if (error) {
        container.innerHTML = '<p>Error al cargar tus anuncios.</p>';
        return;
    }
    
    if (ads.length === 0) {
        container.innerHTML = '<p>Aún no tienes anuncios. <a href="publicar.html">¡Crea uno!</a></p>';
        return;
    }

    container.innerHTML = ads.map(ad => {
        // 2. CREAMOS UN FRAGMENTO DE HTML PARA LOS DETALLES DEL VEHÍCULO
        let vehicleDetailsHTML = '';
        if (ad.anio || ad.kilometraje) {
            vehicleDetailsHTML = `
                <div class="dashboard-ad-details">
                    ${ad.anio ? `<span><i class="fas fa-calendar-alt"></i> ${ad.anio}</span>` : ''}
                    ${ad.kilometraje ? `<span><i class="fas fa-tachometer-alt"></i> ${ad.kilometraje.toLocaleString('es-PA')} km</span>` : ''}
                    ${ad.transmision ? `<span><i class="fas fa-cogs"></i> ${ad.transmision}</span>` : ''}
                </div>
            `;
        }

        // 3. INTEGRAMOS LOS DETALLES EN LA TARJETA
        return `
            <div class="dashboard-ad-card">
                <img src="${ad.url_portada || 'images/placeholder.jpg'}" alt="${ad.titulo}" class="dashboard-ad-image">
                <div class="dashboard-ad-info">
            <h3>${ad.titulo}</h3>
                    <p>${new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'PAB' }).format(ad.precio)}</p>
                    ${vehicleDetailsHTML} 
                </div>
            <div class="dashboard-ad-actions">
                <a href="editar-anuncio.html?id=${ad.id}" class="btn-edit">Editar</a>
                    <button class="btn-delete" data-id="${ad.id}">Borrar</button>
                </div>
            </div>
        `;
    }).join('');

    // Lógica de borrado (sin cambios)
    container.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', async (e) => {
            const adId = e.target.dataset.id;
            if (confirm('¿Seguro que quieres borrar este anuncio?')) {
                // Aquí necesitaríamos una lógica más compleja para borrar imágenes de Storage
                const { error } = await supabase.from('anuncios').delete().eq('id', adId);
                if (error) {
                    alert('Error al borrar el anuncio.');
                } else {
                    e.target.closest('.dashboard-ad-card').remove();
                }
            }
        });
    });
}
