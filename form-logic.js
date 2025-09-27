// form-logic.js (Versión Limpia para Publicar Anuncio)

document.addEventListener('DOMContentLoaded', () => {
    // =============================================================
    // --- DECLARACIÓN CENTRALIZADA DE ELEMENTOS DEL DOM ---
    // =============================================================
    const publishForm = document.getElementById('publish-form');
    if (!publishForm) return; // Si no hay formulario, no hacemos nada.

    const categorySelect = document.getElementById('ad-category');
    const coverImageInput = document.getElementById('ad-cover-image');
    const coverFileNameDisplay = document.getElementById('cover-file-name');
    const dropArea = document.getElementById('gallery-drop-area');
    const galleryInput = document.getElementById('ad-gallery-images');
    const galleryPreview = document.getElementById('gallery-preview');

    // Array para almacenar los archivos de la galería que se subirán
    const galleryFiles = []; 

    // =============================================================
    // --- LÓGICA DE LA APLICACIÓN ---
    // =============================================================

    const newCategoryGroup = document.getElementById('new-category-group');
    categorySelect.addEventListener('change', () => {
        if (categorySelect.value === 'otra') {
            newCategoryGroup.style.display = 'block';
        } else {
            newCategoryGroup.style.display = 'none';
        }
    });

    // --- 1. Cargar Categorías ---
    async function loadCategories() {
        if (!categorySelect) return;
        categorySelect.innerHTML = '<option>Cargando categorías...</option>';
        const { data: categories, error } = await supabaseClient.from('categorias').select('nombre').order('nombre', { ascending: true });

        if (error) {
            console.error('Error al cargar las categorías:', error);
            categorySelect.innerHTML = '<option>Error al cargar</option>';
            return;
        }
        
        categorySelect.innerHTML = '<option value="" disabled selected>Seleccione una categoría</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.nombre;
            option.textContent = category.nombre;
            categorySelect.appendChild(option);
        });
        const otraOpcion = document.createElement('option');
        otraOpcion.value = 'otra';
        otraOpcion.textContent = 'Otra (Sugerir una nueva)';
        categorySelect.appendChild(otraOpcion);
    }
    loadCategories();

    // --- 2. Lógica para Mostrar Nombre de Archivo de Portada ---
    if (coverImageInput && coverFileNameDisplay) {
        coverImageInput.addEventListener('change', () => {
            coverFileNameDisplay.textContent = coverImageInput.files.length > 0 ? coverImageInput.files[0].name : 'Ningún archivo seleccionado';
        });
    }

    // --- 3. Lógica para Carga de Galería (Drag & Drop y Previsualización) ---
    if (dropArea && galleryInput && galleryPreview) {
        const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => dropArea.addEventListener(eventName, preventDefaults));
        ['dragenter', 'dragover'].forEach(eventName => dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight')));
        ['dragleave', 'drop'].forEach(eventName => dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight')));

        dropArea.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
        galleryInput.addEventListener('change', () => handleFiles(galleryInput.files));

        function handleFiles(files) {
            [...files].forEach(file => {
                if ((galleryFiles.length) < 10) { // Límite de 10 imágenes
                    galleryFiles.push(file); 
                    previewFile(file);
                }
            });
        }

        function previewFile(file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                const wrapper = document.createElement('div');
                wrapper.classList.add('preview-image-wrapper');
                
                const img = document.createElement('img');
                img.classList.add('preview-image');
                img.src = reader.result;
                
                const removeBtn = document.createElement('button');
                removeBtn.classList.add('remove-image-btn');
                removeBtn.innerHTML = '&times;';
                removeBtn.type = "button";

                removeBtn.addEventListener('click', () => {
                    wrapper.remove();
                    const index = galleryFiles.indexOf(file);
                    if (index > -1) galleryFiles.splice(index, 1);
                });

                wrapper.appendChild(img);
                wrapper.appendChild(removeBtn);
                galleryPreview.appendChild(wrapper);
            }
        }
    }
    
    // --- 4. Lógica del Envío del Formulario ---
    publishForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formButton = publishForm.querySelector('button[type="submit"]');
        formButton.disabled = true;
        formButton.textContent = 'Publicando...';

        const formData = new FormData(publishForm);
        const categoryValue = formData.get('category');
        const newCategoryValue = formData.get('new_category');
        let finalCategory = categoryValue;

        // Si el usuario sugirió una nueva categoría
        if (categoryValue === 'otra' && newCategoryValue) {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (user) {
                // Guardamos la sugerencia para revisión del admin
                await supabaseClient.from('sugerencias_categoria').insert([
                    { nombre_sugerido: newCategoryValue, sugerido_por: user.id }
                ]);
            }
            finalCategory = 'Pendiente de Categoría'; // O null, como prefieras
        }

        const coverImageFile = formData.get('coverImage');
        
        let coverImageUrl = '';
        if (coverImageFile && coverImageFile.size > 0) {
            const filePath = `public/${Date.now()}_${coverImageFile.name}`;
            const { error } = await supabaseClient.storage.from('imagenes_anuncios').upload(filePath, coverImageFile);
            if (error) {
                alert('Error subiendo imagen de portada.');
                console.error(error);
                formButton.disabled = false;
                formButton.textContent = 'Publicar Anuncio';
                return;
            }
            const { data } = supabaseClient.storage.from('imagenes_anuncios').getPublicUrl(filePath);
            coverImageUrl = data.publicUrl;
        }

        const galleryUrls = [];
        for (const file of galleryFiles) {
            const filePath = `public/${Date.now()}_gallery_${file.name}`;
            const { error } = await supabaseClient.storage.from('imagenes_anuncios').upload(filePath, file);
            if (error) {
                console.error('Error subiendo imagen de galería:', error);
                continue; 
            }
            const { data } = supabaseClient.storage.from('imagenes_anuncios').getPublicUrl(filePath);
            galleryUrls.push(data.publicUrl);
        }

        const { data: { user } } = await supabaseClient.auth.getUser(); // Get user here
        if (!user) {
            alert('Debes iniciar sesión para publicar un anuncio.');
            formButton.disabled = false;
            formButton.textContent = 'Publicar Anuncio';
            return;
        }

        const adData = {
            titulo: formData.get('title'),
            categoria: finalCategory, // Use finalCategory here
            precio: parseFloat(formData.get('price')),
            ubicacion: formData.get('location'),
            descripcion: formData.get('description'),
            url_portada: coverImageUrl,
            url_galeria: galleryUrls,
            user_id: user.id, // Assign user.id here
        };

        const { error } = await supabaseClient.from('anuncios').insert([adData]);

        if (error) {
            console.error('Error al publicar el anuncio:', error);
            alert('No se pudo publicar el anuncio.');
            formButton.disabled = false;
            formButton.textContent = 'Publicar Anuncio';
        } else {
            alert('¡Anuncio publicado con éxito!');
            window.location.href = `resultados.html`;
        }
    });
});