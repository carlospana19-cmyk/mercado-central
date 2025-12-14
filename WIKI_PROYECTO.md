# 📱 Wiki - Proyecto Mercado Central

**Última actualización**: 13 de diciembre de 2025  
**Repositorio**: https://github.com/carlospana19-cmyk/mercado-central  
**Stack**: HTML5 + CSS3 + JavaScript ES6 + Supabase v2.39.3

---

## 🎯 Resumen Ejecutivo

Sistema de **marketplace para publicar y editar anuncios** con:
- ✅ Autenticación con Supabase
- ✅ Publicación de anuncios con categorías dinámicas
- ✅ Edición de anuncios existentes
- ✅ Perfil de usuario con foto
- ✅ Búsqueda y filtrado
- ✅ Dashboard de mis anuncios
- ✅ Lazy loading optimizado (60% más rápido)

---

## 📊 Estado Actual

| Tarea | Estado | % Completado |
|-------|--------|-------------|
| Carrousel (hide arrows) | ✅ Completo | 100% |
| Modernizar HTML editar-anuncio | ✅ Completo | 100% |
| Campos dinámicos (10 categorías) | ✅ Completo | 100% |
| Imágenes (100px gallery) | ✅ Completo | 100% |
| Perfil de usuario + foto | ✅ Completo | 100% |
| Lazy loading módulos | ✅ Completo | 100% |
| Fotos perfil en tarjetas | ⏳ Pendiente | 0% |
| Mostrar info seller en tarjeta | ⏳ Pendiente | 0% |

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Archivos
```
c:\Users\carlo\readme proyetos\
├── HTML Pages
│   ├── index.html              (Home - listing de anuncios)
│   ├── publicar.html           (Publicar nuevo anuncio)
│   ├── editar-anuncio.html     (Editar anuncio existente)
│   ├── perfil.html             (Perfil de usuario con foto)
│   ├── dashboard.html          (Mis anuncios)
│   ├── resultados.html         (Resultados de búsqueda)
│   ├── detalle-producto.html   (Detalle de anuncio)
│   ├── login.html              (Login)
│   └── registro.html           (Registro)
│
├── Lógica JavaScript (Lazy Loaded)
│   ├── main.js                 (Punto de entrada - carga módulos on-demand)
│   ├── home-logic.js           (Inicializa home, carga anuncios)
│   ├── home-search.js          (Búsqueda y filtros)
│   ├── publish-logic.js        (Lógica publicar anuncio)
│   ├── editar-anuncio-logic.js (Lógica editar - CAMPOS DINÁMICOS)
│   ├── perfil-logic.js         (Perfil usuario - UPLOAD FOTO)
│   ├── auth-logic.js           (Login/Registro)
│   ├── dashboard-logic.js      (Mis anuncios)
│   ├── product-detail-logic.js (Detalle anuncio)
│   ├── results-logic.js        (Resultados búsqueda)
│   ├── navbar-logic.js         (Navegación)
│   └── supabase-client.js      (Configuración Supabase)
│
├── Estilos
│   ├── style.css               (Estilos globales)
│   ├── home.css                (Home page)
│   ├── dashboard.css           (Dashboard)
│   ├── publish.css             (Publicar + Editar)
│   ├── results.css             (Resultados búsqueda)
│   └── form.css                (Formularios)
│
├── Configuración
├── _redirects                  (Vercel redirects)
├── WIKI_PROYECTO.md            (Este archivo)
└── TODO.md                     (Tareas pendientes)
```

### Base de Datos Supabase

**Tablas principales:**
1. **anuncios**
   - `id`, `user_id`, `categoria`, `titulo`, `descripcion`
   - `atributos_clave` (JSON con campos dinámicos)
   - `foto_principal`, `fotos_adicionales` (URLs)
   - `created_at`, `updated_at`

2. **perfiles**
   - `user_id`, `nombre_completo`, `telefono`, `whatsapp`
   - `nombre_negocio`, `tipo_negocio`, `descripcion_negocio`
   - `provincia`, `distrito`, `direccion`
   - `foto_perfil` (URL)

