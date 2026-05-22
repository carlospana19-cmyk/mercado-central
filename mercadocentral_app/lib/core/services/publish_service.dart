import 'dart:io';
import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:image_picker/image_picker.dart';

class PublishService {
  final SupabaseClient _supabase = Supabase.instance.client;

  Future<bool> publishAd({
    required Map<String, dynamic> adData,
    required List<XFile> images,
    required String selectedPlan,
  }) async {
    try {
      // 1. Verificar usuario activo
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) {
        debugPrint('Error: No hay usuario autenticado');
        return false;
      }

      // 2. Subir imágenes al Storage de Supabase
      List<String> imageUrls = [];
      for (var i = 0; i < images.length; i++) {
        final image = images[i];
        final fileExt = image.path.split('.').last.toLowerCase();
        // Generar un nombre único para evitar que se sobreescriban
        final fileName = '${DateTime.now().millisecondsSinceEpoch}_$i.$fileExt';
        final filePath = '$userId/$fileName'; // Guardamos en una carpeta con el ID del usuario

        if (kIsWeb) {
          // Lógica de subida para Web
          await _supabase.storage.from('imagenes_anuncios').uploadBinary(
                filePath,
                await image.readAsBytes(),
              );
        } else {
          // Lógica de subida para Celulares (Android/iOS)
          await _supabase.storage.from('imagenes_anuncios').upload(
                filePath,
                File(image.path),
              );
        }

        // Obtener la URL pública de la imagen recién subida
        final publicUrl = _supabase.storage.from('imagenes_anuncios').getPublicUrl(filePath);
        imageUrls.add(publicUrl);
      }

      // 3. Asignar el peso numérico del plan (para que queden arriba en el Home)
      int planPriority = 1; // Free
      if (selectedPlan == 'basico') planPriority = 2;
      if (selectedPlan == 'premium') planPriority = 3;
      if (selectedPlan == 'destacado' || selectedPlan == 'top') planPriority = 4;

      // 4. Preparar el paquete de datos EXACTO como lo usa tu web
      final insertData = {
        'titulo': adData['titulo'],
        'precio': double.tryParse(adData['precio'].toString()) ?? 0.0,
        'descripcion': adData['descripcion'],
        'categoria': adData['categoria'],
        'subcategoria': adData['subcategoria'],
        'provincia': adData['provincia'],
        'distrito': adData['distrito'],
        // 🚨 OJO AQUÍ: Tu web guarda los atributos dinámicos como un String JSON
        'atributos_clave': jsonEncode(adData['atributos_clave'] ?? {}),
        'selected_plan': selectedPlan,
        'plan_priority': planPriority,
        'activo': true, // Publicación inmediata
        'is_sold': false,
        'user_id': userId,
        // La primera foto es la portada, el resto va a la galería
        'url_portada': imageUrls.isNotEmpty ? imageUrls.first : null,
        'url_galeria': imageUrls.length > 1 ? imageUrls.sublist(1) : [],
      };

      // 5. Inserción en la base de datos
      await _supabase.from('anuncios').insert(insertData);
      
      return true; // ¡Misión Cumplida!
    } catch (e) {
      debugPrint('🚨 Error crítico en PublishService: $e');
      return false;
    }
  }
}