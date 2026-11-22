/// ESQUEMA DE ATRIBUTOS POR CATEGORÍA (FASE 1 · BLOQUE D).
///
/// ÚNICA FUENTE de los campos de atributos del app, con el mismo patrón de
/// PlanLimits (lib/features/planes/plan_limits.dart): datos espejo de la web,
/// nada hardcodeado en pantallas. Archivos web de origen (se citan por bloque):
///
///  - publish-logic.js L692-L1010: `categoryFieldConfigs` — definición de
///    campos por subcategoría para Electrónica, Hogar y Muebles, Moda y
///    Belleza, Deportes y Hobbies, Mascotas, Servicios, Negocios y Comunidad
///    (type: text/number/select + options + placeholder).
///  - publicar.html L291-L419: sección `vehicle-details` — campos de
///    Vehículos (compartidos por Autos, Motos, Camiones y Otros Vehículos:
///    la web muestra la misma sección para toda la categoría).
///  - publicar.html L464-L560: sección `realestate-details` — campos de
///    Inmuebles (compartidos por Casas, Apartamentos, Terrenos, Locales
///    Comerciales y Oficinas). Las claves son los `name=` del HTML
///    (banos, estacionamiento), que son las que guarda la columna
///    `atributos_clave`.
///  - product-detail-logic.js L147-L162: `SPEC_LABELS` — etiquetas humanas
///    del detalle (espejo exacto en etiquetasDetalle).
///
/// La columna donde se guardan es `anuncios.atributos_clave` (JSON string;
/// publish-logic.js L1147 y publish_service.dart L114-115 la codifican con
/// JSON.stringify / jsonEncode).
///
/// VALIDACIÓN: igual que la web — TODOS los campos son opcionales (el select
/// web abre con "Selecciona" vacío), los number aceptan solo números y los
/// select solo sus opciones.
class CampoAtributo {
  final String key;
  final String etiqueta;
  final String? placeholder;

  /// Campo number en la web (publicar.html input type="number" o
  /// categoryFieldConfigs type: 'number').
  final bool esNumerico;

  /// Campo select en la web: opciones exactas de la web.
  final List<String>? opciones;

  /// Campo date en la web (communitySubcategories: fecha_evento).
  final bool esFecha;

  const CampoAtributo(
    this.key,
    this.etiqueta, {
    this.placeholder,
    this.esNumerico = false,
    this.opciones,
    this.esFecha = false,
  });
}

const List<String> _siNo = ['Sí', 'No'];
const List<String> _estadoConservacion = [
  'Excelente',
  'Bueno',
  'Regular',
  'Necesita reparaciones',
];

// --- VEHÍCULOS (publicar.html L296-L417: #vehicle-fields) ---
const List<CampoAtributo> _camposVehiculo = [
  CampoAtributo('marca', 'Marca', placeholder: 'Ej: Toyota'),
  CampoAtributo('modelo', 'Modelo', placeholder: 'Ej: Hilux 2.4 CD 4x4'),
  CampoAtributo('anio', 'Año', placeholder: 'Ej: 2020', esNumerico: true),
  CampoAtributo('kilometraje', 'Kilometraje',
      placeholder: 'Ej: 50000', esNumerico: true),
  CampoAtributo('transmision', 'Transmisión',
      opciones: ['Automática', 'Manual']),
  CampoAtributo('combustible', 'Combustible',
      opciones: ['Gasolina', 'Diesel', 'Híbrido', 'Eléctrico']),
  CampoAtributo('color', 'Color', placeholder: 'Ej: Blanco'),
  CampoAtributo('puertas', 'Puertas', opciones: ['2', '3', '4', '5']),
  CampoAtributo('vidrios', 'Vidrios', opciones: ['Eléctricos', 'Manuales']),
  CampoAtributo('rines', 'Rines', placeholder: 'Ej: 16 pulgadas'),
  CampoAtributo('tapiz', 'Tapiz', opciones: ['Tela', 'Cuero', 'Vinilo']),
  CampoAtributo('direccion', 'Dirección',
      opciones: ['Asistida', 'Hidráulica', 'Eléctrica']),
  CampoAtributo('frenos', 'Frenos', opciones: ['ABS', 'Discos', 'Tambores']),
  CampoAtributo('airbags', 'Airbags', opciones: _siNo),
  CampoAtributo('estado', 'Estado', opciones: _estadoConservacion),
];

