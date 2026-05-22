class AdModel {
  final String id;
  final String titulo;
  final String? descripcion;
  final String precio;
  final String urlPortada;
  final List<String> urlGaleria;
  final String categoria;
  final String provincia;
  final String? distrito;
  final String featuredPlan;
  final Map<String, dynamic> atributosClave;

  AdModel({
    required this.id,
    required this.titulo,
    this.descripcion,
    required this.precio,
    required this.urlPortada,
    required this.urlGaleria,
    required this.categoria,
    required this.provincia,
    this.distrito,
    required this.featuredPlan,
    required this.atributosClave,
  });

  // Transforma el JSON de Supabase en un objeto de la App
  factory AdModel.fromJson(Map<String, dynamic> json) {
    return AdModel(
      id: json['id'].toString(),
      titulo: json['titulo'] ?? 'Sin título',
      descripcion: json['descripcion'],
      precio: json['precio'].toString(),
      urlPortada: json['url_portada'] ?? '',
      urlGaleria: List<String>.from(json['url_galeria'] ?? []),
      categoria: json['categoria'] ?? '',
      provincia: json['provincia'] ?? 'Panamá',
      distrito: json['distrito'],
      featuredPlan: json['featured_plan'] ?? 'free',
      atributosClave: json['atributos_clave'] is Map
          ? json['atributos_clave']
          : {},
    );
  }
}
