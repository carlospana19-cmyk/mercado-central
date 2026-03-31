// editar-anuncio-logic.js - VERSIÓN FINAL CON CAMPOS DE VEHÍCULO

import { supabase } from './supabase-client.js';
import { districtsByProvince } from './config-locations.js';

export function initializeEditPage() {
    const form = document.getElementById('edit-ad-form');
    if (!form) return;

    const safeStyle = (id, display) => { const el = document.getElementById(id); if (el) el.style.display = display; };

    const hideIfExist = (id) => safeStyle(id, 'none');

    // --- ELEMENTOS DEL DOM ---
    const allSteps = form.querySelectorAll('.form-section');
    const progressSteps = document.querySelectorAll('.step');
    const categorySelect = document.getElementById('category');
    const subcategoryGroup = document.getElementById('subcategory-group');
    const subcategorySelect = document.getElementById('subcategory');
    const provinceSelect = document.getElementById('province');
    const districtSelect = document.getElementById('district');

    /* --- SISTEMA DEFINITIVO DE GALERÍA ACUMULATIVA --- */
    const MAX_FILES = 10;
let currentImages = []; 
let newFiles = [];  
let currentCoverUrl = '';



    const galleryDropArea = document.getElementById('gallery-drop-area');
    const galleryImagesInput = document.getElementById('gallery-images-input');
    const galleryPreviewContainer = document.getElementById('gallery-preview-container');

    const renderPreviews = () => {
        if (!galleryPreviewContainer) return;
        galleryPreviewContainer.innerHTML = '';

        currentImages.forEach((url) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'preview-image-wrapper';
            wrapper.innerHTML = `<img src="${url}" class="preview-image"><button type="button" class="remove-image-btn" data-url="${url}">&times;</button>`;
            galleryPreviewContainer.appendChild(wrapper);
        });

        newFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'preview-image-wrapper';
                wrapper.innerHTML = `<img src="${e.target.result}" class="preview-image"><button type="button" class="remove-image-btn" data-index="${index}">&times;</button>`;
                galleryPreviewContainer.appendChild(wrapper);
            };
            reader.readAsDataURL(file);
        });
    };

    const addFiles = (files) => {
        const filesToAdd = Array.from(files);
        const totalActuales = currentImages.length + newFiles.length;
        if (totalActuales + filesToAdd.length > MAX_FILES) {
            alert("Solo puedes subir un máximo de " + MAX_FILES + " imágenes.");
            const slots = MAX_FILES - totalActuales;
            if (slots > 0) newFiles.push(...filesToAdd.slice(0, slots));
        } else {
            newFiles.push(...filesToAdd);
        }
        renderPreviews();
    };

    if (galleryDropArea && galleryImagesInput && galleryPreviewContainer) {
        galleryDropArea.addEventListener('click', () => galleryImagesInput.click());
        galleryImagesInput.addEventListener('change', (e) => {
            addFiles(e.target.files);
            e.target.value = null;
        });
        galleryPreviewContainer.addEventListener('click', (e) => {
            if (!e.target.classList.contains('remove-image-btn')) return;
            const imageUrl = e.target.dataset.url;
            const fileIndex = e.target.dataset.index;
            if (imageUrl) {
                if (confirm('¿Eliminar imagen?')) {
                    currentImages = currentImages.filter(img => img !== imageUrl);
                    renderPreviews();
                }
            } else if (fileIndex !== undefined) {
                newFiles.splice(parseInt(fileIndex), 1);
                renderPreviews();
            }
        });
    }  
    
    // --- REINSTALACIÓN DE PROVINCIAS Y DISTRITOS ---
    
    // 1. Llenar el selector de Provincias
    if (provinceSelect) {
        // Limpiamos por si acaso
        provinceSelect.innerHTML = '<option value="">Seleccione Provincia</option>';
        
        // Obtenemos las llaves del archivo config-locations.js
        Object.keys(districtsByProvince).forEach(province => {
            const option = document.createElement('option');
            option.value = province;
            option.textContent = province;
            provinceSelect.appendChild(option);
        });
    }

    // 2. Escuchar cuando cambie la provincia para mostrar los distritos
    if (provinceSelect && districtSelect) {
        provinceSelect.addEventListener('change', () => {
            const selectedProvince = provinceSelect.value;
            
            // Limpiar distritos actuales
            districtSelect.innerHTML = '<option value="">Seleccione Distrito</option>';
            
            if (selectedProvince && districtsByProvince[selectedProvince]) {
                safeStyle('district-group', 'block');
                
                // Llenar con los nuevos distritos
                districtsByProvince[selectedProvince].forEach(district => {
                    const option = document.createElement('option');
                    option.value = district;
                    option.textContent = district;
                    districtSelect.appendChild(option);
                });
            } else {
                safeStyle('district-group', 'none');
            }
        });
    }
    
    const coverImageInput = document.getElementById('cover-image-input');
    const coverImageName = document.getElementById('cover-image-name');

    // Botones de navegación eliminados - ahora es un solo paso
    const vehicleDetails = document.getElementById('vehicle-details');
    const realestateDetails = document.getElementById('realestate-details');
    const electronicsDetails = document.getElementById('electronics-details');
    const electronicsFields = document.getElementById('electronics-fields');
    const homeFurnitureDetails = document.getElementById('home-furniture-details');
    const homeFurnitureFields = document.getElementById('home-furniture-fields');
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
    let allCategories = [];
    let selectedMainCategory = '';
    let selectedSubcategory = '';
    let isLoadingAdData = false; // Flag para evitar reinicializar durante carga

    // --- Mapeo de categorías principales a placeholders ---
    const placeholderMap = {
        'Vehículos': (sub) => `Ej: Vendo ${sub || 'Vehículo'}, Como Nuevo`,
        'Inmuebles': (sub) => `Ej: Se Vende ${sub || 'Propiedad'} en [Ubicación]`,
        'Empleos y Servicios': (sub) => `Ej: Ofrezco Servicios de ${sub || 'Profesional'}`,
        'Servicios': (sub) => `Ej: ${sub || 'Servicio'} a Domicilio`,
        'Comunidad': (sub) => `Ej: ${sub || 'Anuncio de Comunidad'}`,
        'Mascotas': (sub) => `Ej: Adopción Responsable de ${sub || 'Mascota'}`,
        'Electrónica': (sub) => `Ej: ${sub || 'Artículo Electrónico'} en Buen Estado`,
        'Hogar y Muebles': (sub) => `Ej: Vendo ${sub || 'Mueble'} para Sala`,
        'Moda y Belleza': (sub) => `Ej: Vendo ${sub || 'Artículo de Moda'}, Talla M`,
        'Deportes y Hobbies': (sub) => `Ej: Vendo ${sub || 'Artículo Deportivo'}, Poco Uso`,
        'Negocios': (sub) => `Ej: Oportunidad de Inversión en ${sub || 'Negocio'}`
    };

    // --- DATOS DE DISTRITOS POR PROVINCIA ---
    // ✅ districtsByProvince importada desde config-locations.js

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

    // --- FUNCIONES AUXILIARES PARA EL PASO 3 ---
