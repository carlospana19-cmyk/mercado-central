// messages-logic.js — Fase 4C: buzón + chat en vivo dentro del panel
import { supabase } from './supabase-client.js';
import { sendMessage } from './chat-logic.js';

let me = null;
let conversations = [];
let currentConvId = null;
let channelConv = null, channelGlobal = null;
const PLACEHOLDER = 'img/placeholder.jpg';

const esc = s => { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; };
const otherOf = c => c.comprador_id === me.id ? c.vendedor : c.comprador;
const nameOf = c => { const o = otherOf(c); return o?.nombre_negocio || o?.nombre_completo || 'Usuario'; };
const adImgOf = c => c.anuncios?.url_portada || (Array.isArray(c.anuncios?.url_galeria) && c.anuncios.url_galeria[0]) || PLACEHOLDER;

const CONV_SELECT = `
  id, anuncio_id, comprador_id, vendedor_id, ultimo_mensaje_at,
  anuncios(titulo, url_portada, url_galeria),
  comprador:profiles!conversaciones_comprador_id_fkey(nombre_negocio, nombre_completo, url_foto_perfil),
  vendedor:profiles!conversaciones_vendedor_id_fkey(nombre_negocio, nombre_completo, url_foto_perfil)
`;

export async function initMessagesSection(){
  if(!document.getElementById('convs-list')) return;
  const { data:{ user } } = await supabase.auth.getUser();
  if(!user) return;
  me = user;

  bindChatForm();
  await loadConversations();
  subscribeGlobal();

  // Deep-link: panel-unificado.html?chat=<id>
  const target = new URLSearchParams(window.location.search).get('chat');
  if(target){
    document.querySelector('.tab-btn[data-tab="mensajes"]')?.click();
    openConversation(target);
  }
}

async function loadConversations(){
  const listEl = document.getElementById('convs-list');
  const { data, error } = await supabase
    .from('conversaciones')
    .select(CONV_SELECT)
    .or(`comprador_id.eq.${me.id},vendedor_id.eq.${me.id}`)
    .order('ultimo_mensaje_at', { ascending:false })
    .limit(50);

  if(error){ console.error('Error cargando conversaciones:', error); listEl.innerHTML = '<p class="chat-loading">Error al cargar conversaciones.</p>'; return; }
  conversations = data || [];

  // Conteo de no leídos por conversación
  const unreadMap = {};
  if(conversations.length){
    const { data: unread } = await supabase
      .from('mensajes')
      .select('conversacion_id')
      .in('conversacion_id', conversations.map(c=>c.id))
      .eq('leido', false)
      .neq('emisor_id', me.id);
    (unread||[]).forEach(m=>{ unreadMap[m.conversacion_id]=(unreadMap[m.conversacion_id]||0)+1; });
  }

  if(!conversations.length){
    listEl.innerHTML = `<div class="convs-empty"><i class="fas fa-comments"></i>
      <p>Aún no tienes conversaciones</p>
      <span>Cuando alguien se interese por un anuncio tuyo —o tú por uno— el chat aparecerá aquí.</span></div>`;
    return;
  }

  listEl.innerHTML = conversations.map(c=>{
    const n = unreadMap[c.id]||0;
    return `<button class="conv-item ${c.id===currentConvId?'active':''}" data-conv="${c.id}">
      <img class="conv-ad-img" src="${adImgOf(c)}" alt="" onerror="this.src='${PLACEHOLDER}'">
      <div class="conv-info">
        <span class="conv-name">${esc(nameOf(c))}</span>
        <span class="conv-ad-title">${esc(c.anuncios?.titulo||'Anuncio')}</span>
      </div>
      ${n?`<span class="conv-unread">${n}</span>`:''}
    </button>`;
  }).join('');

  listEl.querySelectorAll('.conv-item').forEach(btn=>{
    btn.addEventListener('click', ()=> openConversation(btn.dataset.conv));
  });
}

