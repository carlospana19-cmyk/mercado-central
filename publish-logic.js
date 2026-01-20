// publish-logic.js - VERSIÓN FINAL CON SINCRONIZACIÓN COMPLETA

import { supabase } from './supabase-client.js';
import { districtsByProvince } from './config-locations.js';
import { DEFAULT_CATEGORIES } from './config-categories.js';

// ✅ Permitir acceso sin autenticación - verificar estado más adelante

// CONFIGURACIÓN DE PLANES
const PLAN_LIMITS = {
    'free': { maxFotos: 3, hasVideo: false, hasCarousel: false, priority: 0 },
    'basico': { maxFotos: 5, hasVideo: false, hasCarousel: false, priority: 1 },
    'premium': { maxFotos: 10, hasVideo: false, hasCarousel: true, priority: 2 },
    'destacado': { maxFotos: 15, hasVideo: true, hasCarousel: true, priority: 3 },
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
    const categorySelect = document.getElementById('categoria');
    const subcategoryGroup = document.getElementById('subcategory-group');
    const subcategorySelect = document.getElementById('subcategoria');
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

    // --- CONTADORES DE CARACTERES EN TIEMPO REAL ---
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');

    if (titleInput) {
        titleInput.addEventListener('input', () => {
            const count = titleInput.value.length;
            const charCountElement = titleInput.parentElement.querySelector('.char-count');
            if (charCountElement) {
                charCountElement.textContent = `(${count}/100)`;
            }
        });
    }

    if (descriptionInput) {
        descriptionInput.addEventListener('input', () => {
            const count = descriptionInput.value.length;
            const charCountElement = descriptionInput.parentElement.querySelector('.char-count');
            if (charCountElement) {
                charCountElement.textContent = `(${count}/1000)`;
            }
        });
    }

    // ✅ districtsByProvince importada desde config-locations.js

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
    // Limpia todas las secciones dinámicas antes de mostrar la nueva
    document.querySelectorAll('.attribute-section').forEach(section => {
        section.style.display = 'none';
        const inputs = section.querySelectorAll('input, select, textarea');
        inputs.forEach(el => el.value = '');
    });

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
        vehicleDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
    } else if (selectedMainCategory.toLowerCase().includes('inmueble') || selectedMainCategory.toLowerCase().includes('casa') || selectedMainCategory.toLowerCase().includes('apartamento')) {
        realestateDetails.style.display = 'block';
        realestateDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
    } else if (selectedMainCategory.toLowerCase().includes('electrónica')) {
        electronicsDetails.style.display = 'block';
        electronicsDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showElectronicsFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('hogar') || selectedMainCategory.toLowerCase().includes('mueble')) {
        homeFurnitureDetails.style.display = 'block';
        homeFurnitureDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showHomeFurnitureFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('moda') || selectedMainCategory.toLowerCase().includes('belleza') || selectedMainCategory.toLowerCase().includes('ropa')) {
        fashionDetails.style.display = 'block';
        fashionDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showFashionFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('deportes') || selectedMainCategory.toLowerCase().includes('hobbies')) {
        sportsDetails.style.display = 'block';
        sportsDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showSportsFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('mascota')) {
        petsDetails.style.display = 'block';
        petsDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showPetsFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('servicio')) {
        servicesDetails.style.display = 'block';
        servicesDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showServicesFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('negocio')) {
        businessDetails.style.display = 'block';
        businessDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showBusinessFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('comunidad')) {
        communityDetails.style.display = 'block';
        communityDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showCommunityFields();
        }
    }
}

