import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/theme/app_colors.dart';
import '../../ads/screens/ad_details_page.dart';
import 'ad_card.dart';

class FeaturedAds extends StatefulWidget {
  final String categoriaFiltro;
  const FeaturedAds({super.key, this.categoriaFiltro = 'Todos'});

  @override
  State<FeaturedAds> createState() => _FeaturedAdsState();
}

class _FeaturedAdsState extends State<FeaturedAds> {
  // Variable para manejar el estado de la búsqueda y que los filtros funcionen
  late Future<List<Map<String, dynamic>>> _adsFuture;

  @override
  void initState() {
    super.initState();
    _adsFuture = _fetchAds();
  }

  @override
  void didUpdateWidget(covariant FeaturedAds oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Si el usuario toca otra categoría, refrescamos la lista
    if (oldWidget.categoriaFiltro != widget.categoriaFiltro) {
      setState(() {
        _adsFuture = _fetchAds();
      });
    }
  }

  Future<List<Map<String, dynamic>>> _fetchAds() async {
    var query = Supabase.instance.client
        .from('anuncios')
        .select(
            '*, imagenes(url_imagen), profiles(id, nombre_negocio, url_foto_perfil, nombre_completo)')
        .eq('activo', true)
        .eq('is_sold', false);

    // 🚨 1. EL FILTRO BLINDADO: Usamos comillas dobles (\") para proteger las palabras con espacios
    if (widget.categoriaFiltro != 'Todos') {
      query = query.or(
          'categoria.eq."${widget.categoriaFiltro}",subcategoria.eq."${widget.categoriaFiltro}"');
    }

    // 2. Descargamos los anuncios más recientes de esa categoría
    final response =
        await query.order('created_at', ascending: false).limit(30);
    List<Map<String, dynamic>> ads = List<Map<String, dynamic>>.from(response);

    // 3. ORDENAMIENTO VIP (Destacado > Premium > Básico > Gratis)
    int getPlanScore(String? planName) {
      if (planName == null) return 1;
      final p = planName.toLowerCase().trim();
      if (p == 'destacado') return 4;
      if (p == 'premium') return 3;
      if (p == 'basico' || p == 'básico') return 2;
      return 1;
    }

    ads.sort((a, b) {
      String? planA = a['selected_plan']?.toString() ??
          a['featured_plan']?.toString() ??
          a['plan']?.toString();
      String? planB = b['selected_plan']?.toString() ??
          b['featured_plan']?.toString() ??
          b['plan']?.toString();

      int scoreA = getPlanScore(planA);
      int scoreB = getPlanScore(planB);

      if (scoreA != scoreB) {
        return scoreB.compareTo(scoreA); // Prioriza el plan de pago
      }

      // En caso de empate, prioriza el más reciente
      DateTime dateA =
          DateTime.tryParse(a['created_at'].toString()) ?? DateTime.now();
      DateTime dateB =
          DateTime.tryParse(b['created_at'].toString()) ?? DateTime.now();
      return dateB.compareTo(dateA);
    });

    // 4. Retorna el batallón ordenado
    return ads.take(20).toList();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _adsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(40.0),
              child: CircularProgressIndicator(color: AppColors.primary),
            ),
          );
        }

        if (snapshot.hasError || !snapshot.hasData || snapshot.data!.isEmpty) {
          return const SizedBox.shrink();
        }

        final ads = snapshot.data!;

        return ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: ads.length,
          itemBuilder: (context, index) => AdCard(anuncio: ads[index]),
        );
      },
    );
  }
}
