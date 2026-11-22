import 'dart:convert';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mercadocentral_app/core/utils/formatos.dart';
import 'package:mercadocentral_app/features/ads/screens/ad_details_page.dart';
import '../../../theme/mc_colores.dart';

// Valores tomados de mc-base.css / mc-tarjeta-2026.css de la web.
const _ink900 = Color(0xFF122129);
const _ink500 = Color(0xFF5C6B66);
const _ink300 = Color(0xFF9AA7A2);
const _line = Color(0xFFE8ECEF);
const _bg = Color(0xFFF6F8FA);

// Único tono de texto de la tarjeta (#1F2937): título, estados neutros y
// ubicación. PROHIBIDO reintroducir verde-azulado (turquesa/cian): regla 90/10.
const _textoTarjeta = Color(0xFF1F2937);

// Píldora "Urgente" sobre la foto (mc-badge-urgente).
const _urgenteFondo = Color(0xFFFFF3E0);
const _urgenteTexto = Color(0xFFB25E00);
const _urgenteBorde = Color(0xFFF5D9A8);

// Píldora "Destacado" en el cuerpo (mc-badge-destacado: --accion-50/600).
const _destacadoFondo = Color(0xFFFFF1E8);
const _destacadoTexto = Color(0xFFE05A00);
const _destacadoBorde = Color(0x29FA6406); // rgba(250,100,6,.16)

// ============================================================
// Normalizadores (paridad con utilidades-ui.js de la web).
// ============================================================

/// Inicial del título para el fondo gris cuando el anuncio no tiene foto
/// (inicialDe de utilidades-ui.js).
String _inicialDe(String? texto) {
  final t = (texto ?? '').trim();
  return t.isEmpty ? 'M' : t.substring(0, 1).toUpperCase();
}

/// Decodifica un valor que puede llegar como Map o como string JSON
/// (incluso doble-codificado). Devuelve {} si no se puede leer.
Map<String, dynamic> _decodeMap(dynamic raw) {
  var value = raw;
  for (var i = 0; i < 3 && value is String; i++) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return {};
    try {
      value = jsonDecode(trimmed);
    } catch (_) {
      return {};
    }
  }
  if (value is Map) return Map<String, dynamic>.from(value);
  return {};
}

/// Galería de fotos: array de Supabase o string JSON (doble-codificado
/// incluido). Nunca devuelve JSON crudo: un texto plano se trata como URL.
List<String> _decodeGaleria(dynamic raw) {
  var value = raw;
  for (var i = 0; i < 3 && value is String; i++) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return const [];
    try {
      value = jsonDecode(trimmed);
    } catch (_) {
      return [trimmed];
    }
  }
  if (value is List) {
    return [
      for (final item in value)
        if (item != null && item.toString().trim().isNotEmpty)
          item.toString().trim(),
    ];
  }
  if (value is String && value.trim().isNotEmpty) return [value.trim()];
  return const [];
}

/// Imagen de portada con la prioridad EXACTA de tarjeta-anuncio.js:
/// imagen_portada > imagenes[0].url_imagen > url_portada > url_galeria[0].
String _portadaUrl(Map<String, dynamic> ad) {
  final portada = ad['imagen_portada']?.toString().trim() ?? '';
  if (portada.isNotEmpty) return portada;
  final imagenes = ad['imagenes'];
  if (imagenes is List && imagenes.isNotEmpty && imagenes.first is Map) {
    final primera =
        (imagenes.first as Map)['url_imagen']?.toString().trim() ?? '';
    if (primera.isNotEmpty) return primera;
  }
  final urlPortada = ad['url_portada']?.toString().trim() ?? '';
  if (urlPortada.isNotEmpty) return urlPortada;
  final galeria = _decodeGaleria(ad['url_galeria']);
  return galeria.isNotEmpty ? galeria.first : '';
}

