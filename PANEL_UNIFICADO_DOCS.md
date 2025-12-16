# 🎯 PANEL UNIFICADO - Documentación

## 📋 Resumen

Se ha implementado un **Panel Unificado** moderno que integra tanto el **Perfil del Usuario** como el **Panel de Control de Anuncios** en una sola página.

### ✨ Características Principales

#### 1. **Tarjeta de Perfil Mejorada (Header)**
- Foto de perfil con botón de cambio rápido
- Nombre completo y nombre del negocio
- Información de contacto (email, teléfono, WhatsApp)
- **Estadísticas en tiempo real:**
  - Total de anuncios publicados
  - Anuncios activos
  - Anuncios vendidos

#### 2. **Sistema de Tabs Modernos**
Dos secciones principales:
- **📋 Mis Anuncios** - Gestión completa de anuncios
- **👤 Mi Perfil** - Edición de información personal y de negocio

#### 3. **Sección de Anuncios Completa**
- **Filtros dinámicos:** Todos, Activos, Vendidos
- **Tarjetas visuales** con:
  - Imagen del producto
  - Título y precio
  - Categoría
  - Estado (vendido/activo)
  - Tres acciones por anuncio:
    - ✏️ **Editar** - Ir a formulario de edición
    - ✓ **Vendido/Reactivar** - Toggle del estado
    - 🗑️ **Eliminar** - Eliminar anuncio

#### 4. **Sección de Perfil Completa**
Todos los campos del perfil original:
- **Información Personal**
  - Nombre completo
  - Email (solo lectura)
  - Teléfono
  - WhatsApp
  
- **Información de Negocio**
  - Nombre del negocio/marca
  - Tipo de negocio
  - Descripción/Bio

- **Ubicación**
  - Provincia
  - Distrito
  - Dirección

## 🗂️ Estructura de Archivos

### Nuevos Archivos Creados:

```
panel-unificado.html          ← Página principal
panel-unificado-logic.js      ← Lógica (JavaScript module)
panel-unificado.css           ← Estilos modernos
```

### Archivos Modificados:

- `index.html` - Actualizar botón de panel
- `publicar.html` - Actualizar botón de panel
- `login.html` - Redirigir a panel unificado
- `registro.html` - Redirigir a panel unificado
- `dashboard.html` - Redirigir a panel unificado
- `detalle-producto.html` - Redirigir a panel unificado
- `resultados.html` - Redirigir a panel unificado
- `editar-anuncio-logic.js` - Redirigir a panel unificado (2 instancias)
- `perfil-logic.js` - Redirigir a panel unificado (2 instancias)
- `publish-logic.js` - Redirigir a panel unificado
- `main.js` - Agregar reconocimiento de panel-unificado.html

## 🎨 Diseño Visual

### Colores y Estilos

**Paleta de colores:**
- **Primario:** #00bfae (Teal)
- **Secundario:** #008f88 (Teal oscuro)
- **Fondo:** Gradiente de azul claro a gris claro
- **Blanco:** #ffffff (Cards y componentes)
- **Texto:** #1a1a1a (Oscuro)

### Componentes Principales

#### Header del Perfil
```
┌─────────────────────────────────────────────────┐
│ [👤] Nombre Usuario          Email, Teléfono  │
│      Nombre Negocio          WhatsApp          │
│                                                 │
│  📊 Anuncios │ 📊 Activos │ 📊 Vendidos      │
└─────────────────────────────────────────────────┘
```

#### Tabs de Navegación
```
┌─────────────────────────────────────┐
│ 📋 Mis Anuncios | 👤 Mi Perfil    │
└─────────────────────────────────────┘
```

#### Tarjetas de Anuncios
```
┌──────────────────────────────┐
│ [VENDIDO]                    │
│                              │
│ [    Imagen    ]             │
│                              │
│ Título del Anuncio           │
│ $1,500.00                    │
│ 🏷️ Categoría                │
│                              │
│ [Editar][Vendido][Eliminar] │
└──────────────────────────────┘
```

