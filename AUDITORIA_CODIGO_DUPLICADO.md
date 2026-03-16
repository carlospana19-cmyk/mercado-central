# Auditoría de Código Duplicado - Mercado Central

**Fecha:** 15 de Marzo de 2026  
**Estado:** EN PROGRESO

---

## 📋 RESUMEN EJECUTIVO

Se ha realizado una auditoría completa del proyecto identificando código duplicado en archivos CSS, HTML y JavaScript. Se han eliminado 2 archivos no utilizados.

---

## 🗑️ ARCHIVOS ELIMINADOS

| Archivo | Razón |
|---------|-------|
| `results.css` | Solo contenía un comentario de referencia a `cards.css`. No estaba siendo usado en ningún HTML. |
| `www/like-style-temp.css` | Archivo temporal de estilos para likes. No estaba siendo usado. |

---

## 📊 CSS DUPLICADO ENCONTRADO

### 1. Código de Zoom en Móvil
**Descripción:** El código para prevenir zoom automático en móviles aparece duplicado:

- `form.css` (líneas 362-367)
- `style.css` (líneas 5-8)
- `home.css`

```css
@media (max-width: 768px) {
  input, select, textarea {
    font-size: 16px !important;
  }
}
```

**Recomendación:** Mantener solo en `style.css` (el archivo base).

### 2. Variables CSS Globales
**Descripción:** Las variables CSS `:root` están definidas en `style.css` pero podrían estar siendo redefinidas.

- `style.css` (líneas 171-183): Define `--color-primario`, `--color-secundario`, etc.

### 3. Animación `fadeIn` Duplicada
**Descripción:** La animación `@keyframes fadeIn` aparece en:

- `panel-unificado.css` (líneas 214-223)
- `home.css` (líneas 299-308)

**Recomendación:** Unificar en `style.css`.

### 4. Estilos de Swiper/Paginación
**Descripción:** Estilos para controles de carrusel duplicados en:
- `home.css`
- `style.css`

### 5. Contenedores Flexibles
**Descripción:** Reglas para containers `width: 100%` duplicadas en múltiples archivos.

---

## 🌐 HTML DUPLICADO ENCONTRADO

### 1. NAVBAR (CRÍTICO - ~30 líneas repetidas)
**Descripción:** El navbar aparece casi idéntico en todos los archivos HTML:

| Archivo | Líneas |
|---------|--------|
| `index.html` | 55-76 |
| `resultados.html` | 19-40 |
| `panel-unificado.html` | 16-32 |
| `login.html` | 60-87 |
| `registro.html` | 60-87 |
| `publicar.html` | 17-44 |
| `detalle-producto.html` | 21-48 |

**Contenido duplicado:**
- Logo y链接 a Mercado Central
- Botones: Panel, Publicar, Cerrar Sesión, Iniciar Sesión
-相同的IDs: `btn-dashboard`, `btn-publish-logged-in`, `btn-logout`, `btn-login`

### 2. FOOTER (CRÍTICO - ~40 líneas repetidas)
**Descripción:** El footer aparece idéntico en:

| Archivo | Líneas |
|---------|--------|
| `index.html` | 172-213 |
| `resultados.html` | 107-148 |
| `panel-unificado.html` | 253-294 |
| `login.html` | 120-161 |
| `registro.html` | 251-292 |
| `detalle-producto.html` | 151-192 |

**Contenido duplicado:**
- 4 columnas: Información, Enlaces rápidos, Síguenos, App y Pagos
- Copyright

### 3. Meta Tags y CSP
**Descripción:** La misma Content Security Policy aparece en todos los HTML:
```html
<meta http-equiv="Content-Security-Policy" content="connect-src *; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://fonts.googleapis.com; ...">
```

### 4. SVG Definitions
**Descripción:** Las definiciones SVG (gradientes, paths) aparecen en:
- `index.html` (líneas 220-234)
- `resultados.html` (líneas 156-170)

---

## 📜 JS DUPLICADO ENCONTRADO

### 1. Funciones de Autenticación
**Descripción:** Funciones relacionadas con auth aparecen en múltiples archivos:

- `main.js`: `updateUIBasedOnAuthState()` (líneas 12-58)
- `navbar-logic.js`: `initializeNavbar()` (líneas 5-73)
- `auth-logic.js`: `checkUserLoggedIn()` (líneas 180-207)

### 2. Imports de Supabase
**Descripción:** El mismo import aparece en muchos archivos:
```javascript
import { supabase } from './supabase-client.js';
```

### 3. Inicialización de Navbar
**Descripción:** 
- `main.js` importa y llama a `initializeNavbar` desde `navbar-logic.js`
- `navbar-logic.js` tiene su propia lógica de autenticación

---

## 🎯 RECOMENDACIONES DE LIMPIEZA

### Prioridad ALTA (Cambios seguros):
1. ✅ ~~Eliminar `results.css`~~ - COMPLETADO
2. ✅ ~~Eliminar `www/like-style-temp.css`~~ - COMPLETADO

### Prioridad MEDIA (Requiere testing):
1. Unificar `@keyframes fadeIn` en `style.css` y eliminar duplicados
2. Unificar código de zoom móvil en `style.css`
3. Crear componentes externos para navbar y footer (requiere cambio estructural)

### Prioridad BAJA (Mejora futura):
1. Crear un archivo de componentes JS compartido
2. Unificar lógica de autenticación

---

## ⚠️ NOTAS IMPORTANTES

1. **Cuidado con los HTML:** Los archivos HTML tienen el mismo navbar y footer pero con pequeñas variaciones (algunos tienen estilos inline). Cualquier cambio debe ser probado exhaustivamente.

2. **Los IDs son críticos:** Todos los botones del navbar usan los mismos IDs (`btn-dashboard`, `btn-login`, etc.), lo cual es correcto pero hace difícil la refactorización.

3. **CSP:** La Content Security Policy es ligeramente diferente en algunos archivos (por ejemplo, `publicar.html` tiene permisos adicionales para Google Maps).

---

## 📁 ESTRUCTURA ACTUAL DE CSS

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| `style.css` | 3963 | Estilos globales y navbar |
| `home.css` | 3322 | Estilos específicos del Home |
| `form.css` | 1646 | Estilos de formularios |
| `publish.css` | 1292 | Estilos de publicación |
| `panel-unificado.css` | 790 | Estilos del panel de usuario |
| `cards.css` | 695 | Estilos de tarjetas de productos |
| `results.css` | - | ELIMINADO |

---

*Auditoría realizada el 15 de Marzo de 2026*

---

## ✅ INTEGRACIÓN DE COMPONENTES COMPLETADA

### Archivos HTML Modificados (7):
1. ✅ `index.html` - Navbar y Footer reemplazados con componentes dinámicos
2. ✅ `resultados.html` - Navbar y Footer reemplazados
3. ✅ `panel-unificado.html` - Navbar y Footer reemplazados
4. ✅ `login.html` - Navbar y Footer reemplazados
5. ✅ `registro.html` - Navbar y Footer reemplazados
6. ✅ `publicar.html` - Navbar reemplazado (no tiene footer en el original)
7. ✅ `detalle-producto.html` - Navbar y Footer reemplazados

### Archivos Nuevos Creados:
- `navbar-component.html` - Componente Navbar
- `footer-component.html` - Componente Footer
- `load-components.js` - Script para inyección automática

### 🎯 Estado del Proyecto:
El sitio ahora opera con componentes dinámicos. El navbar y footer se cargan automáticamente desde los archivos componentes.
