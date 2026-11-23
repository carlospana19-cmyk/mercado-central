import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/services/buscador_service.dart';
import '../../../core/utils/location_helper.dart';
import '../../../theme/mc_colores.dart';
import '../../home/widgets/ads_grid.dart';
import '../models/category_catalog.dart';

/// Pantalla de resultados con filtros (FASE 1 · BLOQUE C): espejo de
/// resultados.html + results-logic.js de la web.
///
/// - Misma CONSULTA y ORDEN que la web (ver BuscadorService).
/// - Texto con debounce de 400 ms.
/// - Chips de filtros activos + "Quitar filtros".
/// - Paginación por scroll con el MISMO tamaño de página que la web
///   (RESULTS_PER_PAGE = 12; la web ordena hasta 200 resultados en cliente
///   y pagina sobre esa lista — aquí igual, revelando 12 por pantalla).
/// - Estados vacíos con mensaje.
/// - "Último filtro usado" se guarda (shared_preferences) y se restaura al
///   abrir sin parámetros.
class ResultadosBusquedaPage extends StatefulWidget {
  const ResultadosBusquedaPage({
    super.key,
    this.queryInicial = '',
    this.categoriaInicial = 'all',
  });

  final String queryInicial;
  final String categoriaInicial;

  @override
  State<ResultadosBusquedaPage> createState() =>
      _ResultadosBusquedaPageState();
}

class _ResultadosBusquedaPageState extends State<ResultadosBusquedaPage> {
  static const Duration _debounceTexto = Duration(milliseconds: 400);

