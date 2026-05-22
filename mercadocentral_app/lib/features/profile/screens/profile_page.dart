import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import 'my_ads_page.dart';
import 'my_reviews_page.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Mi Panel',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Colors.black),
            onPressed: () {},
          ),
        ],
      ),
      body: ListView(
        children: [
          _buildProfileHeader(),

          // 1. DASHBOARD DE ESTADÍSTICAS (Nuevo)
          _buildQuickStats(),

          const Divider(thickness: 8, color: Color(0xFFF5F5F5)),

          // 2. BILLETERA DE TOKENS (Basado en tu lógica de tokens)
          _buildTokenWallet(),

          const Divider(thickness: 8, color: Color(0xFFF5F5F5)),

          _buildMenuSection('MI ACTIVIDAD', [
            _buildMenuItem(Icons.layers_outlined, 'Mis Anuncios', () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const MyAdsPage()),
              );
            }, badge: 'Ver'),
            _buildMenuItem(Icons.favorite_border, 'Mis Favoritos', () {}),
            _buildMenuItem(Icons.star_border, 'Mis Reseñas', () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const MyReviewsPage()),
              );
            }),
          ]),

          const Divider(thickness: 8, color: Color(0xFFF5F5F5)),

          _buildMenuSection('PLANES Y PAGOS', [
            _buildMenuItem(
              Icons.workspace_premium_outlined,
              'Mi Suscripción',
              () {},
              subtitle: 'Plan Básico',
            ),
            _buildMenuItem(Icons.history, 'Historial de Facturación', () {}),
          ]),

          const Divider(thickness: 8, color: Color(0xFFF5F5F5)),

          _buildMenuSection('SOPORTE', [
            _buildMenuItem(Icons.help_outline, 'Centro de Ayuda', () {}),
            _buildMenuItem(
              Icons.logout,
              'Cerrar Sesión',
              () {},
              isDanger: true,
            ),
          ]),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  // --- WIDGETS NUEVOS ---

  Widget _buildQuickStats() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _statItem('3', 'Activos'),
          _statItem('12', 'Vendidos'),
          _statItem('450', 'Vistas'),
          _statItem('28', 'Chats'),
        ],
      ),
    );
  }

  Widget _statItem(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }

  Widget _buildTokenWallet() {
    return Container(
      margin: const EdgeInsets.all(20),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF00c2cb), Color(0xFF008b92)],
        ),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Row(
        children: [
          const Icon(Icons.toll, color: Colors.white, size: 30),
          const SizedBox(width: 15),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Billetera de Tokens',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
                Text(
                  '5 Tokens Disponibles',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppColors.primary,
            ),
            child: const Text('RECARGAR'),
          ),
        ],
      ),
    );
  }

  // --- COMPONENTES DE DISEÑO ---

  Widget _buildProfileHeader() {
    return ListTile(
      contentPadding: const EdgeInsets.all(20),
      leading: const CircleAvatar(
        radius: 30,
        backgroundImage: NetworkImage('https://via.placeholder.com/150'),
      ),
      title: const Row(
        children: [
          Text(
            'Carlos MC',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          SizedBox(width: 5),
          Icon(
            Icons.verified,
            color: Colors.blue,
            size: 18,
          ), // Badge de verificado
        ],
      ),
      subtitle: const Text('Miembro desde 2024'),
      trailing: OutlinedButton(onPressed: () {}, child: const Text('EDITAR')),
    );
  }

  Widget _buildMenuSection(String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 15, 20, 5),
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: Colors.grey,
            ),
          ),
        ),
        ...items,
      ],
    );
  }

  Widget _buildMenuItem(
    IconData icon,
    String title,
    VoidCallback onTap, {
    String? badge,
    String? subtitle,
    bool isDanger = false,
  }) {
    return ListTile(
      leading: Icon(icon, color: isDanger ? Colors.red : Colors.black87),
      title: Text(
        title,
        style: TextStyle(
          color: isDanger ? Colors.red : Colors.black,
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: subtitle != null ? Text(subtitle) : null,
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (badge != null)
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: Text(
                badge,
                style: const TextStyle(color: Colors.white, fontSize: 10),
              ),
            ),
          const Icon(Icons.chevron_right, color: Colors.grey),
        ],
      ),
      onTap: onTap,
    );
  }
}
