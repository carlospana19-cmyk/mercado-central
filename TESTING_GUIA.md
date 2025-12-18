# 🧪 Guía de Testing - Flujo de Usuarios No Registrados

## ✅ Antes de Empezar

- [ ] Cierra sesión de Supabase (logout)
- [ ] Limpia cookies/sesión del navegador (o usa modo incógnito)
- [ ] Abre la consola del navegador (F12)
- [ ] Asegúrate que no haya errores previos

## 🎯 Test 1: Acceso sin Registrarse a Publicar

**Objetivo**: Verificar que usuarios no registrados pueden acceder a publicar.html

### Pasos:
1. Ve a `http://localhost:5500/publicar.html` (o tu URL local)
2. Verifica que:
   - [ ] La página carga sin redirigir a login.html
   - [ ] Ves el formulario completo
   - [ ] No hay errores en la consola
   - [ ] Step 1 (Categoría) es visible

### Resultado Esperado:
```
✓ Acceso permitido sin autenticación
✓ Formulario lista para usar
✓ Sin alertas de "Debes iniciar sesión"
```

---

## 🎯 Test 2: Completar Steps 1-3 Sin Autenticación

**Objetivo**: Verificar que todos los pasos iniciales funcionan sin login

### Pasos:

#### Step 1 - Categoría:
1. Selecciona cualquier categoría (ej: "Electrónica")
2. [ ] Se muestra subcategorías
3. [ ] Botón "Continuar" está habilitado
4. Haz clic en "Continuar"

#### Step 2 - Ubicación:
1. [ ] Aparece selector de provincia
2. Selecciona una provincia (ej: "Buenos Aires")
3. [ ] Aparecen distritos
4. Selecciona un distrito (ej: "CABA")
5. [ ] Botón "Continuar" se habilita
6. Haz clic en "Continuar"

#### Step 3 - Detalles:
1. Completa los campos:
   - [ ] Título: "Test producto"
   - [ ] Descripción: "Descripción de prueba"
   - [ ] Precio: "100"
   - [ ] Sube una foto (click en "Foto de Portada")

2. [ ] Campos se guardan correctamente
3. [ ] No hay errores en consola
4. Haz clic en "Continuar" para ir a Step 4

### Resultado Esperado:
```
✓ Todos los fields aceptan input
✓ Validaciones básicas funcionan
✓ Sin errores en consola
✓ Puede avanzar a siguiente step
```

---

## 🎯 Test 3: CRÍTICO - Modal de Planes Aparece

**Objetivo**: Verificar que el modal de planes se muestra cuando usuario no autenticado intenta ir a Step 4

### Pasos:
1. En Step 3, haz clic en "Continuar"
2. [ ] **DEBE APARECER MODAL** de selección de planes
3. Verifica que ves:
   - [ ] Título: "Selecciona tu Plan"
   - [ ] 5 tarjetas de plan
   - [ ] Botón cerrar (X) en esquina superior derecha
   - [ ] Backdrop oscuro de fondo

### Planes Visibles:
```
[ ] Gratis - $0 - "Crear Cuenta Gratis"
[ ] Básico - $5.99 - "Comprar Plan"
[ ] Premium - $9.99 - "Comprar Plan"
[ ] Destacado - $14.99 - "Comprar Plan"
[ ] Top - $19.99 - "Comprar Plan"
```

### Acciones de Modal:
- [ ] Click en X cierra modal (vuelves a Step 3)
- [ ] Click fuera del modal (en backdrop) lo cierra
- [ ] Sin errores en consola

### Resultado Esperado:
```
✓ Modal aparece automáticamente
✓ 5 planes se muestran correctamente
✓ Cierre funciona en ambas formas
✓ Vuelve a Step 3 cuando se cierra
```

---

## 🎯 Test 4: Seleccionar Plan Gratis

**Objetivo**: Verificar flujo de plan gratis

### Pasos:
1. Abre modal de planes nuevamente (click "Continuar" en Step 3)
2. En tarjeta "Gratis", haz clic en "Crear Cuenta Gratis"
3. [ ] Redirige a `registro.html?plan=gratis`
4. Verifica que:
   - [ ] La URL contiene `?plan=gratis`
   - [ ] Formulario de registro aparece
   - [ ] Campo email está visible
   - [ ] Campo password está visible

#### Completar Registro:
1. Ingresa:
   - Email: `test@example.com` (o uno nuevo)
   - Password: `password123`
2. Haz clic en "Registrarse"
3. [ ] Aparece mensaje de éxito
4. [ ] Redirige automáticamente a `publicar.html`

#### Verificar Plan Preseleccionado:
1. [ ] Aparece Step 4 (Planes) automáticamente
2. [ ] La tarjeta "Gratis" tiene:
   - [ ] Borde azul (var(--color-primario))
   - [ ] Checkmark (✓) en esquina superior derecha
   - [ ] Background azulado
