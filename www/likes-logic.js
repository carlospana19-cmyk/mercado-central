// likes-logic.js - Sistema de Likes para Mercado Central
// Gestión de likes en tarjetas de productos

import { supabase } from './supabase-client.js';

// =================================================
// FUNCIONES PARA INTERACTUAR CON LA BASE DE DATOS
// =================================================

// Verificar si un usuario dio like a un anuncio
export async function hasUserLikedAnuncio(anuncioId) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data, error } = await supabase
            .rpc('has_user_liked_anuncio', {
                user_uuid: user.id,
                anuncio_uuid: anuncioId
            });

        if (error) throw error;
        return data || false;
    } catch (error) {
        console.error('Error verificando like:', error);
        return false;
    }
}

// Obtener el conteo de likes de un anuncio
export async function getAnuncioLikesCount(anuncioId) {
    try {
        const { data, error } = await supabase
            .rpc('get_anuncio_likes_count', { anuncio_uuid: anuncioId });

        if (error) throw error;
        return data || 0;
    } catch (error) {
        console.error('Error obteniendo conteo de likes:', error);
        return 0;
    }
}

// Dar/quitar like (toggle)
export async function toggleLike(anuncioId) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { data, error } = await supabase
            .rpc('toggle_like', {
                user_uuid: user.id,
                anuncio_uuid: anuncioId
            });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error toggling like:', error);
        throw error;
    }
}

// =================================================
// FUNCIONES DE RENDERIZADO HTML
// =================================================

// Generar HTML para el botón de like
export function generateLikeButtonHTML(anuncioId, likesCount, userLiked) {
    const heartClass = userLiked ? 'fas fa-heart' : 'far fa-heart';
    const buttonClass = userLiked ? 'like-btn liked' : 'like-btn';

    return `
        <button class="${buttonClass}"
                data-anuncio-id="${anuncioId}"
                data-liked="${userLiked}"
                title="${userLiked ? 'Quitar me gusta' : 'Dar me gusta'}">
            <i class="${heartClass}"></i>
            <span class="likes-count">${likesCount}</span>
        </button>
    `;
}

// =================================================
// FUNCIONES DE UTILIDAD
// =================================================

// Inicializar likes en una tarjeta específica
export async function initializeCardLikes(cardElement) {
    console.log('Inicializando likes en tarjeta específica...');
    const likeBtn = cardElement.querySelector('.like-btn');
    if (!likeBtn) {
        console.log('No se encontró botón de like en la tarjeta');
        return;
    }

    const anuncioId = likeBtn.dataset.anuncioId;
    if (!anuncioId) {
        console.log('No se encontró anuncioId en el botón de like');
        return;
    }

    console.log(`Inicializando likes para anuncio ${anuncioId}`);

    // Agregar event listener inmediatamente
    if (!likeBtn.dataset.listenerAdded) {
        console.log('Agregando event listener al botón de like');
        likeBtn.addEventListener('click', async (e) => {
            console.log('Click detectado en botón de like');
            e.preventDefault();
            e.stopPropagation();

            try {
                console.log('Ejecutando toggleLike...');
                const result = await toggleLike(anuncioId);
                console.log('Resultado del toggle:', result);
                updateLikeButton(likeBtn, result.likes_count, result.liked);

                // Animación de feedback
                animateLikeButton(likeBtn, result.action);

            } catch (error) {
                console.error('Error al toggle like:', error);
                // Mostrar notificación de error
                showLikeError(likeBtn);
            }
        });

        likeBtn.dataset.listenerAdded = 'true';
        console.log('Event listener agregado correctamente');
    } else {
        console.log('Event listener ya estaba agregado');
    }

    // Intentar actualizar el estado inicial (sin bloquear si falla)
    try {
        console.log('Obteniendo estado inicial del like...');
        const [userLiked, likesCount] = await Promise.all([
            hasUserLikedAnuncio(anuncioId),
            getAnuncioLikesCount(anuncioId)
        ]);
        console.log(`Estado inicial - liked: ${userLiked}, count: ${likesCount}`);
        updateLikeButton(likeBtn, likesCount, userLiked);
    } catch (error) {
        console.warn('No se pudo obtener estado inicial del like:', error.message);
        // Dejar el botón con valores por defecto
    }

    try {
        // Obtener estado actual del like y conteo
        const [userLiked, likesCount] = await Promise.all([
            hasUserLikedAnuncio(anuncioId),
            getAnuncioLikesCount(anuncioId)
        ]);

        // Actualizar el botón
        updateLikeButton(likeBtn, likesCount, userLiked);

        // Agregar event listener si no existe
        if (!likeBtn.dataset.listenerAdded) {
            likeBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                try {
                    const result = await toggleLike(anuncioId);
                    updateLikeButton(likeBtn, result.likes_count, result.liked);

                    // Animación de feedback
                    animateLikeButton(likeBtn, result.action);

                } catch (error) {
                    console.error('Error al toggle like:', error);
                    // Mostrar notificación de error
                    showLikeError(likeBtn);
                }
            });

            likeBtn.dataset.listenerAdded = 'true';
        }

    } catch (error) {
        console.error('Error inicializando likes:', error);
    }
}

