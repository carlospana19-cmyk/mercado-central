import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class PlanSelectionStep extends StatelessWidget {
  final String selectedPlan;
  final ValueChanged<String> onPlanSelected;

  const PlanSelectionStep({
    super.key,
    required this.selectedPlan,
    required this.onPlanSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Elige tu plan de publicación',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.blueGrey,
          ),
        ),
        const SizedBox(height: 20),
        _buildPlanCard(
          id: 'free',
          title: 'GRATIS',
          price: '\$0.00',
          duration: '30 días',
          benefits: ['Hasta 5 fotos', 'Publicación inmediata'],
          color: Colors.grey.shade400!,
        ),
        _buildPlanCard(
          id: 'basico',
          title: 'BÁSICO',
          price: '\$10.00',
          duration: '30 días',
          badge: 'RECOMENDADO',
          benefits: [
            'Hasta 10 fotos',
            'Posición superior en búsquedas',
            'Soporte prioritario',
          ],
          color: AppColors.primary,
        ),
        _buildPlanCard(
          id: 'destacado',
          title: 'DESTACADO',
          price: '\$25.00',
          duration: '60 días',
          badge: 'MÁXIMA EXPOSICIÓN',
          benefits: [
            'Fotos ilimitadas',
            'Etiqueta TOP',
            'Carrusel principal (Hero)',
            'Video permitido',
          ],
          color: const Color(0xFFFFD700), // Dorado
        ),
      ],
    );
  }

  Widget _buildPlanCard({
    required String id,
    required String title,
    required String price,
    required String duration,
    required List<String> benefits,
    required Color color,
    String? badge,
  }) {
    final isSelected = selectedPlan == id;

    return GestureDetector(
      onTap: () => onPlanSelected(id),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        margin: const EdgeInsets.only(bottom: 15),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.05) : Colors.white,
          borderRadius: BorderRadius.circular(15),
          border: Border.all(
            color: isSelected ? color : Colors.grey.shade300!,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: color.withOpacity(0.2),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [],
        ),
        child: Stack(
          children: [
            if (badge != null)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: const BorderRadius.only(
                      topRight: Radius.circular(13),
                      bottomLeft: Radius.circular(10),
                    ),
                  ),
                  child: Text(
                    badge,
                    style: const TextStyle(
                      fontSize: 10,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Radio<String>(
                    value: id,
                    groupValue: selectedPlan,
                    onChanged: (val) => onPlanSelected(val!),
                    activeColor: color,
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: color,
                          ),
                        ),
                        const SizedBox(height: 5),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              price,
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            Text(
                              ' / $duration',
                              style: const TextStyle(
                                fontSize: 12,
                                color: Colors.grey,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        ...benefits.map(
                          (b) => Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.check_circle,
                                  size: 14,
                                  color: color,
                                ),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    b,
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
