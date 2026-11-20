import 'package:supabase_flutter/supabase_flutter.dart';

/// Garantiza que la sesión sea utilizable antes de escribir en la BD.
///
/// Contexto: si la app restaura datos de una instalación anterior, puede
/// existir una sesión con access token vencido y refresh token muerto.
/// Supabase rechaza ese JWT y PostgREST ejecuta la petición como anon,
/// lo que produce 42501 "permission denied for table anuncios" en las
/// escrituras (las lecturas públicas siguen funcionando y lo disimulan).
class SessionGuard {
  SessionGuard._();

  /// Margen para considerar el token por vencer y renovarlo preventivamente.
  static const int _marginSeconds = 60;

  static bool _isFresh(Session? session) {
    if (session == null) return false;
    final expiresAt = session.expiresAt;
    if (expiresAt == null) return true; // sin dato de expiración: suponer vigente
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    return expiresAt > now + _marginSeconds;
  }

  /// Devuelve true si hay sesión vigente (o se pudo renovar).
  /// Si la sesión está vencida y no se puede renovar, la limpia (signOut),
  /// lo que dispara signedOut → el listener global manda al Login.
  static Future<bool> ensureFresh(SupabaseClient client) async {
    final auth = client.auth;
    final session = auth.currentSession;
    if (session == null) return false;
    if (_isFresh(session)) return true;

    try {
      final refreshed = await auth.refreshSession();
      return _isFresh(refreshed.session);
    } catch (_) {
      // Token vencido y no renovable: sesión muerta. Se limpia para forzar
      // un login nuevo en lugar de seguir enviando un JWT rechazado.
      try {
        await auth.signOut();
      } catch (_) {}
      return false;
    }
  }
}