// eliminar-cuenta-logic.js — Eliminación de cuenta desde la web.
// Mismo flujo que la app (AccountService): lista archivos de Storage,
// RPC mc_eliminar_mi_cuenta (migración 0007), borra archivos y cierra sesión.
import { supabase } from './supabase-client.js';

const BUCKET = 'imagenes_anuncios';

const guest = document.getElementById('del-guest');
const form = document.getElementById('del-form');
const input = document.getElementById('del-confirm');
const btn = document.getElementById('del-go');
const msg = document.getElementById('del-msg');

function say(text, ok) {
    msg.textContent = text;
    msg.className = 'del-msg ' + (ok ? 'ok' : 'err');
}

// Rutas de todos los archivos bajo {userId}/ (hasta 2 niveles de carpetas).
async function listarArchivos(uid) {
    const bucket = supabase.storage.from(BUCKET);
    const rutas = [];
    async function recorrer(carpeta, nivel) {
        const { data, error } = await bucket.list(carpeta, { limit: 1000 });
        if (error || !data) return;
        for (const it of data) {
            const ruta = carpeta + '/' + it.name;
            if (it.id === null || it.id === undefined) {
                if (nivel < 2) await recorrer(ruta, nivel + 1);
            } else {
                rutas.push(ruta);
            }
        }
    }
    await recorrer(uid, 0);
    return rutas;
}

async function borrarArchivos(rutas) {
    for (let i = 0; i < rutas.length; i += 100) {
        await supabase.storage.from(BUCKET).remove(rutas.slice(i, i + 100));
    }
}

async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        guest.style.display = 'block';
        return;
    }
    form.style.display = 'block';
    document.getElementById('del-email').textContent = session.user.email || '';

    // En inglés la palabra visible es DELETE (i18n traduce ELIMINAR), así que
    // se aceptan ambas.
    const validar = () => {
        btn.disabled = !['ELIMINAR', 'DELETE'].includes(input.value.trim().toUpperCase());
    };
    input.addEventListener('input', validar);
    input.addEventListener('change', validar);
    input.addEventListener('keyup', validar);

    // El navegador a veces autocompleta este campo con el correo de la cuenta y
    // eso NO dispara 'input'. Se vacía al cargar y de nuevo tras el autocompletado.
    const vaciar = () => {
        if (!['ELIMINAR', 'DELETE'].includes(input.value.trim().toUpperCase())) input.value = '';
        validar();
    };
    vaciar();
    setTimeout(vaciar, 300);
    setTimeout(vaciar, 1200);

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        input.disabled = true;
        say('Eliminando tu cuenta…', true);
        try {
            let archivos = [];
            try { archivos = await listarArchivos(session.user.id); } catch (e) { archivos = []; }

            const { error } = await supabase.rpc('mc_eliminar_mi_cuenta');
            if (error) throw error;

            try { await borrarArchivos(archivos); } catch (e) { /* huérfanos: no bloquea */ }
            try { await supabase.auth.signOut(); } catch (e) { /* la sesión ya no existe */ }

            form.style.display = 'none';
            guest.style.display = 'block';
            guest.innerHTML = '<p><strong>Tu cuenta fue eliminada.</strong> Gracias por haber usado Mercados Central.</p>' +
                '<a class="del-btn" style="display:inline-block;text-decoration:none" href="index.html">Ir al inicio</a>';
        } catch (e) {
            console.error('Eliminar cuenta:', e);
            say('No se pudo eliminar tu cuenta. Intenta de nuevo o escríbenos a administrador@mercadoscentral.com.', false);
            btn.disabled = false;
            input.disabled = false;
        }
    });
}

init();
