import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/utils/preferencias_busqueda.dart';
import '../../../theme/mc_colores.dart';
import '../../home/widgets/ads_grid.dart';

class MercadoSearchDelegate extends SearchDelegate {
  // Función para calcular el peso (ponerla fuera del build o como método privado)
  int _getPlanPriority(String? plan) {
    switch (plan?.toLowerCase()) {
      case 'destacado':
        return 1; // Prioridad Máxima
      case 'premium':
        return 2; // Prioridad Alta
      case 'basico':
        return 3; // Prioridad Media
      default:
        return 4; // Prioridad Baja (Gratis o sin plan)
    }
  }

  @override
  String get searchFieldLabel => 'Buscar en Mercados Central...';

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      IconButton(
          icon: const Icon(Icons.clear, color: Colors.grey),
          onPressed: () => query = '')
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.black87),
        onPressed: () => close(context, null));
  }

  String _normalize(String input) {
    final Map<String, String> diacritics = {
      'á': 'a',
      'à': 'a',
      'â': 'a',
      'ä': 'a',
      'ã': 'a',
      'å': 'a',
      'é': 'e',
      'è': 'e',
      'ê': 'e',
      'ë': 'e',
      'í': 'i',
      'ì': 'i',
      'î': 'i',
      'ï': 'i',
      'ó': 'o',
      'ò': 'o',
      'ô': 'o',
      'ö': 'o',
      'õ': 'o',
      'ú': 'u',
      'ù': 'u',
      'û': 'u',
      'ü': 'u',
      'ñ': 'n',
      'ç': 'c',
    };
    var result = input.toLowerCase();
    diacritics.forEach((char, replacement) {
      result = result.replaceAll(char, replacement);
    });
    return result;
  }

  Future<List<Map<String, dynamic>>> _buscarEnSupabase(String texto) async {
    final trimmed = texto.trim();
    final response = trimmed.isEmpty
        ? await Supabase.instance.client
            .from('anuncios')
            .select(
                '*, imagenes(url_imagen), profiles(id, nombre_negocio, url_foto_perfil, nombre_completo)')
            .eq('activo', true)
            .order('fecha_publicacion', ascending: false)
            .limit(50)
        : await Supabase.instance.client
            .from('anuncios')
            .select(
                '*, imagenes(url_imagen), profiles(id, nombre_negocio, url_foto_perfil, nombre_completo)')
            .eq('activo', true)
            .ilike('titulo', '%$trimmed%')
            .limit(50);
    final rawAds = List<Map<String, dynamic>>.from(response);

    if (trimmed.isEmpty) return rawAds;

    // Filtro sin acentos en Dart: compara normalizando ambos lados
    final queryNorm = _normalize(trimmed);
    final filtered = rawAds.where((ad) {
      final titulo = _normalize(ad['titulo']?.toString() ?? '');
      final categoria = _normalize(ad['categoria']?.toString() ?? '');
      return titulo.contains(queryNorm) || categoria.contains(queryNorm);
    }).toList();

    return filtered;
  }

  /// Última búsqueda ya guardada en recientes (evita duplicar el guardado
  /// cuando buildResults se reconstruye con el mismo texto).
  String? _recienteGuardada;

  @override
  Widget buildResults(BuildContext context) {
    // La página de resultados solo aparece al ENVIAR la búsqueda (tecla de
    // buscar del teclado). Aquí se persiste como búsqueda reciente
    // (shared_preferences, máx 5, FASE 1 · BLOQUE A). Si el usuario edita el
    // texto sobre la página de resultados, cada texto nuevo también se guarda.
    final q = query.trim();
    if (q.isNotEmpty && _recienteGuardada != q) {
      _recienteGuardada = q;
      PreferenciasBusqueda.guardarBusquedaReciente(q);
    }
    // Igual que la web (search-global.js): al enviar la búsqueda se abre la
    // pantalla de resultados con filtros. El delegate se cierra devolviendo
    // la consulta y la home abre ResultadosBusquedaPage (BLOQUE C).
    WidgetsBinding.instance.addPostFrameCallback((_) {
      close(context, q);
    });
    return const Center(child: CircularProgressIndicator(color: Mc.naranja));
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    return _construirListaDeResultados();
  }

  Widget _construirListaDeResultados() {
    // Con la caja vacía: búsquedas recientes (shared_preferences, máx 5)
    // + listado de anuncios recientes, igual que las sugerencias de la web.
    if (query.trim().isEmpty) {
      return FutureBuilder<List<Map<String, dynamic>>>(
        future: _buscarEnSupabase(''),
        builder: (context, snapshot) {
          final ads = (snapshot.data ?? const []).toList();
          ads.sort((a, b) {
            return _getPlanPriority(a['selected_plan'])
                .compareTo(_getPlanPriority(b['selected_plan']));
          });
          return ListView(
            padding: const EdgeInsets.all(12.0),
            children: [
              _SeccionRecientes(onSeleccionar: (texto) => query = texto),
              AdsGrid(ads: ads, padding: EdgeInsets.zero),
            ],
          );
        },
      );
    }

    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _buscarEnSupabase(query),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
              child: CircularProgressIndicator(color: Mc.naranja));
        }
        if (snapshot.hasError) {
          return const Center(
              child: Text('Error en el radar.',
                  style: TextStyle(color: Colors.red)));
        }
        final ads = snapshot.data ?? [];
        if (ads.isEmpty) {
          return Center(
            child: Text('No encontramos "$query"',
                style: const TextStyle(color: Colors.grey)),
          );
        }

        // Lógica de ordenamiento (ejecutarla JUSTO ANTES de construir el ListView)
        ads.sort((a, b) {
          return _getPlanPriority(a['selected_plan'])
              .compareTo(_getPlanPriority(b['selected_plan']));
        });

        return ListView.builder(
          padding: const EdgeInsets.all(12.0),
          itemCount: adsGridFilas(ads.length),
          itemBuilder: (context, fila) {
            return AdsGridRow(ads: ads, fila: fila);
          },
        );
      },
    );
  }
}

/// Sección "Búsquedas recientes" (FASE 1 · BLOQUE A): carga, muestra y borra
/// por su cuenta para no depender del rebuild del SearchDelegate.
class _SeccionRecientes extends StatefulWidget {
  const _SeccionRecientes({required this.onSeleccionar});

  final void Function(String texto) onSeleccionar;

  @override
  State<_SeccionRecientes> createState() => _SeccionRecientesState();
}

class _SeccionRecientesState extends State<_SeccionRecientes> {
  List<String> _recientes = const <String>[];

  @override
  void initState() {
    super.initState();
    PreferenciasBusqueda.busquedasRecientes().then((recientes) {
      if (mounted) setState(() => _recientes = recientes);
    });
  }

  Future<void> _limpiar() async {
    await PreferenciasBusqueda.borrarBusquedasRecientes();
    if (mounted) setState(() => _recientes = const <String>[]);
  }

  @override
  Widget build(BuildContext context) {
    if (_recientes.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.history, size: 16, color: Colors.grey),
            const SizedBox(width: 6),
            const Text(
              'Búsquedas recientes',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: Colors.black87,
              ),
            ),
            const Spacer(),
            TextButton(
              onPressed: _limpiar,
              child: const Text('Limpiar', style: TextStyle(fontSize: 12)),
            ),
          ],
        ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final texto in _recientes)
              ActionChip(
                label: Text(texto),
                onPressed: () => widget.onSeleccionar(texto),
              ),
          ],
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}
