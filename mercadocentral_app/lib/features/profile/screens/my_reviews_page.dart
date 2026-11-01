import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../theme/mc_colores.dart';

class MyReviewsPage extends StatefulWidget {
  const MyReviewsPage({super.key});

  @override
  State<MyReviewsPage> createState() => _MyReviewsPageState();
}

class _MyReviewsPageState extends State<MyReviewsPage> {
  final _client = Supabase.instance.client;
  bool _received = true;
  late Future<List<Map<String, dynamic>>> _reviewsFuture;

  @override
  void initState() {
    super.initState();
    _reviewsFuture = _fetchReviews();
  }

  Future<List<Map<String, dynamic>>> _fetchReviews() async {
    final user = _client.auth.currentUser;
    if (user == null) return [];

    final response = _received
        ? await _client
            .from('reviews')
            .select(
              'id, rating, comment, created_at, '
              'reviewer:reviewer_id(id, nombre_negocio, url_foto_perfil)',
            )
            .eq('seller_id', user.id)
            .order('created_at', ascending: false)
        : await _client
            .from('reviews')
            .select(
                'id, rating, comment, created_at, seller:seller_id(id, nombre_negocio)')
            .eq('reviewer_id', user.id)
            .order('created_at', ascending: false);
    return List<Map<String, dynamic>>.from(response);
  }

  Future<void> _refresh() async {
    setState(() => _reviewsFuture = _fetchReviews());
    await _reviewsFuture;
  }

  void _selectTab(bool received) {
    if (_received == received) return;
    setState(() {
      _received = received;
      _reviewsFuture = _fetchReviews();
    });
  }

  Map<String, dynamic> _nestedMap(dynamic value) {
    if (value is Map) return Map<String, dynamic>.from(value);
    if (value is List && value.isNotEmpty && value.first is Map) {
      return Map<String, dynamic>.from(value.first as Map);
    }
    return {};
  }

  Widget _stars(int rating) => Row(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(
          5,
          (index) => Icon(
            index < rating ? Icons.star : Icons.star_border,
            color: const Color(0xFFD4AF37),
            size: 17,
          ),
        ),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      appBar: AppBar(
        title: const Text('Mis reseñas'),
        backgroundColor: Colors.white,
        foregroundColor: Mc.texto,
        surfaceTintColor: Colors.transparent,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: SegmentedButton<bool>(
              segments: const [
                ButtonSegment(value: true, label: Text('Recibidas')),
                ButtonSegment(value: false, label: Text('Enviadas')),
              ],
              selected: {_received},
              onSelectionChanged: (selection) => _selectTab(selection.first),
              style: SegmentedButton.styleFrom(
                selectedBackgroundColor: Mc.naranja,
                selectedForegroundColor: Colors.white,
              ),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              color: Mc.naranja,
              onRefresh: _refresh,
              child: FutureBuilder<List<Map<String, dynamic>>>(
                future: _reviewsFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(
                      child: CircularProgressIndicator(color: Mc.naranja),
                    );
                  }
                  if (snapshot.hasError) {
                    return _emptyContent(
                      'No se pudieron cargar las reseñas.',
                      icon: Icons.error_outline,
                    );
                  }

                  final reviews = snapshot.data ?? [];
                  if (reviews.isEmpty) {
                    return _emptyContent(
                      _received
                          ? 'Aún no has recibido reseñas.'
                          : 'Aún no has enviado reseñas.',
                      icon:
                          _received ? Icons.star_outline : Icons.send_outlined,
                    );
                  }

                  return ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                    itemCount: reviews.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) =>
                        _reviewCard(reviews[index]),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _emptyContent(String message, {required IconData icon}) => ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(
            height: MediaQuery.sizeOf(context).height * 0.55,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, size: 58, color: const Color(0xFFB8C0C5)),
                  const SizedBox(height: 12),
                  Text(message, style: const TextStyle(color: Mc.grisSuave)),
                ],
              ),
            ),
          ),
        ],
      );

  Widget _reviewCard(Map<String, dynamic> review) {
    final person =
        _nestedMap(_received ? review['reviewer'] : review['seller']);
    final personName = _received
        ? (person['nombre_negocio'] ?? 'Usuario').toString()
        : (person['nombre_negocio'] ?? 'Vendedor').toString();
    final photo = _received ? person['url_foto_perfil']?.toString() : null;
    final rating = (review['rating'] as num?)?.toInt() ?? 0;
    final comment = review['comment']?.toString().trim() ?? '';
    final date = DateTime.tryParse(review['created_at']?.toString() ?? '');

    return Container(
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
                backgroundColor: const Color(0xFFF1F3F5),
                backgroundImage:
                    photo == null || photo.isEmpty ? null : NetworkImage(photo),
                child: photo == null || photo.isEmpty
                    ? const Icon(Icons.person_outline, color: Mc.grisSuave)
                    : null,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _received ? personName : 'Tu reseña',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    if (!_received)
                      Text(
                        'Para: $personName',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Mc.grisSuave,
                        ),
                      ),
                    if (date != null)
                      Text(
                        '${date.toLocal().day}/${date.toLocal().month}/${date.toLocal().year}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Mc.grisSuave,
                        ),
                      ),
                  ],
                ),
              ),
              _stars(rating),
            ],
          ),
          if (comment.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(comment, style: const TextStyle(height: 1.4)),
          ],
        ],
      ),
    );
  }
}
