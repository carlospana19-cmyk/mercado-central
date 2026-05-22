import 'package:flutter/material.dart';

class AdAttributesGrid extends StatelessWidget {
  final Map<String, dynamic> anuncio;

  const AdAttributesGrid({Key? key, required this.anuncio}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Extraemos datos del anuncio o usamos valores por defecto si no existen aún
    final attributes = [
      {'icon': Icons.category, 'label': 'Categoría', 'value': anuncio['categoria'] ?? 'General'},
      {'icon': Icons.location_on, 'label': 'Ubicación', 'value': '${anuncio['provincia'] ?? 'Panamá'}, ${anuncio['distrito'] ?? ''}'},
      {'icon': Icons.verified, 'label': 'Estado', 'value': anuncio['is_sold'] == true ? 'Vendido' : 'Disponible'},
      {'icon': Icons.local_shipping, 'label': 'Entrega', 'value': 'A convenir'},
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 2.5,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: attributes.length,
      itemBuilder: (context, index) {
        final attr = attributes[index];
        return Container(
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(attr['icon'] as IconData, size: 24, color: Colors.blue[900]),
              const SizedBox(width: 10),
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(attr['label'] as String, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  Text(attr['value'] as String, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}