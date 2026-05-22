import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../features/ads/screens/ad_details_page.dart';

class SearchResultCard extends StatelessWidget {
  final Map<String, dynamic> ad;
  final Function(bool)? onFavoriteToggle;

  const SearchResultCard({
    Key? key,
    required this.ad,
    this.onFavoriteToggle,
  }) : super(key: key);

  // 👑 Función auxiliar para el badge de corona (Versión corregida)
  Widget? _buildCrownBadge(String? plan) {
    Color crownColor;
    switch (plan?.toLowerCase()) {
      case 'bronce':
        crownColor = const Color(0xFFCD7F32);
        break;
      case 'plata':
        crownColor = const Color(0xFFC0C0C0);
        break;
      case 'top':
      case 'destacado':
        crownColor = const Color(0xFFFFD700);
        break;
      default:
        return null;
    }

    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: FaIcon(FontAwesomeIcons.crown, color: crownColor, size: 14),
    );
  }

  // 📍 Lógica de ubicación sutil
  String _getShortLocation() {
    final String distrito = (ad['distrito'] ?? '').toString();
    final String provincia = (ad['provincia'] ?? 'Panamá').toString();

    if (distrito.isNotEmpty &&
        distrito.toLowerCase() != provincia.toLowerCase()) {
      return distrito;
    }
    return provincia;
  }

  @override
  Widget build(BuildContext context) {
    // 1. Datos Generales del Anuncio
    final String adId = ad['id']?.toString() ?? '';
    final String planNombre =
        (ad['selected_plan'] ?? ad['featured_plan'] ?? ad['plan'] ?? 'gratis')
            .toString();
    final Widget? crownWidget = _buildCrownBadge(planNombre);

    // 2. Extraer datos del vendedor al estilo Web
    final dynamic profiles = ad['profiles'];
    final Map<String, dynamic>? profileData =
        (profiles is List && profiles.isNotEmpty)
            ? profiles[0]
            : (profiles is Map<String, dynamic> ? profiles : null);

    final String vendorName = profileData?['nombre_negocio'] ??
        profileData?['nombre_completo'] ??
        ad['contact_name'] ??
        'Usuario Verificado';
    final String? vendorPhoto = profileData?['url_foto_perfil'];

    return Card(
      margin: const EdgeInsets.only(bottom: 20.0),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(15),
        side: BorderSide.none,
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => AdDetailsPage(ad: ad)),
          );
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // --- ZONA SUPERIOR: Imagen y Badges ---
            SizedBox(
              height: 180,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Hero(
                    tag: 'search-$adId',
                    child: Image.network(
                      ad['url_portada'] ?? '',
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        color: Colors.grey[200],
                        child: const Icon(Icons.image_not_supported),
                      ),
                    ),
                  ),
                  if (crownWidget != null)
                    Positioned(top: 10, right: 10, child: crownWidget),
                  if (adId.isNotEmpty)
                    Positioned(
                        top: 10,
                        left: 10,
                        child: _FavoriteButton(
                          adId: adId,
                          onToggle: onFavoriteToggle,
                        )),
                ],
              ),
            ),

            // --- ZONA INFERIOR: Estructura Clónica de la Web ---
            Padding(
              padding: const EdgeInsets.all(15.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Nombre del vendedor (Sutil, arriba)
                  Text(
                    vendorName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 4),

                  // 2. Fila: Precio (Izquierda) + Avatar (Derecha)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        ad['precio'] != null
                            ? '\$${ad['precio']}'
                            : 'Consultar',
                        style: const TextStyle(
                            fontSize: 22,
                            color: Color(0xFF00BFAE),
                            fontWeight: FontWeight.w900),
                      ),
                      CircleAvatar(
                        radius: 16,
                        backgroundColor: Colors.grey[200],
                        backgroundImage:
                            (vendorPhoto != null && vendorPhoto.isNotEmpty)
                                ? NetworkImage(vendorPhoto)
                                : null,
                        child: (vendorPhoto == null || vendorPhoto.isEmpty)
                            ? Text(
                                vendorName.substring(0, 1).toUpperCase(),
                                style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.grey[600]),
                              )
                            : null,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // 3. Título del Anuncio
                  Text(
                    ad['titulo'] ?? 'Producto sin título',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 15, fontWeight: FontWeight.bold, height: 1.2),
                  ),
                  const SizedBox(height: 10),

                  // 4. Reseñas y Ubicación en la base
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.star, size: 14, color: Colors.amber),
                          SizedBox(width: 4),
                          Text("4.8",
                              style: TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      Row(
                        children: [
                          const Icon(Icons.location_on,
                              size: 12, color: Colors.grey),
                          const SizedBox(width: 4),
                          Text(
                            _getShortLocation(),
                            style: const TextStyle(
                                fontSize: 12, color: Colors.grey),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
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
// WIDGET INTELIGENTE PARA LOS LIKES
// =======================================================
class _FavoriteButton extends StatefulWidget {
  final String adId;
  final Function(bool)? onToggle;
  const _FavoriteButton({required this.adId, this.onToggle});

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
              'p_anuncio_id': widget.adId,
            })
          : Future.value(false);

      final Future<dynamic> countFuture =
          supabase.rpc('get_anuncio_likes_count', params: {
        'p_anuncio_id': widget.adId,
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

    // Notify parent widget of the new state
    if (widget.onToggle != null) {
      widget.onToggle!(isLiked);
    }

    try {
      final response = await supabase.rpc('toggle_like', params: {
        'p_anuncio_id': widget.adId,
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
      setState(() {
        isLiked = !isLiked;
        likesCount += isLiked ? 1 : -1;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.8),
          shape: BoxShape.circle,
        ),
        child: const SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(strokeWidth: 2)),
      );
    }

    return GestureDetector(
      onTap: _toggleLike,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.9),
          borderRadius: BorderRadius.circular(20),
          boxShadow: const [
            BoxShadow(
                color: Colors.black12, blurRadius: 4, offset: Offset(0, 2)),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isLiked ? Icons.favorite : Icons.favorite_border,
              size: 16,
              color: isLiked ? Colors.red : Colors.grey[700],
            ),
            if (likesCount > 0) ...[
              const SizedBox(width: 4),
              Text(
                '$likesCount',
                style:
                    const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ]
          ],
        ),
      ),
    );
  }
}
