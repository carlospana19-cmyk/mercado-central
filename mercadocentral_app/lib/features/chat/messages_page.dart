import 'package:flutter/material.dart';
import 'package:mercadocentral_app/services/chat_service.dart';
import 'chat_page.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class MessagesPage extends StatefulWidget {
  const MessagesPage({
    super.key,
    this.initialConversationId,
  });

  final String? initialConversationId;

  @override
  State<MessagesPage> createState() => _MessagesPageState();
}

class _MessagesPageState extends State<MessagesPage> {
  bool _loading = true;
  String? _loadError;
  List<Map<String, dynamic>> _conversations = [];
  bool _initialConversationOpened = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (mounted) {
      setState(() {
        _loading = true;
        _loadError = null;
      });
    }

    try {
      final conversations = await ChatService.loadConversations();
      if (!mounted) return;

      setState(() {
        _conversations = conversations;
        _loading = false;
      });

      final initialId = widget.initialConversationId;
      if (!_initialConversationOpened && initialId != null) {
        _initialConversationOpened = true;
        _openChat(initialId);
      }
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _loadError = 'No se pudieron cargar las conversaciones.';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al cargar conversaciones: $error')),
      );
    }
  }

  void _openChat(String conversationId) {
    Navigator.of(context)
        .push(
      MaterialPageRoute<void>(
        builder: (_) => ChatPage(conversationId: conversationId),
      ),
    )
        .then((_) {
      if (mounted) _load();
    });
  }

  Map<String, dynamic> _asMap(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) return Map<String, dynamic>.from(value);
    return const {};
  }

  String? _coverImage(Map<String, dynamic> ad) {
    final cover = ad['url_portada'];
    if (cover is String && cover.isNotEmpty) return cover;

    final gallery = ad['url_galeria'];
    if (gallery is List && gallery.isNotEmpty && gallery.first is String) {
      final firstImage = gallery.first as String;
      if (firstImage.isNotEmpty) return firstImage;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _conversations.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_loadError != null && _conversations.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_loadError!, textAlign: TextAlign.center),
            const SizedBox(height: 8),
            TextButton(
              onPressed: _load,
              child: const Text('Reintentar'),
            ),
          ],
        ),
      );
    }

    if (_conversations.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [
            SizedBox(height: 100),
            Icon(Icons.forum_outlined, size: 60, color: Colors.grey),
            SizedBox(height: 12),
            Center(
              child: Text(
                'Aún no tienes conversaciones',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            SizedBox(height: 4),
            Center(
              child: Text(
                'Cuando alguien se interese por un anuncio,\nel chat aparecerá aquí',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ),
          ],
        ),
      );
    }

    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
    return Stack(
      children: [
        RefreshIndicator(
          onRefresh: _load,
          child: ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            itemCount: _conversations.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final conversation = _conversations[index];
              final isBuyer = conversation['comprador_id'] == currentUserId;
              final participant = _asMap(
                isBuyer ? conversation['vendedor'] : conversation['comprador'],
              );
              final ad = _asMap(conversation['anuncios']);
              final name = (participant['nombre_negocio'] as String?)
                          ?.trim()
                          .isNotEmpty ==
                      true
                  ? (participant['nombre_negocio'] as String).trim()
                  : (participant['nombre_completo'] as String?)?.trim();
              final unreadValue = conversation['unread'];
              final unread = unreadValue is int ? unreadValue : 0;
              final imageUrl = _coverImage(ad);
              final conversationId = conversation['id']?.toString();

              return ListTile(
                leading: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: SizedBox(
                    width: 48,
                    height: 48,
                    child: imageUrl == null
                        ? const ColoredBox(
                            color: Color(0xFFF1F1F1),
                            child:
                                Icon(Icons.image_outlined, color: Colors.grey),
                          )
                        : Image.network(
                            imageUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const ColoredBox(
                              color: Color(0xFFF1F1F1),
                              child: Icon(
                                Icons.image_outlined,
                                color: Colors.grey,
                              ),
                            ),
                          ),
                  ),
                ),
                title: Text(
                  name?.isNotEmpty == true ? name! : 'Usuario',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                subtitle: Text(
                  ad['titulo']?.toString() ?? 'Anuncio',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12.5),
                ),
                trailing: unread > 0
                    ? Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFF8A3D),
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: Text(
                          '$unread',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      )
                    : null,
                onTap: conversationId == null
                    ? null
                    : () => _openChat(conversationId),
              );
            },
          ),
        ),
        if (_loading && _conversations.isNotEmpty)
          const Align(
            alignment: Alignment.topCenter,
            child: LinearProgressIndicator(),
          ),
      ],
    );
  }
}
