import 'dart:convert'; // NUEVO: Para decodificar los atributos clave
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mercadocentral_app/features/chat/screens/chat_page.dart';
import 'package:mercadocentral_app/features/profile/screens/edit_ad_page.dart';
import '../../../core/services/review_service.dart';
import '../../../theme/mc_colores.dart';
import '../widgets/ad_spec_highlights.dart';
import '../widgets/seller_reviews_widget.dart';

class _SellerMessageDialog extends StatefulWidget {
  const _SellerMessageDialog();

  @override
  State<_SellerMessageDialog> createState() => _SellerMessageDialogState();
}

class _SellerMessageDialogState extends State<_SellerMessageDialog> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Escribe al vendedor'),
      content: TextField(
        controller: _controller,
        autofocus: true,
        minLines: 2,
        maxLines: 4,
        textCapitalization: TextCapitalization.sentences,
        decoration: const InputDecoration(
          hintText: 'Hola, me interesa este anuncio…',
          border: OutlineInputBorder(),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(context, _controller.text.trim()),
          child: const Text('Enviar'),
        ),
      ],
    );
  }
}

class _SellerReviewDialog extends StatefulWidget {
  const _SellerReviewDialog();

  @override
  State<_SellerReviewDialog> createState() => _SellerReviewDialogState();
}

class _SellerReviewDialogState extends State<_SellerReviewDialog> {
  final _commentController = TextEditingController();
  int _rating = 0;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
        title: const Text('Calificar al vendedor'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                5,
                (index) => IconButton(
                  visualDensity: VisualDensity.compact,
                  onPressed: () => setState(() => _rating = index + 1),
                  icon: Icon(
                    index < _rating ? Icons.star : Icons.star_border,
                    color: const Color(0xFFD4AF37),
                  ),
                ),
              ),
            ),
            TextField(
              controller: _commentController,
              minLines: 2,
              maxLines: 4,
              maxLength: 500,
              decoration: const InputDecoration(
                hintText: 'Cuéntales a otros cómo fue tu experiencia',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: _rating == 0
                ? null
                : () => Navigator.pop(context, {
                      'rating': _rating,
                      'comment': _commentController.text.trim(),
                    }),
            style: FilledButton.styleFrom(backgroundColor: Mc.naranja),
            child: const Text('Enviar reseña'),
          ),
        ],
      );
}

class AdDetailsPage extends StatefulWidget {
  final Map<String, dynamic> ad;

  const AdDetailsPage({super.key, required this.ad});

  @override
  State<AdDetailsPage> createState() => _AdDetailsPageState();
}

class _AdDetailsPageState extends State<AdDetailsPage> {
  int _currentImageIndex = 0;
  final PageController _galleryController = PageController();
  List<String> _allImages = [];
  Map<String, dynamic> _sellerProfile = {};
  int _reviewsVersion = 0;
  final _reviewService = ReviewService();

  @override
  void initState() {
    super.initState();
    _extractAllImages();
    _loadSellerProfile();
  }

  @override
  void dispose() {
    _galleryController.dispose();
    super.dispose();
  }

  Future<void> _loadSellerProfile() async {
    final sellerId = widget.ad['user_id']?.toString();
    if (sellerId == null || sellerId.isEmpty) return;

    try {
      final profile = await Supabase.instance.client
          .from('profiles')
          .select(
            'telefono, email, nombre_negocio, nombre_completo, url_foto_perfil',
          )
          .eq('id', sellerId)
          .maybeSingle();
      if (mounted && profile != null) {
        setState(() => _sellerProfile = Map<String, dynamic>.from(profile));
      }
    } catch (error) {
      debugPrint('No se pudo cargar el contacto del vendedor: $error');
    }
  }

