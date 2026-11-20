import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../theme/mc_colores.dart';

/// Paso de verificación con código OTP (FASE 1 · BLOQUE B).
///
/// Espejo EXACTO de showVerificationPanel/buildVerificationPanel en
/// auth-logic.js de la web: mismos endpoints de Supabase (verifyOtp type
/// 'signup', resend type 'signup'), misma cuenta regresiva de reenvío
/// (60 s) y los mismos mensajes:
///  - 'Te enviamos un código de verificación a tu correo'
///  - 'Ingresa el código de verificación.'
///  - 'Verificando código...'
///  - 'Código incorrecto o vencido'
///  - '¡Correo verificado! Continuando...'
///  - 'Código reenviado. Revisa tu correo.'
///  - 'No se pudo reenviar el código. Intenta de nuevo en un momento.'
///
/// Al verificar, verifyOtp crea la sesión normal de Supabase: el auth gate
/// (main.dart) reacciona al evento signedIn y lleva a /home sin cambios.
///
/// UI (FASE 1): 8 casillas individuales con auto-avance, retroceso a la
/// casilla anterior, y pegar el código completo (reparte los dígitos).
/// El input web acepta hasta 8 dígitos numéricos (maxLength 8).
class PasoVerificacionOtp extends StatefulWidget {
  const PasoVerificacionOtp({
    super.key,
    required this.email,
    this.password,
  });

  final String email;

  /// Contraseña del registro/login: fallback para abrir sesión si verifyOtp
  /// responde sin sesión (goHomeAfterVerification en auth-logic.js).
  final String? password;

  @override
  State<PasoVerificacionOtp> createState() => _PasoVerificacionOtpState();
}

class _PasoVerificacionOtpState extends State<PasoVerificacionOtp> {
  static const int _totalCasillas = 8;
  static const int _cooldownSegundos = 60; // RESEND_COOLDOWN_SECONDS (web)

