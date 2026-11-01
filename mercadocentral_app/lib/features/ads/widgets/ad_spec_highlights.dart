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
    final visibleAttributes = Map<String, dynamic>.fromEntries(
      attributes.entries.where((entry) {
        final key = entry.key.toLowerCase();
        final value = entry.value?.toString().trim() ?? '';
        const excludedKeys = [
          'step',
          'categoria',
          'subcategoria',
          'provincia',
          'distrito',
          'attr-',
        ];
        return !excludedKeys.any((part) => key.contains(part)) &&
            value.isNotEmpty &&
            value != '0' &&
            value != 'N/A' &&
            value != '{}';
      }),
    );
    if (visibleAttributes.isEmpty) return const SizedBox.shrink();

    final cat = categoria
        .toLowerCase()
        .replaceAll('á', 'a')
        .replaceAll('é', 'e')
        .replaceAll('í', 'i')
        .replaceAll('ó', 'o')
        .replaceAll('ú', 'u');

    final List<String> topKeys;
    if (cat.contains('inmuebl') ||
        cat.contains('casa') ||
        cat.contains('apart')) {
      topKeys = ['m2', 'habitaciones', 'banos'];
    } else if (['electronica', 'celular', 'computadora'].any(cat.contains)) {
      topKeys = ['condicion', 'almacenamiento', 'memoria_ram'];
    } else if (['mascota', 'perro', 'gato'].any(cat.contains)) {
      topKeys = ['raza', 'genero', 'edad_mascota'];
    } else if (cat.contains('veh') ||
        cat.contains('auto') ||
        cat.contains('moto')) {
      topKeys = ['anio', 'kilometraje', 'combustible'];
    } else {
      topKeys = visibleAttributes.keys.take(3).toList();
    }

    final highlights = topKeys
        .where(visibleAttributes.containsKey)
        .map((key) => MapEntry(key, visibleAttributes[key]))
        .toList();
    final remaining = visibleAttributes.entries
        .where((entry) => !topKeys.contains(entry.key))
        .toList();

    return Column(
      children: [
        if (highlights.isNotEmpty) ...[
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: highlights
                  .map((entry) =>
                      _buildBubble(entry.key, entry.value.toString()))
                  .toList(),
            ),
          ),
          if (remaining.isNotEmpty) const SizedBox(height: 20),
        ],
        if (remaining.isNotEmpty) ...[
          const Divider(),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            childAspectRatio: 3,
            children: remaining
                .map((entry) =>
                    _buildSecondaryAttr(entry.key, entry.value.toString()))
                .toList(),
          ),
        ],
      ],
    );
  }

  Widget _buildBubble(String key, String value) {
    var displayValue = value;
    if (key == 'kilometraje') displayValue += ' km';
    if (key == 'm2') displayValue += ' m²';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 6),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.grey.shade50, Colors.grey.shade200],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
          ),
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
