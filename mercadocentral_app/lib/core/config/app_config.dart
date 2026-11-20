import '../../features/planes/plan_limits.dart';

/// Configuración central de la app Mercados Central.
/// Credenciales y constantes de servicios (guía maestra §0.3, §2.9).
/// Los límites de planes viven en plan_limits.dart (espejo de la web):
/// allí está la única fuente de verdad; aquí solo se delegan por conveniencia.
/// Los precios de stripe-config.js de la web son config muerta: ignorarlos.
class AppConfig {
  AppConfig._();

  // 1. SUPABASE (mismo proyecto que la web; clave publishable, permitida en repo)
  static const String supabaseUrl = 'https://ldtomnicwnwituyensmn.supabase.co';
  static const String supabaseAnonKey =
      'sb_publishable_IhsU4XOQCR8R83oZEXhVAA_W_8v6Fik';

  // 2. IDENTIDAD (wordmark siempre en plural: "Mercados Central")
  static const String appTitle = 'Mercados Central';

  // 3. SERVICIO DE IA (ia-button.js de la web; local = 127.0.0.1:5001)
  static const String iaServerUrl = 'https://mercado-central-9yqf.onrender.com';

  // 4. PLANES VIGENTES → delegan a PlanLimits (única fuente, espejo de la web).
  static Map<String, Map<String, dynamic>> get planes => PlanLimits.planes;

  // 5. LÍMITES IA DE TEXTOS → delegan a PlanLimits (por anuncio: free 0,
  //    basico 1, premium 3, destacado 5).
  static Map<String, int> get limitesIA => {
        for (final entry in PlanLimits.planes.entries)
          entry.key: entry.value['limiteIA'] as int,
      };

  // 6. ENLACES PÚBLICOS DE LA WEB (FASE 1 · compartir anuncios).
  //    Base canónica del detalle: <link rel="canonical" id="mc-canonical">
  //    en detalle-producto.html de la web. El enlace del anuncio se construye
  //    igual que buildShareUrl() en product-detail-logic.js:
  //    base + ?id=<id codificado>.
  static const String webBaseUrl = 'https://www.mercadoscentral.com';

  static String urlDetalleAnuncio(String idAnuncio) =>
      '$webBaseUrl/detalle-producto.html?id=${Uri.encodeComponent(idAnuncio)}';
}

