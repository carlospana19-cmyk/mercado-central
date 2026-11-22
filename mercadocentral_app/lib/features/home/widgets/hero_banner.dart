import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/services/hero_ads_service.dart';
import '../../../theme/mc_colores.dart';

class HeroBanner extends StatefulWidget {
  const HeroBanner({
    super.key,
    required this.onExplorarAnuncios,
    required this.onPublicarGratis,
  });

  /// CTA "Explorar anuncios" de la lámina 1: abre el listado de anuncios.
  final VoidCallback onExplorarAnuncios;

  /// CTA "Publicar gratis" (ambas láminas): lleva a la pestaña Publicar.
  final VoidCallback onPublicarGratis;

  @override
  State<HeroBanner> createState() => _HeroBannerState();
}

class _HeroBannerState extends State<HeroBanner> {
  // Punto de partida virtual DEBE ser múltiplo de las láminas locales (2):
  // así el loop infinito arranca en la lámina 0 aunque el total cambie
  // cuando carguen los avisos patrocinados.
  static const int _inicioVirtual = 4000;

  // Autoplay ~6 s (la web usa 4-5 s con disableOnInteraction: false).
  static const Duration _intervalo = Duration(seconds: 6);

  final PageController _pageController =
      PageController(initialPage: _inicioVirtual);
  Timer? _timer;
  List<HeroAd> _ads = [];

  // Índice VIRTUAL actual dentro del PageView infinito (loop).
  int _paginaVirtual = _inicioVirtual;

  // Índice real (0..total-1) para el indicador de puntos.
  int _pagina = 0;

  // Láminas locales: el estado "sin avisos" (igual que la web cuando
  // hero-ads.js no trae publicidad activa). Texto espejo del hero actual de
  // index.html: un solo título + subtítulo constantes sobre el carrusel de
  // fondos (la web hace crossfade de las 2 imágenes con el texto fijo).
  static const List<Map<String, String>> _laminasLocales = [
    {
      'imagen': 'assets/images/hero-portada.jpg',
      'titulo': 'La plataforma que reúne muchos mercados',
      // Frase resaltada en naranja (paridad con la web: .highlight-text).
      'resaltar': 'muchos mercados',
      'subtitulo':
          'El punto de encuentro para hacer buenos negocios. Publica gratis o explora anuncios en bienes raíces, vehículos, tecnología y más.',
    },
    {
      'imagen': 'assets/images/hero-tarjetas.jpg',
      'titulo': 'La plataforma que reúne muchos mercados',
      'resaltar': 'muchos mercados',
      'subtitulo':
          'El punto de encuentro para hacer buenos negocios. Publica gratis o explora anuncios en bienes raíces, vehículos, tecnología y más.',
    },
  ];

  int get _totalLaminas =>
      _ads.isNotEmpty ? _ads.length : _laminasLocales.length;

  @override
  void initState() {
    super.initState();
    _startTimer();
    _loadAds();
  }

  Future<void> _loadAds() async {
    final ads = await HeroAdsService.fetchActiveAds();
    if (!mounted || ads.isEmpty) return;
    setState(() {
      _ads = ads;
      _paginaVirtual = _inicioVirtual;
      _pagina = 0;
    });
    if (_pageController.hasClients) _pageController.jumpToPage(_inicioVirtual);
  }

