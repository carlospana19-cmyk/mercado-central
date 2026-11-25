import 'package:supabase_flutter/supabase_flutter.dart';

/// Motivos de reporte (mismos valores que el CHECK de public.reportes).
class MotivoReporte {
  const MotivoReporte(this.valor, this.etiqueta);

  final String valor;
  final String etiqueta;

  static const List<MotivoReporte> todos = [
    MotivoReporte('fraude', 'Posible fraude o estafa'),
    MotivoReporte('contenido_inapropiado', 'Contenido inapropiado u ofensivo'),
    MotivoReporte('producto_prohibido', 'Producto o servicio prohibido'),
    MotivoReporte('informacion_falsa', 'Información falsa o engañosa'),
    MotivoReporte('spam', 'Spam o anuncio repetido'),
    MotivoReporte('otro', 'Otro motivo'),
  ];
}

/// Resultado de enviar un reporte.
enum ResultadoReporte { enviado, yaReportado, sinSesion, error }

/// Reporte de anuncios (migración 0006_reportes.sql). Requisito de las
/// tiendas para apps con contenido generado por usuarios.
class ReportService {
  ReportService._();

  static Future<ResultadoReporte> reportarAnuncio(
    SupabaseClient client, {
    required String anuncioId,
    String? vendedorId,
    required String motivo,
    String? detalle,
  }) async {
    final user = client.auth.currentUser;
    if (user == null) return ResultadoReporte.sinSesion;

    final id = int.tryParse(anuncioId);
    if (id == null) return ResultadoReporte.error;

    final texto = (detalle ?? '').trim();
    try {
      await client.from('reportes').insert({
        'reporter_id': user.id,
        'anuncio_id': id,
        if (vendedorId != null && vendedorId.isNotEmpty)
          'usuario_reportado_id': vendedorId,
        'motivo': motivo,
        if (texto.isNotEmpty)
          'detalle': texto.length > 500 ? texto.substring(0, 500) : texto,
      });
      return ResultadoReporte.enviado;
    } on PostgrestException catch (error) {
      // 23505 = unique_violation: ya lo había reportado.
      if (error.code == '23505') return ResultadoReporte.yaReportado;
      return ResultadoReporte.error;
    } catch (_) {
      return ResultadoReporte.error;
    }
  }
}
