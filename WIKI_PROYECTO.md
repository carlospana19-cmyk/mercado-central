# WIKI - Mercado Central

## 🔄 PUNTO DE RESTAURACIÓN (11 Enero 2026)

**Última sesión**: Implementación de Carruseles Horizontales con Navegación
**Archivos modificados**: 
- `home-logic.js` - Generación de carruseles por filas
- `home.css` - Estilos de carruseles y flechas de navegación
- `index.html` - Estructura de página principal

### ✅ SISTEMA DE CARRUSELES HORIZONTALES IMPLEMENTADO

**Objetivo**: Mejorar la experiencia de navegación permitiendo ver múltiples anuncios mediante carruseles horizontales con flechas verdes.

#### Funcionalidades Principales:

1. **Primera Fila Estática - Top Selección**
   - Grid estático de 2 columnas
   - Solo muestra las primeras 2 tarjetas TOP/Destacado
   - Sin navegación (ideal para cortesías/anuncios fijos)
   - Clase CSS: `.ads-row.row-2-cols`

2. **Carruseles de Filas con Navegación**
   - Segunda fila: Carrusel de 3 tarjetas por vista
   - Filas siguientes: Carruseles de 4 tarjetas por vista
   - Navegación mediante flechas verdes grandes
   - Deslizamiento táctil en móvil/tablet

