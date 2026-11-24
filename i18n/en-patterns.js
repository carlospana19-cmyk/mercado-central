/* en-patterns: títulos de página ("X | Mercados Central") y textos sueltos */
mcI18nAdd("en", {
"Resultados de búsqueda": "Search results",
"Anuncio": "Ad",
"Anuncios del vendedor": "Seller's ads",
"Publicar anuncio gratis": "Post a free ad",
"Estacionamientos": "Parking Spaces",
"Condición": "Condition",
"Aún no hay anuncios": "No ads yet",
"Cargando perfil...": "Loading profile...",
"Panel Administrador - Mercados Central": "Admin Panel - Mercados Central",
"Acceso no autorizado": "Unauthorized access",
"Mercados Central": "Mercados Central"
});
/* Títulos de pestaña: "Algo | Mercados Central" y "Algo - Mercados Central" */
mcI18nPattern("en", /^(.+) \| Mercados Central$/, function (m, t) { var r = t(m[1]); return r ? r + " | Mercados Central" : null; });
mcI18nPattern("en", /^(.+) - Mercados Central$/, function (m, t) { var r = t(m[1]); return r ? r + " - Mercados Central" : null; });

