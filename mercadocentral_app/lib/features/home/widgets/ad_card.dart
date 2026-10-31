import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:mercadocentral_app/features/ads/screens/ad_details_page.dart';
import '../../../theme/mc_colores.dart';

// Valores tomados de mc-base.css / mc-home.css de la web.
const _ink900 = Color(0xFF122129);
const _ink700 = Color(0xFF31413D);
const _ink500 = Color(0xFF5C6B66);
const _ink300 = Color(0xFF9AA7A2);
const _line = Color(0xFFE8ECEF);
const _bg = Color(0xFFF6F8FA);
const _teal600 = Color(0xFF087F73);

/// Atributos que la web muestra en la tarjeta, por categoría (AppConfig.js).
const _categoryAttributes = <String, List<String>>{
  'vehiculos': ['marca', 'anio', 'kilometraje'],
  'inmuebles': ['m2', 'habitaciones', 'banos'],
  'electronica': ['marca', 'modelo', 'almacenamiento'],
  'hogar': ['tipo_electrodomestico', 'tipo_mueble', 'marca'],
  'moda': ['talla', 'marca', 'color'],
  'deportes': ['tipo_bicicleta', 'tipo_instrumento', 'marca'],
  'mascotas': ['raza', 'edad_mascota', 'genero'],
  'servicios': ['tipo_servicio', 'modalidad', 'experiencia'],
  'negocios': ['tipo_negocio', 'razon_venta', 'condicion'],
  'comunidad': ['tipo_evento', 'tipo_clase', 'modalidad'],
};

const _defaultAttributes = ['marca', 'condicion'];

const _attributeSynonyms = <String, List<String>>{
  'habitaciones': ['habitaciones', 'recamaras', 'rooms'],
  'banos': ['banos', 'baños', 'toilettes'],
  'm2': ['m2', 'superficie', 'area'],
  'kilometraje': ['kilometraje', 'km'],
};

FaIconData _attributeIcon(String field) {
  switch (field) {
    case 'habitaciones':
      return FontAwesomeIcons.bed;
    case 'banos':
      return FontAwesomeIcons.bath;
    case 'm2':
      return FontAwesomeIcons.rulerCombined;
    case 'kilometraje':
      return FontAwesomeIcons.gaugeHigh;
    case 'transmision':
      return FontAwesomeIcons.gear;
    case 'combustible':
      return FontAwesomeIcons.gasPump;
    case 'condicion':
      return FontAwesomeIcons.circleInfo;
    default:
      return FontAwesomeIcons.check;
  }
}

String _categoryKey(String? categoria) {
  final c = (categoria ?? '').toLowerCase();
  if (c.contains('veh') ||
      c.contains('auto') ||
      c.contains('moto') ||
      c.contains('carro')) {
    return 'vehiculos';
  }
  if (c.contains('inmueble') ||
      c.contains('bienes') ||
      c.contains('casa') ||
      c.contains('apart')) {
    return 'inmuebles';
  }
  if (c.contains('electr') || c.contains('tecno')) return 'electronica';
  if (c.contains('hogar') || c.contains('mueble')) return 'hogar';
  if (c.contains('moda') || c.contains('belleza')) return 'moda';
  if (c.contains('deporte') || c.contains('hobb')) return 'deportes';
  if (c.contains('mascota')) return 'mascotas';
  if (c.contains('servicio')) return 'servicios';
  if (c.contains('negocio')) return 'negocios';
  if (c.contains('comunidad')) return 'comunidad';
  return '';
}

String _formatPrice(dynamic value) {
  final number = num.tryParse(value?.toString() ?? '');
  if (number == null) return 'Consultar';
  final parts = number.toStringAsFixed(2).split('.');
  final integer = parts[0].replaceAllMapped(
    RegExp(r'\B(?=(\d{3})+(?!\d))'),
    (_) => ',',
  );
  return 'B/. $integer.${parts[1]}';
}

class AdCard extends StatelessWidget {
  final Map<String, dynamic> anuncio;
  final Function(bool)? onFavoriteToggle;

  const AdCard({super.key, required this.anuncio, this.onFavoriteToggle});

  Map<String, dynamic>? get _profile {
    final profiles = anuncio['profiles'];
    if (profiles is List && profiles.isNotEmpty && profiles.first is Map) {
      return Map<String, dynamic>.from(profiles.first as Map);
    }
    if (profiles is Map) return Map<String, dynamic>.from(profiles);
    return null;
  }