// --- INMUEBLES (publicar.html L464-L560: #realestate-fields) ---
const List<CampoAtributo> _camposInmueble = [
  CampoAtributo('m2', 'Metros Cuadrados (m²)',
      placeholder: 'Ej: 120', esNumerico: true),
  CampoAtributo('habitaciones', 'Habitaciones',
      placeholder: 'Ej: 3', esNumerico: true),
  CampoAtributo('banos', 'Baños', placeholder: 'Ej: 2', esNumerico: true),
  CampoAtributo('piso', 'Piso', placeholder: 'Ej: 5', esNumerico: true),
  CampoAtributo('estacionamiento', 'Estacionamientos',
      placeholder: 'Ej: 1', esNumerico: true),
  CampoAtributo('amueblado', 'Amueblado',
      opciones: ['Sí', 'No', 'Parcialmente']),
  CampoAtributo('ascensor', 'Ascensor', opciones: _siNo),
  CampoAtributo('jardin', 'Jardín', opciones: _siNo),
  CampoAtributo('piscina', 'Piscina', opciones: _siNo),
  CampoAtributo('tipo_propiedad', 'Tipo de Propiedad',
      opciones: ['Casa', 'Apartamento', 'Local', 'Oficina', 'Terreno']),
  CampoAtributo('anio_construccion', 'Año de Construcción',
      placeholder: 'Ej: 2020', esNumerico: true),
  CampoAtributo('estado_conservacion', 'Estado de Conservación',
      opciones: _estadoConservacion),
  CampoAtributo('calefaccion', 'Calefacción',
      opciones: ['Sí', 'No', 'Eléctrica', 'Gas']),
  CampoAtributo('aire_acondicionado', 'Aire acondicionado',
      opciones: ['Sí', 'No', 'Central', 'Split']),
  CampoAtributo('seguridad', 'Seguridad',
      opciones: ['Portero', 'Cámaras', 'Alarmas', 'Conserje', 'Básica']),
  CampoAtributo('orientacion', 'Orientación',
      opciones: ['Norte', 'Sur', 'Este', 'Oeste']),
  CampoAtributo('mascotas', 'Mascotas permitidas',
      opciones: ['Sí', 'No', 'Pequeñas']),
  CampoAtributo('gimnasio', 'Gimnasio', opciones: _siNo),
];

// --- ELECTRÓNICA (publish-logic.js L693-L728) ---
const Map<String, List<CampoAtributo>> _electronica = {
  'Celulares y Teléfonos': [
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: Samsung'),
    CampoAtributo('modelo', 'Modelo', placeholder: 'Ej: Galaxy S21'),
    CampoAtributo('almacenamiento', 'Almacenamiento',
        placeholder: 'Ej: 128', esNumerico: true),
    CampoAtributo('memoria_ram', 'Memoria RAM',
        placeholder: 'Ej: 8', esNumerico: true),
    CampoAtributo('condicion', 'Condición',
        opciones: [
      'Nuevo',
      'Usado - Como Nuevo',
      'Usado - Bueno',
      'Usado - Aceptable',
      'Para Repuestos',
    ]),
  ],
  'Computadoras': [
    CampoAtributo('tipo_computadora', 'Tipo de computadora',
        opciones: ['Laptop', 'Escritorio']),
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: Dell'),
    CampoAtributo('procesador', 'Procesador', placeholder: 'Ej: Intel i5'),
    CampoAtributo('memoria_ram', 'Memoria RAM',
        placeholder: 'Ej: 16', esNumerico: true),
    CampoAtributo('almacenamiento', 'Almacenamiento',
        placeholder: 'Ej: 512', esNumerico: true),
    CampoAtributo('tamano_pantalla', 'Tamaño de pantalla',
        placeholder: 'Ej: 15.6', esNumerico: true),
    CampoAtributo('condicion', 'Condición',
        opciones: [
      'Nuevo',
      'Usado - Como Nuevo',
      'Usado - Bueno',
      'Usado - Aceptable',
      'Para Repuestos',
    ]),
  ],
  'Consolas y Videojuegos': [
    CampoAtributo('plataforma', 'Plataforma',
        opciones: ['PlayStation', 'Xbox', 'Nintendo', 'PC', 'Otra']),
    CampoAtributo('modelo', 'Modelo', placeholder: 'Ej: PlayStation 5'),
    CampoAtributo('almacenamiento', 'Almacenamiento',
        placeholder: 'Ej: 500', esNumerico: true),
    CampoAtributo('condicion', 'Condición',
        opciones: [
      'Nuevo',
      'Usado - Como Nuevo',
      'Usado - Bueno',
      'Usado - Aceptable',
      'Para Repuestos',
    ]),
  ],
  'Audio y Video': [
    CampoAtributo('tipo_articulo', 'Tipo de artículo',
        placeholder: 'Ej: Altavoz'),
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: Sony'),
    CampoAtributo('modelo', 'Modelo', placeholder: 'Ej: WH-1000XM4'),
    CampoAtributo('condicion', 'Condición',
        opciones: [
      'Nuevo',
      'Usado - Como Nuevo',
      'Usado - Bueno',
      'Usado - Aceptable',
      'Para Repuestos',
    ]),
  ],
  'Fotografía': [
    CampoAtributo('tipo_equipo', 'Tipo de equipo',
        opciones: [
      'Cámara Digital',
      'Cámara Réflex',
      'Cámara Mirrorless',
      'Lente',
      'Flash',
      'Trípode',
      'Estabilizador',
      'Drone con Cámara',
      'Accesorios',
      'Otro',
    ]),
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: Canon'),
    CampoAtributo('modelo', 'Modelo', placeholder: 'Ej: EOS R5'),
    CampoAtributo('condicion', 'Condición',
        opciones: [
      'Nuevo',
      'Usado - Como Nuevo',
      'Usado - Bueno',
      'Usado - Aceptable',
      'Para Repuestos',
    ]),
  ],
};

