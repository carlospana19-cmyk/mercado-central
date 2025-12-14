import { supabase } from './supabase-client.js';
import { checkUserLoggedIn } from './auth-logic.js';

export function setupDashboard() {
  // Llama a la función que ya existe para inicializar el dashboard
  if (typeof initializeDashboardPage === 'function') {
    initializeDashboardPage();
  }
  console.log('Dashboard cargado correctamente.');
}

export async function initializeDashboardPage() {
    checkUserLoggedIn();
    const container = document.querySelector('#my-ads-container');
    if (!container) { return; }

    
    
    // 1. PEDIMOS LOS NUEVOS CAMPOS A SUPABASE
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        console.error('No se pudo obtener el usuario.', userError);
        container.innerHTML = '<p>Error de autenticación. Por favor, inicia sesión de nuevo.</p>';
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

        // ✅ BADGE VENDIDO - mostrar si is_sold es true
        const soldBadge = ad.is_sold ? `<div class="badge-sold">VENDIDO</div>` : '';

        // 3. INTEGRAMOS LOS DETALLES EN LA TARJETA
        return `
            <div class="dashboard-card ${ad.is_sold ? 'card-sold' : ''}" data-ad-id="${ad.id}">
                ${soldBadge}
                <img src="${ad.url_portada || 'images/placeholder.jpg'}" alt="${ad.titulo}" class="dashboard-ad-image ${ad.is_sold ? 'image-sold' : ''}">
                <div class="dashboard-ad-info">
            
                    <div class="dashboard-ad-title">
                        <h3>${ad.titulo}</h3>
                    </div>
                    <div class="dashboard-ad-price">
                        ${ad.precio ? `$${ad.precio.toLocaleString('es-PA')}` : 'Precio a convenir'}
                    </div>
                    ${vehicleDetailsHTML} 
                </div>
            <div class="dashboard-ad-actions">
                <a href="editar-anuncio.html?id=${ad.id}" class="btn-edit">Editar</a>
                <button class="btn-sold toggle-sold-btn" data-ad-id="${ad.id}">${ad.is_sold ? 'Reactivar' : 'Marcar Vendido'}</button>
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
            
            deleteAd(adId);
        } else {
            // Este log nos ayudará a confirmar si el ID sigue faltando en el botón.
            
        }
    }

    // ✅ LISTENER PARA MARCAR COMO VENDIDO
    const toggleSoldButton = e.target.closest('.toggle-sold-btn');
    if (toggleSoldButton) {
        const adId = toggleSoldButton.dataset.adId;
        if (adId) {
            toggleSoldStatus(adId);
        }
    }
});

// --- FIN: LISTENER DE ELIMINACIÓN CORREGIDO ---

// ✅ FUNCIÓN PARA MARCAR/DESMARCAR COMO VENDIDO
async function toggleSoldStatus(adId) {
    try {
        // 1. OBTENER ESTADO ACTUAL DEL ANUNCIO
        const { data: ad, error: fetchError } = await supabase
            .from('anuncios')
            .select('is_sold')
            .eq('id', adId)
            .single();

        if (fetchError) {
            // Si el error es porque la columna no existe, mostrar instrucciones
            if (fetchError.code === '42703') {
                alert('⚠️ Columna is_sold no existe.\n\n1. Ve a https://app.supabase.com\n2. En tu proyecto, ve a SQL Editor\n3. Ejecuta esta consulta:\n\nALTER TABLE anuncios ADD COLUMN is_sold BOOLEAN DEFAULT FALSE;\n\n4. Recarga esta página');
                return;
            }
            console.error('Error al obtener estado:', fetchError);
            alert('Error al obtener el estado del anuncio');
            return;
        }

        // 2. ACTUALIZAR EL ESTADO OPUESTO
        const newStatus = !ad.is_sold;
        const { error: updateError } = await supabase
            .from('anuncios')
            .update({ is_sold: newStatus })
            .eq('id', adId);

        if (updateError) {
            console.error('Error al actualizar:', updateError);
            alert('Error al actualizar el estado del anuncio');
            return;
        }

        // 3. ACTUALIZAR LA INTERFAZ
        const cardElement = document.querySelector(`[data-ad-id="${adId}"]`);
        const button = cardElement.querySelector('.toggle-sold-btn');
        
        if (newStatus) {
            // Marcar como vendido
            cardElement.classList.add('card-sold');
            cardElement.classList.remove('card-active');
            button.textContent = 'Reactivar';
            button.classList.add('btn-reactivate');
            
            // Agregar badge si no existe
            if (!cardElement.querySelector('.badge-sold')) {
                const badge = document.createElement('div');
                badge.className = 'badge-sold';
                badge.textContent = 'VENDIDO';
                cardElement.insertBefore(badge, cardElement.firstChild);
            }
            
            // Agregar filtro a la imagen
            const img = cardElement.querySelector('.dashboard-ad-image');
            if (img) img.classList.add('image-sold');
            
            console.log('✅ Anuncio marcado como vendido');
        } else {
            // Reactivar anuncio
            cardElement.classList.remove('card-sold');
            cardElement.classList.add('card-active');
            button.textContent = 'Marcar Vendido';
            button.classList.remove('btn-reactivate');
            
            // Remover badge
            const badge = cardElement.querySelector('.badge-sold');
            if (badge) badge.remove();
            
            // Remover filtro de la imagen
            const img = cardElement.querySelector('.dashboard-ad-image');
            if (img) img.classList.remove('image-sold');
            
            console.log('✅ Anuncio reactivado');
        }
    } catch (error) {
        console.error('Error inesperado:', error);
        alert('Error al procesar la solicitud');
    }
}
}

async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error al cerrar sesión:', error);
    } else {
        window.location.href = 'index.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('btn-logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
});
