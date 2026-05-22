// Archivo: lib/features/search/screens/all_categories_page.dart
import 'package:flutter/material.dart';
import 'package:mercadocentral_app/core/theme/app_colors.dart';
import '../models/category_catalog.dart'; // Importa el catálogo del paso 1

class AllCategoriesPage extends StatelessWidget {
  const AllCategoriesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Todas las Categorías',
            style: TextStyle(color: Colors.black87)),
        backgroundColor: Colors.white,
        elevation: 1, // Leve sombra
        iconTheme: const IconThemeData(
            color: Colors.black87), // Icono de atrás en negro
      ),
      body: ListView.builder(
        itemCount: fullCategoryCatalog.length,
        itemBuilder: (context, index) {
          final category = fullCategoryCatalog[index];

          // ExpansionTile es un widget mágico para listas desplegables
          return ExpansionTile(
            backgroundColor: Colors.white,
            collapsedBackgroundColor: Colors.white,
            // 1. Título de la categoría principal (con icono grande)
            leading: Icon(category.icon, color: AppColors.primary, size: 28),
            title: Text(category.name,
                style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: Colors.black87)),

            // 2. Icono de flecha que rota (hacia abajo)
            trailing: const Icon(Icons.arrow_drop_down, color: Colors.grey),

            // 3. El contenido: la lista de subcategorías (desplegable)
            children: category.subcategories.map((subcategory) {
              return ListTile(
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 50, vertical: 0),
                title: Text(subcategory,
                    style:
                        const TextStyle(fontSize: 14, color: Colors.black54)),
                onTap: () {
                  // Cuando tocas una subcategoría, se debe "devolver" la selección al Home
                  // Cerramos la pantalla y mandamos el nombre de la subcategoría
                  Navigator.pop(context, subcategory);
                },
              );
            }).toList(),
          );
        },
      ),
    );
  }
}
