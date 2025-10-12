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

    // --- FUNCIONES AUXILIARES PARA EL PASO 3 ---
    function showDynamicFields() {
        if (selectedMainCategory.toLowerCase().includes('vehículo') || selectedMainCategory.toLowerCase().includes('auto') || selectedMainCategory.toLowerCase().includes('carro')) {
            vehicleDetails.style.display = 'block';
            realestateDetails.style.display = 'none';
        } else if (selectedMainCategory.toLowerCase().includes('inmueble') || selectedMainCategory.toLowerCase().includes('casa') || selectedMainCategory.toLowerCase().includes('apartamento')) {
            vehicleDetails.style.display = 'none';
            realestateDetails.style.display = 'block';
        } else {
            vehicleDetails.style.display = 'none';
            realestateDetails.style.display = 'none';
        }
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
        const { data, error } = await supabase.from('categorias').select('id, nombre, parent_id').order('nombre');
        if (error) { console.error("Error al cargar categorías:", error); return; }
        
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
        const subcategories = allCategories.filter(c => c.parent_id === selectedParentId);

        if (subcategories.length > 0) {
            subcategorySelect.innerHTML = '<option value="" disabled selected>Selecciona una subcategoría</option>';
            subcategories.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub.nombre;
                option.textContent = sub.nombre;
            subcategorySelect.appendChild(option);
    });
            subcategoryGroup.style.display = 'block';
        } else {
            // Si una categoría principal no tiene hijos, la tratamos como la selección final
            subcategoryGroup.style.display = 'none';
            subcategorySelect.innerHTML = '';
        }
    });

    subcategorySelect.addEventListener('change', function() {
        selectedSubcategory = this.value;
    });

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

        try {
            const coverImageFile = coverImageInput.files[0];
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
            // --- NUEVOS CAMPOS AÑADIDOS ---
            marca: formData.get('marca') || null,
            anio: formData.get('anio') ? parseInt(formData.get('anio')) : null,
            kilometraje: formData.get('kilometraje') ? parseInt(formData.get('kilometraje')) : null,
            transmision: formData.get('transmision') || null,
            combustible: formData.get('combustible') || null
        };
        
            const { data: newAd, error: adInsertError } = await supabase
                .from('anuncios')
                .insert(adData)
                .select()
            .single();

            if (adInsertError) throw adInsertError;

            if (galleryFiles.length > 0) {
                for (const file of galleryFiles) {
                    const galleryFileName = `${user.id}/${Date.now()}-${file.name}`;
                    const { data: { publicUrl: galleryPublicUrl } } = await supabase.storage.from('imagenes_anuncios').upload(galleryFileName, file).then(({ data }) => supabase.storage.from('imagenes_anuncios').getPublicUrl(data.path));

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

    // --- INICIALIZACIÓN ---
    loadAllCategories();
    getUserInfo();
}
