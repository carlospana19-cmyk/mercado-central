import 'dart:async';

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../theme/mc_colores.dart';

class ChatService {
  static final SupabaseClient _client = Supabase.instance.client;

  static const String _conversationSelect = '''
    id, anuncio_id, comprador_id, vendedor_id, ultimo_mensaje_at,
    anuncios(titulo, url_portada, url_galeria),
    comprador:profiles!conversaciones_comprador_id_fkey(nombre_negocio, nombre_completo, url_foto_perfil),
    vendedor:profiles!conversaciones_vendedor_id_fkey(nombre_negocio, nombre_completo, url_foto_perfil)
  ''';

  static Map<String, dynamic> _asMap(dynamic value) =>
      value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{};

  static Future<List<Map<String, dynamic>>> loadConversations() async {
    final user = _client.auth.currentUser;
    if (user == null) return [];

    final rows = await _client
        .from('conversaciones')
        .select(_conversationSelect)
        .or('comprador_id.eq.${user.id},vendedor_id.eq.${user.id}')
        .order('ultimo_mensaje_at', ascending: false)
        .limit(50);

    final conversations = (rows as List)
        .map((row) => Map<String, dynamic>.from(row as Map))
        .toList();
    if (conversations.isEmpty) return conversations;

    try {
      final ids = conversations.map((c) => c['id'].toString()).toList();
      final messages = await _client
          .from('mensajes')
          .select('conversacion_id, emisor_id, contenido, borrado')
          .inFilter('conversacion_id', ids)
          .order('created_at', ascending: false)
          .limit(300);
      final lastByConversation = <String, Map<String, dynamic>>{};
      for (final row in messages as List) {
        final message = Map<String, dynamic>.from(row as Map);
        lastByConversation.putIfAbsent(
          message['conversacion_id'].toString(),
          () => message,
        );
      }
      for (final conversation in conversations) {
        conversation['ultimo_mensaje'] =
            lastByConversation[conversation['id'].toString()];
      }

      final unread = await _client
          .from('mensajes')
          .select('conversacion_id, borrado')
          .inFilter('conversacion_id', ids)
          .eq('leido', false)
          .neq('emisor_id', user.id);
      final unreadByConversation = <String, int>{};
      for (final row in unread as List) {
        if (row['borrado'] == true) continue;
        final id = row['conversacion_id'].toString();
        unreadByConversation[id] = (unreadByConversation[id] ?? 0) + 1;
      }
      for (final conversation in conversations) {
        conversation['no_leidos'] =
            unreadByConversation[conversation['id'].toString()] ?? 0;
      }
    } catch (_) {
      // Sin vista previa si la consulta falla; la lista sigue funcionando.
    }
    return conversations;
  }

  static Future<Map<String, dynamic>?> loadConversation(String id) async {
    final row = await _client
        .from('conversaciones')
        .select(_conversationSelect)
        .eq('id', id)
        .maybeSingle();
    return row == null ? null : Map<String, dynamic>.from(row);
  }

