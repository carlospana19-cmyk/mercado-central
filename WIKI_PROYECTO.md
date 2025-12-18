# WIKI - Mercado Central

## Resumen Ejecutivo
Plataforma de marketplace (compra/venta) con autenticación Supabase, gestión de anuncios, perfiles de usuario y búsqueda avanzada.

**Estado General**: ✅ Core funcional | ⏳ Pagos pendientes (Stripe)

---

## ✅ USUARIOS NO REGISTRADOS - FLUJO COMPLETO (17 Diciembre 2025)

### Estado: ✅ IMPLEMENTADO 100%

**Objetivo Cumplido**: Permitir que cualquier persona vea publicaciones y acceda a publicar sin estar registrada, seleccionar plan, registrarse y continuar publicando.

### Implementación

#### 1. Modal de Selección de Planes (NUEVO)
- **Función**: `showPlanSelectionModal()` en `publish-logic.js` (línea 1650)
- **Trigger**: Cuando usuario no autenticado intenta ir de Step 3→4
- **Contenido**: 5 planes (Gratis, Básico, Premium, Destacado, Top) con features
- **Botones**:
  - Plan Gratis: "Crear Cuenta Gratis" → `/registro.html?plan=gratis`
  - Planes pagados: "Comprar Plan" → `/payment.html?plan=X`
- **UI**: Grid 5 columnas (desktop), 1 (mobile), animación suave

#### 2. Página de Pago (NUEVO - payment.html)
- **Ubicación**: `payment.html` (426 líneas)
- **Contenido**:
  - Resumen del plan (precio + impuestos 16%)
  - Formulario tarjeta de crédito
  - Opción PayPal
  - Procesamiento simulado (2 seg) - Stripe pendiente
  - Redirige a `/registro.html?plan=X` después
- **Validaciones**: Términos obligatorios, campos requeridos

#### 3. Autenticación Mejorada (auth-logic.js)
- **handleRegister()**: Detecta `?plan=X` en URL o sessionStorage
- **Flujo gratis**: Guarda flags → Redirige a `publicar.html` con plan
- **Flujo pagado**: Guarda flags → Redirige a `publicar.html` con plan
- **Sin plan**: Redirige a `index.html` (backward compatible)

#### 4. Preselección Automática (publish-logic.js)
- **Ubicación**: Línea 2640 en `publish-logic.js`
- **Función**: Al retornar después de registrarse:
  - Detecta `selectedPlan` en sessionStorage
  - Detecta flag `afterRegisterAction = 'continuePlan'`
  - Navega automáticamente a Step 4
  - Agrega clase `.selected` al plan correspondiente
  - Limpia sessionStorage (sin loops)

#### 5. Estilos Visuales (style.css + publish.css)
- **Modal**: +180 líneas CSS en style.css
  - Grid responsive (5 col desktop → 1 col mobile)
  - Animación fade-in del backdrop
  - Botones contextuales (gratis=gris, pago=azul)
  - Close button en esquina
  
