import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../features/planes/plan_limits.dart';
import '../../../theme/mc_colores.dart';

class _PlanInfo {
  final String id;
  final String title;
  final String price;
  final String? badge;
  final Color color;
  final List<String> benefits;

  const _PlanInfo({
    required this.id,
    required this.title,
    required this.price,
    required this.color,
    required this.benefits,
    this.badge,
  });
}

/// Copys de marketing (badges, insignias, portada) son UI propia de la app;
/// los límites (fotos, IA, video, vigencia, precio) vienen SIEMPRE de
/// PlanLimits (espejo de AppConfig.js de la web). Nada hardcodeado aquí.
const _planBadges = {
  'basico': 'RECOMENDADO',
  'premium': 'POPULAR',
  'destacado': 'MÁS VENDIDO',
};
const _planColors = {
  'free': Color(0xFF9CA3AF),
  'basico': Color(0xFFCD7F32),
  'premium': Color(0xFF6B7280),
  'destacado': Color(0xFFF5B301),
};
const _planStaticBenefits = {
  'free': ['Chat directo con compradores', 'Publica en minutos'],
  'basico': ['Insignia bronce en tu anuncio', 'Prioridad sobre anuncios gratis'],
  'premium': [
    'Insignia plateada en tu anuncio',
    'Prioridad alta en resultados',
  ],
  'destacado': [
    'Tu anuncio en la portada principal',
    'Insignia dorada verificada',
    'Máxima prioridad en búsquedas',
  ],
};

/// Lista de planes ordenada por prioridad (free → destacado), generada
/// desde PlanLimits: precios, fotos, IA, video y vigencia de la web.
final List<_PlanInfo> _plans = [
  for (final entry in PlanLimits.planes.entries)
    _PlanInfo(
      id: entry.key,
      title: (entry.value['label'] as String? ?? entry.key).toUpperCase(),
      price: '\$${(entry.value['price'] as int? ?? 0).toStringAsFixed(2)}',
      badge: _planBadges[entry.key],
      color: _planColors[entry.key] ?? Mc.grisSuave,
      benefits: [
        // Vigencia: 30 días para todos. El plan de pago pasa a gratis al
        // cumplir su mes; el anuncio gratis se elimina al terminar.
        if (entry.key == 'free')
          'Vigencia de ${entry.value['vigenciaDias']} días'
        else
          '${entry.value['vigenciaDias']} días de plan, luego pasa a gratis',
        // Fotos: tope del plan (AppConfig.js maxFotos).
        'Hasta ${entry.value['maxFotos']} fotos'
            '${entry.key == 'free' ? '' : ' + carrusel'}',
        // IA: créditos de optimización por anuncio (publish-logic.js).
        if ((entry.value['limiteIA'] as int? ?? 0) > 0)
          '${entry.value['limiteIA']} optimización${entry.value['limiteIA'] == 1 ? '' : 'es'} con IA',
        // Video: solo donde la web lo permite (publicar.html video-block).
        if (entry.value['hasVideo'] == true) '1 video HD',
        ..._planStaticBenefits[entry.key] ?? const <String>[],
      ],
    ),
];

class PlanSelectionStep extends StatefulWidget {
  final String selectedPlan;
  final ValueChanged<String> onPlanSelected;

  /// Datos del token validado (id, plan_tipo, duracion_dias) o null si se descarta.
  final ValueChanged<Map<String, dynamic>?> onTokenChanged;

  const PlanSelectionStep({
    super.key,
    required this.selectedPlan,
    required this.onPlanSelected,
    required this.onTokenChanged,
  });

  @override
  State<PlanSelectionStep> createState() => _PlanSelectionStepState();
}

class _PlanSelectionStepState extends State<PlanSelectionStep> {
  final Map<String, TextEditingController> _tokenControllers = {};
  final Map<String, ({String text, bool ok})> _messages = {};
  String? _validatingPlan;

  TextEditingController _controllerFor(String plan) =>
      _tokenControllers.putIfAbsent(plan, TextEditingController.new);

