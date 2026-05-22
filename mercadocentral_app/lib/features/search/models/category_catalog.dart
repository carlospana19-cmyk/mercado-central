import 'package:flutter/material.dart';

class CategoryItem {
  final String name;
  final IconData icon;
  final List<String> subcategories;

  const CategoryItem({
    required this.name,
    required this.icon,
    required this.subcategories,
  });
}

// 🗺️ EL CATÁLOGO MAESTRO (Sincronizado + Ajuste Táctico de Autos Usados)
const List<CategoryItem> fullCategoryCatalog = [
  CategoryItem(
    name: 'Vehículos',
    icon: Icons.directions_car_filled_rounded,
    // 🚨 Forzamos "Autos Usados" aunque no esté en el JS, para que coincida con tu DB
    subcategories: ['Autos', 'Autos Usados', 'Motos', 'Camiones', 'Otros Vehículos'],
  ),
  CategoryItem(
    name: 'Inmuebles',
    icon: Icons.home_work_rounded,
    subcategories: ['Casas', 'Apartamentos', 'Terrenos'],
  ),
  CategoryItem(
    name: 'Electrónica',
    icon: Icons.devices_rounded,
    subcategories: ['Celulares y Teléfonos', 'Computadoras', 'Consolas y Videojuegos', 'Audio y Video', 'Fotografía'],
  ),
  CategoryItem(
    name: 'Hogar y Muebles',
    icon: Icons.chair_rounded,
    subcategories: ['Artículos de Cocina', 'Decoración', 'Electrodomésticos', 'Jardín y Exterior', 'Muebles'],
  ),
  CategoryItem(
    name: 'Moda y Belleza',
    icon: Icons.checkroom_rounded,
    subcategories: ['Ropa de Mujer', 'Ropa de Hombre', 'Ropa de Niños', 'Calzado', 'Bolsos y Carteras', 'Accesorios', 'Joyería y Relojes', 'Salud y Belleza'],
  ),
  CategoryItem(
    name: 'Deportes y Hobbies',
    icon: Icons.sports_soccer_rounded,
    subcategories: ['Bicicletas', 'Coleccionables', 'Deportes', 'Instrumentos Musicales', 'Libros, Revistas y Comics', 'Otros Hobbies'],
  ),
  CategoryItem(
    name: 'Mascotas',
    icon: Icons.pets_rounded,
    subcategories: ['Perros', 'Gatos', 'Aves', 'Peces', 'Otros Animales', 'Accesorios para Mascotas'],
  ),
  CategoryItem(
    name: 'Servicios',
    icon: Icons.handyman_rounded,
    subcategories: ['Servicios de Construcción', 'Servicios de Educación', 'Servicios de Eventos', 'Servicios de Salud', 'Servicios de Tecnología', 'Servicios para el Hogar', 'Otros Servicios'],
  ),
  CategoryItem(
    name: 'Negocios',
    icon: Icons.storefront_rounded,
    subcategories: ['Equipos para Negocios', 'Maquinaria para Negocios', 'Negocios en Venta'],
  ),
  CategoryItem(
    name: 'Comunidad',
    icon: Icons.people_alt_rounded,
    subcategories: ['Clases y Cursos', 'Eventos', 'Otros'],
  ),
];