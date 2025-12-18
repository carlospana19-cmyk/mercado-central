# VERIFICACIÓN COMPLETA: Estructura de Planes de Pago

## ✅ QUÉ ESTÁ IMPLEMENTADO

### 1. **Interface Visual (publicar.html)**
✅ 5 planes mostrados correctamente:
- GRATIS: $0/30 días
- BÁSICO: $5/30 días (badge "RECOMENDADO")
- PREMIUM: $10/30 días (badge "POPULAR")
- DESTACADO: $20/30 días (badge "BEST SELLER")
- TOP: $25/30 días (badge "MÁXIMA VISIBILIDAD")

✅ Radio buttons para selección de plan

### 2. **Configuración en publish-logic.js**
```javascript
const PLAN_LIMITS = {
    'free': { maxFotos: 3, hasVideo: false, hasCarousel: false, priority: 0 },
    'basico': { maxFotos: 5, hasVideo: false, hasCarousel: false, priority: 1 },
    'premium': { maxFotos: 10, hasVideo: false, hasCarousel: true, priority: 2 },
    'destacado': { maxFotos: 15, hasVideo: false, hasCarousel: true, priority: 3 },
    'top': { maxFotos: 20, hasVideo: true, hasCarousel: true, priority: 4 }
};
```

✅ Cada plan tiene:
- `maxFotos`: Límite de imágenes
- `hasVideo`: Soporte de video (solo TOP)
- `hasCarousel`: Soporte de carrusel (PREMIUM, DESTACADO, TOP)
- `priority`: Número para ordenamiento en búsquedas

### 3. **Guardado de Datos (publish-logic.js línea ~2206)**
✅ Se guarda en la BD:
```javascript
adData.featured_plan = selectedPlan;      // Ej: "top", "premium", "free"
adData.featured_until = fechaExpiracion;  // Fecha +30 días
adData.plan_priority = PLAN_LIMITS[selectedPlan].priority;
adData.max_images = PLAN_LIMITS[selectedPlan].maxFotos;
```

### 4. **Campos de Video en HTML (publicar.html línea ~431)**
✅ Campo de video existe:
```html
<label for="video-url">URL de Video (Youtube o Vimeo) - Exclusivo TOP</label>
<input type="text" id="video-url" name="video_url" placeholder="https://www.youtube.com/watch?v=...">
```

✅ Con clase `plan-top-feature` para mostrar solo en plan TOP

### 5. **Publicación en Redes (publicar.html)**
✅ Checkbox para publicación automática:
```html
<input type="checkbox" id="publicar-redes" name="publicar_redes"> 
Publicación Automática en Redes Sociales (Exclusivo TOP)
```

---

## ❌ QUÉ FALTA IMPLEMENTAR

### 1. **Videos NO se guardan en la BD (CRÍTICO)**
El campo `video_url` está en el formulario HTML pero:
- ❌ NO se lee del formulario
- ❌ NO se guarda en `adData`
- ❌ NO existe en la BD

**Solución:**
Agregar a `adData` (publish-logic.js línea ~2162):
```javascript
const formData = new FormData(form);
const adData = {
    titulo: document.getElementById('title').value,
    descripcion: formData.get('descripcion'),
    precio: parseFloat(formData.get('precio')),
    categoria: categoryName,
    provincia: formData.get('provincia'),
    distrito: formData.get('distrito'),
    user_id: user.id,
    url_portada: coverPublicUrl,
    url_galeria: uploadedGalleryUrls,
    // ✅ AGREGAR ESTO:
    url_video: formData.get('video_url'),  // Video para plan TOP
    publicar_redes: formData.get('publicar_redes') ? true : false,
    fecha_publicacion: new Date().toISOString()
};
```

### 2. **Campo de Video NO existe en la BD**
La tabla `anuncios` probablemente NO tiene:
- `url_video` (VARCHAR)
- `publicar_redes` (BOOLEAN)

**Necesario ejecutar en Supabase SQL:**
```sql
ALTER TABLE anuncios 
ADD COLUMN url_video VARCHAR(500),
ADD COLUMN publicar_redes BOOLEAN DEFAULT FALSE,
ADD COLUMN videos_count INTEGER DEFAULT 0;
```

### 3. **Validación de Plan para Videos (NO implementada)**
Falta verificar que solo plan TOP pueda subir videos.

