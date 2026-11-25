/**
 * i18n.js — Mercados Central: idioma Español / English en tiempo de ejecución.
 *
 * CÓMO FUNCIONA
 *  - El sitio sigue escrito en español (idioma base). Si el usuario elige inglés,
 *    este motor traduce el DOM usando los diccionarios de i18n/en-*.js
 *    (clave = texto original en español, valor = inglés).
 *  - Un MutationObserver traduce también lo que el JavaScript genera después
 *    (tarjetas, modales, formularios dinámicos, alert/confirm, etc.).
 *  - El idioma se guarda en localStorage ('mc_lang'). También acepta ?lang=en|es.
 *  - El selector se inyecta en #nav-slot-language (espacio que ya existía en el navbar).
 *
 * LO QUE NO SE TRADUCE (a propósito)
 *  - Contenido escrito por usuarios (títulos, descripciones, reseñas, chat, nombres).
 *    Ver SKIP_SELECTOR, o marca cualquier elemento con data-no-i18n / translate="no".
 *  - Los VALORES de <option> y de la base de datos siguen en español; solo cambia el
 *    texto visible. Para leer el texto original de un <option>: window.mcI18n.optText(opt).
 *
 * API: window.mcI18n = { lang, setLang(l), t(texto), optText(option) }
 *      evento document 'mc:langchange' ({detail:{lang}}); window.mcLang = 'es' | 'en'
 */