// --- HOGAR Y MUEBLES (publish-logic.js L729-L761) ---
const Map<String, List<CampoAtributo>> _hogarYMuebles = {
  'Artículos de Cocina': [
    CampoAtributo('tipo_articulo', 'Tipo de artículo',
        opciones: ['Utensilios', 'Vajilla', 'Ollas y Sartenes', 'Cuchillería', 'Otro']),
    CampoAtributo('material', 'Material', placeholder: 'Ej: Acero inoxidable'),
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: Oster'),
    CampoAtributo('condicion', 'Condición',
        opciones: ['Nuevo', 'Usado - Excelente', 'Usado - Bueno', 'Para Restaurar']),
  ],
  'Decoración': [
    CampoAtributo('tipo_decoracion', 'Tipo de decoración',
        opciones: ['Cuadro', 'Espejo', 'Lámpara', 'Alfombra', 'Cortina', 'Otro']),
    CampoAtributo('material', 'Material', placeholder: 'Ej: Madera'),
    CampoAtributo('color', 'Color', placeholder: 'Ej: Blanco'),
    CampoAtributo('dimensiones', 'Dimensiones', placeholder: 'Ej: 120x80x75 cm'),
    CampoAtributo('condicion', 'Condición',
        opciones: ['Nuevo', 'Usado - Excelente', 'Usado - Bueno', 'Para Restaurar']),
  ],
  'Electrodomésticos': [
    CampoAtributo('tipo_electrodomestico', 'Tipo de electrodoméstico',
        opciones: [
      'Refrigerador',
      'Lavadora',
      'Microondas',
      'Estufa',
      'Licuadora',
      'Aspiradora',
      'Otro',
    ]),
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: LG'),
    CampoAtributo('modelo', 'Modelo', placeholder: 'Ej: WM3488HW'),
    CampoAtributo('condicion', 'Condición',
        opciones: ['Nuevo', 'Usado - Excelente', 'Usado - Bueno', 'Para Restaurar']),
  ],
  'Jardín y Exterior': [
    CampoAtributo('tipo_articulo', 'Tipo de artículo',
        opciones: [
      'Herramientas de Jardín',
      'Muebles de Jardín',
      'Plantas y Macetas',
      'Parrillas',
      'Iluminación Exterior',
      'Otro',
    ]),
    CampoAtributo('material', 'Material', placeholder: 'Ej: Metal'),
    CampoAtributo('condicion', 'Condición',
        opciones: ['Nuevo', 'Usado - Excelente', 'Usado - Bueno', 'Para Restaurar']),
  ],
  'Muebles': [
    CampoAtributo('tipo_mueble', 'Tipo de mueble',
        opciones: [
      'Sofá',
      'Mesa',
      'Silla',
      'Estantería',
      'Cama',
      'Cómoda',
      'Armario',
      'Otro',
    ]),
    CampoAtributo('material', 'Material', placeholder: 'Ej: Madera'),
    CampoAtributo('color', 'Color', placeholder: 'Ej: Marrón'),
    CampoAtributo('dimensiones', 'Dimensiones', placeholder: 'Ej: 200x90x80 cm'),
    CampoAtributo('condicion', 'Condición',
        opciones: ['Nuevo', 'Usado - Excelente', 'Usado - Bueno', 'Para Restaurar']),
  ],
};

const List<String> _condicionModa = [
  'Nuevo con Etiqueta',
  'Nuevo sin Etiqueta',
  'Poco Uso',
  'Usado',
  'Excelente Estado',
];