  static Future<String> getOrCreateConversation({
    required String anuncioId,
    required String vendedorId,
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('Inicia sesión para enviar un mensaje.');
    if (user.id == vendedorId) {
      throw Exception('No puedes iniciar un chat con tu propio anuncio.');
    }

    final existing = await _client
        .from('conversaciones')
        .select('id')
        .eq('anuncio_id', anuncioId)
        .eq('comprador_id', user.id)
        .maybeSingle();
    if (existing != null) return existing['id'].toString();

    try {
      final created = await _client
          .from('conversaciones')
          .insert({
            'anuncio_id': anuncioId,
            'comprador_id': user.id,
            'vendedor_id': vendedorId,
          })
          .select('id')
          .single();
      return created['id'].toString();
    } catch (error) {
      // Si dos solicitudes crean la misma conversación a la vez, leer la existente.
      final retry = await _client
          .from('conversaciones')
          .select('id')
          .eq('anuncio_id', anuncioId)
          .eq('comprador_id', user.id)
          .maybeSingle();
      if (retry != null) return retry['id'].toString();
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> sendMessage({
    required String conversationId,
    required String content,
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('Inicia sesión para enviar un mensaje.');

    final text = content.trim();
    if (text.isEmpty) throw Exception('Escribe un mensaje antes de enviarlo.');

    final row = await _client
        .from('mensajes')
        .insert({
          'conversacion_id': conversationId,
          'emisor_id': user.id,
          'contenido': text,
        })
        .select(
            'id, conversacion_id, emisor_id, contenido, created_at, borrado')
        .single();

    try {
      await _client.from('conversaciones').update({
        'ultimo_mensaje_at': DateTime.now().toUtc().toIso8601String()
      }).eq('id', conversationId);
    } catch (_) {
      // El mensaje ya se envió; el orden del buzón se puede actualizar después.
    }

    return Map<String, dynamic>.from(row);
  }

  static Future<dynamic> deleteConversation(String conversationId) =>
      _client.rpc(
        'fn_borrar_conversacion',
        params: {'p_conversacion_id': conversationId},
      );

  static Future<dynamic> deleteMessage(String messageId) => _client.rpc(
        'fn_borrar_mensaje',
        params: {'p_mensaje_id': messageId},
      );

  static Future<List<Map<String, dynamic>>> loadMessages(String id) async {
    final rows = await _client
        .from('mensajes')
        .select(
            'id, conversacion_id, emisor_id, contenido, created_at, borrado')
        .eq('conversacion_id', id)
        .order('created_at', ascending: true)
        .limit(200);
    return (rows as List)
        .map((row) => Map<String, dynamic>.from(row as Map))
        .toList();
  }

  static Future<void> markMessagesRead(String conversationId) async {
    final user = _client.auth.currentUser;
    if (user == null) return;
    try {
      await _client
          .from('mensajes')
          .update({'leido': true})
          .eq('conversacion_id', conversationId)
          .eq('leido', false)
          .neq('emisor_id', user.id);
    } catch (_) {
      // El chat puede seguir funcionando aunque la política no permita marcar leídos.
    }
  }

  static Map<String, dynamic> asMap(dynamic value) => _asMap(value);
}

class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  List<Map<String, dynamic>> _conversations = [];
  RealtimeChannel? _inboxChannel;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadConversations();
    _subscribeToInbox();
  }

  Future<void> _loadConversations() async {
    if (mounted) {
      setState(() {
        _loading = _conversations.isEmpty;
        _error = null;
      });
    }
    try {
      final conversations = await ChatService.loadConversations();
      if (mounted) setState(() => _conversations = conversations);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _subscribeToInbox() {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    _inboxChannel = Supabase.instance.client
        .channel('flutter-chat-inbox-$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'mensajes',
          callback: (_) => _loadConversations(),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'mensajes',
          callback: (_) => _loadConversations(),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'conversaciones',
          callback: (_) => _loadConversations(),
        )
        .subscribe();
  }

  String _otherName(Map<String, dynamic> conversation, String userId) {
    final isBuyer = conversation['comprador_id']?.toString() == userId;
    final other = ChatService.asMap(
      conversation[isBuyer ? 'vendedor' : 'comprador'],
    );
    return (other['nombre_negocio'] ?? other['nombre_completo'] ?? 'Usuario')
        .toString();
  }

  int _unreadCount(Map<String, dynamic> conversation) =>
      (conversation['no_leidos'] as int?) ?? 0;

  Widget _buildConversationCard(
    Map<String, dynamic> conversation,
    Map<String, dynamic> ad,
    String? imageUrl,
    String userId,
  ) {
    final unread = _unreadCount(conversation);
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => _openConversation(conversation),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: SizedBox(
                  width: 48,
                  height: 48,
                  child: imageUrl == null || imageUrl.isEmpty
                      ? const _ChatAdPlaceholder()
                      : Image.network(
                          imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) =>
                              const _ChatAdPlaceholder(),
                        ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _otherName(conversation, userId),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: Mc.texto,
                      ),
                    ),
                    Text(
                      ad['titulo']?.toString() ?? 'Anuncio',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Mc.grisSuave,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _lastMessagePreview(conversation, userId),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 13,
                        color: unread > 0 ? Mc.texto : Mc.grisSuave,
                        fontWeight:
                            unread > 0 ? FontWeight.w600 : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
              if (unread > 0) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: Mc.naranja,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '$unread',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _lastMessagePreview(
    Map<String, dynamic> conversation,
    String userId,
  ) {
    final last = ChatService.asMap(conversation['ultimo_mensaje']);
    if (last.isEmpty) return 'Sin mensajes';
    final text = last['borrado'] == true
        ? 'Mensaje eliminado'
        : (last['contenido'] ?? '').toString();
    return last['emisor_id']?.toString() == userId ? 'Tú: $text' : text;
  }

  Future<void> _openConversation(Map<String, dynamic> conversation) async {
    final userId = Supabase.instance.client.auth.currentUser?.id ?? '';
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ChatConversationPage(
          conversationId: conversation['id'].toString(),
          participantName: _otherName(conversation, userId),
          adTitle: ChatService.asMap(conversation['anuncios'])['titulo']
                  ?.toString() ??
              'Anuncio',
        ),
      ),
    );
    if (mounted) _loadConversations();
  }

  @override
  void dispose() {
    final channel = _inboxChannel;
    if (channel != null)
      unawaited(Supabase.instance.client.removeChannel(channel));
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = Supabase.instance.client.auth.currentUser;
    return Scaffold(
      backgroundColor: const Color(0xFFF7F7F7),
      appBar: AppBar(
        title: const Text('Mis chats'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'Actualizar',
            onPressed: _loadConversations,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: user == null
          ? const _ChatEmptyState(
              icon: Icons.lock_outline,
              title: 'Inicia sesión para ver tus chats',
              subtitle: 'Tus conversaciones aparecerán aquí.',
            )
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? _ChatEmptyState(
                      icon: Icons.error_outline,
                      title: 'No se pudieron cargar los chats',
                      subtitle: _error!,
                      onRetry: _loadConversations,
                    )
                  : _conversations.isEmpty
                      ? const _ChatEmptyState(
                          icon: Icons.chat_bubble_outline,
                          title: 'Aún no tienes conversaciones',
                          subtitle:
                              'Abre un anuncio y envía un mensaje al vendedor para iniciar un chat.',
                        )
                      : RefreshIndicator(
                          onRefresh: _loadConversations,
                          child: ListView.separated(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.all(12),
                            itemCount: _conversations.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 8),
                            itemBuilder: (context, index) {
                              final conversation = _conversations[index];
                              final ad = ChatService.asMap(
                                conversation['anuncios'],
                              );
                              final imageUrl = ad['url_portada']?.toString();
                              return _buildConversationCard(
                                  conversation, ad, imageUrl, user.id);
                            },
                          ),
                        ),
    );
  }
}

class ChatConversationPage extends StatefulWidget {
  const ChatConversationPage({
    super.key,
    required this.conversationId,
    required this.participantName,
    required this.adTitle,
  });

  final String conversationId;
  final String participantName;
  final String adTitle;

  @override
  State<ChatConversationPage> createState() => _ChatConversationPageState();
}

class _ChatConversationPageState extends State<ChatConversationPage> {
  final _client = Supabase.instance.client;
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final List<Map<String, dynamic>> _messages = [];
  RealtimeChannel? _channel;
  bool _loading = true;
  bool _sending = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _subscribeToMessages();
  }

  Future<void> _loadMessages() async {
    try {
      final messages = await ChatService.loadMessages(widget.conversationId);
      if (!mounted) return;
      setState(() {
        _messages
          ..clear()
          ..addAll(messages);
        _error = null;
        _loading = false;
      });
      _scrollToBottom();
      ChatService.markMessagesRead(widget.conversationId);
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error.toString();
          _loading = false;
        });
      }
    }
  }

