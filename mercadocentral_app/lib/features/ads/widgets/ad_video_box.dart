import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

import 'package:mercadocentral_app/core/config/app_config.dart';

/// Cuadro de video del detalle (equivalente a `.detail-video` de la web).
///
/// Misma lógica que `getVideoEmbedUrl()` de product-detail-logic.js: acepta
/// YouTube (watch, embed, shorts, youtu.be) y Vimeo y reproduce el `embed`
/// dentro de la app con un WebView, como el iframe de la web.
///
/// Para no cargar un WebView por cada anuncio que se abre, primero se muestra
/// la miniatura (YouTube) con el botón de play y el reproductor se monta al
/// tocarla. Si la URL no es YouTube/Vimeo pero sí http(s), el toque abre el
/// enlace con el visor del sistema. Si [url] no es válida no pinta nada.
class AdVideoBox extends StatefulWidget {
  final String? url;
  final String titulo;

  const AdVideoBox({super.key, required this.url, this.titulo = 'anuncio'});

  static final _youtube = RegExp(
    r'(?:youtube\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/)|youtu\.be/)([a-zA-Z0-9_-]{11})',
  );
  static final _vimeo = RegExp(r'vimeo\.com/(?:video/)?(\d+)');

  /// true si [raw] es una URL http(s) reproducible/abrible.
  static bool esValido(dynamic raw) => _uriValida(raw?.toString()) != null;

  /// URL válida (http/https) o null.
  static Uri? _uriValida(String? raw) {
    final texto = (raw ?? '').trim();
    if (texto.isEmpty) return null;
    final uri = Uri.tryParse(texto);
    if (uri == null || !uri.hasAuthority) return null;
    if (uri.scheme != 'http' && uri.scheme != 'https') return null;
    return uri;
  }

  /// URL de embed de YouTube/Vimeo (null si no es ninguna de las dos).
  static String? _embedUrl(Uri uri) {
    final texto = uri.toString();
    final yt = _youtube.firstMatch(texto)?.group(1);
    if (yt != null) {
      return 'https://www.youtube.com/embed/$yt'
          '?rel=0&modestbranding=1&playsinline=1&autoplay=1';
    }
    final vimeo = _vimeo.firstMatch(texto)?.group(1);
    if (vimeo != null) {
      return 'https://player.vimeo.com/video/$vimeo?autoplay=1';
    }
    return null;
  }

  @override
  State<AdVideoBox> createState() => _AdVideoBoxState();
}

class _AdVideoBoxState extends State<AdVideoBox> {
  WebViewController? _controller;
  bool _reproduciendo = false;

  Future<void> _abrirExterno(Uri uri) async {
    var abierto = false;
    try {
      abierto = await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      abierto = false;
    }
    if (!abierto && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo abrir el video.')),
      );
    }
  }

  bool _hostPermitido(String url) {
    if (url == 'about:blank') return true;
    final host = Uri.tryParse(url)?.host ?? '';
    return host.endsWith('youtube.com') ||
        host.endsWith('youtube-nocookie.com') ||
        host.endsWith('vimeo.com') ||
        host == Uri.parse(AppConfig.webBaseUrl).host;
  }

  String _html(String embed) {
    final titulo = widget.titulo.replaceAll('"', '&quot;');
    return '<!DOCTYPE html><html><head>'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}'
        'iframe{position:absolute;inset:0;width:100%;height:100%;border:0}'
        '</style></head><body>'
        '<iframe src="$embed" title="Video de $titulo" '
        'allow="autoplay; accelerometer; clipboard-write; encrypted-media; '
        'gyroscope; picture-in-picture; fullscreen" '
        'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>'
        '</iframe></body></html>';
  }

  void _reproducir(Uri uri) {
    final embed = AdVideoBox._embedUrl(uri);
    if (embed == null) {
      _abrirExterno(uri);
      return;
    }

    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..setNavigationDelegate(
        NavigationDelegate(
          // Cualquier salto del marco principal a otro sitio se abre fuera
          // de la app; el iframe sigue libre dentro de YouTube/Vimeo.
          onNavigationRequest: (request) {
            if (!request.isMainFrame || _hostPermitido(request.url)) {
              return NavigationDecision.navigate;
            }
            final destino = Uri.tryParse(request.url);
            if (destino != null) _abrirExterno(destino);
            return NavigationDecision.prevent;
          },
        ),
      );

    // Android bloquea el autoplay por defecto: se quita esa restricción para
    // que el video arranque con el toque en el botón de play.
    final platform = controller.platform;
    if (platform is AndroidWebViewController) {
      platform.setMediaPlaybackRequiresUserGesture(false);
    }

    // HTML con el mismo iframe que la web; baseUrl del sitio para que YouTube
    // reciba un referrer válido.
    controller.loadHtmlString(_html(embed), baseUrl: AppConfig.webBaseUrl);

    setState(() {
      _controller = controller;
      _reproduciendo = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    final uri = AdVideoBox._uriValida(widget.url);
    if (uri == null) return const SizedBox.shrink();

    final controller = _controller;
    if (_reproduciendo && controller != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: ColoredBox(
            color: Colors.black,
            child: WebViewWidget(controller: controller),
          ),
        ),
      );
    }

    final idYoutube = AdVideoBox._youtube.firstMatch(uri.toString())?.group(1);
    final miniatura = idYoutube == null
        ? null
        : 'https://img.youtube.com/vi/$idYoutube/hqdefault.jpg';

    // Sin título propio: la web solo muestra el cuadro 16:9 con el reproductor.
    return Semantics(
      button: true,
      label: 'Reproducir video de ${widget.titulo}',
      child: GestureDetector(
        onTap: () => _reproducir(uri),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: AspectRatio(
            aspectRatio: 16 / 9,
            child: Stack(
              fit: StackFit.expand,
              children: [
                Container(color: Colors.black),
                if (miniatura != null)
                  CachedNetworkImage(
                    imageUrl: miniatura,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(color: Colors.black),
                    errorWidget: (_, __, ___) => Container(color: Colors.black),
                  ),
                // Botón de play rojo estilo YouTube (como el iframe de la web).
                Center(
                  child: Container(
                    width: 68,
                    height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF0033),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(
                      Icons.play_arrow_rounded,
                      color: Colors.white,
                      size: 38,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