// --- MODA Y BELLEZA (publish-logic.js L762-L830) ---
const Map<String, List<CampoAtributo>> _modaYBelleza = {
  'Ropa de Mujer': [
    CampoAtributo('tipo_prenda', 'Tipo de prenda',
        opciones: [
      'Camisa',
      'Pantalón',
      'Vestido',
      'Falda',
      'Blusa',
      'Chaqueta',
      'Sudadera',
      'Short',
      'Otro',
    ]),
    CampoAtributo('talla', 'Talla', opciones: ['XS', 'S', 'M', 'L', 'XL', 'XXL']),
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: Zara'),
    CampoAtributo('color', 'Color', placeholder: 'Ej: Negro'),
    CampoAtributo('condicion', 'Condición', opciones: _condicionModa),
  ],
  'Ropa de Hombre': [
    CampoAtributo('tipo_prenda', 'Tipo de prenda',
        opciones: [
      'Camisa',
      'Pantalón',
      'Vestido',
      'Falda',
      'Blusa',
      'Chaqueta',
      'Sudadera',
      'Short',
      'Otro',
    ]),
    CampoAtributo('talla', 'Talla', opciones: ['XS', 'S', 'M', 'L', 'XL', 'XXL']),
    CampoAtributo('marca', 'Marca', placeholder: "Ej: Levi's"),
    CampoAtributo('color', 'Color', placeholder: 'Ej: Azul'),
    CampoAtributo('condicion', 'Condición', opciones: _condicionModa),
  ],
  'Ropa de Niños': [
    CampoAtributo('tipo_prenda', 'Tipo de prenda',
        opciones: [
      'Camisa',
      'Pantalón',
      'Vestido',
      'Falda',
      'Blusa',
      'Chaqueta',
      'Sudadera',
      'Short',
      'Otro',
    ]),
    CampoAtributo('talla', 'Talla', opciones: ['XS', 'S', 'M', 'L', 'XL', 'XXL']),
    CampoAtributo('edad', 'Edad',
        opciones: [
      '0-12 meses',
      '1-2 años',
      '3-4 años',
      '5-6 años',
      '7-8 años',
      '9-10 años',
      '11-12 años',
    ]),
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: Disney'),
    CampoAtributo('color', 'Color', placeholder: 'Ej: Rojo'),
    CampoAtributo('condicion', 'Condición', opciones: _condicionModa),
  ],
  'Calzado': [
    CampoAtributo('tipo_calzado', 'Tipo de calzado',
        opciones: ['Tenis', 'Zapatos Formales', 'Sandalias', 'Botas', 'Tacones', 'Otro']),
    CampoAtributo('talla_calzado', 'Talla', placeholder: 'Ej: 42'),
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: Nike'),
    CampoAtributo('color', 'Color', placeholder: 'Ej: Blanco'),
    CampoAtributo('condicion', 'Condición', opciones: _condicionModa),
  ],
  'Bolsos y Carteras': [
    CampoAtributo('tipo_bolso', 'Tipo de bolso',
        opciones: ['Bolso de Mano', 'Mochila', 'Cartera', 'Bolso de Viaje', 'Otro']),
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: Gucci'),
    CampoAtributo('material', 'Material', placeholder: 'Ej: Cuero'),
    CampoAtributo('color', 'Color', placeholder: 'Ej: Negro'),
    CampoAtributo('condicion', 'Condición', opciones: _condicionModa),
  ],
  'Accesorios': [
    CampoAtributo('tipo_accesorio', 'Tipo de accesorio',
        opciones: ['Reloj', 'Gafas de Sol', 'Cinturón', 'Bufanda', 'Gorra', 'Otro']),
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: Rolex'),
    CampoAtributo('material', 'Material', placeholder: 'Ej: Oro'),
    CampoAtributo('condicion', 'Condición', opciones: _condicionModa),
  ],
  'Joyería y Relojes': [
    CampoAtributo('tipo_joya', 'Tipo de joya',
        opciones: ['Anillo', 'Collar', 'Pulsera', 'Aretes', 'Otro']),
    CampoAtributo('material', 'Material', placeholder: 'Ej: Oro'),
    CampoAtributo('condicion', 'Condición', opciones: _condicionModa),
  ],
  'Salud y Belleza': [
    CampoAtributo('tipo_producto', 'Tipo de producto',
        opciones: [
      'Maquillaje',
      'Cuidado de la Piel',
      'Perfume',
      'Cuidado del Cabello',
      'Productos de Baño',
      'Otro',
    ]),
    CampoAtributo('marca', 'Marca', placeholder: "Ej: L'Oréal"),
    CampoAtributo('categoria_producto', 'Categoría del producto',
        placeholder: 'Ej: Shampoo'),
    CampoAtributo('condicion', 'Condición', opciones: _condicionModa),
  ],
};

const List<String> _condicionDeportes = ['Nueva', 'Usada', 'Como Nueva'];

// --- DEPORTES Y HOBBIES (publish-logic.js L831-L850) ---
const Map<String, List<CampoAtributo>> _deportesYHobbies = {
  'Bicicletas': [
    CampoAtributo('tipo_bicicleta', 'Tipo de bicicleta',
        opciones: ['Mountain Bike', 'Ruta', 'BMX', 'Eléctrica', 'Híbrida', 'Infantil']),
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: Trek'),
    CampoAtributo('aro', 'Aro',
        opciones: ['12"', '16"', '20"', '24"', '26"', '27.5"', '29"']),
    CampoAtributo('condicion', 'Condición', opciones: _condicionDeportes),
  ],
  'Coleccionables': [
    CampoAtributo('tipo_articulo', 'Tipo de artículo',
        placeholder: 'Ej: Álbum de estampas'),
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: Panini'),
    CampoAtributo('condicion', 'Condición', opciones: _condicionDeportes),
  ],
  'Deportes': [
    CampoAtributo('tipo_articulo', 'Tipo de artículo',
        opciones: [
      'Ropa Deportiva',
      'Calzado Deportivo',
      'Balones',
      'Raquetas',
      'Guantes',
      'Cascos',
      'Pesas',
      'Otros',
    ]),
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: Adidas'),
    CampoAtributo('talla', 'Talla', placeholder: 'Ej: M'),
    CampoAtributo('condicion', 'Condición', opciones: _condicionDeportes),
  ],
  'Instrumentos Musicales': [
    CampoAtributo('tipo_instrumento', 'Tipo de instrumento',
        opciones: [
      'Guitarra',
      'Bajo',
      'Batería',
      'Piano/Teclado',
      'Viento',
      'Cuerdas',
      'Otro',
    ]),
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: Yamaha'),
    CampoAtributo('condicion', 'Condición', opciones: _condicionDeportes),
  ],
  'Libros, Revistas y Comics': [
    CampoAtributo('tipo_articulo', 'Tipo de artículo',
        placeholder: 'Ej: Libro de cocina'),
    CampoAtributo('autor_fabricante', 'Autor / Fabricante',
        placeholder: 'Ej: Gabriel García Márquez'),
    CampoAtributo('condicion', 'Condición', opciones: _condicionDeportes),
  ],
  'Otros Hobbies': [
    CampoAtributo('tipo_articulo', 'Tipo de artículo',
        placeholder: 'Ej: Juego de mesa'),
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: Hasbro'),
    CampoAtributo('condicion', 'Condición', opciones: _condicionDeportes),
  ],
};

