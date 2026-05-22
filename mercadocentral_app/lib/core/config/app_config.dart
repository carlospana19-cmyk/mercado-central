import 'package:flutter/material.dart';

class AppConfig {
  // 1. LÍMITES DE PLANES (Traducción exacta de AppConfig.js)
  static const Map<String, dynamic> planLimits = {
    'free': {'maxFotos': 5, 'price': 0, 'label': 'Gratis', 'priority': 0},
    'basico': {'maxFotos': 10, 'price': 10, 'label': 'Básico', 'priority': 1},
    'premium': {'maxFotos': 15, 'price': 20, 'label': 'Premium', 'priority': 2},
    'destacado': {
      'maxFotos': 20,
      'price': 30,
      'label': 'Destacado',
      'priority': 3,
    },
  };

  // 2. ATRIBUTOS PRIORITARIOS (Para las tarjetas del Home)
  static const Map<int, List<String>> categoryAttributes = {
    1: ['marca', 'anio', 'kilometraje'], // Vehículos
    2: ['m2', 'habitaciones', 'banos'], // Inmuebles
    3: ['marca', 'modelo', 'almacenamiento'], // Electrónica
    7: ['raza', 'edad_mascota', 'genero'], // Mascotas
  };

  // 3. CATEGORÍAS PRINCIPALES (Traducción de config-categories.js)
  static const List<Map<String, dynamic>> mainCategories = [
    {'id': 1, 'nombre': 'Vehículos', 'icon': Icons.directions_car},
    {'id': 2, 'nombre': 'Inmuebles', 'icon': Icons.home},
    {'id': 3, 'nombre': 'Electrónica', 'icon': Icons.devices},
    {'id': 4, 'nombre': 'Hogar', 'icon': Icons.chair},
    {'id': 7, 'nombre': 'Mascotas', 'icon': Icons.pets},
    {'id': 8, 'nombre': 'Servicios', 'icon': Icons.build},
  ];
}
