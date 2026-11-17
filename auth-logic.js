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

    // Conectar botón de Google
    setupGoogleButton();
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

            // ✉️ Correo sin confirmar: mostrar el paso de verificación
            // (input de código + verificar + reenviar) en lugar del error crudo
            const isEmailNotConfirmed = error?.code === 'email_not_confirmed'
                || /email not confirmed/i.test(error?.message || '');

            if (isEmailNotConfirmed) {
                console.log('✉️ Correo sin confirmar, mostrando paso de verificación...');
                showVerificationStep({
                    email,
                    formToHide: document.getElementById('login-form'),
                    onVerified: (verifyData) => redirectToDestination(verifyData?.user?.id)
                });
                return;
            }

            alert('Error: ' + error.message);
            return;
        }

        console.log('✅ Login exitoso:', data.user.email);
        await redirectToDestination(data.user.id);
    } catch (err) {
        console.error('❌ Error:', err);
        alert('Error: ' + (err.message || 'Desconocido'));
    }
}

// Redirección común tras login o verificación de email:
// redirect param (publicar.html) → admin → index
async function redirectToDestination(userId) {
    // ✅ VERIFICAR SI HAY REDIRECCIÓN PENDIENTE (desde publicar.html)
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect');

    if (redirectUrl) {
        console.log('🔄 Redirigiendo a:', redirectUrl);
        window.location.href = redirectUrl;
        return;
    }

    if (!userId) {
        // Sin id de usuario no se puede consultar el perfil: ir a index
        window.location.href = 'index.html';
        return;
    }

    // Verificar si es admin para redirigir a panel de administrador
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

    if (profile?.is_admin) {
        // Admin: ir al panel de administrador
        console.log('🔐 Admin detectado, redirigiendo a panel...');
        window.location.href = 'admin.html';
    } else {
        // Usuario normal: ir a index
        window.location.href = 'index.html';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    console.log("📝 Procesando registro...");

    try {
        const email = document.getElementById('email-register')?.value?.trim();
        const password = document.getElementById('password-register')?.value;
        const nombreNegocio = (document.getElementById('nombre-negocio')?.value || '').trim()
            || email.split('@')[0];

        if (!email || !password) {
            alert('Por favor ingresa email y contraseña');
            return;
        }

        console.log("📧 Intentando registro con:", email);

        // Metadatos para el trigger on_auth_user_created: la fila de profiles
        // la crea el trigger, NO se inserta aquí
        const options = { data: { nombre_negocio: nombreNegocio } };

        // nombre_completo solo si el formulario lo pide
        const nombreCompleto = document.getElementById('nombre-completo')?.value?.trim();
        if (nombreCompleto) {
            options.data.nombre_completo = nombreCompleto;
        }

        const { data: authData, error } = await supabase.auth.signUp({ email, password, options });

        if (error) {
            console.error('❌ Error de Supabase:', error.message);
            alert('Error: ' + error.message);
            return;
        }

        // CASO DUPLICADO: Supabase devuelve user pero con identities vacío
        // cuando el correo ya está registrado (lo ofusca para no filtrar cuentas)
        if (authData?.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
            console.warn('⚠️ Correo ya registrado:', email);
            alert('Ese correo ya tiene cuenta — inicia sesión');
            return;
        }

        console.log('✅ Registro exitoso');

        if (!authData.session) {
            // ✅ CASO NORMAL (confirmación de email activada): mostrar el paso
            // de verificación con el código de verificación
            console.log('✉️ Sin sesión: mostrando paso de verificación de email...');
            showVerificationStep({
                email,
                formToHide: document.getElementById('register-form'),
                onVerified: () => {
                    // ✅ Redirección directa a panel-unificado.html (flujo actual)
                    console.log('🔄 Email verificado, redirigiendo a panel-unificado.html...');
                    window.location.href = 'panel-unificado.html';
                }
            });
            return;
        }

        // Sesión inmediata (confirmación de email desactivada): redirigir como hoy
        console.log('🔄 Redirigiendo a panel-unificado.html...');
        alert('¡Registro exitoso! Redirigiendo al panel...');
        window.location.href = 'panel-unificado.html';
    } catch (err) {
        console.error('❌ Error:', err);
        alert('Error: ' + (err.message || 'Desconocido'));
    }
}

// ==========================================
// VERIFICACIÓN DE EMAIL CON CÓDIGO (hasta 8 dígitos)
// ==========================================
const RESEND_COOLDOWN_SECONDS = 60;

// Muestra el paso de verificación: mensaje + input de código + Verificar + Reenviar.
// Se inserta dentro de .form-box para heredar el CSS de mc-auth.css
// (sin librerías ni estilos nuevos).
function showVerificationStep({ email, formToHide, onVerified }) {
    console.log('✉️ Mostrando paso de verificación para:', email);

    const existingPanel = document.getElementById('verify-email-form');
    if (existingPanel) {
        existingPanel.remove();
    }

    if (formToHide) {
        formToHide.style.display = 'none';
    }

    const panel = buildVerificationPanel(email, onVerified);

    if (formToHide && formToHide.parentNode) {
        formToHide.parentNode.insertBefore(panel, formToHide.nextSibling);
    } else {
        document.body.appendChild(panel);
    }

    const codeInput = panel.querySelector('#code-verify');
    if (codeInput) codeInput.focus();
}

function buildVerificationPanel(email, onVerified) {
    const panel = document.createElement('form');
    panel.id = 'verify-email-form';
    panel.noValidate = true;

    const msg = document.createElement('p');
    msg.textContent = 'Te enviamos un código de verificación a tu correo';
    msg.style.fontWeight = '600';

    const emailHint = document.createElement('p');
    emailHint.textContent = email;
    emailHint.style.cssText = 'margin-top:2px;font-size:13px;word-break:break-all;';

    const codeInput = document.createElement('input');
    codeInput.type = 'text';
    codeInput.id = 'code-verify';
    codeInput.name = 'code';
    codeInput.placeholder = 'Código de verificación';
    codeInput.autocomplete = 'one-time-code';
    codeInput.inputMode = 'numeric';
    codeInput.maxLength = 8;
    codeInput.style.cssText = 'text-align:center;letter-spacing:8px;font-size:18px;';

    const status = document.createElement('p');
    status.id = 'verify-status';
    status.setAttribute('role', 'alert');
    status.style.cssText = 'margin-top:2px;font-size:13.5px;min-height:18px;';

    const verifyBtn = document.createElement('button');
    verifyBtn.type = 'submit';
    verifyBtn.textContent = 'Verificar';

    const resendBtn = document.createElement('button');
    resendBtn.type = 'button';
    resendBtn.id = 'resend-code-btn';
    resendBtn.textContent = 'Reenviar código';
    resendBtn.style.cssText = 'height:44px;margin-top:2px;border:1.5px solid var(--line, #E8ECEF);border-radius:11px;background:#fff;color:var(--ink-900, #122129);font-weight:600;font-size:14px;font-family:var(--font-ui, Inter, sans-serif);cursor:pointer;transition:all .2s;';
    resendBtn.addEventListener('click', () => handleResendCode(email, resendBtn, status));

    panel.append(msg, emailHint, codeInput, status, verifyBtn, resendBtn);

    // El código es numérico (hasta 8 dígitos)
    codeInput.addEventListener('input', () => {
        codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 8);
    });

    attachVerifySubmitHandler(panel, { email, codeInput, status, verifyBtn, onVerified });

    // El primer envío ya ocurrió (al registrarse): arrancar el cooldown de 60s
    startResendCooldown(resendBtn);

    return panel;
}