// --- MASCOTAS (publish-logic.js L851-L885) ---
const Map<String, List<CampoAtributo>> _mascotas = {
  'Perros': [
    CampoAtributo('tipo_anuncio', 'Tipo de anuncio',
        opciones: ['Adopción', 'Venta', 'Encontrado', 'Perdido']),
    CampoAtributo('raza', 'Raza', placeholder: 'Ej: Labrador'),
    CampoAtributo('edad_mascota', 'Edad', placeholder: 'Ej: 2', esNumerico: true),
    CampoAtributo('genero', 'Género', opciones: ['Macho', 'Hembra']),
  ],
  'Gatos': [
    CampoAtributo('tipo_anuncio', 'Tipo de anuncio',
        opciones: ['Adopción', 'Venta', 'Encontrado', 'Perdido']),
    CampoAtributo('raza', 'Raza', placeholder: 'Ej: Siamés'),
    CampoAtributo('edad_mascota', 'Edad', placeholder: 'Ej: 1', esNumerico: true),
    CampoAtributo('genero', 'Género', opciones: ['Macho', 'Hembra']),
  ],
  'Aves': [
    CampoAtributo('tipo_anuncio', 'Tipo de anuncio',
        opciones: ['Adopción', 'Venta', 'Encontrado', 'Perdido']),
    CampoAtributo('raza', 'Raza', placeholder: 'Ej: Canario'),
    CampoAtributo('edad_mascota', 'Edad', placeholder: 'Ej: 1', esNumerico: true),
    CampoAtributo('genero', 'Género', opciones: ['Macho', 'Hembra']),
  ],
  'Peces': [
    CampoAtributo('tipo_anuncio', 'Tipo de anuncio',
        opciones: ['Adopción', 'Venta', 'Encontrado', 'Perdido']),
    CampoAtributo('raza', 'Raza', placeholder: 'Ej: Betta'),
  ],
  'Otros Animales': [
    CampoAtributo('tipo_anuncio', 'Tipo de anuncio',
        opciones: ['Adopción', 'Venta', 'Encontrado', 'Perdido']),
    CampoAtributo('raza', 'Raza', placeholder: 'Ej: Conejo'),
    CampoAtributo('edad_mascota', 'Edad', placeholder: 'Ej: 3', esNumerico: true),
    CampoAtributo('genero', 'Género', opciones: ['Macho', 'Hembra']),
  ],
  'Accesorios para Mascotas': [
    CampoAtributo('tipo_accesorio', 'Tipo de accesorio',
        opciones: ['Collar', 'Correa', 'Jaula', 'Comida', 'Otro']),
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: Pedigree'),
    CampoAtributo('condicion', 'Condición',
        opciones: ['Nuevo', 'Usado - Bueno', 'Usado - Regular']),
  ],
};

// --- SERVICIOS (publish-logic.js L886-L922) ---
const List<String> _modalidadServicio = [
  'Presencial',
  'A domicilio',
  'Virtual/Online',
  'Híbrido',
];
const List<String> _experienciaServicio = [
  'Menos de 1 año',
  '1-3 años',
  '3-5 años',
  'Más de 5 años',
];

