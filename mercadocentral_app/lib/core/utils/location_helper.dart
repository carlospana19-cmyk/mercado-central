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
}