// Función genérica para mostrar campos de cualquier categoría
function showCategoryFields(categoryKey, containerId, sectionId) {
    const container = document.getElementById(containerId);
    const mainSection = document.getElementById(sectionId);

    if (!container || !mainSection) {
        console.error('Contenedores HTML no encontrados');
        return;
    }

    // Forzar visibilidad
    mainSection.style.display = 'block';
    container.innerHTML = '';

    // Obtener configuración de campos para la subcategoría seleccionada
    const subcategoryConfig = categoryFieldConfigs[categoryKey]?.[selectedSubcategory];
    if (!subcategoryConfig) {
        console.log('No fields config found for subcategory:', selectedSubcategory, 'in category:', categoryKey);
        return;
    }

    // Añadir título
    const titleDiv = document.createElement('div');
    titleDiv.innerHTML = `<h4 style="color: var(--color-primario); margin-bottom: 20px; text-align: center;">Especificaciones para ${selectedSubcategory}</h4>`;
    container.appendChild(titleDiv);

    // Crear campos dinámicos
    Object.entries(subcategoryConfig).forEach(([fieldName, fieldConfig]) => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'form-group';
        fieldDiv.style.marginBottom = '15px';

        // Crear label
        const label = document.createElement('label');
        label.textContent = fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        label.setAttribute('for', `attr-${fieldName}`);
        fieldDiv.appendChild(label);

        // Crear input/select según el tipo
        let input;
        if (fieldConfig.type === 'select') {
            input = document.createElement('select');
            input.innerHTML = `<option value="">Selecciona</option>` +
                fieldConfig.options.map(option => `<option value="${option}">${option}</option>`).join('');
        } else {
            input = document.createElement('input');
            input.type = fieldConfig.type;
            input.placeholder = fieldConfig.placeholder || '';
        }

        input.id = `attr-${fieldName}`;
        input.name = fieldName;
        fieldDiv.appendChild(input);
        container.appendChild(fieldDiv);
    });
}

