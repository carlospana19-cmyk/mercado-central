import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/theme/app_colors.dart';

class EditAdPage extends StatefulWidget {
  final Map<String, dynamic> ad;

  const EditAdPage({super.key, required this.ad});

  @override
  State<EditAdPage> createState() => _EditAdPageState();
}

class _EditAdPageState extends State<EditAdPage> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _descController;
  late TextEditingController _priceController;

  // 🚨 DICCIONARIO PARA LOS ATRIBUTOS DINÁMICOS
  final Map<String, TextEditingController> _attrControllers = {};
  bool _isLoading = false;

  final _supabase = Supabase.instance.client;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.ad['titulo'] ?? '');
    _descController = TextEditingController(
      text: widget.ad['descripcion'] ?? '',
    );
    _priceController = TextEditingController(
      text: widget.ad['precio']?.toString() ?? '',
    );

    _loadDynamicAttributes();
  }

  // 🧩 Extrae el JSON y crea un controlador de texto para cada atributo
  void _loadDynamicAttributes() {
    final attr = widget.ad['atributos_clave'];
    if (attr == null) return;

    Map<String, dynamic> parsedMap = {};

    try {
      if (attr is Map) {
        parsedMap = Map<String, dynamic>.from(attr);
      } else if (attr is String) {
        var decoded = jsonDecode(attr);
        if (decoded is String)
          decoded = jsonDecode(decoded); // Por si viene con doble comilla
        if (decoded is Map) parsedMap = Map<String, dynamic>.from(decoded);
      }
    } catch (e) {
      debugPrint('Error leyendo atributos para edición: $e');
    }

    // Creamos las cajitas de texto con el valor actual
    parsedMap.forEach((key, value) {
      _attrControllers[key] = TextEditingController(text: value.toString());
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _priceController.dispose();
    for (var controller in _attrControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  // 💾 FUNCIÓN PARA GUARDAR EN SUPABASE
  Future<void> _saveChanges() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      // 1. Recopilamos los atributos dinámicos modificados
      Map<String, dynamic> updatedAttributes = {};
      _attrControllers.forEach((key, controller) {
        // Intentamos guardar como número si es posible (ej. año), si no, como texto
        final numValue = num.tryParse(controller.text.trim());
        updatedAttributes[key] = numValue ?? controller.text.trim();
      });

      // 2. Enviamos todo a Supabase
      await _supabase
          .from('anuncios')
          .update({
            'titulo': _titleController.text.trim(),
            'descripcion': _descController.text.trim(),
            'precio': double.tryParse(_priceController.text.trim()) ?? 0,
            // Guardamos el JSON convertido de vuelta a texto seguro
            'atributos_clave': jsonEncode(updatedAttributes),
          })
          .eq('id', widget.ad['id']);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('¡Anuncio actualizado con éxito! ✅'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al guardar: $e'),
            backgroundColor: Colors.red,
          ),
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
      appBar: AppBar(
        title: const Text(
          'Editar Anuncio',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: Colors.black),
        elevation: 0.5,
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // --- DATOS PRINCIPALES ---
                    const Text(
                      'Título del anuncio',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _titleController,
                      decoration: _inputStyle(),
                      validator: (value) =>
                          value == null || value.isEmpty ? 'Requerido' : null,
                    ),
                    const SizedBox(height: 20),

                    const Text(
                      'Precio (\$)',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _priceController,
                      keyboardType: TextInputType.number,
                      decoration: _inputStyle(),
                      validator: (value) =>
                          value == null || value.isEmpty ? 'Requerido' : null,
                    ),
                    const SizedBox(height: 20),

                    const Text(
                      'Descripción',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _descController,
                      maxLines: 4,
                      decoration: _inputStyle(),
                    ),

                    // --- ATRIBUTOS DINÁMICOS ---
                    if (_attrControllers.isNotEmpty) ...[
                      const SizedBox(height: 30),
                      const Divider(color: Color(0xFFEEEEEE), thickness: 1),
                      const SizedBox(height: 20),
                      const Text(
                        'Características Específicas',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 15),

                      // Dibuja los campos dinámicamente según lo que tenga el JSON
                      ..._attrControllers.entries.map((entry) {
                        final labelName = entry.key
                            .replaceAll('_', ' ')
                            .toUpperCase();
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 15),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                labelName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                  color: Colors.grey,
                                ),
                              ),
                              const SizedBox(height: 5),
                              TextFormField(
                                controller: entry.value,
                                decoration: _inputStyle(),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ],

                    const SizedBox(height: 40),

                    // BOTÓN GUARDAR
                    SizedBox(
                      width: double.infinity,
                      height: 55,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: _saveChanges,
                        child: const Text(
                          'GUARDAR CAMBIOS',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  // Estilo reutilizable para los campos de texto
  InputDecoration _inputStyle() {
    return InputDecoration(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide.none,
      ),
      filled: true,
      fillColor: Colors.grey[100],
      contentPadding: const EdgeInsets.symmetric(horizontal: 15, vertical: 15),
    );
  }
}
