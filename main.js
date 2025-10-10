// main.js - VERSIÓN FINAL Y COMPLETA DEL CONTROLADOR

console.log("MAIN.JS SE ESTÁ EJECUTANDO...");

import { initializeNavbar } from './navbar-logic.js';
import { initializeHomePage } from './home-logic.js';
import { loadSearchCategories, initializeSearchButton } from './home-search.js';
import { initializePublishPage } from './publish-logic.js';
import { initializeEditPage } from './editar-anuncio-logic.js';
import { initializeAuthPages } from './auth-logic.js';
import { initializeDashboardPage } from './dashboard-logic.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM cargado. Inicializando Navbar...");
    initializeNavbar();

    const path = window.location.pathname;
    console.log("Ruta actual:", path);

    if (path.endsWith('/') || path.endsWith('index.html')) {
        console.log("Cargando lógica de HOME PAGE.");
        initializeHomePage();
        loadSearchCategories();
        initializeSearchButton();
    } else if (path.endsWith('publicar.html')) {
        console.log("Cargando lógica de PUBLISH PAGE.");
        initializePublishPage();
    } else if (path.endsWith('editar-anuncio.html')) {
        console.log("Cargando lógica de EDIT PAGE.");
        initializeEditPage();
    } else if (path.endsWith('login.html') || path.endsWith('registro.html')) {
        console.log("Cargando lógica de AUTH PAGES.");
        initializeAuthPages(); // <-- ESTA ES LA LÍNEA QUE REPARA EL LOGIN
    } else if (path.endsWith('dashboard.html')) {
        console.log("Cargando lógica de DASHBOARD.");
        initializeDashboardPage();
    }
});