  Map<String, dynamic> get _attributes {
    final raw = anuncio['atributos_clave'];
    try {
      if (raw is String && raw.trim().isNotEmpty) {
        final decoded = jsonDecode(raw);
        if (decoded is Map) return Map<String, dynamic>.from(decoded);
      } else if (raw is Map) {
        return Map<String, dynamic>.from(raw);
      }
    } catch (_) {}
    return {};
  }

  /// Hasta 3 atributos con valor, en el orden de la web.
  List<MapEntry<String, String>> _attributeChips() {
    final attrs = _attributes;
    if (attrs.isEmpty) return [];

    final fields =
        _categoryAttributes[_categoryKey(anuncio['categoria']?.toString())] ??
            _defaultAttributes;
    final chips = <MapEntry<String, String>>[];

    for (final field in fields) {
      for (final key in _attributeSynonyms[field] ?? [field]) {
        final value = attrs[key];
        if (value == null) continue;
        final text = value.toString().trim();
        if (text.isEmpty || text == '0' || text == 'N/A') continue;
        chips.add(MapEntry(
          field,
          text.length > 15 ? '${text.substring(0, 12)}...' : text,
        ));
        break;
      }
      if (chips.length == 3) break;
    }
    return chips;
  }

  String _location() {
    final distrito = (anuncio['distrito'] ?? '').toString().trim();
    final provincia = (anuncio['provincia'] ?? '').toString().trim();
    if (distrito.isNotEmpty && provincia.isNotEmpty) {
      return distrito.toLowerCase() == provincia.toLowerCase()
          ? provincia
          : '$distrito, $provincia';
    }
    return distrito.isNotEmpty
        ? distrito
        : (provincia.isNotEmpty ? provincia : 'Panamá');
  }

