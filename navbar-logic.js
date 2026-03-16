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

    function showGuestView() {
        // Mostrar botones de invitado
        if (btnLogin) btnLogin.style.display = 'inline-block';
        // ✅ MOSTRAR BOTÓN DE PUBLICAR PARA INVITADOS (redirige a planes)
        if (btnPublish) btnPublish.style.display = 'inline-block';
        if (btnDashboard) btnDashboard.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'none';
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

// Exponer la función también en window para load-components.js
window.initializeNavbar = initializeNavbar;