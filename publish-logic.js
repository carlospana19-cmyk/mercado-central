// publish-logic.js - VERSIÓN FINAL CON GUARDIÁN DE PUBLICACIÓN

import { supabase } from './supabase-client.js';
import { districtsByProvince } from './config-locations.js';
import { DEFAULT_CATEGORIES } from './config-categories.js';
import { APP_CONFIG } from './AppConfig.js';
import mapsIntegration from './google-maps-integration.js';

// =====================================================
// GUARDIÁN DE PUBLICACIÓN - Validación de Sesión
// =====================================================

let currentUser = null;
let isSessionChecked = false;

/**
 * Verifica si hay un usuario autenticado antes de permitir publicar
 * Muestra modal de login si no hay sesión
 */
async function checkPublishSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error verificando sesión:', error);
            showLoginRequiredModal();
            return null;
        }
        
        if (!session || !session.user) {
            console.log('No hay sesión activa');
            showLoginRequiredModal();
            return null;
        }
        
        currentUser = session.user;
        isSessionChecked = true;
        console.log('Usuario autenticado:', currentUser.email);
        return currentUser;
        
    } catch (error) {
        console.error('Error en checkPublishSession:', error);
        showLoginRequiredModal();
        return null;
    }
}

/**
 * Muestra un modal elegante pidiendo iniciar sesión
 */
