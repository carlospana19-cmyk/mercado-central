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
document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DE CARGA DE CATEGORÍAS (CENTRALIZADA Y ADAPTADA) ---
    async function loadCategories() {
        const categorySelectForm = document.getElementById('ad-category');
        const categorySelectSearch = document.getElementById('categorySelect');
        const targetSelect = categorySelectForm || categorySelectSearch;

        if (!targetSelect) return;

        const defaultOptionHTML = targetSelect.id === 'ad-category' 
            ? '<option value="" disabled selected>Seleccione una categoría</option>'
            : '<option value="all" selected>Todas las Categorías</option>';

        // 1. Pedimos ambas columnas, ordenadas por grupo
        const { data: categories, error } = await supabaseClient
            .from('categorias')
            .select('nombre, grupo')
            .order('grupo', { ascending: true })
            .order('nombre', { ascending: true });

        if (error) {
            console.error('Error al cargar categorías:', error);
            targetSelect.innerHTML = '<option>Error</option>';
            return;
        }

        // 2. Agrupamos las categorías
        const groupedCategories = categories.reduce((acc, category) => {
            const group = category.grupo;
            if (!acc[group]) {
                acc[group] = [];
            }
            acc[group].push(category);
            return acc;
        }, {});

        // 3. Construimos el HTML con <optgroup>
        let optionsHTML = defaultOptionHTML;
        for (const groupName in groupedCategories) {
            optionsHTML += `<optgroup label="${groupName}">`;
            groupedCategories[groupName].forEach(category => {
                optionsHTML += `<option value="${category.nombre}">${category.nombre}</option>`;
            });
            optionsHTML += `</optgroup>`;
        }

        targetSelect.innerHTML = optionsHTML;
    }

    // Llamamos a la función para que se ejecute en cada carga de página
    loadCategories();


    setupNavbar();
});