function showElectronicsFields() {
    showCategoryFields('electrónica', 'electronics-fields', 'electronics-details');
}
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
        showCategoryFields('hogar y muebles', 'home-furniture-fields', 'home-furniture-details');
    }
                
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
    showCategoryFields('moda y belleza', 'fashion-fields', 'fashion-details');
}

    function showSportsFields() {
        showCategoryFields('deportes y hobbies', 'sports-fields', 'sports-details');
    }

    function showPetsFields() {
        showCategoryFields('mascotas', 'pets-fields', 'pets-details');
    }

    function showServicesFields() {
        showCategoryFields('servicios', 'services-fields', 'services-details');
    }

    function showBusinessFields() {
        showCategoryFields('negocios', 'business-fields', 'business-details');
    }

    function showCommunityFields() {
        showCategoryFields('comunidad', 'community-fields', 'community-details');
    }
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
    businessFields.innerHTML = ''; // Limpia el contenedor antes de añadir nuevos campos
    
    // ✅ TÍTULO DINÁMICO según subcategoría
    

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

    // --- FUNCIÓN PARA MOSTRAR MODAL DE PLANES ---
    const showPlanSelectionModal = () => {
        console.log("🎯 Iniciando showPlanSelectionModal...");
        const modalHTML = `
            <div class="modal-overlay" id="planSelectionModal">
                <div class="modal-content plan-modal">
                    <div class="modal-header">
                        <h2>Selecciona tu Plan</h2>
                        <p class="modal-subtitle">Elige el plan que mejor se adapte a tus necesidades</p>
                    </div>
                    <div class="plans-container">
                        <div class="plan-option plan-free" data-plan="gratis">
                            <h3>Gratis</h3>
                            <p class="plan-price">$0</p>
                            <ul class="plan-features">
                                <li>✓ 2 fotos</li>
                                <li>✓ 1 anuncio activo</li>
                                <li>✓ 30 días de vigencia</li>
                                <li>✗ Sin galería de fotos</li>
                                <li>✗ Sin videos</li>
                            </ul>
                            <button class="btn-plan btn-plan-free" data-plan="gratis">
                                Crear Cuenta Gratis
                            </button>
                        </div>

                        <div class="plan-option plan-basico" data-plan="basico">
                            <div class="plan-badge">Popular</div>
                            <h3>Básico</h3>
                            <p class="plan-price">$5.99<span>/mes</span></p>
                            <ul class="plan-features">
                                <li>✓ 5 fotos</li>
                                <li>✓ 3 anuncios activos</li>
                                <li>✓ 60 días de vigencia</li>
                                <li>✓ Galería de fotos básica</li>
                                <li>✗ Sin videos</li>
                            </ul>
                            <button class="btn-plan btn-plan-paid" data-plan="basico">
                                Comprar Plan
                            </button>
                        </div>

                        <div class="plan-option plan-premium" data-plan="premium">
                            <h3>Premium</h3>
                            <p class="plan-price">$9.99<span>/mes</span></p>
                            <ul class="plan-features">
                                <li>✓ 10 fotos</li>
                                <li>✓ 5 anuncios activos</li>
                                <li>✓ 90 días de vigencia</li>
                                <li>✓ Galería completa</li>
                                <li>✓ Videos incluidos</li>
                            </ul>
                            <button class="btn-plan btn-plan-paid" data-plan="premium">
                                Comprar Plan
                            </button>
                        </div>

                        <div class="plan-option plan-destacado" data-plan="destacado">
                            <h3>Destacado</h3>
                            <p class="plan-price">$14.99<span>/mes</span></p>
                            <ul class="plan-features">
                                <li>✓ 15 fotos</li>
                                <li>✓ 10 anuncios activos</li>
                                <li>✓ 180 días de vigencia</li>
                                <li>✓ Galería + Carrusel</li>
                                <li>✓ Videos + Vivo</li>
                            </ul>
                            <button class="btn-plan btn-plan-paid" data-plan="destacado">
                                Comprar Plan
                            </button>
                        </div>

                        <div class="plan-option plan-top" data-plan="top">
                            <div class="plan-badge">Premium</div>
                            <h3>Top</h3>
                            <p class="plan-price">$19.99<span>/mes</span></p>
                            <ul class="plan-features">
                                <li>✓ 20 fotos</li>
                                <li>✓ 15 anuncios activos</li>
                                <li>✓ 365 días de vigencia</li>
                                <li>✓ Todas las características</li>
                                <li>✓ Soporte prioritario</li>
                            </ul>
                            <button class="btn-plan btn-plan-paid" data-plan="top">
                                Comprar Plan
                            </button>
                        </div>
                    </div>
                    <button class="btn-close-modal" id="closePlanModal">✕</button>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('planSelectionModal');
        console.log("✅ Modal agregado al DOM:", !!modal);
        
        // Cerrar modal
        document.getElementById('closePlanModal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Manejar selección de plan
        document.querySelectorAll('.btn-plan').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const selectedPlan = e.target.dataset.plan;
                const isPaidPlan = e.target.classList.contains('btn-plan-paid');

                // Guardar plan seleccionado en sessionStorage
                sessionStorage.setItem('selectedPlan', selectedPlan);

                if (isPaidPlan) {
                    // Redirigir a página de pago
                    window.location.href = `payment.html?plan=${selectedPlan}`;
                } else {
                    // Plan gratis: redirigir a registro
                    window.location.href = `registro.html?plan=gratis`;
                }
            });
        });

        // Mostrar modal con animación
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    };

    // --- FUNCIÓN PARA MOSTRAR MODAL DE LOGIN PARA PUBLICAR ---
    const showLoginModalForPublishing = () => {
        console.log("🔐 Mostrando modal de login para publicar...");
        const modalHTML = `
            <div class="modal-overlay" id="loginForPublishingModal">
                <div class="modal-content login-modal" style="max-width: 500px; padding: 40px;">
                    <button class="btn-close-modal" id="closeLoginModal" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">✕</button>
                    
                    <div class="modal-header" style="text-align: center; margin-bottom: 30px;">
                        <h2 style="font-size: 24px; margin: 0 0 10px 0; color: #333;">Inicia sesión para publicar</h2>
                        <p style="color: #999; margin: 0; font-size: 14px;">Elige tu método de inicio de sesión preferido</p>
                    </div>

                    <div class="login-options" style="display: flex; flex-direction: column; gap: 12px;">
                        <!-- Google Login -->
                        <button class="btn-login-social google-login" style="display: flex; align-items: center; justify-content: center; gap: 12px; padding: 14px 20px; border: 1px solid #dadce0; border-radius: 8px; background: white; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.3s; color: #333;">
                            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continuar con Google
                        </button>

                        <!-- Facebook Login -->
                        <button class="btn-login-social facebook-login" style="display: flex; align-items: center; justify-content: center; gap: 12px; padding: 14px 20px; border: none; border-radius: 8px; background: #1877F2; color: white; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.3s;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Continuar con Facebook
                        </button>

                        <!-- Email Login -->
                        <button class="btn-login-email" style="display: flex; align-items: center; justify-content: center; gap: 12px; padding: 14px 20px; border: 1px solid #dadce0; border-radius: 8px; background: white; color: #333; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.3s; margin-top: 8px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            Continuar con email
                        </button>
                    </div>

                    <div style="text-align: center; font-size: 12px; color: #999; margin-top: 20px; line-height: 1.6;">
                        Al continuar, aceptas nuestros <a href="#" style="color: #007bff; text-decoration: none;">Términos de servicio</a> y <a href="#" style="color: #007bff; text-decoration: none;">Política de privacidad</a>
                    </div>
                </div>
            </div>
        `;

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('loginForPublishingModal');
        console.log("✅ Modal de login agregado al DOM:", !!modal);
        
        // Cerrar modal
        document.getElementById('closeLoginModal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Manejar clics en opciones de login
        const googleBtn = modal.querySelector('.google-login');
        const facebookBtn = modal.querySelector('.facebook-login');
        const emailBtn = modal.querySelector('.btn-login-email');

        googleBtn.addEventListener('click', async () => {
            console.log("🔐 Login con Google iniciado...");
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/publicar.html'
                }
            });
            if (error) console.error("Error Google:", error);
        });

        facebookBtn.addEventListener('click', async () => {
            console.log("🔐 Login con Facebook iniciado...");
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'facebook',
                options: {
                    redirectTo: window.location.origin + '/publicar.html'
                }
            });
            if (error) console.error("Error Facebook:", error);
        });

        emailBtn.addEventListener('click', () => {
            console.log("📧 Redirigiendo a login por email...");
            window.location.href = 'login.html';
        });

        // Mostrar modal con animación
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    };

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
        console.log('Loading categories...');
        console.log('categorySelect:', categorySelect);

        if (!categorySelect) {
            console.error('❌ categorySelect element not found!');
            return;
        }

        // Cargar desde la base de datos como en editar
        const { data, error } = await supabase.from('categorias').select('id, nombre, parent_id');
        if (error) {
            console.error("Error al cargar categorías:", error);
            // Fallback a DEFAULT_CATEGORIES
            allCategories = DEFAULT_CATEGORIES;
        } else {
            allCategories = data;
        }

        const mainCategories = allCategories.filter(c => c.parent_id === null);
        console.log('Main categories loaded:', mainCategories.map(c => c.nombre));

        categorySelect.innerHTML = '<option value="" disabled selected>Selecciona una categoría principal</option>';
        mainCategories.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.nombre;
            categorySelect.appendChild(option);
        });

        console.log('✅ Categories loaded successfully');
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
                    <img src="${e.target.result}" class="gallery-img" style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 8px;">
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
        btn.addEventListener('click', async () => {
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
            } else if (currentStepNumber === 3) {
                // Verificar si el usuario está autenticado antes de ir al paso 4 (planes)
                console.log("🔍 Paso 3: Verificando autenticación...");
                let user = null;
                try {
                    const { data: { user: sessionUser } } = await supabase.auth.getUser();
                    user = sessionUser;
                } catch (err) {
                    console.log("⚠️ Error al verificar sesión (normal si está cerrada):", err.message);
                    user = null;
                }
                console.log("👤 Usuario:", user ? user.email : "No autenticado");
                if (!user) {
                    // Si no está autenticado, mostrar modal de planes con opción de registro
                    console.log("📋 Mostrando modal de planes...");
                    showPlanSelectionModal();
                } else {
                    // Si está autenticado, continuar normalmente
                    console.log("✅ Usuario autenticado, yendo al paso 4...");
                    navigateToStep(currentStepNumber + 1);
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

    let user = null;
    try {
        const { data: { user: sessionUser } } = await supabase.auth.getUser();
        user = sessionUser;
    } catch (err) {
        console.log("⚠️ Error al verificar sesión:", err.message);
        user = null;
    }
    
    if (!user) {
        // Mostrar modal de login en lugar de alert
        publishButton.disabled = false;
        publishButton.textContent = 'Publicar Anuncio';
        showLoginModalForPublishing();
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
    const termsAgreement = document.getElementById('terms-agreement');

    // Validaciones mejoradas
    if (!title || title.length < 10) {
        alert('El título debe tener al menos 10 caracteres.');
        publishButton.disabled = false;
        publishButton.textContent = 'Publicar Anuncio';
        return;
    }

    if (!description || description.length < 30) {
        alert('La descripción debe tener al menos 30 caracteres para mejor visibilidad.');
        publishButton.disabled = false;
        publishButton.textContent = 'Publicar Anuncio';
        return;
    }

    if (!price || parseFloat(price) < 1) {
        alert('Por favor, ingresa un precio válido.');
        publishButton.disabled = false;
        publishButton.textContent = 'Publicar Anuncio';
        return;
    }

    if (!category || !province || !district || !coverImageFile) {
        alert('Por favor, completa todos los campos obligatorios (Categoría, Ubicación e Imagen de Portada).');
        publishButton.disabled = false;
        publishButton.textContent = 'Publicar Anuncio';
        return;
    }

    if (!termsAgreement || !termsAgreement.checked) {
        alert('Debes aceptar los Términos y Condiciones para continuar.');
        publishButton.disabled = false;
        publishButton.textContent = 'Publicar Anuncio';
        return;
    }

    // ✅ VALIDAR VIDEOS SEGÚN PLAN
    const selectedPlanInput = document.querySelector('input[name="plan"]:checked');
    const selectedPlan = selectedPlanInput ? selectedPlanInput.value : 'free';
    const videoUrl = document.getElementById('video-url')?.value || '';

    // Permitir video solo en planes Destacado y Top
    if (videoUrl && selectedPlan !== 'destacado' && selectedPlan !== 'top') {
        alert('Los planes Destacado y TOP permiten agregar videos. Por favor, selecciona uno de estos planes.');
        publishButton.disabled = false;
        publishButton.textContent = 'Publicar Anuncio';
        return;
    }

    // ✅ VALIDAR URL DE VIDEO (YouTube o Vimeo)
    if (videoUrl && (selectedPlan === 'destacado' || selectedPlan === 'top')) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\//;
        const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\//;
        
        if (!youtubeRegex.test(videoUrl) && !vimeoRegex.test(videoUrl)) {
            alert('Por favor, ingresa una URL válida de YouTube o Vimeo.');
            publishButton.disabled = false;
            publishButton.textContent = 'Publicar Anuncio';
            return;
        }
    }

    // Obtener nombres de categoría y subcategoría
    const categoryName = categorySelect.options[categorySelect.selectedIndex].text;
    const subcategoryName = subcategorySelect.value; // Ya es el nombre

    try {
        if (!coverImageFile) throw new Error("La imagen de portada es obligatoria.");

            const coverFileName = `${user.id}/cover-${Date.now()}-${coverImageFile.name}`;
            let { error: coverUploadError } = await supabase.storage.from('imagenes_anuncios').upload(coverFileName, coverImageFile);
            if (coverUploadError) throw coverUploadError;
            
            const { data: { publicUrl: coverPublicUrl } } = supabase.storage.from('imagenes_anuncios').getPublicUrl(coverFileName);

            // Subir imágenes de galería
            const uploadedGalleryUrls = [];
            for (const file of galleryFiles) {
                const galleryFileName = `${user.id}/gallery-${Date.now()}-${file.name}`;
                const { error: galleryUploadError } = await supabase.storage.from('imagenes_anuncios').upload(galleryFileName, file);
                if (galleryUploadError) throw galleryUploadError;
                const { data: { publicUrl: galleryPublicUrl } } = supabase.storage.from('imagenes_anuncios').getPublicUrl(galleryFileName);
                uploadedGalleryUrls.push(galleryPublicUrl);
            }

            const formData = new FormData(form);
            const adData = {
                titulo: document.getElementById('title').value,
                descripcion: formData.get('descripcion'),
                precio: parseFloat(formData.get('precio')),
                categoria: categoryName,
                provincia: formData.get('provincia'),
                distrito: formData.get('distrito'),
                user_id: user.id,
                url_portada: coverPublicUrl,
                url_galeria: uploadedGalleryUrls, // Nuevo campo con las imágenes de galería
                url_video: (selectedPlan === 'destacado' || selectedPlan === 'top') ? formData.get('video_url') : null,
                publicar_redes: selectedPlan === 'top' ? (formData.get('publicar_redes') ? true : false) : false,
                fecha_publicacion: new Date().toISOString()
            };

            // --- ATRIBUTOS UNIFICADOS (TODAS las categorías van a JSONB) ---
            adData.atributos_clave = buildUnifiedAttributesJSON(formData, categoryName, subcategoryName);

            // DIAGNÓSTICO: Hacer global para debugging
            window.atributos_clave = adData.atributos_clave;
            console.log('🌐 Variable global window.atributos_clave asignada:', window.atributos_clave);

            // ==================================================================
            // === INICIO: LÓGICA PARA PLANES Y MEJORAS ===
            // ==================================================================

            // 1. Ya obtuvimos el plan seleccionado en validaciones previas
            // (no necesita re-lectura, ya lo tenemos en selectedPlan)

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

            alert('¡Anuncio publicado con éxito!');
            window.location.href = 'panel-unificado.html';

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

        // DIAGNÓSTICO: Mostrar todos los campos del formData
        console.log('📋 FormData entries:');
        for (let [key, value] of formData.entries()) {
            console.log(`   ${key}: "${value}"`);
        }

        const json = {};
        
        // Agregar subcategoría si existe
        if (subcategory) {
            json.subcategoria = subcategory;
        }
        
        // --- VEHÍCULOS ---
        if (mainCategory.toLowerCase().includes('vehículo') ||
            mainCategory.toLowerCase().includes('auto') ||
            mainCategory.toLowerCase().includes('carro')) {

            const vehicleFields = [
                'marca', 'modelo', 'anio', 'kilometraje', 'transmision', 'combustible',
                'color', 'puertas', 'vidrios', 'rines', 'tapiz', 'direccion', 'frenos', 'airbags', 'estado'
            ];
            vehicleFields.forEach(field => {
                const value = formData.get(field);
                if (value) {
                    json[field] = (field === 'anio' || field === 'kilometraje' || field === 'puertas')
                        ? parseInt(value)
                        : value;
                }
            });
        }
        
        // --- INMUEBLES ---
        if (mainCategory.toLowerCase().includes('inmueble') ||
            mainCategory.toLowerCase().includes('casa') ||
            mainCategory.toLowerCase().includes('apartamento')) {
            console.log('🟢 ENTRÓ AL BLOQUE DE INMUEBLES');
            // Campos numéricos
            const realEstateFields = [
                'm2', 'habitaciones', 'baños', 'piso', 'estacionamiento', 'anio_construccion'
            ];
            realEstateFields.forEach(field => {
                const value = formData.get(field);
                if (value !== null && value !== undefined && value !== "") {
                    json[field] = parseInt(value);
                }
            });
            // Campos select
            const selectFields = [
                'amueblado', 'ascensor', 'jardin', 'piscina', 'tipo_propiedad',
                'estado_conservacion', 'calefaccion', 'aire_acondicionado',
                'seguridad', 'orientacion', 'mascotas', 'gimnasio'
            ];
            selectFields.forEach(field => {
                const value = formData.get(field);
                if (value) {
                    json[field] = value;
                }
            });
            // Campos adicionales de texto
            const textFields = [
                'area' // Para compatibilidad con versiones anteriores
            ];
            textFields.forEach(field => {
                const value = formData.get(field);
                if (value) {
                    json[field] = value;
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
        console.log('🔵 === FIN buildUnifiedAttributesJSON ===');
        return Object.keys(json).length > 0 ? json : null;
    }

    // --- INICIALIZACIÓN ---
    loadAllCategories();
    getUserInfo();

    // --- VERIFICAR PLAN PRESELECCIONADO (DESPUÉS DEL REGISTRO) ---
    const selectedPlanFromSession = sessionStorage.getItem('selectedPlan');
    const afterRegisterAction = sessionStorage.getItem('afterRegisterAction');
    
    if (selectedPlanFromSession === 'gratis' && afterRegisterAction === 'continuePlan') {
        console.log("✅ Plan gratis preseleccionado después del registro");
        
        // Desplazar a la sección de planes automáticamente después de cargar
        setTimeout(() => {
            // Navegar automáticamente a la sección de planes (Step 4)
            navigateToStep(4);
            
            // Preseleccionar el plan gratis
            const freePlanCard = document.querySelector('.plan-card-h[data-plan="gratis"]');
            if (freePlanCard) {
                freePlanCard.classList.add('selected');
                console.log("✅ Plan gratis preseleccionado visualmente");
            }
            
            // Limpiar sessionStorage
            sessionStorage.removeItem('afterRegisterAction');
        }, 500);
    }

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
const planCards = document.querySelectorAll('.plan-card-h');
console.log(`Agente 11: Se encontraron ${planCards.length} tarjetas de plan.`);

// ✅ PLAN_LIMITS_V2 removida - usar PLAN_LIMITS centralizado
planCards.forEach(card => {
    card.addEventListener('click', function(e) {
        const radio = this.querySelector('input[type="radio"]');
        if (!radio) {
            console.error("Error: No se encontró un radio button dentro de la tarjeta clickeada.");
            return;
        }

        radio.checked = true;
        const selectedPlan = radio.value;
        console.log(`Agente 11: Clic detectado en tarjeta. Plan seleccionado: ${selectedPlan}.`);

        // ✅ Guardar plan seleccionado en sessionStorage (para usuarios registrados)
        sessionStorage.setItem('selectedPlan', selectedPlan);

        // --- Lógica de navegación (para todos los usuarios) ---
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

    // 1. RESTRICCIÓN PARA CAMPOS DE VIDEO (Destacado y Top)
    const videoFields = document.querySelectorAll('.plan-video-feature');
    console.log('🔍 DEBUG: Found videoFields:', videoFields.length);

    const enableVideo = (planValue === 'destacado' || planValue === 'top');
    const disableVideo = !enableVideo;
    console.log('🔍 DEBUG: enableVideo:', enableVideo, 'disableVideo:', disableVideo);

    videoFields.forEach(div => {
        div.style.opacity = disableVideo ? '0.4' : '1';
        div.style.pointerEvents = disableVideo ? 'none' : 'auto';

        const input = div.querySelector('input, select, textarea');
        if (input) input.disabled = disableVideo;
    });

    // 2. RESTRICCIÓN PARA CAMPOS TOP (Publicación en Redes Sociales)
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

    // 3. RESTRICCIÓN PARA EL BADGE DESTACADO
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
