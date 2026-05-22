import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:mercadocentral_app/search_result_card.dart';

// 🚀 LLAVE MAESTRA DECLARADA GLOBALMENTE
final GlobalKey<FavoritesPageState> favoritesPageKey =
    GlobalKey<FavoritesPageState>();

class FavoritesPage extends StatefulWidget {
  // Constructor estándar
  const FavoritesPage({Key? key}) : super(key: key);

  @override
  State<FavoritesPage> createState() => FavoritesPageState();
}

class FavoritesPageState extends State<FavoritesPage> {
  final supabase = Supabase.instance.client;
  List<Map<String, dynamic>> _favoriteAds = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchFavorites();
  }

  // Descarga los favoritos de la base de datos
  Future<void> fetchFavorites() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    final user = supabase.auth.currentUser;
    if (user == null) {
      if (mounted)
        setState(() {
          _favoriteAds = [];
          _isLoading = false;
        });
      return;
    }

    try {
      final response = await supabase
          .from('likes')
          .select(
              'anuncio_id, anuncios (*, imagenes (url_imagen), profiles (nombre_negocio, nombre_completo, url_foto_perfil))')
          .eq('user_id', user.id);

      List<Map<String, dynamic>> ads = [];
      for (var item in response) {
        if (item['anuncios'] != null) {
          ads.add(item['anuncios'] as Map<String, dynamic>);
        }
      }

      if (mounted) {
        setState(() {
          _favoriteAds = ads;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error al cargar favoritos: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // 🚀 ELIMINA EL ANUNCIO AL INSTANTE DE LA INTERFAZ
  void removeFavoriteLocally(String id) {
    if (mounted) {
      setState(() {
        _favoriteAds.removeWhere((ad) => ad['id'].toString() == id);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text('Mis Favoritos',
            style:
                TextStyle(fontWeight: FontWeight.bold, color: Colors.black87)),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF00BFAE)))
          : _favoriteAds.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _favoriteAds.length,
                  itemBuilder: (context, index) {
                    final ad = _favoriteAds[index];
                    return SearchResultCard(
                      ad: ad,
                      // 🚀 ESCUCHAMOS LA SEÑAL DE LA TARJETA
                      onFavoriteToggle: (isLiked) {
                        if (!isLiked) {
                          removeFavoriteLocally(ad['id'].toString());
                        }
                      },
                    );
                  },
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.favorite_border, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text('Aún no tienes favoritos',
              style: TextStyle(
                  fontSize: 18,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text('Los anuncios que guardes aparecerán aquí.',
              style: TextStyle(color: Colors.grey[500])),
        ],
      ),
    );
  }
}
