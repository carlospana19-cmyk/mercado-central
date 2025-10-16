// editar-anuncio-logic.js - VERSIÓN FINAL CON CAMPOS DE VEHÍCULO

import { supabase } from './supabase-client.js';

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
    const nextBtns = form.querySelectorAll('.next-btn, #continue-to-step2');
    const backBtns = form.querySelectorAll('.back-btn');
    const vehicleDetails = document.getElementById('vehicle-details');
    const realestateDetails = document.getElementById('realestate-details');
    const electronicsDetails = document.getElementById('electronics-details');
    const electronicsFields = document.getElementById('electronics-fields');
    const homeFurnitureDetails = document.getElementById('home-furniture-details');
    const homeFurnitureFields = document.getElementById('home-furniture-fields');
    const fashionDetails = document.getElementById('fashion-details');
    const fashionFields = document.getElementById('fashion-fields');
    let allCategories = [];
    let selectedMainCategory = '';
    let selectedSubcategory = '';

    // --- DATOS DE DISTRITOS POR PROVINCIA ---
    const districtsByProvince = {
        'Panamá': ['Panamá', 'San Miguelito', 'Arraiján', 'Capira', 'Chame', 'La Chorrera', 'Cerro Punta'],
        'Panamá Oeste': ['La Chorrera', 'Capira', 'Chame', 'Arraiján', 'San Carlos'],
        'Colón': ['Colón', 'Portobelo', 'Chagres', 'Donoso', 'Gatún', 'Margarita', 'Santa Isabel'],
        'Chiriquí': ['David', 'Bugaba', 'Renacimiento', 'Barú', 'Boquete', 'Alanje', 'Tierras Altas'],
        'Veraguas': ['Santiago', 'Atalaya', 'Mariato', 'Montijo', 'La Mesa', 'San Francisco', 'Soná'],
        'Coclé': ['Penonomé', 'Aguadulce', 'Natá', 'Olá', 'Antón', 'La Pintada'],
        'Los Santos': ['Las Tablas', 'Los Santos', 'Macaracas', 'Pedasí', 'Pocrí', 'Tonosí'],
        'Herrera': ['Chitré', 'Las Minas', 'Los Pozos', 'Ocú', 'Parita', 'Pesé', 'Santa María'],
        'Darién': ['La Palma', 'Chepigana', 'Pinogana', 'Santa Fe', 'Garachiné', 'Wargandí'],
        'Bocas del Toro': ['Bocas del Toro', 'Changuinola', 'Almirante', 'Chiriquí Grande']
    };

    let galleryFiles = [];

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

    // --- FUNCIONES AUXILIARES PARA EL PASO 3 ---
