import 'package:flutter/material.dart';

class AdGallerySlider extends StatefulWidget {
  final List<String> images;
  const AdGallerySlider({super.key, required this.images});

  @override
  State<AdGallerySlider> createState() => _AdGallerySliderState();
}

class _AdGallerySliderState extends State<AdGallerySlider> {
  int _currentPage = 0;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        SizedBox(
          height: 300,
          child: PageView.builder(
            itemCount: widget.images.length,
            onPageChanged: (index) => setState(() => _currentPage = index),
            itemBuilder: (context, index) => Image.network(
              widget.images[index],
              fit: BoxFit.cover,
              width: double.infinity,
            ),
          ),
        ),
        // Indicador de puntos (Dots)
        Positioned(
          bottom: 15,
          left: 0,
          right: 0,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              widget.images.length,
              (index) => Container(
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _currentPage == index ? Colors.white : Colors.white54,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