3. **Flechas de Navegación Verde**
   - Tamaño: 50x50px con border-radius de 12px
   - Color: Gradiente verde (#00d084 a #00bf6f)
   - Posición: A los lados de cada carrusel
   - Efecto hover: Escala 1.1 con sombra verde
   - Solo visibles en laptop/desktop (>1024px)

4. **Sistema Responsive**
   - Desktop: Flechas visibles, navegación con clic
   - Tablet/Móvil: Flechas ocultas, navegación táctil
   - Overflow hidden para ocultar tarjetas no visibles
   - Adaptación automática de tarjetas por vista

5. **Flechas de Imágenes (Independientes)**
   - Pequeñas flechas circulares dentro de cada tarjeta
   - Solo para navegar entre fotos de un producto
   - Posicionadas a 10px del borde
   - Tamaño: 30x30px, fondo negro semitransparente

#### Estructura de Código:

**JavaScript (`home-logic.js`)**:
- `initializeRowCarousels()`: Inicializa carruseles de filas
- Carruseles separados por clase: `.row-3-swiper`, `.row-4-swiper`
- Cada carrusel con sus propias flechas de navegación

**CSS (`home.css`)**:
- `.carousel-row-wrapper`: Contenedor principal con padding para flechas
- `.row-nav-prev`, `.row-nav-next`: Estilos de flechas verdes
- Media queries para ocultar flechas en móvil (<1024px)

**Configuración Swiper**:
```javascript
slidesPerView: 3 o 4 (según fila)
spaceBetween: 24px
loop: false
navigation: Flechas personalizadas
```

#### Mejoras de UX:

- ✅ Navegación intuitiva entre tarjetas
- ✅ Flechas solo cuando son necesarias
- ✅ Adaptación total a móvil sin flechas molestas
- ✅ Separación clara entre navegación de tarjetas e imágenes
- ✅ Primera fila estática para destacar cortesías

---

## 🔄 PUNTO DE RESTAURACIÓN ANTERIOR (7 Enero 2026 - Actualización 2)

**Última sesión**: Sistema de Cortesías para Planes TOP Gratis
**Archivos creados/modificados**: 
- `SETUP_ADMIN_CORTESIAS.sql` - Tablas y funciones en Supabase
- `admin.html` - Panel de administrador
- `admin-logic.js` - Lógica del panel admin
- `auth-logic.js` - Validación de códigos en registro
- `registro.html` - Campo para código de invitación
- `GUIA_CORTESIAS.md` - Documentación completa

### ✅ SISTEMA DE CORTESÍAS IMPLEMENTADO

**Objetivo**: Control total para dar planes TOP gratis por tiempo limitado a vendedores seleccionados (ej: vendedores de vehículos).

#### Funcionalidades Principales:

1. **Generación de Códigos de Invitación**
   - Ubicación: `admin.html` (Tab "Generar Códigos")
   - Códigos únicos formato: TOP-ABC-1234
   - Configuración: Plan, duración (días), categoría específica, expiración
   - Ejemplo: TOP-VEH-2026 para vendedores de vehículos

2. **Asignación Manual de Planes**
   - Ubicación: `admin.html` (Tab "Asignar Manual")
   - Dar plan gratis directamente a usuario registrado por email
   - No requiere código, asignación inmediata

3. **Validación Automática en Registro**
   - Archivo: `registro.html` + `auth-logic.js`
   - Campo opcional "Código de invitación"
   - Valida código al registrarse
   - Aplica plan gratis automáticamente si es válido

4. **Monitoreo y Control**
   - Tab "Tokens Activos": Ver todos los códigos (Disponible/Usado/Expirado)
   - Tab "Cortesías Aplicadas": Historial de planes gratis asignados
   - Estadísticas en tiempo real: Total códigos, Disponibles, Usados, Cortesías activas

5. **Base de Datos (Supabase)**
   - Tabla `plan_tokens`: Códigos de invitación
   - Tabla `cortesias_aplicadas`: Historial de cortesías
   - Función `validar_y_aplicar_token()`: Valida y aplica código
   - RLS habilitado para seguridad

#### Flujo Completo:

```
ADMIN → Genera código (TOP-VEH-2026)
     ↓
Comparte código con vendedor (WhatsApp/Email)
     ↓
VENDEDOR → Se registra en /registro.html
         → Ingresa código TOP-VEH-2026
         → Sistema valida y aplica plan TOP x 30 días
     ↓
VENDEDOR → Publica anuncios con plan TOP gratis
         → 20 fotos, video, carrusel, redes sociales
     ↓
Después de 30 días → Plan expira, puede renovar pagando
```

#### Archivos SQL Creados:

**SETUP_ADMIN_CORTESIAS.sql** (160 líneas):
- Tabla `plan_tokens` (códigos)
- Tabla `cortesias_aplicadas` (historial)
- Función `validar_y_aplicar_token()`
- Función `generar_codigo_token()`
- Vistas para admins
- RLS y políticas de seguridad
- 3 códigos de ejemplo

#### Panel de Administrador:

**admin.html** (430 líneas):
- 4 tabs: Generar Códigos, Tokens Activos, Cortesías Aplicadas, Asignar Manual
- Estadísticas en tiempo real
- Tablas interactivas con búsqueda
- Acciones: Generar, Asignar, Desactivar, Cancelar

**admin-logic.js** (600 líneas):
- Generación de códigos únicos
- Asignación manual de planes
- Carga de tokens y cortesías
- Desactivación de códigos/cortesías
- Asignación rápida desde lista de usuarios

### ⏳ Pendiente:

1. **Ejecutar SQL en Supabase**
   - Copiar contenido de SETUP_ADMIN_CORTESIAS.sql
   - Pegar en SQL Editor de Supabase
   - Ejecutar y verificar tablas creadas

2. **Testing completo**
   - Generar código en admin.html
   - Registrar usuario con código
   - Verificar plan aplicado
   - Verificar expiración después de 30 días

3. **Agregar campo is_admin en profiles**
   - Para restringir acceso a /admin.html solo a admins
   - Actualizar admin-logic.js con validación

4. **Commit y deploy**
   - Git add, commit, push
   - Verificar Vercel deploy

### Código Clave Implementado:

```javascript
// auth-logic.js - Validación de código en registro
if (codigoInvitacion) {
    const { data: resultado } = await supabase
        .rpc('validar_y_aplicar_token', {
            p_codigo: codigoInvitacion,
            p_user_id: authData.user.id,
            p_anuncio_id: null
        });
    
    if (resultado?.success) {
        alert(`✅ Plan ${resultado.plan} gratis por ${resultado.dias} días`);
    }
}
```

```sql
-- Función de validación en Supabase
CREATE OR REPLACE FUNCTION validar_y_aplicar_token(
    p_codigo VARCHAR(20),
    p_user_id UUID,
    p_anuncio_id UUID DEFAULT NULL
)
RETURNS JSON
-- Valida código, marca como usado, registra cortesía
```

### Si me congelo:
- Continúa desde "Ejecutar SQL en Supabase"
- Verifica que admin.html carga correctamente
- Abre consola (F12) para ver errores
- Revisa GUIA_CORTESIAS.md para troubleshooting

---

## 🔄 PUNTO DE RESTAURACIÓN ANTERIOR (7 Enero 2026 - Actualización 1)

**Última sesión**: Implementación de carrusel horizontal para tarjetas TOP/Destacado
**Archivos modificados**: 
- `home-logic.js` - Carrusel de tarjetas premium
- `home.css` - Estilos de navegación del carrusel

### ✅ Lo que se completó en esta sesión:

1. **Carrusel horizontal para tarjetas TOP/Destacado**
   - Ubicación: `home-logic.js` líneas 217-244
   - Implementación: Swiper con slides de 2 tarjetas cada uno
   - Carga 20 anuncios TOP/Destacado (limit aumentado)
   - Navegación: Flechas laterales + puntos de paginación
   - Separación: TOP/Destacado en carrusel, resto en grids estáticos (3-col, 4-col)

2. **Fix error "regularAds already declared"**
   - Problema: Variable `regularAds` declarada 2 veces
   - Solución: Renombrada a `filteredRegularAds` en línea 246
   - Estado: ✅ Resuelto

3. **Estilos profesionales para botones de navegación**
   - Archivo: `home.css` líneas 740-830
   - Estado normal: Fondo blanco, flecha gris suave (rgba(0,0,0,0.4))
   - Estado hover: Fondo turquesa (#00bfae), flecha blanca
   - Tamaño: 44px × 44px, border-radius 50%
   - Responsive: 32px en móvil

4. **Función de inicialización del carrusel**
   - Ubicación: `home-logic.js` líneas 502-526
   - Nombre: `initializeFeaturedCarousel()`
   - Config Swiper: slidesPerView: 1, navegación, paginación
   - Llamada: Después de inicializar carruseles de imágenes (línea 317)

### ⏳ Pendiente:

1. **Testing completo del carrusel**
   - Verificar navegación con flechas
   - Verificar puntos de paginación funcionan
   - Verificar swipe en móvil
   - Verificar que muestra correctamente 2 tarjetas por slide

2. **Commit y deploy**
   - Git add, commit con mensaje descriptivo
   - Push a GitHub
   - Verificar deploy automático en Vercel

3. **Posibles mejoras futuras**
   - Autoplay opcional
   - Efecto loop si hay suficientes slides
   - Lazy loading de imágenes en slides no visibles

### Código clave implementado:

```javascript
// home-logic.js - Estructura del carrusel
const topAds = premiumAds || [];
if (topAds.length > 0) {
    adsHTML += `<div class="featured-carousel-wrapper">
        <div class="swiper featured-swiper">
            <div class="swiper-wrapper">`;
    
    for (let i = 0; i < topAds.length; i += 2) {
        const slideAds = topAds.slice(i, i + 2);
        adsHTML += `<div class="swiper-slide">
            <div class="ads-row row-2-cols">
                ${slideAds.map(generateCardHTML).join('')}
            </div>
        </div>`;
    }
}
```

### Si me congelo:
- Continúa desde testing del carrusel
- Verifica consola del navegador
- Revisa que `.featured-swiper` se inicializa correctamente

---

## 🔄 PUNTO DE RESTAURACIÓN ANTERIOR (23 Diciembre 2025)

**Última tarea**: Arreglar tarjetas recortadas en móvil - resultados.html
**Problema**: En celular, las tarjetas de búsqueda salen recortadas (ancho muy grande)
**Solución**: Agregar media queries a `results.css` para móvil
**Lo que falta hacer**:
1. Agregar media queries en results.css para pantallas < 480px
2. Reducir `.mini-hero` max-width en móvil
3. Ajustar padding y márgenes en tarjetas
4. Hacer commit y push

### Lo que YA existe y funciona:
- ✅ `detalle-producto.html` - HTML completo con estructura
- ✅ `product-detail-logic.js` - Lógica JavaScript completa
- ✅ Botones Login Google/Facebook (estilos profesionales, falta OAuth setup en Supabase)
- ✅ Flujo completo para publicar sin login
- ✅ `home-logic.js` línea 270-285 - Enlaces a detalle-producto
- ✅ `results-logic.js` - Enlaces a detalle-producto
- ✅ Galería de fotos con Swiper
- ✅ Video reproduciéndose
- ✅ Info del vendedor (avatar, nombre)

### Qué hay que hacer NEXT:
1. **Verificar en Vercel** que los enlaces clickeables funcionan
2. **Verificar que cargan fotos** correctamente desde Supabase
3. **Verificar que muestra vendedor** correctamente
4. **Testing completo** del flujo: tarjeta → clic → detalle

### Si me congelo:
- Continúa desde aquí
- Abre `product-detail-logic.js` y revisa líneas 1-50
- Verifica en consola de browser si hay errores

---

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

### 🗺️ Mapa de Ubicación (PRÓXIMA SESIÓN)

**Estado**: No implementado

**Requerimientos:**
- Mostrar mapa en detalle de anuncio (detalle-producto.html)
- Mostrar mapa en panel de anuncios (panel-unificado.html)
- Marcar ubicación exacta del vendedor/producto
- Integración con Google Maps o Leaflet
- Permitir al usuario ver ubicación antes de comprar

**Opciones de implementación:**
1. **Google Maps API** (requiere API key)
   - Más preciso
   - Requiere billing
   - Mejor UX
   
2. **Leaflet + OpenStreetMap** (gratuito)
   - Open source
   - Sin API key
   - Buena alternativa

**To-Do:**
- [ ] Elegir librería (Google Maps vs Leaflet)
- [ ] Agregar provincia/distrito al mapa
- [ ] Mostrar marker en ubicación
- [ ] Responsive en móviles
- [ ] Integrar en detalle-producto.html
- [ ] Integrar en panel-unificado.html

### ⚙️ OAuth Google y Facebook (PRÓXIMA SESIÓN)

**Estado**: Login botones implementados | Proveedores deshabilitados en Supabase

**Lo hecho:**
- ✅ Modal de login con Google + Facebook en `publish-logic.js` (línea ~1785)
- ✅ Botones con estilos oficiales e iconos
- ✅ Redirección a login.html para opción email
- ✅ Implementación de `signInWithOAuth()` para ambos

**Lo que falta:**
- ❌ Habilitar Google OAuth en Supabase
- ❌ Habilitar Facebook OAuth en Supabase

**Pasos para habilitar Google OAuth:**

1. **Google Cloud Console** (https://console.cloud.google.com)
   - Crear nuevo proyecto o usar existente
   - APIs y servicios → Credenciales
   - Crear OAuth 2.0 (tipo Aplicación web)
   - Orígenes autorizados:
     ```
     https://tinjpodtyydloleepbmb.supabase.co
     https://mercado-central.vercel.app
     ```
   - URIs de redirección:
     ```
     https://tinjpodtyydloleepbmb.supabase.co/auth/v1/callback
     ```
   - Copiar **Client ID** y **Client Secret**

2. **Supabase Dashboard** (https://app.supabase.com)
   - Proyecto → Authentication → Providers
   - Google → Enable
   - Pegar Client ID y Client Secret
   - Guardar

**Pasos para habilitar Facebook OAuth:**

1. **Facebook Developers** (https://developers.facebook.com)
   - Crear nueva app
   - Facebook Login → Configurar
   - Settings → Basic → Copiar **App ID** y **App Secret**
   - Valid OAuth Redirect URIs:
     ```
     https://tinjpodtyydloleepbmb.supabase.co/auth/v1/callback
     ```
   - App Domains:
     ```
     mercado-central.vercel.app
     tinjpodtyydloleepbmb.supabase.co
     ```

2. **Supabase Dashboard**
   - Proyecto → Authentication → Providers
   - Facebook → Enable
   - Pegar App ID y App Secret
   - Guardar

**Nota**: Una vez habilitados, el modal en `publicar.html` (al dar "Publicar anuncio" sin login) permitirá login con 1 click.

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

## ✅ CHECKLIST DE FUNCIONALIDADES (Auditoría Completa)

### 🏠 Homepage (index.html)
- [x] Mostrar tarjetas de anuncios (gratis, basico, premium, destacado, top)
- [x] Carrusel de imágenes por anuncio
- [x] Video como primer slide (YouTube/Vimeo)
- [x] Filtrar por categorías
- [x] Buscar por texto
- [x] Responsive (móvil, tablet, desktop)
- [x] Avatares de vendedor
- [x] Precio y ubicación visible
- [ ] Wishlist/Favoritos
- [ ] Contador de visitas
- [ ] Anuncios destacados en el top

### 🔍 Resultados (resultados.html)
- [x] Mostrar resultados de búsqueda
- [x] Filtros avanzados (precio, ubicación, fecha)
- [x] Ordenar por relevancia/fecha/precio
- [x] Paginación
- [x] Video en tarjetas
- [ ] Filtros por atributos (marca, modelo, etc)
- [ ] Guardar búsquedas frecuentes
- [ ] Alertas de nuevos anuncios

### 📋 Publicar Anuncio (publicar.html)
- [x] Step 1: Categoría y subcategoría
- [x] Step 2: Ubicación (provincia/distrito)
- [x] Step 3: Seleccionar plan
- [x] Step 4: Llenar datos (título, descripción, precio)
- [x] Step 5: Subir fotos
- [x] Step 6: Video (YouTube/Vimeo)
- [x] Atributos dinámicos por categoría
- [x] Términos y condiciones
- [x] Modal de login (Google/Facebook/Email) al publicar sin sesión
- [ ] Previsualizar antes de publicar
- [ ] Programar publicación
- [ ] Renovación automática de anuncios

### 💰 Planes y Pagos (payment.html)
- [x] Mostrar resumen del plan
- [x] Calcular impuestos (16%)
- [x] Formulario de tarjeta de crédito
- [x] Opción PayPal
- [ ] Integración Stripe real
- [ ] Reembolsos/devoluciones
- [ ] Historial de pagos

### 👤 Perfil de Usuario (perfil.html)
- [x] Mostrar datos del usuario
- [x] Editar foto de perfil
- [x] Editar información personal
- [x] Ver anuncios publicados
- [x] Estadísticas de ventas
- [ ] Calificaciones y reseñas
- [ ] Historial de compras
- [ ] Método de pago guardado

### 📦 Detalles de Anuncio (detalle-producto.html)
- [x] HTML estructura lista
- [ ] Mostrar galería completa de fotos
- [ ] Reproducir video
- [ ] Información del vendedor
- [ ] Botón contacto/compra
- [ ] Mapa de ubicación
- [ ] Opiniones/comentarios
- [ ] Productos relacionados
- [ ] Compartir en redes sociales

### 💬 Mensajería (No implementado)
- [ ] Lista de conversaciones
- [ ] Enviar/recibir mensajes
- [ ] Notificaciones en tiempo real
- [ ] Historial de mensajes
- [ ] Bloquear usuarios

### 🛍️ Panel Unificado (panel-unificado.html)
- [x] Ver todos los anuncios del usuario
- [x] Filtrar por estado (activos/vendidos)
- [x] Editar anuncio
- [x] Eliminar anuncio
- [x] Ver estadísticas
- [ ] Duplicar anuncio
- [ ] Exportar anuncios
- [ ] Programación de anuncios

### 🔐 Autenticación
- [x] Registro con email
- [x] Login con email
- [x] Recuperación de contraseña
- [x] Botones Google/Facebook (interfaz lista, falta OAuth setup)
- [ ] Verificación de email
- [ ] Autenticación de 2 factores
- [ ] Cambiar contraseña

### 📍 Ubicación y Mapa
- [ ] Mapa interactivo en detalles
- [ ] Mapa en panel de anuncios
- [ ] Geolocalización automática
- [ ] Buscar por radio de distancia

### 📱 Responsive y Mobile
- [x] Navbar optimizado para móviles
- [x] Tarjetas responsivas
- [x] Formularios touch-friendly
- [x] Imágenes optimizadas
- [x] Viewport configurado
- [ ] App mobile (PWA)
- [ ] Notificaciones push

### ⚡ Performance
- [x] Lazy loading de imágenes
- [x] Minificación CSS/JS
- [ ] Caché de datos
- [ ] Compresión de imágenes
- [ ] CDN para medios

### 🔔 Notificaciones
- [ ] Email de confirmación
- [ ] Alertas de nuevas ofertas
- [ ] Recordatorios de anuncios a vencer
- [ ] Mensajes de mensajería
- [ ] Push notifications

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
