// editar-anuncio-logic.js - VERSIÓN FINAL CON CAMPOS DE VEHÍCULO

import { supabase } from './supabase-client.js';
import { districtsByProvince } from './config-locations.js';

export function initializeEditPage() {
    const form = document.getElementById('edit-ad-form');
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
    const coverImageInput = document.getElementById('cover-image-input');
    const coverImageName = document.getElementById('cover-image-name');
    const galleryDropArea = document.getElementById('gallery-drop-area');
    const galleryImagesInput = document.getElementById('gallery-images-input');
    const galleryPreviewContainer = document.getElementById('gallery-preview-container');
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

    let galleryFiles = [];

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

    console.log('🔍 showDynamicFields - Categoría actual:', selectedMainCategory);
    const catLower = selectedMainCategory.toLowerCase();
    console.log('🔍 Categoría en minúsculas:', catLower);

    if (catLower.includes('vehículo') || catLower.includes('auto') || catLower.includes('carro')) {
        vehicleDetails.style.display = 'block';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'none';
        fashionDetails.style.display = 'none';
        sportsDetails.style.display = 'none';
        petsDetails.style.display = 'none';
        servicesDetails.style.display = 'none';
        businessDetails.style.display = 'none';
        communityDetails.style.display = 'none';
        vehicleDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
    } else if (selectedMainCategory.toLowerCase().includes('inmueble') || selectedMainCategory.toLowerCase().includes('casa') || selectedMainCategory.toLowerCase().includes('apartamento')) {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'block';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'none';
        fashionDetails.style.display = 'none';
        sportsDetails.style.display = 'none';
        petsDetails.style.display = 'none';
        servicesDetails.style.display = 'none';
        businessDetails.style.display = 'none';
        communityDetails.style.display = 'none';
        realestateDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
    } else if (selectedMainCategory.toLowerCase().includes('electrónica')) {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'block';
        homeFurnitureDetails.style.display = 'none';
        fashionDetails.style.display = 'none';
        sportsDetails.style.display = 'none';
        petsDetails.style.display = 'none';
        servicesDetails.style.display = 'none';
        businessDetails.style.display = 'none';
        communityDetails.style.display = 'none';
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
        sportsDetails.style.display = 'none';
        petsDetails.style.display = 'none';
        servicesDetails.style.display = 'none';
        businessDetails.style.display = 'none';
        communityDetails.style.display = 'none';
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
        const fields = electronicsSubcategories[selectedSubcategory];
        if (!fields) {
            console.log('No fields found for subcategory:', selectedSubcategory);
            return;
        }

        console.log('Showing fields for subcategory:', selectedSubcategory, fields);

        // PRIORIDAD #1: Asegurar visibilidad del contenedor principal
        electronicsDetails.style.display = 'block';
        electronicsDetails.style.padding = '20px';
        electronicsDetails.style.marginTop = '20px';
        electronicsDetails.style.backgroundColor = '#f8f9fa';

        // PRIORIDAD #2: Limpiar el contenedor de campos
        electronicsFields.innerHTML = '';

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

        // Guardar temporalmente la categoría y subcategoría en sessionStorage
        window.sessionStorage.setItem('editAdCategory', ad.categoria || '');
        window.sessionStorage.setItem('editAdSubcategory', ad.subcategoria || '');

        // 2. OBTENER IMÁGENES DE LA GALERÍA DESDE LA TABLA 'imagenes'
        const { data: images, error: imagesError } = await supabase
            .from('imagenes')
            .select('url_imagen')
            .eq('anuncio_id', adId);

        if (imagesError) {
            console.error("Error al cargar imágenes de la galería:", imagesError);
        }

        // Rellenar campos básicos
        document.getElementById('title').value = ad.titulo;
        document.getElementById('description').value = ad.descripcion;
        document.getElementById('price').value = ad.precio;

        // Rellenar ubicación
        if (ad.provincia) {
            document.getElementById('province').value = ad.provincia;
            document.getElementById('province').dispatchEvent(new Event('change'));
            setTimeout(() => {
                if (ad.distrito) document.getElementById('district').value = ad.distrito;
            }, 100);
        }
        if (ad.direccion_especifica) {
            document.getElementById('address').value = ad.direccion_especifica;
        }

        // ✅ Rellenar campos de contacto (datos del usuario que publicó)
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

// 5. RELLENAR CATEGORÍAS — versión completa estable final
const normalize = (s) =>
  s?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

if (Array.isArray(categories) && categories.length) {
  const categorySelect = document.getElementById("category");
  const subcategorySelect = document.getElementById("subcategory");
  const subcategoryGroup = document.getElementById("subcategory-group");

  const adCat = normalize(ad.categoria);
  const adSub = normalize(ad.subcategoria);

  // Primero intenta búsqueda exacta (sin normalizar)
  let foundMainCat = categories.find(
    (c) => !c.parent_id && c.nombre === ad.categoria
  );
  let foundSubCat = categories.find(
    (c) => c.parent_id && c.nombre === ad.subcategoria
  );

  // Si no encuentra, intenta con normalización
  if (!foundMainCat && ad.categoria) {
    foundMainCat = categories.find(
      (c) => !c.parent_id && normalize(c.nombre) === adCat
    );
  }

  if (!foundSubCat && ad.subcategoria) {
    foundSubCat = categories.find(
      (c) => c.parent_id && normalize(c.nombre) === adSub
    );
  }

  if (foundMainCat) {
    // Asignar categoría principal usando el ID
    categorySelect.value = foundMainCat.id;
    selectedMainCategory = foundMainCat.nombre;
    console.log('✅ Categoría asignada:', foundMainCat.nombre, 'con ID:', foundMainCat.id);

    // Poblar subcategorías de esa categoría
    const subcats = categories.filter((c) => c.parent_id === foundMainCat.id);
    if (subcats.length > 0) {
      subcategoryGroup.style.display = "block";
      subcategorySelect.innerHTML = '<option value="">Selecciona</option>';

      subcats.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.nombre;
        opt.textContent = s.nombre;
        subcategorySelect.appendChild(opt);
      });

      if (foundSubCat) {
        subcategorySelect.value = foundSubCat.nombre;
        selectedSubcategory = foundSubCat.nombre;
      } else if (ad.subcategoria) {
        console.warn(
          `Subcategoría '${ad.subcategoria}' no coincide con las del grupo '${foundMainCat.nombre}'.`
        );
        subcategorySelect.value = "";
        selectedSubcategory = "";
      } else {
        subcategorySelect.value = "";
        selectedSubcategory = "";
      }
    } else {
      // Categoría sin subcategorías asociadas
      subcategoryGroup.style.display = "none";
      subcategorySelect.innerHTML = "";
      selectedSubcategory = "";
    }
  } else {
    // No se encontró coincidencia con categorías principales
    console.warn(
      `Categoría '${ad.categoria}' no encontrada en el catálogo de categorías cargadas.`
    );
    categorySelect.value = "";
    subcategoryGroup.style.display = "none";
    subcategorySelect.innerHTML = "";
    selectedMainCategory = "";
    selectedSubcategory = "";
  }

  // Mostrar los campos dinámicos basados en la categoría/subcategoría actual
  showDynamicFields();
  
  // Disparar el evento change para que se actualice el select de subcategorías
  categorySelect.dispatchEvent(new Event('change'));
} else {
  // Fallback si no hay categorías cargadas
  console.warn(
    "⚠️ No se encontraron categorías en memoria al intentar rellenar el formulario de edición."
  );
}


        // RENDERIZAR IMÁGENES DE GALERÍA EXISTENTES (NUEVA LÓGICA)
        if (images && images.length > 0) {
            galleryPreviewContainer.innerHTML = ''; // Limpiar previsualizaciones
            images.forEach(image => {
                const wrapper = document.createElement('div');
                wrapper.className = 'preview-image-wrapper';
                // Por ahora, solo mostramos la imagen. El borrado desde DB se implementará después.
                wrapper.innerHTML = `
                    <img src="${image.url_imagen}" class="preview-image">
                    <button type="button" class="remove-image-btn" data-url="${image.url_imagen}">&times;</button>
                `;
                galleryPreviewContainer.appendChild(wrapper);
            });
        }

        // ✅ MOSTRAR IMAGEN DE PORTADA ACTUAL (si existe)
        if (ad.url_portada) {
            const currentCoverWrapper = document.getElementById('current-cover-image');
            const coverPreviewImg = document.getElementById('cover-image-preview');
            if (currentCoverWrapper && coverPreviewImg) {
                coverPreviewImg.src = ad.url_portada;
                currentCoverWrapper.style.display = 'block';
                console.log('✅ Portada actual cargada');
            }
        }

        // 6. RELLENAR CAMPOS DINÁMICOS DE ATRIBUTOS
        if (ad.atributos_clave) {
            try {
                let atributos = ad.atributos_clave;
                // Si es string, parsear JSON
                if (typeof atributos === 'string') {
                    atributos = JSON.parse(atributos);
                }
                
                // Mapear cada atributo a su campo correspondiente en el formulario
                Object.entries(atributos).forEach(([key, value]) => {
                    // Buscar campos con name o id que coincidan con el atributo
                    let field = document.querySelector(`[name="${key}"]`) || 
                                document.querySelector(`#attr-${key}`);
                    if (field) {
                        field.value = value;
                        console.log(`✅ Campo dinámico rellenado: ${key} = ${value}`);
                    }
                });
            } catch (e) {
                console.warn('No se pudieron parsear los atributos:', e);
            }
        }

        isLoadingAdData = false; // ✅ Desactivar flag - carga completada
    }

    // --- FUNCIÓN PARA GUARDAR CAMBIOS DEL ANUNCIO ---
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
        const adData = {
            titulo: formData.get('titulo'),
            descripcion: formData.get('descripcion'),
            precio: parseFloat(formData.get('precio')),
            categoria: selectedMainCategory,
            provincia: formData.get('provincia'),
            distrito: formData.get('distrito'),
            direccion_especifica: formData.get('direccion_especifica'),
            contact_name: formData.get('contact_name'),
            contact_phone: formData.get('contact_phone'),
            contact_email: formData.get('contact_email')
        };

        // ⚠️ IMPORTANTE: subcategoria va DENTRO de atributos_clave, no como columna
        adData.atributos_clave = buildUnifiedAttributesJSON(formData, selectedMainCategory, selectedSubcategory);

        // --- MANEJAR ACTUALIZACIÓN DE IMAGEN DE PORTADA ---
        const coverImageInput = document.getElementById('cover-image-input');
        const coverImageFile = coverImageInput.files[0];

        if (coverImageFile) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Error de sesión. No se puede subir la nueva portada.");
                if (saveButton) {
                    saveButton.disabled = false;
                    saveButton.textContent = 'Guardar cambios';
                }
                return;
            }

            const fileName = `${user.id}/cover-${Date.now()}-${coverImageFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('imagenes_anuncios')
                .upload(fileName, coverImageFile);

            if (uploadError) {
                console.error('Error al subir nueva portada:', uploadError);
                alert('Hubo un error al subir la nueva imagen de portada.');
                if (saveButton) {
                    saveButton.disabled = false;
                    saveButton.textContent = 'Guardar cambios';
                }
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('imagenes_anuncios')
                .getPublicUrl(fileName);

            adData.url_portada = publicUrl;
        }

        // --- ACTUALIZAR DATOS EN LA TABLA 'anuncios' ---
        const { error: updateError } = await supabase
            .from('anuncios')
            .update(adData)
            .eq('id', adId);

        if (updateError) {
            console.error('Error al actualizar el anuncio:', updateError);
            alert('Hubo un error al guardar los cambios.');
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = 'Guardar cambios';
            }
            return;
        }

        // --- Subir nuevas imágenes de la galería (lógica existente) ---
        if (galleryFiles.length > 0) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Error de sesión. No se pueden subir las imágenes de la galería.");
                if (saveButton) {
                    saveButton.disabled = false;
                    saveButton.textContent = 'Guardar cambios';
                }
                return;
            }

            for (const file of galleryFiles) {
                const fileName = `${user.id}/${Date.now()}-${file.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('imagenes_anuncios')
                    .upload(fileName, file);

                if (uploadError) {
                    console.error('Error al subir imagen de galería:', uploadError);
                    continue;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('imagenes_anuncios')
                    .getPublicUrl(fileName);

                await supabase.from('imagenes').insert({
                    anuncio_id: adId,
                    url_imagen: publicUrl,
                    user_id: user.id
                });
            }
        }

        alert('¡Anuncio actualizado correctamente!');
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
            subcategoryGroup.style.display = 'block';
            subcategorySelect.innerHTML = '<option value="">Selecciona</option>';
            subcategories.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.nombre;
                opt.textContent = s.nombre;
                subcategorySelect.appendChild(opt);
            });
        } else {
            subcategoryGroup.style.display = 'none';
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
            districtGroup.style.display = 'block';
        } else {
            districtGroup.style.display = 'none';
            districtSelect.innerHTML = '';
        }
    });

    // --- LÓGICA DE GESTIÓN DE GALERÍA ---
    const MAX_FILES = 10;

    // 1. FUNCIÓN DE RENDERIZADO
    const renderPreviews = () => {
        galleryPreviewContainer.innerHTML = '';
        galleryFiles.forEach((file, index) => {
        const reader = new FileReader();
            reader.onload = (e) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'preview-image-wrapper';
                wrapper.innerHTML = `
                    <img src="${e.target.result}" class="preview-image">
                    <button type="button" class="remove-image-btn" data-index="${index}">&times;</button>
                `;
                galleryPreviewContainer.appendChild(wrapper);
        };
            reader.readAsDataURL(file);
        });
    };

    // 2. FUNCIÓN PARA AÑADIR ARCHIVOS
    const addFiles = (newFiles) => {
        const filesToAdd = Array.from(newFiles);
        if (galleryFiles.length + filesToAdd.length > MAX_FILES) {
            alert(`Solo puedes subir un máximo de ${MAX_FILES} imágenes.`);
            filesToAdd.splice(MAX_FILES - galleryFiles.length);
        }
        galleryFiles.push(...filesToAdd);
        renderPreviews();
    };

    // 3. EVENT LISTENERS PARA IMÁGENES
    if (galleryDropArea && galleryImagesInput && galleryPreviewContainer) {
        galleryDropArea.addEventListener('click', () => galleryImagesInput.click());

        galleryImagesInput.addEventListener('change', (e) => {
            addFiles(e.target.files);
            e.target.value = null;
        });

        // --- LÓGICA DE ELIMINACIÓN (NUEVA Y MEJORADA) ---
        galleryPreviewContainer.addEventListener('click', async (e) => {
            if (!e.target.classList.contains('remove-image-btn')) return;

            const wrapper = e.target.closest('.preview-image-wrapper');
            const imageUrl = e.target.dataset.url; // URL de imagen existente en DB
            const fileIndex = e.target.dataset.index; // Índice de archivo nuevo (aún no subido)

            if (imageUrl) {
                // Eliminar imagen existente de la base de datos y Storage
                if (!confirm('¿Estás seguro de que quieres eliminar esta imagen permanentemente?')) return;

                // Extraer el nombre del archivo de la URL
                const fileName = imageUrl.split('/').pop();
                const filePath = `imagenes_anuncios/${fileName}`;

                // 1. Eliminar de Storage
                const { error: storageError } = await supabase.storage.from('imagenes_anuncios').remove([fileName]);
                if (storageError) {
                    console.error('Error al eliminar del Storage:', storageError);
                    alert('No se pudo eliminar la imagen del almacenamiento.');
                    return;
                }

                // 2. Eliminar de la tabla 'imagenes'
                const { error: dbError } = await supabase.from('imagenes').delete().eq('url_imagen', imageUrl);
                if (dbError) {
                    console.error('Error al eliminar de la base de datos:', dbError);
                    alert('No se pudo eliminar la referencia de la imagen.');
                    // Opcional: intentar resubir el archivo si falla la eliminación de la DB
                    return;
                }

                // 3. Eliminar de la vista
                wrapper.remove();
                alert('Imagen eliminada correctamente.');

            } else if (fileIndex) {
                // Eliminar imagen nueva (aún no subida) del array local
                const indexToRemove = parseInt(fileIndex, 10);
                if (!isNaN(indexToRemove)) {
                    galleryFiles.splice(indexToRemove, 1);
                    renderPreviews(); // Re-renderizar las previsualizaciones de archivos nuevos
                }
        }
    });

        // Configuración de Drag and Drop (sin cambios)
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            galleryDropArea.addEventListener(eventName, e => {
        e.preventDefault();
                e.stopPropagation();
            }, false);
        });
        galleryDropArea.addEventListener('drop', e => {
            addFiles(e.dataTransfer.files);
        });
    }

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
