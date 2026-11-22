import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mercadocentral_app/core/services/busqueda_visual_service.dart';
import 'package:mercadocentral_app/theme/mc_colores.dart';
import 'package:mercadocentral_app/features/home/widgets/featured_ads.dart';
import 'package:mercadocentral_app/features/home/widgets/hero_banner.dart';
import 'package:mercadocentral_app/features/search/delegates/mercado_search_delegate.dart';
import 'package:mercadocentral_app/features/search/screens/all_categories_page.dart';
import 'package:mercadocentral_app/features/search/screens/resultados_busqueda_page.dart';

// Importaciones necesarias para las otras pestañas
import 'package:mercadocentral_app/features/publish/screens/upload_page.dart';
import 'package:mercadocentral_app/features/profile/screens/profile_page.dart';
import 'package:mercadocentral_app/features/favorites/screens/favorites_page.dart';
import 'package:mercadocentral_app/features/chat/screens/chat_page.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with WidgetsBindingObserver {
  final GlobalKey<FavoritesPageState> _favoritesPageKey =
      GlobalKey<FavoritesPageState>();
  int _selectedIndex = 0;
  String _selectedCategory = 'Todos';
  int _unreadMessages = 0;
  RealtimeChannel? _messageChannel;
  Timer? _unreadRefreshTimer;

  // Categorías con FOTO en la home (paridad con categorias-home.js: las
  // mismas 6 que muestra la web). El nombre es el valor EXACTO de la tabla
  // `categorias` porque alimenta el filtro de anuncios; la foto es el asset
  // local gemelo de img/categorias/. El resto de las categorías vive solo
  // en "Ver más" → AllCategoriesPage, igual que en la web.
  static const List<Map<String, String>> _homeCategories = [
    {'name': 'Inmuebles', 'foto': 'assets/images/categorias/bienes-raices.jpg'},
    {'name': 'Vehículos', 'foto': 'assets/images/categorias/vehiculos.jpg'},
    {
      'name': 'Electrónica',
      'foto': 'assets/images/categorias/electronica.jpg',
    },
    {
      'name': 'Hogar y Muebles',
      'foto': 'assets/images/categorias/hogar.jpg',
    },
    {'name': 'Moda y Belleza', 'foto': 'assets/images/categorias/moda.jpg'},
    {'name': 'Servicios', 'foto': 'assets/images/categorias/servicios.jpg'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _refreshUnreadMessages();
    _subscribeToMessages();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _refreshUnreadMessages();
  }

  Future<void> _refreshUnreadMessages() async {
    try {
      final count = await ChatService.loadUnreadCount();
      if (mounted && count != _unreadMessages) {
        setState(() => _unreadMessages = count);
      }
    } catch (_) {
      // Conserva el último contador si la conexión falla temporalmente.
    }
  }

  void _scheduleUnreadRefresh() {
    _unreadRefreshTimer?.cancel();
    _unreadRefreshTimer = Timer(
      const Duration(milliseconds: 250),
      _refreshUnreadMessages,
    );
  }

  void _subscribeToMessages() {
    final client = Supabase.instance.client;
    final userId = client.auth.currentUser?.id;
    if (userId == null) return;

    _messageChannel = client
        .channel('home-message-badge-$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'mensajes',
          callback: (_) => _scheduleUnreadRefresh(),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'mensajes',
          callback: (_) => _scheduleUnreadRefresh(),
        )
        .subscribe();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _unreadRefreshTimer?.cancel();
    final channel = _messageChannel;
    if (channel != null) {
      unawaited(Supabase.instance.client.removeChannel(channel));
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Lista de páginas de las 5 pestañas (IndexedStack).
    final List<Widget> pages = [
      _buildHomeContent(), // Index 0: Inicio
      FavoritesPage(key: _favoritesPageKey), // Index 1: Favoritos
      const UploadPage(), // Index 2: Publicar
      const ChatPage(), // Index 3: Chats
      const ProfilePage(), // Index 4: Tu perfil
    ];

    return Scaffold(
      backgroundColor: Colors.white,
      body: IndexedStack(
        index: _selectedIndex,
        children: pages,
      ),

      // 🚀 BOTÓN DE VENDER (naranja de marca Mc)
      floatingActionButton: SizedBox(
        width: 65,
        height: 65,
        child: FloatingActionButton(
          backgroundColor: Mc.naranja,
          elevation: 4,
          shape: const CircleBorder(),
          onPressed: _goToPublicar, // Nos lleva a "Publicar" (con guard sesión)
          child: const Icon(Icons.add, color: Colors.white, size: 35),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,

      bottomNavigationBar: BottomAppBar(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        height: 65,
        color: Colors.white,
        shape: const CircularNotchedRectangle(),
        notchMargin: 8,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                _buildNavItem(0, Icons.home_outlined, Icons.home, 'Inicio'),
                _buildNavItem(
                    1, Icons.favorite_border, Icons.favorite, 'Favoritos'),
              ],
            ),
            Row(
              children: [
                _buildNavItem(
                    3, Icons.chat_bubble_outline, Icons.chat_bubble, 'Chats'),
                _buildNavItem(4, Icons.person_outline, Icons.person, 'Perfil'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// Punto 2e: sin sesión activa NO se entra al flujo de publicar: se manda
  /// a login ('/'). Tras el login, el listener global de signedIn
  /// (main.dart) regresa a /home y el usuario puede volver a tocar Publicar.
  void _goToPublicar() {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Inicia sesión para publicar un anuncio.'),
        backgroundColor: Colors.red,
      ));
      Navigator.of(context).pushNamed('/');
      return;
    }
    setState(() => _selectedIndex = 2);
  }

  Widget _buildNavItem(
      int index, IconData icon, IconData activeIcon, String label) {
    bool isSelected = _selectedIndex == index;
    final navIcon = Icon(isSelected ? activeIcon : icon,
        color: isSelected ? Mc.naranja : Colors.grey);
    final iconWithBadge = index == 3 && _unreadMessages > 0
        ? Stack(
            clipBehavior: Clip.none,
            children: [
              navIcon,
              Positioned(
                top: -7,
                right: -10,
                child: Container(
                  constraints:
                      const BoxConstraints(minWidth: 18, minHeight: 18),
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFD93025),
                    border: Border.all(color: Colors.white, width: 1.5),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    _unreadMessages > 99 ? '99+' : '$_unreadMessages',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          )
        : navIcon;
    return GestureDetector(
      onTap: () {
        // 🚀 FORZAMOS LA RECARGA SI TOCAN FAVORITOS
        if (index == 1) {
          _favoritesPageKey.currentState?.fetchFavorites();
        }
        setState(() => _selectedIndex = index);
      },
      child: SizedBox(
        width: 70,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            iconWithBadge,
            Text(label,
                style: TextStyle(
                    color: isSelected ? Mc.naranja : Colors.grey,
                    fontSize: 11)),
          ],
        ),
      ),
    );
  }

  Widget _buildHomeContent() {
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          elevation: 0,
          backgroundColor: Mc.naranja,
          surfaceTintColor: Colors.transparent,
          automaticallyImplyLeading: false,
          toolbarHeight: 80,
          title: _buildSearchBubble(),
          centerTitle: true,
        ),
        SliverToBoxAdapter(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Mc.naranja, Mc.naranja.withValues(alpha: 0.05)],
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  child: HeroBanner(
                    onExplorarAnuncios: _explorarAnuncios,
                    onPublicarGratis: _goToPublicar,
                  ),
                ),
              ),

              Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Categorías',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold)),
                    // Volver a "Todos" cuando hay una categoría filtrada.
                    if (_selectedCategory != 'Todos')
                      GestureDetector(
                        onTap: () =>
                            setState(() => _selectedCategory = 'Todos'),
                        child: const Row(
                          children: [
                            Icon(Icons.close, size: 14, color: Mc.grisSuave),
                            SizedBox(width: 4),
                            Text('Quitar filtro',
                                style: TextStyle(
                                    fontSize: 12, color: Mc.grisSuave)),
                          ],
                        ),
                      ),
                  ],
                ),
              ),

              // 🚀 TARJETAS DE CATEGORÍA CON FOTO (paridad con categorias-home.js)
              SizedBox(
                height: 142,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  children: [
                    for (final cat in _homeCategories)
                      _CategoryCard(
                        name: cat['name']!,
                        foto: cat['foto']!,
                        selected: _selectedCategory == cat['name'],
                        onTap: () =>
                            setState(() => _selectedCategory = cat['name']!),
                      ),
                    // 👇 ESTA ES LA FLECHA TÁCTICA DE VER MÁS: Deportes y
                    // Hobbies, Mascotas, Negocios y Comunidad viven solo en
                    // AllCategoriesPage, igual que en la web.
                    _CategoryCard(
                      name: 'Ver más',
                      selected: false,
                      onTap: () async {
                        final selectionBack = await Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (context) => const AllCategoriesPage()),
                        );
                        // Si el usuario eligió algo (no cerró sin tocar nada)
                        if (selectionBack != null) {
                          setState(() =>
                              _selectedCategory = selectionBack.toString());
                        }
                      },
                    ),
                  ],
                ),
              ),

              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                        _selectedCategory == 'Todos'
                            ? 'Últimos Anuncios'
                            : 'En $_selectedCategory',
                        style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold)),
                    GestureDetector(
                      onTap: () => setState(() => _selectedCategory = 'Todos'),
                      child: const Text('Ver todos',
                          style: TextStyle(color: Mc.naranja)),
                    ),
                  ],
                ),
              ),

              // 🚀 CONEXIÓN REAL CON SUPABASE
              FeaturedAds(categoriaFiltro: _selectedCategory),
              const SizedBox(height: 100),
            ],
          ),
        ),
      ],
    );
  }

  // 🚀 BUSCADOR CONEXIÓN REAL
  Widget _buildSearchBubble() {
    return GestureDetector(
      onTap: _openSearch,
      child: Container(
        height: 45,
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(30),
        ),
        child: Row(
          children: [
            const SizedBox(width: 20),
            const Expanded(
              child: Text(
                'Buscar en Mercados Central',
                style: TextStyle(color: Colors.grey, fontSize: 14),
              ),
            ),
            // 📷 Búsqueda visual IA (busqueda-visual.js de la web): el botón
            // de cámara vive DENTRO del campo, a la derecha, siempre visible.
            GestureDetector(
              onTap: _buscarConFoto,
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                child: Icon(
                  Icons.photo_camera_outlined,
                  size: 20,
                  color: Colors.grey,
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.only(right: 16),
              child: Icon(Icons.search, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  /// CTA "Explorar anuncios" del hero: el listado con filtros (el
  /// equivalente a resultados.html sin query en la web).
  void _explorarAnuncios() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const ResultadosBusquedaPage()),
    );
  }

  /// Búsqueda visual IA (busqueda-visual.js de la web): cámara → foto
  /// comprimida (máx 1024 px, JPEG 0.8, máx 5 MB) → Edge Function en
  /// producción `busqueda-visual` (la MISMA de la web, sin endpoints
  /// nuevos) → el texto y la categoría devueltos rellenan el buscador y
  /// disparan la búsqueda automáticamente.
  Future<void> _buscarConFoto() async {
    // Límite diario ANTES de abrir la cámara: bloquea en el uso 16.
    if (await BusquedaVisualService.limiteAlcanzado()) {
      _mostrarMensaje(
          'Llegaste al límite diario de búsquedas por foto. Intenta mañana.');
      return;
    }

    XFile? foto;
    try {
      // Paridad con la web: máx 1024 px de lado y JPEG calidad 0.8.
      foto = await ImagePicker().pickImage(
        source: ImageSource.camera,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 80,
      );
    } catch (_) {
      _mostrarMensaje(
          'No pudimos abrir la cámara. Revisa los permisos de la app.');
      return;
    }
    if (foto == null || !mounted) return; // el usuario cerró la cámara

    final bytes = await foto.readAsBytes();
    if (!mounted) return;
    if (bytes.length > BusquedaVisualService.maxBytesFoto) {
      _mostrarMensaje(
          'La foto es demasiado grande. Intenta con otra más ligera.');
      return;
    }
    // dataURL JPEG que espera la Edge Function (data:image/jpeg;base64,...).
    final dataUrl = 'data:image/jpeg;base64,${base64Encode(bytes)}';

    // Spinner durante el proceso (overlay "Analizando tu foto…" de la web);
    // la llamada a la IA tiene timeout de 20 s.
    _mostrarOverlayAnalizando();

    final ResultadoVisual resultado;
    try {
      resultado = await BusquedaVisualService.analizarFoto(dataUrl);
    } on BusquedaVisualException catch (e) {
      if (mounted) _cerrarOverlay(e.mensaje);
      return;
    } catch (_) {
      if (mounted) {
        _cerrarOverlay('No se pudo analizar la foto. Intenta con otra.');
      }
      return;
    }
    if (!mounted) return;
    _cerrarOverlay();

    // Uso contado solo cuando la IA respondió bien (igual que la web).
    await BusquedaVisualService.contarBusqueda();
    if (!mounted) return;

    // Rellenar el texto + preseleccionar la categoría devuelta + ejecutar
    // la búsqueda automáticamente: la pantalla de resultados recibe
    // queryInicial (campo de texto relleno) y categoriaInicial (filtro
    // preseleccionado) y carga los resultados al abrir — el mismo flujo
    // que la web al navegar a resultados.html?q=<texto>&category=<cat>.
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ResultadosBusquedaPage(
          queryInicial: resultado.textoBusqueda,
          categoriaInicial: resultado.categoria,
        ),
      ),
    );
  }

  /// Overlay con spinner mientras la IA analiza (igual que la web).
  void _mostrarOverlayAnalizando() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Dialog(
        backgroundColor: Colors.transparent,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: Colors.white),
              SizedBox(height: 14),
              Text(
                'Analizando tu foto…',
                style: TextStyle(color: Colors.white, fontSize: 15),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Cierra el overlay del análisis y, si trae mensaje, lo muestra.
  void _cerrarOverlay([String? mensaje]) {
    Navigator.of(context, rootNavigator: true).pop();
    if (mensaje != null && mensaje.isNotEmpty) _mostrarMensaje(mensaje);
  }

  void _mostrarMensaje(String mensaje) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(mensaje)),
    );
  }

  Future<void> _openSearch() async {
    // Igual que la web: sugerencias/recientes al escribir (delegate) y, al
    // ENVIAR, la pantalla de resultados con filtros (resultados.html).
    final query = await showSearch(
      context: context,
      delegate: MercadoSearchDelegate(),
    );
    final texto = query?.trim() ?? '';
    if (texto.isEmpty || !mounted) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ResultadosBusquedaPage(queryInicial: texto),
      ),
    );
  }
}