function attachVerifySubmitHandler(panel, { email, codeInput, status, verifyBtn, onVerified }) {
    panel.addEventListener('submit', async (event) => {
        event.preventDefault();

        const code = codeInput.value.trim();
        if (!code) {
            setVerifyStatus(status, 'Ingresa el código de verificación.', 'error');
            return;
        }

        verifyBtn.disabled = true;
        verifyBtn.style.opacity = '0.6';
        setVerifyStatus(status, 'Verificando código...', 'info');

        try {
            const { data, error } = await supabase.auth.verifyOTP({
                email,
                token: code,
                type: 'signup'
            });

            if (error) {
                console.error('❌ Error verificando código:', error.message);
                verifyBtn.disabled = false;
                verifyBtn.style.opacity = '';
                setVerifyStatus(status, 'Código incorrecto o vencido', 'error');
                return;
            }

            console.log('✅ Email verificado, sesión activa');
            setVerifyStatus(status, '¡Correo verificado! Continuando...', 'ok');
            onVerified(data);
        } catch (err) {
            console.error('❌ Error:', err);
            verifyBtn.disabled = false;
            verifyBtn.style.opacity = '';
            setVerifyStatus(status, 'Código incorrecto o vencido', 'error');
        }
    });
}

async function handleResendCode(email, resendBtn, status) {
    // Cooldown inmediato: 60s de espera tras cada envío
    startResendCooldown(resendBtn);

    try {
        console.log('📨 Reenviando código de confirmación a:', email);
        const { error } = await supabase.auth.resend({ type: 'signup', email });

        if (error) {
            console.error('❌ Error reenviando código:', error.message);
            setVerifyStatus(status, 'No se pudo reenviar el código. Intenta de nuevo en un momento.', 'error');
            return;
        }

        console.log('✅ Código reenviado');
        setVerifyStatus(status, 'Código reenviado. Revisa tu correo.', 'ok');
    } catch (err) {
        console.error('❌ Error:', err);
        setVerifyStatus(status, 'No se pudo reenviar el código. Intenta de nuevo en un momento.', 'error');
    }
}

