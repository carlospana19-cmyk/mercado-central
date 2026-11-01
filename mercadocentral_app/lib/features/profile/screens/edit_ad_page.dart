import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/utils/location_helper.dart';
import '../../../theme/mc_colores.dart';
import '../../publish/widgets/details_form_step.dart'
    show AttrField, propertyAttrFields, vehicleAttrFields;
import '../../search/models/category_catalog.dart';

class EditAdPage extends StatefulWidget {
  final Map<String, dynamic> ad;

  const EditAdPage({super.key, required this.ad});

  @override
  State<EditAdPage> createState() => _EditAdPageState();
}

class _EditAdPageState extends State<EditAdPage> {
  static const _maxPhotosByPlan = {
    'free': 5,
    'basico': 10,
    'premium': 15,
    'destacado': 20,
    'top': 20,
  };
  static const _numericAttrs = {
    'kilometraje',
    'm2',
    'anio',
    'habitaciones',
    'banos',
  };

  final _formKey = GlobalKey<FormState>();
  final _supabase = Supabase.instance.client;
  final _picker = ImagePicker();
  late final TextEditingController _titleController;
  late final TextEditingController _descController;
  late final TextEditingController _priceController;
  final Map<String, TextEditingController> _textAttrControllers = {};
  final Map<String, String> _selectAttrs = {};

  // Fotos ya guardadas (portada primero) y fotos nuevas por subir.
  final List<String> _currentImages = [];
  final List<XFile> _newImages = [];
  Map<String, dynamic> _extraAttrs = {};

  String? _category;
  String? _subcategory;
  String? _province;
  String? _district;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final ad = widget.ad;
    _titleController = TextEditingController(text: ad['titulo']?.toString());
    _descController = TextEditingController(
      text: ad['descripcion']?.toString(),
    );
    _priceController = TextEditingController(text: _initialPrice(ad['precio']));

    _category = _matchCategory(ad['categoria']?.toString());
    _subcategory = _matchSubcategory(ad['subcategoria']?.toString());
    final province = ad['provincia']?.toString();
    _province =
        LocationHelper.getProvinces().contains(province) ? province : null;
    final district = ad['distrito']?.toString();
    _district = _province != null &&
            LocationHelper.getDistricts(_province!).contains(district)
        ? district
        : null;

