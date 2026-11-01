import 'dart:async';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/services/hero_ads_service.dart';

class HeroBanner extends StatefulWidget {
  const HeroBanner({super.key});

  @override
  State<HeroBanner> createState() => _HeroBannerState();
}

class _HeroBannerState extends State<HeroBanner> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  Timer? _timer;
  List<HeroAd> _ads = [];

  // Se muestran cuando no hay publicidad activa en hero-ads.js (igual que la web).
  final List<Map<String, String>> _defaultBanners = [
    {
      'image':
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800',
      'title': '¡Destaca tu Auto Aquí!',
      'subtitle': 'Llega a más de 50,000 personas hoy.',
    },
    {
      'image':
          'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800',
      'title': 'Bienes Raíces en Panamá',
      'subtitle': 'Las mejores propiedades en un solo lugar.',
    },
  ];

  int get _count => _ads.isNotEmpty ? _ads.length : _defaultBanners.length;

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
      _currentPage = 0;
    });
    if (_pageController.hasClients) _pageController.jumpToPage(0);
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!_pageController.hasClients || _count < 2) return;
      _currentPage = (_currentPage + 1) % _count;
      _pageController.animateToPage(
        _currentPage,
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
      child: PageView.builder(
        controller: _pageController,
        itemCount: _count,
        onPageChanged: (index) => _currentPage = index,
        itemBuilder: (context, index) => Container(
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
          child: _ads.isNotEmpty
              ? _sponsoredSlide(_ads[index])
              : _defaultSlide(_defaultBanners[index]),
        ),
      ),
    );
  }

  Widget _sponsoredSlide(HeroAd ad) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Image.network(
          ad.imagen,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stack) =>
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
                backgroundColor: const Color(0xFFFF8A3D),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 14),
              ),
              child: Text(ad.textoCta),
            ),
          ),
      ],
    );
  }

  Widget _defaultSlide(Map<String, String> banner) {
    return Stack(
      children: [
        Image.network(
          banner['image']!,
          fit: BoxFit.cover,
          width: double.infinity,
          height: double.infinity,
          color: Colors.black.withValues(alpha: 0.3),
          colorBlendMode: BlendMode.darken,
        ),
        Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                banner['title']!,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                banner['subtitle']!,
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
