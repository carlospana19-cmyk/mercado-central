# 🏪 Mercado Central - Panel de Administración

Aplicación completa para gestionar Mercado Central con conexión a Supabase.

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar la aplicación
```bash
npm start
```

### 3. Acceder a la aplicación
- **Aplicación principal**: http://localhost:3000
- **Panel de administración**: http://localhost:3000/admin
- **Login**: http://localhost:3000/login

## 📊 Funcionalidades del Panel Admin

### Dashboard
- 📈 Estadísticas generales (total anuncios, usuarios, cortesías activas)
- 📊 Anuncios por categoría y plan
- 👥 Usuarios recientes
- 🔍 Búsqueda rápida por ID de anuncio o email de usuario

### Gestión de Anuncios
- 📋 Lista completa de anuncios con filtros
- 🔍 Filtrar por estado (activo, vendido, expirado)
- 📊 Filtrar por plan (TOP, Destacado, Premium, Básico)
- 👁️ Ver detalles completos de anuncios
- 🗑️ Eliminar anuncios
- 📊 Ver información del vendedor

### Gestión de Usuarios
- 👥 Lista completa de usuarios registrados
- 👑 Gestión de permisos de administrador
- 📊 Estadísticas de anuncios por usuario
- 📅 Fecha de registro
- 🔍 Ver perfil completo de usuarios

### Sistema de Cortesías
- 🎫 Generar códigos de invitación
- 📋 Gestionar tokens activos
- 📊 Seguimiento de cortesías aplicadas
- 👤 Asignación manual de planes gratuitos

## 🔐 Autenticación

Para acceder al panel de administración, necesitas:
1. Usuario registrado en Supabase
2. Permisos de administrador (`is_admin: true` en la tabla `profiles`)

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js + Express
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **UI**: Diseño responsive con Font Awesome

## 📁 Estructura del Proyecto

```
mercado-central/
├── admin.html              # Panel de administración
├── admin-logic.js          # Lógica del panel admin
├── index.html              # Página principal
├── login.html              # Página de login
├── resultados.html         # Página de resultados
├── panel-unificado.html    # Panel de usuario
├── publicar.html           # Formulario de publicación
├── server.js               # Servidor Express
├── package.json            # Dependencias
├── supabase-client.js      # Configuración de Supabase
├── utils-attributes.js     # Utilidades para atributos
└── config-categories.js    # Configuración de categorías
```

## 🔧 Configuración de Supabase

Asegúrate de tener configuradas las siguientes tablas en Supabase:

### Tablas Requeridas:
- `profiles` - Perfiles de usuario
- `anuncios` - Anuncios publicados
- `cortesias` - Sistema de cortesías
- `tokens` - Códigos de invitación

### Variables de Entorno:
La configuración de Supabase está en `supabase-client.js`:
```javascript
const supabaseUrl = 'https://tu-proyecto.supabase.co';
const supabaseAnonKey = 'tu-anon-key';
```

## 🎯 Próximos Pasos

1. **Conectar a Supabase real**: Reemplazar datos simulados con consultas reales
2. **Implementar autenticación completa**: Sistema de login/logout funcional
3. **Agregar más funcionalidades**: Moderación de contenido, reportes, analytics
4. **Optimizar performance**: Lazy loading, caching, pagination
5. **Seguridad**: Validaciones, sanitización, rate limiting

## 📞 Soporte

Para soporte técnico o preguntas sobre la aplicación, consulta la documentación en `WIKI_PROYECTO.md`.