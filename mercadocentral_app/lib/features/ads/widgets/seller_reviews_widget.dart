import 'package:flutter/material.dart';
import '../../../core/services/review_service.dart';
import '../../../theme/mc_colores.dart';

class SellerReviewsWidget extends StatefulWidget {
  final String sellerId;
  final VoidCallback? onLeaveReview;

  const SellerReviewsWidget({
    super.key,
    required this.sellerId,
    this.onLeaveReview,
  });

  @override
  State<SellerReviewsWidget> createState() => _SellerReviewsWidgetState();
}

class _SellerReviewsWidgetState extends State<SellerReviewsWidget> {
  final _reviewService = ReviewService();
  late Future<_SellerReviewsData> _future;

  @override
  void initState() {
    super.initState();
    _future = _loadReviews();
  }

  Future<_SellerReviewsData> _loadReviews() async {
    final result = await Future.wait([
      _reviewService.getSellerStats(widget.sellerId),
      _reviewService.getReviews(widget.sellerId),
    ]);
    return _SellerReviewsData(
      stats: result[0] as Map<String, dynamic>,
      reviews: result[1] as List<Map<String, dynamic>>,
    );
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_SellerReviewsData>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(18),
              child: CircularProgressIndicator(color: Mc.naranja),
            ),
          );
        }
        if (snapshot.hasError || !snapshot.hasData) {
          return const Text('No se pudieron cargar las reseñas.');
        }

        final data = snapshot.data!;
        final average = (data.stats['average'] as num?)?.toDouble() ?? 0;
        final total = (data.stats['total'] as num?)?.toInt() ?? 0;
        final reviews = data.reviews;

        return Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: const Color(0xFFE8ECEF)),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Opiniones sobre el vendedor',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.star, color: Color(0xFFD4AF37), size: 21),
                  const SizedBox(width: 6),
                  Text(
                    total == 0
                        ? 'Sin reseñas todavía'
                        : '${average.toStringAsFixed(1)} · $total reseñas',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              if (reviews.isNotEmpty) ...[
                const SizedBox(height: 12),
                for (final review in reviews) _buildReview(review),
              ],
              if (widget.onLeaveReview != null) ...[
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: widget.onLeaveReview,
                    icon: const Icon(Icons.star_outline),
                    label: const Text('Calificar al vendedor'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Mc.naranjaOscuro,
                      side: const BorderSide(color: Mc.naranja),
                    ),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildReview(Map<String, dynamic> review) {
    final reviewer = review['reviewer'] is Map
        ? Map<String, dynamic>.from(review['reviewer'] as Map)
        : <String, dynamic>{};
    final name = (reviewer['nombre_negocio'] ?? 'Usuario').toString();
    final photo = reviewer['url_foto_perfil']?.toString();
    final rating = (review['rating'] as num?)?.toInt() ?? 0;
    final date = DateTime.tryParse(review['created_at']?.toString() ?? '');
    final comment = review['comment']?.toString().trim() ?? '';

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: const Color(0xFFF6F8FA),
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
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                    if (date != null)
                      Text(
                        '${date.toLocal().day}/${date.toLocal().month}/${date.toLocal().year}',
                        style: const TextStyle(
                          color: Mc.grisSuave,
                          fontSize: 11,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 3),
                Row(
                  children: List.generate(
                    5,
                    (index) => Icon(
                      index < rating ? Icons.star : Icons.star_border,
                      size: 15,
                      color: const Color(0xFFD4AF37),
                    ),
                  ),
                ),
                if (comment.isNotEmpty) ...[
                  const SizedBox(height: 5),
                  Text(comment, style: const TextStyle(height: 1.4)),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SellerReviewsData {
  final Map<String, dynamic> stats;
  final List<Map<String, dynamic>> reviews;

  const _SellerReviewsData({required this.stats, required this.reviews});
}
