import 'package:flutter/material.dart';
import '../../../core/config/app_config.dart';
import '../../search/custom_search_delegate.dart';

class HomeHeader extends StatelessWidget {
  const HomeHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Barra de Búsqueda
        GestureDetector(
          onTap: () {
            showSearch(context: context, delegate: MercadoSearchDelegate());
          },
          child: AbsorbPointer(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: TextField(
                readOnly: true,
                decoration: InputDecoration(
                  hintText: '¿Qué estás buscando en Panamá?',
                  prefixIcon: const Icon(
                    Icons.search,
                    color: Color(0xFF00c2cb),
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(30),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: Colors.grey[200],
                ),
              ),
            ),
          ),
        ),
        // Fila de Categorías (Scroll Horizontal)
        SizedBox(
          height: 100,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 10),
            itemCount: AppConfig.mainCategories.length,
            itemBuilder: (context, index) {
              final cat = AppConfig.mainCategories[index];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: const Color(0xFF00c2cb).withOpacity(0.1),
                      child: Icon(cat['icon'], color: const Color(0xFF00c2cb)),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      cat['nombre'],
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
