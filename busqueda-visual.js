// ============================================================
//  MercadosCentral · Búsqueda por foto  (busqueda-visual.js)
// ------------------------------------------------------------
//  Agrega el ícono de cámara al buscador del inicio. El usuario
//  sube o toma una foto, una Edge Function de Supabase la analiza
//  con OpenAI (gpt-4o-mini) y el resultado rellena el buscador
//  y dispara la búsqueda normal del sitio (#searchButton).
//
//  NO toca main.js: reutiliza los IDs que ya existen
//  (#mainSearchInput, #categorySelect, #searchButton).
//
//  INSTALACIÓN:
//  1) Edita SUPABASE_URL y SUPABASE_ANON_KEY (Paso 3 del LEEME).
//  2) Sube este archivo a la raíz del sitio (junto a index.html).
//  3) Pega el snippet de snippet-index.html en tu index.html.
// ============================================================

(function () {
  "use strict";

  /* ----------------- CONFIGURACIÓN (EDITAR) ----------------- */
  // Panel de Supabase → Project Settings → API
  var SUPABASE_URL = "https://ldtomnicwnwituyensmn.supabase.co";      // <-- EDITA ESTO
  var SUPABASE_ANON_KEY = "sb_publishable_IhsU4XOQCR8R83oZEXhVAA_W_8v6Fik";                 // <-- EDITA ESTO (clave pública, es seguro)
  /* ----------------------------------------------------------- */

  var FN_URL = SUPABASE_URL.replace(/\/$/, "") + "/functions/v1/busqueda-visual";
  var LIMITE_DIARIO = 15;   // búsquedas por dispositivo al día (freno anti-abuso)
  var MAX_LADO_PX = 1024;   // la foto se reduce antes de enviarla
  var CALIDAD_JPEG = 0.8;

  /* ------------------- utilidades ------------------- */
  function $(id) { return document.getElementById(id); }

  function esperarElemento(id, maxMs) {
    return new Promise(function (resolve) {
      var t0 = Date.now();
      (function revisar() {
        var el = $(id);
        if (el) return resolve(el);
        if (Date.now() - t0 > (maxMs || 10000)) return resolve(null);
        setTimeout(revisar, 100);
      })();
    });
  }

  function normalizar(txt) {
    return String(txt || "").toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  /* -------- límite diario por dispositivo (localStorage) -------- */
  function hoy() { return new Date().toISOString().slice(0, 10); }

  function puedeBuscar() {
    try {
      if (localStorage.getItem("mc_bv_dia") !== hoy()) return true;
      return (parseInt(localStorage.getItem("mc_bv_n") || "0", 10) || 0) < LIMITE_DIARIO;
    } catch (e) { return true; }
  }

  function contarBusqueda() {
    try {
      var esHoy = localStorage.getItem("mc_bv_dia") === hoy();
      var n = (esHoy ? (parseInt(localStorage.getItem("mc_bv_n") || "0", 10) || 0) : 0) + 1;
      localStorage.setItem("mc_bv_dia", hoy());
      localStorage.setItem("mc_bv_n", String(n));
    } catch (e) { /* sin localStorage no bloqueamos */ }
  }

  /* ------------------- avisos en pantalla ------------------- */
  function toast(msg, tipo) {
    var t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);" +
      "background:" + (tipo === "error" ? "#c0392b" : "#222") + ";color:#fff;padding:10px 18px;" +
      "border-radius:24px;font-size:14px;z-index:99999;box-shadow:0 4px 14px rgba(0,0,0,.25);" +
      "max-width:90vw;text-align:center;font-family:inherit;";
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 4200);
  }

  function overlay(mostrar) {
    var existente = $("bv-overlay");
    if (!mostrar) { if (existente) existente.remove(); return; }
    if (existente) return;
    var o = document.createElement("div");
    o.id = "bv-overlay";
    o.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99998;" +
      "display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;" +
      "color:#fff;font-size:16px;font-family:inherit;";
    o.innerHTML =
      '<div style="width:46px;height:46px;border:4px solid rgba(255,255,255,.3);' +
      'border-top-color:#fff;border-radius:50%;animation:bv_giro 1s linear infinite"></div>' +
      '<div>Analizando tu foto\u2026</div>' +
      "<style>@keyframes bv_giro{to{transform:rotate(360deg)}}</style>";
    document.body.appendChild(o);
  }

  /* ---------- imagen del usuario -> data URL comprimida ---------- */
  function comprimir(file) {
    return new Promise(function (resolve, reject) {
      if (!/^image\//.test(file.type)) {
        return reject(new Error("Ese archivo no es una imagen."));
      }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var escala = Math.min(1, MAX_LADO_PX / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * escala));
        c.height = Math.max(1, Math.round(img.height * escala));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", CALIDAD_JPEG));
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("No pude leer la imagen. Prueba con otra."));
      };
      img.src = url;
    });
  }

  /* ------------- llamada a la Edge Function de Supabase ------------- */
  function analizarFoto(dataUrl) {
    // Leemos las categorías reales del <select> del sitio para que la
    // IA elija siempre una que exista (funciona aunque cambien categorías).
    var categorias = [];
    var select = $("categorySelect");
    if (select) {
      for (var i = 0; i < select.options.length; i++) {
        var t = select.options[i].text.trim();
        if (t && t.indexOf("Todas") !== 0) categorias.push(t);
      }
    }

    var cabeceras = { "Content-Type": "application/json" };
    if (SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.indexOf("TU_") !== 0) {
      cabeceras.apikey = SUPABASE_ANON_KEY;
      cabeceras.Authorization = "Bearer " + SUPABASE_ANON_KEY;
    }

    return fetch(FN_URL, {
      method: "POST",
      headers: cabeceras,
      body: JSON.stringify({ imagen: dataUrl, categorias: categorias })
    })
      .then(function (r) {
        return r.json().catch(function () {
          throw new Error("Respuesta inválida del servidor. Revisa la Edge Function.");
        });
      })
      .then(function (data) {
        if (!data || !data.ok) {
          throw new Error((data && data.error) || "No se pudo analizar la foto.");
        }
        return data;
      });
  }

  /* ------------- aplicar el resultado al buscador ------------- */
  function aplicarResultado(res) {
    var input = $("mainSearchInput");
    if (!input) return;

    input.value = res.texto_busqueda;

    // Si la categoría que dijo la IA existe en el <select>, la seleccionamos.
    if (res.categoria) {
      var select = $("categorySelect");
      if (select) {
        var objetivo = normalizar(res.categoria);
        for (var i = 0; i < select.options.length; i++) {
          if (normalizar(select.options[i].text) === objetivo) {
            select.value = select.options[i].value;
            break;
          }
        }
      }
    }

    // Disparamos la búsqueda normal del sitio con el botón que ya existe.
    var btn = $("searchButton");
    if (btn) {
      btn.click();
    } else {
      // Fallback: navegamos a resultados con el formato EXACTO que produce
      // hoy search-global.js (encodeURIComponent para espacios y acentos).
      var destino = "resultados.html?q=" + encodeURIComponent(String(res.texto_busqueda || ""));
      var catFinal = "";
      if (res.categoria) {
        var selBv = $("categorySelect");
        if (selBv) {
          var objetivoBv = normalizar(res.categoria);
          for (var j = 0; j < selBv.options.length; j++) {
            if (normalizar(selBv.options[j].text) === objetivoBv) {
              catFinal = selBv.options[j].value || selBv.options[j].text;
              break;
            }
          }
        }
      }
      if (catFinal) destino += "&category=" + encodeURIComponent(catFinal);
      window.location.href = destino;
      return;
    }

    toast('Buscando: \u00ab' + res.texto_busqueda + '\u00bb — puedes editar el texto');
  }

  /* ------------- cámara dentro del buscador ------------- */
  function inyectarBoton(input) {
    var campo = input.closest(".search-field") || input.parentElement;
    if (!campo || $("btn-camara-bv")) return;

    // Espacio para el ícono a la derecha del campo de texto.
    if (getComputedStyle(campo).position === "static") campo.style.position = "relative";
    input.style.paddingRight = "42px";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "btn-camara-bv";
    btn.title = "Buscar con una foto";
    btn.setAttribute("aria-label", "Buscar con una foto");
    btn.innerHTML = '<i class="fas fa-camera" aria-hidden="true"></i>';
    btn.style.cssText = "position:absolute;right:48px;top:50%;transform:translateY(-50%);" +
      "width:30px;height:30px;border:none;background:transparent;color:#8a8a8a;cursor:pointer;" +
      "font-size:16px;padding:0;line-height:30px;z-index:5;";
    btn.addEventListener("mouseenter", function () { btn.style.color = "#222"; });
    btn.addEventListener("mouseleave", function () { btn.style.color = "#8a8a8a"; });
    btn.addEventListener("click", function () {
      var f = $("bv-file");
      if (f) f.click();
    });

    var file = document.createElement("input");
    file.type = "file";
    file.id = "bv-file";
    file.accept = "image/*";
    file.style.display = "none";
    // Sin atributo capture: en el celular el usuario ELIGE entre cámara o galería.
    file.addEventListener("change", function () {
      var f = file.files && file.files[0];
      file.value = "";
      if (!f) return;

      if (!puedeBuscar()) {
        toast("Límite diario de búsqueda por foto alcanzado. Vuelve mañana.", "error");
        return;
      }

      comprimir(f)
        .then(function (dataUrl) {
          overlay(true);
          return analizarFoto(dataUrl);
        })
        .then(function (res) {
          overlay(false);
          contarBusqueda();
          aplicarResultado(res);
        })
        .catch(function (err) {
          overlay(false);
          toast(err.message || "No se pudo analizar la foto.", "error");
        });
    });

    campo.appendChild(btn);
    campo.appendChild(file);
  }

  /* ------------------- arranque ------------------- */
  function iniciar() {
    // El buscador puede tardar (navbar/main.js cargan dinámicos): esperamos hasta 15 s.
    esperarElemento("mainSearchInput", 15000).then(function (input) {
      if (input) inyectarBoton(input);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
