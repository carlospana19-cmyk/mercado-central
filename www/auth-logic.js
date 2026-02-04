// www/auth-logic.js - VERSIÓN SINCRONIZADA

import { supabase } from './supabase-client.js';

// --- Funciones Principales ---

export async function handleRegister(event) {
    event.preventDefault();

    showAlert('Procesando registro...', 'info');

    const email = document.getElementById('email-register').value;
    const password = document.getElementById('password-register').value;
    const codigoInvitacion = document.getElementById('codigo-invitacion')?.value;

    console.log('📝 Intentando registrar:', email.trim());
    if (codigoInvitacion) {
        console.log('Código de Invitación:', codigoInvitacion);
    }

    if (password.length < 6) {
        showAlert('La contraseña debe tener al menos 6 caracteres.', 'error');
        return;
    }

    // Registrar en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim()
    });

    if (error) {
        console.error('❌ Error Supabase (registro):', error.message);
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
            showAlert('❌ Este email ya está registrado. Inicia sesión en su lugar.', 'error');
        } else {
            showAlert(`❌ Error en el registro: ${error.message}`, 'error');
        }
        return;
    }
    if (!data.user) {
        console.error('⚠️ No se creó el usuario en Supabase Auth');
        showAlert('❌ No se pudo crear la cuenta de usuario.', 'error');
        return;
    }

    console.log('✅ Usuario registrado en Supabase Auth:', data.user.email);

    // Crear perfil en tabla profiles
    const { error: profileError } = await supabase
        .from('profiles')
        .insert({
            id: data.user.id,
            email: data.user.email,
            codigo_invitacion: codigoInvitacion || null
        });

    if (profileError) {
        console.warn('⚠️ Error creando perfil en tabla profiles:', profileError.message);
    }

    showAlert('✅ Registro exitoso. Por favor verifica tu email para confirmar la cuenta.', 'success');

    setTimeout(() => {
        window.location.href = 'login.html';
    }, 3000);
}

// --- Funciones de UI y Auxiliares ---

function showAlert(message, type = 'error') {
    const container = document.getElementById('alert-container');
    if (!container) {
        alert(message);
        return;
    }
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    container.innerHTML = '';
    container.appendChild(alertDiv);
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

// --- Punto de Entrada del Script ---

function initializeAuth() {
    console.log('📋 Configurando formularios de autenticación...');
    
    // Configurar formulario de login
    const loginForm = document.getElementById('login-form') || document.getElementById('loginForm');
    if (loginForm) {
        console.log('✅ Formulario de login encontrado');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email')?.value || document.getElementById('email')?.value;
            const password = document.getElementById('login-password')?.value || document.getElementById('password')?.value;

            try {
                console.log('🔐 Intentando login con:', email.trim());
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password: password.trim()
                });

                if (error) {
                    console.error('❌ Error Supabase:', error.message);
                    showAlert(`❌ Error: ${error.message}`, 'error');
                    return;
                }

                console.log('✅ Login exitoso:', data.user.email);
                window.location.href = 'index.html';
            } catch (err) {
                console.error('❌ Error inesperado:', err);
                showAlert('❌ Error inesperado en login.', 'error');
            }
        });
    }

    // Configurar formulario de registro
    const registerForm = document.getElementById('register-form') || document.getElementById('registerForm');
    if (registerForm) {
        console.log('✅ Formulario de registro encontrado');
        registerForm.addEventListener('submit', handleRegister);
    } else {
        console.warn('⚠️ Formulario de registro NO encontrado');
    }

    // Configurar botón de logout si existe
    const logoutButton = document.getElementById('btn-logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}

// Ejecutar todo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeAuth);

// --- Funciones exportadas ---

export function initializeAuthPages() {
    console.log('🔐 Inicializando páginas de autenticación...');
    initializeAuth();
}

export async function checkUserLoggedIn() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('Error obteniendo sesión:', sessionError);
        return null;
    }
    if (!sessionData?.session) {
        return null;
    }

    const { data, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Error verificando usuario:', error);
        return null;
    }
    return data?.user ?? null;
}