const Map<String, List<CampoAtributo>> _servicios = {
  'Servicios de Construcción': [
    CampoAtributo('tipo_servicio', 'Tipo de servicio',
        opciones: [
      'Construcción General',
      'Remodelación',
      'Albañilería',
      'Pintura',
      'Electricidad',
      'Plomería',
      'Carpintería',
      'Techado',
      'Otros',
    ]),
    CampoAtributo('modalidad', 'Modalidad', opciones: _modalidadServicio),
    CampoAtributo('experiencia', 'Experiencia', opciones: _experienciaServicio),
  ],
  'Servicios de Educación': [
    CampoAtributo('tipo_servicio', 'Tipo de servicio',
        opciones: [
      'Clases Particulares',
      'Tutoría Académica',
      'Preparación de Exámenes',
      'Idiomas',
      'Música',
      'Arte',
      'Deportes',
      'Informática',
      'Otros',
    ]),
    CampoAtributo('modalidad', 'Modalidad', opciones: _modalidadServicio),
    CampoAtributo('experiencia', 'Experiencia', opciones: _experienciaServicio),
  ],
  'Servicios de Eventos': [
    CampoAtributo('tipo_servicio', 'Tipo de servicio',
        opciones: [
      'Organización de Eventos',
      'Catering',
      'Decoración',
      'Fotografía',
      'Video',
      'Música/DJ',
      'Animación',
      'Alquiler de Equipos',
      'Otros',
    ]),
    CampoAtributo('modalidad', 'Modalidad', opciones: _modalidadServicio),
    CampoAtributo('experiencia', 'Experiencia', opciones: _experienciaServicio),
  ],
  'Servicios de Salud': [
    CampoAtributo('tipo_servicio', 'Tipo de servicio',
        opciones: [
      'Consultas Médicas',
      'Terapia Física',
      'Psicología',
      'Nutrición',
      'Enfermería',
      'Cuidado de Adultos Mayores',
      'Masajes Terapéuticos',
      'Otros',
    ]),
    CampoAtributo('modalidad', 'Modalidad', opciones: _modalidadServicio),
    CampoAtributo('experiencia', 'Experiencia', opciones: _experienciaServicio),
  ],
  'Servicios de Tecnología': [
    CampoAtributo('tipo_servicio', 'Tipo de servicio',
        opciones: [
      'Reparación de Computadoras',
      'Reparación de Celulares',
      'Desarrollo Web',
      'Diseño Gráfico',
      'Soporte Técnico',
      'Instalación de Redes',
      'Consultoría IT',
      'Otros',
    ]),
    CampoAtributo('modalidad', 'Modalidad', opciones: _modalidadServicio),
    CampoAtributo('experiencia', 'Experiencia', opciones: _experienciaServicio),
  ],
  'Servicios para el Hogar': [
    CampoAtributo('tipo_servicio', 'Tipo de servicio',
        opciones: [
      'Limpieza',
      'Jardinería',
      'Reparaciones Generales',
      'Cerrajería',
      'Fumigación',
      'Mudanzas',
      'Lavandería',
      'Cuidado de Niños',
      'Otros',
    ]),
    CampoAtributo('modalidad', 'Modalidad', opciones: _modalidadServicio),
    CampoAtributo('experiencia', 'Experiencia', opciones: _experienciaServicio),
  ],
  'Otros Servicios': [
    CampoAtributo('tipo_servicio', 'Tipo de servicio',
        placeholder: 'Describe el tipo de servicio'),
    CampoAtributo('modalidad', 'Modalidad', opciones: _modalidadServicio),
    CampoAtributo('experiencia', 'Experiencia', opciones: _experienciaServicio),
  ],
};

// --- NEGOCIOS (publish-logic.js L923-L942) ---
const Map<String, List<CampoAtributo>> _negocios = {
  'Equipos para Negocios': [
    CampoAtributo('tipo_equipo', 'Tipo de equipo',
        opciones: [
      'Computadoras',
      'Impresoras',
      'Fotocopiadoras',
      'Teléfonos/Centrales',
      'Muebles de Oficina',
      'Cajas Registradoras/POS',
      'Equipos de Seguridad',
      'Aire Acondicionado',
      'Máquina de Café',
      'Otros',
    ]),
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: HP'),
    CampoAtributo('modelo', 'Modelo', placeholder: 'Ej: LaserJet'),
    CampoAtributo('condicion', 'Condición',
        opciones: [
      'Nuevo',
      'Usado - Excelente',
      'Usado - Bueno',
      'Usado - Regular',
      'Reacondicionado',
      'Para Repuestos',
    ]),
  ],
  'Maquinaria para Negocios': [
    CampoAtributo('tipo_equipo', 'Tipo de equipo',
        opciones: [
      'Maquinaria Industrial',
      'Equipos de Construcción',
      'Equipos de Restaurante',
      'Equipos de Panadería',
      'Equipos de Lavandería',
      'Equipos Agrícolas',
      'Equipos de Limpieza Industrial',
      'Generadores',
      'Compresores',
      'Otros',
    ]),
    CampoAtributo('marca', 'Marca', placeholder: 'Ej: Caterpillar'),
    CampoAtributo('modelo', 'Modelo', placeholder: 'Ej: Excavadora'),
    CampoAtributo('anio', 'Año', placeholder: 'Ej: 2020', esNumerico: true),
    CampoAtributo('condicion', 'Condición',
        opciones: [
      'Nuevo',
      'Usado - Excelente',
      'Usado - Bueno',
      'Usado - Regular',
      'Reacondicionado',
      'Para Repuestos',
    ]),
  ],
  'Negocios en Venta': [
    CampoAtributo('tipo_negocio', 'Tipo de negocio',
        opciones: [
      'Restaurante',
      'Cafetería',
      'Tienda de Ropa',
      'Supermercado/Minisuper',
      'Farmacia',
      'Ferretería',
      'Oficina/Consultorio',
      'Taller/Mecánica',
      'Salón de Belleza',
      'Gimnasio',
      'Industrial',
      'Otros',
    ]),
    CampoAtributo('años_operacion', 'Años de operación',
        opciones: [
      'Menos de 1 año',
      '1-3 años',
      '3-5 años',
      'Más de 5 años',
      'Más de 10 años',
    ]),
    CampoAtributo('incluye', 'Incluye',
        placeholder: 'Ej: Local propio, inventario, equipos, clientela'),
    CampoAtributo('razon_venta', 'Razón de venta',
        opciones: [
      'Cambio de rubro',
      'Viaje al extranjero',
      'Jubilación',
      'Falta de tiempo',
      'Problemas de salud',
      'Otros',
    ]),
  ],
};

