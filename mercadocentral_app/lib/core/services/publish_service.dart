import 'dart:io';
import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:image_picker/image_picker.dart';
import '../../features/categorias/esquema_categorias.dart';
import '../../features/planes/plan_limits.dart';
import '../utils/session_guard.dart';

class PublishService {
  final SupabaseClient _supabase = Supabase.instance.client;

  /// Publica el anuncio. Devuelve `null` si tuvo éxito, o un String con la
  /// CAUSA del fallo (session, Storage, PostgREST/RLS, etc.) para mostrarla
  /// tal cual en la UI — nunca un genérico "Error al publicar".
  Future<String?> publishAd({
    required Map<String, dynamic> adData,
    required List<XFile> images,
    required String selectedPlan,
    Map<String, dynamic>? token,
  }) async {
    try {
      // 0. Sesión vigente: renueva el token si está por vencer; si la sesión
      //    está muerta (típico tras restaurar datos de otra instalación) la
      //    limpia y corta aquí, porque el insert saldría como anon y la BD
      //    responde 42501 "permission denied for table anuncios".
      final sessionOk = await SessionGuard.ensureFresh(_supabase);
      if (!sessionOk) {
        debugPrint('Sesión ausente o no renovable: no se puede publicar.');
        return 'Tu sesión expiró. Inicia sesión de nuevo e inténtalo otra vez.';
      }

      // 1. Verificar usuario activo
      final userId = _supabase.auth.currentUser?.id;
      if (userId == null) {
        debugPrint('Error: No hay usuario autenticado');
        return 'No hay usuario autenticado. Inicia sesión e inténtalo otra vez.';
      }
      if (['basico', 'premium', 'destacado'].contains(selectedPlan) &&
          token?['id'] == null) {
        debugPrint('Error: No hay token validado para el plan de pago');
        return 'Falta un token válido para el plan seleccionado.';
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

        try {
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
        } catch (e) {
          debugPrint('🚨 Error subiendo imagen ${i + 1} a Storage: $e');
          return 'Error subiendo la imagen ${i + 1}: ${_describe(e)}';
        }

        // Obtener la URL pública de la imagen recién subida
        final publicUrl =
            _supabase.storage.from('imagenes_anuncios').getPublicUrl(filePath);
        imageUrls.add(publicUrl);
      }

      // 3. Asignar el peso numérico del plan (para que queden arriba en el Home).
      //    Prioridad SIEMPRE desde PlanLimits (espejo de la web). Nada hardcodeado.
      final planPriority = PlanLimits.priorityFor(selectedPlan) + 1;

      // 4. Preparar el paquete de datos EXACTO como lo usa tu web.
      // Claves numéricas derivadas del esquema de categorías
      // (FASE 1 · BLOQUE D): cualquier campo number de la web se guarda
      // como número real en atributos_clave.
      final numericAttrs = EsquemaCategorias.clavesNumericas;
      final attrs = <String, dynamic>{};
      (adData['atributos_clave'] as Map? ?? {}).forEach((key, value) {
        final text = value.toString();
        attrs[key.toString()] = numericAttrs.contains(key)
            ? (double.tryParse(text.replaceAll(',', '')) ?? 0)
            : text;
      });

      final isPaid = ['basico', 'premium', 'destacado'].contains(selectedPlan);
      final now = DateTime.now().toUtc();
      final tokenDays = int.tryParse(token?['duracion_dias']?.toString() ?? '');
      final planDays = tokenDays != null && tokenDays > 0 ? tokenDays : 30;
      // Vigencia SIEMPRE desde PlanLimits (espejo de form-logic.js de la web:
      // pagos 60 días, free 30 días). Nada hardcodeado.
      final expirationDays = PlanLimits.vigenciaDiasFor(selectedPlan);
      final phone = (adData['contact_phone'] ?? '').toString().trim();

      final insertData = {
        'titulo': adData['titulo'].toString().trim(),
        'precio': double.tryParse(adData['precio'].toString()) ?? 0.0,
        'descripcion': adData['descripcion'].toString().trim(),
        'categoria': adData['categoria'],
        'subcategoria': adData['subcategoria'] ?? '',
        'provincia': adData['provincia'],
        'distrito': adData['distrito'],
        if (adData['latitud'] != null && adData['longitud'] != null) ...{
          'latitud': adData['latitud'],
          'longitud': adData['longitud'],
        },
        if ((adData['direccion_exacta'] ?? '').toString().trim().isNotEmpty)
          'direccion_exacta': adData['direccion_exacta'].toString().trim(),
        // 🚨 OJO AQUÍ: Tu web guarda los atributos dinámicos como un String JSON
        'atributos_clave': jsonEncode(attrs),
        'selected_plan': selectedPlan,
        'featured_plan': selectedPlan,
        'plan_priority': planPriority,
        'activo': true, // Publicación inmediata
        'is_sold': false,
        'user_id': userId,
        if (phone.isNotEmpty) 'contact_phone': phone,
        'fecha_publicacion': now.toIso8601String(),
        'fecha_eliminacion':
            now.add(Duration(days: expirationDays)).toIso8601String(),
        // La primera foto es la portada, el resto va a la galería
        'url_portada': imageUrls.isNotEmpty ? imageUrls.first : null,
        'url_galeria': imageUrls.length > 1 ? imageUrls.sublist(1) : [],
        // Video: solo llega aquí si el plan lo permite (el campo se oculta
        // en el formulario según PlanLimits.hasVideoFor). La columna real de
        // la BD es url_video (espejo de form-logic.js de la web, que solo la
        // envía cuando el usuario escribió una URL).
        if ((adData['url_video'] ?? '').toString().trim().isNotEmpty)
          'url_video': adData['url_video'].toString().trim(),
      };

      // 5. Registrar la vigencia del plan pago, como lo hace la web.
      dynamic courtesyId;
      if (isPaid && token?['id'] != null) {
        final courtesy = await _supabase
            .from('cortesias_aplicadas')
            .insert({
              'user_id': userId,
              'plan_tipo': selectedPlan,
              'metodo': 'token',
              'activo': true,
              'fecha_fin': now.add(Duration(days: planDays)).toIso8601String(),
            })
            .select('id')
            .single();
        courtesyId = courtesy['id'];
      }

      // 6. Inserción en la base de datos
      try {
        await _supabase.from('anuncios').insert(insertData);
      } catch (_) {
        if (courtesyId != null) {
          try {
            await _supabase
                .from('cortesias_aplicadas')
                .delete()
                .eq('id', courtesyId);
          } catch (cleanupError) {
            debugPrint('No se pudo revertir la cortesía: $cleanupError');
          }
        }
        rethrow;
      }

      // 7. El token se confirma solo después de guardar el anuncio
      if (token?['id'] != null) {
        try {
          await _supabase
              .rpc('marcar_token_usado', params: {'p_token_id': token!['id']});
        } catch (e) {
          debugPrint('No se pudo marcar el token como usado: $e');
        }
      }

      return null; // ¡Misión Cumplida!
    } catch (e) {
      debugPrint('🚨 Error crítico en PublishService: $e');
      return _describe(e);
    }
  }

  /// Traduce excepciones de Supabase a mensajes legibles: la UI muestra esto
  /// tal cual, así un fallo de RLS / columna faltante / bucket se ve de raíz.
  static String _describe(Object e) {
    if (e is PostgrestException) {
      final code = (e.code == null || e.code!.isEmpty) ? 'sin código' : e.code!;
      final msg = e.message.isNotEmpty ? e.message : e.toString();
      return 'Base de datos ($code): $msg';
    }
    if (e is StorageException) {
      final msg = e.message.isNotEmpty ? e.message : e.toString();
      final status =
          (e.statusCode == null || e.statusCode!.isEmpty) ? '' : ' (HTTP ${e.statusCode})';
      return 'Storage$status: $msg';
    }
    return e.toString();
  }
}
