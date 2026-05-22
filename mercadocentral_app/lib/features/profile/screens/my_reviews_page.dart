import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/theme/app_colors.dart';

class MyReviewsPage extends StatefulWidget {
  const MyReviewsPage({super.key});

  @override
  State<MyReviewsPage> createState() => _MyReviewsPageState();
}

class _MyReviewsPageState extends State<MyReviewsPage> {
  final _supabase = Supabase.instance.client;
  late Future<List<Map<String, dynamic>>> _reviewsFuture;

  @override
  void initState() {
    super.initState();
    _reviewsFuture = _fetchMyReviews();
  }

  Future<List<Map<String, dynamic>>> _fetchMyReviews() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) throw Exception("No hay sesión iniciada");

      final response = await _supabase
          .from('reviews')
          .select('*')
          .eq(
            'seller_id',
            user.id,
          ) // Filtramos las reseñas RECIBIDAS por este usuario
          .order('created_at', ascending: false);

      // CHIVATO: Esto imprimirá en tu consola cuántas reseñas encontró
      debugPrint('🔍 Buscando reseñas para el ID: ${user.id}');
      debugPrint('✅ Reseñas encontradas: ${response.length}');

      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      debugPrint("❌ Error cargando reseñas: $e");
      throw e;
    }
  }

  // 🔄 Función para recargar al deslizar hacia abajo
  Future<void> _refresh() async {
    setState(() {
      _reviewsFuture = _fetchMyReviews();
    });
    await _reviewsFuture; // Esperamos a que termine para ocultar la ruedita
  }

  Widget _buildStars(int rating) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        return Icon(
          index < rating ? Icons.star : Icons.star_border,
          color: Colors.amber,
          size: 18,
        );
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          'Mis Reseñas',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      // 🚨 AGREGAMOS REFRESH INDICATOR
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _refresh,
        child: FutureBuilder<List<Map<String, dynamic>>>(
          future: _reviewsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              );
            }

            if (snapshot.hasError) {
              return SingleChildScrollView(
                physics:
                    const AlwaysScrollableScrollPhysics(), // Permite hacer pull-to-refresh incluso si hay error
                child: Container(
                  height: MediaQuery.of(context).size.height - 100,
                  alignment: Alignment.center,
                  child: Text(
                    'Error de conexión: ${snapshot.error}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
              );
            }

            final reviews = snapshot.data ?? [];

            if (reviews.isEmpty) {
              return SingleChildScrollView(
                physics:
                    const AlwaysScrollableScrollPhysics(), // Permite hacer pull-to-refresh incluso si está vacío
                child: Container(
                  height: MediaQuery.of(context).size.height - 100,
                  alignment: Alignment.center,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.star_border_purple500,
                        size: 80,
                        color: Colors.grey[300],
                      ),
                      const SizedBox(height: 15),
                      const Text(
                        'Aún no tienes reseñas',
                        style: TextStyle(color: Colors.grey, fontSize: 16),
                      ),
                      const SizedBox(height: 5),
                      const Text(
                        '¡Desliza hacia abajo para actualizar!',
                        style: TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              );
            }

            return ListView.separated(
              physics:
                  const AlwaysScrollableScrollPhysics(), // Obligatorio para el pull-to-refresh
              padding: const EdgeInsets.all(20),
              itemCount: reviews.length,
              separatorBuilder: (context, index) =>
                  const Divider(height: 30, color: Color(0xFFF0F0F0)),
              itemBuilder: (context, index) {
                final review = reviews[index];
                final int rating = review['rating'] ?? 5;
                final String comment = review['comment'] ?? 'Sin comentario';

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildStars(rating),
                        const Text(
                          'Comprador Verificado',
                          style: TextStyle(
                            color: Colors.green,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      comment,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.black87,
                        height: 1.4,
                      ),
                    ),
                  ],
                );
              },
            );
          },
        ),
      ),
    );
  }
}
