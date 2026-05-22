import 'package:flutter/material.dart';
import '../../search/models/category_catalog.dart';
import '../../ads/widgets/location_picker.dart'; // Importamos el archivo que me enviaste

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
  List<String> _currentSubcategories = [];

  // Función para guardar datos normales
  void _updateField(String key, dynamic value) {
    setState(() => widget.formData[key] = value);
    widget.onDataChanged();
  }

  // Función para guardar datos dinámicos (Marca, Año, etc.)
  void _updateAttribute(String key, String value) {
    setState(() {
      widget.formData['atributos_clave'][key] = value;
    });
    widget.onDataChanged();
  }

  @override
  Widget build(BuildContext context) {
    final cat = widget.formData['categoria'];
    final sub = widget.formData['subcategoria'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 1. TÍTULO Y PRECIO
        TextFormField(
          decoration: const InputDecoration(labelText: 'Título del Anuncio *', hintText: 'Ej. Toyota Hilux 2022 Impecable'),
          maxLength: 60,
          initialValue: widget.formData['titulo'],
          onChanged: (val) => _updateField('titulo', val),
        ),
        const SizedBox(height: 15),
        TextFormField(
          decoration: const InputDecoration(labelText: 'Precio (USD) *', prefixText: '\$ '),
          keyboardType: TextInputType.number,
          initialValue: widget.formData['precio']?.toString(),
          onChanged: (val) => _updateField('precio', val),
        ),
        const SizedBox(height: 15),

        // 2. CATEGORÍA Y SUBCATEGORÍA
        DropdownButtonFormField<String>(
          decoration: const InputDecoration(labelText: 'Categoría *'),
          value: cat,
          items: fullCategoryCatalog.map((c) => DropdownMenuItem(value: c.name, child: Text(c.name))).toList(),
          onChanged: (val) {
            _updateField('categoria', val);
            _updateField('subcategoria', null); // Reset
            widget.formData['atributos_clave'] = {}; // Limpiar atributos viejos
            setState(() {
              _currentSubcategories = fullCategoryCatalog.firstWhere((c) => c.name == val).subcategories;
            });
          },
        ),
        const SizedBox(height: 15),
        DropdownButtonFormField<String>(
          decoration: const InputDecoration(labelText: 'Subcategoría *'),
          value: sub,
          items: _currentSubcategories.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
          onChanged: _currentSubcategories.isEmpty ? null : (val) => _updateField('subcategoria', val),
        ),
        const SizedBox(height: 15),

        // 3. CAMPOS DINÁMICOS (Ejemplo: Autos e Inmuebles)
        if (sub == 'Autos' || sub == 'Autos Usados') ...[
          const Divider(),
          const Text('Especificaciones del Vehículo', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blueGrey)),
          Row(
            children: [
              Expanded(child: TextFormField(decoration: const InputDecoration(labelText: 'Marca'), onChanged: (v) => _updateAttribute('marca', v))),
              const SizedBox(width: 10),
              Expanded(child: TextFormField(decoration: const InputDecoration(labelText: 'Modelo'), onChanged: (v) => _updateAttribute('modelo', v))),
            ],
          ),
          Row(
            children: [
              Expanded(child: TextFormField(decoration: const InputDecoration(labelText: 'Año'), keyboardType: TextInputType.number, onChanged: (v) => _updateAttribute('anio', v))),
              const SizedBox(width: 10),
              Expanded(child: TextFormField(decoration: const InputDecoration(labelText: 'Kilometraje'), keyboardType: TextInputType.number, onChanged: (v) => _updateAttribute('kilometraje', v))),
            ],
          ),
          DropdownButtonFormField<String>(
            decoration: const InputDecoration(labelText: 'Transmisión'),
            items: ['Automática', 'Manual'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
            onChanged: (v) => _updateAttribute('transmision', v!),
          ),
          const Divider(),
        ],

        if (sub == 'Casas' || sub == 'Apartamentos') ...[
          const Divider(),
          const Text('Especificaciones del Inmueble', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blueGrey)),
          Row(
            children: [
              Expanded(child: TextFormField(decoration: const InputDecoration(labelText: 'Metros (m²)'), keyboardType: TextInputType.number, onChanged: (v) => _updateAttribute('m2', v))),
              const SizedBox(width: 10),
              Expanded(child: TextFormField(decoration: const InputDecoration(labelText: 'Habitaciones'), keyboardType: TextInputType.number, onChanged: (v) => _updateAttribute('habitaciones', v))),
              const SizedBox(width: 10),
              Expanded(child: TextFormField(decoration: const InputDecoration(labelText: 'Baños'), keyboardType: TextInputType.number, onChanged: (v) => _updateAttribute('banos', v))),
            ],
          ),
          const Divider(),
        ],

        // 4. UBICACIÓN (Usando tu widget)
        LocationPicker(
          onSelected: (province, district) {
            _updateField('provincia', province);
            _updateField('distrito', district);
          },
        ),
        const SizedBox(height: 15),

        // 5. DESCRIPCIÓN
        TextFormField(
          decoration: const InputDecoration(labelText: 'Descripción *', hintText: 'Describe los detalles...'),
          maxLines: 4,
          initialValue: widget.formData['descripcion'],
          onChanged: (val) => _updateField('descripcion', val),
        ),
        const SizedBox(height: 40),
      ],
    );
  }
}