// Actualizar apariencia del botón de like
function updateLikeButton(button, likesCount, userLiked) {
    const icon = button.querySelector('i');
    const countSpan = button.querySelector('.likes-count');

    if (userLiked) {
        button.classList.add('liked');
        button.classList.remove('not-liked');
        icon.className = 'fas fa-heart';
        button.dataset.liked = 'true';
    } else {
        button.classList.add('not-liked');
        button.classList.remove('liked');
        icon.className = 'far fa-heart';
        button.dataset.liked = 'false';
    }

    if (countSpan) {
        countSpan.textContent = likesCount;
    }

    button.title = userLiked ? 'Quitar me gusta' : 'Dar me gusta';
}

// Animación del botón de like
function animateLikeButton(button, action) {
    const icon = button.querySelector('i');

    if (action === 'added') {
        // Animación de like agregado
        icon.style.transform = 'scale(1.3)';
        icon.style.color = '#e74c3c';
        setTimeout(() => {
            icon.style.transform = 'scale(1)';
            icon.style.color = '';
        }, 200);
    } else if (action === 'removed') {
        // Animación sutil de like removido
        icon.style.transform = 'scale(0.8)';
        setTimeout(() => {
            icon.style.transform = 'scale(1)';
        }, 100);
    }
}

// Mostrar error en el botón de like
function showLikeError(button) {
    const originalTitle = button.title;
    button.title = 'Error - intenta de nuevo';
    button.style.opacity = '0.6';

    setTimeout(() => {
        button.title = originalTitle;
        button.style.opacity = '';
    }, 2000);
}

// =================================================
// INICIALIZACIÓN GLOBAL
// =================================================

// Inicializar likes en todas las tarjetas visibles
export function initializeAllCardLikes() {
    console.log('Buscando tarjetas para inicializar likes...');
    const cards = document.querySelectorAll('.property-card, .card');
    console.log(`Encontradas ${cards.length} tarjetas`);

    cards.forEach((card, index) => {
        console.log(`Inicializando likes en tarjeta ${index + 1}`);
        initializeCardLikes(card);
    });
}

// Observer para nuevas tarjetas (lazy loading, etc.)
export function setupLikesObserver() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Si es una tarjeta
                    if (node.classList && (node.classList.contains('property-card') || node.classList.contains('card'))) {
                        initializeCardLikes(node);
                    }

                    // Si contiene tarjetas
                    const cards = node.querySelectorAll('.property-card, .card');
                    cards.forEach(card => initializeCardLikes(card));
                }
            });
        });
    });

    // Observar cambios en el contenedor de resultados
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
        observer.observe(resultsContainer, {
            childList: true,
            subtree: true
        });
    }
}