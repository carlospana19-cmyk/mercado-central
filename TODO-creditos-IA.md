# TODO: Sistema Créditos IA en editar-anuncio-logic.js

## Plan de Implementación
**Estado**: Planificación ✅

### Información Gathered:
- Archivo leído: editar-anuncio-logic.js (~2200 líneas)
- Variables globales: Línea ~40 (currentImages, newFiles, currentCoverUrl)
- loadAdData(): Carga ad desde Supabase, ad.creditos_ia_restantes disponible
- IA Handler: En initialize(), usa 'btn-ia-optimize' y suscripciones table
- NO tocar: Galería (addFiles, renderPreviews), mapa

### Plan Detallado:
1. **Variable global**: `let creditosRestantesIA = 0;` (Línea ~45)
2. **Nueva función**: `actualizarEstadoBotonIA()` después showCommunityFields()
3. **loadAdData()**: Después `currentCoverUrl = ...` → `creditosRestantesIA = ad.creditos_ia_restantes || 0; actualizarEstadoBotonIA();`
4. **IA Click Handler**: Después optimización exitosa → Update anuncios table + decrement local

### Dependencias:
- HTML debe tener: `#ia-chances` (o adaptar a `#ia-credits-counter`)
- Supabase: Columna `creditos_ia_restantes` en `anuncios`

### Siguiente:
- [ ] Editar archivo con 4 cambios precisos
- [ ] Probar optimización IA → crédito descuenta
- [ ] attempt_completion

✅ **PLAN APROBADO** - Procediendo con ediciones.

**Progreso**:
- [x] Crear TODO.md
- [x] 1. Variable global `let creditosRestantesIA = 0;`
- [x] 2. Nueva función `actualizarEstadoBotonIA()`
- [x] 3. loadAdData(): Cargar creditosRestantesIA y actualizar UI

**Progreso**: 5/5 ✅
- [x] 4. IA Click Handler: Descontar crédito en 'anuncios'
- [x] Probar + attempt_completion

**¡SISTEMA DE CRÉDITOS IA COMPLETADO!** 🎉
