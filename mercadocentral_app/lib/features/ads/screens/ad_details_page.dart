import 'dart:convert'; // NUEVO: Para decodificar los atributos clave
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../ad_attributes_grid.dart';

class AdDetailsPage extends StatefulWidget {
  final Map<String, dynamic> ad;

  const AdDetailsPage({super.key, required this.ad});

  @override
  State<AdDetailsPage> createState() => _AdDetailsPageState();
}

class _AdDetailsPageState extends State<AdDetailsPage> {
  int _currentImageIndex = 0;
  List<String> _allImages = [];

  @override
  void initState() {
    super.initState();
    _extractAllImages();
  }

  // 🧩 DECODIFICADOR INTELIGENTE DE ATRIBUTOS
  Map<String, dynamic> _getAttributes() {
    final attr = widget.ad['atributos_clave'];
    if (attr == null) return {};

    if (attr is Map) return Map<String, dynamic>.from(attr);

    if (attr is String) {
      try {
        var decoded = jsonDecode(attr);
        // Si viene doblemente convertido a string (ej. "{\"marca\":\"Kia\"}")
        if (decoded is String) decoded = jsonDecode(decoded);

        if (decoded is Map) return Map<String, dynamic>.from(decoded);
      } catch (e) {
        debugPrint('Error leyendo atributos: $e');
      }
    }
    return {};
  }

  // 📸 RECOPILAMOS TODAS LAS FOTOS (Portada + Galería)
  void _extractAllImages() {
    final ad = widget.ad;

    // 1. Añadimos la portada primero
    if (ad['url_portada'] != null && ad['url_portada'].toString().isNotEmpty) {
      _allImages.add(ad['url_portada'].toString());
    }

    // 2. Añadimos las fotos de la galería (dependiendo de cómo vengan de Supabase)
    if (ad['url_galeria'] != null && ad['url_galeria'] is List) {
      for (var img in ad['url_galeria']) {
        if (img.toString().isNotEmpty) _allImages.add(img.toString());
      }
    } else if (ad['imagenes'] != null && ad['imagenes'] is List) {
      for (var img in ad['imagenes']) {
        if (img['url_imagen'] != null)
          _allImages.add(img['url_imagen'].toString());
      }
    }

    // Eliminamos duplicados por si acaso
    _allImages = _allImages.toSet().toList();
  }

