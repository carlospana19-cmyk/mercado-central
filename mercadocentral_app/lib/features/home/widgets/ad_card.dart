import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:mercadocentral_app/features/ads/screens/ad_details_page.dart';

class AdCard extends StatelessWidget {
  final Map<String, dynamic> anuncio;
  const AdCard({super.key, required this.anuncio});

  Widget? _buildCrownBadge(String plan) {
    Color crownColor;
    switch (plan.toLowerCase()) {
      case 'basico':
      case 'básico':
        crownColor = const Color(0xFFCD7F32);
        break;
      case 'premium':
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
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        shape: BoxShape.circle,
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2)),
        ],
      ),
      child: FaIcon(FontAwesomeIcons.crown, color: crownColor, size: 12),
    );
  }

  String _getShortLocation() {
    final String distrito = (anuncio['distrito'] ?? '').toString();
    final String provincia = (anuncio['provincia'] ?? 'Panamá').toString();

    if (distrito.isNotEmpty &&
        distrito.toLowerCase() != provincia.toLowerCase()) {
      return distrito;
    }
    return provincia;
  }

  @override
  Widget build(BuildContext context) {
    final String planNombre = (anuncio['selected_plan'] ??
            anuncio['featured_plan'] ??
            anuncio['plan'] ??
            'gratis')
        .toString();

    final Widget? crownWidget = _buildCrownBadge(planNombre);
    // Aseguramos de tener el ID del anuncio de forma segura
    final String anuncioId = anuncio['id']?.toString() ?? '';

    return GestureDetector(
      onTap: () => Navigator.push(context,
          MaterialPageRoute(builder: (context) => AdDetailsPage(ad: anuncio))),
      child: Card(
        elevation: 0,
        margin: const EdgeInsets.all(4),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide.none,
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    anuncio['url_portada'] ?? '',
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) =>
                        Container(color: Colors.grey[200]),
                  ),

                  // 👑 Corona a la derecha
                  if (crownWidget != null)
                    Positioned(top: 6, right: 6, child: crownWidget),

                  // ❤️ Botón interactivo de Favoritos conectado a Supabase[cite: 8]
                  if (anuncioId.isNotEmpty)
                    Positioned(
                      top: 6,
                      left: 6,
                      child: _FavoriteButton(anuncioId: anuncioId),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    anuncio['titulo'] ?? 'Sin título',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.star, size: 10, color: Colors.amber),
                          SizedBox(width: 2),
                          Text("4.8",
                              style: TextStyle(
                                  fontSize: 10, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      Row(
                        children: [
                          const Icon(Icons.location_on,
                              size: 10, color: Colors.grey),
                          const SizedBox(width: 2),
                          Text(
                            _getShortLocation(),
                            style: const TextStyle(
                                fontSize: 10, color: Colors.grey),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    anuncio['precio'] != null
                        ? '\$${anuncio['precio']}'
                        : 'Consultar',
                    style: const TextStyle(
                        fontSize: 16,
                        color: Color(0xFF00BFAE),
                        fontWeight: FontWeight.w900),
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
  const _FavoriteButton({required this.anuncioId});

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

// Verificar estado inicial (Corregido para el tipado de Dart)
  Future<void> _checkInitialLikeStatus() async {
    try {
      final user = supabase.auth.currentUser;

      // 1. Preparamos explícitamente el Future para verificar si dio like
      final Future<dynamic> likeStatusFuture = user != null
          ? supabase.rpc('has_user_liked_anuncio', params: {
              'user_uuid': user.id,
              'p_anuncio_id': widget.anuncioId,
            })
          : Future.value(false);

      // 2. Preparamos explícitamente el Future para contar los likes
      final Future<dynamic> countFuture =
          supabase.rpc('get_anuncio_likes_count', params: {
        'p_anuncio_id': widget.anuncioId,
      });

      // 3. Ejecutamos ambas consultas en paralelo sin confundir al compilador
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

  // Dar o quitar like (Toggle)[cite: 8]
  Future<void> _toggleLike() async {
    final user = supabase.auth.currentUser;
    if (user == null) {
      // Opcional: Mostrar mensaje pidiendo iniciar sesión
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Debes iniciar sesión para guardar en favoritos')),
      );
      return;
    }

    // Efecto visual inmediato para mejor experiencia (Optimistic UI)
    setState(() {
      isLiked = !isLiked;
      likesCount += isLiked ? 1 : -1;
    });

    try {
      final response = await supabase.rpc('toggle_like', params: {
        'p_anuncio_id': widget.anuncioId,
        'user_uuid': user.id,
      });

      // Aseguramos sincronización con la base de datos[cite: 8]
      if (mounted && response != null) {
        final data = response as Map<String, dynamic>;
        setState(() {
          isLiked = data['liked'] == true;
          likesCount = data['likes_count'] as int;
        });
      }
    } catch (e) {
      debugPrint('Error al toggle like: $e');
      // Revertimos visualmente si hubo error[cite: 8]
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
        padding: const EdgeInsets.all(5),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.8),
          shape: BoxShape.circle,
        ),
        child: const SizedBox(
            width: 14,
            height: 14,
            child: CircularProgressIndicator(strokeWidth: 2)),
      );
    }

    return GestureDetector(
      onTap: _toggleLike,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
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
              size: 14,
              color: isLiked ? Colors.red : Colors.grey[700],
            ),
            if (likesCount > 0) ...[
              const SizedBox(width: 4),
              Text(
                '$likesCount',
                style:
                    const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
              ),
            ]
          ],
        ),
      ),
    );
  }
}