function startResendCooldown(resendBtn) {
    if (resendBtn._cooldownTimer) {
        clearInterval(resendBtn._cooldownTimer);
        resendBtn._cooldownTimer = null;
    }

    const label = 'Reenviar código';
    let seconds = RESEND_COOLDOWN_SECONDS;
    resendBtn.disabled = true;
    resendBtn.style.opacity = '0.55';
    resendBtn.textContent = label + ' (' + seconds + 's)';

    resendBtn._cooldownTimer = setInterval(() => {
        seconds--;
        if (seconds > 0) {
            resendBtn.textContent = label + ' (' + seconds + 's)';
        } else {
            clearInterval(resendBtn._cooldownTimer);
            resendBtn._cooldownTimer = null;
            resendBtn.disabled = false;
            resendBtn.style.opacity = '';
            resendBtn.textContent = label;
        }
    }, 1000);
}

function setVerifyStatus(el, message, type) {
    el.textContent = message;
    el.style.color = type === 'error' ? '#dc2626' : (type === 'ok' ? '#059669' : '');
}

export async function checkUserLoggedIn() {
    try {
        const currentPath = window.location.pathname;
        
        // ✅ PÁGINAS PÚBLICAS (sin protección de autenticación)
        const publicPages = ['index.html', 'resultados.html', 'detalle-producto.html', '/', '/index.html', '/privacidad.html', '/terminos.html'];
        // Minúsculas, sin barra final ni .html; '/' solo coincide con la raíz
        const normalizePath = p => p.toLowerCase().replace(/\/+$/, '').replace(/\.html$/, '') || '/';
        const normalizedPath = normalizePath(currentPath);
        const isPublicPage = publicPages.some(page => {
            const normalizedPage = normalizePath(page);
            return normalizedPage === '/'
                ? normalizedPath === '/'
                : normalizedPath === normalizedPage || normalizedPath.endsWith('/' + normalizedPage.replace(/^\//, ''));
        });
        
        // ✅ Si es página pública, permitir acceso sin login
        if (isPublicPage) {
            return;
        }
        
        // ✅ Si es página de autenticación, no redirigir
        if (currentPath.includes('login.html') || currentPath.includes('registro.html') || currentPath.includes('forgot-password.html') || currentPath.includes('reset-password.html')) {
            return;
        }

        // ✅ Para páginas protegidas (publicar, editar, panel, dashboard), verificar sesión
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.log("⚠️ Sin sesión en página protegida, redirigiendo a login...");
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

// ==========================================
// FUNCIÓN DE LOGIN CON GOOGLE
// ==========================================
async function signInWithGoogle() {
    console.log('🔐 Iniciando login con Google...');
    
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/index.html'
            }
        });

        if (error) {
            console.error('❌ Error al conectar con Google:', error.message);
            alert('Error al iniciar sesión con Google: ' + error.message);
        }
    } catch (err) {
        console.error('❌ Error:', err);
        alert('Error: ' + (err.message || 'Desconocido'));
    }
}

// Conectar el botón de Google cuando se carga la página
function setupGoogleButton() {
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        console.log('✅ Botón de Google encontrado, conectando...');
        googleBtn.addEventListener('click', signInWithGoogle);
    }
}

// Exportar la función para usarla en otros lugares
export { signInWithGoogle };
