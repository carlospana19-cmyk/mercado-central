// search-global.js — Buscador global (navbar inyectado dinámicamente)
import { supabase } from './supabase-client.js';

function bind(input, box) {
    if (!input || !box || input.dataset.bound) return;
    input.dataset.bound = 'true';
    let t = null;
    input.addEventListener('input', () => {
        clearTimeout(t);
        const q = input.value.trim();
        if (q.length < 2) { box.classList.remove('open'); box.innerHTML = ''; return; }
        t = setTimeout(async () => {
            const qSin = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const { data } = await supabase.from('anuncios')
                .select('id, titulo, precio, url_portada, url_galeria, categoria, provincia, distrito')
                .limit(100);
            const filtrados = (data || []).filter(a => {
                const texto = [a.titulo, a.categoria, a.provincia, a.distrito]
                    .filter(Boolean).join(' ')
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .toLowerCase();
                return texto.includes(qSin);
            }).slice(0, 6);
            if (!filtrados.length) {
                box.innerHTML = '<div class="sg-empty">Sin resultados</div>';
                box.classList.add('open'); return;
            }
            box.innerHTML = filtrados.map(a => {
                const img = a.url_portada || (Array.isArray(a.url_galeria) && a.url_galeria[0]) || 'img/placeholder.jpg';
                return `<div class="sg-item" data-id="${a.id}">
                    <img src="${img}" alt="" onerror="this.style.display='none'">
                    <div class="sg-info"><span class="sg-title">${a.titulo}</span>
                    <span class="sg-price">${a.precio ? 'B/. ' + Number(a.precio).toLocaleString('es-PA') : (a.provincia || '')}</span></div>
                </div>`;
            }).join('');
            box.classList.add('open');
            box.querySelectorAll('.sg-item').forEach(el =>
                el.addEventListener('click', () => window.location.href = `detalle-producto.html?id=${el.dataset.id}`));
        }, 300);
    });
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') window.location.href = input.value.trim() ? 'resultados.html?q=' + encodeURIComponent(input.value.trim()) : 'resultados.html';
    });
    const btn = input.parentElement.querySelector('.btn-search-hero');
    if (btn) btn.addEventListener('click', () => {
        window.location.href = input.value.trim() ? 'resultados.html?q=' + encodeURIComponent(input.value.trim()) : 'resultados.html';
    });
    document.addEventListener('click', e => {
        if (!input.contains(e.target) && !box.contains(e.target)) box.classList.remove('open');
    });
}

let intentos = 0;
function init() {
    const input = document.getElementById('mainSearchInput');
    const box = document.getElementById('search-suggest');
    if (input && box) {
        bind(input, box);
    } else if (intentos < 40) {
        intentos++;
        setTimeout(init, 250);
    }
}
document.addEventListener('navbarLoaded', () => setTimeout(init, 100));
init();