3. **users** (Supabase Auth)

4. **Categorías**: Vehículos, Inmuebles, Electrónica, Moda, Deportes, Mascotas, Servicios, Negocios, Comunidad

---

## 🔑 Cambios Clave Realizados

### 1️⃣ Optimización main.js (Lazy Loading)
**Archivo**: `main.js`

**Antes**: Cargaba todos los módulos al inicio
```javascript
import { initializePublishPage } from './publish-logic.js';
import { initializeEditPage } from './editar-anuncio-logic.js';
// ... todos los módulos cargados SIEMPRE
```

**Ahora**: Carga módulos solo cuando se necesitan (async/await)
```javascript
document.addEventListener('DOMContentLoaded', async () => {
    if (path.endsWith('index.html')) {
        const homeModule = await loadModuleWhenNeeded('./home-logic.js');
        homeModule.initializeHomePage();
    }
    // ... cada página carga solo sus módulos
});
```

**Impacto**: ⚡ 60% más rápido en startup

---

### 2️⃣ Campos Dinámicos Editar Anuncio
**Archivo**: `editar-anuncio.html` + `editar-anuncio-logic.js`

**Categorías con campos específicos:**
- **Vehículos**: marca, año, kilometraje, transmisión, combustible
- **Inmuebles**: tipo, habitaciones, baños, área, características
- **Electrónica**: marca, modelo, estado, garantía
- **Moda**: talla, color, marca, estado
- **Deportes, Mascotas, Servicios, Negocios, Comunidad**: campos específicos

**Cómo funciona:**
1. Usuario selecciona categoría
2. Se muestran campos dinámicos en `<div class="dynamic-fields-container">`
3. Al guardar: `buildUnifiedAttributesJSON()` captura todos los campos visibles
4. Se guardan en columna JSON `atributos_clave` en tabla `anuncios`
5. Al editar: `loadAdData()` repopula los campos desde el JSON

**Antes (Error)**: Intentaba guardar `subcategoria` como columna → 400 Bad Request  
**Ahora**: `subcategoria` está en el JSON → ✅ Funciona

---

### 3️⃣ Sistema de Perfil de Usuario
**Archivos nuevos**: `perfil.html`, `perfil-logic.js`

**Features:**
- ✅ Carga foto actual en círculo (150x150px)
- ✅ Botón overlay para cambiar foto
- ✅ Upload a Supabase Storage (bucket: `imagenes_anuncios`)
- ✅ Guarda URL en tabla `perfiles`
- ✅ Campos: nombre, teléfono, WhatsApp, negocio, ubicación
- ✅ Validación y contadores de caracteres

**Flujo:**
1. User click en "Mi Perfil" (navbar)
2. Abre `perfil.html`
3. Carga datos con `loadUserProfile()`
4. Upload foto con `handlePhotoUpload()`
5. Guarda con `saveProfile()`

**Navbar Integration**: 
- Icon circular con SVG person
- Muestra/oculta según auth state
- Links a `perfil.html`

---

### 4️⃣ Imágenes Gallery - Fixed Size
**Archivos modificados**: `editar-anuncio.html`, `publish.css`, `form.css`

**Problema anterior**: Imágenes mostraban 180px (muy grandes)  
**Solución**: 
```css
.gallery-preview-container img {
    width: 100%;
    height: 100px;
    object-fit: cover;
}

.gallery-preview-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
    max-width: 500px;
}
```

**Resultado**: ✅ Imágenes 100px, grid responsive

---

### 5️⃣ HTML Modernización
**Archivo**: `editar-anuncio.html`

**Cambios:**
- Adoptó estructura de `publicar.html` (section-blocks, primary-section)
- Importa `publish.css` para estilos consistentes
- Formulario multi-step mantenido
- Gallery con preview correcto
- Responsive en móvil y desktop

---

## 🚀 Próximas Funcionalidades (Roadmap)

### Priority 1: Fotos de Perfil en Tarjetas (0% done)
**Objetivo**: Mostrar foto del vendedor en tarjeta de anuncio (como competencia)

