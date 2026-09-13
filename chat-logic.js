// chat-logic.js — Fase 4: chat interno cliente ↔ vendedor
import { supabase } from './supabase-client.js';

/**
 * Busca una conversación existente o la crea.
 * Única por (anuncio_id + comprador_id) — el unique de la tabla lo garantiza.
 */
export async function getOrCreateConversation(anuncioId, vendedorId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('NO_AUTH');
    if (user.id === vendedorId) throw new Error('SELF_CHAT');

    // ¿Ya existe una conversación para este anuncio y comprador?
    const { data: existing } = await supabase
        .from('conversaciones')
        .select('id')
        .eq('anuncio_id', anuncioId)
        .eq('comprador_id', user.id)
        .maybeSingle();

    if (existing) return existing.id;

    // Crearla
    const { data: created, error } = await supabase
        .from('conversaciones')
        .insert({ anuncio_id: anuncioId, comprador_id: user.id, vendedor_id: vendedorId })
        .select('id')
        .single();

    if (error) {
        // Si dos pestañas la crearon a la vez, reintentar la lectura
        const { data: retry } = await supabase
            .from('conversaciones')
            .select('id')
            .eq('anuncio_id', anuncioId)
            .eq('comprador_id', user.id)
            .maybeSingle();
        if (retry) return retry.id;
        throw error;
    }
    return created.id;
}

/** Inserta un mensaje y devuelve la fila real (con su ID) para deduplicar. */
export async function sendMessage(conversacionId, contenido) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('NO_AUTH');

    const { data, error } = await supabase
        .from('mensajes')
        .insert({
            conversacion_id: conversacionId,
            emisor_id: user.id,
            contenido: contenido.trim()
        })
        .select('id, emisor_id, contenido, created_at')
        .single();
    if (error) throw error;

    // Actualizar el timestamp de la conversación (para ordenar el buzón)
    await supabase
        .from('conversaciones')
        .update({ ultimo_mensaje_at: new Date().toISOString() })
        .eq('id', conversacionId);

    return data;
}

/**
 * Conecta el formulario del detalle: crea conversación + primer mensaje
 * y redirige al panel para continuar el chat.
 */
export function initDetailChatForm(ad) {
    const form = document.getElementById('contact-form');
    if (!form || form.dataset.chatBound) return;
    form.dataset.chatBound = 'true';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('message-input');
        const texto = input?.value.trim();
        if (!texto) return;

        const btn = form.querySelector('.btn-send-msg');
        const original = btn?.textContent || 'Enviar mensaje';
        if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }

        try {
            const convId = await getOrCreateConversation(ad.id, ad.user_id);
            await sendMessage(convId, texto);
            window.location.href = `panel-unificado.html?chat=${convId}`;
        } catch (err) {
            if (err.message === 'NO_AUTH') {
                // Sin sesión: login y volver aquí después
                window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            } else if (err.message === 'SELF_CHAT') {
                alert('Este es tu propio anuncio 🙂');
                if (btn) { btn.disabled = false; btn.textContent = original; }
            } else {
                console.error('Error enviando mensaje:', err);
                alert('No se pudo enviar el mensaje. Intenta de nuevo.');
                if (btn) { btn.disabled = false; btn.textContent = original; }
            }
        }
    });
}