function showDynamicFields() {
    // Deshabilitar todos los inputs de secciones ocultas
    vehicleDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    realestateDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    electronicsDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    homeFurnitureDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);
    fashionDetails.querySelectorAll('input, select').forEach(el => el.disabled = true);

    if (selectedMainCategory.toLowerCase().includes('vehículo') || selectedMainCategory.toLowerCase().includes('auto') || selectedMainCategory.toLowerCase().includes('carro')) {
        vehicleDetails.style.display = 'block';
        vehicleDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'none';
        fashionDetails.style.display = 'none';
    } else if (selectedMainCategory.toLowerCase().includes('inmueble') || selectedMainCategory.toLowerCase().includes('casa') || selectedMainCategory.toLowerCase().includes('apartamento')) {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'block';
        realestateDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'none';
        fashionDetails.style.display = 'none';
    } else if (selectedMainCategory.toLowerCase().includes('electrónica')) {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'block';
        electronicsDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        homeFurnitureDetails.style.display = 'none';
        fashionDetails.style.display = 'none';
        showElectronicsFields();
    } else if (selectedMainCategory.toLowerCase().includes('hogar') || selectedMainCategory.toLowerCase().includes('mueble')) {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'block';
        homeFurnitureDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        fashionDetails.style.display = 'none';
        showHomeFurnitureFields();
    } else if (selectedMainCategory.toLowerCase().includes('moda') || selectedMainCategory.toLowerCase().includes('belleza') || selectedMainCategory.toLowerCase().includes('ropa')) {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'none';
        fashionDetails.style.display = 'block';
        fashionDetails.querySelectorAll('input, select').forEach(el => el.disabled = false);
        showFashionFields();
    } else {
        vehicleDetails.style.display = 'none';
        realestateDetails.style.display = 'none';
        electronicsDetails.style.display = 'none';
        homeFurnitureDetails.style.display = 'none';
        fashionDetails.style.display = 'none';
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

    // --- LÓGICA DE CARGA DE DATOS (VERSIÓN CORREGIDA) ---
    async function loadAdData(categories) {
        const urlParams = new URLSearchParams(window.location.search);
        const adId = urlParams.get('id');
        if (!adId) {
            alert("ID de anuncio no encontrado. Volviendo al panel.");
            window.location.href = 'dashboard.html';
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

// Rellenar categorías
const foundCategory = categories.find(c => c.nombre === ad.categoria);
if (foundCategory) {
    const parentId = foundCategory.parent_id;
    categorySelect.value = parentId;
    selectedMainCategory = categories.find(c => c.id === parentId)?.nombre || '';
    categorySelect.dispatchEvent(new Event('change'));
    setTimeout(() => {
        subcategorySelect.value = ad.categoria;
        selectedSubcategory = ad.categoria;
        showDynamicFields();
    }, 100);
}

        // Precargar imagen de portada
        if (ad.url_portada) {
            coverImageName.textContent = ad.url_portada.split('/').pop();
        }

        // Rellenar datos de contacto (NUEVA LÓGICA)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            document.getElementById('contact-email').value = user.email;
        }
        // Rellenar con los datos guardados en el anuncio
        if (ad.contact_name) {
            document.getElementById('contact-name').value = ad.contact_name;
        }
        if (ad.contact_phone) {
            document.getElementById('contact-phone').value = ad.contact_phone;
        }

        // --- Carga de datos de atributos unificados (desde JSONB) ---
        if (ad.atributos_clave && typeof ad.atributos_clave === 'object') {
            const atributos = ad.atributos_clave;
            if (atributos.subcategoria) {
                selectedSubcategory = atributos.subcategoria;
                setTimeout(() => {
                    subcategorySelect.value = atributos.subcategoria;
                    showDynamicFields();
                    fillUnifiedAttributesJSON(atributos, selectedMainCategory, selectedSubcategory);
                }, 100);
            } else {
                // Si no hay subcategoría en atributos_clave, pero sí hay atributos, rellenar con la categoría principal
                fillUnifiedAttributesJSON(atributos, selectedMainCategory, selectedSubcategory);
            }
        }

        // --- Carga de datos de atributos unificados ---
        if (ad.atributos_clave && typeof ad.atributos_clave === 'object') {
            fillUnifiedAttributesJSON(ad.atributos_clave, selectedMainCategory, selectedSubcategory);
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
    }

    // --- LÓGICA DE GUARDADO DE CAMBIOS (FORM SUBMIT) - VERSIÓN FINAL ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveButton = document.getElementById('save-changes-btn');
        saveButton.disabled = true;
        saveButton.textContent = 'Guardando...';

        const urlParams = new URLSearchParams(window.location.search);
        const adId = urlParams.get('id');
        if (!adId) { /* ... manejo de error ... */ return; }

        // 1. Recolectar datos de texto del formulario
        const formData = new FormData(form);
        const adData = {
            titulo: formData.get('titulo'),
            descripcion: formData.get('descripcion'),
            precio: parseFloat(formData.get('precio')),
            categoria: formData.get('categoria'),
            provincia: formData.get('provincia'),
            distrito: formData.get('distrito'),
            direccion_especifica: formData.get('direccion_especifica'),
            contact_name: formData.get('contact_name'),
            contact_phone: formData.get('contact_phone')
        };

        // --- ATRIBUTOS UNIFICADOS (TODAS las categorías van a JSONB) ---
        adData.atributos_clave = buildUnifiedAttributesJSON(formData, selectedMainCategory, selectedSubcategory);

        // --- 2. MANEJAR ACTUALIZACIÓN DE IMAGEN DE PORTADA (NUEVA LÓGICA) ---
        const coverImageInput = document.getElementById('cover-image-input');
        const coverImageFile = coverImageInput.files[0];

        if (coverImageFile) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { alert("Error de sesión."); return; }

            const fileName = `${user.id}/cover-${Date.now()}-${coverImageFile.name}`;

            const { error: uploadError } = await supabase.storage
                .from('imagenes_anuncios')
                .upload(fileName, coverImageFile);

            if (uploadError) {
                console.error('Error al subir nueva portada:', uploadError);
                alert('Hubo un error al subir la nueva imagen de portada.');
                saveButton.disabled = false;
                saveButton.textContent = 'Guardar Cambios';
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('imagenes_anuncios')
                .getPublicUrl(fileName);

            // Añadir la nueva URL al objeto que se va a actualizar
            adData.url_portada = publicUrl;
        }

        // 3. Actualizar datos en la tabla 'anuncios' (ahora incluye la nueva portada si la hay)
        const { error: updateError } = await supabase
            .from('anuncios')
            .update(adData)
            .eq('id', adId);

        if (updateError) {
            console.error('Error al actualizar el anuncio:', updateError);
            alert('Hubo un error al guardar los cambios.');
            saveButton.disabled = false;
            saveButton.textContent = 'Guardar Cambios';
            return;
        }

        // 4. Subir nuevas imágenes de la galería (lógica existente)
        if (galleryFiles.length > 0) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { alert("Error de sesión."); return; }

            for (const file of galleryFiles) {
                const fileName = `${user.id}/${Date.now()}-${file.name}`;

                const { error: uploadError } = await supabase.storage
                    .from('imagenes_anuncios')
                    .upload(fileName, file);

                if (uploadError) {
                    console.error('Error al subir imagen:', uploadError);
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
        window.location.href = `dashboard.html`;
    });

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

    // --- EVENT LISTENERS ---
    categorySelect.addEventListener('change', () => {
        const parentId = parseInt(categorySelect.value, 10);
        selectedMainCategory = allCategories.find(c => c.id === parentId)?.nombre || '';
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

    // LÓGICA DE NAVEGACIÓN PARA BOTONES (¡AÑADIDA!)
    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentStep = btn.closest('.form-section');
            const currentStepNumber = parseInt(currentStep.id.split('-')[1], 10);
            // (Aquí añadiremos validación por paso más adelante)
            navigateToStep(currentStepNumber + 1);
        });
                });

    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentStep = btn.closest('.form-section');
            const currentStepNumber = parseInt(currentStep.id.split('-')[1], 10);
            navigateToStep(currentStepNumber - 1);
        });
    });


    // ✅ FUNCIÓN UNIFICADA PARA TODAS LAS CATEGORÍAS
    function buildUnifiedAttributesJSON(formData, mainCategory, subcategory) {
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
            
            const realEstateFields = ['m2', 'habitaciones', 'baños'];
            realEstateFields.forEach(field => {
                const value = formData.get(field);
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
        
        console.log('🟢 JSON UNIFICADO CONSTRUIDO:', json);
        return Object.keys(json).length > 0 ? json : null;
    }

    // ✅ FUNCIÓN UNIFICADA PARA RELLENAR CAMPOS DE ATRIBUTOS
    function fillUnifiedAttributesJSON(atributos, mainCategory, subcategory) {
        if (!atributos) return;

        let fieldsToFill = [];

        if (mainCategory.toLowerCase().includes('vehículo') || 
            mainCategory.toLowerCase().includes('auto') || 
            mainCategory.toLowerCase().includes('carro')) {
            fieldsToFill = ['marca', 'anio', 'kilometraje', 'transmision', 'combustible'];
        } else if (mainCategory.toLowerCase().includes('inmueble') || 
                   mainCategory.toLowerCase().includes('casa') || 
                   mainCategory.toLowerCase().includes('apartamento')) {
            fieldsToFill = ['m2', 'habitaciones', 'baños'];
        } else if (mainCategory.toLowerCase().includes('electrónica')) {
            fieldsToFill = electronicsSubcategories[subcategory] || [];
        } else if (mainCategory.toLowerCase().includes('hogar') || 
                   mainCategory.toLowerCase().includes('mueble')) {
            fieldsToFill = homeFurnitureSubcategories[subcategory] || [];
        } else if (mainCategory.toLowerCase().includes('moda') || 
                   mainCategory.toLowerCase().includes('belleza') || 
                   mainCategory.toLowerCase().includes('ropa')) {
            fieldsToFill = fashionSubcategories[subcategory] || [];
        }

        fieldsToFill.forEach(field => {
            const element = document.getElementById(`attr-${field}`);
            if (element && atributos[field] !== undefined && atributos[field] !== null) {
                element.value = atributos[field];
            }
        });
    }

    // --- FUNCIÓN DE NAVEGACIÓN (COMPLETA) ---
    const navigateToStep = (stepNumber) => {
        allSteps.forEach(step => step.style.display = 'none');
        const targetStep = document.getElementById(`step-${stepNumber}`);
        if(targetStep) targetStep.style.display = 'block';

        progressSteps.forEach((step, index) => {
            const currentStepNumber = parseInt(step.dataset.step, 10);
            step.classList.remove('active', 'completed');
            if (currentStepNumber < stepNumber) {
                step.classList.add('completed');
            } else if (currentStepNumber === stepNumber) {
                step.classList.add('active');
            }
        });

        // Lógica de campos dinámicos para el Paso 3
        if (stepNumber === 3) {
            showDynamicFields();
        }
    };
}