    _loadImages();
    _loadAttributes(_parseAttributes(ad['atributos_clave']));
  }

  String _initialPrice(dynamic value) {
    final number = num.tryParse(value?.toString() ?? '');
    if (number == null) return '';
    return number == number.roundToDouble()
        ? number.toInt().toString()
        : number.toString();
  }

  String? _matchCategory(String? raw) {
    if (raw == null) return null;
    for (final item in fullCategoryCatalog) {
      if (item.name.toLowerCase() == raw.trim().toLowerCase()) return item.name;
    }
    return null;
  }

  String? _matchSubcategory(String? raw) {
    if (raw == null || _category == null) return null;
    final subcategories = fullCategoryCatalog
        .firstWhere((item) => item.name == _category)
        .subcategories;
    for (final sub in subcategories) {
      if (sub.toLowerCase() == raw.trim().toLowerCase()) return sub;
    }
    return null;
  }

  Map<String, dynamic> _parseAttributes(dynamic raw) {
    try {
      var decoded = raw;
      if (decoded is String && decoded.trim().isNotEmpty) {
        decoded = jsonDecode(decoded);
        if (decoded is String) decoded = jsonDecode(decoded);
      }
      if (decoded is Map) return Map<String, dynamic>.from(decoded);
    } catch (error) {
      debugPrint('Error leyendo atributos para edición: $error');
    }
    return {};
  }

  void _loadImages() {
    final ad = widget.ad;
    final cover = ad['url_portada']?.toString() ?? '';
    if (cover.isNotEmpty) _currentImages.add(cover);
    final gallery = ad['url_galeria'];
    if (gallery is List) {
      for (final image in gallery) {
        final url = image.toString();
        if (url.isNotEmpty && !_currentImages.contains(url)) {
          _currentImages.add(url);
        }
      }
    }
  }

  List<AttrField> _fieldsForCategory(String? category) {
    if (category == 'Vehículos') return vehicleAttrFields;
    if (category == 'Inmuebles') return propertyAttrFields;
    return const [];
  }

  void _loadAttributes(Map<String, dynamic> attrs) {
    final knownKeys = _fieldsForCategory(_category).map((f) => f.key).toSet();
    for (final field in _fieldsForCategory(_category)) {
      final value = attrs[field.key]?.toString() ?? '';
      if (field.options != null) {
        if (field.options!.contains(value)) _selectAttrs[field.key] = value;
      } else {
        _textAttrControllers[field.key] = TextEditingController(text: value);
      }
    }
    // Los atributos de otras categorías se conservan tal cual al guardar.
    _extraAttrs = {
      for (final entry in attrs.entries)
        if (!knownKeys.contains(entry.key)) entry.key: entry.value,
    };
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _priceController.dispose();
    for (final controller in _textAttrControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  int get _maxPhotos {
    final plan =
        (widget.ad['featured_plan'] ?? widget.ad['selected_plan'] ?? 'free')
            .toString()
            .toLowerCase();
    return _maxPhotosByPlan[plan] ?? 5;
  }

  int get _photoCount => _currentImages.length + _newImages.length;

  Future<void> _pickPhotos() async {
    if (_photoCount >= _maxPhotos) {
      _showMessage('Solo puedes subir un máximo de $_maxPhotos imágenes.');
      return;
    }
    final picked = await _picker.pickMultiImage(imageQuality: 80);
    if (picked.isEmpty || !mounted) return;
    final room = _maxPhotos - _photoCount;
    setState(() => _newImages.addAll(picked.take(room)));
    if (picked.length > room) {
      _showMessage('Solo puedes subir un máximo de $_maxPhotos imágenes.');
    }
  }

  Future<String> _uploadImage(XFile image, String userId, int index) async {
    final extension = image.name.contains('.')
        ? image.name.split('.').last.toLowerCase()
        : 'jpg';
    final path =
        '$userId/${DateTime.now().millisecondsSinceEpoch}_$index.$extension';
    await _supabase.storage
        .from('imagenes_anuncios')
        .uploadBinary(path, await image.readAsBytes());
    return _supabase.storage.from('imagenes_anuncios').getPublicUrl(path);
  }

  Map<String, dynamic> _collectAttributes() {
    final attrs = <String, dynamic>{};
    for (final field in _fieldsForCategory(_category)) {
      final raw = field.options != null
          ? _selectAttrs[field.key] ?? ''
          : _textAttrControllers[field.key]?.text.trim() ?? '';
      if (raw.isEmpty) continue;
      attrs[field.key] = _numericAttrs.contains(field.key)
          ? (double.tryParse(raw.replaceAll(',', '')) ?? 0)
          : raw;
    }
    return attrs;
  }

  Future<void> _saveChanges() async {
    if (!_formKey.currentState!.validate()) return;
    final user = _supabase.auth.currentUser;
    if (user == null) {
      _showMessage('Error de sesión.', isError: true);
      return;
    }
    if (_category == null) {
      _showMessage('Selecciona una categoría.', isError: true);
      return;
    }
    if (_photoCount == 0) {
      _showMessage('Sube al menos 1 foto.', isError: true);
      return;
    }

    setState(() => _saving = true);
    try {
      final uploaded = <String>[];
      for (var i = 0; i < _newImages.length; i++) {
        uploaded.add(await _uploadImage(_newImages[i], user.id, i));
      }
      final images = [..._currentImages, ...uploaded];

      final attrs = {..._extraAttrs, ..._collectAttributes()};
      await _supabase.from('anuncios').update({
        'titulo': _titleController.text.trim(),
        'descripcion': _descController.text.trim(),
        'precio': double.tryParse(_priceController.text.trim()) ?? 0,
        'categoria': _category,
        'subcategoria': _subcategory ?? '',
        'provincia': _province ?? '',
        'distrito': _district ?? '',
        if (attrs.isNotEmpty) 'atributos_clave': jsonEncode(attrs),
        'url_portada': images.first,
        'url_galeria': images.length > 1 ? images.sublist(1) : <String>[],
      }).eq('id', widget.ad['id']);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('¡Anuncio actualizado correctamente!'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context, true);
    } catch (error) {
      _showMessage('Error guardando cambios: $error', isError: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _showMessage(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : null,
      ),
    );
  }

  InputDecoration _decoration(String label, {String? hint, String? prefix}) =>
      InputDecoration(
        labelText: label,
        hintText: hint,
        prefixText: prefix,
        floatingLabelStyle: const TextStyle(color: Mc.naranja),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Mc.naranja, width: 1.5),
        ),
      );

  Widget _section(IconData icon, String title) => Padding(
        padding: const EdgeInsets.only(top: 18, bottom: 12),
        child: Row(
          children: [
            Icon(icon, size: 20, color: Mc.naranja),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                color: Mc.texto,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      );

  Widget _attributeInput(AttrField field) {
    if (field.options != null) {
      return DropdownButtonFormField<String>(
        initialValue: _selectAttrs[field.key],
        isExpanded: true,
        decoration: _decoration(field.label),
        items: field.options!
            .map((option) =>
                DropdownMenuItem(value: option, child: Text(option)))
            .toList(),
        onChanged: (value) => setState(() {
          if (value == null) {
            _selectAttrs.remove(field.key);
          } else {
            _selectAttrs[field.key] = value;
          }
        }),
      );
    }
    return TextFormField(
      controller: _textAttrControllers[field.key],
      keyboardType: field.numeric ? TextInputType.number : TextInputType.text,
      decoration: _decoration(field.label, hint: field.hint),
    );
  }

  Widget _photoSection() {
    final tiles = <Widget>[
      for (var i = 0; i < _currentImages.length; i++)
        _photoTile(
          Image.network(
            _currentImages[i],
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => const Icon(Icons.broken_image),
          ),
          isCover: i == 0,
          onRemove: () => setState(() => _currentImages.removeAt(i)),
        ),
      for (var i = 0; i < _newImages.length; i++)
        _photoTile(
          FutureBuilder(
            future: _newImages[i].readAsBytes(),
            builder: (context, snapshot) => snapshot.hasData
                ? Image.memory(snapshot.data!, fit: BoxFit.cover)
                : const Center(
                    child: CircularProgressIndicator(strokeWidth: 2)),
          ),
          isCover: _currentImages.isEmpty && i == 0,
          onRemove: () => setState(() => _newImages.removeAt(i)),
        ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'La primera foto es la portada. $_photoCount/$_maxPhotos fotos.',
          style: const TextStyle(color: Mc.grisSuave),
        ),
        const SizedBox(height: 10),
        GridView.count(
          crossAxisCount: 3,
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: tiles,
        ),
        const SizedBox(height: 10),
        OutlinedButton.icon(
          onPressed: _pickPhotos,
          icon: const Icon(Icons.add_photo_alternate_outlined),
          label: const Text('Agregar fotos'),
          style: OutlinedButton.styleFrom(
            foregroundColor: Mc.naranjaOscuro,
            side: const BorderSide(color: Mc.naranja),
          ),
        ),
      ],
    );
  }

  Widget _photoTile(
    Widget image, {
    required bool isCover,
    required VoidCallback onRemove,
  }) =>
      Stack(
        fit: StackFit.expand,
        children: [
          ClipRRect(borderRadius: BorderRadius.circular(10), child: image),
          if (isCover)
            Positioned(
              left: 5,
              bottom: 5,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Mc.naranja,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'PORTADA',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          Positioned(
            top: 5,
            right: 5,
            child: GestureDetector(
              onTap: onRemove,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close, size: 14, color: Colors.white),
              ),
            ),
          ),
        ],
      );

  Widget _attributeGrid(String title, List<AttrField> fields) {
    final rows = <Widget>[];
    for (var i = 0; i < fields.length; i += 2) {
      rows.add(
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _attributeInput(fields[i])),
              const SizedBox(width: 10),
              Expanded(
                child: i + 1 < fields.length
                    ? _attributeInput(fields[i + 1])
                    : const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [_section(Icons.tune, title), ...rows],
    );
  }

  @override
  Widget build(BuildContext context) {
    final provinces = LocationHelper.getProvinces();
    final districts = _province == null
        ? <String>[]
        : LocationHelper.getDistricts(_province!);
    final subcategories = _category == null
        ? <String>[]
        : fullCategoryCatalog
            .firstWhere((item) => item.name == _category)
            .subcategories;
    final fields = _fieldsForCategory(_category);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          'Editar Anuncio',
          style: TextStyle(color: Mc.texto, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: Mc.texto),
        elevation: 0.5,
        surfaceTintColor: Colors.transparent,
      ),
      body: _saving
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: Mc.naranja),
                  SizedBox(height: 16),
                  Text('Guardando cambios...'),
                ],
              ),
            )
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  _section(Icons.sell_outlined, 'Clasificación y lugar'),
                  DropdownButtonFormField<String>(
                    initialValue: _category,
                    isExpanded: true,
                    decoration: _decoration('Categoría principal *'),
                    items: fullCategoryCatalog
                        .map(
                          (item) => DropdownMenuItem(
                            value: item.name,
                            child: Text(item.name),
                          ),
                        )
                        .toList(),
                    onChanged: (value) => setState(() {
                      if (value == _category) return;
                      _category = value;
                      _subcategory = null;
                      for (final controller in _textAttrControllers.values) {
                        controller.dispose();
                      }
                      _textAttrControllers.clear();
                      _selectAttrs.clear();
                      final original = _matchCategory(
                        widget.ad['categoria']?.toString(),
                      );
                      _loadAttributes(
                        value == original
                            ? _parseAttributes(widget.ad['atributos_clave'])
                            : <String, dynamic>{},
                      );
                    }),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    key: ValueKey('sub-$_category'),
                    initialValue: subcategories.contains(_subcategory)
                        ? _subcategory
                        : null,
                    isExpanded: true,
                    decoration: _decoration('Subcategoría'),
                    items: subcategories
                        .map((sub) =>
                            DropdownMenuItem(value: sub, child: Text(sub)))
                        .toList(),
                    onChanged: subcategories.isEmpty
                        ? null
                        : (value) => setState(() => _subcategory = value),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _province,
                    isExpanded: true,
                    decoration: _decoration('Provincia'),
                    items: provinces
                        .map((p) => DropdownMenuItem(value: p, child: Text(p)))
                        .toList(),
                    onChanged: (value) => setState(() {
                      _province = value;
                      _district = null;
                    }),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    key: ValueKey('dist-$_province'),
                    initialValue:
                        districts.contains(_district) ? _district : null,
                    isExpanded: true,
                    decoration: _decoration('Distrito'),
                    items: districts
                        .map((d) => DropdownMenuItem(value: d, child: Text(d)))
                        .toList(),
                    onChanged: districts.isEmpty
                        ? null
                        : (value) => setState(() => _district = value),
                  ),
                  _section(Icons.edit_note, 'Información del anuncio'),
                  TextFormField(
                    controller: _titleController,
                    maxLength: 100,
                    decoration: _decoration(
                      'Título del anuncio *',
                      hint: 'Ej: Toyota Corolla 2020, Excelente Estado',
                    ),
                    validator: (value) {
                      final text = value?.trim() ?? '';
                      if (text.length < 10) {
                        return 'El título debe tener al menos 10 caracteres.';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _priceController,
                    keyboardType: TextInputType.number,
                    decoration: _decoration(
                      'Precio (USD) *',
                      hint: '15000',
                      prefix: '\$ ',
                    ),
                    validator: (value) {
                      final price = double.tryParse(value?.trim() ?? '') ?? 0;
                      return price < 1 ? 'Ingresa un precio válido.' : null;
                    },
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _descController,
                    maxLines: 6,
                    maxLength: 1000,
                    decoration: _decoration(
                      'Descripción *',
                      hint:
                          'Describe las características, estado, mantenimiento, etc.',
                    ),
                    validator: (value) {
                      final text = value?.trim() ?? '';
                      if (text.length < 30) {
                        return 'Escribe al menos 30 caracteres para mejor visibilidad.';
                      }
                      return null;
                    },
                  ),
                  if (fields.isNotEmpty)
                    _attributeGrid(
                      _category == 'Vehículos'
                          ? 'Detalles del vehículo'
                          : 'Detalles del inmueble',
                      fields,
                    ),
                  _section(
                      Icons.photo_library_outlined, 'Imágenes del anuncio'),
                  _photoSection(),
                  const SizedBox(height: 28),
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _saveChanges,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Mc.naranja,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(26),
                        ),
                      ),
                      child: const Text(
                        'GUARDAR CAMBIOS',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
    );
  }
}
