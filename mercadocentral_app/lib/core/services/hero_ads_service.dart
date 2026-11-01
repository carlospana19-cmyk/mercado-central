import 'package:http/http.dart' as http;

class HeroAd {
  final String tipo;
  final String imagen;
  final String? link;
  final String empresa;
  final String textoCta;

  const HeroAd({
    required this.tipo,
    required this.imagen,
    required this.empresa,
    required this.textoCta,
    this.link,
  });
}

/// Lee los mismos anuncios del hero que usa la web (hero-ads.js en el repositorio).
class HeroAdsService {
  static const _sourceUrl =
      'https://raw.githubusercontent.com/carlospana19-cmyk/mercado-central/main/hero-ads.js';

  static Future<List<HeroAd>> fetchActiveAds() async {
    try {
      final response = await http
          .get(Uri.parse(
              '$_sourceUrl?t=${DateTime.now().millisecondsSinceEpoch}'))
          .timeout(const Duration(seconds: 8));
      if (response.statusCode != 200) return [];
      return parse(response.body, DateTime.now());
    } catch (_) {
      return [];
    }
  }

  static List<HeroAd> parse(String source, DateTime now) {
    final clean = source
        .replaceAll(RegExp(r'/\*[\s\S]*?\*/'), '')
        .replaceAll(RegExp(r'^\s*//.*$', multiLine: true), '');

    final start = clean.indexOf('HERO_ADS');
    if (start < 0) return [];

    final today = _dateKey(now);
    final field = RegExp(
      r'''(\w+)\s*:\s*(?:'([^']*)'|"([^"]*)"|(true|false))''',
    );
    final ads = <HeroAd>[];

    for (final block
        in RegExp(r'\{[^{}]*\}').allMatches(clean.substring(start))) {
      final values = <String, String>{};
      for (final m in field.allMatches(block.group(0)!)) {
        values[m.group(1)!] = m.group(2) ?? m.group(3) ?? m.group(4)!;
      }

      if (values['activo'] != 'true') continue;
      final from = values['fecha_inicio'];
      final to = values['fecha_fin'];
      if (from != null && from.compareTo(today) > 0) continue;
      if (to != null && to.compareTo(today) < 0) continue;

      final tipo = values['tipo'] ?? 'imagen';
      final image = [values['imagen'], values['imagen_movil']].firstWhere(
        (u) => u != null && u.startsWith('http'),
        orElse: () => null,
      );
      if (image == null) continue;

      final link = values['link'];
      ads.add(
        HeroAd(
          tipo: tipo,
          imagen: image,
          link: (link != null && link.startsWith('http')) ? link : null,
          empresa: values['empresa'] ?? 'Publicidad',
          textoCta: values['texto_cta'] ?? 'Conocer más',
        ),
      );
    }
    return ads;
  }

  static String _dateKey(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
