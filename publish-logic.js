// publish-logic.js - VERSIÓN FINAL CON SINCRONIZACIÓN COMPLETA

import { supabase } from './supabase-client.js';

// CONFIGURACIÓN DE PLANES
const PLAN_LIMITS = {
    'free': { maxFotos: 3, hasVideo: false, hasCarousel: false, priority: 0 },
    'basico': { maxFotos: 5, hasVideo: false, hasCarousel: false, priority: 1 },
    'premium': { maxFotos: 10, hasVideo: false, hasCarousel: true, priority: 2 },
    'destacado': { maxFotos: 15, hasVideo: false, hasCarousel: true, priority: 3 },
    'top': { maxFotos: 20, hasVideo: true, hasCarousel: true, priority: 4 }
};

// VALIDAR CANTIDAD DE FOTOS
function validateImageCount(plan) {
    const selectedPlan = plan || 'free';
    const limit = PLAN_LIMITS[selectedPlan].maxFotos;
    const currentImages = document.querySelectorAll('.image-preview').length;
    
    if (currentImages >= limit) {
        alert(`El plan ${selectedPlan.toUpperCase()} permite máximo ${limit} fotos`);
        return false;
    }
    return true;
}

export function initializePublishPage() {
    const form = document.getElementById('ad-form');
    if (!form) return;

    // --- ELEMENTOS DEL DOM ---
    const allSteps = form.querySelectorAll('.form-section');
    const progressSteps = document.querySelectorAll('.step');
    const categorySelect = document.getElementById('category');
    const subcategoryGroup = document.getElementById('subcategory-group');
    const subcategorySelect = document.getElementById('subcategory');
    const provinceSelect = document.getElementById('province');
    const districtGroup = document.getElementById('district-group');
    const districtSelect = document.getElementById('district');
    const vehicleDetails = document.getElementById('vehicle-details');
    const realestateDetails = document.getElementById('realestate-details');
    const electronicsDetails = document.getElementById('electronics-details');
    const electronicsFields = document.getElementById('electronics-fields');
    const homeFurnitureDetails = document.getElementById('home-furniture-details');
    const fashionDetails = document.getElementById('fashion-details');
    const fashionFields = document.getElementById('fashion-fields');
    const sportsDetails = document.getElementById('sports-details');
    const sportsFields = document.getElementById('sports-fields');
    const petsDetails = document.getElementById('pets-details');
    const petsFields = document.getElementById('pets-fields');
    const servicesDetails = document.getElementById('services-details');
    const servicesFields = document.getElementById('services-fields');
    const businessDetails = document.getElementById('business-details');
    const businessFields = document.getElementById('business-fields');
    const communityDetails = document.getElementById('community-details');
    const communityFields = document.getElementById('community-fields');
    const vehicleFields = document.getElementById('vehicle-fields');
    const realestateFields = document.getElementById('realestate-fields');
    const homeFurnitureFields = document.getElementById('home-furniture-fields');
    const coverImageInput = document.getElementById('cover-image-input');
    const coverImageName = document.getElementById('cover-image-name');
    const galleryDropArea = document.getElementById('gallery-drop-area');
    const galleryImagesInput = document.getElementById('gallery-images-input');
    const galleryPreviewContainer = document.getElementById('gallery-preview-container');
    const contactName = document.getElementById('contact-name');
    const contactEmail = document.getElementById('contact-email');
    const nextBtns = form.querySelectorAll('.next-btn, #continue-to-step2'); // Incluimos el primer botón
    const backBtns = form.querySelectorAll('.back-btn');

    let allCategories = [];
    let selectedMainCategory = '';
    let selectedSubcategory = '';
    let userInfo = null;

    // --- DATOS DE DISTRITOS POR PROVINCIA (EJEMPLO ESTÁTICO) ---
    const districtsByProvince = {
        'Panamá': ['Panamá', 'San Miguelito', 'Arraiján', 'Capira', 'Chame', 'La Chorrera', 'Cerro Punta'],
        'Panamá Oeste': ['La Chorrera', 'Capira', 'Chame', 'Arraiján', 'San Carlos'],
        'Colón': ['Colón', 'Portobelo', 'Chagres', 'Donoso', 'Gatún', 'Margarita', 'Santa Isabel'],
        'Chiriquí': ['David', 'Bugaba', 'Renacimiento', 'Barú', 'Boquete', 'Alanje', 'Tierras Altas'],
        'Veraguas': ['Santiago', 'Atalaya', 'Mariato', 'Montijo', 'La Mesa', 'San Francisco', 'Soná'],
        'Coclé': ['Penonomé', 'Aguadulce', 'Natá', 'Olá', 'Antón', 'La Pintada'],
        'Los Santos': ['Las Tablas', 'Los Santos', 'Guararé', 'Macaracas', 'Pedasí', 'Pocrí', 'Tonosí'],
        'Herrera': ['Chitré', 'Las Minas', 'Los Pozos', 'Ocú', 'Parita', 'Pesé', 'Santa María'],
        'Darién': ['La Palma', 'Chepigana', 'Pinogana', 'Santa Fe', 'Garachiné', 'Wargandí'],
        'Bocas del Toro': ['Bocas del Toro', 'Changuinola', 'Almirante', 'Chiriquí Grande']
    };

    // --- CONFIGURACIÓN GENÉRICA DE CAMPOS POR CATEGORÍA ---
    const categoryFieldConfigs = {
        'electrónica': {
            'Celulares y Teléfonos': {
                'marca': { type: 'text', placeholder: 'Ej: Samsung' },
                'modelo': { type: 'text', placeholder: 'Ej: Galaxy S21' },
                'almacenamiento': { type: 'number', placeholder: 'Ej: 128' },
                'memoria_ram': { type: 'number', placeholder: 'Ej: 8' },
                'condicion': { type: 'select', options: ['Nuevo', 'Usado - Como Nuevo', 'Usado - Bueno', 'Usado - Aceptable', 'Para Repuestos'] }
            },
            'Computadoras': {
                'tipo_computadora': { type: 'select', options: ['Laptop', 'Escritorio'] },
                'marca': { type: 'text', placeholder: 'Ej: Dell' },
                'procesador': { type: 'text', placeholder: 'Ej: Intel i5' },
                'memoria_ram': { type: 'number', placeholder: 'Ej: 16' },
                'almacenamiento': { type: 'number', placeholder: 'Ej: 512' },
                'tamano_pantalla': { type: 'number', placeholder: 'Ej: 15.6' },
                'condicion': { type: 'select', options: ['Nuevo', 'Usado - Como Nuevo', 'Usado - Bueno', 'Usado - Aceptable', 'Para Repuestos'] }
            },
            'Consolas y Videojuegos': {
                'plataforma': { type: 'select', options: ['PlayStation', 'Xbox', 'Nintendo', 'PC', 'Otra'] },
                'modelo': { type: 'text', placeholder: 'Ej: PlayStation 5' },
                'almacenamiento': { type: 'number', placeholder: 'Ej: 500' },
                'condicion': { type: 'select', options: ['Nuevo', 'Usado - Como Nuevo', 'Usado - Bueno', 'Usado - Aceptable', 'Para Repuestos'] }
            },
            'Audio y Video': {
                'tipo_articulo': { type: 'text', placeholder: 'Ej: Altavoz' },
                'marca': { type: 'text', placeholder: 'Ej: Sony' },
                'modelo': { type: 'text', placeholder: 'Ej: WH-1000XM4' },
                'condicion': { type: 'select', options: ['Nuevo', 'Usado - Como Nuevo', 'Usado - Bueno', 'Usado - Aceptable', 'Para Repuestos'] }
            },
            'Fotografía': {
                'tipo_equipo': { type: 'select', options: ['Cámara Digital', 'Cámara Réflex', 'Cámara Mirrorless', 'Lente', 'Flash', 'Trípode', 'Estabilizador', 'Drone con Cámara', 'Accesorios', 'Otro'] },
                'marca': { type: 'text', placeholder: 'Ej: Canon' },
                'modelo': { type: 'text', placeholder: 'Ej: EOS R5' },
                'condicion': { type: 'select', options: ['Nuevo', 'Usado - Como Nuevo', 'Usado - Bueno', 'Usado - Aceptable', 'Para Repuestos'] }
            }
        },
        'hogar y muebles': {
            'Artículos de Cocina': {
                'tipo_articulo': { type: 'select', options: ['Utensilios', 'Vajilla', 'Ollas y Sartenes', 'Cuchillería', 'Otro'] },
                'material': { type: 'text', placeholder: 'Ej: Acero inoxidable' },
                'marca': { type: 'text', placeholder: 'Ej: Oster' },
                'condicion': { type: 'select', options: ['Nuevo', 'Usado - Excelente', 'Usado - Bueno', 'Para Restaurar'] }
            },
            'Decoración': {
                'tipo_decoracion': { type: 'select', options: ['Cuadro', 'Espejo', 'Lámpara', 'Alfombra', 'Cortina', 'Otro'] },
                'material': { type: 'text', placeholder: 'Ej: Madera' },
                'color': { type: 'text', placeholder: 'Ej: Blanco' },
                'dimensiones': { type: 'text', placeholder: 'Ej: 120x80x75 cm' },
                'condicion': { type: 'select', options: ['Nuevo', 'Usado - Excelente', 'Usado - Bueno', 'Para Restaurar'] }
            },
            'Electrodomésticos': {
                'tipo_electrodomestico': { type: 'select', options: ['Refrigerador', 'Lavadora', 'Microondas', 'Estufa', 'Licuadora', 'Aspiradora', 'Otro'] },
                'marca': { type: 'text', placeholder: 'Ej: LG' },
                'modelo': { type: 'text', placeholder: 'Ej: WM3488HW' },
                'condicion': { type: 'select', options: ['Nuevo', 'Usado - Excelente', 'Usado - Bueno', 'Para Restaurar'] }
            },
            'Jardín y Exterior': {
                'tipo_articulo': { type: 'select', options: ['Herramientas de Jardín', 'Muebles de Jardín', 'Plantas y Macetas', 'Parrillas', 'Iluminación Exterior', 'Otro'] },
                'material': { type: 'text', placeholder: 'Ej: Metal' },
                'condicion': { type: 'select', options: ['Nuevo', 'Usado - Excelente', 'Usado - Bueno', 'Para Restaurar'] }
            },
            'Muebles': {
                'tipo_mueble': { type: 'select', options: ['Sofá', 'Mesa', 'Silla', 'Estantería', 'Cama', 'Cómoda', 'Armario', 'Otro'] },
                'material': { type: 'text', placeholder: 'Ej: Madera' },
                'color': { type: 'text', placeholder: 'Ej: Marrón' },
                'dimensiones': { type: 'text', placeholder: 'Ej: 200x90x80 cm' },
                'condicion': { type: 'select', options: ['Nuevo', 'Usado - Excelente', 'Usado - Bueno', 'Para Restaurar'] }
            }
        },
        'moda y belleza': {
            'Ropa de Mujer': {
                'tipo_prenda': { type: 'select', options: ['Camisa', 'Pantalón', 'Vestido', 'Falda', 'Blusa', 'Chaqueta', 'Sudadera', 'Short', 'Otro'] },
                'talla': { type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
                'marca': { type: 'text', placeholder: 'Ej: Zara' },
                'color': { type: 'text', placeholder: 'Ej: Negro' },
                'condicion': { type: 'select', options: ['Nuevo con Etiqueta', 'Nuevo sin Etiqueta', 'Poco Uso', 'Usado', 'Excelente Estado'] }
            },
            'Ropa de Hombre': {
                'tipo_prenda': { type: 'select', options: ['Camisa', 'Pantalón', 'Vestido', 'Falda', 'Blusa', 'Chaqueta', 'Sudadera', 'Short', 'Otro'] },
                'talla': { type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
                'marca': { type: 'text', placeholder: 'Ej: Levi\'s' },
                'color': { type: 'text', placeholder: 'Ej: Azul' },
                'condicion': { type: 'select', options: ['Nuevo con Etiqueta', 'Nuevo sin Etiqueta', 'Poco Uso', 'Usado', 'Excelente Estado'] }
            },
            'Ropa de Niños': {
                'tipo_prenda': { type: 'select', options: ['Camisa', 'Pantalón', 'Vestido', 'Falda', 'Blusa', 'Chaqueta', 'Sudadera', 'Short', 'Otro'] },
                'talla': { type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
                'edad': { type: 'select', options: ['0-12 meses', '1-2 años', '3-4 años', '5-6 años', '7-8 años', '9-10 años', '11-12 años'] },
                'marca': { type: 'text', placeholder: 'Ej: Disney' },
                'color': { type: 'text', placeholder: 'Ej: Rojo' },
                'condicion': { type: 'select', options: ['Nuevo con Etiqueta', 'Nuevo sin Etiqueta', 'Poco Uso', 'Usado', 'Excelente Estado'] }
            },
            'Calzado': {
                'tipo_calzado': { type: 'select', options: ['Tenis', 'Zapatos Formales', 'Sandalias', 'Botas', 'Tacones', 'Otro'] },
                'talla_calzado': { type: 'text', placeholder: 'Ej: 42' },
                'marca': { type: 'text', placeholder: 'Ej: Nike' },
                'color': { type: 'text', placeholder: 'Ej: Blanco' },
                'condicion': { type: 'select', options: ['Nuevo con Etiqueta', 'Nuevo sin Etiqueta', 'Poco Uso', 'Usado', 'Excelente Estado'] }
            },
            'Bolsos y Carteras': {
                'tipo_bolso': { type: 'select', options: ['Bolso de Mano', 'Mochila', 'Cartera', 'Bolso de Viaje', 'Otro'] },
                'marca': { type: 'text', placeholder: 'Ej: Gucci' },
                'material': { type: 'text', placeholder: 'Ej: Cuero' },
                'color': { type: 'text', placeholder: 'Ej: Negro' },
                'condicion': { type: 'select', options: ['Nuevo con Etiqueta', 'Nuevo sin Etiqueta', 'Poco Uso', 'Usado', 'Excelente Estado'] }
            },
            'Accesorios': {
                'tipo_accesorio': { type: 'select', options: ['Reloj', 'Gafas de Sol', 'Cinturón', 'Bufanda', 'Gorra', 'Otro'] },
                'marca': { type: 'text', placeholder: 'Ej: Rolex' },
                'material': { type: 'text', placeholder: 'Ej: Oro' },
                'condicion': { type: 'select', options: ['Nuevo con Etiqueta', 'Nuevo sin Etiqueta', 'Poco Uso', 'Usado', 'Excelente Estado'] }
            },
            'Joyería y Relojes': {
                'tipo_joya': { type: 'select', options: ['Anillo', 'Collar', 'Pulsera', 'Aretes', 'Otro'] },
                'material': { type: 'text', placeholder: 'Ej: Oro' },
                'condicion': { type: 'select', options: ['Nuevo con Etiqueta', 'Nuevo sin Etiqueta', 'Poco Uso', 'Usado', 'Excelente Estado'] }
            },
            'Salud y Belleza': {
                'tipo_producto': { type: 'select', options: ['Maquillaje', 'Cuidado de la Piel', 'Perfume', 'Cuidado del Cabello', 'Productos de Baño', 'Otro'] },
                'marca': { type: 'text', placeholder: 'Ej: L\'Oréal' },
                'categoria_producto': { type: 'text', placeholder: 'Ej: Shampoo' },
                'condicion': { type: 'select', options: ['Nuevo con Etiqueta', 'Nuevo sin Etiqueta', 'Poco Uso', 'Usado', 'Excelente Estado'] }
            }
        },
        'deportes y hobbies': {
            'Bicicletas': {
                'tipo_bicicleta': { type: 'select', options: ['Mountain Bike', 'Ruta', 'BMX', 'Eléctrica', 'Híbrida', 'Infantil'] },
                'marca': { type: 'text', placeholder: 'Ej: Trek' },
                'aro': { type: 'select', options: ['12"', '16"', '20"', '24"', '26"', '27.5"', '29"'] },
                'condicion': { type: 'select', options: ['Nueva', 'Usada', 'Como Nueva'] }
            },
            'Coleccionables': {
                'tipo_articulo': { type: 'text', placeholder: 'Ej: Álbum de estampas' },
                'marca': { type: 'text', placeholder: 'Ej: Panini' },
                'condicion': { type: 'select', options: ['Nueva', 'Usada', 'Como Nueva'] }
            },
            'Deportes': {
                'tipo_articulo': { type: 'select', options: ['Ropa Deportiva', 'Calzado Deportivo', 'Balones', 'Raquetas', 'Guantes', 'Cascos', 'Pesas', 'Otros'] },
                'marca': { type: 'text', placeholder: 'Ej: Adidas' },
                'talla': { type: 'text', placeholder: 'Ej: M' },
                'condicion': { type: 'select', options: ['Nueva', 'Usada', 'Como Nueva'] }
            },
            'Instrumentos Musicales': {
                'tipo_instrumento': { type: 'select', options: ['Guitarra', 'Bajo', 'Batería', 'Piano/Teclado', 'Viento', 'Cuerdas', 'Otro'] },
                'marca': { type: 'text', placeholder: 'Ej: Yamaha' },
                'condicion': { type: 'select', options: ['Nueva', 'Usada', 'Como Nueva'] }
            },
            'Libros, Revistas y Comics': {
                'tipo_articulo': { type: 'text', placeholder: 'Ej: Libro de cocina' },
                'autor_fabricante': { type: 'text', placeholder: 'Ej: Gabriel García Márquez' },
                'condicion': { type: 'select', options: ['Nueva', 'Usada', 'Como Nueva'] }
            },
            'Otros Hobbies': {
                'tipo_articulo': { type: 'text', placeholder: 'Ej: Juego de mesa' },
                'marca': { type: 'text', placeholder: 'Ej: Hasbro' },
                'condicion': { type: 'select', options: ['Nueva', 'Usada', 'Como Nueva'] }
            }
        },
        'mascotas': {
            'Perros': {
                'tipo_anuncio': { type: 'select', options: ['Adopción', 'Venta', 'Encontrado', 'Perdido'] },
                'raza': { type: 'text', placeholder: 'Ej: Labrador' },
                'edad_mascota': { type: 'number', placeholder: 'Ej: 2' },
                'genero': { type: 'select', options: ['Macho', 'Hembra'] }
            },
            'Gatos': {
                'tipo_anuncio': { type: 'select', options: ['Adopción', 'Venta', 'Encontrado', 'Perdido'] },
                'raza': { type: 'text', placeholder: 'Ej: Siamés' },
                'edad_mascota': { type: 'number', placeholder: 'Ej: 1' },
                'genero': { type: 'select', options: ['Macho', 'Hembra'] }
            },
            'Aves': {
                'tipo_anuncio': { type: 'select', options: ['Adopción', 'Venta', 'Encontrado', 'Perdido'] },
                'raza': { type: 'text', placeholder: 'Ej: Canario' },
                'edad_mascota': { type: 'number', placeholder: 'Ej: 1' },
                'genero': { type: 'select', options: ['Macho', 'Hembra'] }
            },
            'Peces': {
                'tipo_anuncio': { type: 'select', options: ['Adopción', 'Venta', 'Encontrado', 'Perdido'] },
                'raza': { type: 'text', placeholder: 'Ej: Betta' }
            },
            'Otros Animales': {
                'tipo_anuncio': { type: 'select', options: ['Adopción', 'Venta', 'Encontrado', 'Perdido'] },
                'raza': { type: 'text', placeholder: 'Ej: Conejo' },
                'edad_mascota': { type: 'number', placeholder: 'Ej: 3' },
                'genero': { type: 'select', options: ['Macho', 'Hembra'] }
            },
            'Accesorios para Mascotas': {
                'tipo_accesorio': { type: 'select', options: ['Collar', 'Correa', 'Jaula', 'Comida', 'Otro'] },
                'marca': { type: 'text', placeholder: 'Ej: Pedigree' },
                'condicion': { type: 'select', options: ['Nuevo', 'Usado - Bueno', 'Usado - Regular'] }
            }
        },
        'servicios': {
            'Servicios de Construcción': {
                'tipo_servicio': { type: 'select', options: ['Construcción General', 'Remodelación', 'Albañilería', 'Pintura', 'Electricidad', 'Plomería', 'Carpintería', 'Techado', 'Otros'] },
                'modalidad': { type: 'select', options: ['Presencial', 'A domicilio', 'Virtual/Online', 'Híbrido'] },
                'experiencia': { type: 'select', options: ['Menos de 1 año', '1-3 años', '3-5 años', 'Más de 5 años'] }
            },
            'Servicios de Educación': {
                'tipo_servicio': { type: 'select', options: ['Clases Particulares', 'Tutoría Académica', 'Preparación de Exámenes', 'Idiomas', 'Música', 'Arte', 'Deportes', 'Informática', 'Otros'] },
                'modalidad': { type: 'select', options: ['Presencial', 'A domicilio', 'Virtual/Online', 'Híbrido'] },
                'experiencia': { type: 'select', options: ['Menos de 1 año', '1-3 años', '3-5 años', 'Más de 5 años'] }
            },
            'Servicios de Eventos': {
                'tipo_servicio': { type: 'select', options: ['Organización de Eventos', 'Catering', 'Decoración', 'Fotografía', 'Video', 'Música/DJ', 'Animación', 'Alquiler de Equipos', 'Otros'] },
                'modalidad': { type: 'select', options: ['Presencial', 'A domicilio', 'Virtual/Online', 'Híbrido'] },
                'experiencia': { type: 'select', options: ['Menos de 1 año', '1-3 años', '3-5 años', 'Más de 5 años'] }
            },
            'Servicios de Salud': {
                'tipo_servicio': { type: 'select', options: ['Consultas Médicas', 'Terapia Física', 'Psicología', 'Nutrición', 'Enfermería', 'Cuidado de Adultos Mayores', 'Masajes Terapéuticos', 'Otros'] },
                'modalidad': { type: 'select', options: ['Presencial', 'A domicilio', 'Virtual/Online', 'Híbrido'] },
                'experiencia': { type: 'select', options: ['Menos de 1 año', '1-3 años', '3-5 años', 'Más de 5 años'] }
            },
            'Servicios de Tecnología': {
                'tipo_servicio': { type: 'select', options: ['Reparación de Computadoras', 'Reparación de Celulares', 'Desarrollo Web', 'Diseño Gráfico', 'Soporte Técnico', 'Instalación de Redes', 'Consultoría IT', 'Otros'] },
                'modalidad': { type: 'select', options: ['Presencial', 'A domicilio', 'Virtual/Online', 'Híbrido'] },
                'experiencia': { type: 'select', options: ['Menos de 1 año', '1-3 años', '3-5 años', 'Más de 5 años'] }
            },
            'Servicios para el Hogar': {
                'tipo_servicio': { type: 'select', options: ['Limpieza', 'Jardinería', 'Reparaciones Generales', 'Cerrajería', 'Fumigación', 'Mudanzas', 'Lavandería', 'Cuidado de Niños', 'Otros'] },
                'modalidad': { type: 'select', options: ['Presencial', 'A domicilio', 'Virtual/Online', 'Híbrido'] },
                'experiencia': { type: 'select', options: ['Menos de 1 año', '1-3 años', '3-5 años', 'Más de 5 años'] }
            },
            'Otros Servicios': {
                'tipo_servicio': { type: 'text', placeholder: 'Describe el tipo de servicio' },
                'modalidad': { type: 'select', options: ['Presencial', 'A domicilio', 'Virtual/Online', 'Híbrido'] },
                'experiencia': { type: 'select', options: ['Menos de 1 año', '1-3 años', '3-5 años', 'Más de 5 años'] }
            }
        },
        'negocios': {
            'Equipos para Negocios': {
                'tipo_equipo': { type: 'select', options: ['Computadoras', 'Impresoras', 'Fotocopiadoras', 'Teléfonos/Centrales', 'Muebles de Oficina', 'Cajas Registradoras/POS', 'Equipos de Seguridad', 'Aire Acondicionado', 'Máquina de Café', 'Otros'] },
                'marca': { type: 'text', placeholder: 'Ej: HP' },
                'modelo': { type: 'text', placeholder: 'Ej: LaserJet' },
                'condicion': { type: 'select', options: ['Nuevo', 'Usado - Excelente', 'Usado - Bueno', 'Usado - Regular', 'Reacondicionado', 'Para Repuestos'] }
            },
            'Maquinaria para Negocios': {
                'tipo_equipo': { type: 'select', options: ['Maquinaria Industrial', 'Equipos de Construcción', 'Equipos de Restaurante', 'Equipos de Panadería', 'Equipos de Lavandería', 'Equipos Agrícolas', 'Equipos de Limpieza Industrial', 'Generadores', 'Compresores', 'Otros'] },
                'marca': { type: 'text', placeholder: 'Ej: Caterpillar' },
                'modelo': { type: 'text', placeholder: 'Ej: Excavadora' },
                'anio': { type: 'number', placeholder: 'Ej: 2020' },
                'condicion': { type: 'select', options: ['Nuevo', 'Usado - Excelente', 'Usado - Bueno', 'Usado - Regular', 'Reacondicionado', 'Para Repuestos'] }
            },
            'Negocios en Venta': {
                'tipo_negocio': { type: 'select', options: ['Restaurante', 'Cafetería', 'Tienda de Ropa', 'Supermercado/Minisuper', 'Farmacia', 'Ferretería', 'Oficina/Consultorio', 'Taller/Mecánica', 'Salón de Belleza', 'Gimnasio', 'Industrial', 'Otros'] },
                'años_operacion': { type: 'select', options: ['Menos de 1 año', '1-3 años', '3-5 años', 'Más de 5 años', 'Más de 10 años'] },
                'incluye': { type: 'text', placeholder: 'Ej: Local propio, inventario, equipos, clientela' },
                'razon_venta': { type: 'select', options: ['Cambio de rubro', 'Viaje al extranjero', 'Jubilación', 'Falta de tiempo', 'Problemas de salud', 'Otros'] }
            }
        },
        'comunidad': {
            'Clases y Cursos': {
                'tipo_clase': { type: 'select', options: ['Idioma', 'Música', 'Deporte', 'Arte', 'Otro'] },
                'modalidad': { type: 'select', options: ['Presencial', 'Virtual', 'Híbrido'] },
                'nivel': { type: 'select', options: ['Principiante', 'Intermedio', 'Avanzado'] }
            },
            'Eventos': {
                'tipo_evento': { type: 'select', options: ['Concierto', 'Fiesta', 'Conferencia', 'Otro'] },
                'fecha_evento': { type: 'date' },
                'ubicacion_evento': { type: 'text', placeholder: 'Ej: Teatro Nacional' }
            },
            'Otros': {
                'tipo_anuncio': { type: 'select', options: ['Oferta', 'Búsqueda', 'Anuncio General'] }
            }
        }
    };

    // --- DATOS DE SUBCATEGORÍAS DE ELECTRÓNICA ---
    const electronicsSubcategories = {
        "Celulares y Teléfonos": ["marca", "modelo", "almacenamiento", "memoria_ram", "condicion"],
        "Computadoras": ["tipo_computadora", "marca", "procesador", "memoria_ram", "almacenamiento", "tamano_pantalla", "condicion"],
        "Consolas y Videojuegos": ["plataforma", "modelo", "almacenamiento", "condicion"],
        "Audio y Video": ["tipo_articulo", "marca", "modelo", "condicion"],
        "Fotografía": ["tipo_equipo", "marca", "modelo", "condicion"]
    };

    // --- DATOS DE SUBCATEGORÍAS DE HOGAR Y MUEBLES ---
    const homeFurnitureSubcategories = {
        "Artículos de Cocina": ["tipo_articulo", "material", "marca", "condicion"],
        "Decoración": ["tipo_decoracion", "material", "color", "dimensiones", "condicion"],
        "Electrodomésticos": ["tipo_electrodomestico", "marca", "modelo", "condicion"],
        "Jardín y Exterior": ["tipo_articulo", "material", "condicion"],
        "Muebles": ["tipo_mueble", "material", "color", "dimensiones", "condicion"]
    };

    // --- DATOS DE SUBCATEGORÍAS DE MODA Y BELLEZA ---
    const fashionSubcategories = {
        "Ropa de Mujer": ["tipo_prenda", "talla", "marca", "color", "condicion"],
        "Ropa de Hombre": ["tipo_prenda", "talla", "marca", "color", "condicion"],
        "Ropa de Niños": ["tipo_prenda", "talla", "edad", "marca", "color", "condicion"],
        "Calzado": ["tipo_calzado", "talla_calzado", "marca", "color", "condicion"],
        "Bolsos y Carteras": ["tipo_bolso", "marca", "material", "color", "condicion"],
        "Accesorios": ["tipo_accesorio", "marca", "material", "condicion"],
        "Joyería y Relojes": ["tipo_joya", "material", "condicion"],
        "Salud y Belleza": ["tipo_producto", "marca", "categoria_producto", "condicion"]
    };

    // ========================================
    // CONFIGURACIÓN DE SUBCATEGORÍAS - DEPORTES Y HOBBIES
    // ========================================
    const sportsSubcategories = {
        "Bicicletas": ["tipo_bicicleta", "marca", "aro", "condicion"],
        "Coleccionables": ["tipo_articulo", "marca", "condicion"],
        "Deportes": ["tipo_articulo", "marca", "talla", "condicion"],
        "Instrumentos Musicales": ["tipo_instrumento", "marca", "condicion"],
        "Libros, Revistas y Comics": ["tipo_articulo", "autor_fabricante", "condicion"],
        "Otros Hobbies": ["tipo_articulo", "marca", "condicion"]
    };

    // ========================================
    // CONFIGURACIÓN DE SUBCATEGORÍAS - MASCOTAS
    // ========================================
    const petsSubcategories = {
        "Perros": ["tipo_anuncio", "raza", "edad_mascota", "genero"],
        "Gatos": ["tipo_anuncio", "raza", "edad_mascota", "genero"],
        "Aves": ["tipo_anuncio", "raza", "edad_mascota", "genero"],
        "Peces": ["tipo_anuncio", "raza", "edad_mascota"],
        "Otros Animales": ["tipo_anuncio", "raza", "edad_mascota", "genero"],
        "Accesorios para Mascotas": ["tipo_accesorio", "marca", "condicion"]
    };

    // ========================================
    // CONFIGURACIÓN DE SUBCATEGORÍAS - SERVICIOS
    // ========================================
    const servicesSubcategories = {
        "Servicios de Construcción": ["tipo_servicio", "modalidad", "experiencia"],
        "Servicios de Educación": ["tipo_servicio", "modalidad", "experiencia"],
        "Servicios de Eventos": ["tipo_servicio", "modalidad", "experiencia"],
        "Servicios de Salud": ["tipo_servicio", "modalidad", "experiencia"],
        "Servicios de Tecnología": ["tipo_servicio", "modalidad", "experiencia"],
        "Servicios para el Hogar": ["tipo_servicio", "modalidad", "experiencia"],
        "Otros Servicios": ["tipo_servicio", "modalidad", "experiencia"]
    };

    // ========================================
    // CONFIGURACIÓN DE SUBCATEGORÍAS - NEGOCIOS
    // ========================================
    const businessSubcategories = {
        "Equipos para Negocios": ["tipo_equipo", "marca", "modelo", "condicion"],
        "Maquinaria para Negocios": ["tipo_equipo", "marca", "modelo", "condicion", "anio"],
        "Negocios en Venta": ["tipo_negocio", "años_operacion", "incluye", "razon_venta"]
    };

    // ========================================
    // CONFIGURACIÓN DE SUBCATEGORÍAS - COMUNIDAD
    // ========================================
    const communitySubcategories = {
        "Clases y Cursos": ["tipo_clase", "modalidad", "nivel"],
        "Eventos": ["tipo_evento", "fecha_evento", "ubicacion_evento"],
        "Otros": ["tipo_anuncio"]
    };

    // --- DATOS DE SUBCATEGORÍAS DE VEHÍCULOS ---
    const vehicleSubcategories = {
        "Autos": ["marca", "modelo", "anio", "kilometraje", "transmision", "combustible", "color", "condicion"],
        "Motos": ["marca", "modelo", "anio", "kilometraje", "cilindraje", "tipo_moto", "color", "condicion"],
        "Camiones": ["marca", "modelo", "anio", "kilometraje", "transmision", "combustible", "capacidad_carga", "condicion"],
        "Otros Vehículos": ["marca", "modelo", "anio", "tipo_vehiculo", "condicion"]
    };

    // --- DATOS DE SUBCATEGORÍAS DE INMUEBLES ---
    const realEstateSubcategories = {
        "Casas": ["tipo_operacion", "m2", "habitaciones", "baños", "estacionamientos", "condicion"],
        "Apartamentos": ["tipo_operacion", "m2", "habitaciones", "baños", "estacionamientos", "piso", "condicion"],
        "Terrenos": ["tipo_operacion", "m2", "uso_suelo", "servicios"],
        "Locales Comerciales": ["tipo_operacion", "m2", "baños", "ubicacion_comercial", "condicion"],
        "Oficinas": ["tipo_operacion", "m2", "baños", "estacionamientos", "piso", "condicion"]
    };

    // --- FUNCIONES AUXILIARES PARA EL PASO 3 ---
function showDynamicFields() {
    // Deshabilitar todos los inputs de secciones ocultas
    vehicleDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    realestateDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    electronicsDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    homeFurnitureDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    fashionDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    sportsDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    petsDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    servicesDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    businessDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    communityDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);

    if (selectedMainCategory.toLowerCase().includes('vehículo') || selectedMainCategory.toLowerCase().includes('auto') || selectedMainCategory.toLowerCase().includes('carro')) {
        vehicleDetails.style.display = 'block';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'none';
        fashionDetails.style.display = 'none';
        vehicleDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
    } else if (selectedMainCategory.toLowerCase().includes('inmueble') || selectedMainCategory.toLowerCase().includes('casa') || selectedMainCategory.toLowerCase().includes('apartamento')) {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'block';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'none';
        fashionDetails.style.display = 'none';
        realestateDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
    } else if (selectedMainCategory.toLowerCase().includes('electrónica')) {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'block';
        homeFurnitureDetails.style.display = 'none';
        fashionDetails.style.display = 'none';
        electronicsDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showElectronicsFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('hogar') || selectedMainCategory.toLowerCase().includes('mueble')) {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'block';
        fashionDetails.style.display = 'none';
        homeFurnitureDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showHomeFurnitureFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('moda') || selectedMainCategory.toLowerCase().includes('belleza') || selectedMainCategory.toLowerCase().includes('ropa')) {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'none';
        fashionDetails.style.display = 'block';
        sportsDetails.style.display = 'none';
        petsDetails.style.display = 'none';
        servicesDetails.style.display = 'none';
        businessDetails.style.display = 'none';
        communityDetails.style.display = 'none';
        fashionDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showFashionFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('deportes') || selectedMainCategory.toLowerCase().includes('hobbies')) {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'none';
        fashionDetails.style.display = 'none';
        sportsDetails.style.display = 'block';
        petsDetails.style.display = 'none';
        servicesDetails.style.display = 'none';
        businessDetails.style.display = 'none';
        communityDetails.style.display = 'none';
        sportsDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showSportsFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('mascota')) {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'none';
        fashionDetails.style.display = 'none';
        sportsDetails.style.display = 'none';
        petsDetails.style.display = 'block';
        servicesDetails.style.display = 'none';
        businessDetails.style.display = 'none';
        communityDetails.style.display = 'none';
        petsDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showPetsFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('servicio')) {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'none';
        fashionDetails.style.display = 'none';
        sportsDetails.style.display = 'none';
        petsDetails.style.display = 'none';
        servicesDetails.style.display = 'block';
        businessDetails.style.display = 'none';
        communityDetails.style.display = 'none';
        servicesDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showServicesFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('negocio')) {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'none';
        fashionDetails.style.display = 'none';
        sportsDetails.style.display = 'none';
        petsDetails.style.display = 'none';
        servicesDetails.style.display = 'none';
        businessDetails.style.display = 'block';
        communityDetails.style.display = 'none';
        businessDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showBusinessFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('comunidad')) {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'none';
        fashionDetails.style.display = 'none';
        sportsDetails.style.display = 'none';
        petsDetails.style.display = 'none';
        servicesDetails.style.display = 'none';
        businessDetails.style.display = 'none';
        communityDetails.style.display = 'block';
        communityDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showCommunityFields();
        }
    } else {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'none';
        fashionDetails.style.display = 'none';
        sportsDetails.style.display = 'none';
        petsDetails.style.display = 'none';
        servicesDetails.style.display = 'none';
        businessDetails.style.display = 'none';
        communityDetails.style.display = 'none';
    }
}

    function showElectronicsFields() {
        // --- LÍNEAS DE CORRECCIÓN OBLIGATORIAS ---
        const container = document.getElementById('electronics-fields');
        const mainSection = document.getElementById('electronics-details'); // El contenedor padre

        // Forzar visibilidad
        if (mainSection) {
            mainSection.style.display = 'block';
            mainSection.style.visibility = 'visible';
        }
        if (container) {
            container.innerHTML = ''; // Limpia el contenedor antes de añadir nuevos campos
        } else {
            console.error('¡ERROR CRÍTICO! Los contenedores HTML no se encontraron. Revisa los IDs.');
            return; // Detiene la función si los divs no existen
        }
        // --- FIN DE LA CORRECCIÓN ---

        const fields = electronicsSubcategories[selectedSubcategory];
        if (!fields) {
            console.log('No fields found for subcategory:', selectedSubcategory);
            return;
        }

        console.log('Showing fields for subcategory:', selectedSubcategory, fields);

        // PRIORIDAD #1: Asegurar visibilidad del contenedor principal
        electronicsDetails.style.display = 'block';
        electronicsDetails.style.border = null;
        electronicsDetails.style.padding = null;
        electronicsDetails.style.marginTop = null;
        electronicsDetails.style.backgroundColor = null;

        // PRIORIDAD #2: Limpiar el contenedor de campos
        electronicsFields.innerHTML = '';

        // PRIORIDAD #3: Añadir título descriptivo
        const titleDiv = document.createElement('div');
        titleDiv.innerHTML = `<h4 style="color: var(--color-primario); margin-bottom: 20px; text-align: center;">Especificaciones para ${selectedSubcategory}</h4>`;
        electronicsFields.appendChild(titleDiv);

        fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-group';
            fieldDiv.style.marginBottom = '15px';
            fieldDiv.style.padding = '10px';
            fieldDiv.style.border = '1px solid #ddd';
            fieldDiv.style.borderRadius = '5px';
            fieldDiv.style.backgroundColor = 'white';
            // Removed debugging styles

            let labelText = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            let inputType = 'text';
            let placeholder = '';

            if (field === 'tipo_computadora') {
                labelText = 'Tipo de Computadora';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.className = 'form-control';
                select.style.width = '100%';
                select.style.padding = '8px';
                select.style.border = '1px solid #ccc';
                select.style.borderRadius = '4px';
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Escritorio">Escritorio</option>
                `;
                const label = document.createElement('label');
                label.textContent = labelText;
                label.style.display = 'block';
                label.style.marginBottom = '5px';
                label.style.fontWeight = 'bold';
                fieldDiv.appendChild(label);
                fieldDiv.appendChild(select);
            } else if (field === 'plataforma') {
                labelText = 'Plataforma';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = `electronics_${field}`;
                select.className = 'form-control';
                select.style.width = '100%';
                select.style.padding = '8px';
                select.style.border = '1px solid #ccc';
                select.style.borderRadius = '4px';
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="PlayStation">PlayStation</option>
                    <option value="Xbox">Xbox</option>
                    <option value="Nintendo">Nintendo</option>
                    <option value="PC">PC</option>
                    <option value="Otra">Otra</option>
                `;
                const label = document.createElement('label');
                label.textContent = labelText;
                label.style.display = 'block';
                label.style.marginBottom = '5px';
                label.style.fontWeight = 'bold';
                fieldDiv.appendChild(label);
                fieldDiv.appendChild(select);
            } else if (field === 'tipo_equipo') {
                labelText = 'Tipo de Equipo Fotográfico';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="Cámara Digital">Cámara Digital</option>
                    <option value="Cámara Réflex">Cámara Réflex</option>
                    <option value="Cámara Mirrorless">Cámara Mirrorless</option>
                    <option value="Lente">Lente</option>
                    <option value="Flash">Flash</option>
                    <option value="Trípode">Trípode</option>
                    <option value="Estabilizador">Estabilizador</option>
                    <option value="Drone">Drone con Cámara</option>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Otro">Otro</option>
                `;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(select);
            } else if (field === 'condicion') {
                labelText = 'Condición';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = `electronics_${field}`;
                select.className = 'form-control';
                select.style.width = '100%';
                select.style.padding = '8px';
                select.style.border = '1px solid #ccc';
                select.style.borderRadius = '4px';
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="Nuevo">Nuevo</option>
                    <option value="Usado - Como Nuevo">Usado - Como Nuevo</option>
                    <option value="Usado - Bueno">Usado - Bueno</option>
                    <option value="Usado - Aceptable">Usado - Aceptable</option>
                    <option value="Para Repuestos">Para Repuestos</option>
                `;
                const label = document.createElement('label');
                label.textContent = labelText;
                label.style.display = 'block';
                label.style.marginBottom = '5px';
                label.style.fontWeight = 'bold';
                fieldDiv.appendChild(label);
                fieldDiv.appendChild(select);
            } else if (field === 'memoria_ram') {
                inputType = 'number';
                placeholder = 'Ej: 8';
                labelText = 'Memoria RAM (GB)';
            } else if (field === 'almacenamiento') {
                inputType = 'number';
                placeholder = 'Ej: 256';
                labelText = 'Almacenamiento (GB)';
            } else if (field === 'tamano_pantalla') {
                inputType = 'number';
                placeholder = 'Ej: 15.6';
                labelText = 'Tamaño de Pantalla (pulgadas)';
            } else {
                placeholder = `Ej: ${labelText}`;
            }

            if (field !== 'tipo_computadora' && field !== 'plataforma' && field !== 'tipo_equipo' && field !== 'condicion') {
                const input = document.createElement('input');
                input.type = inputType;
                input.id = `attr-${field}`;
                input.name = field;
                input.placeholder = placeholder;
                input.className = 'form-control';
                input.style.width = '100%';
                input.style.padding = '8px';
                input.style.border = '1px solid #ccc';
                input.style.borderRadius = '4px';
                input.style.boxSizing = 'border-box';
                const label = document.createElement('label');
                label.textContent = labelText;
                label.style.display = 'block';
                label.style.marginBottom = '5px';
                label.style.fontWeight = 'bold';
                fieldDiv.appendChild(label);
                fieldDiv.appendChild(input);
            }

            electronicsFields.appendChild(fieldDiv);
            console.log('Added field:', field, 'to electronicsFields');
        });
        console.log('Total fields added:', fields.length);
    }

    function showHomeFurnitureFields() {
        const fields = homeFurnitureSubcategories[selectedSubcategory];
        if (!fields) {
            console.log('No fields found for subcategory:', selectedSubcategory);
            return;
        }

        console.log('Showing fields for subcategory:', selectedSubcategory, fields);

        homeFurnitureDetails.style.display = 'block';
        homeFurnitureFields.innerHTML = '';

        const titleDiv = document.createElement('div');
        titleDiv.innerHTML = `<h4 style="color: #007bff; margin-bottom: 20px; text-align: center;">Especificaciones para ${selectedSubcategory}</h4>`;
        homeFurnitureFields.appendChild(titleDiv);

        fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-group';

            let labelText = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            let inputType = 'text';
            let placeholder = '';

            if (field === 'tipo_mueble') {
                labelText = 'Tipo de Mueble';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="Sofá">Sofá</option>
                    <option value="Mesa">Mesa</option>
                    <option value="Silla">Silla</option>
                    <option value="Estantería">Estantería</option>
                    <option value="Cama">Cama</option>
                    <option value="Cómoda">Cómoda</option>
                    <option value="Armario">Armario</option>
                    <option value="Otro">Otro</option>
                `;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(select);
            } else if (field === 'tipo_articulo') {
                labelText = 'Tipo de Artículo';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                
                // Opciones dinámicas según subcategoría
                let options = '';
                if (selectedSubcategory === 'Artículos de Cocina') {
                    options = `
                        <option value="">Selecciona</option>
                        <option value="Utensilios">Utensilios</option>
                        <option value="Vajilla">Vajilla</option>
                        <option value="Ollas y Sartenes">Ollas y Sartenes</option>
                        <option value="Cuchillería">Cuchillería</option>
                        <option value="Otro">Otro</option>
                    `;
                } else if (selectedSubcategory === 'Jardín y Exterior') {
                    options = `
                        <option value="">Selecciona</option>
                        <option value="Herramientas de Jardín">Herramientas de Jardones</option>
                        <option value="Muebles de Jardín">Muebles de Jardín</option>
                        <option value="Plantas y Macetas">Plantas y Macetas</option>
                        <option value="Parrillas">Parrillas</option>
                        <option value="Iluminación Exterior">Iluminación Exterior</option>
                        <option value="Otro">Otro</option>
                    `;
                } else {
                    options = `<option value="">Selecciona</option><option value="Otro">Otro</option>`;
                }
                
                select.innerHTML = options;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(select);
            } else if (field === 'tipo_electrodomestico') {
                labelText = 'Tipo de Electrodoméstico';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="Refrigerador">Refrigerador</option>
                    <option value="Lavadora">Lavadora</option>
                    <option value="Microondas">Microondas</option>
                    <option value="Estufa">Estufa</option>
                    <option value="Licuadora">Licuadora</option>
                    <option value="Aspiradora">Aspiradora</option>
                    <option value="Otro">Otro</option>
                `;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(select);
            } else if (field === 'tipo_decoracion') {
                labelText = 'Tipo de Decoración';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="Cuadro">Cuadro</option>
                    <option value="Espejo">Espejo</option>
                    <option value="Lámpara">Lámpara</option>
                    <option value="Alfombra">Alfombra</option>
                    <option value="Cortina">Cortina</option>
                    <option value="Otro">Otro</option>
                `;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(select);
            } else if (field === 'condicion') {
                labelText = 'Condición';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="Nuevo">Nuevo</option>
                    <option value="Usado - Excelente">Usado - Excelente</option>
                    <option value="Usado - Bueno">Usado - Bueno</option>
                    <option value="Para Restaurar">Para Restaurar</option>
                `;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(select);
            } else if (field === 'dimensiones') {
                placeholder = 'Ej: 120x80x75 cm';
                labelText = 'Dimensiones';
            } else {
                placeholder = `Ej: ${labelText}`;
            }

            if (field !== 'tipo_mueble' && field !== 'tipo_articulo' && field !== 'tipo_electrodomestico' && field !== 'tipo_decoracion' && field !== 'condicion') {
                const input = document.createElement('input');
                input.type = inputType;
                input.id = `attr-${field}`;
                input.name = field;
                input.placeholder = placeholder;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(input);
            }

            homeFurnitureFields.appendChild(fieldDiv);
        });
    }
