import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/ad_model.dart';

class SearchService {
  final _supabase = Supabase.instance.client;

  Future<List<Map<String, dynamic>>> searchAds(String query) async {
    if (query.isEmpty) return [];

    // Buscamos coincidencias en título o descripción (ilike = insensibilidad a mayúsculas)
    final response = await _supabase
        .from('anuncios')
        .select()
        .or('titulo.ilike.%$query%,descripcion.ilike.%$query%')
        .order('created_at', ascending: false)
        .limit(20);

    return List<Map<String, dynamic>>.from(response);
  }
}
