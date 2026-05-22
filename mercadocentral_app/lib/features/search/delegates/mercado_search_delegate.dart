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

  Future<List<Map<String, dynamic>>> _buscarEnSupabase(String texto) async {
    if (texto.isEmpty) return [];
    final response = await Supabase.instance.client
        .from('anuncios')
        .select('*, imagenes(url_imagen)')
        .eq('activo', true)
        .ilike('titulo', '%$texto%')
        .limit(20);
    return List<Map<String, dynamic>>.from(response);
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