function showFashionFields() {
    const fields = fashionSubcategories[selectedSubcategory];
    if (!fields) {
        console.log('No fields found for subcategory:', selectedSubcategory);
        return;
    }

    console.log('Showing fields for subcategory:', selectedSubcategory, fields);

    fashionDetails.style.display = 'block';
    fashionFields.innerHTML = '';

    const titleDiv = document.createElement('div');
    titleDiv.innerHTML = `<h4 style="color: #007bff; margin-bottom: 20px; text-align: center;">Especificaciones para ${selectedSubcategory}</h4>`;
    fashionFields.appendChild(titleDiv);

    fields.forEach(field => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'form-group';

        let labelText = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        let inputType = 'text';
        let placeholder = '';

        if (field === 'tipo_prenda') {
            labelText = 'Tipo de Prenda';
            const select = document.createElement('select');
            select.id = `attr-${field}`;
            select.name = field;
            select.innerHTML = `
                <option value="">Selecciona</option>
                <option value="Camisa">Camisa</option>
                <option value="Pantalón">Pantalón</option>
                <option value="Vestido">Vestido</option>
                <option value="Falda">Falda</option>
                <option value="Blusa">Blusa</option>
                <option value="Chaqueta">Chaqueta</option>
                <option value="Sudadera">Sudadera</option>
                <option value="Short">Short</option>
                <option value="Otro">Otro</option>
            `;
            fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
            fieldDiv.appendChild(select);
        } else if (field === 'tipo_calzado') {
            labelText = 'Tipo de Calzado';
            const select = document.createElement('select');
            select.id = `attr-${field}`;
            select.name = field;
            select.innerHTML = `
                <option value="">Selecciona</option>
                <option value="Tenis">Tenis</option>
                <option value="Zapatos Formales">Zapatos Formales</option>
                <option value="Sandalias">Sandalias</option>
                <option value="Botas">Botas</option>
                <option value="Tacones">Tacones</option>
                <option value="Otro">Otro</option>
            `;
            fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
            fieldDiv.appendChild(select);
        } else if (field === 'tipo_bolso') {
            labelText = 'Tipo de Bolso';
            const select = document.createElement('select');
            select.id = `attr-${field}`;
            select.name = field;
            select.innerHTML = `
                <option value="">Selecciona</option>
                <option value="Bolso de Mano">Bolso de Mano</option>
                <option value="Mochila">Mochila</option>
                <option value="Cartera">Cartera</option>
                <option value="Bolso de Viaje">Bolso de Viaje</option>
                <option value="Otro">Otro</option>
            `;
            fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
            fieldDiv.appendChild(select);
        } else if (field === 'tipo_accesorio') {
            labelText = 'Tipo de Accesorio';
            const select = document.createElement('select');
            select.id = `attr-${field}`;
            select.name = field;
            select.innerHTML = `
                <option value="">Selecciona</option>
                <option value="Reloj">Reloj</option>
                <option value="Gafas de Sol">Gafas de Sol</option>
                <option value="Cinturón">Cinturón</option>
                <option value="Bufanda">Bufanda</option>
                <option value="Gorra">Gorra</option>
                <option value="Otro">Otro</option>
            `;
            fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
            fieldDiv.appendChild(select);
        } else if (field === 'tipo_joya') {
            labelText = 'Tipo de Joya';
            const select = document.createElement('select');
            select.id = `attr-${field}`;
            select.name = field;
            select.innerHTML = `
                <option value="">Selecciona</option>
                <option value="Anillo">Anillo</option>
                <option value="Collar">Collar</option>
                <option value="Pulsera">Pulsera</option>
                <option value="Aretes">Aretes</option>
                <option value="Otro">Otro</option>
            `;
            fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
            fieldDiv.appendChild(select);
        } else if (field === 'tipo_producto') {
            labelText = 'Tipo de Producto';
            const select = document.createElement('select');
            select.id = `attr-${field}`;
            select.name = field;
            select.innerHTML = `
                <option value="">Selecciona</option>
                <option value="Maquillaje">Maquillaje</option>
                <option value="Cuidado de la Piel">Cuidado de la Piel</option>
                <option value="Perfume">Perfume</option>
                <option value="Cuidado del Cabello">Cuidado del Cabello</option>
                <option value="Productos de Baño">Productos de Baño</option>
                <option value="Otro">Otro</option>
            `;
            fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
            fieldDiv.appendChild(select);
        } else if (field === 'talla') {
            labelText = 'Talla';
            const select = document.createElement('select');
            select.id = `attr-${field}`;
            select.name = field;
            select.innerHTML = `
                <option value="">Selecciona</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
            `;
            fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
            fieldDiv.appendChild(select);
        } else if (field === 'edad') {
            labelText = 'Edad';
            const select = document.createElement('select');
            select.id = `attr-${field}`;
            select.name = field;
            select.innerHTML = `
                <option value="">Selecciona</option>
                <option value="0-12 meses">0-12 meses</option>
                <option value="1-2 años">1-2 años</option>
                <option value="3-4 años">3-4 años</option>
                <option value="5-6 años">5-6 años</option>
                <option value="7-8 años">7-8 años</option>
                <option value="9-10 años">9-10 años</option>
                <option value="11-12 años">11-12 años</option>
            `;
            fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
            fieldDiv.appendChild(select);
        } else if (field === 'condicion') {
            labelText = 'Condición';
            const select = document.createElement('select');
            select.id = `attr-${field}`;
            select.name = field;
            select.innerHTML = `
                <option value="">Selecciona</option>
                <option value="Nuevo con Etiqueta">Nuevo con Etiqueta</option>
                <option value="Nuevo sin Etiqueta">Nuevo sin Etiqueta</option>
                <option value="Poco Uso">Poco Uso</option>
                <option value="Usado">Usado</option>
                <option value="Excelente Estado">Excelente Estado</option>
            `;
            fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
            fieldDiv.appendChild(select);
        } else {
            placeholder = `Ej: ${labelText}`;
        }

        if (field !== 'tipo_prenda' && field !== 'tipo_calzado' && field !== 'tipo_bolso' && field !== 'tipo_accesorio' && field !== 'tipo_joya' && field !== 'tipo_producto' && field !== 'talla' && field !== 'edad' && field !== 'condicion') {
            const input = document.createElement('input');
            input.type = inputType;
            input.id = `attr-${field}`;
            input.name = field;
            input.placeholder = placeholder;
            fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
            fieldDiv.appendChild(input);
        }

        fashionFields.appendChild(fieldDiv);
    });
}

    function showSportsFields() {
        const fields = sportsSubcategories[selectedSubcategory];
        if (!fields) {
            console.log('No fields found for subcategory:', selectedSubcategory);
            return;
        }

        console.log('Showing fields for subcategory:', selectedSubcategory, fields);

        sportsDetails.style.display = 'block';
        sportsFields.innerHTML = '';

        const titleDiv = document.createElement('div');
        titleDiv.innerHTML = `<h4 style="color: #007bff; margin-bottom: 20px; text-align: center;">Especificaciones para ${selectedSubcategory}</h4>`;
        sportsFields.appendChild(titleDiv);

        fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-group';

            let labelText = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            let inputType = 'text';
            let placeholder = '';

            const fieldConfigs = {
                tipo_bicicleta: {
                    label: 'Tipo de Bicicleta',
                    type: 'select',
                    options: ['Mountain Bike', 'Ruta', 'BMX', 'Eléctrica', 'Híbrida', 'Infantil']
                },
                tipo_articulo: selectedSubcategory === 'Deportes' ? {
                    label: 'Tipo de Artículo',
                    type: 'select',
                    options: ['Ropa Deportiva', 'Calzado Deportivo', 'Balones', 'Raquetas', 'Guantes', 'Cascos', 'Pesas', 'Otros']
                } : {
                    label: 'Tipo de Artículo',
                    type: 'text',
                    placeholder: 'Ej: Álbum de estampas, Libro de cocina, etc.'
                },
                tipo_instrumento: {
                    label: 'Tipo de Instrumento',
                    type: 'select',
                    options: ['Guitarra', 'Bajo', 'Batería', 'Piano/Teclado', 'Viento', 'Cuerdas', 'Otro']
                },
                marca: (() => {
                    const placeholders = {
                        'Bicicletas': 'Ej: Trek, Giant, Specialized, BMX, Rali',
                        'Instrumentos Musicales': 'Ej: Yamaha, Fender, Gibson, Roland',
                        'Deportes': 'Ej: Nike, Adidas, Puma, Reebok',
                        'Coleccionables': 'Ej: Panini, Marvel, Hot Wheels, Lego',
                        'Libros, Revistas y Comics': 'Ej: Editorial Planeta, Marvel Comics, DC',
                        'Otros Hobbies': 'Ej: Marca del artículo'
                    };
                    return {
                        label: 'Marca', 
                        type: 'text',
                        placeholder: placeholders[selectedSubcategory] || 'Ej: Marca del artículo'
                    };
                })(),
                aro: {
                    label: 'Aro',
                    type: 'select',
                    options: ['12"', '16"', '20"', '24"', '26"', '27.5"', '29"']
                },
                talla: { 
                    label: 'Talla', 
                    type: 'text',
                    placeholder: 'Ej: S, M, L, XL, 42'
                },
                autor_fabricante: { 
                    label: 'Autor/Fabricante', 
                    type: 'text',
                    placeholder: 'Ej: Gabriel García Márquez'
                },
                condicion: {
                    label: 'Condición',
                    type: 'select',
                    options: ['Nueva', 'Usada', 'Como Nueva']
                }
            };

            const config = fieldConfigs[field];

            if (!config) {
                console.warn(`No configuration found for field: ${field}`);
                return;
            }

            const label = document.createElement('label');
            label.setAttribute('for', `attr-${field}`);
            label.textContent = `${config.label}:`;
            fieldDiv.appendChild(label);

            if (config.type === 'select') {
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.className = 'form-control';
                select.innerHTML = `
                    <option value="">Selecciona ${config.label}</option>
                    ${config.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                `;
                fieldDiv.appendChild(select);
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.id = `attr-${field}`;
                input.name = field;
                input.className = 'form-control';
                input.placeholder = config.placeholder || '';
                fieldDiv.appendChild(input);
            }

            sportsFields.appendChild(fieldDiv);
        });
    }

    function showPetsFields() {
        const fields = petsSubcategories[selectedSubcategory];
        if (!fields) {
            console.log('No fields found for subcategory:', selectedSubcategory);
            return;
        }

        console.log('Showing fields for subcategory:', selectedSubcategory, fields);

        petsDetails.style.display = 'block';
        petsFields.innerHTML = '';

        const titleDiv = document.createElement('div');
        titleDiv.innerHTML = `<h4 style="color: #007bff; margin-bottom: 20px; text-align: center;">Especificaciones para ${selectedSubcategory}</h4>`;
        petsFields.appendChild(titleDiv);

        fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-group';

            let labelText = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            let inputType = 'text';
            let placeholder = '';

            if (field === 'tipo_anuncio') {
                labelText = 'Tipo de Anuncio';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="Adopción">Adopción</option>
                    <option value="Venta">Venta</option>
                    <option value="Encontrado">Encontrado</option>
                    <option value="Perdido">Perdido</option>
                `;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(select);
            } else if (field === 'tipo_accesorio') {
                labelText = 'Tipo de Accesorio';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="Collar">Collar</option>
                    <option value="Correa">Correa</option>
                    <option value="Jaula">Jaula</option>
                    <option value="Comida">Comida</option>
                    <option value="Otro">Otro</option>
                `;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(select);
            } else if (field === 'genero') {
                labelText = 'Género';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                `;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(select);
            } else if (field === 'condicion') {
                labelText = 'Condición';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="Nuevo">Nuevo</option>
                    <option value="Usado - Bueno">Usado - Bueno</option>
                    <option value="Usado - Regular">Usado - Regular</option>
                `;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(select);
            } else if (field === 'edad_mascota') {
                inputType = 'number';
                placeholder = 'Ej: 2';
                labelText = 'Edad de la Mascota (años)';
            } else {
                placeholder = `Ej: ${labelText}`;
            }

            if (field !== 'tipo_anuncio' && field !== 'tipo_accesorio' && field !== 'genero' && field !== 'condicion') {
                const input = document.createElement('input');
                input.type = inputType;
                input.id = `attr-${field}`;
                input.name = field;
                input.placeholder = placeholder;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(input);
            }

            petsFields.appendChild(fieldDiv);
        });
    }

    function showServicesFields() {
        const fields = servicesSubcategories[selectedSubcategory];
        if (!fields) {
            console.log('No fields found for subcategory:', selectedSubcategory);
            return;
        }

        console.log('Showing fields for subcategory:', selectedSubcategory, fields);

        servicesDetails.style.display = 'block';
        servicesFields.innerHTML = '';

        const titleDiv = document.createElement('div');
        titleDiv.innerHTML = `<h4 style="color: #007bff; margin-bottom: 20px; text-align: center;">Especificaciones para ${selectedSubcategory}</h4>`;
        servicesFields.appendChild(titleDiv);

        fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-group';

            let labelText = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            let inputType = 'text';
            let placeholder = '';

            const fieldConfigs = {
                tipo_servicio: (() => {
                    const serviceTypes = {
                        'Servicios de Construcción': {
                            type: 'select',
                            options: ['Construcción General', 'Remodelación', 'Albañilería', 'Pintura', 'Electricidad', 'Plomería', 'Carpintería', 'Techado', 'Otros']
                        },
                        'Servicios de Educación': {
                            type: 'select',
                            options: ['Clases Particulares', 'Tutoría Académica', 'Preparación de Exámenes', 'Idiomas', 'Música', 'Arte', 'Deportes', 'Informática', 'Otros']
                        },
                        'Servicios de Eventos': {
                            type: 'select',
                            options: ['Organización de Eventos', 'Catering', 'Decoración', 'Fotografía', 'Video', 'Música/DJ', 'Animación', 'Alquiler de Equipos', 'Otros']
                        },
                        'Servicios de Salud': {
                            type: 'select',
                            options: ['Consultas Médicas', 'Terapia Física', 'Psicología', 'Nutrición', 'Enfermería', 'Cuidado de Adultos Mayores', 'Masajes Terapéuticos', 'Otros']
                        },
                        'Servicios de Tecnología': {
                            type: 'select',
                            options: ['Reparación de Computadoras', 'Reparación de Celulares', 'Desarrollo Web', 'Diseño Gráfico', 'Soporte Técnico', 'Instalación de Redes', 'Consultoría IT', 'Otros']
                        },
                        'Servicios para el Hogar': {
                            type: 'select',
                            options: ['Limpieza', 'Jardinería', 'Reparaciones Generales', 'Cerrajería', 'Fumigación', 'Mudanzas', 'Lavandería', 'Cuidado de Niños', 'Otros']
                        },
                        'Otros Servicios': {
                            type: 'text',
                            placeholder: 'Describe el tipo de servicio'
                        }
                    };
                    
                    const config = serviceTypes[selectedSubcategory] || serviceTypes['Otros Servicios'];
                    return {
                        label: 'Tipo de Servicio',
                        ...config
                    };
                })(),
                modalidad: {
                    label: 'Modalidad',
                    type: 'select',
                    options: ['Presencial', 'A domicilio', 'Virtual/Online', 'Híbrido']
                },
                experiencia: {
                    label: 'Experiencia',
                    type: 'select',
                    options: ['Menos de 1 año', '1-3 años', '3-5 años', 'Más de 5 años']
                }
            };

            const config = fieldConfigs[field];

            if (!config) {
                console.warn(`No configuration found for field: ${field}`);
                return;
            }

            const label = document.createElement('label');
            label.setAttribute('for', `attr-${field}`);
            label.textContent = `${config.label}:`;
            fieldDiv.appendChild(label);

            if (config.type === 'select') {
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.className = 'form-control';
                select.innerHTML = `
                    <option value="">Selecciona ${config.label}</option>
                    ${config.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                `;
                fieldDiv.appendChild(select);
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.id = `attr-${field}`;
                input.name = field;
                input.className = 'form-control';
                input.placeholder = config.placeholder || '';
                fieldDiv.appendChild(input);
            }

            servicesFields.appendChild(fieldDiv);
        });
    }