/// "Nuevo": publicado hace menos de 24 horas (esNuevo de utilidades-ui.js).
bool _esNuevo(Map<String, dynamic> ad) {
  final fecha = ad['created_at'] ?? ad['fecha_publicacion'];
  final date = DateTime.tryParse(fecha?.toString() ?? '');
  if (date == null) return false;
  return DateTime.now().difference(date).inMinutes < 24 * 60;
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

  /// Mejoras del plan (enhancements): puede llegar como Map o string JSON.
  Map<String, dynamic> get _enhancements => _decodeMap(anuncio['enhancements']);

  /// Píldora "Urgente" sobre la foto: solo si enhancements.is_urgent = true.
  bool get _esUrgente => _enhancements['is_urgent'] == true;

  /// "Destacado": plan dorado/diamante (destacado/top/elite), igual que la web.
  bool get _esDestacado {
    final plan = (anuncio['featured_plan'] ??
            anuncio['selected_plan'] ??
            anuncio['plan'] ??
            '')
        .toString()
        .toLowerCase()
        .trim();
    return plan == 'destacado' || plan == 'top' || plan == 'elite';
  }

  /// Portada con la prioridad de la web.
  String get _coverUrl => _portadaUrl(anuncio);

  /// Galería real (portada + galería, sin duplicados): alimenta la foto
  /// y el conteo 📷, igual que tarjeta-anuncio.js.
  List<String> get _galeria {
    final galeria = <String>[];
    final portada = _coverUrl;
    if (portada.isNotEmpty) galeria.add(portada);
    for (final url in _decodeGaleria(anuncio['url_galeria'])) {
      if (!galeria.contains(url)) galeria.add(url);
    }
    return galeria;
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

  /// Fondo gris con la inicial del título cuando no hay foto real
  /// (mc-card-foto-vacia de la web: nunca una imagen rota).
  Widget _fotoVacia() => Container(
        color: const Color(0xFFEEF1F3),
        alignment: Alignment.center,
        child: Text(
          _inicialDe(anuncio['titulo']?.toString()),
          style: const TextStyle(
            fontSize: 42,
            fontWeight: FontWeight.w700,
            color: Color(0xFFAEBBB8),
          ),
        ),
      );

  /// Abre el video del anuncio fuera de la app (la web lo reproduce embebido;
  /// sin webview disponible aquí, se lanza con el visor del sistema).
  Future<void> _openVideo(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      // Sin visor disponible: el botón no abre nada, no rompe la tarjeta.
    }
  }

  /// Píldora de estado del cuerpo (mc-card-estados): 2px 8px, 10.5px w600.
  Widget _estadoPildora(
    String label, {
    required Color fondo,
    required Color color,
    required Color borde,
  }) =>
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          color: fondo,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: borde),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w600,
            color: color,
          ),
        ),
      );

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
    final cover = _coverUrl;
    final galeria = _galeria;
    final urlVideo = (anuncio['url_video'] ?? '').toString().trim();
    final esUrgente = _esUrgente;
    final esDestacado = _esDestacado;
    final esNuevo = _esNuevo(anuncio);
    final crown = _crownBadge(plan);

    // Grayscale de "VENDIDO" aplicado DENTRO del widget de imagen
    // (color + colorBlendMode). NO usar un widget ColorFiltered aquí:
    // crea una capa saveLayer que, dentro de la tarjeta con clip, al hacer
    // scroll se pinta con el offset viejo y la imagen "sube" mientras la
    // tarjeta se queda (bug de composición). El filtro a nivel Image se
    // aplica en el paint de la imagen y viaja pegado a la tarjeta.
    Widget image = cover.isEmpty
        ? _fotoVacia() // ya es gris; no necesita filtro de saturación
        : CachedNetworkImage(
            imageUrl: cover,
            fit: BoxFit.cover,
            // Sin fade: la animación de aparición se desfasa del scroll y
            // la imagen parece "subir" sola dentro de la tarjeta.
            fadeInDuration: Duration.zero,
            fadeOutDuration: Duration.zero,
            // Placeholder gris mientras carga (mc-card-foto de la web).
            placeholder: (_, __) => Container(color: _bg),
            errorWidget: (_, __, ___) => _fotoVacia(),
            color: isSold ? const Color(0xFF808080) : null,
            colorBlendMode: isSold ? BlendMode.saturation : null,
          );

    return GestureDetector(
      // La tarjeta completa abre el detalle; si está vendida, no navega.
      onTap: isSold ? null : () => _openDetails(context),
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
                  // RepaintBoundary: la imagen se compone en su propia capa
                  // y viaja SIEMPRE pegada a la tarjeta aunque el raster
                  // cache de Impeller/Skia se desfase durante el scroll.
                  RepaintBoundary(child: image),
                  if (crown != null)
                    Positioned(top: 10, left: 10, child: crown),
                  // Píldora "Urgente" sobre la foto; con corona presente se
                  // desplaza hacia abajo para no pisarla (mc-badges.con-corona).
                  if (esUrgente)
                    Positioned(
                      top: crown != null ? 50 : 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: _urgenteFondo,
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: _urgenteBorde),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            FaIcon(
                              FontAwesomeIcons.clock,
                              size: 9,
                              color: _urgenteTexto,
                            ),
                            SizedBox(width: 4),
                            Text(
                              'Urgente',
                              style: TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w600,
                                color: _urgenteTexto,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
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
                  // Botón "▶ Video" sobre la foto, solo si el anuncio tiene
                  // video (url_video no nulo). El tap no navega al detalle.
                  if (urlVideo.isNotEmpty)
                    Positioned(
                      left: 8,
                      bottom: 8,
                      child: GestureDetector(
                        onTap: () => _openVideo(urlVideo),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xD9122129),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              FaIcon(
                                FontAwesomeIcons.play,
                                size: 10,
                                color: Colors.white,
                              ),
                              SizedBox(width: 6),
                              Text(
                                'Video',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  // Conteo de fotos (📷 + número) solo cuando hay 2 o más.
                  if (galeria.length >= 2)
                    Positioned(
                      right: 8,
                      bottom: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 9,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.55),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const FaIcon(
                              FontAwesomeIcons.camera,
                              size: 10,
                              color: Colors.white,
                            ),
                            const SizedBox(width: 5),
                            Text(
                              '${galeria.length}',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
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
                          // USD "$1,250.00" (FASE 1) con el criterio
                          // "A consultar" de precioTexto (utilidades-ui.js).
                          Formatos.precioUsd(anuncio['precio']),
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
                              image: CachedNetworkImageProvider(vendorPhoto),
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
                      color: _textoTarjeta,
                      height: 1.35,
                    ),
                  ),
                  // Estados pegados al título, SIEMPRE en el cuerpo blanco
                  // (nunca sobre la imagen): "Destacado" según el plan y
                  // "Nuevo" si el anuncio tiene menos de 24 horas.
                  if (esDestacado || esNuevo) ...[
                    const SizedBox(height: 5),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        if (esDestacado)
                          _estadoPildora(
                            'Destacado',
                            fondo: _destacadoFondo,
                            color: _destacadoTexto,
                            borde: _destacadoBorde,
                          ),
                        if (esNuevo)
                          _estadoPildora(
                            'Nuevo',
                            fondo: _bg,
                            color: _ink500,
                            borde: _line,
                          ),
                      ],
                    ),
                  ],
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
                          style: const TextStyle(
                              fontSize: 13, color: _textoTarjeta),
                        ),
                      ),
                    ],
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
