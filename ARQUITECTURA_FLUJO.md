# 🎯 Arquitectura del Flujo de Usuarios No Registrados

## 📊 Diagrama General

```
┌─────────────────────────────────────────────────────────────────┐
│  USUARIO NO REGISTRADO ENTRA A PUBLICAR.HTML                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: SELECCIONAR CATEGORÍA                                  │
│  ✓ Electrónica, Moda, Hogar, etc.                              │
│  ✓ NO requiere autenticación                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: SELECCIONAR UBICACIÓN                                  │
│  ✓ Provincia + Distrito                                         │
│  ✓ NO requiere autenticación                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: DETALLES DEL PRODUCTO                                  │
│  ✓ Título, Descripción, Imágenes                               │
│  ✓ Atributos específicos por categoría                         │
│  ✓ NO requiere autenticación                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                   (Click en "Continuar")
                              ↓
                    ✓ AUTH CHECK ✓
                  ¿Usuario autenticado?
                         │
            ┌────────────┴────────────┐
            │ NO                      │ SÍ
            ↓                         ↓
    ┌──────────────┐      ┌──────────────────────┐
    │ MOSTRAR      │      │ CONTINUAR A STEP 4   │
    │ MODAL PLANES │      │ (PLANES)             │
    └──────────────┘      └──────────────────────┘
            │
            ├─ Plan Gratis
            │  └─→ Botón: "Crear Cuenta Gratis"
            │      └─→ /registro.html?plan=gratis
            │          └─→ User Registra Email/Password
            │              └─→ Retorna a publicar.html
            │                  └─→ Plan Gratis Preseleccionado
            │                      └─→ Puede continuar Steps 4+
            │
            ├─ Plan Básico
            │  └─→ Botón: "Comprar Plan" ($5.99)
            │      └─→ /payment.html?plan=basico
            │          └─→ Muestra Formulario de Pago
            │              └─→ User completa datos
            │                  └─→ Procesa Pago (Stripe)
            │                      └─→ /registro.html?plan=basico
            │                          └─→ User Registra
            │                              └─→ Retorna a publicar.html
            │                                  └─→ Plan Básico Preseleccionado
            │
            ├─ Plan Premium
            │  └─→ /payment.html?plan=premium ($9.99)
            │      └─→ [Mismo flujo que Básico]
            │
            ├─ Plan Destacado
            │  └─→ /payment.html?plan=destacado ($14.99)
            │      └─→ [Mismo flujo que Básico]
            │
            └─ Plan Top
               └─→ /payment.html?plan=top ($19.99)
                   └─→ [Mismo flujo que Básico]
```

## 🔄 Detalle del Modal de Planes

```
╔═══════════════════════════════════════════════════╗
║          SELECCIONA TU PLAN                       ║  ← showPlanSelectionModal()
║   Elige el plan que mejor se adapte a tus         ║
║   necesidades                                     ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  ┌─────────────┐ ┌──────────────┐ ┌──────────┐  ║
║  │   GRATIS    │ │   BÁSICO*    │ │ PREMIUM  │  ║
║  │             │ │  (Popular)   │ │          │  ║
║  │ $0          │ │ $5.99/mes    │ │ $9.99/mo │  ║
║  │             │ │              │ │          │  ║
║  │ ✓ 2 fotos   │ │ ✓ 5 fotos    │ │✓10 fotos │  ║
║  │ ✓ 1 anuncio │ │ ✓ 3 anuncios │ │✓5 anunci │  ║
║  │ ✗ Sin video │ │ ✗ Sin video  │ │✓ Videos  │  ║
║  │             │ │              │ │          │  ║
║  │[Crear Cuenta│ │[Comprar Plan]│ │[Comprar] │  ║
║  │   Gratis]   │ │              │ │  Plan    │  ║
║  └─────────────┘ └──────────────┘ └──────────┘  ║
║                                                   ║
║  ┌──────────────┐ ┌─────────────────────────┐   ║
║  │  DESTACADO   │ │        TOP**             │   ║
║  │ $14.99/mes   │ │  (Premium)              │   ║
║  │              │ │  $19.99/mes             │   ║
║  │ ✓15 fotos    │ │  ✓20 fotos              │   ║
║  │ ✓10 anuncios │ │  ✓15 anuncios           │   ║
║  │ ✓ Videos     │ │  ✓ Soporte prioritario  │   ║
║  │              │ │                         │   ║
║  │[Comprar Plan]│ │  [Comprar Plan]         │   ║
║  └──────────────┘ └─────────────────────────┘   ║
║                                                   ║
║                                          [×] ✕   ║
╚═══════════════════════════════════════════════════╝

Cuando usuario hace clic en botón:
├─ Plan Gratis: sessionStorage.selectedPlan = 'gratis'
│              → window.location.href = '/registro.html?plan=gratis'
│
└─ Plan Pagado: sessionStorage.selectedPlan = 'basico' (u otro)
               → window.location.href = '/payment.html?plan=basico'
```

