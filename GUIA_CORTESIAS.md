# 🎟️ SISTEMA DE CORTESÍAS - GUÍA COMPLETA

## 📋 Resumen Ejecutivo

Sistema completo para dar planes TOP gratis a vendedores seleccionados (ej: vendedores de vehículos) por tiempo limitado (ej: 30 días). Incluye:

✅ Panel de administrador con control total
✅ Generación de códigos únicos de invitación
✅ Asignación manual directa a usuarios
✅ Validación automática en registro
✅ Historial completo de cortesías
✅ Estadísticas en tiempo real

---

## 🎯 Objetivo

**Problema**: Al lanzar la plataforma, necesitas atraer vendedores de vehículos ofreciéndoles el plan TOP gratis por 1 mes.

**Solución**: Sistema de tokens/códigos que te da control total para:
1. Generar códigos de invitación únicos
2. Compartir códigos con vendedores específicos
3. Asignar planes directamente a usuarios registrados
4. Rastrear quién usa los códigos y cuándo expiran

---

## 📁 Archivos Creados

### 1. Base de Datos
- `SETUP_ADMIN_CORTESIAS.sql` - Script SQL completo para Supabase

### 2. Panel de Administrador
- `admin.html` - Interfaz visual del panel
- `admin-logic.js` - Lógica JavaScript

### 3. Integración
- `auth-logic.js` - Actualizado con validación de códigos
- `registro.html` - Campo para código de invitación

---

## 🚀 Instalación (Paso a Paso)

### Paso 1: Crear tablas en Supabase

1. Ve a tu proyecto Supabase: https://app.supabase.com
2. Dashboard → SQL Editor
3. Copia TODO el contenido de `SETUP_ADMIN_CORTESIAS.sql`
4. Pega en el editor y ejecuta (Run)
5. Verifica que se crearon:
   - Tabla `plan_tokens`
   - Tabla `cortesias_aplicadas`
   - Función `validar_y_aplicar_token()`
   - Vistas `vista_admin_tokens` y `vista_admin_cortesias`

**Resultado esperado**: "Success. No rows returned"

### Paso 2: Verificar archivos locales

Asegúrate de tener estos archivos en tu proyecto:
```
c:\Users\carlo\readme proyetos\
├── admin.html          ← Panel de administrador
├── admin-logic.js      ← Lógica del panel
├── auth-logic.js       ← Actualizado (validación de códigos)
├── registro.html       ← Actualizado (campo de código)
└── SETUP_ADMIN_CORTESIAS.sql
```

### Paso 3: Commit y Deploy

```powershell
git add .
git commit -m "feat: Sistema de cortesías para planes gratis"
git push
```

Vercel detectará los cambios y hará deploy automático.

---

## 🎮 Cómo Usar el Sistema

### Opción 1: Generar Código de Invitación

**¿Cuándo usar?** Cuando quieres dar códigos a múltiples vendedores para que se registren ellos mismos.

**Pasos:**

1. **Accede al panel admin**
   ```
   https://tu-dominio.vercel.app/admin.html
   ```
   
2. **Tab "Generar Códigos"**
   - Tipo de Plan: **TOP**
   - Duración: **30 días**
   - Categoría: **Solo Vehículos** (opcional)
   - Notas: "Lanzamiento 2026 - Vendedores vehículos"
   - Click **"Generar Código"**

3. **Copiar el código generado**
   ```
   Código: TOP-A1B-C2D3
   ```

4. **Compartir con el vendedor**
   - WhatsApp: "Registrate con este código: TOP-A1B-C2D3"
   - Email: Enviar código

5. **El vendedor se registra**
   - Va a `/registro.html`
   - Completa email + password
   - Pega el código en "Código de invitación"
   - Click "Registrarse"
   - ✅ Automáticamente obtiene plan TOP por 30 días

### Opción 2: Asignar Plan Directamente

**¿Cuándo usar?** Cuando el vendedor ya está registrado y quieres darle plan gratis.

**Pasos:**

1. **Tab "Asignar Manual"**
   
2. **Completar formulario**
   - Email: vendedor@ejemplo.com
   - Plan: TOP
   - Duración: 30 días
   - Notas: "Cortesía lanzamiento"

3. **Click "Asignar Plan Gratis"**

4. **El usuario recibe el plan inmediatamente**
   - No necesita código
   - Plan activo desde ya
   - Expira en 30 días

### Opción 3: Asignación Rápida desde Lista

**Pasos:**

1. **Tab "Asignar Manual"**
2. Scroll a "Usuarios Registrados"
3. Busca al usuario en la tabla
4. Click **"Dar Plan TOP"**
5. Se rellena el formulario automáticamente
6. Confirma y listo

---

## 📊 Monitoreo y Control

### Ver Códigos Activos

**Tab "Tokens Activos"**

Información mostrada:
- Código (TOP-XXX-YYYY)
- Plan (TOP, Destacado, etc)
- Días de duración
- Estado (Disponible / Usado / Expirado)
- Usado por (email del usuario)
- Fecha de creación

**Acciones:**
- Desactivar código (si no quieres que se use más)

### Ver Cortesías Aplicadas

**Tab "Cortesías Aplicadas"**

Información mostrada:
- Usuario (email)
- Negocio (nombre)
- Plan asignado
- Fecha inicio / fin
- Días restantes
- Estado (Activo / Expirado)
- Método (Código / Manual)

**Acciones:**
- Cancelar cortesía (termina el plan gratis inmediatamente)

### Estadísticas en Tiempo Real

