import 'package:flutter/material.dart';
import 'package:mercadocentral_app/core/theme/app_colors.dart';
import 'package:mercadocentral_app/features/home/widgets/featured_ads.dart';
import 'package:mercadocentral_app/features/home/widgets/hero_banner.dart';
import 'package:mercadocentral_app/features/search/delegates/mercado_search_delegate.dart';
import 'package:mercadocentral_app/features/search/screens/all_categories_page.dart';

// Importaciones necesarias para las otras pestañas
import 'package:mercadocentral_app/features/publish/screens/upload_page.dart';
import 'package:mercadocentral_app/features/profile/screens/profile_page.dart';
import 'package:mercadocentral_app/features/favorites/screens/favorites_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;
  String _selectedCategory = 'Todos';

  // 1. Lista de burbujas en el home (reducida a 6 populares + "Ver más")
  final List<Map<String, dynamic>> _categories = [
    {'name': 'Todos', 'icon': Icons.grid_view_rounded},
    {'name': 'Vehículos', 'icon': Icons.directions_car_filled_rounded},
    {'name': 'Inmuebles', 'icon': Icons.home_work_rounded},
    {'name': 'Electrónica', 'icon': Icons.devices_rounded},
    {'name': 'Comunidad', 'icon': Icons.people_alt_rounded},
    {'name': 'Hogar', 'icon': Icons.chair_rounded},
    // 👇 ESTA ES LA FLECHA TÁCTICA DE VER MÁS
    {'name': 'Ver más', 'icon': Icons.arrow_forward_ios_rounded},
  ];

  @override
  Widget build(BuildContext context) {
    // 🚨 REEMPLAZA TU LISTA _PAGES EXACTAMENTE POR ESTA:
    final List<Widget> _pages = [
      _buildHomeContent(), // Index 0: Inicio
      FavoritesPage(key: favoritesPageKey), // Index 1: Favoritos
      const UploadPage(), // Index 2: Publicar
      const Center(
          child:
              Text('Mis Mensajes', style: TextStyle(fontSize: 20))), // Index 3
      const ProfilePage(), // Index 4: Tu perfil
    ];

    return Scaffold(
      backgroundColor: Colors.white,
      body: IndexedStack(
        index: _selectedIndex,
        children: _pages,
      ),

      // 🚀 BOTÓN DE VENDER CON TU COLOR TURQUESA
      floatingActionButton: SizedBox(
        width: 65,
        height: 65,
        child: FloatingActionButton(
          backgroundColor: const Color(0xFF00BFAE),
          elevation: 4,
          shape: const CircleBorder(),
          onPressed: () =>
              setState(() => _selectedIndex = 2), // Nos lleva a "Publicar"
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

  Widget _buildNavItem(
      int index, IconData icon, IconData activeIcon, String label) {
    bool isSelected = _selectedIndex == index;
    return GestureDetector(
      onTap: () {
        // 🚀 FORZAMOS LA RECARGA SI TOCAN FAVORITOS
        if (index == 1) {
          favoritesPageKey.currentState?.fetchFavorites();
        }
        setState(() => _selectedIndex = index);
      },
      child: Container(
        width: 70,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(isSelected ? activeIcon : icon,
                color: isSelected ? const Color(0xFF00BFAE) : Colors.grey),
            Text(label,
                style: TextStyle(
                    color: isSelected ? const Color(0xFF00BFAE) : Colors.grey,
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
          backgroundColor: const Color(0xFF00BFAE),
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
                    colors: [
                      const Color(0xFF00BFAE),
                      const Color(0xFF00BFAE).withOpacity(0.05)
                    ],
                  ),
                ),
                child: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: HeroBanner(),
                ),
              ),

              const Padding(
                padding: EdgeInsets.fromLTRB(16, 20, 16, 10),
                child: Text('Categorías',
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),

              // 🚀 LÓGICA DE CATEGORÍAS CONECTADA
              SizedBox(
                height: 100,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  children: _categories.map((cat) {
                    bool isSelected = _selectedCategory == cat['name'];
                    return GestureDetector(
                      // 🚀 LÓGICA DE NAVEGACIÓN TÁCTICA
                      onTap: () async {
                        if (cat['name'] == 'Ver más') {
                          // 1. Si tocan "Ver más", abre la nueva pantalla
                          final selectionBack = await Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (context) =>
                                    const AllCategoriesPage()),
                          );

                          // 2. Si el usuario eligió algo (no cerró la pantalla sin tocar nada)
                          if (selectionBack != null) {
                            setState(() {
                              _selectedCategory =
                                  selectionBack.toString(); // Cambia el filtro
                            });
                          }
                        } else {
                          // 3. Lógica normal: tocar cualquier otra burbuja
                          setState(() => _selectedCategory = cat['name']);
                        }
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: Column(
                          children: [
                            CircleAvatar(
                              radius: 28,
                              backgroundColor: isSelected
                                  ? const Color(0xFF00BFAE)
                                  : Colors.white,
                              child: Icon(cat['icon'],
                                  color: isSelected
                                      ? Colors.white
                                      : Colors.grey[600]),
                            ),
                            const SizedBox(height: 5),
                            Text(cat['name'],
                                style: TextStyle(
                                    fontSize: 12,
                                    color: isSelected
                                        ? const Color(0xFF00BFAE)
                                        : Colors.black87)),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
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
                    const Text('Ver todos',
                        style: TextStyle(color: Color(0xFF00BFAE))),
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
  // 🚀 BUSCADOR CONEXIÓN REAL
  Widget _buildSearchBubble() {
    return GestureDetector(
      onTap: () => showSearch(
        context: context,
        delegate: MercadoSearchDelegate(),
      ),
      child: Container(
        height: 45,
        width: double.infinity,
        alignment:
            Alignment.centerLeft, // Mantiene el texto alineado a la izquierda
        decoration: BoxDecoration(
            color: Colors.white, borderRadius: BorderRadius.circular(30)),
        // 🚨 Lupa eliminada, solo queda el texto con un buen margen
        child: const Padding(
          padding: EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            'Buscar en Mercado Central',
            style: TextStyle(color: Colors.grey, fontSize: 14),
          ),
        ),
      ),
    );
  }
}