3. [ ] Sin errores en consola

### En Consola:
```javascript
// Ejecutar para verificar:
sessionStorage.getItem('selectedPlan')  // Debe retornar "gratis"
sessionStorage.getItem('afterRegisterAction')  // Debe estar vacío (se limpió)
```

### Resultado Esperado:
```
✓ Redirige a registro con plan gratis
✓ Se registra exitosamente
✓ Vuelve a publicar.html
✓ Plan gratis preseleccionado visualmente
✓ sessionStorage limpiad correctamente
```

---

## 🎯 Test 5: Seleccionar Plan de Pago

**Objetivo**: Verificar flujo de planes pagados

### Pasos:
1. **RESET**: Limpia sessionStorage y cierra sesión
2. Ve a `publicar.html` nuevamente
3. Completa Steps 1-3 otra vez
4. Click "Continuar" → Aparece modal
5. En tarjeta "Básico", haz clic en "Comprar Plan"
6. [ ] Redirige a `payment.html?plan=basico`

#### Verificar Página de Pago:
1. [ ] URL contiene `?plan=basico`
2. [ ] Resumen muestra:
   - [ ] "Plan Básico"
   - [ ] "$5.99"
   - [ ] Impuestos calculados
   - [ ] Total correcto
3. [ ] Formulario de pago visible
4. [ ] 2 métodos: Tarjeta y PayPal

#### Completar Pago (Simulado):
1. Selecciona "Tarjeta" (por defecto)
2. Completa campos:
   - [ ] Nombre: "Juan Test"
   - [ ] Tarjeta: 1234 5678 9012 3456
   - [ ] Vencimiento: 12/25
   - [ ] CVV: 123
   - [ ] Email: test@example.com
3. [ ] Checkbox "Acepto términos" marcado
4. Haz clic en "Pagar Ahora"
5. [ ] Botón muestra "Procesando..."
6. [ ] Después de 2 segundos aparece mensaje verde "Pago procesado correctamente"
7. [ ] Redirige a `registro.html?plan=basico`

#### Completar Registro Post-Pago:
1. Ingresa nuevo email y password
2. Haz clic "Registrarse"
3. [ ] Redirige a `publicar.html` nuevamente
4. [ ] Plan "Básico" preseleccionado

### Resultado Esperado:
```
✓ Redirige a payment.html correctamente
✓ Resumen del plan correcto
✓ Formulario acepta datos
✓ Pago se procesa (simulado)
✓ Redirige a registro
✓ Registración post-pago funciona
✓ Plan preseleccionado al volver
```

---

## 🎯 Test 6: Cambiar Método de Pago

**Objetivo**: Verificar que PayPal se muestra correctamente

### Pasos:
1. Ve a `payment.html?plan=premium`
2. [ ] Página carga correctamente
3. En "Información de Pago", haz clic en botón "PayPal"
4. [ ] El botón se marca como activo (azul)
5. [ ] Campo "Tarjeta" desaparece
6. [ ] Campo "Email de PayPal" aparece
7. [ ] Muestra mensaje "Serás redirigido a PayPal..."
8. Haz clic en botón "Pagar Ahora"
9. [ ] Funciona igual al flujo de tarjeta

### Resultado Esperado:
```
✓ Botones PayPal funcionan
✓ Cambio de formulario es correcto
✓ Mensaje explicativo visible
```

---

## 🎯 Test 7: Cierre de Modal

**Objetivo**: Verificar que el modal se puede cerrar

### Pasos:
1. Ve a `publicar.html`
2. Completa Steps 1-3
3. Click "Continuar" → Modal aparece
4. [ ] Haz clic en X (esquina superior derecha)
5. [ ] Modal desaparece
6. [ ] Vuelves a Step 3
7. [ ] Campos de Step 3 siguen intactos

**Alternativa**:
1. Abre modal nuevamente
2. [ ] Haz clic en área oscura (backdrop)
3. [ ] Modal desaparece igual

### Resultado Esperado:
```
✓ Cerrar con X funciona
✓ Cerrar con backdrop funciona
✓ Datos no se pierden
```

---

## 🎯 Test 8: Validación de Formularios

**Objetivo**: Verificar que los formularios validan correctamente

### Test de Registro:
1. Ve a `registro.html`
2. Intenta registrarse sin email:
   - [ ] Muestra alerta "Por favor ingresa email y contraseña"
3. Intenta con contraseña corta (<6 caracteres):
   - [ ] En reset-password: alerta "al menos 6 caracteres"

### Test de Pago:
1. Ve a `payment.html?plan=basico`
2. Intenta pagar sin marcar "Acepto términos":
   - [ ] Muestra alerta "Debes aceptar los términos"
3. Intenta con campos vacíos:
   - [ ] Input validation funciona (navegador)