  late FiltrosBusqueda _filtros;
  late final TextEditingController _textoController;
  Timer? _timerDebounce;
  List<Map<String, dynamic>> _resultados = const [];
  int _visibles = BuscadorService.resultadosPorPagina;
  bool _cargando = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _textoController = TextEditingController(text: widget.queryInicial);
    _filtros = FiltrosBusqueda(
      texto: widget.queryInicial,
      categoria: widget.categoriaInicial,
    );
    _cargaInicial();
  }

  @override
  void dispose() {
    _timerDebounce?.cancel();
    _textoController.dispose();
    super.dispose();
  }

  /// Apertura sin query: restaura el último filtro usado (BLOQUE A).
  /// Con query inicial, el texto manda y el resto de filtros se inicia limpio
  /// (comportamiento de la web: resultados.html?q=...).
  Future<void> _cargaInicial() async {
    if (widget.queryInicial.trim().isEmpty) {
      final ultimo = await FiltrosBusqueda.ultimoGuardado();
      if (!mounted) return;
      if (!ultimo.sinFiltros) {
        _filtros = ultimo;
        _textoController.text = ultimo.texto;
      }
    }
    _cargar();
  }

  /// Misma carga que loadAndFilterResults: consulta completa (tope 200),
  /// ordenada en cliente, paginada en pantalla de 12 en 12.
  Future<void> _cargar() async {
    setState(() {
      _cargando = true;
      _error = '';
      _visibles = BuscadorService.resultadosPorPagina;
    });
    try {
      final resultados = await BuscadorService.buscar(_filtros);
      if (!mounted) return;
      setState(() {
        _resultados = resultados;
        _cargando = false;
      });
    } catch (e) {
      debugPrint('Error al obtener los anuncios: $e');
      if (!mounted) return;
      setState(() {
        _error = 'Hubo un error al cargar los anuncios.';
        _cargando = false;
      });
    }
  }

  /// Texto con debounce (el submit del teclado busca de inmediato).
  void _onTextoChanged(String value) {
    _timerDebounce?.cancel();
    _timerDebounce = Timer(_debounceTexto, () {
      _filtros = _filtros.copyWith(texto: value);
      _cargar();
    });
  }

  void _onTextoEnviado(String value) {
    _timerDebounce?.cancel();
    _filtros = _filtros.copyWith(texto: value);
    _cargar();
  }

  /// Aplica filtros del panel: igual que apply-filters-btn de la web
  /// (resetea a la primera página y recarga). Guarda el último filtro usado.
  Future<void> _aplicarFiltros(FiltrosBusqueda nuevos) async {
    setState(() => _filtros = nuevos);
    await nuevos.guardarComoUltimo();
    _cargar();
  }

  /// "Quitar filtros": limpia texto, categoría, ubicación, precio y condición
  /// (el orden se conserva, igual que el sort-select de la web).
  void _quitarFiltros() {
    _textoController.clear();
    _aplicarFiltros(_filtros.copyWith(
      texto: '',
      categoria: 'all',
      provincia: '',
      distrito: '',
      precioMin: null,
      precioMax: null,
      condicion: '',
    ));
  }

  /// Quita un filtro individual desde su chip.
  void _quitarFiltro(String criterio) {
    if (criterio == 'texto') {
      _textoController.clear();
      _aplicarFiltros(_filtros.copyWith(texto: ''));
    } else if (criterio == 'categoria') {
      _aplicarFiltros(_filtros.copyWith(categoria: 'all'));
    } else if (criterio == 'ubicacion') {
      _aplicarFiltros(_filtros.copyWith(provincia: '', distrito: ''));
    } else if (criterio == 'precio') {
      _aplicarFiltros(_filtros.copyWith(precioMin: null, precioMax: null));
    } else if (criterio == 'condicion') {
      _aplicarFiltros(_filtros.copyWith(condicion: ''));
    }
  }

  void _cambiarOrden(String orden) {
    _aplicarFiltros(_filtros.copyWith(orden: orden));
  }

  /// Abre el panel de filtros (bottom sheet) como el aside de la web.
  Future<void> _abrirPanelFiltros() async {
    final resultado = await showModalBottomSheet<FiltrosBusqueda>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _PanelFiltros(filtrosIniciales: _filtros),
    );
    if (resultado != null) {
      if (resultado.sinFiltros &&
          resultado.texto.trim().isEmpty &&
          _filtros.texto.trim().isEmpty) {
        return; // Nada cambió: no recargar.
      }
      _aplicarFiltros(resultado);
    }
  }

  // ==========================================
  // UI
  // ==========================================
  @override
  Widget build(BuildContext context) {
    final total = _resultados.length;
    return Scaffold(
      backgroundColor: Mc.fondo,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Mc.texto),
        title: Text(
          _filtros.texto.trim().isNotEmpty
              ? 'Resultados para "${_filtros.texto.trim()}"'
              : _filtros.categoria != 'all'
                  ? _filtros.categoria
                  : 'Todos los anuncios',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: Mc.texto,
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
      ),
      body: Column(
        children: [
          _buildBarraBusqueda(),
          _buildChipsFiltros(),
          Expanded(child: _buildCuerpo(total)),
        ],
      ),
    );
  }

  /// Caja de texto de búsqueda con debounce (línea de búsqueda de la web).
  Widget _buildBarraBusqueda() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: TextField(
        controller: _textoController,
        onChanged: _onTextoChanged,
        onSubmitted: _onTextoEnviado,
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: 'Buscar en Mercados Central',
          prefixIcon: const Icon(Icons.search, color: Colors.grey),
          suffixIcon: _textoController.text.isEmpty
              ? null
              : IconButton(
                  icon: const Icon(Icons.clear, color: Colors.grey, size: 20),
                  onPressed: () {
                    _textoController.clear();
                    _onTextoEnviado('');
                  },
                ),
          filled: true,
          fillColor: Mc.fondo,
          contentPadding: EdgeInsets.zero,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(30),
            borderSide: BorderSide.none,
          ),
        ),
      ),
    );
  }

  /// Chips de filtros activos + orden + "Quitar filtros" (Fase 1 · BLOQUE C).
  Widget _buildChipsFiltros() {
    final chips = <Widget>[];

    // Botón del panel de filtros (aside "Filtros" de la web).
    chips.add(_chipPanel());

    // Orden (dropdown sort-select de la web).
    chips.add(_chipOrden());

    final texto = _filtros.texto.trim();
    if (texto.isNotEmpty) {
      chips.add(_chipActivo(label: texto, criterio: 'texto'));
    }
    if (_filtros.categoria != 'all') {
      chips.add(_chipActivo(label: _filtros.categoria, criterio: 'categoria'));
    }
    final ubicacionEtiqueta = _filtros.distrito.trim().isNotEmpty
        ? '${_filtros.distrito.trim()}, ${_filtros.provincia.trim()}'
        : _filtros.provincia.trim();
    if (ubicacionEtiqueta.isNotEmpty) {
      chips.add(
          _chipActivo(label: ubicacionEtiqueta, criterio: 'ubicacion'));
    }
    if (_filtros.precioMin != null || _filtros.precioMax != null) {
      final min = _filtros.precioMin != null
          ? '\$${_formatoNumero(_filtros.precioMin!)}'
          : '\$0';
      final max = _filtros.precioMax != null
          ? '\$${_formatoNumero(_filtros.precioMax!)}'
          : '∞';
      chips.add(_chipActivo(label: 'Precio $min - $max', criterio: 'precio'));
    }
    if (_filtros.condicion.isNotEmpty) {
      chips.add(_chipActivo(label: _filtros.condicion, criterio: 'condicion'));
    }

    return Container(
      width: double.infinity,
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: chips,
            ),
          ),
          if (!_filtros.sinFiltros)
            TextButton(
              onPressed: _quitarFiltros,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                minimumSize: const Size(0, 36),
              ),
              child: const Text(
                'Quitar filtros',
                style: TextStyle(
                  color: Mc.naranjaOscuro,
                  fontWeight: FontWeight.w600,
                  fontSize: 12.5,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _chipPanel() {
    return InkWell(
      onTap: _abrirPanelFiltros,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Mc.naranja,
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.tune, size: 15, color: Colors.white),
            SizedBox(width: 5),
            Text(
              'Filtros',
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _chipOrden() {
    const etiquetas = {
      'recent': 'Más recientes',
      'price-asc': 'Precio: menor a mayor',
      'price-desc': 'Precio: mayor a menor',
    };
    return PopupMenuButton<String>(
      onSelected: _cambiarOrden,
      initialValue: _filtros.orden,
      itemBuilder: (context) => const [
        PopupMenuItem(value: 'recent', child: Text('Más recientes')),
        PopupMenuItem(value: 'price-asc', child: Text('Precio: menor a mayor')),
        PopupMenuItem(
            value: 'price-desc', child: Text('Precio: mayor a menor')),
      ],
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Mc.fondo,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Mc.grisBorde),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.sort, size: 15, color: Mc.grisSuave),
            const SizedBox(width: 5),
            Text(
              etiquetas[_filtros.orden] ?? 'Más recientes',
              style: const TextStyle(fontSize: 12.5, color: Mc.textoListas),
            ),
            const Icon(Icons.arrow_drop_down, size: 17, color: Mc.grisSuave),
          ],
        ),
      ),
    );
  }

  Widget _chipActivo({required String label, required String criterio}) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 4, 8),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF1E8), // mc-badge-destacado de la web
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0x29FA6406)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 150),
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 12.5,
                color: Color(0xFFB25E00),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(width: 2),
          InkWell(
            onTap: () => _quitarFiltro(criterio),
            child: const Padding(
              padding: EdgeInsets.all(4),
              child: Icon(Icons.close, size: 14, color: Color(0xFFB25E00)),
            ),
          ),
        ],
      ),
    );
  }

  String _formatoNumero(num valor) {
    final entero = valor.round();
    final texto = entero.toString();
    final buffer = StringBuffer();
    for (var i = 0; i < texto.length; i++) {
      final resto = texto.length - i;
      buffer.write(texto[i]);
      if (resto > 1 && resto % 3 == 1) buffer.write(',');
    }
    return buffer.toString();
  }

  /// Estados: cargando, error, vacío (con mensaje) y la lista paginada.
  Widget _buildCuerpo(int total) {
    if (_cargando) {
      return const Center(
          child: CircularProgressIndicator(color: Mc.naranja));
    }
    if (_error.isNotEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Mc.grisSuave)),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _cargar,
              icon: const Icon(Icons.refresh),
              label: const Text('Reintentar'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Mc.naranjaOscuro,
                side: const BorderSide(color: Mc.naranja),
              ),
            ),
          ],
        ),
      );
    }
    if (total == 0) {
      final texto = _filtros.texto.trim();
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.search_off, size: 56, color: Colors.grey),
              const SizedBox(height: 14),
              Text(
                texto.isNotEmpty
                    ? 'No encontramos "$texto"'
                    : 'No hay anuncios que coincidan con los filtros',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Mc.textoListas,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Prueba con otras palabras o quita algunos filtros.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13.5, color: Mc.grisSuave),
              ),
              if (!_filtros.sinFiltros) ...[
                const SizedBox(height: 16),
                OutlinedButton(
                  onPressed: _quitarFiltros,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Mc.naranjaOscuro,
                    side: const BorderSide(color: Mc.naranja),
                  ),
                  child: const Text('Quitar filtros'),
                ),
              ],
            ],
          ),
        ),
      );
    }

    // Lista paginada: los primeros 12 (misma página que la web) y se revelan
    // 12 más al acercarse al final del scroll.
    final visibles = _visibles.clamp(0, total);
    final resumen = '$total resultado${total == 1 ? '' : 's'}';
    return NotificationListener<ScrollNotification>(
      onNotification: (scrollInfo) {
        if (scrollInfo.metrics.pixels >=
                scrollInfo.metrics.maxScrollExtent - 400 &&
            visibles < total) {
          setState(() => _visibles =
              (visibles + BuscadorService.resultadosPorPagina).clamp(0, total));
        }
        return false;
      },
      // Cuadrícula de 2 columnas (mc-tarjeta-2026.css): cada item de la lista
      // es una fila de 2 tarjetas compactas; el item 0 es el resumen.
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(12, 4, 12, 24),
        itemCount: adsGridFilas(visibles) + 1, // +1: línea de resumen
        itemBuilder: (context, index) {
          if (index == 0) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 2, left: 2),
              child: Text(
                total > visibles
                    ? '$resumen · mostrando $visibles'
                    : resumen,
                style:
                    const TextStyle(fontSize: 12.5, color: Mc.grisSuave),
              ),
            );
          }
          return AdsGridRow(
            ads: _resultados.take(visibles).toList(),
            fila: index - 1,
          );
        },
      ),
    );
  }
}

