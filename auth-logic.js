// auth-logic.js



document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA PARA LA PÁGINA DE LOGIN ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            // Usamos la función de Supabase para iniciar sesión
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                alert(`Error al iniciar sesión: ${error.message}`);
            } else {
                alert('¡Inicio de sesión exitoso!');
                // Redirigir al panel de control o a la página principal
                window.location.href = 'dashboard.html'; 
            }
        });
    }

    // --- LÓGICA PARA LA PÁGINA DE REGISTRO ---
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = signupForm.email.value;
            const password = signupForm.password.value;

            // Usamos la función de Supabase para registrar un nuevo usuario
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
            });

            if (error) {
                alert(`Error en el registro: ${error.message}`);
            } else {
                alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
                // Redirigir a la página de login
                window.location.href = 'login.html'; 
            }
        });
    }
});