  void _subscribeToMessages() {
    _channel = _client
        .channel('flutter-chat-${widget.conversationId}')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'mensajes',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'conversacion_id',
            value: widget.conversationId,
          ),
          callback: (payload) {
            _appendMessage(payload.newRecord);
            ChatService.markMessagesRead(widget.conversationId);
          },
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'mensajes',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'conversacion_id',
            value: widget.conversationId,
          ),
          callback: (payload) {
            final message = payload.newRecord;
            if (message['borrado'] == true) {
              _markMessageDeleted(message['id']?.toString());
            }
          },
        )
        .subscribe();
  }

  void _appendMessage(Map<String, dynamic> message) {
    final id = message['id']?.toString();
    if (id == null || _messages.any((item) => item['id']?.toString() == id)) {
      return;
    }
    if (!mounted) return;
    setState(() => _messages.add(Map<String, dynamic>.from(message)));
    _scrollToBottom();
  }

  void _markMessageDeleted(String? messageId) {
    if (messageId == null || !mounted) return;
    final index = _messages.indexWhere(
      (message) => message['id']?.toString() == messageId,
    );
    if (index == -1) return;
    setState(() {
      _messages[index] = {..._messages[index], 'borrado': true};
    });
  }

  Future<void> _deleteMessage(Map<String, dynamic> message) async {
    final messageId = message['id']?.toString();
    if (messageId == null ||
        messageId.isEmpty ||
        message['emisor_id']?.toString() != _client.auth.currentUser?.id ||
        message['borrado'] == true) {
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('¿Eliminar mensaje?'),
        content: const Text('Se eliminará para todos los participantes.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Eliminar para todos'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    try {
      final result = await ChatService.deleteMessage(messageId);
      if (result == 'ok') {
        _markMessageDeleted(messageId);
      } else if (mounted) {
        final messageText = result == 'no_autorizado'
            ? 'Solo puedes eliminar tus propios mensajes.'
            : 'No se pudo eliminar el mensaje.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(messageText)),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('No se pudo eliminar el mensaje: $error')),
        );
      }
    }
  }

  Future<void> _deleteConversation() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Eliminar conversación'),
        content: const Text(
          'Se borrará toda la conversación para los dos. ¿Continuar?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    try {
      final result = await ChatService.deleteConversation(
        widget.conversationId,
      );
      if (!mounted) return;
      if (result == 'ok') {
        Navigator.of(context).pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result == 'no_autorizado'
                  ? 'No puedes eliminar esta conversación.'
                  : 'No se pudo eliminar ($result).',
            ),
          ),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('No se pudo eliminar: $error')),
        );
      }
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      final message = await ChatService.sendMessage(
        conversationId: widget.conversationId,
        content: text,
      );
      _messageController.clear();
      _appendMessage(message);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('No se pudo enviar el mensaje: $error')),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    final channel = _channel;
    if (channel != null) unawaited(_client.removeChannel(channel));
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final userId = _client.auth.currentUser?.id ?? '';
    return Scaffold(
      backgroundColor: const Color(0xFFF4F5F7),
      appBar: AppBar(
        titleSpacing: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.participantName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 16),
            ),
            Text(
              widget.adTitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12, color: Colors.black54),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'Eliminar conversación',
            onPressed: _deleteConversation,
            icon: const Icon(Icons.delete_outline),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? _ChatEmptyState(
                        icon: Icons.error_outline,
                        title: 'No se pudieron cargar los mensajes',
                        subtitle: _error!,
                        onRetry: _loadMessages,
                      )
                    : _messages.isEmpty
                        ? const _ChatEmptyState(
                            icon: Icons.waving_hand_outlined,
                            title: 'Inicia la conversación',
                            subtitle: 'Escribe un mensaje para comenzar.',
                          )
                        : ListView.builder(
                            controller: _scrollController,
                            padding: const EdgeInsets.all(16),
                            itemCount: _messages.length,
                            itemBuilder: (context, index) {
                              final message = _messages[index];
                              final mine =
                                  message['emisor_id']?.toString() == userId;
                              final deleted = message['borrado'] == true;
                              final createdAt = DateTime.tryParse(
                                message['created_at']?.toString() ?? '',
                              );
                              final time = createdAt == null
                                  ? ''
                                  : TimeOfDay.fromDateTime(createdAt.toLocal())
                                      .format(context);
                              return GestureDetector(
                                onLongPress: mine && !deleted
                                    ? () => _deleteMessage(message)
                                    : null,
                                child: Row(
                                  mainAxisAlignment: mine
                                      ? MainAxisAlignment.end
                                      : MainAxisAlignment.start,
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    Container(
                                      constraints: BoxConstraints(
                                        maxWidth:
                                            MediaQuery.sizeOf(context).width *
                                                0.78,
                                      ),
                                      margin: const EdgeInsets.only(bottom: 10),
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 14,
                                        vertical: 10,
                                      ),
                                      decoration: BoxDecoration(
                                        color: mine
                                            ? const Color(0xFF0B9E8F)
                                            : Colors.white,
                                        borderRadius: BorderRadius.only(
                                          topLeft: const Radius.circular(16),
                                          topRight: const Radius.circular(16),
                                          bottomLeft:
                                              Radius.circular(mine ? 16 : 4),
                                          bottomRight:
                                              Radius.circular(mine ? 4 : 16),
                                        ),
                                      ),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.end,
                                        children: [
                                          Text(
                                            deleted
                                                ? 'Mensaje eliminado'
                                                : message['contenido']
                                                        ?.toString() ??
                                                    '',
                                            style: TextStyle(
                                              color: mine
                                                  ? Colors.white
                                                  : Colors.black87,
                                              fontStyle: deleted
                                                  ? FontStyle.italic
                                                  : FontStyle.normal,
                                            ),
                                          ),
                                          if (time.isNotEmpty) ...[
                                            const SizedBox(height: 3),
                                            Text(
                                              time,
                                              style: TextStyle(
                                                fontSize: 10,
                                                color: mine
                                                    ? Colors.white70
                                                    : Colors.black45,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    if (mine && !deleted)
                                      IconButton(
                                        tooltip: 'Eliminar mensaje',
                                        visualDensity: VisualDensity.compact,
                                        padding: const EdgeInsets.only(
                                          bottom: 10,
                                        ),
                                        onPressed: () =>
                                            _deleteMessage(message),
                                        icon: const Icon(
                                          Icons.delete_outline,
                                          size: 18,
                                          color: Colors.black38,
                                        ),
                                      ),
                                  ],
                                ),
                              );
                            },
                          ),
          ),
          SafeArea(
            top: false,
            child: Container(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
              color: Colors.white,
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      minLines: 1,
                      maxLines: 5,
                      textCapitalization: TextCapitalization.sentences,
                      textInputAction: TextInputAction.newline,
                      decoration: InputDecoration(
                        hintText: 'Escribe un mensaje…',
                        filled: true,
                        fillColor: const Color(0xFFF2F3F5),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 11,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _sending ? null : _sendMessage,
                    tooltip: 'Enviar',
                    icon: _sending
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.send_rounded),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChatEmptyState extends StatelessWidget {
  const _ChatEmptyState({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onRetry,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Future<void> Function()? onRetry;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(
          height: 300,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, size: 52, color: Colors.black38),
                  const SizedBox(height: 12),
                  Text(
                    title,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    subtitle,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.black54),
                  ),
                  if (onRetry != null) ...[
                    const SizedBox(height: 14),
                    TextButton.icon(
                      onPressed: onRetry,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Reintentar'),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ChatAdPlaceholder extends StatelessWidget {
  const _ChatAdPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 52,
      height: 52,
      color: Colors.grey.shade200,
      child: const Icon(Icons.image_outlined, color: Colors.grey),
    );
  }
}
