// reviews-logic.js - Sistema de reseñas y calificaciones
// Mercado Central

import { supabase } from './supabase-client.js';

// =================================================
// COMPONENTE DE ESTRELLAS INTERACTIVAS
// =================================================

export class StarRating {
    constructor(container, options = {}) {
        this.container = container;
        this.maxStars = options.maxStars || 5;
        this.readOnly = options.readOnly || false;
        this.currentRating = options.currentRating || 0;
        this.onRatingChange = options.onRatingChange || null;

        this.init();
    }

    init() {
        this.render();
        if (!this.readOnly) {
            this.bindEvents();
        }
    }

    render() {
        const starsHtml = Array.from({ length: this.maxStars }, (_, i) => {
            const starNumber = i + 1;
            const isActive = starNumber <= this.currentRating;
            return `
                <span class="star ${isActive ? 'active' : ''}" data-rating="${starNumber}">
                    <i class="fas fa-star"></i>
                </span>
            `;
        }).join('');

        this.container.innerHTML = `
            <div class="star-rating ${this.readOnly ? 'readonly' : 'interactive'}">
                ${starsHtml}
                ${!this.readOnly ? '<span class="rating-text">Haz clic para calificar</span>' : ''}
            </div>
        `;

        this.stars = this.container.querySelectorAll('.star');
    }

    bindEvents() {
        this.stars.forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(star.dataset.rating);
                this.setRating(rating);
                if (this.onRatingChange) {
                    this.onRatingChange(rating);
                }
            });

            star.addEventListener('mouseenter', (e) => {
                const rating = parseInt(star.dataset.rating);
                this.highlightStars(rating);
            });
        });

        this.container.addEventListener('mouseleave', () => {
            this.highlightStars(this.currentRating);
        });
    }

    setRating(rating) {
        this.currentRating = rating;
        this.highlightStars(rating);
        this.updateRatingText();
    }

    highlightStars(rating) {
        this.stars.forEach((star, index) => {
            const starRating = index + 1;
            star.classList.toggle('active', starRating <= rating);
        });
    }

    updateRatingText() {
        const textElement = this.container.querySelector('.rating-text');
        if (textElement) {
            const texts = {
                0: 'Haz clic para calificar',
                1: 'Muy malo',
                2: 'Malo',
                3: 'Regular',
                4: 'Bueno',
                5: 'Excelente'
            };
            textElement.textContent = texts[this.currentRating] || '';
        }
    }

    getRating() {
        return this.currentRating;
    }
}

// =================================================
// FUNCIONES PARA INTERACTUAR CON LA BASE DE DATOS
// =================================================

