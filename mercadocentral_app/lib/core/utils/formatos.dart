import 'package:intl/intl.dart';

/// Formatos de moneda y fecha del app (FASE 1 · BLOQUE A).
///
/// - Moneda USD "$1,250.00" (NumberFormat en_US): especificación FASE 1.
///   El criterio de "A consultar" cuando el precio es vacío o 0 viene de
///   precioTexto() en utilidades-ui.js de la web.
/// - Fechas "20 nov 2026" (DateFormat 'd MMM yyyy', locale 'es'): la web usa
///   fechas relativas en el detalle ("Publicado hace N días", ver
///   _publishedDate) y este formato absoluto para fechas puntuales
///   (mis anuncios: publicación y vencimiento).
///
/// NOTA: el locale 'es' se inicializa en main() con
/// initializeDateFormatting('es') antes de usar cualquier DateFormat.
class Formatos {
  Formatos._();

  static final NumberFormat _usd =
      NumberFormat.currency(locale: 'en_US', symbol: r'$', decimalDigits: 2);

  static final DateFormat _fechaCorta = DateFormat('d MMM yyyy', 'es');

  /// Precio en USD "$1,250.00"; "A consultar" si es vacío, nulo o <= 0
  /// (mismo criterio que precioTexto en utilidades-ui.js de la web).
  static String precioUsd(dynamic value) {
    final number = num.tryParse(value?.toString() ?? '');
    if (number == null || number <= 0) return 'A consultar';
    return _usd.format(number);
  }

  /// "20 nov 2026". Cadena vacía si la fecha es nula.
  static String fechaCorta(DateTime? fecha) {
    if (fecha == null) return '';
    return _fechaCorta.format(fecha);
  }

  /// "20 nov 2026" a partir de un ISO string dinámico (columna de Supabase).
  /// Cadena vacía si no se puede parsear.
  static String fechaCortaDeIso(dynamic iso) {
    if (iso == null) return '';
    return fechaCorta(DateTime.tryParse(iso.toString())?.toLocal());
  }
}
