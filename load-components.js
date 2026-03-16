/**
 * load-components.js
 * Script para inyectar componentes navbar y footer automáticamente
 * 
 * USO: Agregar <script src="load-components.js" defer></script> antes del </body>
 * en todos los archivos HTML
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Cargar Navbar
    const navbarContainer = document.getElementById('navbar-container');
    if (navbarContainer) {
        try {
            const navbarResponse = await fetch('navbar-component.html');
            navbarContainer.innerHTML = await navbarResponse.text();
            
            // Disipar evento para que main.js pueda ejecutar la lógica de autenticación
            document.dispatchEvent(new Event('navbarLoaded'));
            console.log('✅ Navbar cargado y evento navbarLoaded disparado');
            
            // Si la función initializeNavbar existe en el ámbito global, ejecutarla
            if (typeof window.initializeNavbar === 'function') {
                window.initializeNavbar();
            }
        } catch (e) {
            console.warn('No se pudo cargar el navbar:', e);
        }
    }

    // Cargar Footer
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        try {
            const footerResponse = await fetch('footer-component.html');
            footerContainer.innerHTML = await footerResponse.text();
        } catch (e) {
            console.warn('No se pudo cargar el footer:', e);
        }
    }
});
