import 'package:supabase_flutter/supabase_flutter.dart';

class ReviewService {
  final _supabase = Supabase.instance.client;

  // Traer estadísticas (Promedio y Total) - Basado en tu reviews-logic.js
  Future<Map<String, dynamic>> getSellerStats(String sellerId) async {
    try {
      final response = await _supabase
          .from('reviews')
          .select('rating')
          .eq('seller_id', sellerId);

      if ((response as List).isEmpty) {
        return {'average': 0.0, 'total': 0};
      }

      final ratings = response;
      final sum = ratings.fold<num>(
        0,
        (prev, element) => prev + ((element['rating'] as num?) ?? 0),
      );

      return {'average': sum / ratings.length, 'total': ratings.length};
    } catch (e) {
      return {'average': 0.0, 'total': 0};
    }
  }

  // Traer la lista de reseñas
  Future<List<Map<String, dynamic>>> getReviews(String sellerId) async {
    final response = await _supabase
        .from('reviews')
        .select(
          'id, seller_id, reviewer_id, rating, comment, created_at, '
          'reviewer:reviewer_id(id, nombre_negocio, url_foto_perfil)',
        )
        .eq('seller_id', sellerId)
        .order('created_at', ascending: false);

    return List<Map<String, dynamic>>.from(response);
  }

  Future<bool> hasUserReviewedSeller(String sellerId) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return false;

    final row = await _supabase
        .from('reviews')
        .select('id')
        .eq('seller_id', sellerId)
        .eq('reviewer_id', userId)
        .maybeSingle();
    return row != null;
  }

  Future<void> createReview({
    required String sellerId,
    required int rating,
    String? comment,
  }) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) {
      throw StateError('Inicia sesión para dejar una reseña.');
    }

    await _supabase.from('reviews').insert({
      'seller_id': sellerId,
      'reviewer_id': userId,
      'rating': rating,
      'comment': comment?.trim().isEmpty == true ? null : comment?.trim(),
    });
  }
}
