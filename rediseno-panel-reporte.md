# Reporte — Rediseño Panel Unificado (turquesa → sistema naranja/neutro)

Fecha: 10/11/2026 · Especificación: `rediseno-panel-unificado.md`

## 1. Archivos modificados
| Archivo | Cambio |
| --- | --- |
| `panel-unificado.css` | **Único archivo editado.** Reemplazo de todo el turquesa por tokens; normalización tipográfica/espaciados; focus rings; estilos nuevos para el tab de Reseñas y el modal de reseña (estaban sin CSS); overrides con scope `#panel-unificado-page` para neutralizar `!important` de `mc-base.css` solo dentro del panel. |

No se modificaron: `panel-unificado.html`, `panel-unificado-logic.js`, `reviews-logic.js`, `mc-base.css`, `mc-messages.css`, `navbar-*`, `search-global.js`, ni ninguna otra pantalla. La barra de búsqueda (fix responsive con cámara y botón naranja) queda intacta — vive en `mc-base.css`/`search-global.js`, que no fueron tocados.

## 2. Tokens creados (`#panel-unificado-page`, scoped al panel)
- Superficies: `--bg #F8FAFC`, `--surface #FFFFFF`, `--surface-2 #F1F5F9`, `--border #E2E8F0`
- Texto: `--text #0F172A`, `--text-2 #64748B`
- Marca: `--brand #F97316`, `--brand-hover #EA580C`, `--brand-soft #FFF7ED`, `--brand-text #C2410C` (añadido: naranja como *texto* pequeño con AA ≥ 4.5:1)
- Semánticos: `--success #16A34A`, `--warning #D97706`, `--danger #DC2626`, `--warning-hover #B45309`, `--danger-hover #B91C1C`
- Focus: `--focus-ring #FDBA74` (outline 2px, offset 2px)
- Sombras: `--shadow-sm`, `--shadow-md` · Radios: `--radius 12px`, `--radius-sm 8px`

## 3. Turquesa eliminado (antes → después)
| Dónde | Antes | Después |
| --- | --- | --- |
| `panel-unificado.css` | **33 apariciones** (`#00bfae`, `#008f88`, `#006b64`, `rgba(0,191,174,x)` ×7, gradientes `#f0fffe→#e0fffe`, bordes/sombras/botones/tabs/focus/spinner) | **0** (verificado con las búsquedas del Paso 0 sobre el archivo) |
| `mc-base.css` (footer, compartido) | 3 reglas con hover `#2EC4B6 !important` | Se mantienen (no se toca `mc-base.css`); **neutralizadas dentro del panel** con overrides `#panel-unificado-page .footer-col a:hover` → `--brand` y `.payment-icons i:hover` → `--text-2` |
| `panel-unificado.html` / `panel-unificado-logic.js` / `reviews-logic.js` / `mc-messages.css` | 0 | 0 |

Mapeos aplicados: gradientes → color sólido; fondos teñidos → `--bg`; bordes → `--border`; iconos informativos → `--text-2`; acciones/acentos → naranja; botones primarios → `--brand` (hover `--brand-hover`); secundarios ghost; destructivos → `--danger`; "Vendido" (acción) → ghost con texto `--warning-hover`; badge "Vendido" → `--danger` sólido; badge contador de mensajes → `--danger`; números/estadísticas → `--text`; metadata → `--text-2`.

## 4. Overrides con scope (por interferencias de `mc-base.css`)
`mc-base.css` carga **después** del CSS del panel y su "PATCH v7" impone con `!important` naranja `#FA6406` en las acciones de las tarjetas y estilos propios en `.btn-primary`. Para que el panel use **los tokens** sin tocar otras páginas se añadieron reglas `#panel-unificado-page …!important` equivalentes (Editar → `--brand`, Ver/Vendido → ghost, Eliminar → ghost rojo, badge/título/precio/categoría → tokens).

## 5. Contraste (AA)
- Texto principal `#0F172A` sobre blanco ≈ 15.9:1 ✓ · `--text-2 #64748B` ≈ 4.76:1 ✓ · `--brand-text #C2410C` ≈ 5.2:1 ✓ (usado en enlaces, pestañas/subtabs activos y hover de enlaces) · `--danger` con blanco ≈ 4.8:1 ✓ · `--warning-hover` como texto ≈ 5.0:1 ✓
- Nota: los botones sólidos `--brand #F97316` con texto blanco (~2.8:1) siguen la combinación exacta que prescribe la especificación (misma convención que el botón de búsqueda del sitio). Los elementos de texto naranja pequeño usan `--brand-text` para cumplir AA.

## 6. Assets con turquesa (pendientes)
- `favicon.svg`: contiene un PNG embebido en base64 (no inspeccionable/recoloreable por CSS) — generado con RealFaviconGenerator. No se tocó.
- `logo-mercado-central.jpeg`: verificado visualmente — es **naranja**, sin turquesa. Coherente con el nuevo acento.

## 7. Notas de alcance
- El tab de Reseñas (`subtab-btn`, `review-item`, `seller-stats`, etc.) y el modal de reseña no tenían CSS en ninguna hoja cargada por el panel: se añadió un bloque con tokens (visible solo en este panel; las clases viven en el CSS del panel, no en hojas compartidas).
- Tipografía unificada a una escala (12/13/14/15/16/18/20/24 px) y grid de 8px; transiciones 150–200ms; sin animaciones nuevas llamativas.
- Responsive intacto en estructura (media queries 1024/768/640/560/480px conservadas; solo se ajustaron tamaños tipográficos de las queries a la nueva escala y colores a tokens).
