import 'package:supabase_flutter/supabase_flutter.dart';

/// Error de cuenta con mensaje listo para el usuario.
class AccountException implements Exception {
  const AccountException(this.mensaje);

  final String mensaje;

  @override
  String toString() => mensaje;
}

/// Eliminación de la cuenta (requisito de Google Play / App Store).
///
/// 1) Lista los archivos del usuario en Storage (bucket imagenes_anuncios,
///    carpeta {userId}/).
/// 2) Llama al RPC `mc_eliminar_mi_cuenta` (migración 0007): borra mensajes,
///    conversaciones, likes, reseñas, anuncios, perfil y el usuario de auth.
/// 3) Borra los archivos de Storage (mejor esfuerzo: si falla, la cuenta ya
///    está eliminada) y cierra la sesión local.
class AccountService {
  AccountService._();

  static const String _bucket = 'imagenes_anuncios';

  static Future<void> eliminarMiCuenta(SupabaseClient client) async {
    final user = client.auth.currentUser;
    if (user == null) {
      throw const AccountException('Inicia sesión para eliminar tu cuenta.');
    }

    // Se lista ANTES: tras borrar el usuario ya no hay sesión válida.
    List<String> archivos = const [];
    try {
      archivos = await _listarArchivos(client, user.id);
    } catch (_) {
      archivos = const [];
    }

    try {
      await client.rpc('mc_eliminar_mi_cuenta');
    } on PostgrestException catch (error) {
      final noExiste = error.code == 'PGRST202' || error.code == '42883';
      throw AccountException(
        noExiste
            ? 'La eliminación de cuenta aún no está disponible. '
                'Escríbenos a soporte.'
            : 'No se pudo eliminar tu cuenta. Intenta de nuevo.',
      );
    } catch (_) {
      throw const AccountException(
        'No se pudo eliminar tu cuenta. Revisa tu conexión e intenta de nuevo.',
      );
    }

    try {
      final storage = client.storage.from(_bucket);
      for (var i = 0; i < archivos.length; i += 100) {
        final fin = i + 100 > archivos.length ? archivos.length : i + 100;
        await storage.remove(archivos.sublist(i, fin));
      }
    } catch (_) {
      // Archivos huérfanos: no bloquea la eliminación de la cuenta.
    }

    try {
      await client.auth.signOut(scope: SignOutScope.local);
    } catch (_) {
      // El usuario ya no existe en el servidor; la sesión local se descarta.
    }
  }

  /// Rutas de todos los archivos bajo {userId}/ (hasta 2 niveles de carpetas).
  static Future<List<String>> _listarArchivos(
    SupabaseClient client,
    String userId,
  ) async {
    final storage = client.storage.from(_bucket);
    final rutas = <String>[];

    Future<void> recorrer(String carpeta, int nivel) async {
      final items = await storage.list(
        path: carpeta,
        searchOptions: const SearchOptions(limit: 1000),
      );
      for (final item in items) {
        final ruta = '$carpeta/${item.name}';
        // Las carpetas vienen sin id; los archivos, con id.
        if (item.id == null) {
          if (nivel < 2) await recorrer(ruta, nivel + 1);
        } else {
          rutas.add(ruta);
        }
      }
    }

    await recorrer(userId, 0);
    return rutas;
  }
}
