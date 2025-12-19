// navbar-logic.js - VERSIÓN ROBUSTA DE ESTABILIZACIÓN

import { supabase } from './supabase-client.js';

export async function initializeNavbar() {
    // 1. Obtener los elementos de la barra de navegación
    const btnLogin = document.getElementById('btn-login');
    const btnPublish = document.getElementById('btn-publish-logged-in');
    const btnDashboard = document.getElementById('btn-dashboard');
    const btnProfile = document.getElementById('btn-profile');
    const btnLogout = document.getElementById('btn-logout');

    // Verificación de seguridad: si algún botón no existe, no continuar.
    if (!btnLogin || !btnPublish || !btnDashboard || !btnLogout) {
        console.error('Error crítico: Faltan botones esenciales en el navbar del HTML.');
        return;
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

    // 3. Añadir la funcionalidad de "Cerrar Sesión" al botón
    btnLogout.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error al cerrar sesión:', error);
        } else {
            // Redirigir a la página de inicio después de cerrar sesión
            window.location.href = 'index.html';
        }
    });

    // --- Funciones auxiliares para mostrar/ocultar botones ---

    function showUserView() {
        // Ocultar botones de invitado
        btnLogin.style.display = 'none';
        // Mostrar botones de usuario
        btnPublish.style.display = 'inline-block';
        btnDashboard.style.display = 'inline-block';
        if (btnProfile) btnProfile.style.display = 'inline-block';
        btnLogout.style.display = 'inline-block';
        // Botón de publicar redirige directamente a publicar.html
        btnPublish.onclick = () => window.location.href = 'publicar.html';
    }

    function showGuestView() {
        // Mostrar botones de invitado
        btnLogin.style.display = 'inline-block';
        // ✅ MOSTRAR BOTÓN DE PUBLICAR PARA INVITADOS (redirige a planes)
        btnPublish.style.display = 'inline-block';
        btnDashboard.style.display = 'none';
        if (btnProfile) btnProfile.style.display = 'none';
        btnLogout.style.display = 'none';
        // Botón de publicar redirige a planes para invitados
        btnPublish.onclick = () => window.location.href = 'publicar.html';
    }
}