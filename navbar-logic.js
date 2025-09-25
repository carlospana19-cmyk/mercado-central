// navbar-logic.js

// Función para actualizar la UI del Navbar
const updateNavbarUI = (user) => {
    const userButtons = document.querySelectorAll('.nav-btn-user');
    const guestButtons = document.querySelectorAll('.nav-btn-guest');

    if (user) {
        // Si hay usuario, mostramos sus botones y ocultamos los de invitado
        userButtons.forEach(btn => btn.style.display = 'inline-block');
        guestButtons.forEach(btn => btn.style.display = 'none');
    } else {
        // Si no hay usuario, hacemos lo contrario
        userButtons.forEach(btn => btn.style.display = 'none');
        guestButtons.forEach(btn => btn.style.display = 'inline-block');
    }
};

// Función principal que se ejecuta al cargar la página
async function setupNavbar() {
    // 1. Verificamos el estado del usuario
    const { data: { user } } = await supabaseClient.auth.getUser();
    updateNavbarUI(user);

    // 2. Añadimos la lógica al botón de cerrar sesión
    const logoutButton = document.getElementById('btn-logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            // No necesitamos alerta, simplemente actualizamos la UI y recargamos
            updateNavbarUI(null);
            window.location.href = 'index.html';
        });
    }
    
    // 3. Escuchamos cambios en el estado de autenticación (login/logout en otras pestañas)
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        updateNavbarUI(session?.user);
    });
}

// Ejecutamos la función cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', setupNavbar);
