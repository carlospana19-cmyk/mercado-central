import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../../features/search/models/category_catalog.dart';
import '../config/app_config.dart';

/// Excepción con mensaje listo para mostrar al usuario (equivalente a los
/// toasts de busqueda-visual.js en la web).
class BusquedaVisualException implements Exception {
  const BusquedaVisualException(this.mensaje);

  final String mensaje;
}

/// Resultado de la IA: texto de búsqueda (≤80) y categoría ya casada con
/// el catálogo maestro ('all' si la IA no devolvió una válida).
class ResultadoVisual {
  const ResultadoVisual({required this.textoBusqueda, required this.categoria});

  final String textoBusqueda;
  final String categoria;
}

/// Búsqueda visual IA (paridad con busqueda-visual.js de la web):
///
/// - La foto se comprime ANTES en el lado del cliente (máx 1024 px, JPEG 0.8,
///   máx 5 MB) y viaja como data URL.
/// - Se llama a la Edge Function EN PRODUCCIÓN `busqueda-visual` (la MISMA
///   que usa la web): NO se crean endpoints nuevos.
/// - Límite diario de 15 usos por dispositivo con SharedPreferences usando
///   las mismas claves de la web (mc_bv_dia / mc_bv_n).
class BusquedaVisualService {
  BusquedaVisualService._();

  /// Freno anti-abuso de la web: 15 búsquedas/día (bloquea en el uso 16).
  static const int limiteDiario = 15;

  /// Máximo peso de la foto comprimida.
  static const int maxBytesFoto = 5 * 1024 * 1024; // 5 MB

  /// Timeout de la llamada a la Edge Function (spinner durante el proceso).
  static const Duration tiempoEspera = Duration(seconds: 20);

  // Claves IDÉNTICAS a localStorage de la web (busqueda-visual.js).
  static const String _claveDia = 'mc_bv_dia';
  static const String _claveConteo = 'mc_bv_n';

  /// Fecha en UTC con formato YYYY-MM-DD, igual que
  /// new Date().toISOString().slice(0, 10) en la web.
  static String _hoy() =>
      DateTime.now().toUtc().toIso8601String().substring(0, 10);

  /// true cuando el dispositivo agotó sus [limiteDiario] usos del día.
  static Future<bool> limiteAlcanzado() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (prefs.getString(_claveDia) != _hoy()) return false;
      final n = int.tryParse(prefs.getString(_claveConteo) ?? '') ?? 0;
      return n >= limiteDiario;
    } catch (_) {
      return false; // sin persistencia no bloqueamos (igual que la web)
    }
  }

  /// Cuenta un uso. La web lo hace justo después de que la IA respondió
  /// bien; aquí igual (solo búsquedas exitosas consumen cupo).
  static Future<void> contarBusqueda() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final esHoy = prefs.getString(_claveDia) == _hoy();
      final previo =
          esHoy ? (int.tryParse(prefs.getString(_claveConteo) ?? '') ?? 0) : 0;
      await prefs.setString(_claveDia, _hoy());
      await prefs.setString(_claveConteo, '${previo + 1}');
    } catch (_) {
      // Persistencia best-effort.
    }
  }

  /// Los 10 nombres EXACTOS del catálogo maestro (category_catalog.dart),
  /// el equivalente a leer las opciones del <select> de categorías que la
  /// web le pasa a la IA para que elija una que exista.
  static List<String> get nombresCategorias =>
      [for (final c in fullCategoryCatalog) c.name];

  /// Casar el nombre devuelto por la IA con el catálogo (sin acentos ni
  /// mayúsculas, como normalizar() de la web). Devuelve el nombre EXACTO
  /// del catálogo o 'all' si no hay coincidencia (sin filtro de categoría).
  static String categoriaDelCatalogo(String? devuelta) {
    if (devuelta == null) return 'all';
    final objetivo = _normalizar(devuelta);
    for (final c in fullCategoryCatalog) {
      if (_normalizar(c.name) == objetivo) return c.name;
    }
    return 'all';
  }

  /// POST a la Edge Function `busqueda-visual` con el data URL de la foto
  /// y las categorías del catálogo. Lanza [BusquedaVisualException] con el
  /// mensaje del usuario cuando falla (red, 429/quota, timeout o servidor).
  static Future<ResultadoVisual> analizarFoto(String dataUrl) async {
    try {
      final response = await http
          .post(
            Uri.parse('${AppConfig.supabaseUrl}/functions/v1/busqueda-visual'),
            headers: {
              'Content-Type': 'application/json',
              'apikey': AppConfig.supabaseAnonKey,
              'Authorization': 'Bearer ${AppConfig.supabaseAnonKey}',
            },
            body: jsonEncode({
              'imagen': dataUrl,
              'categorias': nombresCategorias,
            }),
          )
          .timeout(tiempoEspera);

      Map<String, dynamic>? data;
      try {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic>) data = decoded;
      } catch (_) {
        data = null; // cuerpo no JSON → mensaje genérico abajo
      }

      if (response.statusCode != 200 || data == null || data['ok'] != true) {
        throw BusquedaVisualException(
            _mensajeDeError(response.statusCode, data));
      }

      final texto = (data['texto_busqueda'] ?? '').toString().trim();
      if (texto.isEmpty) {
        throw const BusquedaVisualException(
            'No se pudo analizar la foto. Intenta con otra.');
      }
      return ResultadoVisual(
        textoBusqueda: texto,
        categoria: categoriaDelCatalogo(data['categoria']?.toString()),
      );
    } on TimeoutException {
      throw const BusquedaVisualException(
          'La foto tardó demasiado en analizarse. Revisa tu conexión e intenta de nuevo.');
    } on SocketException {
      throw const BusquedaVisualException(
          'Sin conexión a internet. Revisa tu red e intenta de nuevo.');
    } on BusquedaVisualException {
      rethrow;
    } catch (_) {
      throw const BusquedaVisualException(
          'No se pudo analizar la foto. Intenta con otra.');
    }
  }

  /// Mapeo de errores igual que la web: 429 o cuota de la IA → servicio
  /// recargándose; el resto usa el error del servidor o uno genérico.
  static String _mensajeDeError(int statusCode, Map<String, dynamic>? data) {
    final error = (data?['error'] ?? '').toString();
    final texto = error.toLowerCase();
    if (statusCode == 429 ||
        texto.contains('quota') ||
        texto.contains('rate limit')) {
      return 'El servicio de IA se está recargando. Intenta en unos minutos.';
    }
    if (error.isNotEmpty) return error;
    return 'No se pudo analizar la foto. Intenta con otra.';
  }

  /// normalizar() de la web: minúsculas + quitar acentos (NFD).
  static String _normalizar(String txt) {
    const conAcentos = {
      'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a',
      'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
      'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
      'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o',
      'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
      'ñ': 'n', 'ç': 'c',
    };
    var out = txt.trim().toLowerCase();
    conAcentos.forEach((de, a) => out = out.replaceAll(de, a));
    return out;
  }
}
