import 'package:supabase_flutter/supabase_flutter.dart';

import '../utils/preferencias_busqueda.dart';

/// Filtros del buscador (FASE 1 · BLOQUE C). Cada criterio y su orden vienen
/// de loadAndFilterResults() en results-logic.js de la web.
class FiltrosBusqueda {
  const FiltrosBusqueda({
    this.texto = '',
    this.categoria = 'all',
    this.provincia = '',
    this.distrito = '',
    this.precioMin,
    this.precioMax,
    this.condicion = '',
    this.orden = 'recent',
  });

  /// Texto libre: se busca en titulo, descripcion, categoria, provincia y
  /// distrito con ilike (mismo OR de la web).
  final String texto;

  /// Categoría principal: 'all' o el nombre EXACTO de la columna categoria.
  final String categoria;

  /// Ubicación: provincia y corregimiento/distrito. La web filtra con
  /// ilike('ubicacion', %location%) sobre una columna legacy/fallback;
  /// ambos lados (form-logic.js y publish_service.dart) escriben las columnas
  /// reales `provincia` y `distrito`, así que el app filtra con eq sobre esas
  /// (mismo criterio de ubicación, datos idénticos).
  final String provincia;
  final String distrito;

  /// Rango de precio (gte/lte sobre 'precio').
  final num? precioMin;
  final num? precioMax;

  /// Condición: '' | 'Nuevo' | 'Usado'. La web muestra attr.condicion en las
  /// tarjetas (no filtra por él), así que este filtro usa la MISMA columna
  /// de datos (atributos_clave JSON) sin alterar el resto de la consulta:
  /// sin condición activa la consulta queda idéntica a la web.
  final String condicion;

  /// Orden: 'recent' (jerarquía de planes + fecha), 'price-asc', 'price-desc'
  /// (dropdown sort-select de resultados.html).
  final String orden;

  bool get sinFiltros =>
      texto.trim().isEmpty &&
      categoria == 'all' &&
      provincia.isEmpty &&
      distrito.isEmpty &&
      precioMin == null &&
      precioMax == null &&
      condicion.isEmpty;

  static const _sinCambio = Object();

  FiltrosBusqueda copyWith({
    String? texto,
    String? categoria,
    String? provincia,
    String? distrito,
    Object? precioMin = _sinCambio,
    Object? precioMax = _sinCambio,
    String? condicion,
    String? orden,
  }) =>
      FiltrosBusqueda(
        texto: texto ?? this.texto,
        categoria: categoria ?? this.categoria,
        provincia: provincia ?? this.provincia,
        distrito: distrito ?? this.distrito,
        precioMin: precioMin == _sinCambio ? this.precioMin : precioMin as num?,
        precioMax: precioMax == _sinCambio ? this.precioMax : precioMax as num?,
        condicion: condicion ?? this.condicion,
        orden: orden ?? this.orden,
      );

  Map<String, dynamic> toJson() => {
        'texto': texto,
        'categoria': categoria,
        'provincia': provincia,
        'distrito': distrito,
        'precioMin': precioMin,
        'precioMax': precioMax,
        'condicion': condicion,
        'orden': orden,
      };

  static FiltrosBusqueda fromJson(Map<String, dynamic> json) =>
      FiltrosBusqueda(
        texto: json['texto']?.toString() ?? '',
        categoria: json['categoria']?.toString() ?? 'all',
        // Compatibilidad con el filtro previo de un solo texto de ubicación.
        provincia: json['provincia']?.toString() ??
            json['ubicacion']?.toString() ??
            '',
        distrito: json['distrito']?.toString() ?? '',
        precioMin: json['precioMin'] == null
            ? null
            : num.tryParse(json['precioMin'].toString()),
        precioMax: json['precioMax'] == null
            ? null
            : num.tryParse(json['precioMax'].toString()),
        condicion: json['condicion']?.toString() ?? '',
        orden: json['orden']?.toString() ?? 'recent',
      );

  /// Guarda como "último filtro usado" (shared_preferences, BLOQUE A).
  Future<void> guardarComoUltimo() =>
      PreferenciasBusqueda.guardarUltimoFiltro(toJson());

  /// Lee el último filtro usado; si no hay, devuelve filtros vacíos.
  static Future<FiltrosBusqueda> ultimoGuardado() async {
    final json = await PreferenciasBusqueda.ultimoFiltro();
    if (json.isEmpty) return const FiltrosBusqueda();
    return FiltrosBusqueda.fromJson(json);
  }
}

/// Búsqueda de anuncios con las MISMAS consultas que la web
/// (loadAndFilterResults en results-logic.js):
///  - select '*, imagenes(url_imagen), profiles(nombre_negocio,
///    nombre_completo, url_foto_perfil)'
///  - order('fecha_publicacion', asc: false) en la base
///  - texto: .or(titulo/descripcion/categoria/provincia/distrito .ilike %q%)
///  - ubicación: eq('provincia') y eq('distrito') — columnas reales que
///    escriben ambos lados (la web lee la legacy 'ubicacion' como fallback)
///  - categoria: .eq('categoria', cat)
///  - precio: .gte('precio', min) y .lte('precio', max)
///  - límite 200 (mismo tope de la web para ordenar en cliente)
///  - orden cliente: jerarquía de planes (top/destacado/oro > premium/plus/
///    plata > basico/básico/bronce > free) con desempate por fecha, y
///    price-asc/price-desc del dropdown orden por encima de todo.
class BuscadorService {
  BuscadorService._();

