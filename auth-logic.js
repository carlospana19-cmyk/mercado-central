// auth-logic.js - VERSIÓN MODULAR Y CORREGIDA

import { supabase } from './supabase-client.js';

export function initializeAuthPages() {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.password.value;

            const { error } = await supabase.auth.signUp({ email, password });

            if (error) {
                alert('Error en el registro: ' + error.message);
            } else {
                alert('¡Registro exitoso! Revisa tu correo para confirmar la cuenta.');
                window.location.href = 'login.html';
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.password.value;

            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                alert('Error al iniciar sesión: ' + error.message);
            } else {
                window.location.href = 'dashboard.html';
            }
        });
    }
}

export async function checkUserLoggedIn() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
    }
}

// Llama a la función para verificar el estado de autenticación al cargar el script
checkUserLoggedIn();

