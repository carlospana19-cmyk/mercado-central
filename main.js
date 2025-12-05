// main.js - VERSIÓN FINAL Y COMPLETA DEL CONTROLADOR

import { supabase } from './supabase-client.js';
import { initializeNavbar } from './navbar-logic.js';
import { initializeHomePage } from './home-logic.js';
import { loadSearchCategories, initializeSearchButton } from './home-search.js';
import { initializePublishPage } from './publish-logic.js';
import { initializeEditPage } from './editar-anuncio-logic.js';
import { initializeAuthPages, checkUserLoggedIn } from './auth-logic.js';
import { initializeDashboardPage } from './dashboard-logic.js';

// --- FUNCIÓN CENTRAL DE AUTENTICACIÓN ---
function updateUIBasedOnAuthState() {
    supabase.auth.onAuthStateChange((event, session) => {
        const isLoggedIn = session && session.user;

        // --- BOTONES DEL NAVBAR ---
        const btnPublish = document.getElementById('btn-publish-logged-in');
        const btnDashboard = document.getElementById('btn-dashboard');
        const btnLogout = document.getElementById('btn-logout');
        const btnLogin = document.getElementById('btn-login');

        if (isLoggedIn) {
            // --- USUARIO CONECTADO ---
            if (btnPublish) btnPublish.style.display = 'inline-block';
            if (btnDashboard) btnDashboard.style.display = 'inline-block';
            if (btnLogout) btnLogout.style.display = 'inline-block';
            if (btnLogin) btnLogin.style.display = 'none';

            // Agregar listener al botón de logout
            if (btnLogout) {
                btnLogout.addEventListener('click', async () => {
                    console.log("🚪 Cerrando sesión...");
                    await supabase.auth.signOut();
                    console.log("✅ Sesión cerrada");
                    window.location.href = 'login.html';
                });
            }
        } else {
            // --- USUARIO INVITADO ---
            if (btnPublish) btnPublish.style.display = 'none';
            if (btnDashboard) btnDashboard.style.display = 'none';
            if (btnLogout) btnLogout.style.display = 'none';
            if (btnLogin) btnLogin.style.display = 'inline-block';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeNavbar();
    updateUIBasedOnAuthState(); // <-- LLAMADA A LA FUNCIÓN DE AUTH

    const path = window.location.pathname;

    if (path.endsWith('/') || path.endsWith('index.html')) {
        initializeHomePage();
        loadSearchCategories();
        initializeSearchButton();
    } else if (path.endsWith('publicar.html')) {
        initializePublishPage();
    } else if (path.endsWith('editar-anuncio.html')) {
        initializeEditPage();
    } else if (path.endsWith('login.html') || path.endsWith('registro.html') || path.endsWith('forgot-password.html') || path.endsWith('reset-password.html')) {
        initializeAuthPages(); // <-- ESTA ES LA LÍNEA QUE REPARA EL LOGIN
    } else if (path.endsWith('dashboard.html')) {
        initializeDashboardPage();
    }

    // Verificar autenticación solo si NO estamos en login, registro, forgot-password o reset-password
    if (!path.endsWith('login.html') && !path.endsWith('registro.html') && !path.endsWith('forgot-password.html') && !path.endsWith('reset-password.html')) {
        checkUserLoggedIn();
    }
});
