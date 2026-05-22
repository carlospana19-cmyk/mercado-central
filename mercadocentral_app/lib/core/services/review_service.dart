import 'package:supabase_flutter/supabase_flutter.dart';

class ReviewService {
  final _supabase = Supabase.instance.client;

  // Traer estadísticas (Promedio y Total) - Basado en tu reviews-logic.js
  Future<Map<String, dynamic>> getSellerStats(String sellerId) async {
    try {
      final response = await _supabase
          .from('seller_reviews')
          .select('rating')
          .eq('seller_id', sellerId);

      if (response == null || (response as List).isEmpty) {
        return {'average': 0.0, 'total': 0};
      }

      final ratings = (response as List);
      double sum = ratings.fold(
        0,
        (prev, element) => prev + (element['rating'] as num),
      );

      return {'average': sum / ratings.length, 'total': ratings.length};
    } catch (e) {
      return {'average': 0.0, 'total': 0};
    }
  }

  // Traer la lista de reseñas
  Future<List<Map<String, dynamic>>> getReviews(String sellerId) async {
    final response = await _supabase
        .from('seller_reviews')
        .select('*, profiles:buyer_id(full_name, avatar_url)')
        .eq('seller_id', sellerId)
        .order('created_at', ascending: false);

    return List<Map<String, dynamic>>.from(response);
  }
}