// Obtener reseñas de un vendedor
export async function getSellerReviews(sellerId) {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                reviewer:reviewer_id (
                    id,
                    nombre_negocio,
                    url_foto_perfil
                )
            `)
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error obteniendo reseñas:', error);
        return [];
    }
}

// Obtener estadísticas de reseñas de un vendedor
export async function getSellerReviewStats(sellerId) {
    try {
        const { data, error } = await supabase
            .rpc('get_seller_review_stats', { seller_uuid: sellerId });

        if (error) throw error;
        return data[0] || {
            total_reviews: 0,
            average_rating: 0,
            rating_5_stars: 0,
            rating_4_stars: 0,
            rating_3_stars: 0,
            rating_2_stars: 0,
            rating_1_star: 0
        };
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return {
            total_reviews: 0,
            average_rating: 0,
            rating_5_stars: 0,
            rating_4_stars: 0,
            rating_3_stars: 0,
            rating_2_stars: 0,
            rating_1_star: 0
        };
    }
}

// Verificar si el usuario ya reseñó a un vendedor
export async function hasUserReviewedSeller(sellerId) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data, error } = await supabase
            .rpc('has_user_reviewed_seller', {
                reviewer_uuid: user.id,
                seller_uuid: sellerId
            });

        if (error) throw error;
        return data || false;
    } catch (error) {
        console.error('Error verificando reseña existente:', error);
        return false;
    }
}

// Crear una nueva reseña
export async function createReview(sellerId, rating, comment) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        // Verificar que no haya reseña previa
        const alreadyReviewed = await hasUserReviewedSeller(sellerId);
        if (alreadyReviewed) {
            throw new Error('Ya has reseñado a este vendedor');
        }

        const { data, error } = await supabase
            .from('reviews')
            .insert({
                reviewer_id: user.id,
                seller_id: sellerId,
                rating: rating,
                comment: comment?.trim() || null
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creando reseña:', error);
        throw error;
    }
}

// =================================================
// FUNCIONES DE RENDERIZADO HTML
// =================================================

// Generar HTML para mostrar estadísticas de reseñas
export function generateReviewStatsHTML(stats) {
    if (!stats || stats.total_reviews === 0) {
        return `
            <div class="review-stats empty">
                <div class="average-rating">
                    <div class="rating-number">0.0</div>
                    <div class="stars">
                        ${Array.from({ length: 5 }, () => '<i class="far fa-star"></i>').join('')}
                    </div>
                    <div class="total-reviews">Sin reseñas</div>
                </div>
            </div>
        `;
    }

    const fullStars = Math.floor(stats.average_rating);
    const hasHalfStar = stats.average_rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const starsHtml = [
        ...Array.from({ length: fullStars }, () => '<i class="fas fa-star"></i>'),
        ...(hasHalfStar ? ['<i class="fas fa-star-half-alt"></i>'] : []),
        ...Array.from({ length: emptyStars }, () => '<i class="far fa-star"></i>')
    ].join('');

    return `
        <div class="review-stats">
            <div class="average-rating">
                <div class="rating-number">${stats.average_rating.toFixed(1)}</div>
                <div class="stars">${starsHtml}</div>
                <div class="total-reviews">${stats.total_reviews} reseña${stats.total_reviews !== 1 ? 's' : ''}</div>
            </div>
            <div class="rating-breakdown">
                ${[5, 4, 3, 2, 1].map(stars => `
                    <div class="rating-bar">
                        <span class="star-count">${stars}</span>
                        <i class="fas fa-star"></i>
                        <div class="bar">
                            <div class="fill" style="width: ${stats.total_reviews > 0 ? (stats[`rating_${stars}_stars`] / stats.total_reviews * 100) : 0}%"></div>
                        </div>
                        <span class="count">${stats[`rating_${stars}_stars`]}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Generar HTML para una reseña individual
export function generateReviewHTML(review) {
    const date = new Date(review.created_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const starsHtml = Array.from({ length: 5 }, (_, i) =>
        `<i class="${i < review.rating ? 'fas' : 'far'} fa-star"></i>`
    ).join('');

    return `
        <div class="review-item" data-review-id="${review.id}">
            <div class="review-header">
                <div class="reviewer-info">
                    <img src="${review.reviewer?.url_foto_perfil || '/default-avatar.png'}"
                         alt="${review.reviewer?.nombre_negocio || 'Usuario'}"
                         class="reviewer-avatar">
                    <div class="reviewer-details">
                        <div class="reviewer-name">${review.reviewer?.nombre_negocio || 'Usuario'}</div>
                        <div class="review-date">${date}</div>
                    </div>
                </div>
                <div class="review-rating">
                    ${starsHtml}
                </div>
            </div>
            ${review.comment ? `<div class="review-comment">${review.comment}</div>` : ''}
        </div>
    `;
}

// =================================================
// MODAL PARA CREAR RESEÑAS
// =================================================

export class ReviewModal {
    constructor(sellerId, sellerName, onReviewSubmitted = null) {
        this.sellerId = sellerId;
        this.sellerName = sellerName;
        this.onReviewSubmitted = onReviewSubmitted;
        this.starRating = null;
        this.init();
    }

    init() {
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        const modalHtml = `
            <div class="review-modal-overlay" id="review-modal">
                <div class="review-modal">
                    <div class="modal-header">
                        <h3>Calificar a ${this.sellerName}</h3>
                        <button class="modal-close" id="review-modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="rating-section">
                            <label>Tu calificación:</label>
                            <div class="star-rating-container" id="modal-star-rating"></div>
                        </div>
                        <div class="comment-section">
                            <label for="review-comment">Comentario (opcional):</label>
                            <textarea
                                id="review-comment"
                                placeholder="Comparte tu experiencia con este vendedor..."
                                maxlength="500"
                                rows="4"
                            ></textarea>
                            <div class="char-counter">
                                <span id="char-count">0</span>/500 caracteres
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" id="review-cancel">Cancelar</button>
                        <button class="btn-primary" id="review-submit" disabled>
                            <i class="fas fa-paper-plane"></i>
                            Enviar reseña
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = document.getElementById('review-modal');
        this.commentTextarea = document.getElementById('review-comment');
        this.submitBtn = document.getElementById('review-submit');
        this.charCount = document.getElementById('char-count');

        // Inicializar componente de estrellas
        const starContainer = document.getElementById('modal-star-rating');
        this.starRating = new StarRating(starContainer, {
            onRatingChange: (rating) => {
                this.submitBtn.disabled = rating === 0;
            }
        });
    }

    bindEvents() {
        // Cerrar modal
        document.getElementById('review-modal-close').addEventListener('click', () => this.close());
        document.getElementById('review-cancel').addEventListener('click', () => this.close());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Contador de caracteres
        this.commentTextarea.addEventListener('input', () => {
            const count = this.commentTextarea.value.length;
            this.charCount.textContent = count;
        });

        // Enviar reseña
        this.submitBtn.addEventListener('click', () => this.submitReview());
    }

    async submitReview() {
        const rating = this.starRating.getRating();
        const comment = this.commentTextarea.value.trim();

        if (rating === 0) {
            alert('Por favor selecciona una calificación');
            return;
        }

        try {
            this.submitBtn.disabled = true;
            this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

            const review = await createReview(this.sellerId, rating, comment);

            if (this.onReviewSubmitted) {
                this.onReviewSubmitted(review);
            }

            alert('¡Reseña enviada exitosamente!');
            this.close();

        } catch (error) {
            alert('Error al enviar la reseña: ' + error.message);
            this.submitBtn.disabled = false;
            this.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar reseña';
        }
    }

    show() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => this.modal.remove(), 300);
    }
}

// =================================================
// FUNCIONES DE UTILIDAD
// =================================================

// Mostrar notificación temporal
export function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Verificar si el usuario actual es el propietario del perfil
export function isCurrentUser(userId) {
    // Esta función necesitaría acceder al estado de autenticación
    // Por ahora retorna false, debe implementarse según tu sistema de auth
    return false;
}