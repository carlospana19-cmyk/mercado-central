// publish-logic.js - VERSIÓN FINAL CON SINCRONIZACIÓN COMPLETA

import { supabase } from './supabase-client.js';

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

    // --- DATOS DE SUBCATEGORÍAS DE ELECTRÓNICA ---
    const electronicsSubcategories = {
        "Celulares y Teléfonos": ["marca", "modelo", "almacenamiento", "memoria_ram", "condicion"],
        "Computadoras": ["tipo_computadora", "marca", "procesador", "memoria_ram", "almacenamiento", "tamano_pantalla", "condicion"],
        "Consolas y Videojuegos": ["plataforma", "modelo", "almacenamiento", "condicion"],
        "Audio y Video": ["tipo_articulo", "marca", "modelo", "condicion"],
        "Fotografía": ["tipo_articulo", "marca", "modelo", "condicion"]
    };

    // --- DATOS DE SUBCATEGORÍAS DE HOGAR Y MUEBLES ---
    const homeFurnitureSubcategories = {
        "Muebles de Sala": ["tipo_mueble", "material", "color", "dimensiones", "condicion"],
        "Muebles de Dormitorio": ["tipo_mueble", "material", "color", "dimensiones", "condicion"],
        "Cocina y Comedor": ["tipo_articulo", "material", "color", "condicion"],
        "Electrodomésticos": ["tipo_electrodomestico", "marca", "modelo", "condicion"],
        "Decoración": ["tipo_decoracion", "material", "color", "dimensiones", "condicion"],
        "Jardín": ["tipo_articulo", "material", "condicion"]
    };

    // --- FUNCIONES AUXILIARES PARA EL PASO 3 ---
