// config-categories.js - Categorías y subcategorías centralizadas

export const DEFAULT_CATEGORIES = [
    // Main categories
    { id: 1, nombre: 'Vehículos', parent_id: null },
    { id: 2, nombre: 'Inmuebles', parent_id: null },
    { id: 3, nombre: 'Electrónica', parent_id: null },
    { id: 4, nombre: 'Hogar y Muebles', parent_id: null },
    { id: 5, nombre: 'Moda y Belleza', parent_id: null },
    { id: 6, nombre: 'Deportes y Hobbies', parent_id: null },
    { id: 7, nombre: 'Mascotas', parent_id: null },
    { id: 8, nombre: 'Servicios', parent_id: null },
    { id: 9, nombre: 'Negocios', parent_id: null },
    { id: 10, nombre: 'Comunidad', parent_id: null },
    
    // Vehículos subcategories
    { id: 101, nombre: 'Autos', parent_id: 1 },
    { id: 102, nombre: 'Motos', parent_id: 1 },
    { id: 103, nombre: 'Camiones', parent_id: 1 },
    { id: 104, nombre: 'Otros Vehículos', parent_id: 1 },
    
    // Inmuebles subcategories
    { id: 201, nombre: 'Casas', parent_id: 2 },
    { id: 202, nombre: 'Apartamentos', parent_id: 2 },
    { id: 203, nombre: 'Terrenos', parent_id: 2 },
    
    // Electrónica subcategories
    { id: 301, nombre: 'Celulares y Teléfonos', parent_id: 3 },
    { id: 302, nombre: 'Computadoras', parent_id: 3 },
    { id: 303, nombre: 'Consolas y Videojuegos', parent_id: 3 },
    { id: 304, nombre: 'Audio y Video', parent_id: 3 },
    { id: 305, nombre: 'Fotografía', parent_id: 3 },
    
    // Hogar subcategories
    { id: 401, nombre: 'Artículos de Cocina', parent_id: 4 },
    { id: 402, nombre: 'Decoración', parent_id: 4 },
    { id: 403, nombre: 'Electrodomésticos', parent_id: 4 },
    { id: 404, nombre: 'Jardín y Exterior', parent_id: 4 },
    { id: 405, nombre: 'Muebles', parent_id: 4 },
    
    // Moda subcategories
    { id: 501, nombre: 'Ropa de Mujer', parent_id: 5 },
    { id: 502, nombre: 'Ropa de Hombre', parent_id: 5 },
    { id: 503, nombre: 'Ropa de Niños', parent_id: 5 },
    { id: 504, nombre: 'Calzado', parent_id: 5 },
    { id: 505, nombre: 'Bolsos y Carteras', parent_id: 5 },
    { id: 506, nombre: 'Accesorios', parent_id: 5 },
    { id: 507, nombre: 'Joyería y Relojes', parent_id: 5 },
    { id: 508, nombre: 'Salud y Belleza', parent_id: 5 },
    
    // Deportes subcategories
    { id: 601, nombre: 'Bicicletas', parent_id: 6 },
    { id: 602, nombre: 'Coleccionables', parent_id: 6 },
    { id: 603, nombre: 'Deportes', parent_id: 6 },
    { id: 604, nombre: 'Instrumentos Musicales', parent_id: 6 },
    { id: 605, nombre: 'Libros, Revistas y Comics', parent_id: 6 },
    { id: 606, nombre: 'Otros Hobbies', parent_id: 6 },
    
    // Mascotas subcategories
    { id: 701, nombre: 'Perros', parent_id: 7 },
    { id: 702, nombre: 'Gatos', parent_id: 7 },
    { id: 703, nombre: 'Aves', parent_id: 7 },
    { id: 704, nombre: 'Peces', parent_id: 7 },
    { id: 705, nombre: 'Otros Animales', parent_id: 7 },
    { id: 706, nombre: 'Accesorios para Mascotas', parent_id: 7 },
    
    // Servicios subcategories
    { id: 801, nombre: 'Servicios de Construcción', parent_id: 8 },
    { id: 802, nombre: 'Servicios de Educación', parent_id: 8 },
    { id: 803, nombre: 'Servicios de Eventos', parent_id: 8 },
    { id: 804, nombre: 'Servicios de Salud', parent_id: 8 },
    { id: 805, nombre: 'Servicios de Tecnología', parent_id: 8 },
    { id: 806, nombre: 'Servicios para el Hogar', parent_id: 8 },
    { id: 807, nombre: 'Otros Servicios', parent_id: 8 },
    
    // Negocios subcategories
    { id: 901, nombre: 'Equipos para Negocios', parent_id: 9 },
    { id: 902, nombre: 'Maquinaria para Negocios', parent_id: 9 },
    { id: 903, nombre: 'Negocios en Venta', parent_id: 9 },
    
    // Comunidad subcategories
    { id: 1001, nombre: 'Clases y Cursos', parent_id: 10 },
    { id: 1002, nombre: 'Eventos', parent_id: 10 },
    { id: 1003, nombre: 'Otros', parent_id: 10 },
];