function showDynamicFields() {
    // Deshabilitar todos los inputs de secciones ocultas
    if (vehicleDetails) vehicleDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    if (realestateDetails) realestateDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    if (electronicsDetails) electronicsDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    if (homeFurnitureDetails) homeFurnitureDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    if (fashionDetails) fashionDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    if (sportsDetails) sportsDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    if (petsDetails) petsDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    if (servicesDetails) servicesDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    if (businessDetails) businessDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    if (communityDetails) communityDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);

    console.log('🔍 showDynamicFields - Categoría actual:', selectedMainCategory);
    const catLower = selectedMainCategory.toLowerCase();
    console.log('🔍 Categoría en minúsculas:', catLower);

    safeStyle('vehicle-details', 'none');
    safeStyle('realestate-details', 'none');
    safeStyle('electronics-details', 'none');
    safeStyle('home-furniture-details', 'none');
    safeStyle('fashion-details', 'none');
    safeStyle('sports-details', 'none');
    safeStyle('pets-details', 'none');
    safeStyle('services-details', 'none');
    safeStyle('business-details', 'none');
    safeStyle('community-details', 'none');

    if (catLower.includes('vehículo') || catLower.includes('auto') || catLower.includes('carro')) {
        safeStyle('vehicle-details', 'block');
        if (vehicleDetails) vehicleDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
    } else if (selectedMainCategory.toLowerCase().includes('inmueble') || selectedMainCategory.toLowerCase().includes('casa') || selectedMainCategory.toLowerCase().includes('apartamento')) {
        safeStyle('realestate-details', 'block');
        if (realestateDetails) realestateDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
    } else if (selectedMainCategory.toLowerCase().includes('electrónica')) {
        safeStyle('electronics-details', 'block');
        if (electronicsDetails) electronicsDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showElectronicsFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('hogar') || selectedMainCategory.toLowerCase().includes('mueble')) {
        safeStyle('vehicle-details', 'none');
        safeStyle('realestate-details', 'none');
        safeStyle('electronics-details', 'none');
        safeStyle('home-furniture-details', 'block');
        safeStyle('fashion-details', 'none');
        safeStyle('sports-details', 'none');
        safeStyle('pets-details', 'none');
        safeStyle('services-details', 'none');
        safeStyle('business-details', 'none');
        safeStyle('community-details', 'none');
        if (homeFurnitureDetails) homeFurnitureDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showHomeFurnitureFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('moda') || selectedMainCategory.toLowerCase().includes('belleza') || selectedMainCategory.toLowerCase().includes('ropa')) {
        safeStyle('vehicle-details', 'none');
        safeStyle('realestate-details', 'none');
        safeStyle('electronics-details', 'none');
        safeStyle('home-furniture-details', 'none');
        safeStyle('fashion-details', 'block');
        safeStyle('sports-details', 'none');
        safeStyle('pets-details', 'none');
        safeStyle('services-details', 'none');
        safeStyle('business-details', 'none');
        safeStyle('community-details', 'none');
        if (fashionDetails) fashionDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showFashionFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('deportes') || selectedMainCategory.toLowerCase().includes('hobbies')) {
        safeStyle('vehicle-details', 'none');
        safeStyle('realestate-details', 'none');
        safeStyle('electronics-details', 'none');
        safeStyle('home-furniture-details', 'none');
        safeStyle('fashion-details', 'none');
        safeStyle('sports-details', 'block');
        safeStyle('pets-details', 'none');
        safeStyle('services-details', 'none');
        safeStyle('business-details', 'none');
        safeStyle('community-details', 'none');
        if (sportsDetails) sportsDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showSportsFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('mascota')) {
        safeStyle('vehicle-details', 'none');
        safeStyle('realestate-details', 'none');
        safeStyle('electronics-details', 'none');
        safeStyle('home-furniture-details', 'none');
        safeStyle('fashion-details', 'none');
        safeStyle('sports-details', 'none');
        safeStyle('pets-details', 'block');
        safeStyle('services-details', 'none');
        safeStyle('business-details', 'none');
        safeStyle('community-details', 'none');
        if (petsDetails) petsDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showPetsFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('servicio')) {
        safeStyle('vehicle-details', 'none');
        safeStyle('realestate-details', 'none');
        safeStyle('electronics-details', 'none');
        safeStyle('home-furniture-details', 'none');
        safeStyle('fashion-details', 'none');
        safeStyle('sports-details', 'none');
        safeStyle('pets-details', 'none');
        safeStyle('services-details', 'block');
        safeStyle('business-details', 'none');
        safeStyle('community-details', 'none');
        if (servicesDetails) servicesDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showServicesFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('negocio')) {
        safeStyle('vehicle-details', 'none');
        safeStyle('realestate-details', 'none');
        safeStyle('electronics-details', 'none');
        safeStyle('home-furniture-details', 'none');
        safeStyle('fashion-details', 'none');
        safeStyle('sports-details', 'none');
        safeStyle('pets-details', 'none');
        safeStyle('services-details', 'none');
        safeStyle('business-details', 'block');
        safeStyle('community-details', 'none');
        if (businessDetails) businessDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showBusinessFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('comunidad')) {
        safeStyle('vehicle-details', 'none');
        safeStyle('realestate-details', 'none');
        safeStyle('electronics-details', 'none');
        safeStyle('home-furniture-details', 'none');
        safeStyle('fashion-details', 'none');
        safeStyle('sports-details', 'none');
        safeStyle('pets-details', 'none');
        safeStyle('services-details', 'none');
        safeStyle('business-details', 'none');
        safeStyle('community-details', 'block');
        if (communityDetails) communityDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showCommunityFields();
        }
    } else {
        safeStyle('vehicle-details', 'none');
        safeStyle('realestate-details', 'none');
        safeStyle('electronics-details', 'none');
        safeStyle('home-furniture-details', 'none');
        safeStyle('fashion-details', 'none');
        safeStyle('sports-details', 'none');
        safeStyle('pets-details', 'none');
        safeStyle('services-details', 'none');
        safeStyle('business-details', 'none');
        safeStyle('community-details', 'none');
    }
}

    function showElectronicsFields() {
        const fields = electronicsSubcategories[selectedSubcategory];
        if (!fields) {
            console.log('No fields found for subcategory:', selectedSubcategory);
            return;
        }

        console.log('Showing fields for subcategory:', selectedSubcategory, fields);

        // PRIORIDAD #1: Asegurar visibilidad del contenedor principal
        safeStyle('electronics-details', 'block');
        if (electronicsDetails) {
            electronicsDetails.style.padding = '20px';
            electronicsDetails.style.marginTop = '20px';
            electronicsDetails.style.backgroundColor = '#f8f9fa';
        }

        // PRIORIDAD #2: Limpiar el contenedor de campos
        if (electronicsFields) electronicsFields.innerHTML = ''; 

        // PRIORIDAD #3: Añadir título descriptivo
        const titleDiv = document.createElement('div');
        titleDiv.innerHTML = `<h4 style="color: var(--color-primario); margin-bottom: 20px; text-align: center;">Especificaciones para ${selectedSubcategory}</h4>`;
        electronicsFields.appendChild(titleDiv);

        fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-group';

            let labelText = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            let inputType = 'text';
            let placeholder = '';

            if (field === 'tipo_computadora') {
                labelText = 'Tipo de Computadora';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Escritorio">Escritorio</option>
                `;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(select);
            } else if (field === 'plataforma') {
                labelText = 'Plataforma';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="PlayStation">PlayStation</option>
                    <option value="Xbox">Xbox</option>
                    <option value="Nintendo">Nintendo</option>
                    <option value="PC">PC</option>
                    <option value="Otra">Otra</option>
                `;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(select);
            } else if (field === 'tipo_articulo') {
                labelText = 'Tipo de Artículo';
                const select = document.createElement('select');
                select.id = `attr-${field}`;
                select.name = field;
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="TV">TV</option>
                    <option value="Auricular">Auricular</option>
                    <option value="Parlante">Parlante</option>
                    <option value="Cámara">Cámara</option>
                    <option value="Lente">Lente</option>
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
                    <option value="Usado - Como Nuevo">Usado - Como Nuevo</option>
                    <option value="Usado - Bueno">Usado - Bueno</option>
                    <option value="Usado - Aceptable">Usado - Aceptable</option>
                    <option value="Para Repuestos">Para Repuestos</option>
                `;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
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

            if (field !== 'tipo_computadora' && field !== 'plataforma' && field !== 'tipo_articulo' && field !== 'condicion') {
                const input = document.createElement('input');
                input.type = inputType;
                input.id = `attr-${field}`;
                input.name = field;
                input.placeholder = placeholder;
                fieldDiv.appendChild(document.createElement('label')).textContent = labelText;
                fieldDiv.appendChild(input);
            }

            electronicsFields.appendChild(fieldDiv);
        });
    }

    function showHomeFurnitureFields() {
        const fields = homeFurnitureSubcategories[selectedSubcategory];
        if (!fields) {
            console.log('No fields found for subcategory:', selectedSubcategory);
            return;
        }

        console.log('Showing fields for subcategory:', selectedSubcategory, fields);

        safeStyle('home-furniture-details', 'block');
        if (homeFurnitureFields) homeFurnitureFields.innerHTML = '';

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
                select.innerHTML = `
                    <option value="">Selecciona</option>
                    <option value="Mesa">Mesa</option>
                    <option value="Silla">Silla</option>
                    <option value="Utensilio">Utensilio</option>
                    <option value="Herramienta">Herramienta</option>
                    <option value="Otro">Otro</option>
                `;
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

    // --- LÓGICA DE CARGA DE DATOS (VERSIÓN CORREGIDA) ---
    async function loadAdData(categories) {
        isLoadingAdData = true; // ✅ Activar flag para evitar disparar eventos change
        
        const urlParams = new URLSearchParams(window.location.search);
        const adId = urlParams.get('id');
        if (!adId) {
            alert("ID de anuncio no encontrado. Volviendo al panel.");
            window.location.href = 'panel-unificado.html';
            return;
        }

        // 1. OBTENER DATOS DEL ANUNCIO PRINCIPAL
        const { data: ad, error } = await supabase
            .from('anuncios')
            .select('*')
            .eq('id', adId)
            .single();

        if (error) {
            alert("Error al cargar los datos del anuncio.");
            console.error(error);
            return;
        }

        // Guardar URL de portada actual como respaldo
        currentCoverUrl = ad.url_portada || '';


        // Guardar temporalmente la categoría y subcategoría en sessionStorage
        window.sessionStorage.setItem('editAdCategory', ad.categoria || '');
        window.sessionStorage.setItem('editAdSubcategory', ad.subcategoria || '');



// --- EL SÚPER RADAR: ESPERAR A QUE CARGUEN LAS CATEGORÍAS PRIMERO ---
        const categorySelect = document.getElementById('category');

        // 1. Radar para Categoría Principal
        let intentosCat = 0;
        const radarCategorias = setInterval(() => {
            intentosCat++;
            
            // Si el select de categorías ya tiene opciones (más allá del "Selecciona...")
            if (categorySelect && categorySelect.options.length > 1) {
                clearInterval(radarCategorias); // ¡Las categorías ya llegaron! Detenemos este radar
                
                let catFound = false;
                // Buscar y seleccionar la Categoría Principal
                for (let i = 0; i < categorySelect.options.length; i++) {
                    if (categorySelect.options[i].text === ad.categoria || categorySelect.options[i].value === ad.categoria) {
                        categorySelect.selectedIndex = i;
                        catFound = true;
                        console.log(`✅ Categoría principal anclada: ${ad.categoria}`);
                        break;
                    }
                }

                if (catFound) {
                    // Disparar el cambio para que el sistema busque las subcategorías
                    categorySelect.dispatchEvent(new Event('change')); 
                    
                    // 2. RADAR ACTIVO para Subcategorías
                    let intentosSub = 0;
                    const radarSubcategorias = setInterval(() => {
                        const subSelect = document.getElementById('subcategory');
                        intentosSub++;
                        
                        if (subSelect && subSelect.options.length > 1) {
                            clearInterval(radarSubcategorias); // ¡Las subcategorías ya llegaron!
                            
                            // Buscar y seleccionar la Subcategoría
                            for (let i = 0; i < subSelect.options.length; i++) {
                                if (subSelect.options[i].text === ad.subcategoria || subSelect.options[i].value === ad.subcategoria) {
                                    subSelect.selectedIndex = i;
                                    console.log(`✅ Subcategoría anclada: ${ad.subcategoria}`);
                                    break;
                                }
                            }
                            
                            // Disparar el cambio para mostrar los atributos de Vehículos
                            subSelect.dispatchEvent(new Event('change'));
                            
                            // 3. Dar un pequeño respiro para los campos dinámicos
                            setTimeout(() => {
                                if(ad.atributos_clave) {
                                    try {
                                        let atributos = typeof ad.atributos_clave === 'string' ? JSON.parse(ad.atributos_clave) : ad.atributos_clave;
                                        Object.keys(atributos).forEach(key => {
                                            const input = document.getElementById(`attr-${key}`) || document.querySelector(`[name="${key}"]`);
                                            if(input) {
                                                input.value = atributos[key];
                                                console.log(`✅ Atributo cargado: ${key} = ${atributos[key]}`);
                                            }
                                        });
                                    } catch (e) {
                                        console.error("Error parseando atributos:", e);
                                    }
                                }
                                
// --- FIX FINAL DE TITANIO: FORZAR VISTA (DOM) CON ESCUDO ANTICHOQUES ---
                                setTimeout(() => {
                                    const subSelectFinal = document.getElementById('subcategory');
                                    if (!subSelectFinal) return;
                                    
                                    // 🛡️ ESCUDO: Verificamos que ad.subcategoria exista antes de hacer nada
                                    if (!ad.subcategoria) {
                                        console.warn("⚠️ ALERTA: ad.subcategoria es null o undefined. No hay subcategoría guardada para este anuncio en la BD.");
                                        return; // Abortamos la misión pacíficamente sin estrellar el código
                                    }

                                    // Convertimos a String por seguridad antes del trim
                                    const targetSub = String(ad.subcategoria).trim().toLowerCase();
                                    
                                    // 1. Limpiamos cualquier selección previa a nivel HTML
                                    for (let j = 0; j < subSelectFinal.options.length; j++) {
                                        subSelectFinal.options[j].selected = false;
                                        subSelectFinal.options[j].removeAttribute('selected');
                                    }

                                    // 2. Buscamos y forzamos la nueva opción
                                    for (let i = 0; i < subSelectFinal.options.length; i++) {
                                        const optText = String(subSelectFinal.options[i].text || '').trim().toLowerCase();
                                        const optVal = String(subSelectFinal.options[i].value || '').trim().toLowerCase();
                                        
                                        if (optText === targetSub || optVal === targetSub) {
                                            // Fuerza bruta en todos los niveles de JS y HTML
                                            subSelectFinal.selectedIndex = i;
                                            subSelectFinal.value = subSelectFinal.options[i].value;
                                            subSelectFinal.options[i].selected = true;
                                            subSelectFinal.options[i].setAttribute('selected', 'selected');
                                            
                                            console.log(`⚓ ÉXITO VISUAL: Subcategoría fijada a: ${subSelectFinal.options[i].text}`);
                                            
                                            // Si la plantilla usa plugins visuales:
                                            if (typeof jQuery !== 'undefined' && jQuery.fn.niceSelect) {
                                                jQuery(subSelectFinal).niceSelect('update');
                                            }
                                            if (typeof jQuery !== 'undefined' && jQuery.fn.select2) {
                                                jQuery(subSelectFinal).trigger('change.select2');
                                            }
                                            break;
                                        }
                                    }
                                }, 800);
                                
                            }, 500); 
                            
                        } else if (intentosSub > 40) {
                            clearInterval(radarSubcategorias);
                            console.warn("⏳ Radar apagado: Las subcategorías no cargaron a tiempo.");
                        }
                    }, 100);
                } else {
                    console.warn(`⚠️ La categoría "${ad.categoria}" no existe en las opciones cargadas.`);
                }
            } else if (intentosCat > 50) {
                clearInterval(radarCategorias); // Si después de 5 segundos no cargan las categorías, abortar.
                console.warn("⏳ Radar apagado: Las categorías principales nunca cargaron.");
            }
        }, 100);

        // Rellenar campos básicos (mantener existentes)
        document.getElementById('title').value = ad.titulo;
        document.getElementById('description').value = ad.descripcion;
        document.getElementById('price').value = ad.precio;

        // Rellenar ubicación (mantener existente)
        if (ad.provincia) {
            document.getElementById('province').value = ad.provincia;
            document.getElementById('province').dispatchEvent(new Event('change'));
            setTimeout(() => {
                if (ad.distrito) document.getElementById('district').value = ad.distrito;
            }, 100);
        }
       // AGREGA ESTO EN SU LUGAR
if (ad.latitud && ad.longitud) {
    inicializarMapaEdicion(ad.latitud, ad.longitud);
}

        // ✅ Rellenar campos de contacto (mantener existente)
        if (ad.contact_name) {
            const contactNameField = document.getElementById('contact-name');
            if (contactNameField) contactNameField.value = ad.contact_name;
        }
        if (ad.contact_phone) {
            const contactPhoneField = document.getElementById('contact-phone');
            if (contactPhoneField) contactPhoneField.value = ad.contact_phone;
        }
        if (ad.contact_email) {
            const contactEmailField = document.getElementById('contact-email');
            if (contactEmailField) contactEmailField.value = ad.contact_email;
        }

// --- CARGA DE GALERÍA EXISTENTE ---
if (ad.url_galeria && Array.isArray(ad.url_galeria) && ad.url_galeria.length > 0) {
    currentImages = [...ad.url_galeria]; 
    renderPreviews(); 
} else {
    currentImages = []; 
    if (galleryPreviewContainer) galleryPreviewContainer.innerHTML = ''; 
}

        // ✅ MOSTRAR IMAGEN DE PORTADA ACTUAL (mantener existente)
        if (ad.url_portada) {
            const currentCoverWrapper = document.getElementById('current-cover-image');
            const coverPreviewImg = document.getElementById('cover-image-preview');
            if (currentCoverWrapper && coverPreviewImg) {
                coverPreviewImg.src = ad.url_portada;
                currentCoverWrapper.style.display = 'block';
            }
        }

        // --- SISTEMA DE MAPAS EN EL EDITOR (Arranque Seguro) ---
        function cargarMapaEditor(lat, lng) {
            const mapaElemento = document.getElementById('map');
            if (!mapaElemento) return;

            // Si la librería de Google aún no carga, esperamos 500ms y reintentamos
            if (typeof google === 'undefined' || !google.maps) {
                console.log("⏳ Esperando a Google Maps...");
                setTimeout(() => cargarMapaEditor(lat, lng), 500);
                return;
            }

            const defaultLat = lat ? parseFloat(lat) : 8.9824; 
            const defaultLng = lng ? parseFloat(lng) : -79.5199;

            const map = new google.maps.Map(mapaElemento, {
                center: { lat: defaultLat, lng: defaultLng },
                zoom: 15
            });

            const marker = new google.maps.Marker({
                position: { lat: defaultLat, lng: defaultLng },
                map: map,
                draggable: true
            });

            // Aseguramos que el mapa se redibuje si estaba oculto
            google.maps.event.trigger(map, "resize");

            marker.addListener('dragend', function() {
                const newPos = marker.getPosition();
                document.getElementById('latitud').value = newPos.lat();
                document.getElementById('longitud').value = newPos.lng();
                console.log("📍 Ubicación actualizada:", newPos.lat(), newPos.lng());
            });

            // --- LÓGICA DE MOVIMIENTO CORREGIDA ---
            // Intentamos capturar los selectores (probamos ambos idiomas por si acaso)
            const provSelect = document.getElementById('province') || document.getElementById('provincia');
            const distSelect = document.getElementById('district') || document.getElementById('distrito');

            if (provSelect && distSelect) {
                console.log("✅ Selectores de ubicación detectados. Conectando con el mapa...");
                
                const geocoder = new google.maps.Geocoder();

                const moverMapaALocalidad = () => {
                    const p = provSelect.options[provSelect.selectedIndex]?.text || "";
                    const d = distSelect.options[distSelect.selectedIndex]?.text || "";
                    
                    // Si el usuario aún no ha seleccionado nada real, no movemos
                    if (p === "" || p.toLowerCase().includes("seleccione")) return;

                    const direccionBusqueda = `${d}, ${p}, Panama`;
                    console.log("🔍 Buscando en el mapa:", direccionBusqueda);

                    geocoder.geocode({ address: direccionBusqueda }, (results, status) => {
                        if (status === "OK" && results[0]) {
                            map.setCenter(results[0].geometry.location);
                            marker.setPosition(results[0].geometry.location);
                            map.setZoom(13); // Zoom de ciudad
                            
                            // Actualizamos los inputs ocultos con la nueva posición
                            document.getElementById('latitud').value = results[0].geometry.location.lat();
                            document.getElementById('longitud').value = results[0].geometry.location.lng();
                        } else {
                            console.error("❌ Google Maps no encontró la ubicación:", status);
                        }
                    });
                };

                // Escuchamos el cambio en ambos selectores
                provSelect.addEventListener('change', moverMapaALocalidad);
                distSelect.addEventListener('change', moverMapaALocalidad);
            } else {
                console.warn("⚠️ No se encontraron los selectores 'province/provincia' o 'district/distrito' en el HTML.");
            }
        }

        cargarMapaEditor(ad.latitud, ad.longitud);

        isLoadingAdData = false; // ✅ Desactivar flag - carga completada
    }

    // --- FUNCIÓN PARA GUARDAR CAMBIOS DEL ANUNCIO (CON GALERÍA) ---
    async function saveEditedAd() {
        const saveButton = document.getElementById('btn-save-edit');
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = 'Guardando...';
        }

        const urlParams = new URLSearchParams(window.location.search);
        const adId = urlParams.get('id');
        if (!adId) {
            alert("ID de anuncio no encontrado. No se pueden guardar los cambios.");
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = 'Guardar cambios';
            }
            return;
        }

        const formData = new FormData(form);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Error de sesión.");
            return;
        }

        const adIdNum = Number(adId);
        if (isNaN(adIdNum)) {
            alert('ID de anuncio inválido.');
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = 'Guardar cambios';
            }
            return;
        }

        // Clean data object with only DB-confirmed fields
        const updateData = {
            titulo: formData.get('titulo') || '',
            descripcion: formData.get('descripcion') || '',
            precio: parseInt(formData.get('precio'), 10) || 0,
            categoria: selectedMainCategory || '',
            subcategoria: selectedSubcategory || '',
            provincia: formData.get('provincia') || '',
            distrito: formData.get('distrito') || '',
            latitud: document.getElementById('latitud')?.value || null,
            longitud: document.getElementById('longitud')?.value || null,
            url_portada: null,
            url_galeria: []
        };

        // Build atributos_clave from dynamic fields
        const attrs = buildUnifiedAttributesJSON(formData, selectedMainCategory, selectedSubcategory);
        if (attrs && Object.keys(attrs).length > 0) {
            updateData.atributos_clave = JSON.stringify(attrs);
        }

        // === NUEVA LÓGICA DE GALERÍA ===
        let uploadedUrls = [];

        // 1. Subir newFiles a 'imagenes_anuncios'
        if (newFiles.length > 0) {
            const uploadPromises = newFiles.map(async (file) => {
                const fileExt = file.name.split('.').pop();
                const timestamp = Date.now();
                const randomStr = Math.random().toString(36).substr(2, 9);
                const fileName = `${user.id}/${timestamp}-${randomStr}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('imagenes_anuncios')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('imagenes_anuncios')
                    .getPublicUrl(fileName);

                return publicUrl;
            });

            try {
                uploadedUrls = await Promise.all(uploadPromises);
                console.log(`✅ ${uploadedUrls.length} nuevas fotos subidas`);
            } catch (error) {
                console.error('Error subiendo fotos:', error);
                alert('Error subiendo imágenes de galería.');
                if (saveButton) {
                    saveButton.disabled = false;
                    saveButton.textContent = 'Guardar cambios';
                }
                return;
            }
        }

        // 2. Clean gallery array
        updateData.url_galeria = [...currentImages, ...uploadedUrls];

        // Lógica de portada con respaldo
        let finalCoverUrl = currentCoverUrl;

        // === PORTADA ===
        const coverImageInput = document.getElementById('cover-image-input');
        const coverImageFile = coverImageInput?.files[0];

        if (coverImageFile) {
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substr(2, 9);
            const cleanName = coverImageFile.name.split('.')[0];
            const fileName = `${user.id}/${timestamp}-${randomStr}-${cleanName}.${coverImageFile.name.split('.').pop()}`;
            const { error: uploadError } = await supabase.storage
                .from('imagenes_anuncios')
                .upload(fileName, coverImageFile);

            if (uploadError) {
                console.error('Error portada:', uploadError);
                alert('Error subiendo portada.');
                if (saveButton) {
                    saveButton.disabled = false;
                    saveButton.textContent = 'Guardar cambios';
                }
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('imagenes_anuncios')
                .getPublicUrl(fileName);

            finalCoverUrl = publicUrl;
        }

        updateData.url_portada = finalCoverUrl;

        // Debug log
        console.log('DATOS A ENVIAR:', updateData);

        // === UPDATE SUPABASE ===
        const { error: updateError } = await supabase
            .from('anuncios')
            .update(updateData)
            .eq('id', adIdNum);

        if (updateError) {
            console.error('Error update:', updateError);
            alert('Error guardando cambios.');
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = 'Guardar cambios';
            }
            return;
        }

        // Reset gallery state
        currentImages = updateData.url_galeria;
        newFiles = [];


        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = 'Guardar cambios';
        }

        alert('¡Anuncio actualizado correctamente con galería!');
        window.location.href = `panel-unificado.html`;
    }

    // --- LÓGICA DE CATEGORÍAS ---
    async function loadAllCategories() {
        const { data, error } = await supabase.from('categorias').select('id, nombre, parent_id');
        if (error) { console.error("Error al cargar categorías:", error); return []; }
        allCategories = data;

        const mainCategories = allCategories.filter(c => c.parent_id === null);
        categorySelect.innerHTML = '<option value="" disabled>Selecciona una categoría</option>';
        mainCategories.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.nombre;
            categorySelect.appendChild(option);
        });

        // ✅ Al final de loadAllCategories()
        // No hacer nada aquí - dejar que loadAdData() maneje la precarga
        
        return allCategories; // Devolvemos los datos para usarlos después
    }

    // --- SECUENCIA DE INICIALIZACIÓN ---
    async function initialize() {
        const categories = await loadAllCategories();
        if (categories) {
            await loadAdData(categories);
        }

        // === IA CREDITS LOAD + BUTTON HANDLER ===
        const user = await supabase.auth.getUser();
        if (user.data.user) {
            const { data: suscripcion } = await supabase
                .from('suscripciones')
                .select('optimizations_ia_usadas, limite_ia')
                .eq('user_id', user.data.user.id)
                .single();

            const counter = document.getElementById('ia-credits-counter');
            const btnIA = document.getElementById('btn-ia-optimize');
            if (counter && suscripcion) {
                const restantes = suscripcion.limite_ia - suscripcion.optimizations_ia_usadas;
                counter.textContent = `${restantes} créditos IA`;
                if (restantes === 0) {
                    btnIA.disabled = true;
                }
            }
        }

        // IA button handler (editar-anuncio version)
        document.getElementById('btn-ia-optimize')?.addEventListener('click', async () => {
            const tituloInput = document.getElementById('title');
            const descInput = document.getElementById('description');
            if (!tituloInput.value || !descInput.value) {
                alert('Escribe título y descripción primero.');
                return;
            }

            // Check suscripciones
            const { data: { user } } = await supabase.auth.getUser();
            if (!user.data.user) {
                alert('Debes iniciar sesión.');
                return;
            }

            const { data: suscripcion } = await supabase
                .from('suscripciones')
                .select('optimizations_ia_usadas, limite_ia')
                .eq('user_id', user.data.user.id)
                .single();

            if (!suscripcion || suscripcion.optimizations_ia_usadas >= suscripcion.limite_ia) {
                alert("Has agotado tus optimizaciones de IA de tu plan actual.");
                return;
            }

            // Fetch Python IA
            try {
const response = await fetch('http://127.0.0.1:5001/optimizar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        titulo: tituloInput.value,
                        descripcion: descInput.value
                    })
                });

                const data = await response.json();
                if (data.titulo && data.descripcion) {
                    tituloInput.value = data.titulo;
                    descInput.value = data.descripcion;

                    // Increment in suscripciones
                    await supabase
                        .from('suscripciones')
                        .update({ optimizations_ia_usadas: suscripcion.optimizations_ia_usadas + 1 })
                        .eq('user_id', user.data.user.id);

                    // Update UI
                    const restantes = suscripcion.limite_ia - (suscripcion.optimizations_ia_usadas + 1);
                    const counter = document.getElementById('ia-credits-counter');
                    const btnIA = document.getElementById('btn-ia-optimize');
                    if (counter) counter.textContent = `${restantes} créditos IA`;
                    if (restantes === 0) {
                        btnIA.disabled = true;
                    }
                    
                    alert('¡Anuncio optimizado con IA!');
                } else {
                    alert('Error en la optimización. Intenta de nuevo.');
                }
            } catch (error) {
                console.error('Python IA error:', error);
                alert('Error conectando con IA. Verifica que el servidor Python esté corriendo.');
            }
        });
    }

    initialize();

    // --- EVENT LISTENER PARA EL BOTÓN DE GUARDAR CAMBIOS ---
    const saveBtn = document.getElementById('btn-save-edit');
    if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await saveEditedAd();
        });
    }

    // --- EVENT LISTENERS ---
    const titleInput = document.getElementById('title');

    categorySelect.addEventListener('change', () => {
        // ✅ NO reinicializar si estamos cargando datos
        if (isLoadingAdData) {
            console.log('ℹ️ Ignorando change event durante carga de datos');
            return;
        }

        const parentId = parseInt(categorySelect.value, 10);
        selectedMainCategory = allCategories.find(c => c.id === parentId)?.nombre || '';
        console.log('🔄 Category changed via event. Selected:', selectedMainCategory, 'ID:', parentId);
        const subcategories = allCategories.filter(c => c.parent_id === parentId);
        if (subcategories.length > 0) {
            safeStyle('subcategory-group', 'block');
            subcategorySelect.innerHTML = '<option value="">Selecciona</option>';
            subcategories.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.nombre;
                opt.textContent = s.nombre;
                subcategorySelect.appendChild(opt);
            });
        } else {
            safeStyle('subcategory-group', 'none');
        }

        // Mostrar campos dinámicos inmediatamente al cambiar categoría
        showDynamicFields();

        // Actualizar placeholder del título
        if (titleInput) {
            let currentPlaceholder = 'Ej: Título descriptivo de tu anuncio';
            if (selectedMainCategory && placeholderMap[selectedMainCategory]) {
                currentPlaceholder = placeholderMap[selectedMainCategory]('');
            }
            titleInput.placeholder = currentPlaceholder;
        }
    });

    subcategorySelect.addEventListener('change', function() {
        selectedSubcategory = this.value;
        console.log('Subcategory changed to:', selectedSubcategory);

        if (selectedMainCategory.toLowerCase().includes('electrónica')) {
            showElectronicsFields();
        } else if (selectedMainCategory.toLowerCase().includes('hogar') || selectedMainCategory.toLowerCase().includes('mueble')) {
            showHomeFurnitureFields();
        } else if (selectedMainCategory.toLowerCase().includes('moda') || selectedMainCategory.toLowerCase().includes('belleza') || selectedMainCategory.toLowerCase().includes('ropa')) {
            showFashionFields();
        } else if (selectedMainCategory.toLowerCase().includes('deportes') || selectedMainCategory.toLowerCase().includes('hobbies')) {
            showSportsFields();
        } else if (selectedMainCategory.toLowerCase().includes('mascota')) {
            showPetsFields();
        } else if (selectedMainCategory.toLowerCase().includes('servicio')) {
            showServicesFields();
        } else if (selectedMainCategory.toLowerCase().includes('negocio')) {
            showBusinessFields();
        } else if (selectedMainCategory.toLowerCase().includes('comunidad')) {
            showCommunityFields();
        }

        // Actualizar placeholder del título basado en subcategoría
        if (titleInput && selectedMainCategory && placeholderMap[selectedMainCategory]) {
            titleInput.placeholder = placeholderMap[selectedMainCategory](selectedSubcategory);
        }
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
            safeStyle('district-group', 'block');
        } else {
            safeStyle('district-group', 'none');
            districtSelect.innerHTML = '';
        }
    });



    // Event listener para portada
    coverImageInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            coverImageName.textContent = file.name;
        } else {
            coverImageName.textContent = 'Ningún archivo seleccionado.';
            }
    });

    // NAVEGACIÓN ELIMINADA - Ahora es un solo paso, no se necesita navegación


    // ✅ FUNCIÓN UNIFICADA PARA TODAS LAS CATEGORÍAS
    function buildUnifiedAttributesJSON(formData, mainCategory, subcategory) {
        const json = {};
        
        // Agregar subcategoría si existe
        if (subcategory) {
            json.subcategoria = subcategory;
        }
        
        // CAPTURAR AUTOMÁTICAMENTE TODOS LOS CAMPOS DINÁMICOS VISIBLES
        // Buscar todos los inputs/selects dentro de contenedores con display visibles
        
        const dynamicContainers = [
            'vehicle-details',
            'realestate-details', 
            'electronics-details',
            'home-furniture-details',
            'fashion-details',
            'sports-details',
            'pets-details',
            'services-details',
            'business-details',
            'community-details'
        ];
        
        dynamicContainers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container && container.style.display !== 'none') {
                // Buscar todos los inputs y selects dentro de este contenedor
                const inputs = container.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    const fieldName = input.name;
                    const fieldValue = input.value;
                    
                    if (fieldName && fieldValue && fieldValue.trim() !== '') {
                        // Convertir a número si es posible (para campos numéricos)
                        if (input.type === 'number' && fieldValue) {
                            json[fieldName] = parseInt(fieldValue);
                        } else {
                            json[fieldName] = fieldValue;
                        }
                    }
                });
            }
        });
        
        console.log('🟢 JSON UNIFICADO CONSTRUIDO:', json);
        return Object.keys(json).length > 0 ? json : null;
    }

    // ✅ FUNCIÓN UNIFICADA PARA RELLENAR CAMPOS DE ATRIBUTOS
    // --- FUNCIÓN DE NAVEGACIÓN ELIMINADA - Ahora es un solo paso ---
    // Los campos dinámicos se muestran automáticamente al cambiar la categoría
}
// --- FUNCIÓN QUE ESTABA FALTANDO ---
function inicializarMapaEdicion(latOriginal, lngOriginal) {
    const centroInicial = { 
        lat: parseFloat(latOriginal) || 8.9824, 
        lng: parseFloat(lngOriginal) || -79.5199 
    };

    const mapa = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: centroInicial,
        mapTypeControl: false,
        streetViewControl: false
    });

    const marcador = new google.maps.Marker({
        position: centroInicial,
        map: mapa,
        draggable: true,
        animation: google.maps.Animation.DROP
    });

    // Guardar coordenadas actuales en los inputs ocultos
    document.getElementById('latitud').value = centroInicial.lat;
    document.getElementById('longitud').value = centroInicial.lng;

    // Actualizar coordenadas al arrastrar el pin
    marcador.addListener('dragend', function() {
        const posicion = marcador.getPosition();
        document.getElementById('latitud').value = posicion.lat();
        document.getElementById('longitud').value = posicion.lng();
    });

    // Mover mapa al cambiar Provincia/Distrito
    const provSelect = document.getElementById('province');
    const distSelect = document.getElementById('district');

    if (provSelect && distSelect) {
        const geocoder = new google.maps.Geocoder();
        const moverMapa = () => {
            const p = provSelect.options[provSelect.selectedIndex]?.text || "";
            const d = distSelect.options[distSelect.selectedIndex]?.text || "";
            const busqueda = `${d}, ${p}, Panama`;

            geocoder.geocode({ address: busqueda }, (results, status) => {
                if (status === "OK") {
                    mapa.setCenter(results[0].geometry.location);
                    marcador.setPosition(results[0].geometry.location);
                    document.getElementById('latitud').value = results[0].geometry.location.lat();
                    document.getElementById('longitud').value = results[0].geometry.location.lng();
                }
            });
        };
        provSelect.addEventListener('change', moverMapa);
        distSelect.addEventListener('change', moverMapa);
    }
}