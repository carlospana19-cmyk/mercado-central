import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../theme/mc_colores.dart';
import '../../chat/screens/chat_page.dart';
import '../../favorites/screens/favorites_page.dart';
import 'edit_profile_page.dart';
import 'my_ads_page.dart';
import 'my_reviews_page.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final _client = Supabase.instance.client;
  late Future<_ProfileOverview> _overview;

  @override
  void initState() {
    super.initState();
    _overview = _loadOverview();
  }

  Future<_ProfileOverview> _loadOverview() async {
    final user = _client.auth.currentUser;
    if (user == null) {
      return const _ProfileOverview(profile: {}, total: 0, active: 0, sold: 0);
    }

    final profileResult = await _client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
    final adsResult =
        await _client.from('anuncios').select('is_sold').eq('user_id', user.id);
    final profile = profileResult == null
        ? <String, dynamic>{}
        : Map<String, dynamic>.from(profileResult);
    final ads = List<Map<String, dynamic>>.from(adsResult);
    final sold = ads.where((ad) => ad['is_sold'] == true).length;

    return _ProfileOverview(
      profile: profile,
      total: ads.length,
      active: ads.length - sold,
      sold: sold,
    );
  }

  Future<void> _refresh() async {
    setState(() => _overview = _loadOverview());
    await _overview;
  }

  Future<void> _openEditProfile() async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(builder: (_) => const EditProfilePage()),
    );
    if (saved == true && mounted) await _refresh();
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('¿Cerrar sesión?'),
        content:
            const Text('Tendrás que iniciar sesión de nuevo para continuar.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: Mc.naranja),
            child: const Text('Cerrar sesión'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    await _client.auth.signOut();
    if (mounted) {
      Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
    }
  }

  void _openPage(Widget page) {
    Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => page));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      appBar: AppBar(
        title: const Text(
          'Mi Panel',
          style: TextStyle(fontWeight: FontWeight.bold, color: Mc.texto),
        ),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        actions: [
          IconButton(
            tooltip: 'Cerrar sesión',
            onPressed: _logout,
            icon: const Icon(Icons.logout, color: Mc.grisSuave),
          ),
        ],
      ),
      body: FutureBuilder<_ProfileOverview>(
        future: _overview,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: Mc.naranja),
            );
          }
          if (snapshot.hasError) {
            return _ErrorPanel(
              message: 'No se pudo cargar tu panel.',
              onRetry: _refresh,
            );
          }

          final overview = snapshot.data ??
              const _ProfileOverview(profile: {}, total: 0, active: 0, sold: 0);
          if (_client.auth.currentUser == null) {
            return _ErrorPanel(
              message: 'Inicia sesión para ver tu perfil.',
              onRetry: () => Navigator.of(context)
                  .pushNamedAndRemoveUntil('/', (route) => false),
            );
          }

          return RefreshIndicator(
            color: Mc.naranja,
            onRefresh: _refresh,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              children: [
                _profileHeader(overview.profile),
                const SizedBox(height: 14),
                _statsCard(overview),
                const SizedBox(height: 22),
                _sectionLabel('MI ACTIVIDAD'),
                _menuItem(
                  Icons.layers_outlined,
                  'Mis anuncios',
                  'Administra, edita o marca tus publicaciones como vendidas.',
                  () => _openPage(const MyAdsPage()),
                ),
                _menuItem(
                  Icons.favorite_border,
                  'Mis favoritos',
                  'Anuncios que guardaste.',
                  () => _openPage(const FavoritesPage()),
                ),
                _menuItem(
                  Icons.chat_bubble_outline,
                  'Mensajes',
                  'Conversaciones con compradores y vendedores.',
                  () => _openPage(const ChatPage()),
                ),
                _menuItem(
                  Icons.star_outline,
                  'Mis reseñas',
                  'Opiniones recibidas y reseñas que has enviado.',
                  () => _openPage(const MyReviewsPage()),
                ),
                const SizedBox(height: 22),
                _sectionLabel('CUENTA'),
                _menuItem(
                  Icons.person_outline,
                  'Editar mi perfil',
                  'Datos personales, negocio, contacto y ubicación.',
                  _openEditProfile,
                ),
                const SizedBox(height: 22),
                _menuItem(
                  Icons.logout,
                  'Cerrar sesión',
                  'Salir de tu cuenta de Mercados Central.',
                  _logout,
                  isDanger: true,
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _profileHeader(Map<String, dynamic> profile) {
    final user = _client.auth.currentUser;
    final fullName = (profile['nombre_completo'] ??
            user?.userMetadata?['full_name'] ??
            user?.userMetadata?['name'] ??
            'Usuario')
        .toString();
    final business = (profile['nombre_negocio'] ?? '').toString().trim();
    final phone = (profile['telefono'] ?? '').toString().trim();
    final email = (profile['email'] ?? user?.email ?? '').toString().trim();
    final photo = profile['url_foto_perfil']?.toString();

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE8ECEF)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 34,
            backgroundColor: const Color(0xFFF1F3F5),
            backgroundImage:
                photo == null || photo.isEmpty ? null : NetworkImage(photo),
            child: photo == null || photo.isEmpty
                ? const Icon(Icons.person_outline,
                    size: 34, color: Mc.grisSuave)
                : null,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  fullName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Mc.texto,
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (business.isNotEmpty)
                  Text(
                    business,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Mc.grisSuave),
                  ),
                if (email.isNotEmpty)
                  Text(
                    email,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Mc.grisSuave,
                      fontSize: 12,
                    ),
                  ),
                if (phone.isNotEmpty)
                  Text(
                    phone,
                    style: const TextStyle(
                      color: Mc.grisSuave,
                      fontSize: 12,
                    ),
                  ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Editar perfil',
            onPressed: _openEditProfile,
            icon: const Icon(Icons.edit_outlined, color: Mc.naranja),
          ),
        ],
      ),
    );
  }

  Widget _statsCard(_ProfileOverview overview) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE8ECEF)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          _statItem(overview.total, 'Anuncios'),
          _statItem(overview.active, 'Activos'),
          _statItem(overview.sold, 'Vendidos'),
        ],
      ),
    );
  }

  Widget _statItem(int value, String label) => Expanded(
        child: Column(
          children: [
            Text(
              '$value',
              style: const TextStyle(
                color: Mc.naranjaOscuro,
                fontSize: 21,
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              label,
              style: const TextStyle(color: Mc.grisSuave, fontSize: 12),
            ),
          ],
        ),
      );

  Widget _sectionLabel(String title) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 0, 4, 8),
        child: Text(
          title,
          style: const TextStyle(
            color: Mc.grisSuave,
            fontSize: 11,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.6,
          ),
        ),
      );

  Widget _menuItem(
    IconData icon,
    String title,
    String subtitle,
    VoidCallback onTap, {
    bool isDanger = false,
  }) =>
      Card(
        margin: const EdgeInsets.only(bottom: 8),
        elevation: 0,
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: Color(0xFFE8ECEF)),
        ),
        child: ListTile(
          onTap: onTap,
          leading: Icon(
            icon,
            color: isDanger ? Colors.red : Mc.naranja,
          ),
          title: Text(
            title,
            style: TextStyle(
              color: isDanger ? Colors.red : Mc.texto,
              fontWeight: FontWeight.w600,
            ),
          ),
          subtitle: Text(subtitle),
          trailing: const Icon(Icons.chevron_right, color: Mc.grisSuave),
        ),
      );
}

class _ProfileOverview {
  final Map<String, dynamic> profile;
  final int total;
  final int active;
  final int sold;

  const _ProfileOverview({
    required this.profile,
    required this.total,
    required this.active,
    required this.sold,
  });
}

class _ErrorPanel extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorPanel({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(message, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              OutlinedButton(
                  onPressed: onRetry, child: const Text('Reintentar')),
            ],
          ),
        ),
      );
}
