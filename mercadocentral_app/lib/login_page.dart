import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'features/auth/paso_verificacion_otp.dart';
import 'theme/mc_colores.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  /// Muestra el paso de verificación con código OTP de 8 dígitos
  /// (showVerificationStep en auth-logic.js de la web). Tras verificar,
  /// la sesión normal de Supabase activa el listener global de main.dart,
  /// que lleva a /home sin cambios.
  Future<void> _abrirVerificacion() async {
    if (!mounted) return;
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => PasoVerificacionOtp(
          email: _emailController.text.trim(),
          password: _passwordController.text.trim(),
        ),
      ),
    );
  }

  /// El error de correo sin confirmar (login con cuenta nueva): code
  /// 'email_not_confirmed' o el mensaje HTTP 'Email not confirmed' — mismo
  /// criterio que isEmailNotConfirmed en auth-logic.js de la web.
  bool _esCorreoSinConfirmar(Object error) {
    final mensaje = error.toString().toLowerCase();
    return mensaje.contains('email_not_confirmed') ||
        mensaje.contains('email not confirmed');
  }

  Future<void> _signIn() async {
    setState(() => _isLoading = true);

    try {
      await Supabase.instance.client.auth.signInWithPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );
      // La navegación a /home la hace el listener global del widget raíz
      // (AuthChangeEvent.signedIn). No navegar aquí para no duplicar rutas.
    } catch (e) {
      if (mounted) {
        // Correo sin confirmar: mostrar el paso de verificación (igual que
        // la web) en lugar del error crudo.
        if (_esCorreoSinConfirmar(e)) {
          setState(() => _isLoading = false);
          await _abrirVerificacion();
          return;
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _signUp() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text(
                'Completa el correo y una contraseña de al menos 8 caracteres'),
            backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      // Igual que handleRegister en auth-logic.js de la web: la fila de
      // profiles la crea el trigger on_auth_user_created con los metadatos
      // (nombre_negocio por defecto = prefijo del correo).
      final response = await Supabase.instance.client.auth.signUp(
        email: email,
        password: password,
        data: {'nombre_negocio': email.split('@')[0]},
      );

      if (!mounted) return;
      if (response.session == null) {
        // Registro con confirmación de correo: la web muestra el paso de
        // verificación con el código enviado al correo.
        setState(() => _isLoading = false);
        await _abrirVerificacion();
        return;
      }
      // Con sesión inmediata (confirmación desactivada) el listener global
      // reacciona al evento signedIn y abre /home.
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _resetPassword() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Escribe tu correo para recuperar la contraseña'),
            backgroundColor: Colors.orange),
      );
      return;
    }
    try {
      await Supabase.instance.client.auth.resetPasswordForEmail(email);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Te enviamos el enlace de recuperación'),
              backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _googleSignIn() async {
    setState(() => _isLoading = true);

    try {
      final launched = await Supabase.instance.client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'mercadoscentral://login-callback',
      );
      if (!launched) throw Exception('No se pudo abrir el inicio de sesión.');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Error con Google: $e'),
              backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                children: [
                  Center(
                    child: Image.asset(
                      'assets/images/logo-mercado-central.jpeg',
                      height: 140,
                      fit: BoxFit.contain,
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Bienvenido',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Mc.texto,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Tu plataforma de clasificados',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, color: Mc.grisSuave),
                  ),
                  const SizedBox(height: 32),
                  TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      labelText: 'Correo electrónico',
                      prefixIcon: const Icon(Icons.mail_outline),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Mc.grisBorde),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide:
                            const BorderSide(color: Mc.naranja, width: 2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'Contraseña',
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                        ),
                        onPressed: () {
                          setState(() => _obscurePassword = !_obscurePassword);
                        },
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Mc.grisBorde),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide:
                            const BorderSide(color: Mc.naranja, width: 2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _isLoading ? null : _signIn,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Mc.naranja,
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(52),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(26),
                      ),
                    ),
                    child: const Text(
                      'Entrar',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Row(
                    children: [
                      Expanded(child: Divider()),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          'o',
                          style: TextStyle(color: Mc.grisSuave),
                        ),
                      ),
                      Expanded(child: Divider()),
                    ],
                  ),
                  const SizedBox(height: 24),
                  OutlinedButton.icon(
                    onPressed: _isLoading ? null : _googleSignIn,
                    icon: SvgPicture.asset(
                      'assets/images/google_g.svg',
                      width: 20,
                      height: 20,
                    ),
                    label: const Text(
                      'Continuar con Google',
                      style: TextStyle(
                        color: Color(0xFF3C4043),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(52),
                      side: const BorderSide(color: Mc.grisBorde),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(26),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: _resetPassword,
                    child: const Text(
                      '¿Olvidaste tu contraseña?',
                      style: TextStyle(
                        color: Mc.naranja,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: _signUp,
                    child: const Text(
                      'Regístrate',
                      style: TextStyle(
                        color: Mc.naranja,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
