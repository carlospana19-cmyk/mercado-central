# REVISIÓN: Sistema de Planes de Pago - Mercado Central

## ✅ QUÉ ESTÁ LISTO

### 1. **Estructura HTML de Planes** (`publicar.html`)
- ✅ 5 planes definidos visualmente: GRATIS, BÁSICO, PREMIUM, DESTACADO, TOP
- ✅ Cada plan con:
  - Precio ($0, $5, $10, $20, $25)
  - Duración (30 días)
  - Beneficios listados
  - Radio buttons para selección
  - Badges (RECOMENDADO, POPULAR, BEST SELLER, MÁXIMA VISIBILIDAD)

### 2. **Configuración de Límites** (`publish-logic.js`)
```javascript
const PLAN_LIMITS = {
    'free': { maxFotos: 3, hasVideo: false, hasCarousel: false, priority: 0 },
    'basico': { maxFotos: 5, hasVideo: false, hasCarousel: false, priority: 1 },
    'premium': { maxFotos: 10, hasVideo: false, hasCarousel: true, priority: 2 },
    'destacado': { maxFotos: 15, hasVideo: false, hasCarousel: true, priority: 3 },
    'top': { maxFotos: 20, hasVideo: true, hasCarousel: true, priority: 4 }
};
```
- ✅ Cada plan tiene límites claros
- ✅ Validación de cantidad de fotos funcional
- ✅ Sistema de prioridad para ordenamiento

### 3. **Base de Datos (Supabase)**
- ✅ Tabla `anuncios` tiene campos:
  - `featured_plan` (free, basico, premium, destacado, top)
  - `featured_until` (fecha de expiración)
  - `plan_priority` (número para ordenamiento)
  - `max_images` (límite de fotos por plan)

### 4. **Lógica de Guardado**
- ✅ El plan seleccionado se guarda en `featured_plan`
- ✅ Se calcula fecha de expiración (+30 días)
- ✅ Se almacena prioridad para ordenamiento

---

## ⚠️ QUÉ FALTA IMPLEMENTAR

### 1. **Sistema de Pagos (CRÍTICO)**
❌ No existe integración con pasarela de pago
- Sin Stripe, PayPal, 2Checkout, etc.
- Los planes pagos (Básico, Premium, Destacado, Top) **NO se pueden cobrar**
- Actualmente cualquiera puede seleccionar planes pagos sin pagar

**Opciones:**
- **Stripe**: Recomendado, fácil integración
- **PayPal**: Alternativa popular
- **Mercado Pago**: Bueno para Latinoamérica
- **2Checkout**: Múltiples métodos de pago

### 2. **Tabla de Suscripciones** (IMPORTANTE)
❌ No existe tabla para rastrear:
- Pagos efectuados
- Historial de suscripciones
- Fechas reales de inicio/fin
- Estado de la suscripción (activa, expirada, cancelada)

**Necesario crear:**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID FK,
  ad_id UUID FK,
  plan VARCHAR(20),
  payment_id VARCHAR(100),
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  status VARCHAR(20), -- 'pending', 'completed', 'failed', 'refunded'
  started_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY,
  user_id UUID FK,
  subscription_id UUID FK,
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  status VARCHAR(20),
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  error_message TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 3. **Validación de Acceso al Plan**
❌ No hay verificación si el usuario:
- Ya pagó el plan seleccionado
- Tiene suscripción activa
- Puede publicar anuncios con ese plan

**Necesario:**
- Middleware que verifique suscripciones activas antes de publicar
- Lógica para mostrar solo anuncios de planes ya pagados

### 4. **Interfaz de Checkout**
❌ No existe página de pago
- Sin formulario de tarjeta
- Sin confirmación de pago
- Sin recepción de confirmación

**Necesario:**
- `checkout.html` con formulario seguro
- Integración con Stripe/PayPal/etc
- Redirección post-pago

### 5. **Confirmación de Pago**
❌ Sin webhooks para:
- Confirmar pago completado
- Actualizar estado de suscripción
- Activar el plan en el anuncio
- Enviar confirmación por email

### 6. **Dashboard de Suscripciones**
❌ Usuario no puede ver:
- Sus planes activos
- Historial de pagos
- Fechas de expiración
- Opción de renovar

**Sugerir:** Agregar sección en `panel-unificado.html`

### 7. **Renovación de Planes**
❌ No existe sistema para:
- Renovar automáticamente
- Renovar manualmente
- Mostrar alerta antes de expirar

### 8. **Gestión de Planes Gratis**
✅ Plan gratis funciona (sin pago)
⚠️ Pero falta:
- Límite de anuncios simultáneos por usuario
- Renovación automática después de 30 días
- Gestión de anuncios expirados

---

## 📋 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Fase 1: Infraestructura Base (1-2 días)
1. Crear tablas `subscriptions` y `payment_transactions`
2. Añadir RLS policies para seguridad
3. Validar estructura de datos

### Fase 2: Integración de Pasarela (2-3 días)
1. Elegir pasarela (Stripe recomendado)
2. Crear archivo de configuración (`stripe-config.js`)
3. Implementar funciones de pago
4. Crear `checkout.html`

### Fase 3: Lógica de Validación (1-2 días)
1. Verificación de suscripción antes de publicar
2. Middleware de autenticación
3. Manejo de errores de pago

### Fase 4: Webhooks y Confirmación (1-2 días)
1. Configurar webhooks de la pasarela
2. Actualizar suscripciones automáticamente
3. Emails de confirmación

### Fase 5: Dashboard de Usuario (1 día)
1. Agregar sección de suscripciones
2. Mostrar historial de pagos
3. Opción de renovar

### Fase 6: Testing (1 día)
1. Modo prueba de pasarela
2. Pruebas de flujo completo
3. Manejo de errores

---

## 🎯 RESUMEN RÁPIDO

| Aspecto | Estado | Prioridad |
|--------|--------|-----------|
| UI de Planes | ✅ Listo | - |
| Límites por Plan | ✅ Listo | - |
| BD (anuncios) | ✅ Listo | - |
| **Pasarela de Pago** | ❌ Falta | 🔴 CRÍTICA |
| **Tabla de Suscripciones** | ❌ Falta | 🔴 CRÍTICA |
| **Validación de Acceso** | ❌ Falta | 🔴 CRÍTICA |
| Checkout | ❌ Falta | 🟠 Alta |
| Webhooks | ❌ Falta | 🟠 Alta |
| Dashboard Pagos | ❌ Falta | 🟡 Media |
| Renovación | ❌ Falta | 🟡 Media |

---

## 💡 RECOMENDACIÓN

**Empezar por:** Crear tablas de Supabase + Integrar Stripe (es más fácil que PayPal)

**Tiempo estimado:** 5-7 días de desarrollo