## 💳 Flujo de Página de Pago

```
┌─────────────────────────────────────────────────┐
│  PAYMENT.HTML?PLAN=BASICO                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │ RESUMEN DEL PLAN │  │  INFORMACIÓN DE  │   │
│  │                  │  │  PAGO            │   │
│  │ Plan Básico      │  │                  │   │
│  │ $5.99            │  │ [○] Tarjeta      │   │
│  │ Impuestos: $0.96 │  │ [●] PayPal       │   │
│  │ ────────────     │  │                  │   │
│  │ TOTAL: $6.95     │  │ Nombre Completo: │   │
│  │                  │  │ [_____________]  │   │
│  │ ✓ Pago Seguro    │  │                  │   │
│  │                  │  │ Nro. Tarjeta:    │   │
│  │                  │  │ [_____________]  │   │
│  │                  │  │                  │   │
│  │                  │  │ MM/YY   CVV      │   │
│  │                  │  │ [____] [___]     │   │
│  │                  │  │                  │   │
│  │                  │  │ [✓] Acepto términos  │
│  │                  │  │                  │   │
│  │                  │  │ [PAGAR AHORA]    │   │
│  │                  │  │                  │   │
│  └──────────────────┘  └──────────────────┘   │
│                                                 │
│  Cuando usuario hace clic "PAGAR AHORA":       │
│  1. Valida campos                              │
│  2. Procesa pago (Stripe - pendiente)          │
│  3. Muestra "Pago procesado correctamente"     │
│  4. sessionStorage.paymentConfirmed = true     │
│  5. Redirige a /registro.html?plan=basico      │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 👤 Flujo de Registro Mejorado

```
┌──────────────────────────────────┐
│  REGISTRO.HTML?PLAN=GRATIS       │
│  O                               │
│  REGISTRO.HTML?PLAN=BASICO       │
├──────────────────────────────────┤
│                                  │
│ [Formulario de Registro Normal]  │
│                                  │
│ Email: [___________]             │
│ Password: [___________]          │
│                                  │
│ [REGISTRARSE]                    │
│                                  │
├──────────────────────────────────┤
│ En handleRegister():             │
│                                  │
│ 1. Detecta URL ?plan=gratis      │
│ 2. Verifica sessionStorage       │
│ 3. Si plan = 'gratis':           │
│    - sessionStorage.selectedPlan  │
│    - sessionStorage.              │
│      afterRegisterAction =        │
│      'continuePlan'              │
│    - window.location.href =      │
│      /publicar.html              │
│                                  │
│ 4. Si plan = 'basico' (etc):     │
│    - sessionStorage.selectedPlan │
│    - window.location.href =      │
│      /publicar.html              │
│                                  │
└──────────────────────────────────┘
```

## 🎯 Retorno a Publicar.html

```
┌──────────────────────────────────┐
│  PUBLICAR.HTML (RETORNO)         │
├──────────────────────────────────┤
│                                  │
│ En initializePublishPage():      │
│                                  │
│ 1. Detecta sessionStorage:       │
│    selectedPlan = 'gratis'       │
│    afterRegisterAction =         │
│    'continuePlan'                │
│                                  │
│ 2. setTimeout(() => {            │
│    - navigateToStep(4)           │
│    - Busca .plan-card-h          │
│      [data-plan="gratis"]        │
│    - Agrega clase .selected      │
│    - Limpia sessionStorage       │
│   }, 500)                        │
│                                  │
│ 3. Resultado:                    │
│    ✓ Mostrará STEP 4 (Planes)   │
│    ✓ Plan Gratis estará          │
│      seleccionado visualmente    │
│    ✓ Usuario puede continuar     │
│      con publicación             │
│                                  │
└──────────────────────────────────┘
```

## 💾 Variables de Control

### sessionStorage
```javascript
// Plan seleccionado (viene del modal)
sessionStorage.selectedPlan = 'gratis' | 'basico' | 'premium' | 'destacado' | 'top'

