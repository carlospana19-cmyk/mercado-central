import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/services/report_service.dart';
import '../../../theme/mc_colores.dart';

/// Diálogo para reportar un anuncio. Envía el reporte y muestra el resultado.
class ReportAdDialog extends StatefulWidget {
  const ReportAdDialog({
    super.key,
    required this.anuncioId,
    this.vendedorId,
  });

  final String anuncioId;
  final String? vendedorId;

  static Future<void> mostrar(
    BuildContext context, {
    required String anuncioId,
    String? vendedorId,
  }) async {
    final resultado = await showDialog<ResultadoReporte>(
      context: context,
      builder: (_) => ReportAdDialog(
        anuncioId: anuncioId,
        vendedorId: vendedorId,
      ),
    );
    if (resultado == null || !context.mounted) return;

    final mensaje = switch (resultado) {
      ResultadoReporte.enviado =>
        'Gracias. Recibimos tu reporte y lo revisaremos.',
      ResultadoReporte.yaReportado => 'Ya habías reportado este anuncio.',
      ResultadoReporte.sinSesion => 'Inicia sesión para reportar un anuncio.',
      ResultadoReporte.error =>
        'No se pudo enviar el reporte. Intenta de nuevo.',
    };
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(mensaje),
        backgroundColor: resultado == ResultadoReporte.error
            ? Colors.red
            : null,
      ),
    );
  }

  @override
  State<ReportAdDialog> createState() => _ReportAdDialogState();
}

class _ReportAdDialogState extends State<ReportAdDialog> {
  final _detalle = TextEditingController();
  String? _motivo;
  bool _enviando = false;

  @override
  void dispose() {
    _detalle.dispose();
    super.dispose();
  }

  Future<void> _enviar() async {
    final motivo = _motivo;
    if (motivo == null || _enviando) return;
    setState(() => _enviando = true);
    final resultado = await ReportService.reportarAnuncio(
      Supabase.instance.client,
      anuncioId: widget.anuncioId,
      vendedorId: widget.vendedorId,
      motivo: motivo,
      detalle: _detalle.text,
    );
    if (mounted) Navigator.pop(context, resultado);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Reportar anuncio'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('¿Por qué quieres reportarlo?'),
            RadioGroup<String>(
              groupValue: _motivo,
              onChanged: (value) {
                if (!_enviando) setState(() => _motivo = value);
              },
              child: Column(
                children: [
                  for (final m in MotivoReporte.todos)
                    RadioListTile<String>(
                      value: m.valor,
                      title: Text(m.etiqueta),
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      activeColor: Mc.naranja,
                    ),
                ],
              ),
            ),
            TextField(
              controller: _detalle,
              enabled: !_enviando,
              maxLength: 500,
              minLines: 2,
              maxLines: 4,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                hintText: 'Detalles (opcional)',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _enviando ? null : () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: _motivo == null || _enviando ? null : _enviar,
          style: FilledButton.styleFrom(backgroundColor: Mc.naranja),
          child: _enviando
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Text('Enviar reporte'),
        ),
      ],
    );
  }
}