/// Tarjeta de categoría con FOTO (paridad con mc-categorias.css):
/// tarjeta blanca de 110px, foto cuadrada con esquinas de 12px sobre fondo
/// #F3F4F6 y el nombre debajo en #1F2937. Si la foto no carga (onerror de la
/// web), se muestra la inicial sobre el fondo gris: nunca una imagen rota.
/// Con foto == null se dibuja el tile "Ver más" (ícono sobre el mismo gris).
class _CategoryCard extends StatelessWidget {
  final String name;
  final String? foto;
  final bool selected;
  final VoidCallback onTap;

  const _CategoryCard({
    required this.name,
    required this.selected,
    required this.onTap,
    this.foto,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.only(right: 12),
        child: Container(
          width: 110,
          padding: const EdgeInsets.fromLTRB(10, 10, 10, 12),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(
              color: selected ? Mc.naranja : const Color(0xFFE5E7EB),
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0D122129),
                blurRadius: 3,
                offset: Offset(0, 1),
              ),
            ],
          ),
          child: Column(
            children: [
              Container(
                height: 90,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(12),
                ),
                clipBehavior: Clip.antiAlias,
                child: foto == null
                    ? const Icon(
                        Icons.arrow_forward_ios_rounded,
                        size: 26,
                        color: Mc.grisSuave,
                      )
                    : Image.asset(
                        foto!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Center(
                          child: Text(
                            name.isEmpty
                                ? '?'
                                : name.substring(0, 1).toUpperCase(),
                            style: const TextStyle(
                              fontSize: 30,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF374151),
                            ),
                          ),
                        ),
                      ),
              ),
              const SizedBox(height: 8),
              Text(
                name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1F2937),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