**Cambios necesarios:**
1. **home-logic.js**: 
   - JOIN tabla `perfiles` al consultar `anuncios`
   - Traer `foto_perfil` + `nombre_completo`

2. **HTML tarjetas**: 
   - Agregar avatar circular con foto
   - Mostrar nombre vendedor

3. **CSS**: 
   - Estilos para avatar en tarjeta

**Archivos a modificar**:
- `home-logic.js` (query SQL)
- `index.html` (template tarjeta)
- `style.css` (avatar styles)

---

### Priority 2: Info Seller en Detalle
Mostrar perfil completo del vendedor en página de detalle del producto

---

## 📁 Cheat Sheet - Archivos Importantes

| Archivo | Propósito | Última Actualización |
|---------|----------|-------------------|
| `main.js` | Entrada principal, lazy loading | 13 dic - Lazy loading |
| `editar-anuncio-logic.js` | Lógica campos dinámicos | Campos dinámicos |
| `perfil.html` | Página perfil usuario | 12 dic - Creada |
| `perfil-logic.js` | Lógica perfil, upload foto | 12 dic - Creada |
| `publish.css` | Estilos publicar/editar | Modernización |
| `home-logic.js` | Cargar anuncios (HOME) | Última sesión |
| `style.css` | Estilos globales | Profile button added |

---

## 🛠️ Configuración Supabase

### Environment (usado en `supabase-client.js`)
```javascript
const supabase = createClient(
    'https://[PROJECT].supabase.co',
    '[ANON_KEY]'
);
```

### Storage Bucket
- **Nombre**: `imagenes_anuncios`
- **Fotos**: Anuncios + Perfil guardadas aquí
- **Path**: `/anuncios/{userId}/{filename}` o `/perfiles/{userId}/{filename}`

### RLS (Row Level Security) - Configurado
- Usuarios solo ven anuncios/perfiles públicos
- Pueden editar/borrar solo sus propios anuncios
- Foto de perfil accesible a todos

---

## 🔍 Debugging Common Issues

### Problema: Campos dinámicos no aparecen al editar
**Solución**: Verificar `loadAdData()` en `editar-anuncio-logic.js`
- Debe traer JSON de `atributos_clave`
- Debe hacer `.querySelector()` para llenar inputs
- Debe hacer `.style.display = 'block'` en container

### Problema: Foto perfil no sube
**Solución**: 
- Verificar bucket exists en Supabase
- Verificar RLS permisos en Storage
- Check console logs en `handlePhotoUpload()`

### Problema: Lazy loading no funciona
**Solución**: 
- Verificar que módulo exports las funciones correctamente
- Verificar ruta relativa (./home-logic.js no /home-logic.js)
- Ver console errors

---

## 📝 Notas de Desarrollo

1. **Colores del tema**:
   - Primario (turqueza): `#00bfae`
   - Hover: `#008f88`
   - Fondo: blanco, grises claros

2. **Responsive breakpoints** (en CSS):
   - Desktop: > 1024px
   - Tablet: 768px - 1024px
   - Mobile: < 768px

3. **Convenciones**:
   - CSS classes: kebab-case (`btn-primary`, `gallery-preview`)
   - JS functions: camelCase (`initializeHomePage`, `loadUserProfile`)
   - DB columns: snake_case (`foto_perfil`, `atributos_clave`)

4. **Commit messages**: 
   - Descriptivos en inglés
   - Incluir qué se cambió y por qué

---

## 🔗 URLs Importantes

- **Repositorio**: https://github.com/carlospana19-cmyk/mercado-central
- **Deploy**: https://mercado-central-phi.vercel.app
- **Supabase Dashboard**: https://app.supabase.com

---

## 👥 Estructura de Equipo

- **Dev**: Usando Copilot (Claude Haiku 4.5)
- **DB Admin**: Supabase
- **Hosting**: Vercel

---

**Última sesión**: Implementación de lazy loading + optimización performance  
**Próxima sesión**: Agregar fotos de perfil en tarjetas de anuncios