  // 🟢 LA MAGIA DE WHATSAPP
  Future<void> _openWhatsApp(BuildContext context) async {
    String phone = widget.ad['contact_phone']?.toString() ?? '';

    if (phone.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'El vendedor no ha proporcionado un número de contacto.',
          ),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    phone = phone.replaceAll(RegExp(r'[^0-9]'), '');
    if (phone.length == 8) phone = '507$phone';

    final title = widget.ad['titulo'] ?? 'tu anuncio';
    final message =
        'Hola, me interesa "$title" que vi en Mercado Central. ¿Sigue disponible?';
    final url = Uri.parse(
      'https://wa.me/$phone?text=${Uri.encodeComponent(message)}',
    );

    try {
      if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
        throw Exception('No se pudo abrir');
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No se pudo abrir WhatsApp. Verifica tu conexión.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final ad = widget.ad;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          'Detalles del Anuncio',
          style: TextStyle(color: Colors.black),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 📸 1. CARRUSEL DE IMÁGENES (GALERÍA)
            Stack(
              children: [
                SizedBox(
                  width: double.infinity,
                  height: 300,
                  child: _allImages.isEmpty
                      ? Container(
                          color: Colors.grey[200],
                          child: const Icon(
                            Icons.camera_alt,
                            size: 50,
                            color: Colors.grey,
                          ),
                        )
                      : PageView.builder(
                          itemCount: _allImages.length,
                          onPageChanged: (index) {
                            setState(() {
                              _currentImageIndex = index;
                            });
                          },
                           itemBuilder: (context, index) {
                             return Transform.scale(
                               scaleX: -1.0,
                               child: Image.network(
                                 _allImages[index],
                                 fit: BoxFit.cover,
                                 errorBuilder: (c, e, s) => Container(
                                   color: Colors.grey[200],
                                   child: const Icon(
                                     Icons.broken_image,
                                     size: 50,
                                     color: Colors.grey,
                                   ),
                                 ),
                               ),
                             );
                           },
                        ),
                ),

                // 🔢 INDICADOR DE NÚMERO DE FOTO (Ej. 1/3)
                if (_allImages.length > 1)
                  Positioned(
                    bottom: 15,
                    right: 15,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${_currentImageIndex + 1} / ${_allImages.length}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
              ],
            ),

            // 2. DETALLES DEL PRODUCTO
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '\$${ad['precio']}',
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    ad['titulo'] ?? 'Sin título',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 15),

                  // Ubicación
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on,
                        color: Colors.grey,
                        size: 18,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        '${ad['provincia'] ?? 'Panamá'}, ${ad['distrito'] ?? ''}',
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),

                  const Divider(
                    height: 40,
                    thickness: 1,
                    color: Color(0xFFEEEEEE),
                  ),

                  const Text(
                    'Descripción',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                   Text(
                     ad['descripcion'] ?? 'Sin descripción proporcionada.',
                     style: const TextStyle(
                       fontSize: 15,
                       height: 1.5,
                       color: Colors.black87,
                     ),
                   ),

                   // 3. LA ZONA DE ATRIBUTOS
                   const Text('Especificaciones', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                   const SizedBox(height: 10),
                   AdAttributesGrid(anuncio: ad), // <-- Nuestro nuevo componente
                   const SizedBox(height: 25),

                   // 🧩 4. DIBUJAMOS LOS ATRIBUTOS DINÁMICOS
                  Builder(
                    builder: (context) {
                      final attributes = _getAttributes();
                      if (attributes.isEmpty)
                        return const SizedBox.shrink(); // Si no hay atributos, no mostramos nada

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Divider(
                            height: 40,
                            thickness: 1,
                            color: Color(0xFFEEEEEE),
                          ),
                          const Text(
                            'Características',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 15),

                          // Grilla de cuadritos
                          Wrap(
                            spacing: 10, // Espacio horizontal
                            runSpacing: 10, // Espacio vertical
                            children: attributes.entries.map((entry) {
                              // Limpiamos la clave (ej: "memoria_ram" -> "MEMORIA RAM")
                              final key = entry.key
                                  .replaceAll('_', ' ')
                                  .toUpperCase();
                              final value = entry.value.toString();

                              return Container(
                                width:
                                    (MediaQuery.of(context).size.width / 2) -
                                    25, // Dos columnas perfectas
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.grey[50],
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: Colors.grey[200]!),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      key,
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: Colors.grey[500],
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      value,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        color: Colors.black87,
                                        fontWeight: FontWeight.w600,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      );
                    },
                  ),

                  const SizedBox(
                    height: 100,
                  ), // Espacio final para el botón de WhatsApp
                ],
              ),
            ),
          ],
        ),
      ),

      // 3. BARRA INFERIOR FIJA CON EL BOTÓN DE WHATSAPP
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SafeArea(
          child:           ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              backgroundColor: Colors.green[600], // Verde estilo WhatsApp
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            icon: const Icon(Icons.chat, color: Colors.white),
            label: const Text(
              'Contactar por WhatsApp',
              style: TextStyle(fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold),
            ),
            onPressed: () async {
              // Extraemos el número del anuncio (o usamos uno de prueba por ahora)
              // Nota: El número debe tener el código de país sin el símbolo '+' (Ej: 50761234567 para Panamá)
              final String phone = ad['contact_phone'] ?? '50760000000';

              // Armamos el mensaje automático
              final String title = ad['titulo'] ?? 'producto';
              final String message = 'Hola, estoy interesado en tu anuncio: "$title" que vi en Mercado Central.';

              // Creamos el enlace oficial de WhatsApp
              final Uri url = Uri.parse('https://wa.me/$phone?text=${Uri.encodeComponent(message)}');

              // Lanzamos la aplicación externa
              if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
                debugPrint('No se pudo abrir WhatsApp');
              }
            },
          ),
        ),
      ),
    );
  }
}
