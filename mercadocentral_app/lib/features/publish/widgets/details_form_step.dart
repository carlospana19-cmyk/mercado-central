import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/config/app_config.dart';
import '../../../features/categorias/esquema_categorias.dart';
import '../../../features/planes/plan_limits.dart';
import '../../../theme/mc_colores.dart';
import '../../ads/widgets/location_picker.dart';
import '../../ads/widgets/location_map_picker.dart';
import '../../search/models/category_catalog.dart';

class DetailsFormStep extends StatefulWidget {
  final Map<String, dynamic> formData;
  final VoidCallback onDataChanged;

  /// Plan seleccionado en el paso anterior: define si el plan permite video
  /// (PlanLimits.hasVideoFor) y el tope de IA (PlanLimits.limiteIAFor).
  final String selectedPlan;

  const DetailsFormStep({
    super.key,
    required this.formData,
    required this.onDataChanged,
    required this.selectedPlan,
  });

  @override
  State<DetailsFormStep> createState() => _DetailsFormStepState();
}

class _DetailsFormStepState extends State<DetailsFormStep> {
  late final String _email;
  String? _mapProvince;
  String? _mapDistrict;

  // Créditos IA (espejo de editar-anuncio-logic.js: suscripciones.limite_ia
  // menos optimizations_ia_usadas). -1 = aún sin cargar.
  int _iaRestantes = -1;
  bool _iaOptimizando = false;
  String? _iaStatus;
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descController = TextEditingController();

  Map<String, dynamic> get _attrs =>
      widget.formData['atributos_clave'] as Map<String, dynamic>;