### Resultado Esperado:
```
✓ Validaciones funcionan
✓ Alertas son claras
✓ No permite envío sin datos
```

---

## 🎯 Test 9: Experiencia Responsiva

**Objetivo**: Verificar que todo funciona en mobile

### Pasos:
1. Abre DevTools (F12)
2. Click en "Toggle device toolbar" (Ctrl+Shift+M)
3. Selecciona "iPhone 12" (390px)
4. Recorre todo el flujo:
   - [ ] Steps 1-3 se ven bien
   - [ ] Modal se ve correctamente
   - [ ] Planes apilados en 1 columna
   - [ ] Botones son clickeables
   - [ ] Texto legible

### En payment.html:
- [ ] Resumen y formulario stacked verticalmente
- [ ] Campos full-width
- [ ] Botones grandes y fáciles de clickear

### Resultado Esperado:
```
✓ Responsive design funciona
✓ Sin overflow horizontal
✓ Touch-friendly en mobile
```

---

## 🎯 Test 10: Consola Sin Errores

**Objetivo**: Verificar que no hay errores de JavaScript

### Pasos:
1. Abre consola del navegador (F12)
2. Recorre TODO el flujo
3. Verifica:
   - [ ] Sin errores rojo
   - [ ] Sin advertencias naranja críticas
   - [ ] Logs informativos aparecen (grises)

### Logs Esperados:
```javascript
// En publicar.html:
"✅ Plan gratis preseleccionado después del registro"
"✅ Plan gratis preseleccionado visualmente"

// En publish-logic.js:
"🔴 showPlanSelectionModal() called" (esperado cuando se muestra modal)

// En auth-logic.js:
"✅ Registro exitoso"
"👤 Redirigiendo a publicar.html"
```

### Resultado Esperado:
```
✓ Sin errores en consola
✓ Logs informativos correctos
✓ Flujo de ejecución claro
```

---

## 📋 Checklist Final de Testing

```
Funcionalidad Básica:
[ ] Acceso sin registrarse a publicar.html
[ ] Completar Steps 1-3 sin autenticación
[ ] Modal de planes aparece automáticamente
[ ] Cierre de modal funciona

Flujo Plan Gratis:
[ ] Seleccionar plan gratis funciona
[ ] Redirige a registro correctamente
[ ] Registro con plan=gratis completable
[ ] Retorna a publicar con plan preseleccionado

Flujo Plan Pagado:
[ ] Seleccionar plan pagado funciona
[ ] Página de pago carga correctamente
[ ] Pago se procesa (simulado)
[ ] Redirige a registro post-pago
[ ] Retorna a publicar con plan preseleccionado

Validaciones:
[ ] Formularios validan inputs
[ ] Alertas son claras
[ ] No permite envío sin datos

Diseño:
[ ] Modal es atractivo y responsive
[ ] Colores consistentes
[ ] Botones visibles y clickeables
[ ] Mobile-friendly

Técnico:
[ ] Sin errores en consola
[ ] sessionStorage maneja datos correctamente
[ ] URL parameters funcionan
[ ] Redirecciones correctas
```

---

## 🐛 Troubleshooting

### Problema: Modal no aparece
```
Solución:
1. Abre consola (F12)
2. Ejecuta: supabase.auth.getUser()
3. Si retorna user, ya estás logeado
4. Logout: supabase.auth.signOut()
5. Recarga página
```

### Problema: Redireccionamiento incorrecto
```
Solución:
1. Verifica URL en la barra (debe tener ?plan=)
2. Abre consola y ejecuta: sessionStorage.getItem('selectedPlan')
3. Si está vacío, el plan no se guardó
4. Intenta nuevamente seleccionando plan
```

### Problema: Plan no preseleccionado
```
Solución:
1. Verifica que returnaste desde registro
2. Ejecuta en consola: sessionStorage.getItem('afterRegisterAction')
3. Debe mostrar 'continuePlan'
4. Si no, el flag no se guardó en auth-logic.js
```

### Problema: Estilos del modal no se ven
```
Solución:
1. Verifica que style.css está cargado
2. En consola: document.styleSheets (debe incluir style.css)
3. Busca ".modal-overlay" en Elements/Inspector
4. Verifica que tiene clases correctas
```

---

## 📞 Contacto/Dudas

Si encuentras problemas:
1. Revisa la consola del navegador (mensajes detallados)
2. Verifica sessionStorage en DevTools → Application
3. Comprueba que URLs son correctas (sin mayúsculas)
4. Limpia cookies del sitio y intenta nuevamente

---

## 📊 Resultado del Testing

Cuando completres TODO el testing:

- [ ] ✅ Todo funciona correctamente
- [ ] ⚠️ Algunos problemas encontrados (especificar)
- [ ] ❌ Problemas críticos encontrados

**Notas:**
_Escribe aquí cualquier observación_
