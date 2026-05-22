import 'package:flutter/material.dart';

class AdAttributesGrid extends StatelessWidget {
  final Map<String, dynamic> attributes;
  const AdAttributesGrid({super.key, required this.attributes});

  @override
  Widget build(BuildContext context) {
    if (attributes.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F9FA),
        borderRadius: BorderRadius.circular(10),
      ),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 3,
        ),
        itemCount: attributes.length,
        itemBuilder: (context, index) {
          String key = attributes.keys.elementAt(index);
          String value = attributes[key].toString();
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                key.toUpperCase(),
                style: const TextStyle(
                  fontSize: 10,
                  color: Colors.grey,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
