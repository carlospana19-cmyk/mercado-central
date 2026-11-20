import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/services/profile_photo_service.dart';
import '../../../core/utils/session_guard.dart';
import '../../../features/planes/plan_limits.dart';
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
  bool _subiendoFoto = false;

  @override
  void initState() {
    super.initState();
    _overview = _loadOverview();
  }

  // Columnas explícitas (las MISMAS que consulta la web en
  // panel-unificado-logic.js): la tabla profiles tiene column-grants
  // (migración 0002) y select('*') — o pedir una columna sin grant como
  // email — lanza 42501 aunque la sesión sea válida. El email se muestra
  // desde auth (user.email), igual que hace la web.
  static const String _profileColumns =
      'id, nombre_completo, nombre_negocio, url_foto_perfil, telefono, '
      'whatsapp, tipo_negocio, descripcion, provincia, distrito, created_at';

  Future<_ProfileOverview> _loadOverview() async {
    // Blindaje: con sesión muerta (token no renovable) el guard la limpia y
    // la app muestra el panel de "Iniciar sesión" en lugar de consultar como
    // anon (que produce 42501 y pantallas vacías).
    final sessionOk = await SessionGuard.ensureFresh(_client);
    final user = _client.auth.currentUser;
    if (!sessionOk || user == null) {
      return const _ProfileOverview(profile: {}, total: 0, active: 0, sold: 0);
    }

    // Perfil y stats se cargan INDEPENDIENTES: si una consulta falla, la otra
    // igual se muestra (jamás una pantalla en blanco por un solo error).
    Map<String, dynamic> profile = {};
    var profileFailed = false;
    var total = 0;
    var sold = 0;
    var statsFailed = false;
    var plan = 'free';

    try {
      final profileResult = await _client
          .from('profiles')
          .select(_profileColumns)
          .eq('id', user.id)
          .maybeSingle();
      profile = profileResult == null
          ? <String, dynamic>{}
          : Map<String, dynamic>.from(profileResult);
    } catch (_) {
      // Ej. código 42501 con sesión degradada → panel de sesión expirada.
      profileFailed = true;
    }

    try {
      final adsResult = await _client
          .from('anuncios')
          .select('is_sold, selected_plan')
          .eq('user_id', user.id);
      final ads = List<Map<String, dynamic>>.from(adsResult);
      sold = ads.where((ad) => ad['is_sold'] == true).length;
      total = ads.length;
      // Plan del usuario SIEMPRE desde `suscripciones` (la misma fuente del
      // saldo IA) — NO desde el último anuncio: si el usuario tiene
      // suscripción pero 0 anuncios, el último anuncio daría plan equivocado.
      try {
        final sub = await _client
            .from('suscripciones')
            .select('plan_tipo, limite_ia, optimizations_ia_usadas')
            .eq('user_id', user.id)
            .maybeSingle();
        if (sub != null) {
          final planTipo = (sub['plan_tipo'] ?? '').toString().trim();
          if (planTipo.isNotEmpty) {
            plan = PlanLimits.normalize(planTipo);
          } else {
            // Sin columna de plan: derivar desde limite_ia (mapeo en PlanLimits).
            final limite = (sub['limite_ia'] as num?)?.toInt() ?? 0;
            plan = PlanLimits.planFromLimiteIA(limite);
          }
        }
      } catch (_) {
        // Tabla sin columna plan_tipo o acceso denegado: fallback al último
        // anuncio (comportamiento anterior).
        final planRaw = ads.isEmpty
            ? 'free'
            : (ads.first['selected_plan'] ?? 'free').toString();
        plan = PlanLimits.normalize(planRaw);
      }
    } catch (_) {
      statsFailed = true;
    }

    return _ProfileOverview(
      profile: profile,
      total: total,
      active: total - sold,
      sold: sold,
      plan: plan,
      profileFailed: profileFailed,
      statsFailed: statsFailed,
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
          final user = _client.auth.currentUser;
          if (user == null) {
            return _ErrorPanel(
              message: 'Inicia sesión para ver tu perfil.',
              actionLabel: 'Iniciar sesión',
              onAction: () => Navigator.of(context)
                  .pushNamedAndRemoveUntil('/', (route) => false),
            );
          }
          if (overview.profileFailed) {
            // La consulta del perfil falló (ej. código 42501 con sesión
            // muerta): mensaje claro + botón para re-autenticar.
            // Jamás una pantalla en blanco.
            return _ErrorPanel(
              message: 'Tu sesión expiró. Iniciá sesión de nuevo.',
              actionLabel: 'Iniciar sesión',
              onAction: () => Navigator.of(context)
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
                const SizedBox(height: 12),
                _planCard(overview.plan),
                _statsCard(overview),
                if (overview.statsFailed)
                  const Padding(
                    padding: EdgeInsets.only(top: 6),
                    child: Text(
                      'No se pudieron cargar los conteos. Desliza hacia abajo para reintentar.',
                      style: TextStyle(color: Mc.grisSuave, fontSize: 12),
                      textAlign: TextAlign.center,
                    ),
                  ),
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
    // La web muestra 'Cuenta Personal' cuando no hay nombre de negocio
    // (panel-unificado-logic.js: nombre_negocio || 'Cuenta Personal').
    final business = (profile['nombre_negocio'] ?? '').toString().trim();
    final phone = (profile['telefono'] ?? '').toString().trim();
    final whatsapp = (profile['whatsapp'] ?? '').toString().trim();
    final email = (user?.email ?? '').toString().trim();
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
          // Foto con botón de cámara (paridad con el header de la web: la
          // foto se cambia directo desde el panel, sin abrir el formulario).
          GestureDetector(
            onTap: _subiendoFoto ? null : _cambiarFoto,
            child: SizedBox(
              width: 68,
              height: 68,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  CircleAvatar(
                    radius: 34,
                    backgroundColor: const Color(0xFFF1F3F5),
                    backgroundImage: photo == null || photo.isEmpty
                        ? null
                        : NetworkImage(photo),
                    child: photo == null || photo.isEmpty
                        ? const Icon(Icons.person_outline,
                            size: 34, color: Mc.grisSuave)
                        : null,
                  ),
                  Positioned(
                    right: -2,
                    bottom: -2,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Mc.naranja,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: _subiendoFoto
                          ? const SizedBox(
                              width: 11,
                              height: 11,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.photo_camera,
                              size: 12, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
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
                Text(
                  business.isNotEmpty ? business : 'Cuenta Personal',
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
                if (whatsapp.isNotEmpty)
                  Text(
                    'WhatsApp: $whatsapp',
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

  /// Cambia la foto directo desde el panel (paridad con el botón de cámara
  /// del header de la web): hoja Cámara/Galería → subida al mismo bucket y
  /// ruta que la web → refresh del panel.
  Future<void> _cambiarFoto() async {
    final source = await ProfilePhotoService.seleccionarOrigen(context);
    if (source == null || !mounted) return;

    setState(() => _subiendoFoto = true);
    try {
      final url =
          await ProfilePhotoService.cambiarFoto(_client, source: source);
      if (!mounted) return;
      if (url != null) {
        _aviso('Foto de perfil actualizada.');
        await _refresh();
      }
    } on ProfilePhotoException catch (error) {
      if (mounted) _aviso(error.mensaje, isError: true);
    } finally {
      if (mounted) setState(() => _subiendoFoto = false);
    }
  }

  void _aviso(String mensaje, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(mensaje),
        backgroundColor: isError ? Colors.red : null,
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

  /// Tarjeta del plan del usuario: nombre y límites del plan (única fuente:
  /// PlanLimits). Si el plan no incluye video o IA, CTA "Mejorar plan" → web.
  Widget _planCard(String plan) {
    final limites = PlanLimits.planes[plan] ?? PlanLimits.planes['free']!;
    final tieneVideo = limites['hasVideo'] == true;
    final tieneIA = (limites['limiteIA'] as int? ?? 0) > 0;
    final puedeMejorar = !tieneVideo || !tieneIA;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE8ECEF)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.workspace_premium, color: Mc.naranja, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Tu plan: ${limites['label']}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    color: Mc.texto,
                    fontSize: 15,
                  ),
                ),
              ),
              Text(
                '\$${limites['price']}',
                style: const TextStyle(color: Mc.naranjaOscuro, fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            '${limites['maxFotos']} fotos · ${limites['vigenciaDias']} días de vigencia'
            '${tieneVideo ? ' · 1 video HD' : ''}'
            '${tieneIA ? ' · ${limites['limiteIA']} optimizaciones IA' : ''}',
            style: const TextStyle(color: Mc.grisSuave, fontSize: 12.5),
          ),
          if (puedeMejorar) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: () => launchUrl(
                  Uri.parse(PlanLimits.webUrl),
                  mode: LaunchMode.externalApplication,
                ),
                style: FilledButton.styleFrom(backgroundColor: Mc.naranja),
                icon: const Icon(Icons.upgrade, size: 16),
                label: const Text('Mejorar plan',
                    style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
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
  // Plan del usuario (derivado del último anuncio; fallback free).
  final String plan;
  final bool profileFailed;
  final bool statsFailed;

  const _ProfileOverview({
    required this.profile,
    required this.total,
    required this.active,
    required this.sold,
    this.plan = 'free',
    this.profileFailed = false,
    this.statsFailed = false,
  });
}

class _ErrorPanel extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;
  final String? actionLabel;
  final VoidCallback? onAction;

  const _ErrorPanel({
    required this.message,
    this.onRetry,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(message, textAlign: TextAlign.center),
              if (actionLabel != null && onAction != null) ...[
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: onAction,
                  style: FilledButton.styleFrom(backgroundColor: Mc.naranja),
                  child: Text(actionLabel!),
                ),
              ],
              if (onRetry != null) ...[
                const SizedBox(height: 12),
                OutlinedButton(
                    onPressed: onRetry, child: const Text('Reintentar')),
              ],
            ],
          ),
        ),
      );
}
