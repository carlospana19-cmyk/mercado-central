import 'package:flutter/material.dart';
import '../../../core/services/review_service.dart';

class SellerReviewsWidget extends StatelessWidget {
  final String sellerId;
  final ReviewService _reviewService = ReviewService();

  SellerReviewsWidget({super.key, required this.sellerId});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _reviewService.getSellerStats(sellerId),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const SizedBox.shrink();

        final stats = snapshot.data!;
        final double avg = stats['average'];
        final int total = stats['total'];

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.star, color: Color(0xFFc5a059), size: 20),
                const SizedBox(width: 5),
                Text(
                  avg > 0
                      ? '${avg.toStringAsFixed(1)} ($total reseñas)'
                      : 'Vendedor nuevo (Sin reseñas)',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            if (avg > 0)
              TextButton(
                onPressed: () {
                  // Aquí abriríamos un modal con la lista de comentarios
                },
                child: const Text(
                  'Ver opiniones de compradores',
                  style: TextStyle(color: Colors.blue),
                ),
              ),
          ],
        );
      },
    );
  }
}