/// Panel de filtros (bottom sheet) — equivalente del aside #filters-sidebar
/// de resultados.html de la web: categoría, provincia/corregimiento,
/// precio mínimo/máximo y condición. 'Aplicar filtros' devuelve los nuevos
/// filtros a la pantalla (reset a la primera página, como la web).
class _PanelFiltros extends StatefulWidget {
  const _PanelFiltros({required this.filtrosIniciales});

  final FiltrosBusqueda filtrosIniciales;

  @override
  State<_PanelFiltros> createState() => _PanelFiltrosState();
}

class _PanelFiltrosState extends State<_PanelFiltros> {
  late String _categoria;
  late String _provincia;
  late String _distrito;
  late final TextEditingController _precioMin;
  late final TextEditingController _precioMax;
  late String _condicion;

  @override
  void initState() {
    super.initState();
    _categoria = widget.filtrosIniciales.categoria;
    _provincia = widget.filtrosIniciales.provincia;
    _distrito = widget.filtrosIniciales.distrito;
    _precioMin = TextEditingController(
      text: widget.filtrosIniciales.precioMin?.toString() ?? '',
    );
    _precioMax = TextEditingController(
      text: widget.filtrosIniciales.precioMax?.toString() ?? '',
    );
    _condicion = widget.filtrosIniciales.condicion;
  }

