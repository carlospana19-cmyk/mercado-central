import { supabase } from './supabase-client.js';
import { checkUserLoggedIn } from './auth-logic.js';
import {
    getSellerReviews,
    getSellerReviewStats,
    generateReviewStatsHTML,
    generateReviewHTML,
    ReviewModal
} from './reviews-logic.js';

let currentUserId = null;
let currentFilter = 'todos';

// Al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    checkUserLoggedIn();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUserId = user.id;

    // Cargar datos iniciales
    await loadUserProfile();
    await loadUserAds();
    
    // Inicializar event listeners
    initializeEventListeners();
    
    // Cargar opciones de ubicación
    await loadLocationOptions();
});

// ========================================
// CARGAR PERFIL DEL USUARIO
// ========================================
async function loadUserProfile() {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUserId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error al cargar perfil:', error);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        document.getElementById('email').value = user.email || '';
        document.getElementById('email-value').textContent = user.email || '';

        if (profile) {
            // Header del perfil
            document.getElementById('header-full-name').textContent = profile.nombre_completo || 'Usuario';
            document.getElementById('header-business-name').textContent = profile.nombre_negocio || 'Cuenta Personal';
            document.getElementById('phone-value').textContent = profile.telefono || '-';
            document.getElementById('whatsapp-value').textContent = profile.whatsapp || '-';

            // Formulario
            document.getElementById('full-name').value = profile.nombre_completo || '';
            document.getElementById('phone').value = profile.telefono || '';
            document.getElementById('whatsapp').value = profile.whatsapp || '';
            document.getElementById('business-name').value = profile.nombre_negocio || '';
            document.getElementById('business-type').value = profile.tipo_negocio || '';
            document.getElementById('description').value = profile.descripcion || '';
            document.getElementById('location-province').value = profile.provincia || '';
            document.getElementById('location-address').value = profile.direccion || '';

            if (profile.url_foto_perfil) {
                document.getElementById('profile-photo-header').src = profile.url_foto_perfil;
            }

            if (profile.provincia) {
                await updateDistricts(profile.provincia);
                document.getElementById('location-district').value = profile.distrito || '';
            }

            updateCharCounts();
        }
    } catch (err) {
        console.error('Error en loadUserProfile:', err);
    }
}

// ========================================
// CARGAR ANUNCIOS DEL USUARIO
// ========================================
async function loadUserAds() {
    try {
        const { data: ads, error } = await supabase
            .from('anuncios')
            .select('*, imagenes(url_imagen), profiles(url_foto_perfil, nombre_negocio)')
            .eq('user_id', currentUserId);

        if (error) {
            console.error('Error al cargar anuncios:', error);
            document.getElementById('my-ads-container').innerHTML = '<p class="error-message">Error al cargar los anuncios.</p>';
            return;
        }

        // Actualizar estadísticas
        const totalAds = ads.length;
        const activeAds = ads.filter(ad => !ad.is_sold).length;
        const soldAds = ads.filter(ad => ad.is_sold).length;

        document.getElementById('total-ads').textContent = totalAds;
        document.getElementById('active-ads').textContent = activeAds;
        document.getElementById('sold-ads').textContent = soldAds;

        if (ads.length === 0) {
            document.getElementById('my-ads-container').innerHTML = '<p class="no-ads-message">No tienes anuncios aún. <a href="publicar.html">¡Crea uno!</a></p>';
            return;
        }

        renderAds(ads);
    } catch (err) {
        console.error('Error en loadUserAds:', err);
    }
}

