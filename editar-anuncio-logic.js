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
    let allCategories = [];

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
        const selectedSubcategory = categories.find(c => c.nombre === ad.categoria);
        if (selectedSubcategory) {
            const parentId = selectedSubcategory.parent_id;
            categorySelect.value = parentId;
            categorySelect.dispatchEvent(new Event('change'));
            setTimeout(() => {
                subcategorySelect.value = ad.categoria;
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

        // --- Carga de datos de vehículo ---
        document.getElementById('attr-marca').value = ad.marca || '';
        document.getElementById('attr-anio').value = ad.anio || '';
        document.getElementById('attr-kilometraje').value = ad.kilometraje || '';
        document.getElementById('attr-transmision').value = ad.transmision || '';
        document.getElementById('attr-combustible').value = ad.combustible || '';

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
            contact_phone: formData.get('contact_phone'),

            // --- NUEVOS CAMPOS DE VEHÍCULO ---
            marca: formData.get('marca') || null,
            anio: formData.get('anio') ? parseInt(formData.get('anio')) : null,
            kilometraje: formData.get('kilometraje') ? parseInt(formData.get('kilometraje')) : null,
            transmision: formData.get('transmision') || null,
            combustible: formData.get('combustible') || null
        };

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

        // (Aquí irá la lógica de campos dinámicos para el Paso 3)
    };
}
