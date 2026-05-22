import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/theme/app_colors.dart';
import '../ads/screens/ad_details_page.dart';

class MercadoSearchDelegate extends SearchDelegate<String?> {
  final _supabase = Supabase.instance.client;

  // Cambiamos el texto de "Search" por algo más amigable
  @override
  String get searchFieldLabel => 'Buscar autos, laptops, mascotas...';

  // 🔍 FUNCIÓN QUE HABLA CON SUPABASE
  Future<List<Map<String, dynamic>>> _searchAds(String searchTerm) async {
    if (searchTerm.trim().isEmpty) return [];

    try {
      final response = await _supabase
          .from('anuncios')
          .select('*, imagenes(url_imagen)')
          // 🚨 FILTROS CLAVE:
          // .ilike busca palabras ignorando mayúsculas y minúsculas
          .ilike('titulo', '%$searchTerm%')
          // Solo mostramos anuncios que NO estén vendidos y sean públicos
          .eq('activo', true)
          .eq('is_sold', false)
          .order('created_at', ascending: false)
          .limit(20); // Máximo 20 resultados para no gastar datos del usuario

      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      debugPrint("Error en buscador: $e");
      return [];
    }
  }

  // 1. Botón para limpiar el texto (la "X" a la derecha)
  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        IconButton(
          icon: const Icon(Icons.clear, color: Colors.grey),
          onPressed: () {
            query = ''; // Borra el texto
          },
        ),
    ];
  }

  // 2. Botón para volver atrás (la flecha a la izquierda)
  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back, color: Colors.black),
      onPressed: () {
        close(context, null); // Cierra la pantalla de búsqueda
      },
    );
  }

  // 3. Lo que se muestra cuando el usuario presiona "Enter" o buscar
  @override
  Widget buildResults(BuildContext context) {
    return _buildSearchResults();
  }

  // 4. Lo que se muestra MIENTRAS el usuario escribe
  @override
  Widget buildSuggestions(BuildContext context) {
    // Si no ha escrito nada, mostramos un ícono amigable
    if (query.trim().isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.manage_search, size: 80, color: Colors.grey[300]),
            const SizedBox(height: 15),
            const Text(
              '¿Qué estás buscando hoy?',
              style: TextStyle(color: Colors.grey, fontSize: 16),
            ),
          ],
        ),
      );
    }
    // Si ya escribió algo, le mostramos los resultados en vivo mientras teclea
    return _buildSearchResults();
  }

  // 🏗️ DISEÑO DE LA LISTA DE RESULTADOS
  Widget _buildSearchResults() {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _searchAds(query),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          );
        }

        if (snapshot.hasError) {
          return const Center(child: Text('Hubo un error al buscar. 😢'));
        }

        final ads = snapshot.data ?? [];

        // Si escribió algo pero no hay coincidencias
        if (ads.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.sentiment_dissatisfied,
                  size: 60,
                  color: Colors.grey[300],
                ),
                const SizedBox(height: 15),
                Text(
                  'No encontramos nada para "$query"',
                  style: const TextStyle(color: Colors.grey),
                ),
              ],
            ),
          );
        }

        // Si encontramos productos, los dibujamos en una lista elegante
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: ads.length,
          separatorBuilder: (context, index) => const SizedBox(height: 15),
          itemBuilder: (context, index) {
            final ad = ads[index];

            // Lógica de foto segura
            String? imageUrl;
            if (ad['url_portada'] != null &&
                ad['url_portada'].toString().isNotEmpty) {
              imageUrl = ad['url_portada'].toString();
            } else if (ad['imagenes'] != null &&
                (ad['imagenes'] as List).isNotEmpty) {
              imageUrl = ad['imagenes'][0]['url_imagen'].toString();
            }

            return GestureDetector(
              onTap: () {
                // Al tocar el anuncio, lo llevamos a la página de detalles
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => AdDetailsPage(ad: ad),
                  ),
                );
              },
              child: Container(
                height: 120, // Altura fija para la tarjeta horizontal
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(15),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 5,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    // FOTO (Lado izquierdo)
                    ClipRRect(
                      borderRadius: const BorderRadius.horizontal(
                        left: Radius.circular(15),
                      ),
                      child: Container(
                        width: 120,
                        height: 120,
                        color: Colors.grey[100],
                        child: imageUrl != null
                            ? Image.network(
                                imageUrl,
                                fit: BoxFit.cover,
                                errorBuilder: (c, e, s) => const Icon(
                                  Icons.broken_image,
                                  color: Colors.grey,
                                ),
                              )
                            : const Icon(Icons.camera_alt, color: Colors.grey),
                      ),
                    ),
                    const SizedBox(width: 15),

                    // TEXTOS (Lado derecho)
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(0, 10, 10, 10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              ad['titulo'] ?? 'Sin título',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            const Spacer(),
                            Text(
                              '\$${ad['precio']}',
                              style: const TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                            ),
                            const SizedBox(height: 5),
                            Row(
                              children: [
                                const Icon(
                                  Icons.location_on_outlined,
                                  size: 14,
                                  color: Colors.grey,
                                ),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    '${ad['provincia'] ?? 'Panamá'}',
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: Colors.grey,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
