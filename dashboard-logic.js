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
            <div class="dashboard-card" data-ad-id="${ad.id}">
                <img src="${ad.url_portada || 'images/placeholder.jpg'}" alt="${ad.titulo}" class="dashboard-ad-image">
                <div class="dashboard-ad-info">
            <h3>${ad.titulo}</h3>
                    ${vehicleDetailsHTML} 
                </div>
            <div class="dashboard-ad-actions">
                <a href="editar-anuncio.html?id=${ad.id}" class="btn-edit">Editar</a>
                    <button class="btn-delete delete-btn" data-ad-id="${ad.id}">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');

    // FUNCIÓN DE ELIMINAR CORREGIDA
async function deleteAd(adId) {
    if (!confirm('¿Estás seguro de eliminar este anuncio?')) {
        return;
    }
    
    try {
        // Eliminar de la base de datos
        const { error } = await supabase
            .from('anuncios')
            .delete()
            .eq('id', adId);
        
        if (error) throw error;
        
        // Eliminar del DOM - BUSCAR POR ID CORRECTO
        const adElement = document.querySelector(`[data-ad-id="${adId}"]`);
        if (adElement) {
            adElement.remove();
            console.log('✅ Anuncio eliminado');
        } else {
            // Si no encuentra, recargar toda la lista
            console.log('Recargando lista...');
            location.reload();
        }
        
    } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar el anuncio');
    }
}

// --- INICIO: LISTENER DE ELIMINACIÓN CORREGIDO (AGENTE 11) ---

document.addEventListener('click', function(e) {
    // Verificamos si el elemento clickeado o uno de sus padres es un botón de borrar.
    // Esto es más robusto si el botón tiene un icono &lt;i&gt; adentro.
    const deleteButton = e.target.closest('.delete-btn');

    if (deleteButton) {
        // --- LA CORRECCIÓN ESTÁ AQUÍ ---
        // Leemos el dataset "adId" que corresponde al atributo "data-ad-id".
        const adId = deleteButton.dataset.adId; 

        if (adId) {
            console.log(`Agente 11: Botón de borrar clickeado. ID a eliminar: ${adId}`);
            deleteAd(adId);
        } else {
            // Este log nos ayudará a confirmar si el ID sigue faltando en el botón.
            console.error('Agente 11: Error - Se hizo clic en un botón de borrar, pero no se encontró el atributo "data-ad-id". Verifica cómo se genera el botón en el HTML.');
        }
    }
});

// --- FIN: LISTENER DE ELIMINACIÓN CORREGIDO ---
}
