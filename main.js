// main.js - VERSIÓN OPTIMIZADA CON LAZY LOADING

import { supabase } from './supabase-client.js';
import { initializeNavbar } from './navbar-logic.js';
import { checkUserLoggedIn } from './auth-logic.js';

// Lazy loading: importar módulos SOLO cuando se necesiten
async function loadModuleWhenNeeded(modulePath) {
    return import(modulePath);
}

// --- FUNCIÓN CENTRAL DE AUTENTICACIÓN (OPTIMIZADA) ---
function updateUIBasedOnAuthState() {
    // ✅ FIJAR: Guardar la suscripción para poder desuscribirse después
    let unsubscribe = null;
    
    unsubscribe = supabase.auth.onAuthStateChange((event, session) => {
        const isLoggedIn = session && session.user;

        // --- BOTONES DEL NAVBAR ---
        const btnPublish = document.getElementById('btn-publish-logged-in');
        const btnDashboard = document.getElementById('btn-dashboard');
        const btnProfile = document.getElementById('btn-profile');
        const btnLogout = document.getElementById('btn-logout');
        const btnLogin = document.getElementById('btn-login');

        if (isLoggedIn) {
            // --- USUARIO CONECTADO ---
            if (btnPublish) btnPublish.style.display = 'inline-block';
            if (btnDashboard) btnDashboard.style.display = 'inline-block';
            if (btnProfile) btnProfile.style.display = 'inline-block';
            if (btnLogout) btnLogout.style.display = 'inline-block';
            if (btnLogin) btnLogin.style.display = 'none';

            // Agregar listener al botón de logout (solo una vez)
            if (btnLogout && !btnLogout.dataset.logoutListenerAdded) {
                btnLogout.addEventListener('click', async () => {
                    console.log("🚪 Cerrando sesión...");
                    await supabase.auth.signOut();
                    console.log("✅ Sesión cerrada");
                    window.location.href = 'login.html';
                });
                btnLogout.dataset.logoutListenerAdded = 'true';
            }
        } else {
            // --- USUARIO INVITADO ---
            // ✅ Mostrar botón de publicar para invitados (redirige a planes)
            if (btnPublish) btnPublish.style.display = 'inline-block';
            if (btnDashboard) btnDashboard.style.display = 'none';
            if (btnProfile) btnProfile.style.display = 'none';
            if (btnLogout) btnLogout.style.display = 'none';
            if (btnLogin) btnLogin.style.display = 'inline-block';
        }
    });
    
    // ✅ FIJAR: Retornar función para desuscribirse si es necesario
    return unsubscribe;
}

document.addEventListener('DOMContentLoaded', async () => {
    initializeNavbar();
    updateUIBasedOnAuthState(); // <-- LLAMADA A LA FUNCIÓN DE AUTH

    const path = window.location.pathname;

    if (path.endsWith('/') || path.endsWith('index.html')) {
        const homeModule = await loadModuleWhenNeeded('./home-logic.js');
        const searchModule = await loadModuleWhenNeeded('./home-search.js');
        homeModule.initializeHomePage();
        await searchModule.loadSearchCategories();
        searchModule.initializeSearchButton();
    } else if (path.endsWith('publicar.html')) {
        const publishModule = await loadModuleWhenNeeded('./publish-logic.js');
        publishModule.initializePublishPage();
    } else if (path.endsWith('editar-anuncio.html')) {
        const editModule = await loadModuleWhenNeeded('./editar-anuncio-logic.js');
        editModule.initializeEditPage();
    } else if (path.endsWith('perfil.html')) {
        const perfilModule = await loadModuleWhenNeeded('./perfil-logic.js');
        perfilModule.loadUserProfile();
    } else if (path.endsWith('panel-unificado.html')) {
        // El panel unificado carga su propio módulo
        console.log('Panel unificado cargado');
    } else if (path.endsWith('login.html') || path.endsWith('registro.html') || path.endsWith('forgot-password.html') || path.endsWith('reset-password.html')) {
        const authModule = await loadModuleWhenNeeded('./auth-logic.js');
        authModule.initializeAuthPages(); // <-- ESTA ES LA LÍNEA QUE REPARA EL LOGIN
    } else if (path.endsWith('dashboard.html')) {
        const dashboardModule = await loadModuleWhenNeeded('./dashboard-logic.js');
        dashboardModule.initializeDashboardPage();
    }

    // Verificar autenticación solo si NO estamos en login, registro, forgot-password o reset-password
    if (!path.endsWith('login.html') && !path.endsWith('registro.html') && !path.endsWith('forgot-password.html') && !path.endsWith('reset-password.html')) {
        checkUserLoggedIn();
    }
});