// --- COMUNIDAD (publish-logic.js L943-L962) ---
const Map<String, List<CampoAtributo>> _comunidad = {
  'Clases y Cursos': [
    CampoAtributo('tipo_clase', 'Tipo de clase',
        opciones: ['Idioma', 'Música', 'Deporte', 'Arte', 'Otro']),
    CampoAtributo('modalidad', 'Modalidad',
        opciones: ['Presencial', 'Virtual', 'Híbrido']),
    CampoAtributo('nivel', 'Nivel',
        opciones: ['Principiante', 'Intermedio', 'Avanzado']),
  ],
  'Eventos': [
    CampoAtributo('tipo_evento', 'Tipo de evento',
        opciones: ['Concierto', 'Fiesta', 'Conferencia', 'Otro']),
    CampoAtributo('fecha_evento', 'Fecha del evento', esFecha: true),
    CampoAtributo('ubicacion_evento', 'Ubicación del evento',
        placeholder: 'Ej: Teatro Nacional'),
  ],
  'Otros': [
    CampoAtributo('tipo_anuncio', 'Tipo de anuncio',
        opciones: ['Oferta', 'Búsqueda', 'Anuncio General']),
  ],
};

/// Mapa maestro: nombre EXACTO de la columna `categoria` en la BD
/// (los mismos valores que usa el catálogo del app y la web) →
/// (subcategorías → campos).
///
/// Vehículos e Inmuebles comparten la misma sección de campos para todas
/// sus subcategorías (publicar.html no tiene configs por subcategoría para
/// ellas: showDynamicFields usa vehicle-details / realestate-details).
final Map<String, Map<String, List<CampoAtributo>>> _esquema = {
  'Vehículos': {
    for (final sub in const [
      'Autos',
      'Motos',
      'Camiones',
      'Otros Vehículos',
    ])
      sub: _camposVehiculo,
  },
  'Inmuebles': {
    for (final sub in const [
      'Casas',
      'Apartamentos',
      'Terrenos',
      'Locales Comerciales',
      'Oficinas',
    ])
      sub: _camposInmueble,
  },
  'Electrónica': _electronica,
  'Hogar y Muebles': _hogarYMuebles,
  'Moda y Belleza': _modaYBelleza,
  'Deportes y Hobbies': _deportesYHobbies,
  'Mascotas': _mascotas,
  'Servicios': _servicios,
  'Negocios': _negocios,
  'Comunidad': _comunidad,
};

/// Etiquetas humanas del DETALLE (product-detail-logic.js L147-L162:
/// SPEC_LABELS, espejo exacto). Las claves que no están aquí usan el
/// fallback de la web: clave con guiones bajos → espacios → Capitalizado.
const Map<String, String> etiquetasDetalle = {
  'condicion': 'Condición',
  'estado': 'Estado',
  'procesador': 'Procesador',
  'memoria_ram': 'Memoria RAM',
  'almacenamiento': 'Almacenamiento',
  'marca': 'Marca',
  'modelo': 'Modelo',
  'color': 'Color',
  'anio': 'Año',
  'kilometraje': 'Kilometraje',
  'combustible': 'Combustible',
  'transmision': 'Transmisión',
  'puertas': 'Puertas',
  'vidrios': 'Vidrios',
  'direccion': 'Dirección',
  'frenos': 'Frenos',
  'airbags': 'Airbags',
  'rines': 'Rines',
  'tapiz': 'Tapicería',
  'm2': 'Superficie (m²)',
  'habitaciones': 'Habitaciones',
  'banos': 'Baños',
  'piso': 'Piso',
  'estacionamiento': 'Estacionamientos',
  'amueblado': 'Amueblado',
  'ascensor': 'Ascensor',
  'jardin': 'Jardín',
  'piscina': 'Piscina',
  'tipo_propiedad': 'Tipo de propiedad',
  'anio_construccion': 'Año de construcción',
  'raza': 'Raza',
  'genero': 'Género',
  'edad_mascota': 'Edad',
  'talla': 'Talla',
  'material': 'Material',
  'garantia': 'Garantía',
  'bateria': 'Batería',
};