function showBusinessFields() {
    const fields = businessSubcategories[selectedSubcategory];
    if (!fields) {
        console.log('No fields found for subcategory:', selectedSubcategory);
        return;
    }

    const businessDetails = document.getElementById('business-details');
    const businessFields = document.getElementById('business-fields');
    
    if (!businessDetails || !businessFields) {
        console.error('Contenedor de negocios no encontrado');
        return;
    }

    businessDetails.style.display = 'block';
    
    // ✅ TÍTULO DINÁMICO según subcategoría
    businessFields.innerHTML = `<h4>Detalles de ${selectedSubcategory}</h4>`;

    // ✅ CONFIGURACIÓN DINÁMICA de campos
    const fieldConfigs = {
        tipo_equipo: selectedSubcategory === 'Equipos para Negocios' ? {
            label: 'Tipo de Equipo',
            type: 'select',
            options: ['Computadoras', 'Impresoras', 'Fotocopiadoras', 'Teléfonos/Centrales', 'Muebles de Oficina', 'Cajas Registradoras/POS', 'Equipos de Seguridad', 'Aire Acondicionado', 'Máquina de Café', 'Otros']
        } : selectedSubcategory === 'Maquinaria para Negocios' ? {
            label: 'Tipo de Maquinaria',
            type: 'select',
            options: ['Maquinaria Industrial', 'Equipos de Construcción', 'Equipos de Restaurante', 'Equipos de Panadería', 'Equipos de Lavandería', 'Equipos Agrícolas', 'Equipos de Limpieza Industrial', 'Generadores', 'Compresores', 'Otros']
        } : null,
        
        tipo_negocio: {
            label: 'Tipo de Negocio',
            type: 'select',
            options: ['Restaurante', 'Cafetería', 'Tienda de Ropa', 'Supermercado/Minisuper', 'Farmacia', 'Ferretería', 'Oficina/Consultorio', 'Taller/Mecánica', 'Salón de Belleza', 'Gimnasio', 'Industrial', 'Otros']
        },
        
        marca: { 
            label: 'Marca', 
            type: 'text',
            placeholder: 'Ej: HP, Dell, Samsung'
        },
        
        modelo: { 
            label: 'Modelo', 
            type: 'text',
            placeholder: 'Ej: Modelo del equipo'
        },
        
        anio: { 
            label: 'Año', 
            type: 'number',
            placeholder: 'Ej: 2020'
        },
        
        años_operacion: {
            label: 'Años de Operación',
            type: 'select',
            options: ['Menos de 1 año', '1-3 años', '3-5 años', 'Más de 5 años', 'Más de 10 años']
        },
        
        incluye: { 
            label: 'Qué Incluye', 
            type: 'text', 
            placeholder: 'Ej: Local propio, inventario, equipos, clientela'
        },
        
        razon_venta: {
            label: 'Razón de Venta',
            type: 'select',
            options: ['Cambio de rubro', 'Viaje al extranjero', 'Jubilación', 'Falta de tiempo', 'Problemas de salud', 'Otros']
        },
        
        condicion: {
            label: 'Condición',
            type: 'select',
            options: ['Nuevo', 'Usado - Excelente', 'Usado - Bueno', 'Usado - Regular', 'Reacondicionado', 'Para Repuestos']
        }
    };

    // ✅ GENERAR CAMPOS solo si existen en fields Y en fieldConfigs
    fields.forEach(field => {
        const config = fieldConfigs[field];
        
        // ✅ Si el config es null (como tipo_equipo en "Negocio en Venta"), saltar
        if (!config) {
            console.log(`Campo "${field}" no tiene configuración para ${selectedSubcategory}, omitiendo`);
            return;
        }

        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'form-group';

        if (config.type === 'select') {
            fieldDiv.innerHTML = `
                <label for="attr-${field}">${config.label}:</label>
                <select id="attr-${field}" name="${field}" class="form-control">
                    <option value="">Selecciona ${config.label}</option>
                    ${config.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>
            `;
        } else if (config.type === 'number') {
            fieldDiv.innerHTML = `
                <label for="attr-${field}">${config.label}:</label>
                <input type="number" id="attr-${field}" name="${field}" class="form-control" placeholder="${config.placeholder || ''}" min="1900" max="2030">
            `;
        } else {
            fieldDiv.innerHTML = `
                <label for="attr-${field}">${config.label}:</label>
                <input type="text" id="attr-${field}" name="${field}" class="form-control" placeholder="${config.placeholder || ''}">
            `;
        }

        businessFields.appendChild(fieldDiv);
    });
}

    function showCommunityFields() {
        const fields = communitySubcategories[selectedSubcategory];
        if (!fields) {
            console.log('No fields found for subcategory:', selectedSubcategory);
            return;
        }

        console.log('Showing fields for subcategory:', selectedSubcategory, fields);

        communityDetails.style.display = 'block';
        communityFields.innerHTML = '';

        const titleDiv = document.createElement('div');
        titleDiv.innerHTML = `<h4 style="color: #007bff; margin-bottom: 20px; text-align: center;">Especificaciones para ${selectedSubcategory}</h4>`;
        communityFields.appendChild(titleDiv);

        fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-group';

            let labelText = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            let inputType = 'text';
            let placeholder = '';

            if (field === 'tipo_clase') {
                labelText = 'Tipo de Clase';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="Idioma">Idioma</option>
                    <option value="Música">Música</option>
                    <option value="Deporte">Deporte</option>
                    <option value="Arte">Arte</option>
                    <option value="Otro">Otro</option>
                `;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(select);
            } else if (field === 'tipo_evento') {
                labelText = 'Tipo de Evento';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="Concierto">Concierto</option>
                    <option value="Fiesta">Fiesta</option>
                    <option value="Conferencia">Conferencia</option>
                    <option value="Otro">Otro</option>
                `;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(select);
            } else if (field === 'tipo_anuncio') {
                labelText = 'Tipo de Anuncio';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="Oferta">Oferta</option>
                    <option value="Búsqueda">Búsqueda</option>
                    <option value="Anuncio General">Anuncio General</option>
                `;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(select);
            } else if (field === 'modalidad') {
                labelText = 'Modalidad';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Híbrido">Híbrido</option>
                `;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(select);
            } else if (field === 'nivel') {
                labelText = 'Nivel';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                `;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(select);
            } else if (field === 'fecha_evento') {
                inputType = 'date';
                labelText = 'Fecha del Evento';
            } else {
                placeholder = `Ej: ${labelText}`;
            }

            if (field !== 'tipo_clase' && field !== 'tipo_evento' && field !== 'tipo_anuncio' && field !== 'modalidad' && field !== 'nivel') {
                const input = document.createElement('input');
                input.type = inputType;
                input.id = `attr-${field}`;
                input.name = field;
                input.placeholder = placeholder;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(input);
            }

            communityFields.appendChild(fieldDiv);
        });
    }

    function loadContactInfo() {
        if (userInfo) {
            contactName.value = userInfo.user_metadata?.full_name || userInfo.email.split('@')[0];
            contactEmail.removeAttribute('readonly');
            contactEmail.disabled = false;
            contactEmail.value = userInfo.email;
        }
    }

    // --- FUNCIÓN PARA OBTENER INFO DE USUARIO ---
    async function getUserInfo() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user && !error) {
            userInfo = user;
        } else {
            console.error('Error obteniendo usuario:', error);
        }
    }

    // --- FUNCIÓN DE NAVEGACIÓN (ROBUSTA) ---
    const navigateToStep = (stepNumber) => {
        // Ocultar todos los pasos
        document.querySelectorAll('.form-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Mostrar el paso específico
        document.getElementById(`step-${stepNumber}`).style.display = 'block';
        
        // SI es paso 4, actualizar restricciones del plan
        if (stepNumber === 4) {
            const selectedPlan = document.querySelector('input[name="plan"]:checked')?.value;
            if (selectedPlan) {
                updatePlanRestrictions(selectedPlan);
            }

            const titleInput = document.getElementById('title');
            const mainCategoryText = categorySelect.options[categorySelect.selectedIndex].text; // Usamos la categoría principal
            const subcategoryValue = subcategorySelect.value;
            
            let placeholder = "Ej: Descripción breve y atractiva de tu artículo"; // Nuevo placeholder por defecto

            // Mapeo de categorías principales a placeholders
            const placeholderMap = {
                'Vehículos': `Ej: Vendo ${subcategoryValue || 'Vehículo'}, Como Nuevo`,
                'Inmuebles': `Ej: Se Vende ${subcategoryValue || 'Propiedad'} en [Ubicación]`,
                'Empleos y Servicios': `Ej: Ofrezco Servicios de ${subcategoryValue || 'Profesional'}`,
                'Servicios': `Ej: ${subcategoryValue || 'Servicio'} a Domicilio`,
                'Comunidad': `Ej: ${subcategoryValue || 'Anuncio de Comunidad'}`,
                'Mascotas': `Ej: Adopción Responsable de ${subcategoryValue || 'Mascota'}`,
                'Electrónica': `Ej: ${subcategoryValue || 'Artículo Electrónico'} en Buen Estado`,
                'Hogar y Muebles': `Ej: Vendo ${subcategoryValue || 'Mueble'} para Sala`,
                'Moda y Belleza': `Ej: Vendo ${subcategoryValue || 'Artículo de Moda'}, Talla M`,
                'Deportes y Hobbies': `Ej: Vendo ${subcategoryValue || 'Artículo Deportivo'}, Poco Uso`,
                'Negocios': `Ej: Oportunidad de Inversión en ${subcategoryValue || 'Negocio'}`
            };

            // Asignar el placeholder correspondiente a la categoría principal
            if (placeholderMap[mainCategoryText]) {
                placeholder = placeholderMap[mainCategoryText];
            }
            
            titleInput.placeholder = placeholder;
            
            // Mantener la lógica de mostrar/ocultar los campos de atributos
            showDynamicFields();
            loadContactInfo();
        }
        // --- FIN DEL BLOQUE DE NAVEGACIÓN ---

        progressSteps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            const currentStepNumber = parseInt(step.dataset.step, 10);
            if (currentStepNumber < stepNumber) {
                step.classList.add('completed');
            } else if (currentStepNumber === stepNumber) {
                step.classList.add('active');
            }
        });
    };
    
    // --- LÓGICA DE CATEGORÍAS ---
    async function loadAllCategories() {
        console.log('Fetching all categories from Supabase...');
        const { data, error } = await supabase.from('categorias').select('id, nombre, parent_id').order('nombre');
        if (error) {
            console.error("SUPABASE FETCH FAILED:", error);
            return;
        }
        console.log('Data received from Supabase:', data);

        allCategories = data;
        const mainCategories = allCategories.filter(c => c.parent_id === null);

        categorySelect.innerHTML = '<option value="" disabled selected>Selecciona una categoría principal</option>';
        mainCategories.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.nombre;
            categorySelect.appendChild(option);
        });
    }

    categorySelect.addEventListener('change', function() {
        const selectedParentId = parseInt(this.value, 10);
        selectedMainCategory = allCategories.find(c => c.id === selectedParentId)?.nombre || '';
        console.log('Category changed. Selected Main Category:', selectedMainCategory, 'ID:', selectedParentId);
        const subcategories = allCategories.filter(c => c.parent_id === selectedParentId);

        if (selectedMainCategory.toLowerCase().includes('electrónica')) {
            console.log('Fetching subcategories for Electronics...');
            console.log('Subcategories data:', subcategories);
        }

        if (subcategories.length > 0) {
            subcategorySelect.innerHTML = '<option value="" disabled selected>Selecciona una subcategoría</option>';
            subcategories.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub.nombre;
                option.textContent = sub.nombre;
                subcategorySelect.appendChild(option);
            });
            subcategoryGroup.style.display = 'block';
            console.log('Subcategories loaded:', subcategories.map(s => s.nombre));
        } else {
            // Si una categoría principal no tiene hijos, la tratamos como la selección final
            subcategoryGroup.style.display = 'none';
            subcategorySelect.innerHTML = '';
            console.log('No subcategories for this main category.');
        }

        // Mostrar campos dinámicos inmediatamente al cambiar categoría
        console.log('Calling showDynamicFields from category change.');
        showDynamicFields();
    });

    subcategorySelect.addEventListener('change', function() {
        selectedSubcategory = this.value;
        console.log('Subcategory changed to:', selectedSubcategory);
        console.log('Main category is:', selectedMainCategory);
        if (selectedMainCategory.toLowerCase().includes('electrónica')) {
            console.log('Main category is Electrónica. Calling showElectronicsFields.');
            showElectronicsFields();
        } else if (selectedMainCategory.toLowerCase().includes('hogar') || selectedMainCategory.toLowerCase().includes('mueble')) {
            console.log('Main category is Hogar y Muebles. Calling showHomeFurnitureFields.');
            showHomeFurnitureFields();
        } else if (selectedMainCategory.toLowerCase().includes('moda') || selectedMainCategory.toLowerCase().includes('belleza') || selectedMainCategory.toLowerCase().includes('ropa')) {
            console.log('Main category is Moda y Belleza. Calling showFashionFields.');
            showFashionFields();
        } else if (selectedMainCategory.toLowerCase().includes('deportes') || selectedMainCategory.toLowerCase().includes('hobbies')) {
            console.log('Main category is Deportes y Hobbies. Calling showSportsFields.');
            showSportsFields();
        } else if (selectedMainCategory.toLowerCase().includes('mascota')) {
            console.log('Main category is Mascotas. Calling showPetsFields.');
            showPetsFields();
        } else if (selectedMainCategory.toLowerCase().includes('servicio')) {
            console.log('Main category is Servicios. Calling showServicesFields.');
            showServicesFields();
        } else if (selectedMainCategory.toLowerCase().includes('negocio')) {
            console.log('Main category is Negocios. Calling showBusinessFields.');
            showBusinessFields();
        } else if (selectedMainCategory.toLowerCase().includes('comunidad')) {
            console.log('Main category is Comunidad. Calling showCommunityFields.');
            showCommunityFields();
        } else {
            console.log('Main category does not have dynamic fields.');
        }
    });

    // REMOVER EVENT LISTENER DUPLICADO si existe
    // Verificar que no haya otro addEventListener llamando a showElectronicsFields

    // --- EVENT LISTENERS PARA SUBIDA DE IMÁGENES ---
    coverImageInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            coverImageName.textContent = file.name;
        } else {
            coverImageName.textContent = 'Ningún archivo seleccionado.';
        }
    });

    // =======================================================
    // === BLOQUE DE GESTOR DE IMÁGENES (VERSIÓN FINAL) ===
    // =======================================================

    let galleryFiles = [];
    // const MAX_FILES = 10; // Ahora se define por el plan

    // 1. FUNCIÓN DE RENDERIZADO (CORREGIDA)
    const renderPreviews = () => {
        galleryPreviewContainer.innerHTML = '';
        galleryFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const wrapper = document.createElement('div');
                // La clase que SÍ está en nuestro CSS
                wrapper.className = 'gallery-preview-item image-preview'; // Usar la clase del CSS

                wrapper.innerHTML = `
                    <img src="${e.target.result}" class="gallery-img">
                    <button type="button" class="delete-image-btn" data-index="${index}"><i class="fas fa-times-circle"></i></button>
                `;
                galleryPreviewContainer.appendChild(wrapper);
            };
            reader.readAsDataURL(file);
        });
    };

    // 2. FUNCIÓN PARA AÑADIR ARCHIVOS (AHORA VÁLIDA EL LOTE Y CADA ARCHIVO)
    const addFiles = (newFiles) => {
        // 1. OBTENER PLAN SELECCIONADO Y LÍMITES
        const selectedPlan = document.querySelector('input[name="plan"]:checked')?.value || 'free';

        const limits = {
            'free': 3,
            'basico': 5,
            'premium': 10,
            'destacado': 15,
            'top': 20
        };
        const maxAllowed = limits[selectedPlan];

        const filesArray = Array.from(newFiles);
        const currentImagesCount = galleryFiles.length; // Usar el array REAL
        const totalImagesAfterAdd = currentImagesCount + filesArray.length;

        // 2. VALIDACIÓN DEL LOTE COMPLETO
        if (totalImagesAfterAdd > maxAllowed) {
            // Calcular cuántas fotos se pueden añadir realmente
            const availableSlots = maxAllowed - currentImagesCount;

            alert(`⚠️ LÍMITE EXCEDIDO\n\nPlan ${selectedPlan.toUpperCase()}: máximo ${maxAllowed} fotos\nYa tienes: ${currentImagesCount}\nIntentas agregar: ${filesArray.length}\n\nSolo se añadirán las primeras ${availableSlots} fotos, si hay espacio.`);

            // Si no hay slots disponibles, simplemente salir
            if (availableSlots <= 0) return;

            // Si hay slots, truncar la matriz de archivos a añadir
            const filesToProcess = filesArray.slice(0, availableSlots);

            // Procesar solo los archivos que caben
            filesToProcess.forEach(file => {
                galleryFiles.push(file);
            });

        } else {
            // Si el lote completo cabe, añadir todos
            filesArray.forEach(file => {
                galleryFiles.push(file);
            });
        }

        renderPreviews();
    };

    // 3. EVENT LISTENERS (CORREGIDOS Y COMPLETOS)
    if (galleryDropArea && galleryImagesInput && galleryPreviewContainer) {

        // Abrir selector de archivos al hacer clic
        galleryDropArea.addEventListener('click', () => galleryImagesInput.click());

        galleryImagesInput.addEventListener('change', function(e) {
            addFiles(e.target.files);
            e.target.value = null; // Resetear para poder seleccionar el mismo archivo de nuevo
        });

        galleryPreviewContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-image-btn') || e.target.closest('.delete-image-btn')) {
                const btn = e.target.closest('.delete-image-btn');
                const index = parseInt(btn.dataset.index, 10);
                galleryFiles.splice(index, 1); // Eliminar del array
                renderPreviews(); // Volver a renderizar
            }
        });

        // Drag and drop functionality
        galleryDropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            galleryDropArea.classList.add('drag-over');
        });

        galleryDropArea.addEventListener('dragleave', () => {
            galleryDropArea.classList.remove('drag-over');
        });

        galleryDropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            galleryDropArea.classList.remove('drag-over');
            addFiles(e.dataTransfer.files);
        });
    }

    // VALIDACIÓN ESTRICTA DE IMÁGENES POR PLAN
    const imageInput = document.getElementById('gallery-images-input'); // Changed from 'images' to 'gallery-images-input'
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            // Obtener plan seleccionado
            const selectedPlan = document.querySelector('input[name="plan"]:checked')?.value || 'free';
            
            // Límites por plan
            const limits = {
                'free': 3,
                'basico': 5,
                'premium': 10,
                'destacado': 15,
                'top': 20
            };
            
            const maxAllowed = limits[selectedPlan];
            const filesSelected = this.files.length;
            
            // BLOQUEO INMEDIATO si excede
            if (filesSelected > maxAllowed) {
                alert(`❌ LÍMITE EXCEDIDO\n\nPlan ${selectedPlan.toUpperCase()}: máximo ${maxAllowed} fotos\nSeleccionaste: ${filesSelected} fotos\n\nPor favor selecciona ${maxAllowed} o menos.`);
                
                // LIMPIAR INPUT Y PREVIEW
                this.value = '';
                
                // Limpiar previews existentes
                const previewContainer = document.getElementById('gallery-preview-container'); // Changed from '.image-preview-container'
                if (previewContainer) {
                    previewContainer.innerHTML = '';
                }
                
                return false;
            }
            
            // También verificar imágenes ya cargadas
            const existingPreviews = document.querySelectorAll('.gallery-preview-item').length; // Changed from '.image-preview'
            const totalImages = existingPreviews + filesSelected;
            
            if (totalImages > maxAllowed) {
                alert(`❌ Ya tienes ${existingPreviews} fotos.\nSolo puedes agregar ${maxAllowed - existingPreviews} más.`);
                this.value = '';
                return false;
            }
            
            // Si pasa validación, mostrar preview
            console.log(`✅ ${filesSelected} fotos válidas para plan ${selectedPlan}`);
            // Aquí llamar función de preview
        });
    }

    // TAMBIÉN actualizar límite cuando cambia el plan
    function updateImageLimit() {
        const selectedPlan = document.querySelector('input[name="plan"]:checked')?.value || 'free';
        const limits = {'free': 3, 'basico': 5, 'premium': 10, 'destacado': 15, 'top': 20};
        const maxFiles = limits[selectedPlan];
        
        const imageInput = document.getElementById('gallery-images-input'); // Changed from 'images'
        if (imageInput) {
            imageInput.setAttribute('max', maxFiles);
            
            // Mostrar límite visualmente
            let limitText = document.querySelector('.image-limit-info');
            if (!limitText) {
                limitText = document.createElement('p');
                limitText.className = 'image-limit-info';
                imageInput.parentElement.appendChild(limitText);
            }
            limitText.innerHTML = `📸 Límite: ${maxFiles} fotos (Plan ${selectedPlan})`;
        }
    }

    // Llamar cuando cambie el plan
    document.querySelectorAll('input[name="plan"]').forEach(radio => {
        radio.addEventListener('change', updateImageLimit);
    });

    provinceSelect.addEventListener('change', function() {
        const selectedProvince = this.value;
        const districts = districtsByProvince[selectedProvince];

        if (districts && districts.length > 0) {
            districtSelect.innerHTML = '<option value="" disabled selected>Selecciona un distrito</option>';
            districts.forEach(district => {
                const option = document.createElement('option');
                option.value = district;
                option.textContent = district;
                districtSelect.appendChild(option);
            });
            districtGroup.style.display = 'block';
        } else {
            districtGroup.style.display = 'none';
            districtSelect.innerHTML = '';
        }
    });

    // --- EVENT LISTENERS PARA BOTONES DE NAVEGACIÓN ---
    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentStep = btn.closest('.form-section');
            const currentStepNumber = parseInt(currentStep.id.split('-')[1], 10);
            
            // Validación del Paso 1
            if (currentStepNumber === 1) {
                if (categorySelect.value && (subcategorySelect.value || subcategoryGroup.style.display === 'none')) {
                    navigateToStep(currentStepNumber + 1);
                } else {
                    alert('Por favor, selecciona una categoría y subcategoría.');
                }
            } else if (currentStepNumber === 2) {
                // Validación del Paso 2
                if (provinceSelect.value && districtSelect.value) {
                    navigateToStep(currentStepNumber + 1);
                } else {
                    alert('Por favor, selecciona una provincia y un distrito.');
                }
            } else {
                 // Aquí añadiremos validación para futuros pasos
                 const nextStepNumber = parseInt(btn.dataset.target || (currentStepNumber + 1), 10);
                 navigateToStep(nextStepNumber);
            }
        });
    });

    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetStep = btn.dataset.target;
            navigateToStep(targetStep);
        });
    });



form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const publishButton = document.getElementById('publish-ad-btn');
    publishButton.disabled = true;
    publishButton.textContent = 'Publicando...';

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('Debes iniciar sesión para poder publicar.');
        publishButton.disabled = false;
        publishButton.textContent = 'Publicar Anuncio';
        return;
    }

    // --- VALIDACIÓN FINAL ANTES DE ENVIAR ---
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const price = document.getElementById('price').value.trim();
    const category = categorySelect.value;
    const subcategory = subcategorySelect.value;
    const province = provinceSelect.value;
    const district = districtSelect.value;
    const coverImageFile = coverImageInput.files[0];

    if (!title || !description || !price || !category || !subcategory || !province || !district || !coverImageFile) {
        alert('Por favor, completa todos los campos obligatorios (Título, Descripción, Precio, Categoría, Ubicación e Imagen de Portada).');
        publishButton.disabled = false;
        publishButton.textContent = 'Publicar Anuncio';
        return;
    }

    try {
        if (!coverImageFile) throw new Error("La imagen de portada es obligatoria.");

            const coverFileName = `${user.id}/cover-${Date.now()}-${coverImageFile.name}`;
            let { error: coverUploadError } = await supabase.storage.from('imagenes_anuncios').upload(coverFileName, coverImageFile);
            if (coverUploadError) throw coverUploadError;
            
            const { data: { publicUrl: coverPublicUrl } } = supabase.storage.from('imagenes_anuncios').getPublicUrl(coverFileName);

            const formData = new FormData(form);
            const adData = {
                titulo: document.getElementById('titulo').value,
                descripcion: formData.get('descripcion'),
                precio: parseFloat(formData.get('precio')),
                categoria: formData.get('categoria'),
                provincia: formData.get('provincia'),
                distrito: formData.get('distrito'),
                user_id: user.id,
                url_portada: coverPublicUrl,
                fecha_publicacion: new Date().toISOString()
            };

            // --- ATRIBUTOS UNIFICADOS (TODAS las categorías van a JSONB) ---
            adData.atributos_clave = buildUnifiedAttributesJSON(formData, selectedMainCategory, selectedSubcategory);

            // ==================================================================
            // === INICIO: LÓGICA PARA PLANES Y MEJORAS ===
            // ==================================================================

            // 1. Obtener el plan seleccionado
            const selectedPlanInput = document.querySelector('input[name="plan"]:checked');
            const selectedPlan = selectedPlanInput ? selectedPlanInput.value : 'gratis';

            // 2. Calcular la fecha de expiración del plan
            const VIGENCIA_GRATIS_DIAS = 30;
            const VIGENCIA_BASICO_DIAS = 30;
            const VIGENCIA_PREMIUM_DIAS = 30;
            const VIGENCIA_DESTACADO_DIAS = 30;
            const VIGENCIA_TOP_DIAS = 30;

            let diasDeVigencia = 30; // Todos los planes 30 días

            // ELIMINAR o COMENTAR cualquier lógica que cambie los días según el plan
            // if (selectedPlan === 'basico') {
            //     diasDeVigencia = VIGENCIA_BASICO_DIAS;
            // } else if (selectedPlan === 'premium') {
            //     diasDeVigencia = VIGENCIA_PREMIUM_DIAS;
            // } else if (selectedPlan === 'destacado') {
            //     diasDeVigencia = VIGENCIA_DESTACADO_DIAS;
            // } else if (selectedPlan === 'top') {
            //     diasDeVigencia = VIGENCIA_TOP_DIAS;
            // }

            const fechaExpiracion = new Date();
            fechaExpiracion.setDate(fechaExpiracion.getDate() + diasDeVigencia);

            // 3. Los "enhancements" (add-ons opcionales) han sido eliminados.

            // 4. Añadir los datos del plan al objeto principal del anuncio
            adData.featured_plan = selectedPlan;
            adData.featured_until = fechaExpiracion.toISOString();
            adData.plan_priority = PLAN_LIMITS[selectedPlan].priority; // AGREGAR
            adData.max_images = PLAN_LIMITS[selectedPlan].maxFotos; // AGREGAR
            // adData.enhancements = enhancements; // Eliminado: ya no hay enhancements

            // ==================================================================
            // === FIN: LÓGICA PARA PLANES Y MEJORAS ===
            // ==================================================================
        
            const { data: newAd, error: adInsertError } = await supabase
                .from('anuncios')
                .insert(adData)
                .select()
            .single();

            if (adInsertError) throw adInsertError;

            if (galleryFiles.length > 0) {
                for (const file of galleryFiles) {
                    const galleryFileName = `${user.id}/${Date.now()}-${file.name}`;
                    const { error: galleryUploadError } = await supabase.storage.from('imagenes_anuncios').upload(galleryFileName, file);
                    if (galleryUploadError) throw galleryUploadError;

                    const { data: { publicUrl: galleryPublicUrl } } = supabase.storage.from('imagenes_anuncios').getPublicUrl(galleryFileName);

                    await supabase.from('imagenes').insert({
                        anuncio_id: newAd.id,
                        url_imagen: galleryPublicUrl,
                        user_id: user.id
                    });
                }
            }
            
            alert('¡Anuncio publicado con éxito!');
            window.location.href = 'dashboard.html';

        } catch (error) {
            console.error('Error al publicar el anuncio:', error);
            alert(`Error: ${error.message}`);
            publishButton.disabled = false;
            publishButton.textContent = 'Publicar Anuncio';
        }
});

    // --- FUNCIÓN PARA CONSTRUIR JSON DE ELECTRÓNICA ---
    function buildElectronicsJSON(formData) {
        console.log('🔵 === BUILD ELECTRONICS JSON INICIADO ===');

        const json = {
            subcategoria: selectedSubcategory
        };

        const fields = electronicsSubcategories[selectedSubcategory];
        console.log('🔵 Subcategoría:', selectedSubcategory);
        console.log('🔵 Campos esperados:', fields);

        // Mostrar TODOS los datos del FormData
        console.log('🔵 FormData completo:');
        for (let pair of formData.entries()) {
            console.log(`   ${pair[0]}: "${pair[1]}"`);
        }

        if (fields) {
            console.log('🔵 Procesando campos:');
            fields.forEach(field => {
                const value = formData.get(field);
                console.log(`   → "${field}" = "${value}" (${value ? 'OK' : 'VACÍO'})`);
                if (value) {
                    json[field] = value;
                }
            });
        }

        console.log('🔵 JSON FINAL:', JSON.stringify(json, null, 2));
        console.log('🔵 === BUILD ELECTRONICS JSON TERMINADO ===');
        return json;
    }

    // --- FUNCIÓN PARA CONSTRUIR JSON DE HOGAR Y MUEBLES ---
    function buildHomeFurnitureJSON(formData) {
        const json = {
            subcategoria: selectedSubcategory
        };

        const fields = homeFurnitureSubcategories[selectedSubcategory];
        if (fields) {
            fields.forEach(field => {
                const value = formData.get(field);
                if (value) {
                    json[field] = value;
                }
            });
        }

        return json;
    }

    // ✅ FUNCIÓN UNIFICADA PARA TODAS LAS CATEGORÍAS
    function buildUnifiedAttributesJSON(formData, mainCategory, subcategory) {
        // ✅ LOGS AL INICIO (AGREGAR ESTAS 5 LÍNEAS)
        console.log('🔵 === INICIO buildUnifiedAttributesJSON ===');
        console.log('🔵 mainCategory:', mainCategory);
        console.log('🔵 mainCategory.toLowerCase():', mainCategory.toLowerCase());
        console.log('🔵 subcategory:', subcategory);
        console.log('🔵 ¿Incluye "inmueble"?', mainCategory.toLowerCase().includes('inmueble'));
        
        const json = {};
        
        // Agregar subcategoría si existe
        if (subcategory) {
            json.subcategoria = subcategory;
        }
        
        // --- VEHÍCULOS ---
        if (mainCategory.toLowerCase().includes('vehículo') || 
            mainCategory.toLowerCase().includes('auto') || 
            mainCategory.toLowerCase().includes('carro')) {
            
            const vehicleFields = ['marca', 'anio', 'kilometraje', 'transmision', 'combustible'];
            vehicleFields.forEach(field => {
                const value = formData.get(field);
                if (value) {
                    json[field] = (field === 'anio' || field === 'kilometraje') 
                        ? parseInt(value) 
                        : value;
                }
            });
        }
        
        // --- INMUEBLES ---
        if (mainCategory.toLowerCase().includes('inmueble') || 
            mainCategory.toLowerCase().includes('casa') || 
            mainCategory.toLowerCase().includes('apartamento')) {
            
            // ✅ LOGS DENTRO DEL IF (AGREGAR ESTAS LÍNEAS)
            console.log('🟢 ENTRÓ AL BLOQUE DE INMUEBLES');
            
            const realEstateFields = ['m2', 'habitaciones', 'baños'];
            realEstateFields.forEach(field => {
                const value = formData.get(field);
                console.log(`🟢 Campo "${field}":`, value);
                if (value) {
                    json[field] = parseInt(value);
                }
            });
        }
        
        // --- ELECTRÓNICA ---
        if (mainCategory.toLowerCase().includes('electrónica')) {
            const fields = electronicsSubcategories[subcategory];
            if (fields) {
                fields.forEach(field => {
                    const value = formData.get(field);
                    if (value) {
                        json[field] = value;
                    }
                });
            }
        }
        
        // --- HOGAR Y MUEBLES ---
        if (mainCategory.toLowerCase().includes('hogar') || 
            mainCategory.toLowerCase().includes('mueble')) {
            const fields = homeFurnitureSubcategories[subcategory];
            if (fields) {
                fields.forEach(field => {
                    const value = formData.get(field);
                    if (value) {
                        json[field] = value;
                    }
                });
            }
        }
        
        // --- MODA Y BELLEZA ---
        if (mainCategory.toLowerCase().includes('moda') || 
            mainCategory.toLowerCase().includes('belleza') || 
            mainCategory.toLowerCase().includes('ropa')) {
            const fields = fashionSubcategories[subcategory];
            if (fields) {
                fields.forEach(field => {
                    const value = formData.get(field);
                    if (value) {
                        json[field] = value;
                    }
                });
            }
        }
        
        console.log(' JSON FINAL:', json);
        // --- DEPORTES Y HOBBIES ---
        if (mainCategory.toLowerCase().includes('deporte') ||
            mainCategory.toLowerCase().includes('hobbies')) {
            const fields = sportsSubcategories[subcategory];
            if (fields) {
                fields.forEach(field => {
                    const value = formData.get(field);
                    if (value) {
                        json[field] = value;
                    }
                });
            }
        }

        // --- MASCOTAS ---
        if (mainCategory.toLowerCase().includes('mascota')) {
            const fields = petsSubcategories[subcategory];
            if (fields) {
                fields.forEach(field => {
                    const value = formData.get(field);
                    if (value) {
                        json[field] = value;
                    }
                });
            }
        }

        // --- SERVICIOS ---
        if (mainCategory.toLowerCase().includes('servicio')) {
            const fields = servicesSubcategories[subcategory];
            if (fields) {
                fields.forEach(field => {
                    const value = formData.get(field);
                    if (value) {
                        json[field] = value;
                    }
                });
            }
        }

        // --- NEGOCIOS ---
        if (mainCategory.toLowerCase().includes('negocio')) {
            const fields = businessSubcategories[subcategory];
            if (fields) {
                fields.forEach(field => {
                    const value = formData.get(field);
                    if (value) {
                        json[field] = (field === 'anio') ? parseInt(value) : value;
                    }
                });
            }
        }

        // --- COMUNIDAD ---
        if (mainCategory.toLowerCase().includes('comunidad')) {
            const fields = communitySubcategories[subcategory];
            if (fields) {
                fields.forEach(field => {
                    const value = formData.get(field);
                    if (value) {
                        json[field] = value;
                    }
                });
            }
        }

        console.log(' JSON FINAL:', json);
        return Object.keys(json).length > 0 ? json : null;
    }

    // --- INICIALIZACIÓN ---
    loadAllCategories();
    getUserInfo();

// --- INICIO: NAVEGACIÓN AUTOMÁTICA DE PLANES v2 (AGENTE 11) ---

console.log("Agente 11: Ejecutando script de navegación v2 (por clic en tarjeta).");

// 1. Definimos los límites de los planes (si no está ya definido globalmente).
const PLAN_LIMITS_V2 = {
    'free': { maxFotos: 3 },
    'basico': { maxFotos: 5 },
    'premium': { maxFotos: 10 },
    'destacado': { maxFotos: 15 },
    'top': { maxFotos: 20 }
};

// 2. Seleccionamos TODOS los contenedores de las tarjetas de plan.
const planCards = document.querySelectorAll('.plan-card');
console.log(`Agente 11: Se encontraron ${planCards.length} tarjetas de plan.`);

// 3. Añadimos un listener de 'click' a CADA tarjeta.
planCards.forEach(card => {
    card.addEventListener('click', function() {

        // 4. Encuentra el radio button DENTRO de esta tarjeta y márcalo.
        const radio = this.querySelector('input[type="radio"]');
        if (!radio) {
            console.error("Error: No se encontró un radio button dentro de la tarjeta clickeada.");
            return;
        }

        // Si ya estaba seleccionado, no hacemos nada para evitar múltiples ejecuciones.
        if (radio.checked) {
            // Opcional: Podríamos añadir un log para saber que no se hace nada.
            // console.log("Agente 11: El plan ya estaba seleccionado.");
            // return;
        }

        radio.checked = true;
        const selectedPlan = radio.value;
        console.log(`Agente 11: Clic detectado en tarjeta. Plan seleccionado: ${selectedPlan}.`);

        // --- Lógica de navegación ---
        setTimeout(() => {
            const step3 = document.getElementById('step-3');
            const step4 = document.getElementById('step-4');

            if (step3 && step4) {
                console.log("Agente 11: Navegando a step-4.");
                navigateToStep(4); // Call the robust navigation function
            } else {
                console.error("Error: No se encontraron #step-3 o #step-4.");
            }
        }, 300); // Reducimos un poco el tiempo para una sensación más rápida.

        // --- Lógica para actualizar los límites de fotos ---
        const limits = PLAN_LIMITS_V2[selectedPlan];
        if (!limits) {
            console.error(`Error: No se encontraron límites para el plan "${selectedPlan}".`);
            return;
        }

        const maxFiles = limits.maxFotos;
        const fileInput = document.getElementById('gallery-images-input');

        if (fileInput) {
            fileInput.setAttribute('data-max-files', maxFiles);

            const helpTextContainer = fileInput.closest('.drop-area') || fileInput.parentElement;
            let existingHelpText = helpTextContainer.querySelector('.help-text');

            if (existingHelpText) {
                existingHelpText.remove();
            }

            const helpText = document.createElement('p');
            helpText.className = 'help-text';
            helpText.style.marginTop = '10px';
            helpText.innerHTML = `📸 Tu plan <strong>${selectedPlan.toUpperCase()}</strong> permite hasta <strong>${maxFiles}</strong> fotos.`;
            helpTextContainer.appendChild(helpText);
        }
    });
});

/* === FUNCIÓN CORREGIDA Y FINAL PARA GESTIONAR LA RESTRICCIÓN VISUAL === */

const updatePlanRestrictions = (selectedPlan) => {
    console.log('🔍 DEBUG: updatePlanRestrictions called with plan:', selectedPlan);

    // ESTANDARIZAR EL VALOR DEL PLAN A MINÚSCULAS para que coincida con 'destacado' y 'top'
    const planValue = selectedPlan.toLowerCase();
    console.log('🔍 DEBUG: planValue (lowercase):', planValue);

    // 1. RESTRICCIÓN PARA CAMPOS TOP (Video y Redes Sociales)
    const topFields = document.querySelectorAll('.plan-top-feature');
    console.log('🔍 DEBUG: Found topFields:', topFields.length);

    const disableTop = planValue !== 'top'; // Solo se habilita si es el plan 'top'
    console.log('🔍 DEBUG: disableTop (true if not top):', disableTop);

    topFields.forEach(div => {
        div.style.opacity = disableTop ? '0.4' : '1';
        div.style.pointerEvents = disableTop ? 'none' : 'auto';

        const input = div.querySelector('input, select, textarea');
        if (input) input.disabled = disableTop;
    });

    // 2. RESTRICCIÓN PARA EL BADGE DESTACADO
    const destacadoFields = document.querySelectorAll('.plan-destacado-feature');
    console.log('🔍 DEBUG: Found destacadoFields:', destacadoFields.length);

    // Habilitado si el plan es 'destacado' O 'top'
    const enableDestacado = (planValue === 'destacado' || planValue === 'top');
    const disableDestacado = !enableDestacado;
    console.log('🔍 DEBUG: enableDestacado:', enableDestacado, 'disableDestacado:', disableDestacado);

    destacadoFields.forEach(div => {
        console.log('🔍 DEBUG: Processing destacadoField:', div);
        div.style.opacity = disableDestacado ? '0.4' : '1';
        div.style.pointerEvents = disableDestacado ? 'none' : 'auto';

        const input = div.querySelector('input, select, textarea');
        console.log('🔍 DEBUG: Input found:', input);
        if (input) {
            input.disabled = disableDestacado;
            console.log('🔍 DEBUG: Input disabled set to:', disableDestacado);

            // Si se deshabilita (plan inferior), desmarca el checkbox
            if (disableDestacado && input && input.type === 'checkbox') {
                console.log('🔍 DEBUG: Unchecking checkbox');
                input.checked = false;
            }
        }
    });
};


/* === PASO CLAVE: ENLAZAR LA FUNCIÓN A LOS EVENTOS === */

// 1. Enlazar al cambio de plan (para actualizar al seleccionar un radio diferente)
document.querySelectorAll('input[name="plan"]').forEach(radio => {
    radio.addEventListener('change', function() {
        console.log('Plan cambiado a:', this.value);
        updatePlanRestrictions(this.value);
        
        // Navegar automáticamente al paso 4
        setTimeout(() => {
            navigateToStep(4);
        }, 500);
    });
});


// 2. Enlazar a la carga inicial de la página (para el plan preseleccionado)
const initialPlan = document.querySelector('input[name="plan"]:checked')?.value || 'free';
updatePlanRestrictions(initialPlan);
}