  /// RESULTS_PER_PAGE en results-logic.js de la web: 12 por página.
  static const int resultadosPorPagina = 12;

  /// Tope de la consulta de la web: limit(200) para ordenar en cliente.
  static const int limiteConsulta = 200;

  static Future<List<Map<String, dynamic>>> buscar(FiltrosBusqueda f) async {
    // Filtros PRIMERO (PostgrestFilterBuilder), luego order + limit
    // (transformaciones) — mismo orden lógico que results-logic.js.
    var query = Supabase.instance.client
        .from('anuncios')
        .select(
            '*, imagenes(url_imagen), profiles(nombre_negocio, nombre_completo, url_foto_perfil)');

    final texto = f.texto.trim().toLowerCase();
    if (texto.isNotEmpty) {
      query = query.or(
        'titulo.ilike.%$texto%,descripcion.ilike.%$texto%,'
        'categoria.ilike.%$texto%,provincia.ilike.%$texto%,'
        'distrito.ilike.%$texto%',
      );
    }

    // Ubicación: columnas reales provincia/distrito (la web usa ilike sobre
    // la columna legacy 'ubicacion'; ver FiltrosBusqueda.provincia).
    if (f.provincia.trim().isNotEmpty) {
      query = query.eq('provincia', f.provincia.trim());
    }
    if (f.distrito.trim().isNotEmpty) {
      query = query.eq('distrito', f.distrito.trim());
    }

    if (f.categoria != 'all' && f.categoria.trim().isNotEmpty) {
      query = query.eq('categoria', f.categoria);
    }
    if (f.precioMin != null) query = query.gte('precio', f.precioMin!);
    if (f.precioMax != null) query = query.lte('precio', f.precioMax!);

    // Condición: la web no filtra por ella (solo la muestra), así que este
    // criterio se añade sobre el JSON atributos_clave SIN alterar el resto
    // de la consulta. Con '' la consulta queda idéntica a la de la web.
    if (f.condicion == 'Nuevo') {
      query = query.filter('atributos_clave->>condicion', 'eq', 'Nuevo');
    } else if (f.condicion == 'Usado') {
      // Todas las variantes 'Usado - ...' de publish-logic.js.
      query = query.filter('atributos_clave->>condicion', 'like', 'Usado*');
    }

    final response =
        await query.order('fecha_publicacion', ascending: false).limit(
              limiteConsulta,
            );
    final ads = List<Map<String, dynamic>>.from(response);

    ordenarComoWeb(ads, f.orden);
    return ads;
  }

  /// Orden de la web (results-logic.js): jerarquía antibalas por plan con
  /// desempate por fecha; el dropdown de precio reordena por encima.
  static void ordenarComoWeb(List<Map<String, dynamic>> ads, String orden) {
    ads.sort((a, b) {
      final pesoA = _pesoPlan(a);
      final pesoB = _pesoPlan(b);
      if (pesoA != pesoB) return pesoB - pesoA;

      final fechaA = DateTime.tryParse(
            (a['created_at'] ?? a['fecha_publicacion'] ?? '').toString(),
          ) ??
          DateTime.fromMillisecondsSinceEpoch(0);
      final fechaB = DateTime.tryParse(
            (b['created_at'] ?? b['fecha_publicacion'] ?? '').toString(),
          ) ??
          DateTime.fromMillisecondsSinceEpoch(0);
      return fechaB.compareTo(fechaA);
    });

    if (orden == 'price-asc') {
      ads.sort((a, b) => _precioDe(a).compareTo(_precioDe(b)));
    } else if (orden == 'price-desc') {
      ads.sort((a, b) => _precioDe(b).compareTo(_precioDe(a)));
    }
    // 'recent' conserva el orden jerárquico ya aplicado (igual que la web).
  }

  /// precio numérico con el criterio de la web: (a.precio || 0).
  static double _precioDe(Map<String, dynamic> ad) =>
      double.tryParse('${ad['precio']}') ?? 0;

  /// getPlanWeight de results-logic.js: busca la palabra clave real del plan.
  static int _pesoPlan(Map<String, dynamic> ad) {
    final plan = (ad['featured_plan'] ?? ad['selected_plan'] ?? '')
        .toString()
        .toLowerCase()
        .trim();
    if (plan.isEmpty) return 1;
    // 4 puntos (ORO)
    if (plan.contains('top') ||
        plan.contains('destacado') ||
        plan.contains('oro')) {
      return 4;
    }
    // 3 puntos (PLATA)
    if (plan.contains('premium') ||
        plan.contains('plus') ||
        plan.contains('plata')) {
      return 3;
    }
    // 2 puntos (BRONCE)
    if (plan.contains('basico') ||
        plan.contains('básico') ||
        plan.contains('bronce')) {
      return 2;
    }
    return 1; // Gratis
  }
}