  String _formatPrice(dynamic rawPrice) {
    final price = num.tryParse(rawPrice?.toString() ?? '');
    if (price == null) return 'Consultar';
    final fixed = price.toStringAsFixed(2).split('.');
    final grouped = fixed.first.replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (_) => ',',
    );
    return 'B/. $grouped.${fixed.last}';
  }

  String _publishedDate() {
    final value = widget.ad['fecha_publicacion'] ?? widget.ad['created_at'];
    final date = DateTime.tryParse(value?.toString() ?? '');
    if (date == null) return 'Fecha no disponible';
    final days = DateTime.now().difference(date.toLocal()).inDays;
    if (days <= 0) return 'Publicado hoy';
    if (days == 1) return 'Publicado hace 1 día';
    if (days < 30) return 'Publicado hace $days días';
    if (days < 60) return 'Publicado hace 1 mes';
    return 'Publicado hace ${days ~/ 30} meses';
  }

  bool get _isOwner =>
      widget.ad['user_id']?.toString() ==
      Supabase.instance.client.auth.currentUser?.id;

  bool get _hasSellerPhone =>
      (widget.ad['contact_phone'] ?? _sellerProfile['telefono'])
          ?.toString()
          .trim()
          .isNotEmpty ??
      false;

  String _locationText(Map<String, dynamic> ad) {
    final district = ad['distrito']?.toString().trim() ?? '';
    final province = ad['provincia']?.toString().trim() ?? '';
    if (district.isEmpty) return province.isEmpty ? 'Panamá' : province;
    if (province.isEmpty || district.toLowerCase() == province.toLowerCase()) {
      return district;
    }
    return '$district, $province';
  }

  Future<void> _editAd() async {
    final updated = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(
        builder: (_) => EditAdPage(ad: widget.ad),
      ),
    );
    if (updated != true || !mounted) return;

    try {
      final refreshed = await Supabase.instance.client
          .from('anuncios')
          .select('*')
          .eq('id', widget.ad['id'].toString())
          .maybeSingle();
      if (refreshed != null) {
        widget.ad.addAll(Map<String, dynamic>.from(refreshed));
        _allImages = [];
        _currentImageIndex = 0;
        _extractAllImages();
        await _loadSellerProfile();
        if (mounted) setState(() {});
      }
    } catch (error) {
      _showContactError('No se pudieron actualizar los detalles: $error');
    }
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
        if (img['url_imagen'] != null) {
          _allImages.add(img['url_imagen'].toString());
        }
      }
    }

    // Eliminamos duplicados por si acaso
    _allImages = _allImages.toSet().toList();
  }

  // 🟢 LA MAGIA DE WHATSAPP
  Future<void> _openWhatsApp(BuildContext context) async {
    String phone = (widget.ad['contact_phone'] ?? _sellerProfile['telefono'])
            ?.toString() ??
        '';

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

  Future<void> _openEmail() async {
    final email = _sellerProfile['email']?.toString().trim() ?? '';
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('El vendedor no ha proporcionado email.')),
      );
      return;
    }
    final title = widget.ad['titulo']?.toString() ?? 'anuncio';
    final uri = Uri(
      scheme: 'mailto',
      path: email,
      queryParameters: {
        'subject': 'Interesado en tu anuncio: $title',
        'body': 'Hola, estoy interesado en tu anuncio "$title".',
      },
    );
    if (!await launchUrl(uri)) _showContactError('No se pudo abrir el email.');
  }

  Future<void> _callSeller() async {
    final phone = (widget.ad['contact_phone'] ?? _sellerProfile['telefono'])
            ?.toString()
            .trim() ??
        '';
    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('El vendedor no ha proporcionado teléfono.')),
      );
      return;
    }
    if (!await launchUrl(Uri(scheme: 'tel', path: phone))) {
      _showContactError('No se pudo abrir la llamada.');
    }
  }

  Future<void> _openMap() async {
    final lat = widget.ad['latitud']?.toString();
    final lng = widget.ad['longitud']?.toString();
    final location = [
      widget.ad['direccion_exacta'],
      widget.ad['distrito'],
      widget.ad['provincia'],
      'Panamá',
    ]
        .where((part) => part != null && part.toString().trim().isNotEmpty)
        .join(', ');
    final query = lat != null && lng != null ? '$lat,$lng' : location;
    final uri = Uri.https('www.google.com', '/maps/search/', {
      'api': '1',
      'query': query,
    });
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      _showContactError('No se pudo abrir el mapa.');
    }
  }

  void _showContactError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _leaveReview() async {
    final user = Supabase.instance.client.auth.currentUser;
    final sellerId = widget.ad['user_id']?.toString();
    if (user == null || sellerId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Inicia sesión para dejar una reseña.')),
      );
      return;
    }
    if (user.id == sellerId) return;

    try {
      final alreadyReviewed =
          await _reviewService.hasUserReviewedSeller(sellerId);
      if (!mounted) return;
      if (alreadyReviewed) {
        _showContactError('Ya calificaste a este vendedor.');
        return;
      }
      final result = await showDialog<Map<String, dynamic>>(
        context: context,
        builder: (_) => const _SellerReviewDialog(),
      );
      if (result == null || !mounted) return;

      await _reviewService.createReview(
        sellerId: sellerId,
        rating: result['rating'] as int,
        comment: result['comment'] as String?,
      );
      if (!mounted) return;
      setState(() => _reviewsVersion++);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gracias, tu reseña fue publicada.')),
      );
    } catch (error) {
      _showContactError('No se pudo publicar la reseña: $error');
    }
  }

  Future<void> _startChat() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Inicia sesión para enviar un mensaje.')),
      );
      return;
    }

    final adId = widget.ad['id']?.toString();
    final sellerId = widget.ad['user_id']?.toString();
    if (adId == null || adId.isEmpty || sellerId == null || sellerId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No se pudo identificar al vendedor.')),
      );
      return;
    }

    final initialMessage = await showDialog<String>(
      context: context,
      builder: (_) => const _SellerMessageDialog(),
    );

    final content = initialMessage?.trim();
    if (!mounted || content == null || content.isEmpty) return;

    try {
      final conversationId = await ChatService.getOrCreateConversation(
        anuncioId: adId,
        vendedorId: sellerId,
      );
      await ChatService.sendMessage(
        conversationId: conversationId,
        content: content,
      );
      if (!mounted) return;

      final participantName = (_sellerProfile['nombre_negocio'] ??
              _sellerProfile['nombre_completo'] ??
              'Vendedor')
          .toString();
      await Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => ChatConversationPage(
            conversationId: conversationId,
            participantName: participantName,
            adTitle: widget.ad['titulo']?.toString() ?? 'Anuncio',
          ),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      final reason = error is PostgrestException
          ? '${error.message}${error.code == null ? '' : ' (${error.code})'}'
          : error.toString().replaceFirst('Exception: ', '');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo iniciar el chat: $reason')),
      );
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
        actions: [
          if (_isOwner)
            IconButton(
              tooltip: 'Editar mi anuncio',
              onPressed: _editAd,
              icon: const Icon(Icons.edit_outlined),
            ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    ad['titulo']?.toString() ?? 'Sin título',
                    style: const TextStyle(
                      fontSize: 24,
                      height: 1.2,
                      fontWeight: FontWeight.w700,
                      color: Mc.texto,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today_outlined,
                          size: 14, color: Mc.grisSuave),
                      const SizedBox(width: 7),
                      Text(
                        _publishedDate(),
                        style: const TextStyle(
                          color: Mc.grisSuave,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
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
                          controller: _galleryController,
                          itemCount: _allImages.length,
                          onPageChanged: (index) {
                            setState(() {
                              _currentImageIndex = index;
                            });
                          },
                          itemBuilder: (context, index) {
                            return Image.network(
                              _allImages[index],
                              fit: BoxFit.contain,
                              errorBuilder: (c, e, s) => Container(
                                color: Colors.grey[200],
                                child: const Icon(
                                  Icons.broken_image,
                                  size: 50,
                                  color: Colors.grey,
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
                        color: Colors.black.withValues(alpha: 0.6),
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
            if (_allImages.length > 1)
              SizedBox(
                height: 82,
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 8,
                  ),
                  scrollDirection: Axis.horizontal,
                  itemCount: _allImages.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) => GestureDetector(
                    onTap: () => _galleryController.animateToPage(
                      index,
                      duration: const Duration(milliseconds: 220),
                      curve: Curves.easeOut,
                    ),
                    child: Container(
                      width: 68,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: index == _currentImageIndex
                              ? Mc.naranja
                              : const Color(0xFFE8ECEF),
                          width: index == _currentImageIndex ? 2 : 1,
                        ),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Image.network(
                        _allImages[index],
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const Icon(
                          Icons.broken_image_outlined,
                          color: Mc.grisSuave,
                        ),
                      ),
                    ),
                  ),
                ),
              ),

            // 2. DETALLES DEL PRODUCTO
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _formatPrice(ad['precio']),
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Mc.texto,
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
                      Expanded(
                        child: Text(
                          _locationText(ad),
                          style: const TextStyle(
                            color: Mc.grisSuave,
                            fontSize: 14,
                          ),
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

                  // Características dinámicas, con el orden de la web.
                  Builder(
                    builder: (context) {
                      final attributes = _getAttributes();
                      if (attributes.isEmpty) return const SizedBox.shrink();

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Divider(
                            height: 36,
                            thickness: 1,
                            color: Color(0xFFEEEEEE),
                          ),
                          const Text(
                            'Características y detalles',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 15),
                          AdSpecHighlights(
                            categoria: ad['categoria']?.toString() ?? '',
                            attributes: attributes,
                          ),
                        ],
                      );
                    },
                  ),

                  const SizedBox(height: 22),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: const Color(0xFFE8ECEF)),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: const Color(0xFFF6F8FA),
                              backgroundImage:
                                  (_sellerProfile['url_foto_perfil']
                                              ?.toString()
                                              .isNotEmpty ??
                                          false)
                                      ? NetworkImage(
                                          _sellerProfile['url_foto_perfil']
                                              .toString(),
                                        )
                                      : null,
                              child: (_sellerProfile['url_foto_perfil']
                                          ?.toString()
                                          .isNotEmpty ??
                                      false)
                                  ? null
                                  : const Icon(Icons.person_outline),
                            ),
                            const SizedBox(width: 11),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Vendedor',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Mc.grisSuave,
                                    ),
                                  ),
                                  Text(
                                    (_sellerProfile['nombre_negocio'] ??
                                            _sellerProfile['nombre_completo'] ??
                                            'Usuario verificado')
                                        .toString(),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      color: Mc.texto,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        if (!_isOwner) ...[
                          const SizedBox(height: 14),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              if ((ad['contact_phone'] ??
                                          _sellerProfile['telefono'])
                                      ?.toString()
                                      .trim()
                                      .isNotEmpty ??
                                  false)
                                OutlinedButton.icon(
                                  onPressed: () => _openWhatsApp(context),
                                  icon: const Icon(Icons.chat, size: 18),
                                  label: const Text('WhatsApp'),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: const Color(0xFF168A4A),
                                  ),
                                ),
                              if ((_sellerProfile['telefono']
                                      ?.toString()
                                      .trim()
                                      .isNotEmpty ??
                                  false))
                                OutlinedButton.icon(
                                  onPressed: _callSeller,
                                  icon: const Icon(Icons.phone_outlined,
                                      size: 18),
                                  label: const Text('Llamar'),
                                ),
                              if ((_sellerProfile['email']
                                      ?.toString()
                                      .trim()
                                      .isNotEmpty ??
                                  false))
                                OutlinedButton.icon(
                                  onPressed: _openEmail,
                                  icon: const Icon(Icons.email_outlined,
                                      size: 18),
                                  label: const Text('Email'),
                                ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(11),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF6F8FA),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Text(
                              'Consejo: reúnete en un lugar público y paga solo al recibir el producto.',
                              style: TextStyle(
                                color: Mc.grisSuave,
                                fontSize: 12,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  if (!_isOwner)
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _startChat,
                        icon: const Icon(Icons.chat_bubble_outline),
                        label: const Text('Enviar mensaje directo'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Mc.naranjaOscuro,
                          side: const BorderSide(color: Mc.naranja),
                        ),
                      ),
                    ),
                  if ((ad['direccion_exacta'] ??
                          ad['distrito'] ??
                          ad['provincia']) !=
                      null) ...[
                    const SizedBox(height: 18),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        border: Border.all(color: const Color(0xFFE8ECEF)),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Ubicación del anuncio',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(_locationText(ad)),
                          const SizedBox(height: 10),
                          OutlinedButton.icon(
                            onPressed: _openMap,
                            icon: const Icon(Icons.directions_outlined),
                            label: const Text('Ver ruta / Cómo llegar'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Mc.naranjaOscuro,
                              side: const BorderSide(color: Mc.naranja),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  if (ad['user_id']?.toString().isNotEmpty ?? false) ...[
                    const SizedBox(height: 18),
                    SellerReviewsWidget(
                      key: ValueKey('${ad['user_id']}_$_reviewsVersion'),
                      sellerId: ad['user_id'].toString(),
                      onLeaveReview: !_isOwner &&
                              Supabase.instance.client.auth.currentUser != null
                          ? _leaveReview
                          : null,
                    ),
                  ],
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ],
        ),
      ),

      // 3. BARRA INFERIOR FIJA CON EL BOTÓN DE WHATSAPP
      bottomNavigationBar: _isOwner || !_hasSellerPhone
          ? null
          : Container(
              padding: const EdgeInsets.all(15),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -5),
                  ),
                ],
              ),
              child: SafeArea(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: const Color(0xFF25D366),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  icon: const Icon(Icons.chat),
                  label: const Text(
                    'Chat por WhatsApp',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                  ),
                  onPressed: () => _openWhatsApp(context),
                ),
              ),
            ),
    );
  }
}
