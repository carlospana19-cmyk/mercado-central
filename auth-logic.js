// auth-logic.js - VERSIÓN MEJORADA

import { supabase } from './supabase-client.js';

export function initializeAuthPages() {
    console.log("🔐 initializeAuthPages() iniciando...");
    
    // Esperar a que el documento esté completamente cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupForms);
    } else {
        setupForms();
    }
}

function setupForms() {
    console.log("📋 Buscando formularios...");
    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetPasswordForm = document.getElementById('reset-password-form');

    console.log("Formulario login encontrado:", !!loginForm);
    console.log("Formulario register encontrado:", !!registerForm);
    console.log("Formulario forgot-password encontrado:", !!forgotPasswordForm);
    console.log("Formulario reset-password encontrado:", !!resetPasswordForm);

    if (!supabase) {
        console.error("❌ Supabase no está disponible");
        return;
    }

    if (loginForm) {
        console.log("✅ Agregando listener al formulario de login");
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        console.log("✅ Agregando listener al formulario de registro");
        registerForm.addEventListener('submit', handleRegister);
    }

    if (forgotPasswordForm) {
        console.log("✅ Agregando listener al formulario de recuperación");
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }

    if (resetPasswordForm) {
        console.log("✅ Agregando listener al formulario de reset");
        resetPasswordForm.addEventListener('submit', handleResetPassword);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    console.log("🔑 Procesando login...");
    
    try {
        const email = document.getElementById('email')?.value?.trim();
        const password = document.getElementById('password')?.value;

        if (!email || !password) {
            alert('Por favor ingresa email y contraseña');
            return;
        }

        console.log("📧 Intentando login con:", email);

        const { data, error } = await supabase.auth.signInWithPassword({ 
            email, 
            password 
        });

        if (error) {
            console.error('❌ Error de Supabase:', error.message);
            alert('Error: ' + error.message);
            return;
        }

        console.log('✅ Login exitoso:', data.user.email);
        window.location.href = 'index.html';
    } catch (err) {
        console.error('❌ Error:', err);
        alert('Error: ' + (err.message || 'Desconocido'));
    }
}

async function handleRegister(e) {
    e.preventDefault();
    console.log("📝 Procesando registro...");
    
    try {
        const email = document.getElementById('email-register')?.value?.trim();
        const password = document.getElementById('password-register')?.value;

        if (!email || !password) {
            alert('Por favor ingresa email y contraseña');
            return;
        }

        console.log("📧 Intentando registro con:", email);

        const { error } = await supabase.auth.signUp({ email, password });

        if (error) {
            console.error('❌ Error de Supabase:', error.message);
            alert('Error: ' + error.message);
            return;
        }

        console.log('✅ Registro exitoso');

        // Obtener plan seleccionado de sessionStorage o URL
        const urlParams = new URLSearchParams(window.location.search);
        const selectedPlan = urlParams.get('plan') || sessionStorage.getItem('selectedPlan');

        if (selectedPlan === 'gratis') {
            // Plan gratis: redirigir a publicar con plan preseleccionado
            sessionStorage.setItem('selectedPlan', 'gratis');
            sessionStorage.setItem('afterRegisterAction', 'continuePlan');
            alert('¡Registro exitoso! Redirigiendo a la publicación de anuncio...');
            window.location.href = 'publicar.html';
        } else if (selectedPlan) {
            // Plan de pago: redirigir a pago nuevamente
            alert('¡Registro exitoso! Completando el pago...');
            window.location.href = `/payment.html?plan=${selectedPlan}`;
        } else {
            // Sin plan: ir a home
            alert('¡Registro exitoso! Revisa tu correo para confirmar.');
            window.location.href = 'index.html';
        }
    } catch (err) {
        console.error('❌ Error:', err);
        alert('Error: ' + (err.message || 'Desconocido'));
    }
}

export async function checkUserLoggedIn() {
    try {
        const currentPath = window.location.pathname;
        if (currentPath.includes('login.html') || currentPath.includes('registro.html') || currentPath.includes('forgot-password.html') || currentPath.includes('reset-password.html')) {
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.log("⚠️ Sin sesión, redirigiendo...");
            window.location.href = 'login.html';
        }
    } catch (err) {
        console.error("Error en checkUserLoggedIn:", err);
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    console.log("🔑 Procesando recuperación de contraseña...");
    
    try {
        const email = document.getElementById('email-forgot')?.value?.trim();

        if (!email) {
            alert('Por favor ingresa tu correo electrónico');
            return;
        }

        console.log("📧 Enviando enlace de recuperación a:", email);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });

        if (error) {
            console.error('❌ Error:', error.message);
            alert('Error: ' + error.message);
            return;
        }

        console.log('✅ Enlace enviado correctamente');
        alert('Si la cuenta existe, recibirás un enlace de recuperación en tu correo.\n\nRevisa tu bandeja de entrada y carpeta de spam.');
        window.location.href = 'login.html';
    } catch (err) {
        console.error('❌ Error:', err);
        alert('Error: ' + (err.message || 'Desconocido'));
    }
}

async function handleResetPassword(e) {
    e.preventDefault();
    console.log("🔑 Procesando reseteo de contraseña...");
    
    try {
        const password = document.getElementById('password-reset')?.value;
        const passwordConfirm = document.getElementById('password-confirm')?.value;

        if (!password || !passwordConfirm) {
            alert('Por favor ingresa y confirma tu nueva contraseña');
            return;
        }

        if (password !== passwordConfirm) {
            alert('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        console.log("🔄 Actualizando contraseña...");

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            console.error('❌ Error:', error.message);
            alert('Error: ' + error.message);
            return;
        }

        console.log('✅ Contraseña cambiada exitosamente');
        alert('¡Contraseña cambiada exitosamente! Por favor inicia sesión nuevamente.');
        window.location.href = 'login.html';
    } catch (err) {
        console.error('❌ Error:', err);
        alert('Error: ' + (err.message || 'Desconocido'));
    }
}
