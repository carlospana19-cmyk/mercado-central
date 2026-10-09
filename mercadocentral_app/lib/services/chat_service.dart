// Servicio de chat interno, equivalente a chat-logic.js de la web.
import 'package:supabase_flutter/supabase_flutter.dart';

class ChatService {
  static final SupabaseClient _client = Supabase.instance.client;

  static const String _convSelect = '''
    id, anuncio_id, comprador_id, vendedor_id, ultimo_mensaje_at,
    anuncios(titulo, url_portada, url_galeria),
    comprador:profiles!conversaciones_comprador_id_fkey(nombre_negocio, nombre_completo, url_foto_perfil),
    vendedor:profiles!conversaciones_vendedor_id_fkey(nombre_negocio, nombre_completo, url_foto_perfil)
  ''';

  /// Busca una conversación existente o crea una por anuncio y comprador.
  static Future<String> getOrCreateConversation(
    int anuncioId,
    String vendedorId,
  ) async {
    final user = _client.auth.currentUser;
    if (user == null) throw StateError('NO_AUTH');
    if (user.id == vendedorId) throw StateError('SELF_CHAT');

    final existing = await _client
        .from('conversaciones')
        .select('id')
        .eq('anuncio_id', anuncioId)
        .eq('comprador_id', user.id)
        .maybeSingle();
    if (existing != null) return existing['id'] as String;

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
      return created['id'] as String;
    } on PostgrestException {
      // Otra solicitud pudo crear primero la conversación única.
      final retry = await _client
          .from('conversaciones')
          .select('id')
          .eq('anuncio_id', anuncioId)
          .eq('comprador_id', user.id)
          .maybeSingle();
      if (retry != null) return retry['id'] as String;
      rethrow;
    }
  }

  /// Envía un mensaje y devuelve su fila persistida para deduplicación.
  static Future<Map<String, dynamic>> sendMessage(
    String conversacionId,
    String contenido,
  ) async {
    final user = _client.auth.currentUser;
    if (user == null) throw StateError('NO_AUTH');

    final text = contenido.trim();
    if (text.isEmpty) {
      throw ArgumentError.value(contenido, 'contenido', 'Message is empty.');
    }
    if (text.length > 2000) {
      throw ArgumentError.value(
        contenido,
        'contenido',
        'Message cannot exceed 2000 characters.',
      );
    }

    final msg = await _client
        .from('mensajes')
        .insert({
          'conversacion_id': conversacionId,
          'emisor_id': user.id,
          'contenido': text,
        })
        .select('id, emisor_id, contenido, created_at')
        .single();

    await _client.from('conversaciones').update({
      'ultimo_mensaje_at': DateTime.now().toUtc().toIso8601String(),
    }).eq('id', conversacionId);

    return Map<String, dynamic>.from(msg);
  }

  /// Carga hasta 200 mensajes en orden cronológico.
  static Future<List<Map<String, dynamic>>> loadMessages(
    String conversacionId,
  ) async {
    final data = await _client
        .from('mensajes')
        .select('id, emisor_id, contenido, created_at')
        .eq('conversacion_id', conversacionId)
        .order('created_at', ascending: true)
        .limit(200);
    return List<Map<String, dynamic>>.from(data);
  }

  /// Marca como leídos los mensajes recibidos en una conversación.
  static Future<void> markAsRead(String conversacionId) async {
    final user = _client.auth.currentUser;
    if (user == null) throw StateError('NO_AUTH');

    await _client
        .from('mensajes')
        .update({'leido': true})
        .eq('conversacion_id', conversacionId)
        .eq('leido', false)
        .neq('emisor_id', user.id);
  }

  /// Carga las conversaciones del usuario y agrega el conteo de no leídos.
  static Future<List<Map<String, dynamic>>> loadConversations() async {
    final user = _client.auth.currentUser;
    if (user == null) throw StateError('NO_AUTH');

    final convs = await _client
        .from('conversaciones')
        .select(_convSelect)
        .or('comprador_id.eq.${user.id},vendedor_id.eq.${user.id}')
        .order('ultimo_mensaje_at', ascending: false)
        .limit(50);

    final list = List<Map<String, dynamic>>.from(convs);
    if (list.isEmpty) return list;

    final conversationIds =
        list.map((conversation) => conversation['id'] as String).toList();
    final unreadMessages = await _client
        .from('mensajes')
        .select('conversacion_id')
        .inFilter('conversacion_id', conversationIds)
        .eq('leido', false)
        .neq('emisor_id', user.id);

    final unreadCounts = <String, int>{};
    for (final message in unreadMessages) {
      final conversationId = message['conversacion_id'] as String;
      unreadCounts.update(
        conversationId,
        (count) => count + 1,
        ifAbsent: () => 1,
      );
    }
    for (final conversation in list) {
      conversation['unread'] = unreadCounts[conversation['id']] ?? 0;
    }

    return list;
  }
}