// Flag que indica retorno desde registro
sessionStorage.afterRegisterAction = 'continuePlan'

// Flag de pago confirmado
sessionStorage.paymentConfirmed = 'true'
```

### URL Parameters
```
/publicar.html                    // Acceso inicial
/publicar.html?step=2             // Ir directo a step 2
/registro.html?plan=gratis        // Registro con plan pre-seleccionado
/payment.html?plan=basico         // Ir a pago con plan específico
```

## 📊 Estados de Autenticación

```
Estado 1: Usuario NO autenticado en publicar.html
├─ Steps 1-3: Acceso permitido
├─ Click en "Continuar" (Step 3→4):
│  └─ CHECK: ¿Autenticado? NO
│     └─ MOSTRAR: Modal de planes
│        └─ Usuario elige plan
│           ├─ GRATIS: → Registro → Vuelve a publicar
│           └─ PAGO: → Payment → Registro → Vuelve a publicar
│
└─ Resultado: Usuario registrado + Plan seleccionado

Estado 2: Usuario YA autenticado en publicar.html
├─ Steps 1-3: Acceso permitido
├─ Click en "Continuar" (Step 3→4):
│  └─ CHECK: ¿Autenticado? SÍ
│     └─ Continúa a Step 4 (Planes) normalmente
│
└─ Resultado: Publicación como usuario registrado
```

## 🔐 Validaciones

```javascript
// En publish-logic.js nextBtns listener
if (currentStepNumber === 3) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        showPlanSelectionModal();  // NO autenticado
    } else {
        navigateToStep(4);         // SÍ autenticado
    }
}

// En payment.html
if (!document.getElementById('agreeTerms').checked) {
    alert('Debes aceptar términos y condiciones');
    return;  // Bloquea pago
}

// En auth-logic.js
if (!email || !password) {
    alert('Faltan campos');
    return;  // Bloquea registro
}
```

## 🎨 Indicadores Visuales

### Tarjeta de Plan Preseleccionada
```css
.plan-card-h.selected {
    border-color: var(--color-primario);  /* Azul */
    background: rgba(41, 128, 185, 0.05);
    box-shadow: 0 4px 16px rgba(41, 128, 185, 0.2);
}

.plan-card-h.selected::before {
    content: '✓';
    position: absolute;
    top: 10px;
    right: 10px;
    width: 24px;
    height: 24px;
    background: var(--color-primario);
    color: white;
    border-radius: 50%;
    font-weight: 700;
}
```

## ✅ Checklist de Implementación

- [x] Función showPlanSelectionModal() creada
- [x] Modal de planes renderizado correctamente
- [x] Botones diferenciados (gratis vs pagado)
- [x] Página payment.html creada y funcional
- [x] handleRegister() mejorado para detectar plan
- [x] Preselección de plan en publicar.html
- [x] Estilos CSS para plan seleccionado
- [x] sessionStorage para comunicación entre páginas
- [x] URL parameters para compatibilidad
- [x] Sin errores en consola
- [x] Documentación completa

## 🚀 Integraciones Pendientes

1. **Stripe Payment**
   - Reemplazar simulación en payment.html
   - Conectar con Stripe API
   - Guardar transacciones en Supabase

2. **Base de Datos**
   - Tabla user_plans
   - Guardar plan activo
   - Fecha de compra/expiración

3. **Email Confirmación**
   - Verificar email después de registro
   - Enviar recibo si plan pagado
   - Recordatorio de renovación

4. **Análisis**
   - Trackear conversiones
   - Monitorear plan más popular
   - Tasas de abandono