async function openConversation(convId){
  let conv = conversations.find(c=>c.id===convId);
  if(!conv){
    const { data } = await supabase.from('conversaciones').select(CONV_SELECT).eq('id',convId).maybeSingle();
    if(!data) return;
    conversations.push(data); conv = data;
  }
  currentConvId = convId;

  document.getElementById('messages-layout').classList.add('chat-open');
  document.getElementById('chat-empty').style.display = 'none';
  document.getElementById('chat-active').style.display = 'flex';

  const other = otherOf(conv);
  const avatar = other?.url_foto_perfil;
  document.getElementById('chat-header').innerHTML = `
    <button class="chat-back" id="chat-back" aria-label="Volver"><i class="fas fa-arrow-left"></i></button>
    ${avatar?`<img class="chat-avatar" src="${avatar}" alt="">`:`<span class="chat-avatar chat-avatar-ph"><i class="fas fa-user"></i></span>`}
    <div class="chat-header-info">
      <strong>${esc(nameOf(conv))}</strong>
      <span>${esc(conv.anuncios?.titulo||'')}</span>
    </div>`;
  document.getElementById('chat-back').addEventListener('click', ()=>{
    document.getElementById('messages-layout').classList.remove('chat-open');
  });

  document.querySelectorAll('.conv-item').forEach(b=>b.classList.toggle('active', b.dataset.conv===convId));
  await loadMessages(convId);
  subscribeConversation(convId);
}

async function loadMessages(convId){
  const box = document.getElementById('chat-messages');
  box.innerHTML = '<p class="chat-loading">Cargando mensajes…</p>';
  const { data, error } = await supabase
    .from('mensajes')
    .select('id, emisor_id, contenido, created_at')
    .eq('conversacion_id', convId)
    .order('created_at', { ascending:true })
    .limit(200);
  if(error){ box.innerHTML = '<p class="chat-loading">Error al cargar mensajes.</p>'; return; }
  box.innerHTML = '';
  (data||[]).forEach(appendMessage);
  box.scrollTop = box.scrollHeight;
  // Marcar como leídos los que me llegaron
  supabase.from('mensajes')
    .update({ leido:true })
    .eq('conversacion_id', convId)
    .eq('leido', false)
    .neq('emisor_id', me.id)
    .then(()=> loadConversations());
}

function appendMessage(msg){
  const box = document.getElementById('chat-messages');
  if(box.querySelector(`[data-msg-id="${msg.id}"]`)) return; // anti-duplicado
  const mine = msg.emisor_id === me.id;
  const el = document.createElement('div');
  el.className = 'chat-bubble-row ' + (mine ? 'mine' : 'theirs');
  el.dataset.msgId = msg.id;
  const time = new Date(msg.created_at).toLocaleTimeString('es-PA', { hour:'2-digit', minute:'2-digit' });
  el.innerHTML = `<div class="chat-bubble">${esc(msg.contenido)}<span class="chat-time">${time}</span></div>`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function subscribeConversation(convId){
  if(channelConv) supabase.removeChannel(channelConv);
  channelConv = supabase.channel('conv-'+convId)
    .on('postgres_changes',
      { event:'INSERT', schema:'public', table:'mensajes', filter:`conversacion_id=eq.${convId}` },
      payload => appendMessage(payload.new))
    .subscribe();
}

function subscribeGlobal(){
  if(channelGlobal) return;
  channelGlobal = supabase.channel('mc-buzon')
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'mensajes' }, payload => {
      // Mensaje en otra conversación → refrescar lista (badges y orden)
      if(payload.new.conversacion_id !== currentConvId) loadConversations();
    })
    .on('postgres_changes', { event:'UPDATE', schema:'public', table:'conversaciones' }, () => loadConversations())
    .subscribe();
}

function bindChatForm(){
  const form = document.getElementById('chat-form');
  if(!form || form.dataset.bound) return;
  form.dataset.bound = 'true';
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if(!text || !currentConvId) return;
    input.value = '';
    try{
      const msg = await sendMessage(currentConvId, text);
      appendMessage(msg); // ID real de la BD → el anti-duplicados reconoce el del Realtime
      loadConversations();
    }catch(err){
      console.error('Error enviando:', err);
      alert('No se pudo enviar el mensaje.');
    }
  });
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initMessagesSection);
}else{
  initMessagesSection();
}