  Widget? _crownBadge(String plan) {
    final Color color;
    FaIconData icon = FontAwesomeIcons.crown;
    switch (plan.toLowerCase()) {
      case 'basico':
      case 'básico':
        color = const Color(0xFFCD7F32);
        break;
      case 'premium':
        color = _ink300;
        break;
      case 'top':
      case 'destacado':
        color = const Color(0xFFD4AF37);
        break;
      case 'elite':
        color = Mc.naranja;
        icon = FontAwesomeIcons.gem;
        break;
      default:
        return null;
    }

    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.94),
        shape: BoxShape.circle,
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2)),
        ],
      ),
      child: Center(child: FaIcon(icon, color: color, size: 14)),
    );
  }

  void _openDetails(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => AdDetailsPage(ad: anuncio)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final adId = anuncio['id']?.toString() ?? '';
    final plan = (anuncio['featured_plan'] ??
            anuncio['selected_plan'] ??
            anuncio['plan'] ??
            'free')
        .toString();
    final isSold = anuncio['is_sold'] == true;
    final profile = _profile;

    final vendorName = (profile?['nombre_negocio'] ?? 'Usuario').toString();
    final sellerLabel = [
      anuncio['contact_name'],
      profile?['nombre_completo'],
      profile?['nombre_negocio'],
    ]
        .map((v) => v?.toString().trim() ?? '')
        .firstWhere((v) => v.isNotEmpty, orElse: () => 'Usuario Verificado');
    final vendorPhoto = profile?['url_foto_perfil']?.toString();
    final cover = anuncio['url_portada']?.toString() ?? '';
    final crown = _crownBadge(plan);
    final chips = _attributeChips();

    Widget image = cover.isEmpty
        ? Container(color: const Color(0xFFEEF1F3))
        : Image.network(
            cover,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) =>
                Container(color: const Color(0xFFEEF1F3)),
          );
    if (isSold) {
      image = ColorFiltered(
        colorFilter: const ColorFilter.mode(Colors.grey, BlendMode.saturation),
        child: image,
      );
    }

    return GestureDetector(
      onTap: () => _openDetails(context),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _line),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0F122129),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 4 / 3,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  image,
                  if (crown != null)
                    Positioned(top: 10, left: 10, child: crown),
                  if (isSold)
                    Positioned(
                      top: 10,
                      left: 0,
                      right: 0,
                      child: Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: _ink900,
                            borderRadius: BorderRadius.circular(99),
                          ),
                          child: const Text(
                            'VENDIDO',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1,
                            ),
                          ),
                        ),
                      ),
                    ),
                  if (adId.isNotEmpty)
                    Positioned(
                      top: 10,
                      right: 10,
                      child: _FavoriteButton(
                        anuncioId: adId,
                        onToggle: onFavoriteToggle,
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    sellerLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      color: _ink500,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          _formatPrice(anuncio['precio']),
                          style: const TextStyle(
                            fontSize: 21,
                            fontWeight: FontWeight.w700,
                            color: _ink900,
                            letterSpacing: -0.4,
                          ),
                        ),
                      ),
                      if (vendorPhoto != null && vendorPhoto.isNotEmpty)
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: _line, width: 2),
                            image: DecorationImage(
                              image: NetworkImage(vendorPhoto),
                              fit: BoxFit.cover,
                            ),
                          ),
                          child: Tooltip(message: vendorName),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    anuncio['titulo']?.toString() ?? 'Sin título',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: _ink900,
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const FaIcon(
                        FontAwesomeIcons.locationDot,
                        size: 12,
                        color: _ink300,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          _location(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 13, color: _ink500),
                        ),
                      ),
                    ],
                  ),
                  if (chips.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        for (final chip in chips)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 9,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: _bg,
                              border: Border.all(color: _line),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                FaIcon(
                                  _attributeIcon(chip.key),
                                  size: 11,
                                  color: _teal600,
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  chip.value,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    color: _ink700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 42,
                    child: ElevatedButton(
                      onPressed: () => _openDetails(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Mc.naranja,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text(
                        'Contactar',
                        style: TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// =======================================================
// WIDGET INTELIGENTE PARA LOS LIKES (Basado en likes-logic.js)
// =======================================================
class _FavoriteButton extends StatefulWidget {
  final String anuncioId;
  final Function(bool)? onToggle;
  const _FavoriteButton({required this.anuncioId, this.onToggle});

  @override
  State<_FavoriteButton> createState() => _FavoriteButtonState();
}

class _FavoriteButtonState extends State<_FavoriteButton> {
  bool isLiked = false;
  int likesCount = 0;
  bool isLoading = true;
  final supabase = Supabase.instance.client;

  @override
  void initState() {
    super.initState();
    _checkInitialLikeStatus();
  }

  Future<void> _checkInitialLikeStatus() async {
    try {
      final user = supabase.auth.currentUser;

      final Future<dynamic> likeStatusFuture = user != null
          ? supabase.rpc('has_user_liked_anuncio', params: {
              'user_uuid': user.id,
              'p_anuncio_id': widget.anuncioId,
            })
          : Future.value(false);

      final Future<dynamic> countFuture =
          supabase.rpc('get_anuncio_likes_count', params: {
        'p_anuncio_id': widget.anuncioId,
      });

      final responses = await Future.wait([likeStatusFuture, countFuture]);

      if (mounted) {
        setState(() {
          isLiked = responses[0] as bool? ?? false;
          likesCount = responses[1] as int? ?? 0;
          isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error inicializando likes: $e');
      if (mounted) setState(() => isLoading = false);
    }
  }

  Future<void> _toggleLike() async {
    final user = supabase.auth.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Debes iniciar sesión para guardar en favoritos')),
      );
      return;
    }

    setState(() {
      isLiked = !isLiked;
      likesCount += isLiked ? 1 : -1;
    });
    widget.onToggle?.call(isLiked);

    try {
      final response = await supabase.rpc('toggle_like', params: {
        'p_anuncio_id': widget.anuncioId,
        'user_uuid': user.id,
      });

      if (mounted && response != null) {
        final data = response as Map<String, dynamic>;
        setState(() {
          isLiked = data['liked'] == true;
          likesCount = data['likes_count'] as int;
        });
      }
    } catch (e) {
      debugPrint('Error al toggle like: $e');
      if (mounted) {
        setState(() {
          isLiked = !isLiked;
          likesCount += isLiked ? 1 : -1;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLoading ? null : _toggleLike,
      child: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          border: Border.all(color: _line),
        ),
        child: isLoading
            ? const Padding(
                padding: EdgeInsets.all(9),
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Mc.naranja,
                ),
              )
            : Icon(
                isLiked ? Icons.favorite : Icons.favorite_border,
                size: 18,
                color: isLiked ? Mc.naranja : _ink500,
              ),
      ),
    );
  }
}
