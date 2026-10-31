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
    Map<String, dynamic>? token,
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
        final filePath =
            '$userId/$fileName'; // Guardamos en una carpeta con el ID del usuario

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
        final publicUrl =
            _supabase.storage.from('imagenes_anuncios').getPublicUrl(filePath);
        imageUrls.add(publicUrl);
      }

      // 3. Asignar el peso numérico del plan (para que queden arriba en el Home)
      int planPriority = 1; // Free
      if (selectedPlan == 'basico') planPriority = 2;
      if (selectedPlan == 'premium') planPriority = 3;
      if (selectedPlan == 'destacado' || selectedPlan == 'top')
        planPriority = 4;

      // 4. Preparar el paquete de datos EXACTO como lo usa tu web
      const numericAttrs = {
        'kilometraje',
        'm2',
        'anio',
        'habitaciones',
        'banos'
      };
      final attrs = <String, dynamic>{};
      (adData['atributos_clave'] as Map? ?? {}).forEach((key, value) {
        final text = value.toString();
        attrs[key.toString()] = numericAttrs.contains(key)
            ? (double.tryParse(text.replaceAll(',', '')) ?? 0)
            : text;
      });

      // Planes de pago duran 60 días (o lo que indique el token); el gratis, 30
      final isPaid = ['basico', 'premium', 'destacado'].contains(selectedPlan);
      final days =
          (token?['duracion_dias'] as num?)?.toInt() ?? (isPaid ? 60 : 30);
      final phone = (adData['contact_phone'] ?? '').toString().trim();

      final insertData = {
        'titulo': adData['titulo'].toString().trim(),
        'precio': double.tryParse(adData['precio'].toString()) ?? 0.0,
        'descripcion': adData['descripcion'].toString().trim(),
        'categoria': adData['categoria'],
        'subcategoria': adData['subcategoria'] ?? '',
        'provincia': adData['provincia'],
        'distrito': adData['distrito'],
        // 🚨 OJO AQUÍ: Tu web guarda los atributos dinámicos como un String JSON
        'atributos_clave': jsonEncode(attrs),
        'selected_plan': selectedPlan,
        'featured_plan': selectedPlan,
        'plan_priority': planPriority,
        'activo': true, // Publicación inmediata
        'is_sold': false,
        'user_id': userId,
        if (phone.isNotEmpty) 'contact_phone': phone,
        'fecha_publicacion': DateTime.now().toUtc().toIso8601String(),
        'fecha_eliminacion':
            DateTime.now().toUtc().add(Duration(days: days)).toIso8601String(),
        // La primera foto es la portada, el resto va a la galería
        'url_portada': imageUrls.isNotEmpty ? imageUrls.first : null,
        'url_galeria': imageUrls.length > 1 ? imageUrls.sublist(1) : [],
      };

      // 5. Inserción en la base de datos
      await _supabase.from('anuncios').insert(insertData);

      // 6. El token se confirma solo después de guardar el anuncio
      if (token?['id'] != null) {
        try {
          await _supabase
              .rpc('marcar_token_usado', params: {'p_token_id': token!['id']});
        } catch (e) {
          debugPrint('No se pudo marcar el token como usado: $e');
        }
      }

      return true; // ¡Misión Cumplida!
    } catch (e) {
      debugPrint('🚨 Error crítico en PublishService: $e');
      return false;
    }
  }
}
