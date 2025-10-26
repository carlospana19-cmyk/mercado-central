// main.js - VERSIÓN FINAL Y COMPLETA DEL CONTROLADOR

import { supabase } from './supabase-client.js';
import { initializeNavbar } from './navbar-logic.js';
import { initializeHomePage } from './home-logic.js';
import { loadSearchCategories, initializeSearchButton } from './home-search.js';
import { initializePublishPage } from './publish-logic.js';
import { initializeEditPage } from './editar-anuncio-logic.js';
import { initializeAuthPages } from './auth-logic.js';
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
    } else if (path.endsWith('login.html') || path.endsWith('registro.html')) {
        initializeAuthPages(); // <-- ESTA ES LA LÍNEA QUE REPARA EL LOGIN
    } else if (path.endsWith('dashboard.html')) {
        initializeDashboardPage();
    }
});
