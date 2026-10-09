import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mercadocentral_app/services/chat_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ChatPage extends StatefulWidget {
  const ChatPage({
    super.key,
    required this.conversationId,
    this.onClosed,
  });

  final String conversationId;
  final VoidCallback? onClosed;

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final SupabaseClient _client = Supabase.instance.client;
  final List<Map<String, dynamic>> _messages = [];

  RealtimeChannel? _channel;
  String? _myId;
  bool _isLoading = true;
  bool _isSending = false;
  String? _loadError;

  @override
  void initState() {
    super.initState();
    _myId = _client.auth.currentUser?.id;
    _subscribe();
    _load();
  }

  Future<void> _load() async {
    try {
      final messages = await ChatService.loadMessages(widget.conversationId);
      if (!mounted) return;

      setState(() {
        final messagesById = <String, Map<String, dynamic>>{};
        for (final message in [..._messages, ...messages]) {
          final id = message['id'];
          if (id is String) messagesById[id] = message;
        }
        _messages
          ..clear()
          ..addAll(messagesById.values)
          ..sort(
            (first, second) => DateTime.parse(first['created_at'] as String)
                .compareTo(DateTime.parse(second['created_at'] as String)),
          );
        _isLoading = false;
        _loadError = null;
      });
      _scrollToBottom();
      await _markAsRead();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _loadError = 'No se pudieron cargar los mensajes.';
      });
      _showError('No se pudieron cargar los mensajes: $error');
    }
  }

  void _subscribe() {
    _channel = _client
        .channel('conv-${widget.conversationId}')
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
            final message = Map<String, dynamic>.from(payload.newRecord);
            if (!_addMessage(message)) return;

            if (message['emisor_id'] != _myId) {
              _markAsRead();
            }
          },
        )
        .subscribe();
  }

  bool _addMessage(Map<String, dynamic> message) {
    final messageId = message['id'];
    if (_messages.any((existing) => existing['id'] == messageId)) return false;

    if (!mounted) return false;
    setState(() => _messages.add(message));
    _scrollToBottom();
    return true;
  }

  Future<void> _markAsRead() async {
    try {
      await ChatService.markAsRead(widget.conversationId);
    } catch (error) {
      if (mounted) {
        _showError('No se pudieron marcar los mensajes como leídos: $error');
      }
    }
  }

  Future<void> _send() async {
    if (_isSending) return;
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    if (text.length > 2000) {
      _showError('El mensaje no puede superar los 2000 caracteres.');
      return;
    }

    setState(() => _isSending = true);
    try {
      final message =
          await ChatService.sendMessage(widget.conversationId, text);
      if (!mounted) return;
      _controller.clear();
      _addMessage(message);
    } catch (error) {
      if (mounted) _showError('No se pudo enviar el mensaje: $error');
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      }
    });
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  void _close() {
    final onClosed = widget.onClosed;
    if (onClosed != null) {
      onClosed();
    } else {
      Navigator.of(context).maybePop();
    }
  }

  @override
  void dispose() {
    final channel = _channel;
    if (channel != null) {
      unawaited(_client.removeChannel(channel));
    }
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: _close,
          icon: const Icon(Icons.arrow_back),
          tooltip: 'Volver',
        ),
        title: const Text('Chat', style: TextStyle(fontSize: 16)),
      ),
      body: Column(
        children: [
          Expanded(child: _buildMessages()),
          _buildComposer(),
        ],
      ),
    );
  }

  Widget _buildMessages() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_loadError != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_loadError!),
            const SizedBox(height: 8),
            TextButton(onPressed: _load, child: const Text('Reintentar')),
          ],
        ),
      );
    }
    if (_messages.isEmpty) {
      return const Center(child: Text('Escribe el primer mensaje 👋'));
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(12),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final message = _messages[index];
        final isMine = message['emisor_id'] == _myId;
        final createdAt =
            DateTime.tryParse(message['created_at']?.toString() ?? '')
                ?.toLocal();
        final time = createdAt == null
            ? ''
            : '${createdAt.hour.toString().padLeft(2, '0')}:'
                '${createdAt.minute.toString().padLeft(2, '0')}';

        return Align(
          alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.sizeOf(context).width * 0.75,
            ),
            margin: const EdgeInsets.symmetric(vertical: 4),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isMine ? const Color(0xFF0B9E8F) : Colors.grey[200],
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(16),
                topRight: const Radius.circular(16),
                bottomLeft: Radius.circular(isMine ? 16 : 4),
                bottomRight: Radius.circular(isMine ? 4 : 16),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  message['contenido']?.toString() ?? '',
                  style: TextStyle(
                    color: isMine ? Colors.white : Colors.black87,
                    fontSize: 14.5,
                  ),
                ),
                Text(
                  time,
                  style: TextStyle(
                    fontSize: 9.5,
                    color: isMine ? Colors.white70 : Colors.grey,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildComposer() {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Color.fromRGBO(0, 0, 0, 0.06),
            blurRadius: 8,
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _controller,
              maxLength: 2000,
              minLines: 1,
              maxLines: 4,
              textCapitalization: TextCapitalization.sentences,
              onSubmitted: (_) => _send(),
              decoration: InputDecoration(
                hintText: 'Escribe un mensaje…',
                counterText: '',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: Colors.grey[100],
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 10,
                ),
              ),
            ),
          ),
          IconButton(
            onPressed: _isSending ? null : _send,
            icon: _isSending
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.send, color: Color(0xFF0B9E8F)),
            tooltip: 'Enviar mensaje',
          ),
        ],
      ),
    );
  }
}
