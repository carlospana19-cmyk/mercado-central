import { supabase } from './supabase-client.js';
import { ReviewModal, hasUserReviewedSeller, getSellerReviews, getSellerReviewStats, generateReviewStatsHTML, generateReviewHTML } from './reviews-logic.js';
import { APP_CONFIG } from './AppConfig.js';

// ⭐ FUNCIÓN PRINCIPAL - LLAMADA POR MAIN.JS
export async function initializeProductDetailPage() {
    console.log('🚀 Inicializando página de detalle del producto');
    
    const urlParams = new URLSearchParams(window.location.search);
    const adId = urlParams.get('id');
    
    if (!adId) {
        console.error('❌ No se encontró ID en URL');
        const titleEl = document.getElementById('product-title');
        if (titleEl) titleEl.textContent = 'Producto no encontrado';
        return;
    }
    
    try {
        console.log(`📡 Fetching product ID: ${adId}`);
        const ad = await fetchProductById(adId);
        console.log('✅ Producto cargado:', ad.titulo);
        
        window.displayProductDetails(ad);
        if (typeof displayAllAttributesComprehensive === 'function') {
            displayAllAttributesComprehensive(ad);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        const titleEl = document.getElementById('product-title');
        if (titleEl) titleEl.textContent = 'Error al cargar';
    }
}

async function fetchProductById(adId) {
    const { data, error } = await supabase
        .from('anuncios')
        .select('*, imagenes(url_imagen), profiles(id, nombre_negocio, url_foto_perfil, nombre_completo, telefono, email)')
        .eq('id', adId)
        .single();
    
    if (error) throw error;
    return data;
}

// FUNCIÓN GLOBAL PARA DETALLE DE PRODUCTO
window.displayProductDetails = function(ad) {
    console.log("🚀 Renderizando:", ad.titulo);
    
    // Título
    const titleElement = document.getElementById('product-name');
    if (titleElement) titleElement.textContent = ad.titulo || 'Sin título';

    const nameElement = document.getElementById('product-title');
    if (nameElement) nameElement.textContent = ad.titulo || 'Sin título';
    
    // Precio
    const priceElement = document.getElementById('product-price');
    if (priceElement && ad.precio) {
        priceElement.textContent = new Intl.NumberFormat('es-PA', { 
            style: 'currency', currency: 'PAB' 
        }).format(ad.precio);
    }
    
    // Descripción
    const descElement = document.getElementById('product-description');
    if (descElement) descElement.textContent = ad.descripcion || 'Sin descripción';
    
    // Fecha
    const dateElement = document.getElementById('product-date');
    if (dateElement && ad.created_at) {
        dateElement.textContent = new Date(ad.created_at).toLocaleDateString('es-PA');
    }
    
    // Visitas
    const visitsElement = document.getElementById('product-visits');
    if (visitsElement) visitsElement.textContent = (ad.visitas || 0);
    
    // Contacto
    setupSellerContact(ad);
    
    // Ocultar loader
    const loader = document.getElementById('loading-overlay');
    if (loader) loader.style.display = 'none';
};

function setupSellerContact(ad) {
    const whatsappBtn = document.getElementById('whatsapp-link');
    const emailBtn = document.getElementById('email-link');
    const phoneBtn = document.getElementById('phone-link');
    
    const profile = Array.isArray(ad.profiles) ? ad.profiles[0] : ad.profiles;
    
    if (profile?.telefono && whatsappBtn) {
        const phoneClean = profile.telefono.replace(/[^+\d]/g, '');
        whatsappBtn.href = `https://wa.me/${phoneClean.startsWith('507') ? phoneClean : '507' + phoneClean}`;
        whatsappBtn.style.display = 'inline-flex';
    }
    
    if (profile?.email && emailBtn) {
        emailBtn.href = `mailto:${profile.email}`;
        emailBtn.style.display = 'inline-flex';
    }
    
    if (profile?.telefono && phoneBtn) {
        phoneBtn.href = `tel:${profile.telefono.replace(/[^+\d]/g, '')}`;
        phoneBtn.style.display = 'inline-flex';
    }
}

// Hacer disponible globalmente también
window.initializeProductDetailPage = initializeProductDetailPage;

console.log('✅ product-detail-logic.js FIX - Syntax corregida + funcionalidad completa');
