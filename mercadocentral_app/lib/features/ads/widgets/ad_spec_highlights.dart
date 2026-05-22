import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class AdSpecHighlights extends StatelessWidget {
  final String categoria;
  final Map<String, dynamic> attributes;

  const AdSpecHighlights({
    super.key,
    required this.categoria,
    required this.attributes,
  });

  @override
  Widget build(BuildContext context) {
    // 1. Lógica de "Top 3" de tu product-detail-logic.js
    List<String> topKeys = ['anio', 'kilometraje', 'combustible']; // Default
    final cat = categoria.toLowerCase();

    if (cat.contains('inmuebl')) {
      topKeys = ['m2', 'habitaciones', 'banos'];
    } else if ([
      'electronica',
      'celular',
      'computadora',
    ].any((c) => cat.contains(c))) {
      topKeys = ['condicion', 'almacenamiento', 'memoria_ram'];
    } else if (['mascota', 'perro', 'gato'].any((c) => cat.contains(c))) {
      topKeys = ['raza', 'genero', 'edad_mascota'];
    }

    // Filtramos los que existen en este anuncio
    final highlights = attributes.entries
        .where(
          (e) => topKeys.contains(e.key) && e.value != null && e.value != '',
        )
        .toList();

    return Column(
      children: [
        // FILA DE BURBUJAS (Igual a tu Web)
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: highlights
                .map((e) => _buildBubble(e.key, e.value.toString()))
                .toList(),
          ),
        ),
        const SizedBox(height: 20),
        const Divider(),
        // RESTO DE ATRIBUTOS EN 2 COLUMNAS
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          childAspectRatio: 3,
          children: attributes.entries
              .where(
                (e) =>
                    !topKeys.contains(e.key) &&
                    e.value != null &&
                    e.value != '',
              )
              .map((e) => _buildSecondaryAttr(e.key, e.value.toString()))
              .toList(),
        ),
      ],
    );
  }

  Widget _buildBubble(String key, String value) {
    String displayValue = value;
    if (key == 'kilometraje') displayValue += ' km';
    if (key == 'm2') displayValue += ' m²';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 6),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.grey.shade50!, Colors.grey.shade200!],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300!),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4),
        ],
      ),
      child: Column(
        children: [
          Text(
            displayValue,
            style: const TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 16,
              color: AppColors.textDark,
            ),
          ),
          Text(
            key.toUpperCase(),
            style: const TextStyle(
              fontSize: 9,
              color: Colors.grey,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSecondaryAttr(String key, String value) {
    return ListTile(
      dense: true,
      title: Text(
        key.replaceAll('_', ' ').toUpperCase(),
        style: const TextStyle(fontSize: 10, color: Colors.grey),
      ),
      subtitle: Text(
        value,
        style: const TextStyle(
          fontWeight: FontWeight.w600,
          color: Colors.black87,
        ),
      ),
    );
  }
}