## 🔧 Funcionalidades JavaScript

### Cargar Datos
```javascript
- loadUserProfile()      // Carga perfil del usuario
- loadUserAds()         // Carga anuncios del usuario
- renderAds(ads)        // Renderiza tarjetas de anuncios
```

### Gestión de Anuncios
```javascript
- toggleSoldStatus()    // Cambiar estado vendido/activo
- deleteAd()            // Eliminar anuncio
- filterAds()           // Filtrar por estado
```

### Gestión de Perfil
```javascript
- saveProfile()         // Guardar cambios del perfil
- handlePhotoUpload()   // Subir foto de perfil
- updateCharCounts()    // Actualizar contadores de caracteres
```

### Navegación
```javascript
- switchTab()           // Cambiar entre tabs
- initializeEventListeners()  // Inicializar eventos
```

## 📱 Responsive Design

El panel es completamente responsivo:

- **Desktop:** Grid de 3 columnas para anuncios
- **Tablet:** Grid de 2 columnas
- **Mobile:** 1 columna
- **Mobile pequeño:** Ajustes en fuentes y espaciado

## 🔐 Autenticación

El panel requiere que el usuario esté autenticado:
```javascript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
    window.location.href = 'login.html';
    return;
}
```

## 💾 Datos Guardados

### Tabla `perfiles`
```
- user_id (PK)
- nombre_completo
- telefono
- whatsapp
- nombre_negocio
- tipo_negocio
- descripcion
- provincia
- distrito
- direccion
- url_foto_perfil
```

### Tabla `anuncios`
```
- id (PK)
- user_id (FK)
- titulo
- descripcion
- precio
- categoria
- is_sold (BOOLEAN)
- url_portada
- url_galeria (array)
- ... otros campos
```

## 🎯 Flujo de Usuario

1. Usuario inicia sesión
2. Al hacer clic en "Mi Panel" → Va a `panel-unificado.html`
3. Se cargan automáticamente:
   - ✅ Datos de perfil
   - ✅ Todos los anuncios del usuario
   - ✅ Estadísticas en tiempo real
4. Usuario puede:
   - 📝 Ver/Editar su perfil en el tab "Mi Perfil"
   - 📋 Gestionar anuncios en el tab "Mis Anuncios"
   - 🔄 Cambiar estado de vendido/activo
   - 🗑️ Eliminar anuncios
   - ✏️ Editar anuncios (va a editar-anuncio.html)
   - 📸 Cambiar foto de perfil desde el header

## 🚀 URLs

- **Panel Unificado:** `/panel-unificado.html`
- **Panel Antiguo (aún funcional):** `/dashboard.html`
- **Perfil Antiguo (aún funcional):** `/perfil.html`

> ✅ Todos los botones de navegación redirigen al panel unificado.

## 🎓 Mejoras Implementadas

1. **UX Mejorada**
   - Una sola página en lugar de dos
   - Menos clics para acceder a información
   - Estadísticas visibles de inmediato

2. **Diseño Moderno**
   - Gradientes y sombras sofisticadas
   - Animaciones suaves en tabs
   - Tarjetas con hover effects

3. **Funcionalidad**
   - Filtros dinámicos de anuncios
   - Cambio de foto desde el header
   - Toggle vendido/activo instantáneo
   - Contadores de caracteres en perfil

4. **Responsividad**
   - Adaptado a todos los tamaños de pantalla
   - Touch-friendly en móviles
   - Performance optimizado

## ⚙️ Notas Técnicas

- Módulo ES6: `panel-unificado-logic.js` se importa directamente
- CSS separado: `panel-unificado.css` para mejor mantenimiento
- Supabase: Integración completa con RLS y Storage
- Lazy loading: Los datos se cargan al abrir la página
- Validación: Confirmación antes de eliminar anuncios

---

**Última actualización:** 13 de diciembre de 2025  
**Estado:** ✅ Completamente funcional
