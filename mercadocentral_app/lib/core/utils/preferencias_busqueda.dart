import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Persistencia local del buscador (FASE 1 · BLOQUE A):
/// - Búsquedas recientes: máximo 5, sin duplicados, la más reciente primero.
/// - Último filtro usado: mapa JSON genérico que el BLOQUE C (filtros de
///   búsqueda) leerá al abrir la pantalla de resultados para restaurar el
///   último estado filtrado del usuario.
///
/// Claves propias (prefijo `busqueda_`) para no chocar con las claves de
/// sesión que Supabase escribe en SharedPreferences.
class PreferenciasBusqueda {
  PreferenciasBusqueda._();

  static const String _claveRecientes = 'busquedas_recientes';
  static const String _claveUltimoFiltro = 'busqueda_ultimo_filtro';
  static const int _maxRecientes = 5;

  /// Búsquedas recientes (máx 5), la más reciente primero.
  static Future<List<String>> busquedasRecientes() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getStringList(_claveRecientes) ?? const <String>[];
    } catch (_) {
      return const <String>[];
    }
  }

  /// Inserta [texto] arriba de la lista, sin duplicados (case-insensitive)
  /// y recortada a 5 elementos. Ignora textos vacíos.
  static Future<void> guardarBusquedaReciente(String texto) async {
    final q = texto.trim();
    if (q.isEmpty) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final actuales = (prefs.getStringList(_claveRecientes) ?? <String>[])
        ..removeWhere((b) => b.toLowerCase() == q.toLowerCase());
      actuales.insert(0, q);
      while (actuales.length > _maxRecientes) {
        actuales.removeLast();
      }
      await prefs.setStringList(_claveRecientes, actuales);
    } catch (_) {
      // Persistencia best-effort: si falla, el buscador sigue funcionando.
    }
  }

  static Future<void> borrarBusquedasRecientes() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_claveRecientes);
    } catch (_) {}
  }

  /// Último filtro usado (mapa vacío si nunca se guardó o falló la lectura).
  static Future<Map<String, dynamic>> ultimoFiltro() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_claveUltimoFiltro);
      if (raw == null || raw.isEmpty) return <String, dynamic>{};
      final decoded = jsonDecode(raw);
      if (decoded is Map) return Map<String, dynamic>.from(decoded);
      return <String, dynamic>{};
    } catch (_) {
      return <String, dynamic>{};
    }
  }

  /// Guarda el último filtro usado (sobrescribe el anterior).
  static Future<void> guardarUltimoFiltro(Map<String, dynamic> filtro) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_claveUltimoFiltro, jsonEncode(filtro));
    } catch (_) {
      // Persistencia best-effort.
    }
  }
}
