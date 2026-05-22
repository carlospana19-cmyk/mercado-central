import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/ad_model.dart';

class SupabaseService {
  final _supabase = Supabase.instance.client;

  // Traer anuncios con la lógica de tu Wiki (Orden y Prioridad)
  Stream<List<AdModel>> getHomeAds() {
    return _supabase
        .from('anuncios')
        .stream(primaryKey: ['id'])
        .order('created_at', ascending: false)
        .map((data) => data.map((json) => AdModel.fromJson(json)).toList());
  }

  // Buscar por categoría (Para el Header)
  Future<List<AdModel>> getAdsByCategory(String category) async {
    final response = await _supabase
        .from('anuncios')
        .select()
        .eq('categoria', category)
        .order('created_at', ascending: false);

    return (response as List).map((json) => AdModel.fromJson(json)).toList();
  }
}
