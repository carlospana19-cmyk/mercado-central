class LocationHelper {
  // Datos exactos de tu config-locations.js
  static const Map<String, List<String>> districtsByProvince = {
    'Panamá': [
      'Panamá',
      'San Miguelito',
      'Arraiján',
      'Capira',
      'Chame',
      'La Chorrera',
      'Cerro Punta',
    ],
    'Panamá Oeste': [
      'La Chorrera',
      'Capira',
      'Chame',
      'Arraiján',
      'San Carlos',
    ],
    'Colón': [
      'Colón',
      'Portobelo',
      'Chagres',
      'Donoso',
      'Gatún',
      'Margarita',
      'Santa Isabel',
    ],
    'Chiriquí': [
      'David',
      'Bugaba',
      'Renacimiento',
      'Barú',
      'Boquete',
      'Alanje',
      'Tierras Altas',
    ],
    'Veraguas': [
      'Santiago',
      'Atalaya',
      'Mariato',
      'Montijo',
      'La Mesa',
      'San Francisco',
      'Soná',
    ],
    'Coclé': ['Penonomé', 'Aguadulce', 'Natá', 'Olá', 'Antón', 'La Pintada'],
    'Los Santos': [
      'Las Tablas',
      'Los Santos',
      'Guararé',
      'Macaracas',
      'Pedasí',
      'Pocrí',
      'Tonosí',
    ],
    'Herrera': [
      'Chitré',
      'Las Minas',
      'Los Pozos',
      'Ocú',
      'Parita',
      'Pesé',
      'Santa María',
    ],
    'Darién': ['La Palma', 'Chepigana', 'Pinogana', 'Santa Fe'],
    'Bocas del Toro': [
      'Bocas del Toro',
      'Changuinola',
      'Chiriquí Grande',
      'Almirante',
    ],
    'Guna Yala': ['Narganá', 'Puerto Obaldía', 'Ailigandí', 'Tubualá'],
  };

  static List<String> getProvinces() => districtsByProvince.keys.toList();

  static List<String> getDistricts(String province) {
    return districtsByProvince[province] ?? [];
  }

  // Centros y zoom tomados de google-maps-integration.js de la web.
  static const Map<String, (double, double, double)> _provinceCenters = {
    'Panamá': (8.9824, -79.5199, 11),
    'Panamá Oeste': (8.8833, -79.7000, 11),
    'Colón': (9.3212, -79.8864, 10),
    'Chiriquí': (8.4281, -82.4318, 10),
    'Veraguas': (8.2881, -80.7846, 9),
    'Coclé': (8.6784, -80.2829, 10),
    'Los Santos': (7.7589, -80.4331, 10),
    'Herrera': (7.8833, -80.6167, 10),
    'Darién': (7.6997, -77.8086, 8),
    'Bocas del Toro': (9.3333, -82.2500, 10),
    'Guna Yala': (9.5167, -78.9833, 9),
  };

  static const Map<String, (double, double)> _districtCenters = {
    'Panamá': (8.9824, -79.5199),
    'San Miguelito': (9.0500, -79.4667),
    'Arraiján': (8.9500, -79.6333),
    'Capira': (8.7833, -79.8000),
    'Chame': (8.6333, -79.8833),
    'La Chorrera': (8.8833, -79.7833),
    'Cerro Punta': (9.1333, -79.4833),
    'San Carlos': (8.8833, -79.9333),
    'Colón': (9.3212, -79.8864),
    'Portobelo': (9.5500, -79.6500),
    'Chagres': (9.2333, -80.0833),
    'Donoso': (9.1000, -80.4000),
    'Gatún': (9.2667, -79.6500),
    'Margarita': (9.3167, -79.9833),
    'Santa Isabel': (9.4833, -79.7333),
    'David': (8.4281, -82.4318),
    'Bugaba': (8.4833, -82.2000),
    'Renacimiento': (8.6667, -82.8167),
    'Barú': (8.3167, -82.8667),
    'Boquete': (8.7833, -82.2500),
    'Alanje': (8.5667, -82.5500),
    'Tierras Altas': (8.8500, -82.7000),
    'Santiago': (8.1000, -80.9833),
    'Atalaya': (8.2333, -80.9167),
    'Mariato': (7.9667, -81.1333),
    'Montijo': (8.3333, -81.5500),
    'La Mesa': (8.0833, -80.7167),
    'San Francisco': (8.1667, -80.8833),
    'Soná': (7.9333, -81.3167),
    'Penonomé': (8.6784, -80.2829),
    'Aguadulce': (8.2500, -80.4167),
    'Natá': (8.3333, -80.2833),
    'Olá': (8.6667, -80.0333),
    'Antón': (8.4833, -80.2667),
    'La Pintada': (8.5833, -80.1333),
    'Las Tablas': (7.7589, -80.4331),
    'Los Santos': (7.9167, -80.4167),
    'Guararé': (7.7833, -80.2833),
    'Macaracas': (7.7500, -80.5500),
    'Pedasí': (7.5333, -80.1167),
    'Pocrí': (7.7000, -80.2833),
    'Tonosí': (7.4833, -80.3000),
    'Chitré': (7.8833, -80.6167),
    'Las Minas': (7.9833, -80.7000),
    'Los Pozos': (7.9333, -80.8167),
    'Ocú': (7.8500, -80.8500),
    'Parita': (7.9667, -80.5500),
    'Pesé': (7.9333, -80.4667),
    'Santa María': (7.9000, -80.3667),
    'La Palma': (7.6997, -77.8086),
    'Chepigana': (7.5167, -77.8667),
    'Pinogana': (8.1333, -77.5833),
    'Santa Fe': (8.2500, -77.9667),
    'Bocas del Toro': (9.3333, -82.2500),
    'Changuinola': (9.4333, -82.5167),
    'Almirante': (9.2833, -82.4000),
    'Chiriquí Grande': (9.0833, -82.1500),
  };

  /// Centro y zoom del mapa para una provincia y, si existe, su distrito.
  static (double lat, double lng, double zoom) mapCenter(
    String? province, [
    String? district,
  ]) {
    final p = _provinceCenters[province] ?? (8.9824, -79.5199, 8);
    final d = _districtCenters[district];
    if (d != null) return (d.$1, d.$2, 13);
    return p;
  }
}
