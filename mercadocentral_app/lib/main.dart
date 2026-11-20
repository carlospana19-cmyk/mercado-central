import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/config/app_config.dart';
import 'core/utils/session_guard.dart';
import 'features/publish/screens/upload_page.dart'; // UploadPage para publicar
import 'home_page.dart';
import 'login_page.dart';
import 'theme/mc_colores.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Locale español para los formatos de fecha de intl (Formatos.fechaCorta).
  await initializeDateFormatting('es', null);

  await Supabase.initialize(
    url: AppConfig.supabaseUrl,
    anonKey: AppConfig.supabaseAnonKey,
  );

  // Auth gate: solo abrir en Home si la sesión existe Y está vigente
  // (renovable). Si estaba vencida y no renovable, SessionGuard la limpia
  // y la app abre en Login (evita escribir como anon tras restaurar datos
  // de una instalación anterior).
  final startAtHome =
      await SessionGuard.ensureFresh(Supabase.instance.client);

  runApp(MercadoCentralApp(startAtHome: startAtHome));
}

class MercadoCentralApp extends StatefulWidget {
  const MercadoCentralApp({super.key, required this.startAtHome});

  final bool startAtHome;

  @override
  State<MercadoCentralApp> createState() => _MercadoCentralAppState();
}

/// Registra el nombre de la ruta superior para el guard del listener global.
/// Las rutas sin nombre (pantallas empujadas con MaterialPageRoute) se
/// marcan como desconocidas para no heredar el nombre de la ruta anterior.
class _RouteTracker extends NavigatorObserver {
  String current = '/';
  void _update(String? name) => current = name ?? '';

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) =>
      _update(route.settings.name);

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) =>
      _update(previousRoute?.settings.name);

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) =>
      _update(newRoute?.settings.name);

  @override
  void didRemove(Route<dynamic> route, Route<dynamic>? previousRoute) =>
      _update(previousRoute?.settings.name);
}

class _MercadoCentralAppState extends State<MercadoCentralApp> {
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();
  final _routeTracker = _RouteTracker();
  StreamSubscription<AuthState>? _authSubscription;

  @override
  void initState() {
    super.initState();
    // Listener global de sesión. SOLO reacciona a signedIn / signedOut:
    // initialSession y tokenRefreshed se ignoran a propósito para no
    // re-navegar a /home en cada refresh de token.
    _authSubscription =
        Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      final navigator = _navigatorKey.currentState;
      if (navigator == null) return;

      if (data.event == AuthChangeEvent.signedIn) {
        // Guard: si ya estamos en /home, no re-navegar.
        if (_routeTracker.current != '/home') {
          navigator.pushNamedAndRemoveUntil('/home', (_) => false);
        }
      } else if (data.event == AuthChangeEvent.signedOut) {
        // Guard: si ya estamos en '/', no re-navegar.
        if (_routeTracker.current != '/') {
          navigator.pushNamedAndRemoveUntil('/', (_) => false);
        }
      }
    });
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: AppConfig.appTitle,
      navigatorKey: _navigatorKey,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Mc.naranja),
        useMaterial3: true,
      ),
      navigatorObservers: [_routeTracker],
      // Auth gate: con sesión vigente la app abre directo en Home.
      initialRoute: widget.startAtHome ? '/home' : '/',
      routes: {
        '/': (context) => const LoginPage(),
        '/home': (context) => const HomePage(),
        '/upload': (context) => const UploadPage(),
      },
    );
  }
}
