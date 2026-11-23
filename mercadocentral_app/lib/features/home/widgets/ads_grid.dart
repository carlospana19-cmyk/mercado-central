import 'package:flutter/material.dart';

import 'ad_card.dart';

/// Cuadrícula de 2 columnas (mc-tarjeta-2026.css: grid 2 columnas en móvil,
/// gap 12px) con tarjetas compactas [AdCard.compact].
///
/// Se arma por filas de 2 con [IntrinsicHeight]: las dos tarjetas de la fila
/// miden lo mismo sin depender de un childAspectRatio fijo (no hay overflow
/// aunque cambie la escala de texto o aparezcan píldoras).
const double kAdsGridGap = 12;

/// Cantidad de filas necesarias para [total] anuncios en 2 columnas.
int adsGridFilas(int total) => (total + 1) ~/ 2;

/// Una fila de la cuadrícula: los anuncios [inicio] e [inicio]+1 de [ads].
/// Pensada para usarse en `ListView.builder` con `itemCount: adsGridFilas(n)`.
class AdsGridRow extends StatelessWidget {
  final List<Map<String, dynamic>> ads;
  final int fila;
  final void Function(Map<String, dynamic> ad, bool liked)? onFavoriteToggle;

  const AdsGridRow({
    super.key,
    required this.ads,
    required this.fila,
    this.onFavoriteToggle,
  });

  Widget _tarjeta(Map<String, dynamic> ad) => AdCard(
        anuncio: ad,
        compact: true,
        onFavoriteToggle: onFavoriteToggle == null
            ? null
            : (liked) => onFavoriteToggle!(ad, liked),
      );

  @override
  Widget build(BuildContext context) {
    final i = fila * 2;
    final izquierda = ads[i];
    final derecha = i + 1 < ads.length ? ads[i + 1] : null;
    return Padding(
      padding: const EdgeInsets.only(bottom: kAdsGridGap),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(child: _tarjeta(izquierda)),
            const SizedBox(width: kAdsGridGap),
            Expanded(
              child: derecha == null
                  ? const SizedBox.shrink()
                  : _tarjeta(derecha),
            ),
          ],
        ),
      ),
    );
  }
}

/// Cuadrícula completa sin scroll propio (para columnas/slivers de la home).
class AdsGrid extends StatelessWidget {
  final List<Map<String, dynamic>> ads;
  final EdgeInsetsGeometry padding;
  final void Function(Map<String, dynamic> ad, bool liked)? onFavoriteToggle;

  const AdsGrid({
    super.key,
    required this.ads,
    this.padding = const EdgeInsets.symmetric(horizontal: 12),
    this.onFavoriteToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding,
      child: Column(
        children: [
          for (var f = 0; f < adsGridFilas(ads.length); f++)
            AdsGridRow(ads: ads, fila: f, onFavoriteToggle: onFavoriteToggle),
        ],
      ),
    );
  }
}
