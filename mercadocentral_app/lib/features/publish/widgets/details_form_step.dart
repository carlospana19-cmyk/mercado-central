import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../theme/mc_colores.dart';
import '../../ads/widgets/location_picker.dart';
import '../../ads/widgets/location_map_picker.dart';
import '../../search/models/category_catalog.dart';

class AttrField {
  final String key;
  final String label;
  final String? hint;
  final bool numeric;
  final List<String>? options;

  const AttrField(
    this.key,
    this.label, {
    this.hint,
    this.numeric = false,
    this.options,
  });
}

const _yesNo = ['Sí', 'No'];
const _conditions = [
  'Excelente',
  'Bueno',
  'Regular',
  'Necesita reparaciones',
];

const vehicleAttrFields = [
  AttrField('marca', 'Marca', hint: 'Ej: Toyota'),
  AttrField('modelo', 'Modelo', hint: 'Ej: Hilux 2.4 CD 4x4'),
  AttrField('anio', 'Año', hint: 'Ej: 2020', numeric: true),
  AttrField('kilometraje', 'Kilometraje', hint: 'Ej: 50000', numeric: true),
  AttrField('transmision', 'Transmisión', options: ['Automática', 'Manual']),
  AttrField(
    'combustible',
    'Combustible',
    options: ['Gasolina', 'Diesel', 'Híbrido', 'Eléctrico'],
  ),
  AttrField('color', 'Color', hint: 'Ej: Blanco'),
  AttrField('puertas', 'Puertas', options: ['2', '3', '4', '5']),
  AttrField('vidrios', 'Vidrios', options: ['Eléctricos', 'Manuales']),
  AttrField('rines', 'Rines', hint: 'Ej: 16 pulgadas'),
  AttrField('tapiz', 'Tapiz', options: ['Tela', 'Cuero', 'Vinilo']),
  AttrField(
    'direccion',
    'Dirección',
    options: ['Asistida', 'Hidráulica', 'Eléctrica'],
  ),
  AttrField('frenos', 'Frenos', options: ['ABS', 'Discos', 'Tambores']),
  AttrField('airbags', 'Airbags', options: _yesNo),
  AttrField('estado', 'Estado', options: _conditions),
];

const propertyAttrFields = [
  AttrField('m2', 'Metros cuadrados (m²)', hint: 'Ej: 120', numeric: true),
  AttrField('habitaciones', 'Habitaciones', hint: 'Ej: 3', numeric: true),
  AttrField('banos', 'Baños', hint: 'Ej: 2', numeric: true),
  AttrField('piso', 'Piso', hint: 'Ej: 5', numeric: true),
  AttrField(
    'estacionamiento',
    'Estacionamientos',
    hint: 'Ej: 1',
    numeric: true,
  ),
  AttrField('amueblado', 'Amueblado', options: ['Sí', 'No', 'Parcialmente']),
  AttrField('ascensor', 'Ascensor', options: _yesNo),
  AttrField('jardin', 'Jardín', options: _yesNo),
  AttrField('piscina', 'Piscina', options: _yesNo),
  AttrField(
    'tipo_propiedad',
    'Tipo de propiedad',
    options: ['Casa', 'Apartamento', 'Local', 'Oficina', 'Terreno'],
  ),
  AttrField(
    'anio_construccion',
    'Año de construcción',
    hint: 'Ej: 2020',
    numeric: true,
  ),
  AttrField(
    'estado_conservacion',
    'Estado de conservación',
    options: _conditions,
  ),
  AttrField('calefaccion', 'Calefacción',
      options: ['Sí', 'No', 'Eléctrica', 'Gas']),
  AttrField(
    'aire_acondicionado',
    'Aire acondicionado',
    options: ['Sí', 'No', 'Central', 'Split'],
  ),
  AttrField(
    'seguridad',
    'Seguridad',
    options: ['Portero', 'Cámaras', 'Alarmas', 'Conserje', 'Básica'],
  ),
  AttrField(
    'orientacion',
    'Orientación',
    options: ['Norte', 'Sur', 'Este', 'Oeste'],
  ),
  AttrField('mascotas', 'Mascotas permitidas',
      options: ['Sí', 'No', 'Pequeñas']),
  AttrField('gimnasio', 'Gimnasio', options: _yesNo),
];

class DetailsFormStep extends StatefulWidget {
  final Map<String, dynamic> formData;
  final VoidCallback onDataChanged;

  const DetailsFormStep({
    super.key,
    required this.formData,
    required this.onDataChanged,
  });

  @override
  State<DetailsFormStep> createState() => _DetailsFormStepState();
}

class _DetailsFormStepState extends State<DetailsFormStep> {
  late final String _email;
  String? _mapProvince;
  String? _mapDistrict;

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

  Widget _attrInput(AttrField field) {
    final current = _attrs[field.key]?.toString();
    if (field.options != null) {
      return DropdownButtonFormField<String>(
        decoration: _decoration(field.label),
        isExpanded: true,
        value: field.options!.contains(current) ? current : null,
        items: field.options!
            .map((o) => DropdownMenuItem(value: o, child: Text(o)))
            .toList(),
        onChanged: (v) => _updateAttribute(field.key, v),
      );
    }
    return TextFormField(
      decoration: _decoration(field.label, hint: field.hint),
      keyboardType: field.numeric ? TextInputType.number : TextInputType.text,
      initialValue: current,
      onChanged: (v) => _updateAttribute(field.key, v),
    );
  }

  Widget _attributeGrid(String title, List<AttrField> fields) {
    final rows = <Widget>[];
    for (var i = 0; i < fields.length; i += 2) {
      rows.add(
        Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _attrInput(fields[i])),
              const SizedBox(width: 10),
              Expanded(
                child: i + 1 < fields.length
                    ? _attrInput(fields[i + 1])
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

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _section(Icons.sell_outlined, 'Clasificación y lugar'),
        DropdownButtonFormField<String>(
          decoration: _decoration('Categoría principal *'),
          isExpanded: true,
          value: cat,
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
          value: subcategories.contains(sub) ? sub : null,
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
          decoration: _decoration(
            'Título del anuncio *',
            hint: 'Ej. Toyota Hilux 2022 Impecable',
          ),
          maxLength: 60,
          initialValue: widget.formData['titulo'],
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
          decoration: _decoration(
            'Descripción *',
            hint: 'Describe las características, estado, mantenimiento, etc.',
          ),
          maxLines: 6,
          maxLength: 1000,
          initialValue: widget.formData['descripcion'],
          onChanged: (val) => _updateField('descripcion', val),
        ),
        if (cat == 'Vehículos')
          _attributeGrid('Especificaciones del vehículo', vehicleAttrFields),
        if (cat == 'Inmuebles')
          _attributeGrid('Especificaciones del inmueble', propertyAttrFields),
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