  void _startTimer() {
    _timer = Timer.periodic(_intervalo, (_) {
      if (!_pageController.hasClients || _totalLaminas < 2) return;
      _paginaVirtual += 1;
      _pageController.animateToPage(
        _paginaVirtual,
        duration: const Duration(milliseconds: 800),
        curve: Curves.easeInOutQuart,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _open(String url) async {
    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 180,
      // itemCount null = carrusel con loop infinito (swipe manual incluido).
      child: PageView.builder(
        controller: _pageController,
        onPageChanged: (index) => setState(() {
          _paginaVirtual = index;
          _pagina = index % _totalLaminas;
        }),
        itemBuilder: (context, index) {
          final real = index % _totalLaminas;
          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(15),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: Stack(
              fit: StackFit.expand,
              children: [
                _ads.isNotEmpty
                    ? _sponsoredSlide(_ads[real])
                    : _laminaLocal(_laminasLocales[real], real),
                _puntos(),
              ],
            ),
          );
        },
      ),
    );
  }

  /// Indicador de puntos del carrusel (activo = pastilla alargada).
  Widget _puntos() {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 8,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(
          _totalLaminas,
          (i) => AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            width: i == _pagina ? 16 : 6,
            height: 6,
            margin: const EdgeInsets.symmetric(horizontal: 3),
            decoration: BoxDecoration(
              color: i == _pagina
                  ? Colors.white
                  : Colors.white.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(3),
            ),
          ),
        ),
      ),
    );
  }

  Widget _sponsoredSlide(HeroAd ad) {
    return Stack(
      fit: StackFit.expand,
      children: [
        CachedNetworkImage(
          imageUrl: ad.imagen,
          fit: BoxFit.cover,
          placeholder: (_, __) => Container(color: Colors.black12),
          errorWidget: (context, error, stack) =>
              Container(color: Colors.black12),
        ),
        Positioned(
          top: 10,
          left: 10,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: Colors.black54,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Text(
              'Patrocinado',
              style: TextStyle(color: Colors.white, fontSize: 10),
            ),
          ),
        ),
        if (ad.link != null)
          Positioned(
            right: 12,
            bottom: 12,
            child: ElevatedButton(
              onPressed: () => _open(ad.link!),
              style: ElevatedButton.styleFrom(
                backgroundColor: Mc.naranja,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 14),
              ),
              child: Text(ad.textoCta),
            ),
          ),
      ],
    );
  }

  /// Lámina local con foto propia, scrim bajo el texto y sus CTA.
  Widget _laminaLocal(Map<String, String> lamina, int index) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Image.asset(
          lamina['imagen']!,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => Container(color: Colors.black12),
        ),
        // Scrim (gradiente suave) bajo el texto en AMBAS láminas: la lámina
        // 2 es clara y el texto blanco no se leería sin él.
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.transparent,
                Colors.black.withValues(alpha: 0.55),
              ],
              stops: const [0.45, 1.0],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _tituloLamina(lamina),
              const SizedBox(height: 3),
              Text(
                lamina['subtitulo']!,
                maxLines: 2,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w400,
                ),
              ),
              const SizedBox(height: 10),
              Wrap(spacing: 8, runSpacing: 6, children: _ctasDeLamina(index)),
            ],
          ),
        ),
      ],
    );
  }

  /// Título de la lámina: resalta en naranja la frase marcada
  /// ('muchos mercados' en la lámina 1, igual que .highlight-text en la web).
  Widget _tituloLamina(Map<String, String> lamina) {
    final titulo = lamina['titulo']!;
    final resaltar = lamina['resaltar'];
    const base = TextStyle(
      color: Colors.white,
      fontSize: 17,
      fontWeight: FontWeight.bold,
      height: 1.15,
    );
    if (resaltar == null || !titulo.contains(resaltar)) {
      return Text(titulo, maxLines: 2, style: base);
    }
    final i = titulo.indexOf(resaltar);
    return Text.rich(
      TextSpan(
        children: [
          TextSpan(text: titulo.substring(0, i)),
          TextSpan(
            text: resaltar,
            style: const TextStyle(color: Mc.naranja),
          ),
          if (i + resaltar.length < titulo.length)
            TextSpan(text: titulo.substring(i + resaltar.length)),
        ],
      ),
      maxLines: 2,
      style: base,
    );
  }

  /// CTAs propios de cada lámina local: la 1 lleva dos, la 2 solo uno.
  List<Widget> _ctasDeLamina(int index) => switch (index) {
        0 => [
            _ctaSecundario('Explorar anuncios', widget.onExplorarAnuncios),
            _ctaPrimario('Publicar gratis', widget.onPublicarGratis),
          ],
        _ => [_ctaPrimario('Publicar gratis', widget.onPublicarGratis)],
      };

  Widget _ctaPrimario(String texto, VoidCallback onTap) {
    return ElevatedButton(
      onPressed: onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: Mc.naranja,
        foregroundColor: Colors.white,
        minimumSize: const Size(0, 34),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(19)),
      ),
      child: Text(
        texto,
        style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget _ctaSecundario(String texto, VoidCallback onTap) {
    return ElevatedButton(
      onPressed: onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.white,
        foregroundColor: Mc.textoListas,
        minimumSize: const Size(0, 34),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(19)),
      ),
      child: Text(
        texto,
        style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
      ),
    );
  }
}