  late final List<TextEditingController> _controllers;
  late final List<FocusNode> _focusNodes;
  Timer? _cooldownTimer;
  bool _isLoading = false;
  int _segundosRestantes = 0;
  String _mensajeEstado = '';
  bool _estadoError = false;
  bool _estadoOk = false;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(
      _totalCasillas,
      (_) => TextEditingController(),
    );
    _focusNodes = List.generate(
      _totalCasillas,
      (index) => FocusNode(
        onKeyEvent: (node, event) => _onKeyEvent(index, event),
      ),
    );
    // Igual que la web: el primer envío ya ocurrió (al registrarse o al
    // intentar iniciar sesión con el correo sin confirmar), así que el
    // panel abre con la cuenta regresiva de reenvío activa.
    _iniciarCooldown();
    // Autofocus en la primera casilla (codeInput.focus() en la web).
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _focusNodes.first.requestFocus();
    });
  }

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  // ==========================================
  // Teclado: retroceso en casilla vacía → casilla anterior
  // ==========================================
  KeyEventResult _onKeyEvent(int index, KeyEvent event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace) {
      if (_controllers[index].text.isEmpty && index > 0) {
        _controllers[index - 1].clear();
        _focusNodes[index - 1].requestFocus();
        return KeyEventResult.handled;
      }
    }
    return KeyEventResult.ignored;
  }

  // ==========================================
  // Entrada de dígitos: auto-avance + pegar código completo
  // ==========================================
  void _onChanged(int index, String value) {
    final digits = value.replaceAll(RegExp(r'\D'), '');
    if (digits.length > 1) {
      // Pegar el código completo: reparte desde la casilla actual.
      var i = index;
      for (final ch in digits.split('')) {
        if (i >= _totalCasillas) break;
        _controllers[i].text = ch;
        i++;
      }
      _focusNodes[(i - 1).clamp(0, _totalCasillas - 1)].requestFocus();
      setState(() {});
      return;
    }
    if (digits.isEmpty) {
      _controllers[index].clear();
      setState(() {});
      return;
    }
    _controllers[index].text = digits;
    if (index < _totalCasillas - 1) {
      _focusNodes[index + 1].requestFocus();
    }
    setState(() {});
  }

  String get _codigo => _controllers.map((c) => c.text).join();

  // ==========================================
  // Verificar (attachVerifySubmitHandler en auth-logic.js)
  // ==========================================
  Future<void> _verificar() async {
    final codigo = _codigo.trim();
    // Igual que la web: sin el código completo (8 dígitos) no se envía la
    // verificación. Mismo mensaje para vacío o incompleto (evita un
    // 'Código incorrecto o vencido' confuso cuando faltan casillas).
    if (codigo.length < _totalCasillas) {
      _setEstado('Ingresa el código de verificación.', error: true);
      return;
    }

    _setEstado('Verificando código...');
    setState(() => _isLoading = true);

    try {
      // Mismo endpoint que la web: verifyOtp({ email, token, type: 'signup' }).
      final response = await Supabase.instance.client.auth.verifyOTP(
        email: widget.email,
        token: codigo,
        type: OtpType.signup,
      );

      if (!mounted) return;
      _setEstado('¡Correo verificado! Continuando...', ok: true);

      // goHomeAfterVerification (web): si verifyOtp no dejó sesión activa,
      // abrirla con las credenciales del registro/login.
      var session = response.session;
      session ??= Supabase.instance.client.auth.currentSession;
      if (session == null && widget.password != null) {
        try {
          await Supabase.instance.client.auth.signInWithPassword(
            email: widget.email,
            password: widget.password!,
          );
        } catch (e) {
          debugPrint('No se pudo iniciar sesión tras verificar: $e');
        }
      }

      // Fallback: si la sesión quedó activa pero el listener global no
      // reaccionó (p. ej. ya había sesión), ir a /home directamente.
      await Future<void>.delayed(const Duration(milliseconds: 600));
      if (!mounted) return;
      if (Supabase.instance.client.auth.currentSession != null) {
        Navigator.of(context, rootNavigator: true)
            .pushNamedAndRemoveUntil('/home', (_) => false);
      }
    } on AuthException catch (e) {
      debugPrint('Error verificando código: ${e.message}');
      if (mounted) {
        setState(() => _isLoading = false);
        _setEstado('Código incorrecto o vencido', error: true);
      }
    } catch (e) {
      debugPrint('Error verificando código: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        _setEstado('Código incorrecto o vencido', error: true);
      }
    }
  }

  // ==========================================
  // Reenviar (handleResendCode en auth-logic.js)
  // ==========================================
  Future<void> _reenviar() async {
    if (_segundosRestantes > 0 || _isLoading) return;
    _iniciarCooldown(); // Cooldown inmediato tras cada envío (igual que web)

    try {
      // Mismo endpoint que la web: resend({ type: 'signup', email }).
      await Supabase.instance.client.auth.resend(
        type: OtpType.signup,
        email: widget.email,
      );
      if (mounted) _setEstado('Código reenviado. Revisa tu correo.', ok: true);
    } catch (e) {
      debugPrint('Error reenviando código: $e');
      if (mounted) {
        _setEstado(
          'No se pudo reenviar el código. Intenta de nuevo en un momento.',
          error: true,
        );
      }
    }
  }

  // ==========================================
  // Cuenta regresiva de reenvío: 60 s (startResendCooldown en la web)
  // ==========================================
  void _iniciarCooldown() {
    _cooldownTimer?.cancel();
    setState(() => _segundosRestantes = _cooldownSegundos);
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      final restantes = _segundosRestantes - 1;
      setState(() => _segundosRestantes = restantes < 0 ? 0 : restantes);
      if (restantes <= 0) timer.cancel();
    });
  }

  void _setEstado(String mensaje, {bool error = false, bool ok = false}) {
    setState(() {
      _mensajeEstado = mensaje;
      _estadoError = error;
      _estadoOk = ok;
    });
  }

  Color get _colorEstado => _estadoError
      ? Mc.peligro // #dc2626 (setVerifyStatus en la web)
      : _estadoOk
          ? Mc.exito
          : Mc.grisSuave;

  // ==========================================
  // UI
  // ==========================================
  InputDecoration _casillaDecoracion(FocusNode focusNode) {
    final activo = focusNode.hasFocus;
    return InputDecoration(
      counterText: '',
      filled: true,
      fillColor: Colors.white,
      contentPadding: EdgeInsets.zero,
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(11),
        borderSide: BorderSide(
          color: activo ? Mc.naranja : Mc.grisBorde,
          width: activo ? 2 : 1.5,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(11),
        borderSide: const BorderSide(color: Mc.naranja, width: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Mc.texto),
        title: const Text(
          'Verificar correo',
          style: TextStyle(color: Mc.texto, fontWeight: FontWeight.w600),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Mensajes idénticos a buildVerificationPanel (web).
                  const Text(
                    'Te enviamos un código de verificación a tu correo',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                      color: Mc.texto,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    widget.email,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Mc.grisSuave,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // 8 casillas individuales con auto-avance y pegado.
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      for (var i = 0; i < _totalCasillas; i++)
                        Expanded(
                          child: Padding(
                            padding: EdgeInsets.only(
                              right: i == _totalCasillas - 1 ? 0 : 6,
                            ),
                            child: TextField(
                              controller: _controllers[i],
                              focusNode: _focusNodes[i],
                              onChanged: (value) => _onChanged(i, value),
                              keyboardType: TextInputType.number,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w600,
                                color: Mc.texto,
                              ),
                              decoration: _casillaDecoracion(_focusNodes[i]),
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                                // SIN LengthLimitingTextInputFormatter(1):
                                // los formatters corren ANTES de onChanged y
                                // truncarían un pegado completo a 1 dígito,
                                // rompiendo el reparto. La longitud se controla
                                // en _onChanged.
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Estado (role="alert" en la web): mensajes idénticos.
                  Text(
                    _mensajeEstado,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13.5,
                      height: 18 / 13.5,
                      color: _mensajeEstado.isEmpty
                          ? Colors.transparent
                          : _colorEstado,
                    ),
                  ),
                  const SizedBox(height: 8),

                  ElevatedButton(
                    onPressed: _isLoading ? null : _verificar,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Mc.naranja,
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(52),
                      elevation: 0,
                      disabledBackgroundColor:
                          Mc.naranja.withValues(alpha: 0.6),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(26),
                      ),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            'Verificar',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                  ),
                  const SizedBox(height: 12),

                  // Reenviar código con la misma cuenta regresiva de la web:
                  // 'Reenviar código (Ns)' durante 60 s, luego 'Reenviar código'.
                  OutlinedButton(
                    onPressed: _segundosRestantes > 0 ? null : _reenviar,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Mc.texto,
                      minimumSize: const Size.fromHeight(44),
                      side: const BorderSide(color: Mc.grisBorde, width: 1.5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(11),
                      ),
                    ),
                    child: Text(
                      _segundosRestantes > 0
                          ? 'Reenviar código ($_segundosRestantes s)'
                          : 'Reenviar código',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
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
