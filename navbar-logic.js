// navbar-logic.js - VERSIÓN ROBUSTA DE ESTABILIZACIÓN

import { supabase } from './supabase-client.js';

// Hacer la función disponible globalmente para load-components.js Y para main.js
export async function initializeNavbar() {
    // 1. Obtener los elementos de la barra de navegación
    const btnLogin = document.getElementById('btn-login');
    const btnPublish = document.getElementById('btn-publish-logged-in');
    const btnDashboard = document.getElementById('btn-dashboard');
    const btnLogout = document.getElementById('btn-logout');

    // Verificación de seguridad: si algún botón no existe, solo advertimos y continuamos
    if (!btnLogin || !btnPublish || !btnDashboard || !btnLogout) {
        console.warn('⚠️ Navbar: Faltan algunos botones opcionales. Continuando sin ellos.');
        console.log('Botones encontrados:', { btnLogin, btnPublish, btnDashboard, btnLogout });
        // Continuamos con los botones disponibles - no bloqueamos la página
    }

    // 2. Comprobar el estado de la sesión del usuario
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Error al obtener la sesión:', error);
        // Si hay error, mostramos la vista de invitado por seguridad
        showGuestView();
        return;
    }
    
    if (session) {
        // Si hay una sesión activa, el usuario está conectado
        showUserView();
    } else {
        // Si no hay sesión, el usuario es un invitado
        showGuestView();
    }

    // 3. Añadir la funcionalidad de "Cerrar Sesión" al botón (solo si existe)
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Error al cerrar sesión:', error);
            } else {
                // Redirigir a la página de inicio después de cerrar sesión
                window.location.href = 'index.html';
            }
        });
    }

    // --- Funciones auxiliares para mostrar/ocultar botones ---

    function showUserView() {
        // Ocultar botones de invitado
        if (btnLogin) btnLogin.style.display = 'none';
        // Mostrar botones de usuario
        if (btnPublish) btnPublish.style.display = 'inline-block';
        if (btnDashboard) btnDashboard.style.display = 'inline-block';
        if (btnLogout) btnLogout.style.display = 'inline-block';
        // Botón de publicar redirige directamente a publicar.html
        if (btnPublish) btnPublish.onclick = () => window.location.href = 'publicar.html';
    }
            // FASE 4D: mostrar botón de mensajes y actualizar badge
        const btnMessages = document.getElementById('btn-messages');
        if (btnMessages) {
            btnMessages.style.display = 'inline-block';
            btnMessages.onclick = () => window.location.href = 'panel-unificado.html?tab=mensajes';
        }
        updateMessagesBadge();
        subscribeMessagesBadge();

    function showGuestView() {
        // Mostrar botones de invitado
        if (btnLogin) btnLogin.style.display = 'inline-block';
        // ✅ MOSTRAR BOTÓN DE PUBLICAR PARA INVITADOS (redirige a planes)
        if (btnPublish) btnPublish.style.display = 'inline-block';
        if (btnDashboard) btnDashboard.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'none';
                const btnMessagesGuest = document.getElementById('btn-messages');
        if (btnMessagesGuest) btnMessagesGuest.style.display = 'none';
        // Botón de publicar redirige a planes para invitados
        if (btnPublish) btnPublish.onclick = () => window.location.href = 'publicar.html';
    }
}

// Escuchar el evento 'navbarLoaded' que dispara load-components.js
// Esto asegura que el navbar HTML ya fue inyectado antes de intentar inicializarlo
document.addEventListener('navbarLoaded', () => {
    console.log('🔔 Evento navbarLoaded recibido en navbar-logic.js');
    // Pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
        window.initializeNavbar();
    }, 50);
});

// También intentar inicializar inmediatamente si el DOM ya está listo
// Esto cubre el caso donde el script se carga después del evento
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
        if (typeof window.initializeNavbar === 'function') {
            // Solo ejecutar si el navbar ya está en el DOM
            const navbarContainer = document.getElementById('navbar-container');
            if (navbarContainer && navbarContainer.innerHTML.trim() !== '') {
                window.initializeNavbar();
            }
        }
    }, 100);
}
// --- FASE 4D: BADGE DE MENSAJES SIN LEER ---
async function updateMessagesBadge() {
    const btnMessages = document.getElementById('btn-messages');
    const badge = document.getElementById('messages-badge');
    if (!btnMessages || !badge) return;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Mis conversaciones (como comprador o vendedor)
        const { data: convs } = await supabase
            .from('conversaciones')
            .select('id')
            .or(`comprador_id.eq.${user.id},vendedor_id.eq.${user.id}`);

        if (!convs || convs.length === 0) { badge.style.display = 'none'; return; }

        // 2. Mensajes no leídos que no escribí yo
        const { count } = await supabase
            .from('mensajes')
            .select('id', { count: 'exact', head: true })
            .eq('leido', false)
            .neq('emisor_id', user.id)
            .in('conversacion_id', convs.map(c => c.id));

        if (count && count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'grid';
        } else {
            badge.style.display = 'none';
        }
    } catch (e) {
        console.warn('Error actualizando badge de mensajes:', e);
    }
}

// El badge se actualiza en vivo: si llega un mensaje mientras navegas, suma solo
function subscribeMessagesBadge() {
    if (window._mcBadgeChannel) return;
    window._mcBadgeChannel = supabase
        .channel('mc-navbar-badge')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes' }, () => updateMessagesBadge())
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversaciones' }, () => updateMessagesBadge())
        .subscribe();
}

// Exponer la función también en window para load-components.js
window.initializeNavbar = initializeNavbar;