(function () {
    'use strict';
    if (window.mcI18n) return;

    var KEY = 'mc_lang';
    var SUPPORTED = ['es', 'en'];
    var VER = '2';
    var PARTS = ['en-core', 'en-ads', 'en-forms', 'en-account', 'en-legal', 'en-patterns'];

    // Carpeta del script (para cargar i18n/*.js desde el mismo sitio)
    var BASE = '';
    try {
        var cs = document.currentScript;
        if (cs && cs.src) BASE = cs.src.replace(/[^\/]*(\?.*)?$/, '');
    } catch (e) { /* rutas relativas */ }

    // Elementos cuyo CONTENIDO de texto no se traduce (código / valores escritos por el usuario)
    var SKIP_TAGS = 'script,style,noscript,textarea,code,pre';
    // Zonas con contenido de usuarios: ni su texto ni sus atributos se traducen
    var SKIP_USER = [
        '[data-no-i18n]', '[translate="no"]', '.notranslate', '.reviewer-name',
        '.mc-card-titulo', '.property-title', '.elite-banner-title',
        '#product-name', '#product-description', '.review-comment',
        '.chat-bubble', '.conv-ad-title', '.dashboard-ad-title', '.description',
        '#perfil-nombre', '.seller-line', '.sg-title'
    ].join(',');
    var SKIP_SELECTOR = SKIP_TAGS + ',' + SKIP_USER;
    // Marcadores de carga que viven dentro de zonas protegidas: sí se traducen
    var LOADING = /^\s*Cargando/;

    var ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
    var META_OK = /^(description|og:title|og:description|twitter:title|twitter:description)$/;

    /* ------------------------------ estado ------------------------------ */
    var lang = 'es';
    var dict = { en: {} };
    var lower = { en: {} };
    var patterns = { en: [] };
    var ready = false;
    var loading = false;
    var waiters = [];
    var textRec = new WeakMap();   // nodo de texto -> {orig,out}
    var attrRec = new WeakMap();   // elemento -> { attr: {orig,out} }
    var observer = null;

    function readStored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
    function storeLang(l) { try { localStorage.setItem(KEY, l); } catch (e) { /* modo privado */ } }

    (function detect() {
        var fromUrl = null;
        try { fromUrl = new URLSearchParams(location.search).get('lang'); } catch (e) { /* ignore */ }
        if (fromUrl && SUPPORTED.indexOf(fromUrl) !== -1) { lang = fromUrl; storeLang(lang); return; }
        var s = readStored();
        if (s && SUPPORTED.indexOf(s) !== -1) lang = s;
    })();
    window.mcLang = lang;

    /* ------------------------- registro de diccionarios ------------------------- */
    window.mcI18nAdd = function (l, obj) {
        var d = dict[l] || (dict[l] = {});
        var lw = lower[l] || (lower[l] = {});
        for (var k in obj) {
            if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
            d[k] = obj[k];
            var lk = k.toLowerCase();
            if (!Object.prototype.hasOwnProperty.call(lw, lk)) lw[lk] = obj[k];
        }
    };
    window.mcI18nPattern = function (l, re, fn) {
        (patterns[l] || (patterns[l] = [])).push([re, fn]);
    };

    /* ------------------------------ traducción ------------------------------ */
    function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
    function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

    function lookup(key) {
        var d = dict.en;
        if (has(d, key)) return d[key];
        var ps = patterns.en;
        for (var i = 0; i < ps.length; i++) {
            var m = ps[i][0].exec(key);
            if (m) {
                var r = ps[i][1](m, tCore);
                if (r !== null && r !== undefined) return r;
            }
        }
        var lk = key.toLowerCase();
        if (has(lower.en, lk)) {
            var v = lower.en[lk];
            if (key === key.toUpperCase() && key !== lk) return v.toUpperCase();
            return v;
        }
        return null;
    }

    // Traduce un fragmento sin espacios en los bordes. Devuelve null si no hay traducción.
    function tCore(core) {
        var key = norm(core);
        if (!key) return null;
        var r = lookup(key);
        if (r !== null) return r;

        // Prefijo de símbolos/emoji (✓ ⚠️ ❌ …)
        var pm = key.match(/^([^\p{L}\p{N}¿¡"“(\[]+)([\s\S]+)$/u);
        if (pm) {
            r = lookup(norm(pm[2]));
            if (r !== null) return pm[1] + r;
        }

        // Puntuación final (":" "..." "…" ".")
        var tm = key.match(/^([\s\S]*?[^\s:.…])(\s*(?::|\.\.\.|…|\.)+)$/);
        if (tm) {
            r = lookup(tm[1]);
            if (r !== null) return r + tm[2];
        }

        // "Etiqueta: mensaje"
        var ci = key.indexOf(': ');
        if (ci > 0) {
            var left = lookup(key.slice(0, ci));
            if (left !== null) {
                var right = lookup(key.slice(ci + 2));
                return left + ': ' + (right !== null ? right : key.slice(ci + 2));
            }
        }
        return null;
    }

    function tString(s) {
        if (typeof s !== 'string' || !s) return s;
        var m = s.match(/^(\s*)([\s\S]*?)(\s*)$/);
        if (!m || !m[2]) return s;
        var r = tCore(m[2]);
        return r === null ? s : m[1] + r + m[3];
    }

    function tMulti(s) {
        if (typeof s !== 'string' || s.indexOf('\n') === -1) return tString(s);
        return s.split('\n').map(function (ln) { return ln ? tString(ln) : ln; }).join('\n');
    }

    /* ------------------------------ DOM: texto ------------------------------ */
    function inSkip(el) {
        return !!(el && el.closest && el.closest(SKIP_SELECTOR));
    }
    // Para atributos: un <textarea>/<code> sí puede tener placeholder/title traducible
    function inSkipUser(el) {
        return !!(el && el.closest && el.closest(SKIP_USER));
    }

    function processText(n) {
        var rec = textRec.get(n);
        if (rec && n.nodeValue === rec.out) {
            if (lang === 'es') {
                n.nodeValue = rec.orig;
                textRec.delete(n);
                var po = n.parentNode;
                if (po && po.nodeName === 'OPTION') po.removeAttribute('data-es');
            }
            return;
        }
        if (rec) textRec.delete(n);

        var parent = n.parentNode;
        if (parent && parent.nodeName === 'OPTION') parent.removeAttribute('data-es'); // texto nuevo: el dato viejo ya no vale
        if (lang !== 'en' || !ready) return;
        if (!parent) return;
        var orig = n.nodeValue;
        if (inSkip(parent.nodeType === 1 ? parent : parent.parentElement) && !LOADING.test(orig)) return;
        var out = tString(orig);
        if (out === orig) return;
        n.nodeValue = out;
        textRec.set(n, { orig: orig, out: out });
        if (parent.nodeName === 'OPTION') parent.setAttribute('data-es', norm(orig));
    }

    function walkText(root) {
        if (root.nodeType === 3) { processText(root); return; }
        var tw = document.createTreeWalker(root, 4 /* SHOW_TEXT */, {
            acceptNode: function (node) {
                var p = node.parentNode;
                if (!p) return 2;
                var nn = p.nodeName;
                if (nn === 'SCRIPT' || nn === 'STYLE' || nn === 'NOSCRIPT' || nn === 'TEXTAREA') return 2;
                return 1;
            }
        });
        var list = [], cur;
        while ((cur = tw.nextNode())) list.push(cur);
        for (var i = 0; i < list.length; i++) processText(list[i]);
    }

    /* ---------------------------- DOM: atributos ---------------------------- */
    function attrApplies(el, a) {
        if (a === 'content') {
            if (el.nodeName !== 'META') return false;
            var nm = el.getAttribute('name') || el.getAttribute('property') || '';
            return META_OK.test(nm);
        }
        if (a === 'value') {
            return el.nodeName === 'INPUT' && /^(submit|button)$/i.test(el.getAttribute('type') || '');
        }
        return true;
    }

    function processAttr(el, a) {
        if (!attrApplies(el, a) || !el.hasAttribute(a)) return;
        var recs = attrRec.get(el);
        var rec = recs && recs[a];
        var cur = el.getAttribute(a);
        if (rec && cur === rec.out) {
            if (lang === 'es') { el.setAttribute(a, rec.orig); delete recs[a]; }
            return;
        }
        if (rec) delete recs[a];
        if (lang !== 'en' || !ready) return;
        if (a !== 'content' && inSkipUser(el)) return;
        var out = tString(cur);
        if (out === cur) return;
        el.setAttribute(a, out);
        if (!recs) { recs = {}; attrRec.set(el, recs); }
        recs[a] = { orig: cur, out: out };
    }

    function processElAttrs(el) {
        var all = ATTRS.concat(['content', 'value']);
        for (var i = 0; i < all.length; i++) processAttr(el, all[i]);
    }

    var ATTR_SELECTOR = '[placeholder],[title],[aria-label],[alt],meta[content],input[type="submit"],input[type="button"]';

    function walkAttrs(root) {
        if (root.nodeType !== 1 && root.nodeType !== 9) return;
        if (root.nodeType === 1) processElAttrs(root);
        var els = root.querySelectorAll(ATTR_SELECTOR);
        for (var i = 0; i < els.length; i++) processElAttrs(els[i]);
    }

    function processTree(root) {
        walkText(root);
        walkAttrs(root);
    }

    function applyAll() {
        var rootEl = document.documentElement;
        if (!rootEl) return;
        rootEl.setAttribute('lang', lang);
        processTree(rootEl);
    }

    /* ----------------------------- selector de idioma ----------------------------- */
    var STYLE_ID = 'mc-i18n-style';
    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        var st = document.createElement('style');
        st.id = STYLE_ID;
        st.textContent =
            // El selector vive siempre dentro del menú hamburguesa (laptop y móvil)
            '#mc-lang-select{width:100%;height:46px;border:1.5px solid var(--line,#E8ECEF);border-radius:10px;background:#fff;' +
            'color:var(--ink-700,#31413D);font-weight:600;font-size:15px;padding:0 14px;cursor:pointer}' +
            '#mc-lang-select:hover{border-color:var(--ink-300,#9AA7A2)}';
        (document.head || document.documentElement).appendChild(st);
    }

    function ensureSelector() {
        var slots = document.querySelectorAll('[data-slot="language"]');
        for (var i = 0; i < slots.length; i++) {
            var slot = slots[i];
            if (slot.querySelector('#mc-lang-select')) continue;
            injectStyle();
            var sel = document.createElement('select');
            sel.id = 'mc-lang-select';
            sel.setAttribute('aria-label', 'Idioma');
            sel.setAttribute('title', 'Idioma');
            sel.innerHTML = '<option value="es">Español</option><option value="en">English</option>';
            sel.value = lang;
            sel.addEventListener('change', function (e) { setLang(e.target.value); });
            slot.appendChild(sel);
        }
    }

    function syncSelectors() {
        var sels = document.querySelectorAll('#mc-lang-select');
        for (var i = 0; i < sels.length; i++) if (sels[i].value !== lang) sels[i].value = lang;
    }

    /* ------------------------------ carga de diccionarios ------------------------------ */
    function loadDict(cb) {
        if (ready) { cb(); return; }
        waiters.push(cb);
        if (loading) return;
        loading = true;
        var pending = PARTS.length;
        PARTS.forEach(function (p) {
            var s = document.createElement('script');
            s.async = false; // ejecutar en orden: si una clave se repite, gana el diccionario posterior
            s.src = BASE + 'i18n/' + p + '.js?v=' + VER;
            var done = function () {
                if (--pending === 0) {
                    ready = true;
                    loading = false;
                    var w = waiters.slice();
                    waiters.length = 0;
                    w.forEach(function (f) { f(); });
                }
            };
            s.onload = done;
            s.onerror = function () { console.warn('i18n: no se pudo cargar', p); done(); };
            (document.head || document.documentElement).appendChild(s);
        });
    }

    /* ------------------------------ cambio de idioma ------------------------------ */
    function setLang(l) {
        if (SUPPORTED.indexOf(l) === -1) return;
        var changed = l !== lang;
        lang = l;
        window.mcLang = l;
        storeLang(l);
        document.documentElement.setAttribute('lang', l);
        syncSelectors();
        var after = function () {
            applyAll();
            if (changed) {
                try { document.dispatchEvent(new CustomEvent('mc:langchange', { detail: { lang: l } })); } catch (e) { /* ignore */ }
            }
        };
        if (l === 'en') loadDict(after); else after();
    }

    /* ----------------------- alert / confirm traducidos ----------------------- */
    ['alert', 'confirm'].forEach(function (name) {
        var orig = window[name];
        if (typeof orig !== 'function') return;
        window[name] = function (msg) {
            var args = Array.prototype.slice.call(arguments);
            if (lang === 'en' && ready && typeof msg === 'string') args[0] = tMulti(msg);
            return orig.apply(window, args);
        };
    });

    /* ------------------------------ observer ------------------------------ */
    function onMutations(list) {
        var needSel = false;
        for (var i = 0; i < list.length; i++) {
            var m = list[i];
            if (m.type === 'childList') {
                for (var j = 0; j < m.addedNodes.length; j++) {
                    var nd = m.addedNodes[j];
                    if (nd.nodeType === 1 || nd.nodeType === 3) {
                        if (lang === 'en') processTree(nd);
                        if (nd.nodeType === 1) needSel = true;
                    }
                }
            } else if (m.type === 'characterData') {
                if (lang === 'en') processText(m.target);
            } else if (m.type === 'attributes') {
                if (lang === 'en' && m.target.nodeType === 1) processAttr(m.target, m.attributeName);
            }
        }
        if (needSel) ensureSelector();
    }

    function startObserver() {
        if (observer || !document.documentElement) return;
        observer = new MutationObserver(onMutations);
        observer.observe(document.documentElement, {
            childList: true, subtree: true, characterData: true,
            attributes: true, attributeFilter: ATTRS.concat(['content', 'value'])
        });
    }

    /* ------------------------------ API pública ------------------------------ */
    function optText(o) {
        if (!o) return '';
        return (o.getAttribute && o.getAttribute('data-es')) || o.text || o.textContent || '';
    }

    window.mcI18n = {
        get lang() { return lang; },
        setLang: setLang,
        t: tString,
        optText: optText
    };

    /* ------------------------------ arranque ------------------------------ */
    startObserver();
    document.documentElement.setAttribute('lang', lang);

    function boot() {
        ensureSelector();
        if (lang === 'en') loadDict(applyAll);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
    // Si ya es inglés, empezar a descargar el diccionario sin esperar al DOMContentLoaded
    if (lang === 'en') loadDict(function () { if (document.readyState !== 'loading') applyAll(); });
})();
