import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/utils/location_helper.dart';
import '../../../theme/mc_colores.dart';

class EditProfilePage extends StatefulWidget {
  const EditProfilePage({super.key});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  final _formKey = GlobalKey<FormState>();
  final _client = Supabase.instance.client;
  final _picker = ImagePicker();
  final _emailController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _whatsappController = TextEditingController();
  final _businessController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _addressController = TextEditingController();

  String _businessType = '';
  String? _province;
  String? _district;
  String? _photoUrl;
  bool _loading = true;
  bool _saving = false;
  bool _uploadingPhoto = false;

  static const _businessTypes = [
    'Persona Natural',
    'Tienda',
    'Negocio',
    'Empresa',
    'Otro',
  ];

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _whatsappController.dispose();
    _businessController.dispose();
    _descriptionController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    final user = _client.auth.currentUser;
    if (user == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }

    try {
      final profile = await _client
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
      if (!mounted) return;

      _emailController.text =
          (profile?['email'] ?? user.email ?? '').toString();
      if (profile != null) {
        _nameController.text = (profile['nombre_completo'] ?? '').toString();
        _phoneController.text = (profile['telefono'] ?? '').toString();
        _whatsappController.text = (profile['whatsapp'] ?? '').toString();
        _businessController.text = (profile['nombre_negocio'] ?? '').toString();
        _businessType = (profile['tipo_negocio'] ?? '').toString();
        _descriptionController.text = (profile['descripcion'] ?? '').toString();
        _addressController.text = (profile['direccion'] ?? '').toString();
        _photoUrl = profile['url_foto_perfil']?.toString();
        final province = profile['provincia']?.toString();
        _province =
            LocationHelper.getProvinces().contains(province) ? province : null;
        final district = profile['distrito']?.toString();
        _district = _province != null &&
                LocationHelper.getDistricts(_province!).contains(district)
            ? district
            : null;
      }
    } catch (error) {
      _showMessage('No se pudo cargar el perfil: $error', isError: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickAndUploadPhoto() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    final image = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );
    if (image == null || !mounted) return;

    setState(() => _uploadingPhoto = true);
    try {
      final extension = image.name.contains('.')
          ? image.name.split('.').last.toLowerCase()
          : 'jpg';
      final path =
          '${user.id}/profile-${DateTime.now().millisecondsSinceEpoch}.$extension';
      await _client.storage
          .from('imagenes_anuncios')
          .uploadBinary(path, await image.readAsBytes());
      final photoUrl =
          _client.storage.from('imagenes_anuncios').getPublicUrl(path);
      await _client.from('profiles').upsert({
        'id': user.id,
        'url_foto_perfil': photoUrl,
      });
      if (mounted) {
        setState(() => _photoUrl = photoUrl);
        _showMessage('Foto de perfil actualizada.');
      }
    } catch (error) {
      _showMessage('No se pudo subir la foto: $error', isError: true);
    } finally {
      if (mounted) setState(() => _uploadingPhoto = false);
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    final user = _client.auth.currentUser;
    if (user == null) {
      _showMessage('Inicia sesión para guardar tu perfil.', isError: true);
      return;
    }

    setState(() => _saving = true);
    try {
      await _client.from('profiles').upsert({
        'id': user.id,
        'email': _emailController.text.trim(),
        'nombre_completo': _nameController.text.trim(),
        'telefono': _phoneController.text.trim(),
        'whatsapp': _whatsappController.text.trim(),
        'nombre_negocio': _businessController.text.trim(),
        'tipo_negocio': _businessType,
        'descripcion': _descriptionController.text.trim(),
        'provincia': _province,
        'distrito': _district,
        'direccion': _addressController.text.trim(),
        if (_photoUrl != null) 'url_foto_perfil': _photoUrl,
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Perfil actualizado correctamente.')),
      );
      Navigator.pop(context, true);
    } catch (error) {
      _showMessage('No se pudo guardar el perfil: $error', isError: true);
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

  InputDecoration _decoration(String label, {String? hint}) => InputDecoration(
        labelText: label,
        hintText: hint,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Mc.naranja, width: 1.5),
        ),
      );

  Widget _sectionTitle(String title) => Padding(
        padding: const EdgeInsets.only(top: 18, bottom: 12),
        child: Text(
          title,
          style: const TextStyle(
            color: Mc.texto,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
      );

  @override
  Widget build(BuildContext context) {
    final provinces = LocationHelper.getProvinces();
    final districts = _province == null
        ? <String>[]
        : LocationHelper.getDistricts(_province!);

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      appBar: AppBar(
        title: const Text('Editar mi perfil'),
        backgroundColor: Colors.white,
        foregroundColor: Mc.texto,
        surfaceTintColor: Colors.transparent,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Mc.naranja))
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Center(
                    child: Stack(
                      children: [
                        CircleAvatar(
                          radius: 48,
                          backgroundColor: const Color(0xFFE9EDF0),
                          backgroundImage:
                              _photoUrl == null || _photoUrl!.isEmpty
                                  ? null
                                  : NetworkImage(_photoUrl!),
                          child: _photoUrl == null || _photoUrl!.isEmpty
                              ? const Icon(
                                  Icons.person_outline,
                                  size: 48,
                                  color: Mc.grisSuave,
                                )
                              : null,
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: IconButton.filled(
                            onPressed:
                                _uploadingPhoto ? null : _pickAndUploadPhoto,
                            style: IconButton.styleFrom(
                              backgroundColor: Mc.naranja,
                              foregroundColor: Colors.white,
                            ),
                            icon: _uploadingPhoto
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Icon(Icons.camera_alt_outlined),
                          ),
                        ),
                      ],
                    ),
                  ),
                  _sectionTitle('Información personal'),
                  TextFormField(
                    controller: _nameController,
                    maxLength: 100,
                    decoration: _decoration('Nombre completo'),
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Ingresa tu nombre completo.'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    textCapitalization: TextCapitalization.none,
                    autofillHints: const [AutofillHints.email],
                    decoration: _decoration('Correo electrónico de contacto'),
                    validator: (value) {
                      final email = value?.trim() ?? '';
                      if (email.isNotEmpty &&
                          !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
                              .hasMatch(email)) {
                        return 'Ingresa un correo electrónico válido.';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    maxLength: 20,
                    decoration: _decoration('Teléfono', hint: '+507 1234-5678'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _whatsappController,
                    keyboardType: TextInputType.phone,
                    maxLength: 20,
                    decoration: _decoration('WhatsApp', hint: '+507 1234-5678'),
                  ),
                  _sectionTitle('Información de negocio'),
                  TextFormField(
                    controller: _businessController,
                    maxLength: 100,
                    decoration: _decoration('Nombre del negocio o marca'),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _businessTypes.contains(_businessType)
                        ? _businessType
                        : null,
                    decoration: _decoration('Tipo de negocio'),
                    items: _businessTypes
                        .map((type) => DropdownMenuItem(
                              value: type,
                              child: Text(type),
                            ))
                        .toList(),
                    onChanged: (value) =>
                        setState(() => _businessType = value ?? ''),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _descriptionController,
                    maxLength: 500,
                    maxLines: 4,
                    decoration: _decoration(
                      'Descripción / Bio',
                      hint: 'Cuéntanos sobre tu negocio o marca...',
                    ),
                  ),
                  _sectionTitle('Ubicación'),
                  DropdownButtonFormField<String>(
                    initialValue:
                        provinces.contains(_province) ? _province : null,
                    decoration: _decoration('Provincia'),
                    items: provinces
                        .map((province) => DropdownMenuItem(
                              value: province,
                              child: Text(province),
                            ))
                        .toList(),
                    onChanged: (value) => setState(() {
                      _province = value;
                      _district = null;
                    }),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    key: ValueKey(_province),
                    initialValue:
                        districts.contains(_district) ? _district : null,
                    decoration: _decoration('Distrito'),
                    items: districts
                        .map((district) => DropdownMenuItem(
                              value: district,
                              child: Text(district),
                            ))
                        .toList(),
                    onChanged: districts.isEmpty
                        ? null
                        : (value) => setState(() => _district = value),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _addressController,
                    maxLength: 150,
                    decoration: _decoration('Dirección'),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: _saving ? null : _saveProfile,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Mc.naranja,
                        foregroundColor: Colors.white,
                      ),
                      icon: _saving
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.save_outlined),
                      label: Text(_saving ? 'Guardando...' : 'Guardar cambios'),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