function showLoginRequiredModal() {
    // Crear overlay del modal
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'login-required-modal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    // Contenido del modal
    modalOverlay.innerHTML = `
        <div class="login-required-content" style="
            background: white;
            border-radius: 16px;
            padding: 40px;
            max-width: 450px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            transform: scale(0.9);
            transition: transform 0.3s ease;
        ">
            <div style="
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #00bfae, #00a896);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 24px;
            ">
                <i class="fas fa-user-lock" style="font-size: 36px; color: white;"></i>
            </div>
            <h2 style="
                font-size: 24px;
                color: #333;
                margin-bottom: 12px;
                font-family: 'Poppins', sans-serif;
            ">¡Ups! Necesitas iniciar sesión</h2>
            <p style="
                font-size: 16px;
                color: #666;
                margin-bottom: 28px;
                line-height: 1.6;
            ">Para publicar tu anuncio, primero debes iniciar sesión en tu cuenta. Es rápido y seguro.</p>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button id="go-to-login" style="
                    background: linear-gradient(135deg, #00bfae, #00a896);
                    color: white;
                    border: none;
                    padding: 14px 32px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                ">
                    <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                </button>
                <button id="go-to-register" style="
                    background: white;
                    color: #00bfae;
                    border: 2px solid #00bfae;
                    padding: 12px 28px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                ">
                    <i class="fas fa-user-plus"></i> Registrarme
                </button>
            </div>
            <button id="close-login-modal" style="
                position: absolute;
                top: 16px;
                right: 16px;
                background: none;
                border: none;
                font-size: 24px;
                color: #999;
                cursor: pointer;
            ">×</button>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    // Animar entrada
    setTimeout(() => {
        modalOverlay.style.opacity = '1';
        modalOverlay.querySelector('.login-required-content').style.transform = 'scale(1)';
    }, 10);
    
    // Event listeners
    const loginBtn = modalOverlay.querySelector('#go-to-login');
    const registerBtn = modalOverlay.querySelector('#go-to-register');
    const closeBtn = modalOverlay.querySelector('#close-login-modal');
    
    // Guardar URL actual para regresar después del login
    const currentUrl = window.location.href;
    
    loginBtn.addEventListener('click', () => {
        window.location.href = `login.html?redirect=${encodeURIComponent(currentUrl)}`;
    });
    
    registerBtn.addEventListener('click', () => {
        window.location.href = `registro.html?redirect=${encodeURIComponent(currentUrl)}`;
    });
    
    closeBtn.addEventListener('click', () => {
        modalOverlay.style.opacity = '0';
        modalOverlay.querySelector('.login-required-content').style.transform = 'scale(0.9)';
        setTimeout(() => modalOverlay.remove(), 300);
    });
    
    // Cerrar al hacer clic fuera
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeBtn.click();
        }
    });
}

/**
 * Deshabilita el formulario si no hay sesión
 */
function disableFormForGuests() {
    const publishButton = document.querySelector('.publish-btn, #publish-btn, button[type="submit"]');
    if (publishButton) {
        publishButton.disabled = true;
        publishButton.style.opacity = '0.5';
        publishButton.style.cursor = 'not-allowed';
        publishButton.title = 'Inicia sesión para publicar';
    }
}

/**
 * Habilita el formulario cuando hay sesión válida
 */
function enableFormForUsers() {
    const publishButton = document.querySelector('.publish-btn, #publish-btn, button[type="submit"]');
    if (publishButton) {
        publishButton.disabled = false;
        publishButton.style.opacity = '1';
        publishButton.style.cursor = 'pointer';
        publishButton.title = '';
    }
}

// =====================================================
// FIN GUARDIÁN DE PUBLICACIÓN
// =====================================================

// VALIDAR CANTIDAD DE FOTOS
function validateImageCount(plan) {
    const selectedPlan = plan || 'free';
    const limit = APP_CONFIG.PLAN_LIMITS[selectedPlan].maxFotos;
    const currentImages = document.querySelectorAll('.image-preview').length;
    
    if (currentImages >= limit) {
        alert(`El plan ${selectedPlan.toUpperCase()} permite máximo ${limit} fotos`);
        return false;
    }
    return true;
}

export async function initializePublishPage() {
    const form = document.getElementById('ad-form');
    if (!form) return;
    
    // =====================================================
    // VERIFICACIÓN DE SESIÓN AL CARGAR LA PÁGINA
    // =====================================================
    const user = await checkPublishSession();
    
    if (!user) {
        // No hay sesión - deshabilitar formulario
        disableFormForGuests();
        // El modal ya se mostró en checkPublishSession
    } else {
        // Hay sesión - habilitar formulario
        enableFormForUsers();
    }
    
    // Escuchar cambios de autenticación
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            currentUser = session.user;
            isSessionChecked = true;
            enableFormForUsers();
            // Cerrar modal si está abierto
            const modal = document.getElementById('login-required-modal');
            if (modal) modal.remove();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            isSessionChecked = false;
            disableFormForGuests();
            showLoginRequiredModal();
        }
    });
    // =====================================================

    // --- ELEMENTOS DEL DOM ---
    const allSteps = form.querySelectorAll('.form-section');
    const progressSteps = document.querySelectorAll('.step');
    
    // Selectores de categoría (Paso 1 y Paso 4)
    const categorySelect = document.getElementById('categoria');
    const categorySelectStep4 = document.getElementById('categoria-step4');
    const subcategoryGroup = document.getElementById('subcategory-group');
    const subcategoryGroupStep4 = document.getElementById('subcategory-group-step4');
    const subcategorySelect = document.getElementById('subcategoria');
    const subcategorySelectStep4 = document.getElementById('subcategoria-step4');
    
    // Selectores de ubicación (Paso 2 y Paso 4)
    const provinceSelect = document.getElementById('province');
    const provinceSelectStep4 = document.getElementById('province-step4');
    const districtGroup = document.getElementById('district-group');
    const districtGroupStep4 = document.getElementById('district-group-step4');
    const districtSelect = document.getElementById('district');
    const districtSelectStep4 = document.getElementById('district-step4');
    const addressInput = document.getElementById('address');
    const addressInputStep4 = document.getElementById('address-step4');
    
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
    const nextBtns = form.querySelectorAll('.next-btn'); // Botones de siguiente en otros pasos
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

function showHomeFurnitureFields() {
    showCategoryFields('hogar y muebles', 'home-furniture-fields', 'home-furniture-details');
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
                            <div class="plan-badge">Recomendado</div>
                            <h3>GRATIS</h3>
                            <p class="plan-price">$0.00</p>
                            <ul class="plan-features">
                                <li>✓ Hasta 3 fotos</li>
                                <li>✓ Publicación inmediata</li>
                                <li>✓ Acceso a 500+ compradores</li>
                                <li>✓ 30 días de vigencia</li>
                            </ul>
                            <button class="btn-plan btn-plan-free" data-plan="gratis">
                                Seleccionar
                            </button>
                        </div>

                        <div class="plan-option plan-basico" data-plan="basico">
                            <div class="plan-badge">Popular</div>
                            <h3>BÁSICO</h3>
                            <p class="plan-price">$5.00</p>
                            <ul class="plan-features">
                                <li>✓ Hasta 5 fotos</li>
                                <li>✓ Destaca sobre anuncios gratis</li>
                                <li>✓ Acceso a 2000+ compradores</li>
                                <li>✓ Reposicionamiento diario</li>
                                <li>✓ 30 días de vigencia</li>
                            </ul>
                            <button class="btn-plan btn-plan-paid" data-plan="basico">
                                Seleccionar
                            </button>
                        </div>

                        <div class="plan-option plan-premium" data-plan="premium">
                            <div class="plan-badge">Best Seller</div>
                            <h3>PREMIUM</h3>
                            <p class="plan-price">$10.00</p>
                            <ul class="plan-features">
                                <li>✓ Hasta 10 fotos + carrusel</li>
                                <li>✓ Destacado en resultados</li>
                                <li>✓ Acceso a 5000+ compradores</li>
                                <li>✓ Estadísticas básicas</li>
                                <li>✓ Reposicionamiento cada 6 horas</li>
                                <li>✓ 30 días de vigencia</li>
                            </ul>
                            <button class="btn-plan btn-plan-paid" data-plan="premium">
                                Seleccionar
                            </button>
                        </div>

                        <div class="plan-option plan-destacado" data-plan="destacado">
                            <h3>DESTACADO</h3>
                            <p class="plan-price">$20.00</p>
                            <ul class="plan-features">
                                <li>✓ Hasta 15 fotos + carrusel</li>
                                <li>✓ Posición premium en búsquedas</li>
                                <li>✓ Acceso a 10000+ compradores</li>
                                <li>✓ Estadísticas detalladas</li>
                                <li>✓ Reposicionamiento cada 3 horas</li>
                                <li>✓ 1 video HD</li>
                                <li>✓ 30 días de vigencia</li>
                            </ul>
                            <button class="btn-plan btn-plan-paid" data-plan="destacado">
                                Seleccionar
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
        
        // SI es paso 2 (Detalles), actualizar restricciones del plan
        if (stepNumber === 2) {
            const selectedPlan = document.querySelector('input[name="plan"]:checked')?.value;
            if (selectedPlan) {
                updatePlanRestrictions(selectedPlan);
            }

            const titleInput = document.getElementById('title');
            const mainCategoryText = categorySelectStep4?.options[categorySelectStep4.selectedIndex]?.text || ''; // Usamos la categoría del paso 2
            const subcategoryValue = subcategorySelectStep4?.value || '';
            
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

        if (!categorySelect && !categorySelectStep4) {
            console.error('❌ No category select elements found!');
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

        // Cargar en el selector del Paso 1
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="" disabled selected>Selecciona una categoría principal</option>';
            mainCategories.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = group.nombre;
                categorySelect.appendChild(option);
            });
        }

        // Cargar en el selector del Paso 4 (unificado)
        if (categorySelectStep4) {
            categorySelectStep4.innerHTML = '<option value="" disabled selected>Selecciona una categoría principal</option>';
            mainCategories.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = group.nombre;
                categorySelectStep4.appendChild(option);
            });
        }

        console.log('✅ Categories loaded successfully');
    }

    // Función para manejar cambio de categoría (compartida)
    function handleCategoryChange(selectElement, subcategoryGroupEl, subcategorySelectEl) {
        const selectedParentId = parseInt(selectElement.value, 10);
        selectedMainCategory = allCategories.find(c => c.id === selectedParentId)?.nombre || '';
        console.log('Category changed. Selected Main Category:', selectedMainCategory, 'ID:', selectedParentId);
        const subcategories = allCategories.filter(c => c.parent_id === selectedParentId);

        if (selectedMainCategory.toLowerCase().includes('electrónica')) {
            console.log('Fetching subcategories for Electronics...');
            console.log('Subcategories data:', subcategories);
        }

        if (subcategories.length > 0) {
            subcategorySelectEl.innerHTML = '<option value="" disabled selected>Selecciona una subcategoría</option>';
            subcategories.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub.nombre;
                option.textContent = sub.nombre;
                subcategorySelectEl.appendChild(option);
            });
            subcategoryGroupEl.style.display = 'block';
            console.log('Subcategories loaded:', subcategories.map(s => s.nombre));
        } else {
            // Si una categoría principal no tiene hijos, la tratamos como la selección final
            subcategoryGroupEl.style.display = 'none';
            subcategorySelectEl.innerHTML = '';
            console.log('No subcategories for this main category.');
        }

        // Mostrar campos dinámicos inmediatamente al cambiar categoría
        console.log('Calling showDynamicFields from category change.');
        showDynamicFields();
    }

    // Event listener para categoría del Paso 1
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            handleCategoryChange(this, subcategoryGroup, subcategorySelect);
        });
    }

    // Event listener para categoría del Paso 4 (unificado)
    if (categorySelectStep4) {
        categorySelectStep4.addEventListener('change', function() {
            handleCategoryChange(this, subcategoryGroupStep4, subcategorySelectStep4);
        });
    }

    // Función para manejar cambio de subcategoría (compartida)
    function handleSubcategoryChange(selectElement) {
        selectedSubcategory = selectElement.value;
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
    }

    // Event listener para subcategoría del Paso 1
    if (subcategorySelect) {
        subcategorySelect.addEventListener('change', function() {
            handleSubcategoryChange(this);
        });
    }

    // Event listener para subcategoría del Paso 4 (unificado)
    if (subcategorySelectStep4) {
        subcategorySelectStep4.addEventListener('change', function() {
            handleSubcategoryChange(this);
        });
    }

    // --- LÓGICA DE UBICACIÓN ---
    // Variable para controlar si el mapa ya está inicializado
    let mapInitialized = false;
    let currentProvince = '';

    // Función para inicializar y mostrar el mapa
    async function initializeAndShowMap(province) {
        const mapContainer = document.getElementById('map-container');
        currentProvince = province;
        
        try {
            // Cargar la API de Google Maps si no está cargada
            if (!mapInitialized) {
                await mapsIntegration.loadMapsAPI();
                mapsIntegration.initMap('province-map', {
                    zoom: 10
                });
                mapInitialized = true;
            }
            
            // Mostrar la provincia en el mapa
            mapsIntegration.showProvinceOnMap(province);
            
            // Mostrar el contenedor del mapa
            if (mapContainer) {
                mapContainer.style.display = 'block';
            }
            
            console.log('Mapa mostrado para:', province);
        } catch (error) {
            console.error('Error al mostrar el mapa:', error);
        }
    }

    // Función para mostrar el distrito en el mapa
    async function showDistrictOnMap() {
        const provinceSelect = document.getElementById('province-step4');
        const districtSelect = document.getElementById('district-step4');
        
        if (!provinceSelect || !districtSelect) return;
        
        const province = provinceSelect.value;
        const district = districtSelect.value;
        
        if (district && province) {
            try {
                if (!mapInitialized) {
                    await mapsIntegration.loadMapsAPI();
                    mapsIntegration.initMap('province-map', { zoom: 10 });
                    mapInitialized = true;
                }
                
                mapsIntegration.showDistrictOnMap(province, district);
                console.log('Mapa mostrado para:', district, province);
            } catch (error) {
                console.error('Error al mostrar el distrito:', error);
            }
        }
    }

    // Función para manejar cambio de provincia (compartida)
    function handleProvinceChange(selectElement, districtGroupEl, districtSelectEl) {
        const province = selectElement.value;
        console.log('Province changed to:', province);
        
        const districts = districtsByProvince[province] || [];
        if (districts.length > 0) {
            districtSelectEl.innerHTML = '<option value="">Selecciona un distrito</option>';
            districts.forEach(district => {
                const option = document.createElement('option');
                option.value = district;
                option.textContent = district;
                districtSelectEl.appendChild(option);
            });
            districtGroupEl.style.display = 'block';
        } else {
            districtGroupEl.style.display = 'none';
            districtSelectEl.innerHTML = '';
        }
        
        // === MOSTRAR EL MAPA CUANDO SE SELECCIONA UNA PROVINCIA ===
        const mapContainer = document.getElementById('map-container');
        if (province) {
            initializeAndShowMap(province);
        } else {
            if (mapContainer) {
                mapContainer.style.display = 'none';
            }
            mapsIntegration.hideMap();
        }
    }

    // Event listener para provincia del Paso 2
    if (provinceSelect) {
        provinceSelect.addEventListener('change', function() {
            handleProvinceChange(this, districtGroup, districtSelect);
        });
    }

    // Event listener para provincia del Paso 4 (unificado)
    if (provinceSelectStep4) {
        provinceSelectStep4.addEventListener('change', function() {
            handleProvinceChange(this, districtGroupStep4, districtSelectStep4);
        });
    }

    // Event listener para botón de ubicación actual
    const getLocationBtn = document.getElementById('get-current-location');
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', async function() {
            const mapContainer = document.getElementById('map-container');
            
            // Mostrar indicador de carga
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
            this.disabled = true;

            try {
                await mapsIntegration.showCurrentLocation();
                
                // Mostrar el contenedor del mapa
                if (mapContainer) {
                    mapContainer.style.display = 'block';
                }
                
                console.log('Ubicación actual mostrada');
            } catch (error) {
                let message = 'No se pudo obtener tu ubicación.';
                
                // Mensajes más específicos según el error
                if (error.message.includes('denied') || error.message.includes('denegado')) {
                    message = 'Permiso de ubicación denegado. Por favor permite el acceso en tu navegador.';
                } else if (error.message.includes('unavailable') || error.message.includes('disponible')) {
                    message = 'Tu ubicación no está disponible. Verifica tu conexión a internet.';
                } else if (error.message.includes('timeout') || error.message.includes('tiempo')) {
                    message = 'Tiempo de espera agotado. Intenta de nuevo.';
                } else if (error.message.includes('soportada') || error.message.includes('soportado')) {
                    message = 'Tu navegador no soporta geolocalización.';
                }
                
                alert(message);
                console.error('Error de geolocalización:', error);
            } finally {
                // Restaurar botón
                this.innerHTML = originalText;
                this.disabled = false;
            }
        });
    }

    // Event listener para distrito del Paso 4 (unificado)
    if (districtSelectStep4) {
        districtSelectStep4.addEventListener('change', function() {
            showDistrictOnMap();
        });
    }

    // REMOVER EVENT LISTENER DUPLICADO si existe
    // Verificar que no haya otro addEventListener llamando a showElectronicsFields

    // --- EVENT LISTENERS PARA SUBIDA DE IMÁGENES ---
    // Cover Image Preview - Usando querySelector y debug más detallado
    function initCoverImagePreview() {
        console.log('=== Cover Image Preview Init ===');
        
        // Función interna para configurar el preview
        function setupCoverPreview() {
            const coverImgInput = document.getElementById('cover-image-input');
            const coverImgName = document.getElementById('cover-image-name');
            const coverPrevContainer = document.querySelector('#cover-image-preview');
            const coverPrevImg = document.querySelector('#cover-preview-img');
            
            console.log('coverImgInput:', coverImgInput);
            console.log('coverImgName:', coverImgName);
            console.log('coverPrevContainer:', coverPrevContainer);
            console.log('coverPrevImg:', coverPrevImg);
            
            if (!coverImgInput) {
                console.warn('cover-image-input not found, retrying...');
                return false;
            }
            
            if (!coverPrevImg || !coverPrevContainer) {
                console.warn('Preview elements missing - checking DOM...');
                const allPreviews = document.querySelectorAll('[id*="preview"]');
                console.log('Elements with "preview" in ID:', allPreviews);
                return false;
            }
            
            // Evitar agregar múltiples event listeners
            if (coverImgInput.dataset.listenerAdded === 'true') {
                console.log('Listener already added');
                return true;
            }
            
            coverImgInput.addEventListener('change', function() {
                const file = this.files[0];
                const coverImageError = document.getElementById('cover-image-error');
                
                console.log('Cover image change event fired. File:', file ? file.name : 'none');
                
                if (file) {
                    coverImgName.textContent = file.name;
                    
                    // Mostrar previsualización de la imagen
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        console.log('FileReader loaded, setting preview src');
                        console.log('Image data length:', e.target.result.length);
                        coverPrevImg.src = e.target.result;
                        coverPrevImg.style.cssText = 'display: inline-block !important; max-width: 250px !important; max-height: 180px !important; width: auto !important; height: auto !important;';
                        coverPrevContainer.style.cssText = 'display: block !important; margin-top: 15px; text-align: center; padding: 15px; background: #f8f9fa; border-radius: 10px; border: 2px dashed #00bfae;';
                        
                        // Ocultar placeholder
                        const placeholder = document.getElementById('cover-preview-placeholder');
                        if (placeholder) placeholder.style.display = 'none';
                        
                        console.log('Preview should now be visible');
                    };
                    reader.onerror = function() {
                        console.error('Error reading file');
                    };
                    reader.readAsDataURL(file);
                    
                    // Ocultar mensaje de error si hay imagen
                    if (coverImageError) {
                        coverImageError.style.display = 'none';
                    }
                } else {
                    coverImgName.textContent = 'Ningún archivo seleccionado.';
                    coverPrevImg.style.display = 'none';
                    coverPrevContainer.style.display = 'none';
                    
                    // Mostrar placeholder
                    const placeholder = document.getElementById('cover-preview-placeholder');
                    if (placeholder) placeholder.style.display = 'block';
                }
            });
            
            coverImgInput.dataset.listenerAdded = 'true';
            console.log('Cover image listener added successfully');
            return true;
        }
        
        // Intentar inmediatamente
        if (setupCoverPreview()) {
            console.log('Cover preview initialized immediately');
            return;
        }
        
        // Retry con intervalo si los elementos no existen aún
        let retries = 0;
        const maxRetries = 10;
        const retryInterval = setInterval(() => {
            retries++;
            console.log('Retry attempt:', retries);
            if (setupCoverPreview() || retries >= maxRetries) {
                clearInterval(retryInterval);
                if (retries >= maxRetries) {
                    console.error('Max retries reached for cover preview');
                }
            }
        }, 500); // Reintentar cada 500ms
    }
    
    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCoverImagePreview);
    } else {
        initCoverImagePreview();
    }

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
            'free': 5,
            'basico': 10,
            'premium': 15,
            'destacado': 20
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

        // VALIDACIÓN ANTES DE AGREGAR - Bloquear si excede el límite
        galleryImagesInput.addEventListener('change', function(e) {
            const selectedPlan = document.querySelector('input[name="plan"]:checked')?.value || 'free';
            const limits = {'free': 5, 'basico': 10, 'premium': 15, 'destacado': 20};
            const maxAllowed = limits[selectedPlan];
            const filesSelected = this.files.length;
            const currentImagesCount = galleryFiles.length;
            const totalAfterAdd = currentImagesCount + filesSelected;
            
            // BLOQUEO COMPLETO si excede
            if (totalAfterAdd > maxAllowed) {
                alert(`❌ LÍMITE EXCEDIDO\n\nPlan ${selectedPlan.toUpperCase()}: máximo ${maxAllowed} fotos\nYa tienes: ${currentImagesCount} fotos\nIntentas agregar: ${filesSelected} fotos\n\nNo se pueden agregar más fotos. Por favor selecciona un plan superior o reduce las fotos.`);
                this.value = ''; // Limpiar input
                return; // NO llamar a addFiles
            }
            
            // Si pasa la validación, agregar archivos
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
                'free': 5,
                'basico': 10,
                'premium': 15,
                'destacado': 20
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
        const limits = {'free': 5, 'basico': 10, 'premium': 15, 'destacado': 20};
        const maxFiles = limits[selectedPlan];
        
        const imageInput = document.getElementById('gallery-images-input'); // Changed from 'images'
        if (imageInput) {
            imageInput.setAttribute('max', maxFiles);
        }
        
        // Actualizar texto del contenedor de subida de imágenes (comentado - el límite se muestra en las tarjetas de plan)
        // const uploadLimitElement = document.getElementById('gallery-upload-limit');
        // if (uploadLimitElement) {
        //     uploadLimitElement.textContent = `Máximo ${maxFiles} imágenes, JPG o PNG`;
        // }
    }

    // Llamar cuando cambie el plan - Actualizar límites Y navegar al paso 2
    document.querySelectorAll('input[name="plan"]').forEach(radio => {
        radio.addEventListener('change', async function() {
            // Actualizar límite de imágenes
            updateImageLimit();
            
            // Navegar automáticamente al paso 2 (Detalles) al seleccionar un plan
            console.log("🔍 Plan seleccionado, verificando autenticación...");
            let user = null;
            try {
                const { data: { user: sessionUser } } = await supabase.auth.getUser();
                user = sessionUser;
            } catch (err) {
                console.log("⚠️ Error al verificar sesión:", err.message);
                user = null;
            }
            
            if (!user) {
                // Si no está autenticado, mostrar modal de login
                console.log("📋 Mostrando modal de login...");
                showLoginRequiredModal();
            } else {
                // Si está autenticado, continuar al paso 2 (Detalles)
                console.log("✅ Usuario autenticado, yendo al paso 2...");
                navigateToStep(2);
            }
        });
    });

    // --- EVENT LISTENERS PARA BOTONES DE NAVEGACIÓN ---
    nextBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const currentStep = btn.closest('.form-section');
            const currentStepNumber = parseInt(currentStep.id.split('-')[1], 10);
            
            // Validación del Paso 1 (Planes) - Ahora solo verifica que haya un plan seleccionado
            if (currentStepNumber === 1) {
                const selectedPlan = document.querySelector('input[name="plan"]:checked');
                if (selectedPlan) {
                    // Verificar si el usuario está autenticado antes de ir al paso 2
                    console.log("🔍 Paso 1: Verificando autenticación...");
                    let user = null;
                    try {
                        const { data: { user: sessionUser } } = await supabase.auth.getUser();
                        user = sessionUser;
                    } catch (err) {
                        console.log("⚠️ Error al verificar sesión:", err.message);
                        user = null;
                    }
                    console.log("👤 Usuario:", user ? user.email : "No autenticado");
                    
                    if (!user) {
                        // Si no está autenticado, mostrar modal de login
                        console.log("📋 Mostrando modal de login...");
                        showLoginRequiredModal();
                    } else {
                        // Si está autenticado, continuar al paso 2 (Detalles)
                        console.log("✅ Usuario autenticado, yendo al paso 2...");
                        navigateToStep(2);
                    }
                } else {
                    alert('Por favor, selecciona un plan para continuar.');
                }
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
    
    // =====================================================
    // VALIDACIÓN DE SESIÓN - GUARDIÁN DE PUBLICACIÓN
    // =====================================================
    if (!currentUser || !isSessionChecked) {
        showLoginRequiredModal();
        return;
    }
    // =====================================================
    
    const publishButton = document.getElementById('publish-ad-btn');
    publishButton.disabled = true;
    publishButton.textContent = 'Publicando...';

    // --- VALIDACIÓN FINAL ANTES DE ENVIAR ---
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const price = document.getElementById('price').value.trim();
    const category = categorySelectStep4?.value || '';
    const subcategory = subcategorySelectStep4?.value || '';
    const province = provinceSelectStep4?.value || '';
    const district = districtSelectStep4?.value || '';
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

    // ✅ VALIDACIÓN VISUAL DE IMAGEN DE PORTADA
    const coverImageError = document.getElementById('cover-image-error');
    if (!coverImageFile) {
        // Mostrar mensaje de error en rojo
        if (coverImageError) {
            coverImageError.style.display = 'block';
            coverImageError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        alert('Por favor, sube una foto de portada para tu anuncio.');
        publishButton.disabled = false;
        publishButton.textContent = 'Publicar Anuncio';
        return;
    } else {
        // Ocultar mensaje de error si hay imagen
        if (coverImageError) {
            coverImageError.style.display = 'none';
        }
    }

    if (!category || !province || !district) {
        alert('Por favor, completa todos los campos obligatorios (Categoría y Ubicación).');
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

    // Permitir video solo en planes Destacado
    if (videoUrl && selectedPlan !== 'destacado') {
        alert('El plan Destacado permite agregar videos. Por favor, selecciona este plan.');
        publishButton.disabled = false;
        publishButton.textContent = 'Publicar Anuncio';
        return;
    }

    // ✅ VALIDAR URL DE VIDEO (YouTube o Vimeo)
    if (videoUrl && selectedPlan === 'destacado') {
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
    const categoryName = categorySelectStep4?.options[categorySelectStep4.selectedIndex]?.text || '';
    const subcategoryName = subcategorySelectStep4?.value || ''; // Ya es el nombre

    try {
        // =====================================================
        // VERIFICACIÓN DUAL: Verificar si el perfil existe
        // =====================================================
        console.log('🔍 Verificando perfil del usuario...');
        
        const { data: existingProfile, error: profileCheckError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', currentUser.id)
            .single();
        
        if (profileCheckError && profileCheckError.code !== 'PGRST116') {
            // Error diferente a "no encontrado"
            console.error('Error verificando perfil:', profileCheckError);
            throw new Error('Error de sincronización de cuenta. Por favor, intenta cerrar e iniciar sesión de nuevo.');
        }
        
        if (!existingProfile) {
            // El perfil no existe, crear automáticamente
            console.log('⚠️ Perfil no encontrado, creando automáticamente...');
            
            const { error: createProfileError } = await supabase
                .from('profiles')
                .insert({
                    id: currentUser.id,
                    email: currentUser.email,
                    nombre_negocio: currentUser.email.split('@')[0],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            
            if (createProfileError) {
                console.error('Error creando perfil:', createProfileError);
                throw new Error('Error de sincronización de cuenta. Por favor, intenta cerrar e iniciar sesión de nuevo.');
            }
            
            console.log('✅ Perfil creado exitosamente');
        } else {
            console.log('✅ Perfil verificado correctamente');
        }
        // =====================================================
        
        if (!coverImageFile) throw new Error("La imagen de portada es obligatoria.");

            const coverFileName = `${currentUser.id}/cover-${Date.now()}-${coverImageFile.name}`;
            let { error: coverUploadError } = await supabase.storage.from('imagenes_anuncios').upload(coverFileName, coverImageFile);
            if (coverUploadError) throw coverUploadError;
            
            const { data: { publicUrl: coverPublicUrl } } = supabase.storage.from('imagenes_anuncios').getPublicUrl(coverFileName);

            // Subir imágenes de galería
            const uploadedGalleryUrls = [];
            for (const file of galleryFiles) {
                const galleryFileName = `${currentUser.id}/gallery-${Date.now()}-${file.name}`;
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
                user_id: currentUser.id,
                url_portada: coverPublicUrl,
                url_galeria: uploadedGalleryUrls, // Nuevo campo con las imágenes de galería
                url_video: selectedPlan === 'destacado' ? formData.get('video_url') : null,
                publicar_redes: selectedPlan === 'destacado' ? (formData.get('publicar_redes') ? true : false) : false,
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
            // }

            const fechaExpiracion = new Date();
            fechaExpiracion.setDate(fechaExpiracion.getDate() + diasDeVigencia);

            // 3. Los "enhancements" (add-ons opcionales) han sido eliminados.

            // 4. Añadir los datos del plan al objeto principal del anuncio
            adData.featured_plan = selectedPlan;
            adData.plan_priority = APP_CONFIG.PLAN_LIMITS[selectedPlan].priority; // AGREGAR
            adData.max_images = APP_CONFIG.PLAN_LIMITS[selectedPlan].maxFotos; // AGREGAR
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
            const subcategoryConfig = categoryFieldConfigs['electrónica']?.[subcategory];
            if (subcategoryConfig) {
                Object.entries(subcategoryConfig).forEach(([fieldName, fieldConfig]) => {
                    const value = formData.get(fieldName);
                    if (value) {
                        json[fieldName] = fieldConfig.type === 'number' ? parseInt(value) : value;
                    }
                });
            }
        }
        
        // --- HOGAR Y MUEBLES ---
        if (mainCategory.toLowerCase().includes('hogar') ||
            mainCategory.toLowerCase().includes('mueble')) {
            const subcategoryConfig = categoryFieldConfigs['hogar y muebles']?.[subcategory];
            if (subcategoryConfig) {
                Object.entries(subcategoryConfig).forEach(([fieldName, fieldConfig]) => {
                    const value = formData.get(fieldName);
                    if (value) {
                        json[fieldName] = fieldConfig.type === 'number' ? parseInt(value) : value;
                    }
                });
            }
        }

        // --- MODA Y BELLEZA ---
        if (mainCategory.toLowerCase().includes('moda') ||
            mainCategory.toLowerCase().includes('belleza') ||
            mainCategory.toLowerCase().includes('ropa')) {
            const subcategoryConfig = categoryFieldConfigs['moda y belleza']?.[subcategory];
            if (subcategoryConfig) {
                Object.entries(subcategoryConfig).forEach(([fieldName, fieldConfig]) => {
                    const value = formData.get(fieldName);
                    if (value) {
                        json[fieldName] = fieldConfig.type === 'number' ? parseInt(value) : value;
                    }
                });
            }
        }

        console.log(' JSON FINAL:', json);
        // --- DEPORTES Y HOBBIES ---
        if (mainCategory.toLowerCase().includes('deporte') ||
            mainCategory.toLowerCase().includes('hobbies')) {
            const subcategoryConfig = categoryFieldConfigs['deportes y hobbies']?.[subcategory];
            if (subcategoryConfig) {
                Object.entries(subcategoryConfig).forEach(([fieldName, fieldConfig]) => {
                    const value = formData.get(fieldName);
                    if (value) {
                        json[fieldName] = fieldConfig.type === 'number' ? parseInt(value) : value;
                    }
                });
            }
        }

        // --- MASCOTAS ---
        if (mainCategory.toLowerCase().includes('mascota')) {
            const subcategoryConfig = categoryFieldConfigs['mascotas']?.[subcategory];
            if (subcategoryConfig) {
                Object.entries(subcategoryConfig).forEach(([fieldName, fieldConfig]) => {
                    const value = formData.get(fieldName);
                    if (value) {
                        json[fieldName] = fieldConfig.type === 'number' ? parseInt(value) : value;
                    }
                });
            }
        }

        // --- SERVICIOS ---
        if (mainCategory.toLowerCase().includes('servicio')) {
            const subcategoryConfig = categoryFieldConfigs['servicios']?.[subcategory];
            if (subcategoryConfig) {
                Object.entries(subcategoryConfig).forEach(([fieldName, fieldConfig]) => {
                    const value = formData.get(fieldName);
                    if (value) {
                        json[fieldName] = fieldConfig.type === 'number' ? parseInt(value) : value;
                    }
                });
            }
        }

        // --- NEGOCIOS ---
        if (mainCategory.toLowerCase().includes('negocio')) {
            const subcategoryConfig = categoryFieldConfigs['negocios']?.[subcategory];
            if (subcategoryConfig) {
                Object.entries(subcategoryConfig).forEach(([fieldName, fieldConfig]) => {
                    const value = formData.get(fieldName);
                    if (value) {
                        json[fieldName] = fieldConfig.type === 'number' ? parseInt(value) : value;
                    }
                });
            }
        }

        // --- COMUNIDAD ---
        if (mainCategory.toLowerCase().includes('comunidad')) {
            const subcategoryConfig = categoryFieldConfigs['comunidad']?.[subcategory];
            if (subcategoryConfig) {
                Object.entries(subcategoryConfig).forEach(([fieldName, fieldConfig]) => {
                    const value = formData.get(fieldName);
                    if (value) {
                        json[fieldName] = fieldConfig.type === 'number' ? parseInt(value) : value;
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
            // Navegar automáticamente a la sección de detalles (Step 2)
            navigateToStep(2);
            
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

        // --- LIMPIAR IMÁGENES AL CAMBIAR DE PLAN ---
        // Limpiar imagen de portada
        const coverImageInput = document.getElementById('cover-image-input');
        if (coverImageInput) {
            coverImageInput.value = ''; // Limpiar el input file
            const coverPreview = document.getElementById('cover-image-preview');
            if (coverPreview) coverPreview.innerHTML = ''; // Limpiar preview
            const coverImageName = document.getElementById('cover-image-name');
            if (coverImageName) coverImageName.textContent = 'No se ha seleccionado imagen';
        }
        
        // Limpiar galería de imágenes
        const galleryImagesInput = document.getElementById('gallery-images-input');
        if (galleryImagesInput) {
            galleryImagesInput.value = ''; // Limpiar el input file
            const galleryPreviewContainer = document.getElementById('gallery-preview-container');
            if (galleryPreviewContainer) galleryPreviewContainer.innerHTML = ''; // Limpiar previews
        }
        console.log('✅ Imágenes limpiadas al cambiar de plan');
        // ----------------------------------------------

        // --- Lógica de navegación al paso 2 (Detalles) ---
        setTimeout(() => {
            const step2 = document.getElementById('step-2');
            
            if (step2) {
                console.log("Agente 11: Navegando a step-2 (Detalles).");
                // Verificar autenticación antes de navegar
                supabase.auth.getUser().then(({ data: { user } }) => {
                    if (user) {
                        navigateToStep(2); // Navegar al paso de Detalles
                    } else {
                        showLoginRequiredModal(); // Mostrar modal de login
                    }
                }).catch(err => {
                    console.log("⚠️ Error al verificar sesión:", err.message);
                    showLoginRequiredModal();
                });
            } else {
                console.error("Error: No se encontró #step-2.");
            }
        }, 300); // Reducimos un poco el tiempo para una sensación más rápida.

        // --- Lógica para actualizar los límites de fotos ---
        const limits = APP_CONFIG.PLAN_LIMITS[selectedPlan];
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

            // Texto de límite eliminado - ahora se muestra en el cuadro de carga
        }
    });
});

/* === FUNCIÓN CORREGIDA Y FINAL PARA GESTIONAR LA RESTRICCIÓN VISUAL === */

const updatePlanRestrictions = (selectedPlan) => {
    console.log('🔍 DEBUG: updatePlanRestrictions called with plan:', selectedPlan);

    // RESTRICCIONES DE PLANES (Destacado)
    const planValue = selectedPlan.toLowerCase();
    console.log('🔍 DEBUG: planValue (lowercase):', planValue);

    // 1. RESTRICCIÓN PARA CAMPOS DE VIDEO (Destacado y Top)
    const videoFields = document.querySelectorAll('.plan-video-feature');
    console.log('🔍 DEBUG: Found videoFields:', videoFields.length);

    const enableVideo = planValue === 'destacado';
    const disableVideo = !enableVideo;
    console.log('🔍 DEBUG: enableVideo:', enableVideo, 'disableVideo:', disableVideo);

    videoFields.forEach(div => {
        div.style.opacity = disableVideo ? '0.4' : '1';
        div.style.pointerEvents = disableVideo ? 'none' : 'auto';

        const input = div.querySelector('input, select, textarea');
        if (input) input.disabled = disableVideo;
    });

    // 2. RESTRICCIÓN PARA CAMPOS de Publicación en Redes Sociales
    const topFields = document.querySelectorAll('.plan-top-feature');
    console.log('🔍 DEBUG: Found topFields:', topFields.length);

    const disableTop = planValue !== 'destacado'; // Solo se habilita si es el plan 'destacado'
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

    // Habilitado si el plan es 'destacado'
    const enableDestacado = planValue === 'destacado';
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
        
        // --- LIMPIAR IMÁGENES AL CAMBIAR DE PLAN ---
        // Limpiar imagen de portada
        const coverImageInput = document.getElementById('cover-image-input');
        if (coverImageInput) {
            coverImageInput.value = ''; // Limpiar el input file
            const coverPreview = document.getElementById('cover-image-preview');
            if (coverPreview) coverPreview.innerHTML = ''; // Limpiar preview
            const coverImageName = document.getElementById('cover-image-name');
            if (coverImageName) coverImageName.textContent = 'No se ha seleccionado imagen';
        }
        
        // Limpiar galería de imágenes
        const galleryImagesInput = document.getElementById('gallery-images-input');
        if (galleryImagesInput) {
            galleryImagesInput.value = ''; // Limpiar el input file
            const galleryPreviewContainer = document.getElementById('gallery-preview-container');
            if (galleryPreviewContainer) galleryPreviewContainer.innerHTML = ''; // Limpiar previews
        }
        console.log('✅ Imágenes limpiadas al cambiar de plan');
        // ----------------------------------------------
        
        // Navegar automáticamente al paso 2 (Detalles)
        setTimeout(() => {
            // Verificar autenticación antes de navegar
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                    navigateToStep(2); // Navegar al paso de Detalles
                } else {
                    showLoginRequiredModal(); // Mostrar modal de login
                }
            }).catch(err => {
                console.log("⚠️ Error al verificar sesión:", err.message);
                showLoginRequiredModal();
            });
        }, 500);
    });
});


// 2. Enlazar a la carga inicial de la página (para el plan preseleccionado)
const initialPlan = document.querySelector('input[name="plan"]:checked')?.value || 'free';
updatePlanRestrictions(initialPlan);
updateImageLimit();
}