/// MAPEO CATEGORÍA → PLACEHOLDER DEL TÍTULO (publish-logic.js L1585-L1597).
///
/// Espejo exacto del `placeholderMap` de la web: el hint del título del
/// anuncio cambia según la categoría principal y la subcategoría elegida.
/// Si la categoría no está registrada (o aún no se elige) se usa el
/// placeholder por defecto de la web: "Ej: Descripción breve y atractiva
/// de tu artículo".
final Map<String, String Function(String)> _placeholdersTitulo = {
  'Vehículos': (sub) => 'Ej: Vendo ${sub.isEmpty ? 'Vehículo' : sub}, Como Nuevo',
  'Inmuebles': (sub) => 'Ej: Se Vende ${sub.isEmpty ? 'Propiedad' : sub} en [Ubicación]',
  'Empleos y Servicios': (sub) =>
      'Ej: Ofrezco Servicios de ${sub.isEmpty ? 'Profesional' : sub}',
  'Servicios': (sub) => 'Ej: ${sub.isEmpty ? 'Servicio' : sub} a Domicilio',
  'Comunidad': (sub) => 'Ej: ${sub.isEmpty ? 'Anuncio de Comunidad' : sub}',
  'Mascotas': (sub) => 'Ej: Adopción Responsable de ${sub.isEmpty ? 'Mascota' : sub}',
  'Electrónica': (sub) =>
      'Ej: ${sub.isEmpty ? 'Artículo Electrónico' : sub} en Buen Estado',
  'Hogar y Muebles': (sub) => 'Ej: Vendo ${sub.isEmpty ? 'Mueble' : sub} para Sala',
  'Moda y Belleza': (sub) =>
      'Ej: Vendo ${sub.isEmpty ? 'Artículo de Moda' : sub}, Talla M',
  'Deportes y Hobbies': (sub) =>
      'Ej: Vendo ${sub.isEmpty ? 'Artículo Deportivo' : sub}, Poco Uso',
  'Negocios': (sub) => 'Ej: Oportunidad de Inversión en ${sub.isEmpty ? 'Negocio' : sub}',
};

/// API única para publicar / editar / detalle.
class EsquemaCategorias {
  EsquemaCategorias._();

  /// Campos de atributos para (categoría, subcategoría). Lista vacía si la
  /// combinación no existe en la web (p. ej. categoría sin sección de
  /// atributos). La subcategoría vacía usa los campos de la primera
  /// subcategoría registrada de la categoría (igual que la web, que muestra
  /// la sección de categoría mientras no se elija subcategoría).
  static List<CampoAtributo> camposPara(String categoria, String subcategoria) {
    final config = _esquema[categoria];
    if (config == null) return const [];
    if (subcategoria.trim().isNotEmpty) {
      return config[subcategoria.trim()] ??
          config.values.firstOrNull ??
          const [];
    }
    return config.values.firstOrNull ?? const [];
  }

  /// Título de la sección dinámica: "Especificaciones para X"
  /// (publicar.html h4 dentro de cada attribute-section).
  static String tituloSeccion(String categoria, String subcategoria) {
    final objetivo = subcategoria.trim().isNotEmpty
        ? subcategoria.trim()
        : categoria;
    return 'Especificaciones para $objetivo';
  }

  /// Hint del título del anuncio según categoría/subcategoría (espejo del
  /// placeholderMap de publish-logic.js L1585-L1597: "Vehículos" muestra
  /// "Ej: Vendo Vehículo, Como Nuevo", "Inmuebles" muestra "Ej: Se Vende
  /// Propiedad en [Ubicación]", etc.). Con subcategoría elegida se interpola
  /// en el ejemplo; sin categoría registrada se muestra el placeholder
  /// estático de publicar.html (input #title), igual que la web al cargar.
  static String tituloPlaceholder(String categoria, String subcategoria) {
    final generador = _placeholdersTitulo[categoria];
    if (generador == null) {
      return 'Título corto y directo (máx. 60 caracteres). Ej: Toyota Hilux 2022 Impecable';
    }
    return generador(subcategoria.trim());
  }

  /// Etiqueta humana de una clave de atributo para el DETALLE:
  /// SPEC_LABELS → fallback web (guiones bajos a espacios + Capitalizado).
  static String etiquetaDetalle(String key) {
    final etiqueta = etiquetasDetalle[key];
    if (etiqueta != null) return etiqueta;
    return key
        .replaceAll('_', ' ')
        .split(' ')
        .map((palabra) =>
            palabra.isEmpty ? palabra : palabra[0].toUpperCase() + palabra.substring(1))
        .join(' ');
  }

  /// Claves de campos numéricos del esquema (para que publish_service guarde
  /// números reales en atributos_clave, igual que la web).
  static Set<String> get clavesNumericas => {
        for (final sub in _esquema.values)
          for (final campos in sub.values)
            for (final campo in campos)
              if (campo.esNumerico) campo.key,
      };

  /// Subcategorías con atributos para una categoría (para validaciones de UI).
  static List<String> subcategoriasDe(String categoria) =>
      _esquema[categoria]?.keys.toList() ?? const [];
}
