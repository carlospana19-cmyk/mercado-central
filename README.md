# Mercados Central

Plataforma de clasificados para Centroamérica: tienda web (JavaScript + Supabase) y app móvil (Flutter) compartiendo el mismo backend Supabase.

## Estructura
- `*.html` / `*.js` — tienda web (páginas + lógica)
- `mercadocentral_app/` — app Flutter
- `supabase/migrations/` — migraciones SQL aplicadas al proyecto (0001–0004)

## Reglas de base de datos (importante)

### Consultas anon: columnas explícitas
`profiles` usa column-grants (0002): email/is_admin blindados a nivel de columna.
PostgREST NO expande `select='*'` respetando esos grants → devuelve 401/42501
(fail-closed). Todo consumo anónimo debe usar columnas explícitas:
`id, nombre_completo, nombre_negocio, url_foto_perfil, telefono`
Los embeds tipo `profiles(id, nombre_negocio, ...)` ya cumplen esta regla.

### Storage
Anon: solo lectura. Subidas: cada usuario autenticado solo a su propia carpeta (0002).

### Visitas
El contador de visitas se incrementa SOLO por la RPC `mc_incrementar_visitas`
(security definer, 0001). Nunca UPDATE directo desde el cliente.

### Mensajes
Los clientes solo pueden `UPDATE (leido)` (0003). Borrado individual = soft-delete
(`borrado=true`); borrar la conversación completa = borrado físico en cascada
(diseño intencional).

### Migraciones
Cada cambio de esquema/permisos va en `supabase/migrations/NNNN_descripcion.sql`,
se revisa línea a línea antes de aplicarse en el SQL Editor. NUNCA aceptar los
HINT del SQL Editor (pueden sugerir abrir permisos que cerramos a propósito).

## Git
- Staging SOLO con rutas exactas. Nunca `git add .` ni `git add -A`.
- Nunca subir: `.env`, `.kilo/`, `15`, `4`, `GeneratedPluginRegistrant.*`,
  temporales con nombres tipo ID opaco.
- Flujo estándar: 5 fases (estado → diff → staging → commit → push/sync).

## Mantenimiento mensual (dueño)
1. Security Advisor — si aparece algo nuevo, diagnosticar antes de tocar.
2. Database → Backups.
3. Uso de espacio y tráfico (Usage).
