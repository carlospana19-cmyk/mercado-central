class AdFilters {
  String? categoria;
  String? provincia;
  String? distrito;
  double? precioMin;
  double? precioMax;
  Map<String, dynamic> atributosExtra = {}; // Para Marca, Modelo, Año, etc.

  AdFilters({
    this.categoria,
    this.provincia,
    this.distrito,
    this.precioMin,
    this.precioMax,
  });

  // Limpiar todos los filtros
  void clear() {
    categoria = null;
    provincia = null;
    distrito = null;
    precioMin = null;
    precioMax = null;
    atributosExtra = {};
  }
}
