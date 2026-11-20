import 'dart:convert';

import 'package:flutter/material.dart';

import '../../../features/categorias/esquema_categorias.dart';
import '../../../theme/mc_colores.dart';

/// Un valor de atributo es mostrable solo si es texto plano legible.
/// Los contenedores (Map/List) o strings con JSON crudo se EXCLUYEN:
/// jamás se imprime una llave { } o corchete [ ] en pantalla.
bool _esValorMostrable(dynamic value) {
  if (value == null) return false;
  if (value is Map || value is List) return false;
  final text = value.toString().trim();
  if (text.isEmpty || text == '0' || text == 'N/A' || text == '{}') {
    return false;
  }
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      final decoded = jsonDecode(text);
      if (decoded is Map || decoded is List) return false;
    } catch (_) {
      // No es JSON válido: se muestra como texto normal.
    }
  }
  return true;
}

/// Atributos del DETALLE agrupados igual que la web
/// (product-detail-logic.js · displayAllAttributesComprehensive, FASE 1-F):
/// una tabla de especificaciones con las etiquetas de SPEC_LABELS
/// (espejo en EsquemaCategorias.etiquetaDetalle), excluyendo las claves de
/// control y los valores vacíos; las primeras 5 filas visibles por defecto y
/// un enlace "Ver más detalles ▾" que muestra TODAS y pasa a "Ver menos ▴".
class AdSpecHighlights extends StatefulWidget {
  final String categoria;
  final Map<String, dynamic> attributes;

  const AdSpecHighlights({
    super.key,
    required this.categoria,
    required this.attributes,
  });

  @override
  State<AdSpecHighlights> createState() => _AdSpecHighlightsState();
}

class _AdSpecHighlightsState extends State<AdSpecHighlights> {
  /// MOSTRAR = 5 en displayAllAttributesComprehensive de la web.
  static const int _filasVisibles = 5;
  bool _expandido = false;

  @override
  Widget build(BuildContext context) {
    final validEntries = widget.attributes.entries.where((entry) {
      final key = entry.key.toLowerCase();
      const excludePatterns = [
        'step',
        'categoria',
        'subcategoria',
        'provincia',
        'distrito',
        'attr-',
      ];
      final isValidKey =
          !excludePatterns.any((pattern) => key.contains(pattern));
      return isValidKey && _esValorMostrable(entry.value);
    }).toList();

    if (validEntries.isEmpty) return const SizedBox.shrink();

    final filas = <Widget>[];
    for (var i = 0; i < validEntries.length; i++) {
      final entry = validEntries[i];
      final visible = _expandido || i < _filasVisibles;
      if (!visible) continue;
      filas.add(
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 7),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 150,
                child: Text(
                  EsquemaCategorias.etiquetaDetalle(entry.key),
                  style: const TextStyle(
                    fontSize: 13,
                    color: Mc.grisSuave,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              Expanded(
                child: Text(
                  entry.value.toString(),
                  style: const TextStyle(
                    fontSize: 14,
                    color: Mc.textoListas,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final tieneOcultas = validEntries.length > _filasVisibles;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: const Color(0xFFE8ECEF)),
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          child: Column(children: filas),
        ),
        if (tieneOcultas)
          TextButton.icon(
            onPressed: () => setState(() => _expandido = !_expandido),
            icon: Icon(
              _expandido
                  ? Icons.keyboard_arrow_up
                  : Icons.keyboard_arrow_down,
              size: 18,
            ),
            label: Text(_expandido ? 'Ver menos ▴' : 'Ver más detalles ▾'),
            style: TextButton.styleFrom(
              foregroundColor: Mc.naranjaOscuro,
              textStyle: const TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
      ],
    );
  }
}
