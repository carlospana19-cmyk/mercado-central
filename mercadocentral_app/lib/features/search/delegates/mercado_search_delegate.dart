import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/theme/app_colors.dart';
import '../../../search_result_card.dart';
import '../../ads/screens/ad_details_page.dart';

class MercadoSearchDelegate extends SearchDelegate {
  // Función para calcular el peso (ponerla fuera del build o como método privado)
  int _getPlanPriority(String? plan) {
    switch (plan?.toLowerCase()) {
      case 'destacado':
        return 1; // Prioridad Máxima
      case 'premium':
        return 2; // Prioridad Alta
      case 'basico':
        return 3; // Prioridad Media
      default:
        return 4; // Prioridad Baja (Gratis o sin plan)
    }
  }

  @override
  String get searchFieldLabel => 'Buscar en Mercado Central...';

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      IconButton(
          icon: const Icon(Icons.clear, color: Colors.grey),
          onPressed: () => query = '')
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.black87),
        onPressed: () => close(context, null));
  }

  String _normalize(String input) {
    final Map<String, String> diacritics = {
      'á': 'a',
      'à': 'a',
      'â': 'a',
      'ä': 'a',
      'ã': 'a',
      'å': 'a',
      'é': 'e',
      'è': 'e',
      'ê': 'e',
      'ë': 'e',
      'í': 'i',
      'ì': 'i',
      'î': 'i',
      'ï': 'i',
      'ó': 'o',
      'ò': 'o',
      'ô': 'o',
      'ö': 'o',
      'õ': 'o',
      'ú': 'u',
      'ù': 'u',
      'û': 'u',
      'ü': 'u',
      'ñ': 'n',
      'ç': 'c',
    };
    var result = input.toLowerCase();
    diacritics.forEach((char, replacement) {
      result = result.replaceAll(char, replacement);
    });
    return result;
  }

  Future<List<Map<String, dynamic>>> _buscarEnSupabase(String texto) async {
    if (texto.isEmpty) return [];
    final response = await Supabase.instance.client
        .from('anuncios')
        .select(
            '*, imagenes(url_imagen), profiles(id, nombre_negocio, url_foto_perfil, nombre_completo)')
        .eq('activo', true)
        .ilike('titulo', '%$texto%')
        .limit(50);
    final rawAds = List<Map<String, dynamic>>.from(response);

    // Filtro sin acentos en Dart: compara normalizando ambos lados
    final queryNorm = _normalize(texto);
    final filtered = rawAds.where((ad) {
      final titulo = _normalize(ad['titulo']?.toString() ?? '');
      final categoria = _normalize(ad['categoria']?.toString() ?? '');
      return titulo.contains(queryNorm) || categoria.contains(queryNorm);
    }).toList();

    return filtered;
  }

  @override
  Widget buildResults(BuildContext context) => _construirListaDeResultados();

  @override
  Widget buildSuggestions(BuildContext context) {
    if (query.isEmpty)
      return const Center(
          child: Text('Escribe el nombre de un producto...',
              style: TextStyle(color: Colors.grey)));
    return _construirListaDeResultados();
  }

  Widget _construirListaDeResultados() {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _buscarEnSupabase(query),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting)
          return const Center(
              child: CircularProgressIndicator(color: AppColors.primary));
        if (snapshot.hasError)
          return const Center(
              child: Text('Error en el radar.',
                  style: TextStyle(color: Colors.red)));
        final ads = snapshot.data ?? [];
        if (ads.isEmpty)
          return Center(
              child: Text('No encontramos "$query"',
                  style: const TextStyle(color: Colors.grey)));

        // Lógica de ordenamiento (ejecutarla JUSTO ANTES de construir el ListView)
        ads.sort((a, b) {
          return _getPlanPriority(a['selected_plan'])
              .compareTo(_getPlanPriority(b['selected_plan']));
        });

        return ListView.builder(
          padding: const EdgeInsets.all(15.0),
          itemCount: ads.length,
          itemBuilder: (context, index) {
            return SearchResultCard(ad: ads[index]);
          },
        );
      },
    );
  }
}