  @override
  void initState() {
    super.initState();
    final user = Supabase.instance.client.auth.currentUser;
    _email = user?.email ?? '';
    widget.formData['contact_name'] ??=
        (user?.userMetadata?['full_name'] ?? user?.userMetadata?['name'] ?? '')
            .toString();
    if (user != null) _loadIaCredits(user.id);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  /// Créditos IA: suscripciones.limite_ia - optimizations_ia_usadas,
  /// exactamente como la web (editar-anuncio-logic.js líneas 1904-1915).
  Future<void> _loadIaCredits(String userId) async {
    try {
      final sub = await Supabase.instance.client
          .from('suscripciones')
          .select('optimizations_ia_usadas, limite_ia')
          .eq('user_id', userId)
          .single();
      final limite = (sub['limite_ia'] as num?)?.toInt() ?? 0;
      final usadas = (sub['optimizations_ia_usadas'] as num?)?.toInt() ?? 0;
      if (mounted) setState(() => _iaRestantes = limite - usadas);
    } catch (_) {
      // Sin suscripción registrada: el tope del plan aplica igual.
      if (mounted) {
        setState(() =>
            _iaRestantes = PlanLimits.limiteIAFor(widget.selectedPlan));
      }
    }
  }

  /// Relee el saldo IA desde `suscripciones` (limite_ia -
  /// optimizations_ia_usadas), igual que ia-button.js en la web: la BD es la
  /// única fuente de verdad y nunca se asume el valor en memoria.
  Future<void> _releerSaldoIa() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;
      final sub = await Supabase.instance.client
          .from('suscripciones')
          .select('limite_ia, optimizations_ia_usadas')
          .eq('user_id', user.id)
          .maybeSingle();
      if (sub == null) return;
      final limite = (sub['limite_ia'] as num?)?.toInt() ?? 0;
      final usadas = (sub['optimizations_ia_usadas'] as num?)?.toInt() ?? 0;
      if (mounted) setState(() => _iaRestantes = limite - usadas);
    } catch (_) {
      // Sin acceso a la BD: se conserva el valor en memoria.
    }
  }

  /// Botón IA: llama al mismo endpoint que ia-button.js de la web y bloquea
  /// en 0 créditos. Tras optimizar con éxito, registra el uso en la BD y
  /// relee el saldo real desde `suscripciones`.
  Future<void> _optimizeWithAi() async {
    final titulo = _titleController.text.trim();
    final descripcion = _descController.text.trim();
    if (titulo.isEmpty || descripcion.isEmpty) {
      setState(() => _iaStatus = 'Escribe título y descripción primero');
      return;
    }
    if (_iaRestantes <= 0) {
      setState(() =>
          _iaStatus = 'Has agotado tus optimizaciones de IA de tu plan actual.');
      return;
    }

    setState(() {
      _iaOptimizando = true;
      _iaStatus = 'Optimizando con IA...';
    });
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.iaServerUrl}/optimizar'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'titulo': titulo, 'descripcion': descripcion}),
      );
      if (response.statusCode != 200) {
        throw Exception('Error ${response.statusCode}');
      }
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (data.containsKey('error')) throw Exception(data['error']);

      final newTitle =
          (data['titulo'] ?? data['titulo_optimizado'] ?? '').toString();
      final newDesc =
          (data['descripcion'] ?? data['descripcion_optimizada'] ?? '')
              .toString();
      _titleController.text = newTitle.isNotEmpty ? newTitle : titulo;
      _descController.text = newDesc.isNotEmpty ? newDesc : descripcion;
      _updateField('titulo', _titleController.text);
      _updateField('descripcion', _descController.text);

      // Incremento de uso en suscripciones (editar-anuncio-logic.js L1967).
      try {
        final user = Supabase.instance.client.auth.currentUser;
        if (user != null) {
          final sub = await Supabase.instance.client
              .from('suscripciones')
              .select('optimizations_ia_usadas')
              .eq('user_id', user.id)
              .single();
          final usadas = (sub['optimizations_ia_usadas'] as num?)?.toInt() ?? 0;
          await Supabase.instance.client
              .from('suscripciones')
              .update({'optimizations_ia_usadas': usadas + 1})
              .eq('user_id', user.id);
        }
      } catch (_) {}
      // Releer el saldo REAL desde `suscripciones` (limite_ia -
      // optimizations_ia_usadas), igual que ia-button.js en la web: si algo
      // descontó en la BD, incrementar solo en memoria desfasaría el contador.
      await _releerSaldoIa();
      if (mounted) {
        setState(() => _iaStatus = '✨ ¡Optimizado!');
      }
    } catch (_) {
      if (mounted) setState(() => _iaStatus = 'Error de conexión con IA');
    } finally {
      if (mounted) setState(() => _iaOptimizando = false);
    }
  }

  void _updateField(String key, dynamic value) {
    setState(() => widget.formData[key] = value);
    widget.onDataChanged();
  }

  void _updateAttribute(String key, String? value) {
    setState(() {
      if (value == null || value.trim().isEmpty) {
        _attrs.remove(key);
      } else {
        _attrs[key] = value.trim();
      }
    });
    widget.onDataChanged();
  }

  InputDecoration _decoration(String label, {String? hint, String? prefix}) =>
      InputDecoration(
        labelText: label,
        hintText: hint,
        prefixText: prefix,
        floatingLabelStyle: const TextStyle(color: Mc.naranja),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Mc.grisBorde),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Mc.grisBorde),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Mc.naranja, width: 1.6),
        ),
      );

  Widget _section(IconData icon, String title) => Padding(
        padding: const EdgeInsets.only(top: 8, bottom: 14),
        child: Row(
          children: [
            Icon(icon, size: 20, color: Mc.naranja),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Mc.texto,
              ),
            ),
          ],
        ),
      );

  Widget _attrInput(CampoAtributo campo) {
    final current = _attrs[campo.key]?.toString();
    if (campo.opciones != null) {
      return DropdownButtonFormField<String>(
        decoration: _decoration(campo.etiqueta),
        isExpanded: true,
        initialValue: campo.opciones!.contains(current) ? current : null,
        items: campo.opciones!
            .map((o) => DropdownMenuItem(value: o, child: Text(o)))
            .toList(),
        onChanged: (v) => _updateAttribute(campo.key, v),
      );
    }
    if (campo.esFecha) {
      // Campo date de la web (communitySubcategories: fecha_evento).
      return TextFormField(
        decoration: _decoration(campo.etiqueta),
        controller: TextEditingController(text: current),
        readOnly: true,
        onTap: () async {
          final elegida = await showDatePicker(
            context: context,
            initialDate: DateTime.tryParse(current ?? '') ?? DateTime.now(),
            firstDate: DateTime(2000),
            lastDate: DateTime(2100),
          );
          if (elegida != null) {
            _updateAttribute(campo.key, elegida.toIso8601String().substring(0, 10));
          }
        },
      );
    }
    return TextFormField(
      decoration: _decoration(campo.etiqueta, hint: campo.placeholder),
      keyboardType:
          campo.esNumerico ? TextInputType.number : TextInputType.text,
      initialValue: current,
      onChanged: (v) => _updateAttribute(campo.key, v),
    );
  }

  Widget _attributeGrid(String title, List<CampoAtributo> campos) {
    final rows = <Widget>[];
    for (var i = 0; i < campos.length; i += 2) {
      rows.add(
        Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _attrInput(campos[i])),
              const SizedBox(width: 10),
              Expanded(
                child: i + 1 < campos.length
                    ? _attrInput(campos[i + 1])
                    : const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(
            title,
            style:
                const TextStyle(fontWeight: FontWeight.w700, color: Mc.texto),
          ),
        ),
        ...rows,
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final cat = widget.formData['categoria'] as String?;
    final sub = widget.formData['subcategoria'] as String?;
    final subcategories = cat == null
        ? <String>[]
        : fullCategoryCatalog.firstWhere((c) => c.name == cat).subcategories;
    final subcatActual = (sub ?? '').toString();
    final campos = EsquemaCategorias.camposPara(cat ?? '', subcatActual);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _section(Icons.sell_outlined, 'Clasificación y lugar'),
        DropdownButtonFormField<String>(
          decoration: _decoration('Categoría principal *'),
          isExpanded: true,
          initialValue: cat,
          items: fullCategoryCatalog
              .map((c) => DropdownMenuItem(value: c.name, child: Text(c.name)))
              .toList(),
          onChanged: (val) {
            setState(() {
              widget.formData['categoria'] = val;
              widget.formData['subcategoria'] = null;
              widget.formData['atributos_clave'] = <String, dynamic>{};
            });
            widget.onDataChanged();
          },
        ),
        const SizedBox(height: 14),
        DropdownButtonFormField<String>(
          decoration: _decoration('Subcategoría'),
          isExpanded: true,
          initialValue: subcategories.contains(sub) ? sub : null,
          items: subcategories
              .map((s) => DropdownMenuItem(value: s, child: Text(s)))
              .toList(),
          onChanged: subcategories.isEmpty
              ? null
              : (val) => _updateField('subcategoria', val),
        ),
        const SizedBox(height: 14),
        LocationPicker(
          onProvinceChanged: (province) => setState(() {
            widget.formData['provincia'] = null;
            widget.formData['distrito'] = null;
            _mapProvince = province;
            _mapDistrict = null;
          }),
          onSelected: (province, district) {
            setState(() => _mapDistrict = district);
            _updateField('provincia', province);
            _updateField('distrito', district);
          },
        ),
        if (_mapProvince != null) ...[
          const SizedBox(height: 14),
          LocationMapPicker(
            province: _mapProvince,
            district: _mapDistrict,
            onChanged: (lat, lng, address) {
              widget.formData['latitud'] = lat;
              widget.formData['longitud'] = lng;
              widget.formData['direccion_exacta'] = address ?? '';
              widget.onDataChanged();
            },
          ),
        ],
        const SizedBox(height: 14),
        _section(Icons.edit_note, 'Información del anuncio'),
        TextFormField(
          controller: _titleController,
          decoration: _decoration(
            'Título del anuncio *',
            hint: 'Ej. Toyota Hilux 2022 Impecable',
          ),
          maxLength: 60,
          onChanged: (val) => _updateField('titulo', val),
        ),
        const SizedBox(height: 8),
        TextFormField(
          decoration:
              _decoration('Precio (USD) *', hint: '15000', prefix: '\$ '),
          keyboardType: TextInputType.number,
          initialValue: widget.formData['precio']?.toString(),
          onChanged: (val) => _updateField('precio', val),
        ),
        const SizedBox(height: 14),
        TextFormField(
          controller: _descController,
          decoration: _decoration(
            'Descripción *',
            hint: 'Describe las características, estado, mantenimiento, etc.',
          ),
          maxLines: 6,
          maxLength: 1000,
          onChanged: (val) => _updateField('descripcion', val),
        ),
        // Botón IA: solo visible si el plan lo permite (límite > 0).
        // Contador de créditos restantes = suscripciones.limite_ia - usadas
        // (espejo de editar-anuncio-logic.js de la web).
        if (PlanLimits.limiteIAFor(widget.selectedPlan) > 0) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              ElevatedButton.icon(
                onPressed: _iaOptimizando || _iaRestantes <= 0
                    ? null
                    : _optimizeWithAi,
                icon: _iaOptimizando
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.auto_awesome, size: 16),
                label: const Text('Optimizar con IA'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7C3AED),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                _iaRestantes < 0
                    ? '... créditos IA'
                    : '$_iaRestantes créditos IA',
                style: TextStyle(
                  fontSize: 12,
                  color: _iaRestantes > 0 ? Mc.grisSuave : Colors.red,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          if (_iaStatus != null)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                _iaStatus!,
                style: TextStyle(
                  fontSize: 12,
                  color: _iaStatus!.startsWith('✨') ? Colors.green : Colors.red,
                ),
              ),
            ),
        ],
        // Campo de video: solo visible si el plan lo permite (publicar.html
        // de la web muestra video-block solo para Destacado).
        if (PlanLimits.hasVideoFor(widget.selectedPlan)) ...[
          const SizedBox(height: 14),
          TextFormField(
            decoration: _decoration(
              'URL de Video (Youtube o Vimeo)',
              hint: 'https://www.youtube.com/watch?v=...',
            ),
            initialValue: widget.formData['video_url']?.toString(),
            onChanged: (val) => _updateField('video_url', val),
          ),
          const Padding(
            padding: EdgeInsets.only(top: 4),
            child: Text(
              'Añade un vídeo de hasta 60 segundos para el carrusel.',
              style: TextStyle(fontSize: 12, color: Mc.grisSuave),
            ),
          ),
        ],
        // Sección dinámica de atributos (FASE 1 · BLOQUE D): para TODAS las
        // categorías, con los campos EXACTOS de la web (EsquemaCategorias,
        // única fuente espejo de publish-logic.js y publicar.html).
        if (campos.isNotEmpty)
          _attributeGrid(
            EsquemaCategorias.tituloSeccion(
              cat ?? '',
              (widget.formData['subcategoria'] ?? '').toString(),
            ),
            campos,
          ),
        const Divider(),
        _section(Icons.account_circle_outlined, 'Información de contacto'),
        TextFormField(
          decoration: _decoration('Tu nombre'),
          initialValue: widget.formData['contact_name'],
          onChanged: (val) => _updateField('contact_name', val),
        ),
        const SizedBox(height: 14),
        TextFormField(
          decoration: _decoration('Tu correo electrónico'),
          initialValue: _email,
          readOnly: true,
          enabled: false,
        ),
        const SizedBox(height: 14),
        TextFormField(
          decoration:
              _decoration('Tu teléfono (WhatsApp)', hint: 'Ej: 6677-8899'),
          keyboardType: TextInputType.phone,
          initialValue: widget.formData['contact_phone'],
          onChanged: (val) => _updateField('contact_phone', val),
        ),
        const SizedBox(height: 6),
        CheckboxListTile(
          contentPadding: EdgeInsets.zero,
          controlAffinity: ListTileControlAffinity.leading,
          activeColor: Mc.naranja,
          value: widget.formData['terms'] == true,
          onChanged: (v) => _updateField('terms', v ?? false),
          title: const Text(
            'Acepto los términos y condiciones de publicación',
            style: TextStyle(fontSize: 14),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}