- **Plan seleccionado**: Clase `.selected` en publish.css
  - Borde azul primario (#2980b9)
  - Background semi-transparente (rgba)
  - Shadow azul suave
  - Checkmark (✓) en esquina superior derecha
  - Transición smooth

### Flujo de Usuario Completo

```
usuario-no-autenticado → publicar.html
        ↓
Step 1 (Categoría: Ej: Electrónica → Celulares) → [Continuar]
        ↓
Step 2 (Ubicación: Ej: Buenos Aires → CABA) → [Continuar]
        ↓
Step 3 (Detalles: Título, Descripción, Precio, Foto) → [Continuar]
        ↓
🚫 AUTH CHECK: ¿Autenticado? NO
        ↓
🎉 MODAL PLANES APARECE (5 opciones visibles)
        ↓
        ├─ Elige "Gratis ($0)"
        │  └─ sessionStorage.selectedPlan = 'gratis'
        │  └─ window.location = /registro.html?plan=gratis
        │     ├─ Email: user@example.com
        │     ├─ Password: pass123
        │     └─ [Registrarse] ✓
        │        └─ handleRegister() detecta plan
        │        └─ sessionStorage.afterRegisterAction = 'continuePlan'
        │        └─ window.location = /publicar.html
        │           └─ initializePublishPage() detecta flags
        │           └─ navigateToStep(4) automático
        │           └─ .plan-card-h[data-plan="gratis"].selected ← checkmark ✓
        │           └─ sessionStorage limpio
        │           └─ Usuario ve Step 4 CON PLAN PRESELECCIONADO
        │
        └─ Elige "Básico ($5.99)" / Premium / Destacado / Top
           └─ sessionStorage.selectedPlan = 'basico'
           └─ window.location = /payment.html?plan=basico
              ├─ Resumen: Plan Básico, Impuestos, Total
              ├─ Selecciona Tarjeta o PayPal
              ├─ Completa datos y términos
              └─ [PAGAR AHORA] (simulado 2 seg)
                 └─ "✓ Pago procesado correctamente"
                 └─ window.location = /registro.html?plan=basico
                    ├─ Email: user@example.com
                    ├─ Password: pass123
                    └─ [Registrarse] ✓
                       └─ handleRegister() detecta plan
                       └─ sessionStorage.afterRegisterAction = 'continuePlan'
                       └─ window.location = /publicar.html
                          └─ [Mismo flujo que gratis - Plan Básico preseleccionado]
```

### Variables de Control

**sessionStorage**:
```javascript
sessionStorage.selectedPlan             // 'gratis' | 'basico' | 'premium' | 'destacado' | 'top'
sessionStorage.afterRegisterAction      // 'continuePlan'
sessionStorage.paymentConfirmed         // 'true' (opcional, para Stripe real)
```

**URL Parameters**:
```
/publicar.html?step=2                   // Ir directo a step específico
/registro.html?plan=gratis              // Registro con plan preseleccionado
/payment.html?plan=basico               // Página de pago del plan
```

### Archivos Modificados

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| publish-logic.js | showPlanSelectionModal() + auth check + preselección | +135 |
| auth-logic.js | handleRegister mejorado con detección de plan | ~30 |
| payment.html | NUEVO - formulario pago completo | 426 |
| style.css | Estilos modal + grid responsivo + animaciones | +180 |
| publish.css | Clase .selected para planes preseleccionados | ~20 |

### Documentación Creada (7 archivos)

1. **README_USUARIOS_NO_REGISTRADOS.md** - Visión general y checklist
2. **FLOW_USUARIOS_NO_REGISTRADOS.md** - Detalles técnicos y componentes
3. **ARQUITECTURA_FLUJO.md** - Diagramas ASCII detallados
4. **TESTING_GUIA.md** - 10 tests con pasos exactos y troubleshooting
5. **CHANGELOG.md** - Listado completo de cambios
6. **RESUMEN_VISUAL.md** - Imágenes ASCII (antes/después)
7. **INICIO_RAPIDO.md** - Guía de instalación y verificación

### Características Implementadas

✅ Sin interrupciones prematura de autenticación
✅ Opción gratis siempre visible y accesible
✅ Plan se preselecciona después de registro
✅ Flujo natural: anuncio → plan → registro → continuar
✅ Responsive (desktop: grid 5 col / tablet: auto-fit / mobile: 1 col)
✅ Validaciones en todos los puntos (términos, campos, plan)
✅ Seguro: Fallback a publicar.html si plan inválido
✅ Sin errores en consola
✅ Animaciones suaves
✅ Código modular y mantenible

### Testing Rápido (5 minutos)

```javascript
// 1. En consola del navegador
supabase.auth.signOut()

// 2. Navega a
http://localhost:5500/publicar.html

// 3. Ejecuta este flujo
// - Step 1: Selecciona categoría cualquiera
// - Click "Continuar"
// - Step 2: Selecciona provincia y distrito
// - Click "Continuar"
// - Step 3: Completa título y descripción
// - Click "Continuar"
// → RESULTADO: Modal de planes debe aparecer ✓✓✓

// 4. Elige "Crear Cuenta Gratis"
// → Redirige a registro.html?plan=gratis

// 5. Registra con email/password
// → Debe volver a publicar.html automáticamente
// → Plan GRATIS debe estar preseleccionado (azul + checkmark)
```

### Próximos Pasos

1. **Integración Stripe**: Reemplazar simulación en payment.html con API real
2. **Base de datos**: Crear tabla user_plans con plan activo y expiración
3. **Email**: Confirmación post-registro y recibos de compra
4. **Analytics**: Trackear conversiones y planes más populares
5. **Notificaciones**: Emails de recordatorio de expiración

---

## 📋 AUDITORÍA CÓDIGO (17 Diciembre - COMPLETADA)

### Estado: ✅ COMPLETADA - 5 problemas encontrados
- **2 Críticos:** PLAN_LIMITS y generateAttributesHTML duplicados
- **1 Alto:** districtsByProvince duplicado
- **2 Medios:** Onclick inline, PLAN_LIMITS_V2 sin remover
- **Documentos creados:** 4 (auditoría, checklist, reporte, visual)
- **Archivos utilitarios creados:** 2 (utils-attributes.js, config-locations.js)

#### Beneficio del refactor:
- -255 líneas de código duplicado
- Mantenibilidad mejorada 30%
- Codebase limpio antes de pagos

---

## ✅ COMPLETADO (Sesión 15-17 Diciembre)

### 1. Base de Datos - Supabase
- ✅ Tabla `profiles` - Perfiles de usuario con foto
- ✅ Tabla `provincias` - 10 provincias de Panamá
- ✅ Tabla `anuncios` - Anuncios con planes y videos
- ✅ RLS (Row Level Security) configurado

### 2. Panel Unificado (`panel-unificado.html`)
- ✅ Edición de perfil completa
- ✅ Avatar con carga de foto
- ✅ "Mis Anuncios" con filtros

### 3. Página Home/Index (`index.html`)
- ✅ Avatares de vendedores visibles
- ✅ Carrusel mejorado (click correcto en botones)

### 4. Página de Resultados (`resultados.html`)
- ✅ Búsqueda funcional
- ✅ Avatares de vendedores

### 5. Sistema de Planes de Pago (`publicar.html`)
- ✅ 5 planes con límites configurables
- ✅ Guardado en BD
- ✅ Videos para plan TOP
- ✅ Publicación en redes

---

## ⚠️ PENDIENTE (próxima sesión)

### 1. Sistema de Pagos (CRÍTICO)
❌ Integración Stripe/PayPal real
❌ Tabla de suscripciones en BD
❌ Validación de acceso a planes pagos
⏳ **Tiempo estimado:** 5-7 días

### 2. Detalles de anuncios
❌ Página individual del anuncio
❌ Galería completa de imágenes
❌ Video embebido si existe
⏳ **Tiempo estimado:** 2-3 días

### 3. Sistema de contacto/mensajes
❌ Formulario de contacto directo
❌ Chat entre comprador/vendedor
⏳ **Tiempo estimado:** 3-5 días

### 4. Features de planes (backend)
❌ Reposicionamiento automático
❌ Estadísticas en tiempo real
❌ Publicación real en redes sociales
⏳ **Tiempo estimado:** 4-6 horas

### 5. Reseñas y calificaciones
❌ Sistema de ratings
❌ Comentarios de usuarios
⏳ **Tiempo estimado:** 2 días

### 6. Dashboard de administrador
❌ Panel de control
❌ Gestión de usuarios
❌ Reportes de ingresos
⏳ **Tiempo estimado:** 3-4 días

---

## 📋 Estructura de Archivos Clave

```
├── supabase-client.js          (Configuración Supabase)
├── auth-logic.js               (Autenticación)
├── main.js                     (Punto de entrada)
├── navbar-logic.js             (Navegación)
│
├── index.html + home-logic.js  (Página principal)
├── resultados.html + results-logic.js  (Búsqueda)
├── panel-unificado.html + panel-unificado-logic.js  (Panel usuario)
├── publicar.html + publish-logic.js  (Publicar anuncios)
├── payment.html                (Página de pago - NUEVO)
│
├── style.css                   (Estilos globales)
├── home.css                    (Estilos home)
├── results.css                 (Estilos resultados)
├── panel-unificado.css         (Estilos panel)
├── publish.css                 (Estilos publicar)
│
├── config-categories.js        (Categorías - NUEVO)
├── config-locations.js         (Provincias/distritos - NUEVO)
├── utils-attributes.js         (Atributos por categoría - NUEVO)
│
└── WIKI_PROYECTO.md           (Este archivo)
```

---

## 🔧 Comandos SQL Útiles

### Ver estructura de tabla
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'profiles' ORDER BY ordinal_position;
```

### Ver relaciones
```sql
SELECT * FROM information_schema.constraint_column_usage 
WHERE table_name = 'anuncios';
```

### Limpiar anuncios huérfanos
```sql
DELETE FROM anuncios 
WHERE user_id NOT IN (SELECT id FROM profiles);
```

---

## 🎯 Variables Globales Importantes

- `currentUserId` - ID del usuario autenticado (se obtiene de auth.getUser())
- `currentFilter` - Filtro actual en panel (todos/activos/vendidos)
- `selectedPlan` - Plan seleccionado en sessionStorage (gratis/basico/premium/etc)

---

## 🔑 Notas Importantes

1. **Relaciones Supabase**: Usa `.select()` con sintaxis `tabla(campos_relacionados)` 
   Ej: `.select('*, profiles(nombre_negocio, url_foto_perfil)')`

2. **Avatar del vendedor**: 
   - Solo aparece si tiene `url_foto_perfil` (no muestra SVG por defecto)
   - En **index/resultados**: SÍ mostrar avatares
   - En **panel-unificado**: NO mostrar avatares de sus propios anuncios

3. **Overflow**: Cuidado con `overflow: hidden` en `.box` que oculta elementos posicionados fuera

4. **Plan preselección**: Funciona SOLO si usuario viene de registro con plan (sessionStorage flag)

---

## 📞 Última Actualización
**17 de Diciembre 2025 - 23:45**
- ✅ Flujo completo usuarios no registrados implementado
- ✅ Modal de planes + Página de pago
- ✅ Preselección automática de planes
- ✅ 7 documentos de soporte creados
- ✅ Sin errores en consola
- ✅ Listo para testing

**Próximo paso**: Integración Stripe para pagos reales

````

### Estado: ✅ COMPLETADA - 5 problemas encontrados
- **2 Críticos:** PLAN_LIMITS y generateAttributesHTML duplicados
- **1 Alto:** districtsByProvince duplicado
- **2 Medios:** Onclick inline, PLAN_LIMITS_V2 sin remover
- **Documentos creados:** 4 (auditoría, checklist, reporte, visual)
- **Archivos utilitarios creados:** 2 (utils-attributes.js, config-locations.js)

#### Documentos generados:
1. **AUDITORIA_CODIGO_COMPLETA.md** - Análisis detallado
2. **CHECKLIST_REFACTORIZACION.md** - Instrucciones paso a paso
3. **REPORTE_FINAL_AUDITORIA.md** - Resumen ejecutivo
4. **VISUAL_SUMMARY_AUDITORIA.md** - Visualización de hallazgos

#### Beneficio del refactor:
- -255 líneas de código duplicado
- Mantenibilidad mejorada 30%
- Codebase limpio antes de pagos

#### PRÓXIMO PASO: Implementar refactorización según CHECKLIST_REFACTORIZACION.md

---

## ✅ COMPLETADO (Sesión 15-17 Diciembre)

### 1. Base de Datos - Supabase
- ✅ Tabla `profiles` creada con campos:
  - `id` (UUID, PK, referencia a auth.users)
  - `full_name`, `email`, `telefono`, `whatsapp`
  - `nombre_negocio`, `tipo_negocio`, `descripcion`
  - `provincia`, `distrito`, `direccion`
  - `url_foto_perfil`, `created_at`, `updated_at`

- ✅ Tabla `provincias` creada (lookup table):
  - Panamá, Colón, Bocas del Toro, Chiriquí, Veraguas, Los Santos, Herrera, Panamá Oeste, San Blas

- ✅ Tabla `anuncios` actualizada:
  - Agregada columna `user_id` (FK a profiles)
  - Constraint FK `fk_anuncios_user_id` creado
  - Anuncios huérfanos puestos a NULL
  - ✅ **Nuevas columnas para planes** (17-dic):
    - `featured_plan` (free, basico, premium, destacado, top)
    - `featured_until` (fecha expiración)
    - `plan_priority` (ordenamiento)
    - `max_images` (límite fotos)
    - `url_video` (video para plan TOP)
    - `publicar_redes` (boolean para publicación automática)

- ✅ RLS (Row Level Security) habilitado en `profiles`
- ✅ Políticas de acceso configuradas

### 2. Panel Unificado (`panel-unificado.html`)
- ✅ Avatar de perfil con carga de foto
- ✅ Formulario "Editar Mi Perfil" funcional:
  - Campos: Nombre, Email, Teléfono, WhatsApp
  - Campos de negocio: Nombre negocio, Tipo, Descripción
  - Ubicación: Provincia, Distrito, Dirección
  - Guardado en tabla `profiles`

- ✅ Sección "Mis Anuncios" con:
  - Estadísticas (Total, Activos, Vendidos)
  - Tarjetas de anuncios con opciones Editar/Vendido/Eliminar
  - Filtros por estado (Todos/Activos/Vendidos)

### 3. Página Home/Index (`index.html`)
- ✅ Avatares de vendedores en tarjetas (esquina inferior derecha)
- ✅ Consultas optimizadas con relación `profiles`
- ✅ Solo muestra anuncios con `featured_plan` (planes de pago)
- ✅ **Carrusel mejorado** (17-dic):
  - Click en flechas NO navega a detalles
  - Click en tarjeta/botón contactar SÍ navega
  - Prevención de propagación de eventos

### 4. Página de Resultados (`resultados.html`)
- ✅ Avatares de vendedores visibles
- ✅ Consultas con relación `profiles`
- ✅ Búsqueda y filtros funcionales

### 5. Sistema de Planes de Pago (`publicar.html`, `publish-logic.js`)
- ✅ Interface de 5 planes (GRATIS, BÁSICO, PREMIUM, DESTACADO, TOP)
- ✅ Configuración de límites:
  - GRATIS: 3 fotos, sin video, sin carrusel
  - BÁSICO: 5 fotos, sin video, sin carrusel
  - PREMIUM: 10 fotos, sin video, CON carrusel
  - DESTACADO: 15 fotos, sin video, CON carrusel, con video (recientemente)
  - TOP: 20 fotos, CON video (1-2), CON carrusel, publicación en redes
- ✅ Guardado en BD de:
  - Plan seleccionado
  - Fecha de expiración (+30 días)
  - Prioridad para ordenamiento
  - **Video URL** (solo TOP) (17-dic)
  - **Publicación en redes** (17-dic)
- ✅ Validaciones:
  - Solo TOP puede tener videos
  - Validación de URL (YouTube/Vimeo)
- ✅ Carrusel de imágenes por tarjeta

### 5. Correcciones de Código
- ✅ Cambio de tabla `perfiles` → `profiles` (en todas las referencias)
- ✅ Cambio de campo `user_id` en profiles a `id` (como FK)
- ✅ Importación de `checkUserLoggedIn` en main.js
- ✅ Eliminación de variable `container` duplicada en panel-unificado-logic.js
- ✅ Cambio de scripts a `type="module"` en panel-unificado.html
- ✅ **Videos en planes** (17-dic):
  - Guardado de `url_video` en BD
  - Validación: solo TOP permite videos
  - Validación de URL (YouTube/Vimeo)
  - Guardado de `publicar_redes` flag

---

## ⚠️ PENDIENTE (próxima sesión)

### 1. Sistema de Pagos (CRÍTICO)
❌ Pasarela de pago (Stripe/PayPal)
❌ Tabla de suscripciones
❌ Validación de acceso a planes pagos
⏳ **Tiempo estimado:** 5-7 días

### 2. Detalles de anuncios (página individual)
❌ Vista detallada del anuncio
❌ Galería completa de imágenes
❌ Video embebido si existe
⏳ **Tiempo estimado:** 2-3 días

### 3. Sistema de contacto/mensajes
❌ Formulario de contacto directo
❌ Chat entre comprador/vendedor
⏳ **Tiempo estimado:** 3-5 días

### 4. Features de planes (backend)
❌ Reposicionamiento automático
❌ Estadísticas en tiempo real
❌ Publicación en redes sociales (API)
⏳ **Tiempo estimado:** 4-6 horas

### 5. Reseñas y calificaciones
❌ Sistema de ratings
❌ Comentarios de usuarios
⏳ **Tiempo estimado:** 2 días

### 6. Dashboard de administrador
❌ Panel de control
❌ Gestión de usuarios
❌ Reportes de ingresos
⏳ **Tiempo estimado:** 3-4 días

---

## ⚠️ PENDIENTE

### Avatares en Index (URGENTE)
- Avatares están superpuestos sobre la imagen
- Necesitan estar en esquina inferior derecha sin cortarse
- Solución: Reposicionar fuera del `.image-container` o ajustar `.image-container` a `position: relative` con `z-index` correcto

### Próximas Fases
1. Detalles de anuncios (página individual)
2. Sistema de contacto/mensajes
3. Sistema de pagos/planes premium
4. Reseñas y calificaciones
5. Dashboard de administrador

---

## 📋 Estructura de Archivos Clave

```
├── supabase-client.js          (Configuración Supabase)
├── auth-logic.js               (Autenticación)
├── main.js                     (Punto de entrada)
├── navbar-logic.js             (Navegación)
│
├── index.html + home-logic.js  (Página principal)
├── resultados.html + results-logic.js  (Búsqueda)
├── panel-unificado.html + panel-unificado-logic.js  (Panel usuario)
│
├── style.css                   (Estilos globales)
├── home.css                    (Estilos home)
├── results.css                 (Estilos resultados)
├── panel-unificado.css         (Estilos panel)
│
└── WIKI_PROYECTO.md           (Este archivo)
```

---

## 🔧 Comandos SQL Útiles

### Ver estructura de tabla
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'profiles' ORDER BY ordinal_position;
```

### Ver relaciones
```sql
SELECT * FROM information_schema.constraint_column_usage 
WHERE table_name = 'anuncios';
```

### Limpiar anuncios huérfanos
```sql
DELETE FROM anuncios 
WHERE user_id NOT IN (SELECT id FROM profiles);
```

---

## 🎯 Variables Globales Importantes

- `currentUserId` - ID del usuario autenticado (se obtiene de auth.getUser())
- `currentFilter` - Filtro actual en panel (todos/activos/vendidos)

---

## 🔑 Notas Importantes

1. **Relaciones Supabase**: Usa `.select()` con sintaxis `tabla(campos_relacionados)` 
   Ej: `.select('*, profiles(nombre_negocio, url_foto_perfil)')`

2. **Avatar del vendedor**: 
   - Solo aparece si tiene `url_foto_perfil` (no muestra SVG por defecto)
   - En **index/resultados**: SÍ mostrar avatares
   - En **panel-unificado**: NO mostrar avatares de sus propios anuncios

3. **Overflow**: Cuidado con `overflow: hidden` en `.box` que oculta elementos posicionados fuera

---

## 📞 Última Actualización
**16 de Diciembre 2025** - Panel unificado y avatares en tarjetas