function showDynamicFields() {
    // Deshabilitar todos los inputs de secciones ocultas
    vehicleDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    realestateDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    electronicsDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    homeFurnitureDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);

    if (selectedMainCategory.toLowerCase().includes('vehículo') || selectedMainCategory.toLowerCase().includes('auto') || selectedMainCategory.toLowerCase().includes('carro')) {
        vehicleDetails.style.display = 'block';
        vehicleDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'none';
    } else if (selectedMainCategory.toLowerCase().includes('inmueble') || selectedMainCategory.toLowerCase().includes('casa') || selectedMainCategory.toLowerCase().includes('apartamento')) {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'block';
        realestateDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'none';
    } else if (selectedMainCategory.toLowerCase().includes('electrónica')) {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'block';
        electronicsDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        homeFurnitureDetails.style.display = 'none';
        if (selectedSubcategory) {
            showElectronicsFields();
        }
    } else if (selectedMainCategory.toLowerCase().includes('hogar') || selectedMainCategory.toLowerCase().includes('mueble')) {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'block';
        homeFurnitureDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        if (selectedSubcategory) {
            showHomeFurnitureFields();
        }
    } else {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'none';
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
            } else if (field === 'tipo_articulo') {
                labelText = 'Tipo de Artículo';
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
                    <option value="TV">TV</option>
                    <option value="Auricular">Auricular</option>
                    <option value="Parlante">Parlante</option>
                    <option value="Cámara">Cámara</option>
                    <option value="Lente">Lente</option>
                    <option value="Otro">Otro</option>
                `;
                const label = document.createElement('label');
                label.textContent = labelText;
                label.style.display = 'block';
                label.style.marginBottom = '5px';
                label.style.fontWeight = 'bold';
                fieldDiv.appendChild(label);
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

            if (field !== 'tipo_computadora' && field !== 'plataforma' && field !== 'tipo_articulo' && field !== 'condicion') {
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
        allSteps.forEach(step => step.style.display = 'none');
        const targetStep = document.getElementById(`step-${stepNumber}`);
        if(targetStep) targetStep.style.display = 'block';

        // --- LÓGICA COMPLETA Y VERIFICADA PARA EL PASO 3 (REEMPLAZAR) ---
        if (stepNumber === 3) {
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
        // --- FIN DEL BLOQUE A REEMPLAZAR ---

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
        } else {
            console.log('Main category is NOT Electrónica. Not calling showElectronicsFields.');
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
    const MAX_FILES = 10;

    // 1. FUNCIÓN DE RENDERIZADO (CORREGIDA)
    const renderPreviews = () => {
        galleryPreviewContainer.innerHTML = '';
        galleryFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const wrapper = document.createElement('div');
                // La clase que SÍ está en nuestro CSS
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

    // 2. FUNCIÓN PARA AÑADIR ARCHIVOS (CORREGIDA)
    const addFiles = (newFiles) => {
        const filesToAdd = Array.from(newFiles);
        if (galleryFiles.length + filesToAdd.length > MAX_FILES) {
            alert(`Solo puedes subir un máximo de ${MAX_FILES} imágenes.`);
            filesToAdd.splice(MAX_FILES - galleryFiles.length); // Cortamos el exceso
        }
        galleryFiles.push(...filesToAdd);
        renderPreviews();
    };

    // 3. EVENT LISTENERS (CORREGIDOS Y COMPLETOS)
    if (galleryDropArea && galleryImagesInput && galleryPreviewContainer) {

        // Abrir selector de archivos al hacer clic
        galleryDropArea.addEventListener('click', () => galleryImagesInput.click());

        // Manejar archivos seleccionados
        galleryImagesInput.addEventListener('change', (e) => {
            addFiles(e.target.files);
            e.target.value = null; // Reset para poder seleccionar el mismo archivo de nuevo
        });

        // Manejar eliminación de imágenes
        galleryPreviewContainer.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('remove-image-btn')) {
                const indexToRemove = parseInt(e.target.dataset.index, 10);
                if (!isNaN(indexToRemove)) {
                    galleryFiles.splice(indexToRemove, 1);
                    renderPreviews(); // Re-renderizar
                }
            }
        });

        // (Opcional) Lógica de Arrastrar y Soltar
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
                titulo: formData.get('titulo'),
                descripcion: formData.get('descripcion'),
                precio: parseFloat(formData.get('precio')),
                categoria: formData.get('categoria'),
                provincia: formData.get('provincia'),
                distrito: formData.get('distrito'),
                user_id: user.id,
                url_portada: coverPublicUrl,
                fecha_publicacion: new Date().toISOString()
            };

            // --- CAMPOS DE VEHÍCULO (solo si es vehículo) ---
            if (selectedMainCategory.toLowerCase().includes('vehículo') || selectedMainCategory.toLowerCase().includes('auto') || selectedMainCategory.toLowerCase().includes('carro')) {
                adData.marca = formData.get('marca') || null;
                adData.anio = formData.get('anio') ? parseInt(formData.get('anio')) : null;
                adData.kilometraje = formData.get('kilometraje') ? parseInt(formData.get('kilometraje')) : null;
                adData.transmision = formData.get('transmision') || null;
                adData.combustible = formData.get('combustible') || null;
            }

            // --- CAMPOS DE INMUEBLES (solo si es inmueble) ---
            if (selectedMainCategory.toLowerCase().includes('inmueble') || selectedMainCategory.toLowerCase().includes('casa') || selectedMainCategory.toLowerCase().includes('apartamento')) {
                adData.m2 = formData.get('m2') ? parseInt(formData.get('m2')) : null;
                adData.habitaciones = formData.get('habitaciones') ? parseInt(formData.get('habitaciones')) : null;
                adData.baños = formData.get('baños') ? parseInt(formData.get('baños')) : null;
            }

            // --- ATRIBUTOS JSONB (para Electrónica, Hogar, etc.) ---
            if (selectedMainCategory.toLowerCase().includes('electrónica')) {
                adData.atributos_clave = buildElectronicsJSON(formData);
            } else if (selectedMainCategory.toLowerCase().includes('hogar') || selectedMainCategory.toLowerCase().includes('mueble')) {
                adData.atributos_clave = buildHomeFurnitureJSON(formData);
            } else {
                adData.atributos_clave = null;
            }
        
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

    // --- INICIALIZACIÓN ---
    loadAllCategories();
    getUserInfo();
}