  @override
  void dispose() {
    _precioMin.dispose();
    _precioMax.dispose();
    super.dispose();
  }

  InputDecoration _decoration(String label) => InputDecoration(
        labelText: label,
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Mc.grisBorde),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Mc.grisBorde),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Mc.naranja, width: 2),
        ),
      );

  void _quitarTodo() {
    Navigator.pop(
      context,
      FiltrosBusqueda(
        texto: widget.filtrosIniciales.texto,
        categoria: 'all',
        provincia: '',
        distrito: '',
        precioMin: null,
        precioMax: null,
        condicion: '',
        orden: widget.filtrosIniciales.orden,
      ),
    );
  }

  void _aplicar() {
    final min = num.tryParse(_precioMin.text.trim());
    final max = num.tryParse(_precioMax.text.trim());
    Navigator.pop(
      context,
      FiltrosBusqueda(
        texto: widget.filtrosIniciales.texto,
        categoria: _categoria,
        provincia: _provincia,
        distrito: _distrito,
        precioMin: min,
        precioMax: max,
        condicion: _condicion,
        orden: widget.filtrosIniciales.orden,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 18,
          bottom: MediaQuery.of(context).viewInsets.bottom + 18,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Filtros',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: Mc.texto,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: _quitarTodo,
                    child: const Text(
                      'Quitar filtros',
                      style: TextStyle(
                        color: Mc.naranjaOscuro,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Categoría (catálogo maestro del app, mismos nombres de la DB).
              DropdownButtonFormField<String>(
                key: ValueKey('cat_$_categoria'),
                initialValue: _categoria,
                decoration: _decoration('Categoría'),
                items: [
                  const DropdownMenuItem(
                      value: 'all', child: Text('Todas las categorías')),
                  ...fullCategoryCatalog.map(
                    (c) =>
                        DropdownMenuItem(value: c.name, child: Text(c.name)),
                  ),
                ],
                onChanged: (v) => setState(() => _categoria = v ?? 'all'),
              ),
              const SizedBox(height: 14),

              // Provincia / corregimiento-distrito (LocationHelper del app,
              // mismos datos que config-locations.js de la web).
              DropdownButtonFormField<String>(
                key: ValueKey('prov_$_provincia'),
                initialValue: _provincia.isEmpty ? null : _provincia,
                decoration: _decoration('Provincia'),
                hint: const Text('Toda la república'),
                items: LocationHelper.getProvinces()
                    .map((p) => DropdownMenuItem(value: p, child: Text(p)))
                    .toList(),
                onChanged: (v) => setState(() {
                  _provincia = v ?? '';
                  if (!LocationHelper.getDistricts(_provincia)
                      .contains(_distrito)) {
                    _distrito = '';
                  }
                }),
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<String>(
                key: ValueKey('dist_$_provincia'),
                initialValue: _distrito.isEmpty ? null : _distrito,
                decoration: _decoration('Corregimiento / Distrito'),
                hint: const Text('Toda la provincia'),
                items: _provincia.isEmpty
                    ? null
                    : LocationHelper.getDistricts(_provincia)
                        .map((d) => DropdownMenuItem(value: d, child: Text(d)))
                        .toList(),
                onChanged: (v) => setState(() => _distrito = v ?? ''),
              ),
              const SizedBox(height: 14),

              // Precio mínimo/máximo (price-min / price-max de la web).
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _precioMin,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      decoration: _decoration('Precio mínimo (\$)'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _precioMax,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      decoration: _decoration('Precio máximo (\$)'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Condición (attr.condicion de publish-logic.js: Nuevo / Usado).
              const Text(
                'Condición',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Mc.textoListas,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  for (final valor in const ['', 'Nuevo', 'Usado'])
                    ChoiceChip(
                      label: Text(valor.isEmpty ? 'Todas' : valor),
                      selected: _condicion == valor,
                      selectedColor: const Color(0xFFFFF1E8),
                      checkmarkColor: Mc.naranjaOscuro,
                      labelStyle: TextStyle(
                        color: _condicion == valor
                            ? Mc.naranjaOscuro
                            : Mc.textoListas,
                        fontWeight: FontWeight.w600,
                      ),
                      side: BorderSide(
                        color:
                            _condicion == valor ? Mc.naranja : Mc.grisBorde,
                      ),
                      onSelected: (_) => setState(() => _condicion = valor),
                    ),
                ],
              ),
              const SizedBox(height: 20),

              // apply-filters-btn de la web.
              ElevatedButton(
                onPressed: _aplicar,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Mc.naranja,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(50),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(26),
                  ),
                ),
                child: const Text(
                  'Aplicar filtros',
                  style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
