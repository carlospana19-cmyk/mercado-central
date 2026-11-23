/// Límites de planes — ESPEJO EXACTO de la web. ÚNICA FUENTE DE VERDAD.
///
/// Origen (web, en .kilo/worktrees/iris-thing/):
///  - AppConfig.js → PLAN_LIMITS: maxFotos (5/10/15/20), price (0/10/20/30),
///    label, hasVideo (solo destacado), priority (0/1/2/3).
///  - Ciclo de vida del anuncio (form-logic.js): TODOS los planes duran 30
///    días. Un plan de pago pasa a GRATIS al cumplir su mes (anuncios.
///    featured_until) y el mes gratis termina en la eliminación
///    (anuncios.fecha_eliminacion = 30 pagos + 30 gratis). Un anuncio gratis
///    vive 30 días y se elimina. La constante VIGENCIA_PLANES de
///    publish-logic.js es código muerto (no se usa en ningún lugar).
///  - publish-logic.js (líneas 1287-1340) → IA por anuncio: free 0, basico 1,
///    premium 3, destacado 5 (cobro al publicar vía flag ia_usada_al_publicar;
///    el saldo vive en suscripciones.limite_ia / optimizations_ia_usadas).
///  - publicar.html (video-block) → campo URL de video SOLO para plan Destacado.
///
/// PROHIBIDO hardcodear límites sueltos en pantallas: publish, panel y perfil
/// leen todos de esta única fuente.
class PlanLimits {
  PlanLimits._();

  /// URL de la web pública (origen de la verdad). El CTA "Mejorar plan" lleva aquí.
  static const String webUrl = 'https://mercado-central.vercel.app';

  /// Planes vigentes — espejo de AppConfig.js PLAN_LIMITS + form-logic.js +
  /// publish-logic.js. Valores idénticos a la web.
  static const Map<String, Map<String, dynamic>> planes = {
    'free': {
      'label': 'Gratis',
      'maxFotos': 5,
      'price': 0,
      'vigenciaDias': 30,
      'hasVideo': false,
      'limiteIA': 0,
      // La web usa priority 0-3 en AppConfig.js; la app escribe plan_priority
      // 1-4 en la BD (§6.6) para ordenar el Home. Mismo orden relativo.
      'priority': 0,
    },
    'basico': {
      'label': 'Básico',
      'maxFotos': 10,
      'price': 10,
      'vigenciaDias': 30,
      'hasVideo': false,
      'limiteIA': 1,
      'priority': 1,
    },
    'premium': {
      'label': 'Premium',
      'maxFotos': 15,
      'price': 20,
      'vigenciaDias': 30,
      'hasVideo': false,
      'limiteIA': 3,
      'priority': 2,
    },
    'destacado': {
      'label': 'Destacado',
      'maxFotos': 20,
      'price': 30,
      'vigenciaDias': 30,
      'hasVideo': true,
      'limiteIA': 5,
      'priority': 3,
    },
  };

  /// La web genera tokens 'top' (admin-logic.js) que el flujo de publicación
  /// mapea a 'destacado' (plan_selection_step: top → destacado).
  static String normalize(String plan) {
    final p = plan.toLowerCase().trim();
    return p == 'top' ? 'destacado' : p;
  }

  static Map<String, dynamic>? forPlan(String plan) => planes[normalize(plan)];

  static int maxFotosFor(String plan) => forPlan(plan)?['maxFotos'] as int? ?? 5;

  /// Días que dura el plan elegido (30 para todos).
  static int vigenciaDiasFor(String plan) =>
      forPlan(plan)?['vigenciaDias'] as int? ?? 30;

  /// Días de gracia en plan GRATIS que siguen a un plan de pago antes de que
  /// el anuncio se elimine (y vigencia total de un anuncio gratis).
  static const int vigenciaGratisDias = 30;

  /// Plan de pago = cualquiera con precio (basico, premium, destacado/top).
  static bool isPaid(String plan) => priceFor(plan) > 0;

  /// Días hasta la eliminación del anuncio (anuncios.fecha_eliminacion):
  /// pago → 30 de plan + 30 gratis; gratis → 30.
  static int diasHastaEliminacionFor(String plan) =>
      isPaid(plan)
          ? vigenciaDiasFor(plan) + vigenciaGratisDias
          : vigenciaGratisDias;

  static bool hasVideoFor(String plan) =>
      forPlan(plan)?['hasVideo'] as bool? ?? false;

  static int limiteIAFor(String plan) =>
      forPlan(plan)?['limiteIA'] as int? ?? 0;

  static int priorityFor(String plan) =>
      forPlan(plan)?['priority'] as int? ?? 0;

  static int priceFor(String plan) => forPlan(plan)?['price'] as int? ?? 0;

  static String labelFor(String plan) =>
      forPlan(plan)?['label'] as String? ?? 'Gratis';

  /// Deriva el plan desde `suscripciones.limite_ia` (mapeo 1:1 con los topes
  /// de arriba: 0→free, 1→basico, 3→premium, 5→destacado). Útil cuando la
  /// tabla suscripciones no expone columna de plan pero sí el límite IA.
  static String planFromLimiteIA(int limiteIA) {
    for (final entry in planes.entries) {
      if (entry.value['limiteIA'] == limiteIA) return entry.key;
    }
    return 'free';
  }
}
