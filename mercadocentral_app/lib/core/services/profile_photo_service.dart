import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../theme/mc_colores.dart';

/// Error de la foto de perfil con mensaje listo para el usuario.
class ProfilePhotoException implements Exception {
  const ProfilePhotoException(this.mensaje);

  final String mensaje;

  @override
  String toString() => mensaje;
}

/// Foto de perfil (paridad con handlePhotoUpload de panel-unificado-logic.js):
/// mismo bucket (imagenes_anuncios), misma ruta {userId}/profile-{timestamp}
/// y mismo destino (profiles.url_foto_perfil). Máx 5 MB, igual que la web.
class ProfilePhotoService {
  ProfilePhotoService._();

  static const int maxBytesFoto = 5 * 1024 * 1024; // 5 MB

  /// Hoja Cámara / Galería: el input file de la web, en el móvil, ofrece
  /// ambas opciones. Devuelve null si el usuario cancela.
  static Future<ImageSource?> seleccionarOrigen(BuildContext context) =>
      showModalBottomSheet<ImageSource>(
        context: context,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
        builder: (context) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading:
                    const Icon(Icons.photo_camera_outlined, color: Mc.naranja),
                title: const Text('Tomar foto'),
                onTap: () => Navigator.pop(context, ImageSource.camera),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined,
                    color: Mc.naranja),
                title: const Text('Elegir de la galería'),
                onTap: () => Navigator.pop(context, ImageSource.gallery),
              ),
            ],
          ),
        ),
      );

  /// Toma/elige la foto, la sube y la registra. Devuelve la URL pública o
  /// null si el usuario canceló. Lanza [ProfilePhotoException] con el
  /// mensaje para el usuario cuando falla.
  static Future<String?> cambiarFoto(
    SupabaseClient client, {
    required ImageSource source,
  }) async {
    final user = client.auth.currentUser;
    if (user == null) {
      throw const ProfilePhotoException('Inicia sesión para cambiar tu foto.');
    }

    final image = await ImagePicker().pickImage(
      source: source,
      imageQuality: 80,
    );
    if (image == null) return null;

    final bytes = await image.readAsBytes();
    if (bytes.length > maxBytesFoto) {
      throw const ProfilePhotoException(
          'La imagen no debe pesar más de 5 MB.');
    }

    // Extensión saneada: pickImage (calidad 80) entrega JPEG.
    final original = image.name.contains('.')
        ? image.name.split('.').last.toLowerCase()
        : 'jpg';
    final ext =
        RegExp(r'^[a-z0-9]{1,5}$').hasMatch(original) ? original : 'jpg';

    try {
      // Misma ruta que la web: {userId}/profile-{timestamp}.{ext}.
      final path =
          '${user.id}/profile-${DateTime.now().millisecondsSinceEpoch}.$ext';
      final storage = client.storage.from('imagenes_anuncios');
      await storage.uploadBinary(
        path,
        bytes,
        fileOptions: const FileOptions(contentType: 'image/jpeg'),
      );
      final publicUrl = storage.getPublicUrl(path);
      await client.from('profiles').upsert({
        'id': user.id,
        'url_foto_perfil': publicUrl,
      });
      return publicUrl;
    } catch (_) {
      throw const ProfilePhotoException(
          'No se pudo actualizar la foto. Intenta de nuevo.');
    }
  }
}
