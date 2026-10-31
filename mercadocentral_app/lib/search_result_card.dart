import 'package:flutter/material.dart';
import 'features/home/widgets/ad_card.dart';

/// Resultados de búsqueda y favoritos usan la misma tarjeta que el inicio.
class SearchResultCard extends StatelessWidget {
  final Map<String, dynamic> ad;
  final Function(bool)? onFavoriteToggle;

  const SearchResultCard({
    super.key,
    required this.ad,
    this.onFavoriteToggle,
  });

  @override
  Widget build(BuildContext context) =>
      AdCard(anuncio: ad, onFavoriteToggle: onFavoriteToggle);
}