  @override
  void dispose() {
    for (final controller in _tokenControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _validateToken(String plan) async {
    final code = _controllerFor(plan).text.trim();
    if (code.isEmpty) return;

    setState(() => _validatingPlan = plan);
    try {
      final result = await Supabase.instance.client.rpc(
        'validar_token',
        params: {'p_codigo': code},
      );
      final data = result is Map ? Map<String, dynamic>.from(result) : null;

      if (data == null || data['success'] != true) {
        _setMessage(plan, 'Token inválido o ya utilizado.', false);
        return;
      }

      final tokenPlan = (data['plan_tipo'] ?? '').toString().toLowerCase();
      final normalized = tokenPlan == 'top' ? 'destacado' : tokenPlan;
      if (normalized != plan) {
        _setMessage(plan, 'Este token es para el plan $tokenPlan.', false);
        return;
      }

      _setMessage(plan, 'Token aplicado. Se confirmará al publicar.', true);
      widget.onPlanSelected(plan);
      widget.onTokenChanged({
        'id': data['id'],
        'plan_tipo': normalized,
        'duracion_dias': data['duracion_dias'],
      });
    } catch (_) {
      _setMessage(plan, 'Error de conexión. Intenta de nuevo.', false);
    } finally {
      if (mounted) setState(() => _validatingPlan = null);
    }
  }

  void _setMessage(String plan, String text, bool ok) {
    if (!ok) widget.onTokenChanged(null);
    if (mounted) setState(() => _messages[plan] = (text: text, ok: ok));
  }

  void _select(String plan) {
    if (plan != widget.selectedPlan) {
      _messages.clear();
      widget.onTokenChanged(null);
    }
    widget.onPlanSelected(plan);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Elige tu plan de publicación',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Mc.texto,
          ),
        ),
        const SizedBox(height: 16),
        for (final plan in _plans) _buildPlanCard(plan),
      ],
    );
  }

  Widget _buildPlanCard(_PlanInfo plan) {
    final isSelected = widget.selectedPlan == plan.id;
    final message = _messages[plan.id];
    final isPaid = plan.id != 'free';

    return GestureDetector(
      onTap: () => _select(plan.id),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? Mc.naranja : Mc.grisBorde,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Mc.naranja.withValues(alpha: 0.18),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ]
              : const [],
        ),
        child: Stack(
          children: [
            if (plan.badge != null)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: plan.color,
                    borderRadius: const BorderRadius.only(
                      topRight: Radius.circular(14),
                      bottomLeft: Radius.circular(10),
                    ),
                  ),
                  child: Text(
                    plan.badge!,
                    style: const TextStyle(
                      fontSize: 10,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        isSelected
                            ? Icons.radio_button_checked
                            : Icons.radio_button_off,
                        color: isSelected ? Mc.naranja : Mc.grisSuave,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        plan.title,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: Mc.texto,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        plan.price,
                        style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: Mc.naranja,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          '${PlanLimits.vigenciaDiasFor(plan.id)} días',
                          style: const TextStyle(color: Mc.grisSuave),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  for (final benefit in plan.benefits)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 3),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(
                            Icons.check_circle,
                            size: 18,
                            color: Color(0xFF16A34A),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              benefit,
                              style: const TextStyle(color: Mc.texto),
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (isPaid && isSelected) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _controllerFor(plan.id),
                            textInputAction: TextInputAction.done,
                            onSubmitted: (_) => _validateToken(plan.id),
                            decoration: InputDecoration(
                              hintText: 'Token',
                              isDense: true,
                              filled: true,
                              fillColor: const Color(0xFFF8F9FA),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 10,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(20),
                                borderSide: const BorderSide(
                                  color: Mc.grisBorde,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        TextButton(
                          onPressed: _validatingPlan == plan.id
                              ? null
                              : () => _validateToken(plan.id),
                          style: TextButton.styleFrom(
                            foregroundColor: Mc.naranja,
                          ),
                          child: _validatingPlan == plan.id
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Mc.naranja,
                                  ),
                                )
                              : const Text('Aplicar'),
                        ),
                      ],
                    ),
                    if (message != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          message.text,
                          style: TextStyle(
                            fontSize: 12,
                            color: message.ok
                                ? const Color(0xFF155724)
                                : const Color(0xFF721C24),
                          ),
                        ),
                      ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