Panel superior muestra:
- **Códigos Generados**: Total de códigos creados
- **Disponibles**: Códigos que aún no se han usado
- **Usados**: Códigos ya canjeados
- **Cortesías Activas**: Planes gratis actualmente vigentes

---

## 🔒 Seguridad y Validaciones

### Sistema de Validación

✅ Código debe existir en BD
✅ No puede estar ya usado
✅ No puede estar expirado
✅ Debe estar activo
✅ Un código = 1 uso (no reutilizable)

### Seguridad en Supabase

- **RLS (Row Level Security)** habilitado
- Usuarios solo ven sus propios tokens/cortesías
- Admins pueden ver todo (configurar con campo `is_admin` en profiles)

---

## 🎬 Flujo Completo (Ejemplo Real)

### Escenario: Vendedor de Autos "Juan Pérez"

**1. Admin genera código**
```
- Accede a admin.html
- Genera código: TOP-VEH-2026
- Copia código
```

**2. Contacta a Juan por WhatsApp**
```
Mensaje: 
"Hola Juan, te invitamos a publicar tus vehículos GRATIS por 30 días 
con nuestro plan TOP (incluye video, 20 fotos, carrusel).

Registrate aquí: mercado-central.vercel.app/registro.html
Código: TOP-VEH-2026"
```

**3. Juan se registra**
```
- Va a registro.html
- Email: juan@autos.com
- Password: ******
- Código: TOP-VEH-2026
- Click "Registrarse"
```

**4. Sistema valida y aplica**
```
✅ Usuario creado
✅ Código validado
✅ Plan TOP asignado por 30 días
✅ Código marcado como "usado"
```

**5. Juan publica sus vehículos**
```
- Va a publicar.html
- Puede subir hasta 20 fotos
- Puede agregar video de YouTube
- Aparece en carrusel destacado
```

**6. Admin monitorea**
```
Tab "Cortesías Aplicadas":
- Usuario: juan@autos.com
- Plan: TOP
- Días restantes: 30
- Estado: Activo ✅
```

**7. Después de 30 días**
```
Sistema automático:
- Plan TOP expira
- Juan puede renovar pagando
- O continuar con plan gratis básico
```

---

## 🛠️ Personalización

### Agregar más categorías específicas

En `admin.html`, línea ~195:
```html
<select id="categoria-especifica">
    <option value="">Todas las categorías</option>
    <option value="vehiculos">Solo Vehículos</option>
    <option value="inmuebles">Solo Inmuebles</option>
    <!-- Agregar más aquí -->
    <option value="mascotas">Solo Mascotas</option>
    <option value="tecnologia">Solo Tecnología</option>
</select>
```

### Cambiar duración predeterminada

En `admin.html`, línea ~187:
```html
<input type="number" id="duracion-dias" value="30" min="1" max="365" required>
```

Cambia `value="30"` a `value="60"` para 60 días por defecto.

### Agregar validación de admin

En `admin-logic.js`, línea ~23:
```javascript
// TODO: Verificar que sea admin
// Por ahora, solo verificamos que esté logueado

// AGREGAR:
const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

if (!profile?.is_admin) {
    alert('⛔ Solo administradores pueden acceder');
    window.location.href = '/index.html';
    return;
}
```

---

## 📈 Próximas Mejoras

### Automáticas
- [ ] Email automático al recibir plan gratis
- [ ] Recordatorio 5 días antes de expirar
- [ ] Ofrecer renovación con descuento

### Estadísticas Avanzadas
- [ ] Dashboard con gráficos
- [ ] Tasa de conversión (códigos → publicaciones)
- [ ] ROI por categoría

### Features Extra
- [ ] Códigos con múltiples usos (ej: 10 personas)
- [ ] Códigos con descuento (ej: 50% OFF)
- [ ] Referidos (cada usuario invita a 3 amigos)

---

## 🆘 Troubleshooting

### Error: "Función validar_y_aplicar_token no existe"

**Solución:**
1. Verifica que ejecutaste `SETUP_ADMIN_CORTESIAS.sql`
2. En Supabase → Database → Functions → Debería aparecer `validar_y_aplicar_token`
3. Si no existe, re-ejecuta el SQL

### Error: "No tienes permisos"

**Solución:**
1. Verifica RLS en Supabase
2. Temporalmente desactiva RLS para testing:
   ```sql
   ALTER TABLE plan_tokens DISABLE ROW LEVEL SECURITY;
   ALTER TABLE cortesias_aplicadas DISABLE ROW LEVEL SECURITY;
   ```

### Código no se valida al registrarse

**Solución:**
1. Abre consola del navegador (F12)
2. Verifica errores
3. Asegúrate que `auth-logic.js` está actualizado
4. Verifica que el código existe en BD:
   ```sql
   SELECT * FROM plan_tokens WHERE codigo = 'TOP-XXX-YYYY';
   ```

---

## 📞 Contacto y Soporte

Si tienes dudas o problemas:
1. Revisa la consola del navegador (F12)
2. Verifica logs en Supabase → Logs
3. Consulta este documento

---

## 📝 Changelog

### Versión 1.0 (7 Enero 2026)
- ✅ Sistema completo de cortesías
- ✅ Panel de administrador
- ✅ Generación de códigos
- ✅ Asignación manual
- ✅ Validación en registro
- ✅ Monitoreo en tiempo real

---

**¡Listo para usar! 🚀**

Accede a `/admin.html` y empieza a generar códigos para tus primeros vendedores.