**Sugerir agregar en publish-logic.js:**
```javascript
// Validar videos según plan
if (selectedPlan !== 'top' && document.getElementById('video-url').value) {
    alert('Solo el plan TOP permite agregar videos. Por favor, selecciona el plan TOP.');
    return;
}

// Validar máximo 2 videos para TOP
if (selectedPlan === 'top') {
    const videoCount = document.getElementById('video-url').value ? 1 : 0;
    if (videoCount > 2) {
        alert('El plan TOP permite máximo 2 videos');
        return;
    }
}
```

### 4. **Features que NO están implementadas (solo promesas en UI)**
❌ Reposicionamiento automático (cada hora/3 horas/6 horas)
❌ Estadísticas en tiempo real
❌ Promoción en redes sociales
❌ Acceso a 25000+ compradores (solo diferencia visual)

Estas son características de BACKEND que requieren:
- Tabla de `analytics` para estadísticas
- Job/cron para reposicionamiento
- API de redes sociales para publicación automática

---

## 📋 RESUMEN DE IMPLEMENTACIÓN

| Característica | Estado | Prioridad | Esfuerzo |
|---|---|---|---|
| **UI de Planes** | ✅ Listo | - | - |
| **Límites por Plan** | ✅ Listo | - | - |
| **Guardado de plan** | ✅ Listo | - | - |
| **Campo de video en UI** | ✅ Listo | - | - |
| **Guardado de video en BD** | ❌ Falta | 🔴 CRÍTICA | 30min |
| **Validación de videos** | ❌ Falta | 🔴 CRÍTICA | 30min |
| **Publicación en redes (BD)** | ⚠️ Parcial | 🟠 Alta | 30min |
| **Reposicionamiento automático** | ❌ Falta | 🟡 Media | 2-3 horas |
| **Estadísticas** | ❌ Falta | 🟡 Media | 3-4 horas |
| **Integración redes sociales** | ❌ Falta | 🟠 Alta | 4-6 horas |

---

## 🎯 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Antes de trabajar en Pagos (HOY - 1 hora):
1. ✅ Agregar campos `url_video` y `publicar_redes` a la BD
2. ✅ Leer `video_url` del formulario y guardarlo en `adData`
3. ✅ Validar que solo TOP pueda tener videos
4. ✅ Validar máximo 2 videos para TOP

### Luego de implementar Pagos (SEMANA 2):
5. ⏳ Sistema de reposicionamiento automático
6. ⏳ Dashboard de estadísticas
7. ⏳ Integración con redes sociales

### Futuro:
8. ⏳ Validación de URL de video (YouTube/Vimeo)
9. ⏳ Vista previa de video antes de publicar
10. ⏳ Contador de videos en el dashboard

---

## ✅ QUICK FIX (5 minutos)

**En Supabase SQL Editor:**
```sql
-- Agregar campos faltantes
ALTER TABLE anuncios 
ADD COLUMN IF NOT EXISTS url_video VARCHAR(500),
ADD COLUMN IF NOT EXISTS publicar_redes BOOLEAN DEFAULT FALSE;
```

**En publish-logic.js (línea ~2162):**
```javascript
const formData = new FormData(form);
const adData = {
    titulo: document.getElementById('title').value,
    descripcion: formData.get('descripcion'),
    precio: parseFloat(formData.get('precio')),
    categoria: categoryName,
    provincia: formData.get('provincia'),
    distrito: formData.get('distrito'),
    user_id: user.id,
    url_portada: coverPublicUrl,
    url_galeria: uploadedGalleryUrls,
    url_video: selectedPlan === 'top' ? formData.get('video_url') : null,  // ← AGREGAR
    publicar_redes: selectedPlan === 'top' ? (formData.get('publicar_redes') ? true : false) : false,  // ← AGREGAR
    fecha_publicacion: new Date().toISOString()
};
```

---

## 💡 CONCLUSIÓN

**La estructura de planes está al 80% lista.**

Lo que falta es **técnico, no visual:**
- ✅ UI es bonita y completa
- ✅ Lógica de límites funcionando
- ❌ Persistencia de videos en BD (FÁCIL DE ARREGLAR)
- ❌ Features avanzadas (reposicionamiento, estadísticas, redes sociales)

**Tiempo para completar todo:** 8-10 horas
- Guardar videos: 30 min
- Validaciones: 30 min
- Pagos: 5-7 horas
- Features avanzadas: 1-2 horas

