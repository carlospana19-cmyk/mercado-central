import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config/app_config.dart';

/// Apertura de enlaces externos (web, correo, WhatsApp) con aviso al usuario
/// si el sistema no puede abrirlos.
class Enlaces {
  Enlaces._();

  static Uri correo({String asunto = ''}) => Uri.parse(
        'mailto:${AppConfig.emailSoporte}'
        '${asunto.isEmpty ? '' : '?subject=${Uri.encodeComponent(asunto)}'}',
      );

  static Uri whatsapp({String mensaje = ''}) => Uri.parse(
        'https://wa.me/${AppConfig.whatsappSoporte}'
        '${mensaje.isEmpty ? '' : '?text=${Uri.encodeComponent(mensaje)}'}',
      );

  /// Abre [uri] fuera de la app. Si falla, muestra un SnackBar.
  static Future<void> abrir(BuildContext context, Uri uri) async {
    var abierto = false;
    try {
      abierto = await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      abierto = false;
    }
    if (!abierto && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo abrir el enlace.')),
      );
    }
  }

  static Future<void> abrirWeb(BuildContext context, String url) =>
      abrir(context, Uri.parse(url));
}
