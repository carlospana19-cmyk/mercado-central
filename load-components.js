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

        // ✅ REDES SOCIALES OFICIALES (PARTE 1): se leen de APP_CONFIG.REDES_SOCIALES
        // en AppConfig.js (única fuente de verdad). target=_blank + noopener.
        const socialHost = document.getElementById('footer-social-links');
        if (socialHost) {
            try {
                const { REDES_SOCIALES } = await import('./AppConfig.js');
                const enlaces = [];
                if (REDES_SOCIALES?.instagram) {
                    enlaces.push({ url: REDES_SOCIALES.instagram, icono: 'fa-brands fa-instagram', etiqueta: 'Instagram de Mercados Central' });
                }
                if (REDES_SOCIALES?.facebook) {
                    enlaces.push({ url: REDES_SOCIALES.facebook, icono: 'fa-brands fa-facebook-f', etiqueta: 'Facebook de Mercados Central' });
                }
                if (enlaces.length) {
                    socialHost.innerHTML = enlaces.map(e =>
                        `<a href="${e.url}" target="_blank" rel="noopener noreferrer" aria-label="${e.etiqueta}" title="${e.etiqueta}"><i class="${e.icono}" aria-hidden="true"></i></a>`
                    ).join('');
                } else {
                    socialHost.style.display = 'none';
                }
            } catch (e) {
                console.warn('No se pudo leer REDES_SOCIALES (AppConfig.js):', e);
                socialHost.style.display = 'none';
            }
        }
    }
});