// ========================================
// RENDERIZAR ANUNCIOS
// ========================================
function renderAds(ads) {
    const container = document.getElementById('my-ads-container');
    
    const filteredAds = ads.filter(ad => {
        if (currentFilter === 'activos') return !ad.is_sold;
        if (currentFilter === 'vendidos') return ad.is_sold;
        return true;
    });

    if (filteredAds.length === 0) {
        container.innerHTML = '<p class="no-ads-message">No hay anuncios en esta categoría.</p>';
        return;
    }

    container.innerHTML = filteredAds.map(ad => {
        const imageUrl = ad.imagenes && ad.imagenes.length > 0 
            ? ad.imagenes[0].url_imagen 
            : ad.url_portada || 'images/placeholder.jpg';

        const soldBadge = ad.is_sold ? '<div class="badge-sold">VENDIDO</div>' : '';
        const soldClass = ad.is_sold ? 'card-sold' : '';

        return `
            <div class="dashboard-card unified-card ${soldClass}" data-ad-id="${ad.id}">
                ${soldBadge}
                <a href="detalle-producto.html?id=${ad.id}" class="card-image-link">
                    <img src="${imageUrl}" alt="${ad.titulo}" class="dashboard-ad-image ${ad.is_sold ? 'image-sold' : ''}">
                </a>
                <div class="dashboard-ad-info">
                    <a href="detalle-producto.html?id=${ad.id}" class="card-title-link">
                        <div class="dashboard-ad-title">
                            <h3>${ad.titulo}</h3>
                        </div>
                    </a>
                    <div class="dashboard-ad-price">
                        ${ad.precio ? `$${ad.precio.toLocaleString('es-PA')}` : 'Precio a convenir'}
                    </div>
                    <div class="dashboard-ad-category">
                        <i class="fas fa-tag"></i> ${ad.categoria || 'Sin categoría'}
                    </div>
                </div>
                <div class="dashboard-ad-actions">
                    <a href="detalle-producto.html?id=${ad.id}" class="btn-view" title="Ver anuncio">
                        <i class="fas fa-eye"></i> Ver
                    </a>
                    <a href="editar-anuncio.html?id=${ad.id}" class="btn-edit" title="Editar anuncio">
                        <i class="fas fa-edit"></i> Editar
                    </a>
                    <button class="btn-sold toggle-sold-btn" data-ad-id="${ad.id}" title="${ad.is_sold ? 'Reactivar anuncio' : 'Marcar como vendido'}">
                        <i class="fas fa-${ad.is_sold ? 'redo' : 'check'}"></i> ${ad.is_sold ? 'Reactivar' : 'Vendido'}
                    </button>
                    <button class="btn-delete delete-btn" data-ad-id="${ad.id}" title="Eliminar anuncio">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // ✅ FIJAR: Usar event delegation en lugar de listeners duplicados
    const adsContainer = document.getElementById('my-ads-container');
    
    if (adsContainer._adButtonListener) {
        adsContainer.removeEventListener('click', adsContainer._adButtonListener);
    }
    
    adsContainer._adButtonListener = (e) => {
        const toggleBtn = e.target.closest('.toggle-sold-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        
        if (toggleBtn) {
            toggleSoldStatus(toggleBtn.dataset.adId);
        } else if (deleteBtn) {
            deleteAd(deleteBtn.dataset.adId);
        }
    };
    
    adsContainer.addEventListener('click', adsContainer._adButtonListener);
}

// ========================================
// TOGGLE SOLD STATUS
// ========================================
async function toggleSoldStatus(adId) {
    try {
        const btn = document.querySelector(`[data-ad-id="${adId}"].toggle-sold-btn`);
        const card = document.querySelector(`[data-ad-id="${adId}"].unified-card`);
        
        const { data: ad, error: fetchError } = await supabase
            .from('anuncios')
            .select('is_sold')
            .eq('id', adId)
            .single();

        if (fetchError) throw fetchError;

        const newStatus = !ad.is_sold;
        const { error: updateError } = await supabase
            .from('anuncios')
            .update({ is_sold: newStatus })
            .eq('id', adId);

        if (updateError) throw updateError;

        // Actualizar UI
        btn.textContent = newStatus ? '✓ Reactivar' : '✓ Vendido';
        if (newStatus) {
            card.classList.add('card-sold');
        } else {
            card.classList.remove('card-sold');
        }

        // Recargar datos
        await loadUserAds();
    } catch (err) {
        console.error('Error al cambiar estado de venta:', err);
        alert('Error al actualizar el estado del anuncio');
    }
}

// ========================================
// ELIMINAR ANUNCIO
// ========================================
async function deleteAd(adId) {
    if (!confirm('¿Estás seguro de eliminar este anuncio? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('anuncios')
            .delete()
            .eq('id', adId);

        if (error) throw error;

        await loadUserAds();
    } catch (err) {
        console.error('Error al eliminar anuncio:', err);
        alert('Error al eliminar el anuncio');
    }
}

// ========================================
// MANEJO DE FOTO DE PERFIL
// ========================================
async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen válida');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe pesar más de 5MB');
        return;
    }

    try {
        const uploadBtn = document.getElementById('upload-photo-btn');
        uploadBtn.disabled = true;

        const fileName = `${currentUserId}/profile-${Date.now()}.${file.type.split('/')[1]}`;

        const { error: uploadError } = await supabase.storage
            .from('imagenes_anuncios')
            .upload(fileName, file);

        if (uploadError) {
            alert('Error al subir la foto. Intenta de nuevo.');
            uploadBtn.disabled = false;
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('imagenes_anuncios')
            .getPublicUrl(fileName);

        const { error: dbError } = await supabase
            .from('profiles')
            .upsert({
                id: currentUserId,
                url_foto_perfil: publicUrl
            });

        if (dbError) throw dbError;

        document.getElementById('profile-photo-header').src = publicUrl;
        uploadBtn.disabled = false;
    } catch (err) {
        console.error('Error en handlePhotoUpload:', err);
        alert('Error al procesar la foto');
    }
}

// ========================================
// GUARDAR PERFIL
// ========================================
async function saveProfile(e) {
    e.preventDefault();

    try {
        const profileData = {
            id: currentUserId,
            nombre_completo: document.getElementById('full-name').value,
            telefono: document.getElementById('phone').value,
            whatsapp: document.getElementById('whatsapp').value,
            nombre_negocio: document.getElementById('business-name').value,
            tipo_negocio: document.getElementById('business-type').value,
            descripcion: document.getElementById('description').value,
            provincia: document.getElementById('location-province').value,
            distrito: document.getElementById('location-district').value,
            direccion: document.getElementById('location-address').value
        };

        const { error } = await supabase
            .from('profiles')
            .upsert(profileData);

        if (error) throw error;

        alert('¡Perfil guardado correctamente!');
        await loadUserProfile();
    } catch (err) {
        console.error('Error al guardar perfil:', err);
        alert('Error al guardar los cambios');
    }
}

// ========================================
// ACTUALIZAR CONTADORES DE CARACTERES
// ========================================
function updateCharCounts() {
    const fields = [
        { id: 'full-name', max: 100 },
        { id: 'phone', max: 20 },
        { id: 'whatsapp', max: 20 },
        { id: 'business-name', max: 100 },
        { id: 'description', max: 500 },
        { id: 'location-address', max: 150 }
    ];

    fields.forEach(field => {
        const input = document.getElementById(field.id);
        if (input) {
            const count = input.value.length;
            const countEl = document.getElementById(`${field.id}-count`);
            if (countEl) {
                countEl.textContent = count;
            }
        }
    });
}

// ========================================
// CARGAR OPCIONES DE UBICACIÓN
// ========================================
async function loadLocationOptions() {
    try {
        const { data: provinces, error } = await supabase
            .from('provincias')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) {
            console.error('Error al cargar provincias:', error);
            return;
        }

        const provinceSelect = document.getElementById('location-province');
        provinceSelect.innerHTML = '<option value="">Selecciona provincia</option>';
        
        provinces.forEach(prov => {
            const option = document.createElement('option');
            option.value = prov.nombre;
            option.textContent = prov.nombre;
            provinceSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Error en loadLocationOptions:', err);
    }
}

// ========================================
// ACTUALIZAR DISTRITOS
// ========================================
async function updateDistricts(province) {
    try {
        const { data: districts, error } = await supabase
            .from('distritos')
            .select('*')
            .eq('provincia', province)
            .order('nombre', { ascending: true });

        if (error) {
            console.error('Error al cargar distritos:', error);
            return;
        }

        const districtSelect = document.getElementById('location-district');
        districtSelect.innerHTML = '<option value="">Selecciona distrito</option>';
        
        districts.forEach(dist => {
            const option = document.createElement('option');
            option.value = dist.nombre;
            option.textContent = dist.nombre;
            districtSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Error en updateDistricts:', err);
    }
}

// ========================================
// INICIALIZAR EVENT LISTENERS
// ========================================
function initializeEventListeners() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Filtros de anuncios
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            loadUserAds();
        });
    });

    // Upload foto
    document.getElementById('upload-photo-btn').addEventListener('click', () => {
        document.getElementById('profile-photo-input').click();
    });

    document.getElementById('profile-photo-input').addEventListener('change', handlePhotoUpload);

    // Contador de caracteres
    const fields = ['full-name', 'phone', 'whatsapp', 'business-name', 'description', 'location-address'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', updateCharCounts);
        }
    });

    // Cambio de provincia
    document.getElementById('location-province').addEventListener('change', async (e) => {
        if (e.target.value) {
            await updateDistricts(e.target.value);
        }
    });

    // Envío del formulario de perfil
    document.getElementById('profile-form').addEventListener('submit', saveProfile);

    // Logout
    document.getElementById('btn-logout').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });

    // Reviews subtabs
    document.querySelectorAll('.subtab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchSubtab(btn.dataset.subtab));
    });
}

// ========================================
// FUNCIONES DE RESEÑAS
// ========================================

// Cargar reseñas cuando se abre el tab de reseñas
async function loadReviewsTab() {
    await loadReceivedReviews();
    await loadGivenReviews();
}

// Cargar reseñas recibidas (como vendedor)
async function loadReceivedReviews() {
    try {
        const statsContainer = document.getElementById('seller-stats');
        const reviewsContainer = document.getElementById('received-reviews-list');

        // Cargar estadísticas del vendedor
        const stats = await getSellerReviewStats(currentUserId);
        statsContainer.innerHTML = generateReviewStatsHTML(stats);

        // Cargar reseñas recibidas
        const reviews = await getSellerReviews(currentUserId);

        if (reviews.length === 0) {
            reviewsContainer.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-star-half-alt"></i>
                    <p>Aún no has recibido reseñas.</p>
                    <p>¡Cuando vendas productos, tus compradores podrán dejarte reseñas!</p>
                </div>
            `;
        } else {
            reviewsContainer.innerHTML = `
                <div class="reviews-list">
                    ${reviews.map(review => generateReviewHTML(review)).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando reseñas recibidas:', error);
        document.getElementById('received-reviews-list').innerHTML =
            '<p class="error-message">Error al cargar las reseñas. Intenta recargar la página.</p>';
    }
}

// Cargar reseñas dadas (como comprador)
async function loadGivenReviews() {
    try {
        const reviewsContainer = document.getElementById('given-reviews-list');

        // Obtener reseñas que el usuario ha dado
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select(`
                *,
                seller:seller_id (
                    id,
                    nombre_negocio
                )
            `)
            .eq('reviewer_id', currentUserId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (reviews.length === 0) {
            reviewsContainer.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-paper-plane"></i>
                    <p>Aún no has dado reseñas.</p>
                    <p>¡Cuando compres productos, podrás calificar a los vendedores!</p>
                </div>
            `;
        } else {
            // Adaptar el formato para mostrar reseñas dadas
            const formattedReviews = reviews.map(review => ({
                ...review,
                reviewer: {
                    nombre_negocio: 'Tú', // El usuario actual
                    url_foto_perfil: null
                }
            }));

            reviewsContainer.innerHTML = `
                <div class="reviews-list">
                    ${formattedReviews.map(review => `
                        <div class="review-item" data-review-id="${review.id}">
                            <div class="review-header">
                                <div class="reviewer-info">
                                    <div class="reviewer-avatar">
                                        <i class="fas fa-user"></i>
                                    </div>
                                    <div class="reviewer-details">
                                        <div class="reviewer-name">Tú</div>
                                        <div class="review-date">${new Date(review.created_at).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}</div>
                                    </div>
                                </div>
                                <div class="review-rating">
                                    ${Array.from({ length: 5 }, (_, i) =>
                                        `<i class="${i < review.rating ? 'fas' : 'far'} fa-star"></i>`
                                    ).join('')}
                                </div>
                            </div>
                            <div class="review-to-info" style="margin-bottom: 10px; font-size: 0.9em; color: #666;">
                                <i class="fas fa-arrow-right"></i> Para: ${review.seller?.nombre_negocio || 'Vendedor'}
                            </div>
                            ${review.comment ? `<div class="review-comment">${review.comment}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando reseñas dadas:', error);
        document.getElementById('given-reviews-list').innerHTML =
            '<p class="error-message">Error al cargar las reseñas. Intenta recargar la página.</p>';
    }
}

// ========================================
// SWITCH ENTRE TABS
// ========================================
function switchTab(tabName) {
    // Actualizar botones activos
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Actualizar contenido
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Cargar contenido específico del tab
    if (tabName === 'reviews') {
        loadReviewsTab();
    }
}

// ========================================
// SWITCH ENTRE SUBTABS (RESEÑAS)
// ========================================
function switchSubtab(subtabName) {
    // Actualizar botones activos
    document.querySelectorAll('.subtab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-subtab="${subtabName}"]`).classList.add('active');

    // Actualizar contenido
    document.querySelectorAll('.subtab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${subtabName}-reviews`).classList.add('active');
}
