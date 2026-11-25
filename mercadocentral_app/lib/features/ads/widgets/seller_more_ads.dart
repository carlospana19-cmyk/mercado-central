import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../home/widgets/ads_grid.dart';

/// "Más anuncios de [vendedor]" (loadSellerMoreAds de product-detail-logic.js):
/// hasta 8 anuncios del mismo vendedor, sin el anuncio actual, con las
/// tarjetas compactas de la app. Si no hay más (o falla la consulta) no
/// ocupa espacio.
class SellerMoreAds extends StatefulWidget {
  final String sellerId;
  final String currentAdId;
  final String sellerName;

  const SellerMoreAds({
    super.key,
    required this.sellerId,
    required this.currentAdId,
    this.sellerName = '',
  });

  @override
  State<SellerMoreAds> createState() => _SellerMoreAdsState();
}

class _SellerMoreAdsState extends State<SellerMoreAds> {
  static const _maxAnuncios = 8;
  List<Map<String, dynamic>> _ads = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final response = await Supabase.instance.client
          .from('anuncios')
          .select(
            '*, imagenes(url_imagen), profiles(id, nombre_negocio, url_foto_perfil, nombre_completo)',
          )
          .eq('user_id', widget.sellerId)
          .eq('activo', true)
          .eq('is_sold', false)
          .order('fecha_publicacion', ascending: false)
          .limit(_maxAnuncios + 1);

      final otros = List<Map<String, dynamic>>.from(response)
          .where((a) => a['id']?.toString() != widget.currentAdId)
          .take(_maxAnuncios)
          .toList();
      if (mounted) setState(() => _ads = otros);
    } catch (error) {
      debugPrint('No se pudieron cargar más anuncios del vendedor: $error');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_ads.isEmpty) return const SizedBox.shrink();

    final nombre = widget.sellerName.trim();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          nombre.isEmpty ? 'Más anuncios del vendedor' : 'Más anuncios de $nombre',
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 10),
        AdsGrid(ads: _ads, padding: EdgeInsets.zero),
      ],
    );
  }
}
