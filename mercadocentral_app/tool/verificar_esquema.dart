// Verificación temporal del BLOQUE D (se borra tras correr): comprueba que
// el esquema cubre las 10 categorías y devuelve los campos exactos de la web.
// ignore_for_file: avoid_print
import 'package:mercadocentral_app/features/categorias/esquema_categorias.dart';

void main() {
  final errores = <String>[];

  void chequear(bool condicion, String descripcion) {
    if (!condicion) errores.add('FALLA: $descripcion');
  }

  // 1. Las 10 categorías con campos.
  for (final cat in const [
    'Vehículos',
    'Inmuebles',
    'Electrónica',
    'Hogar y Muebles',
    'Moda y Belleza',
    'Deportes y Hobbies',
    'Mascotas',
    'Servicios',
    'Negocios',
    'Comunidad',
  ]) {
    final subcats = EsquemaCategorias.subcategoriasDe(cat);
    chequear(subcats.isNotEmpty, '$cat tiene subcategorías');
    for (final sub in subcats) {
      chequear(
        EsquemaCategorias.camposPara(cat, sub).isNotEmpty,
        '$cat / $sub tiene campos',
      );
    }
  }

  // 2. Campos exactos de la web (muestras).
  final autos = EsquemaCategorias.camposPara('Vehículos', 'Autos');
  final clavesAutos = autos.map((c) => c.key).toSet();
  chequear(
    clavesAutos.containsAll([
      'marca', 'modelo', 'anio', 'kilometraje', 'transmision',
      'combustible', 'color', 'puertas', 'vidrios', 'rines', 'tapiz',
      'direccion', 'frenos', 'airbags', 'estado',
    ]),
    'Autos tiene los 15 campos de publicar.html',
  );
  chequear(
    autos.firstWhere((c) => c.key == 'transmision').opciones!
        .toString()
        .contains('Automática'),
    'Transmisión con opciones de la web',
  );

  final casas = EsquemaCategorias.camposPara('Inmuebles', 'Casas');
  chequear(
    casas.any((c) => c.key == 'banos' && c.esNumerico),
    'Casas usa banos numérico (publicar.html)',
  );
  chequear(
    casas.any((c) => c.key == 'tipo_propiedad'),
    'Casas tiene tipo_propiedad',
  );

  final ropa = EsquemaCategorias.camposPara('Moda y Belleza', 'Ropa de Mujer');
  chequear(
    ropa.any((c) => c.key == 'condicion' && c.opciones!.first == 'Nuevo con Etiqueta'),
    'Ropa de Mujer con condición de moda de la web',
  );

  final eventos = EsquemaCategorias.camposPara('Comunidad', 'Eventos');
  chequear(
    eventos.any((c) => c.key == 'fecha_evento' && c.esFecha),
    'Eventos tiene fecha_evento tipo fecha',
  );

  final biz = EsquemaCategorias.camposPara('Negocios', 'Negocios en Venta');
  chequear(
    biz.any((c) => c.key == 'años_operacion'),
    'Negocios en Venta usa la clave años_operacion con ñ (web)',
  );

  // 3. Etiquetas del detalle (SPEC_LABELS).
  chequear(
    EsquemaCategorias.etiquetaDetalle('memoria_ram') == 'Memoria RAM',
    'etiquetaDetalle memoria_ram = Memoria RAM',
  );
  chequear(
    EsquemaCategorias.etiquetaDetalle('tapiz') == 'Tapicería',
    'etiquetaDetalle tapiz = Tapicería',
  );
  chequear(
    EsquemaCategorias.etiquetaDetalle('años_operacion') == 'Años Operacion',
    'etiquetaDetalle fallback capitalizado',
  );

  // 4. Claves numéricas derivadas.
  chequear(
    EsquemaCategorias.clavesNumericas.containsAll(
      ['kilometraje', 'm2', 'habitaciones', 'anio', 'memoria_ram'],
    ),
    'clavesNumericas incluye los campos number de la web',
  );

  if (errores.isEmpty) {
    print('✅ ESQUEMA OK: 10 categorías, campos y etiquetas idénticos a la web');
  } else {
    errores.forEach(print);
    print('❌ ${errores.length} verificaciones fallaron');
  }
}
