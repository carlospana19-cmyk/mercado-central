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
        const coverImageFile = formData.get('coverImage');
        
        // 1. SUBIR IMAGEN DE PORTADA
        let coverImageUrl = '';
        if (coverImageFile && coverImageFile.size > 0) {
            const filePath = `public/${Date.now()}_${coverImageFile.name}`;
            await supabaseClient.storage.from('imagenes_anuncios').upload(filePath, coverImageFile);
            const { data } = supabaseClient.storage.from('imagenes_anuncios').getPublicUrl(filePath);
            coverImageUrl = data.publicUrl;
        }

        // 2. INSERTAR EL ANUNCIO PRINCIPAL Y OBTENER SU ID
        const { data: { user } } = await supabaseClient.auth.getUser(); // Get user here
        if (!user) {
            alert('Debes iniciar sesión para publicar un anuncio.');
            formButton.disabled = false;
            formButton.textContent = 'Publicar Anuncio';
            return;
        }

        const adData = {
            titulo: formData.get('title'),
            categoria: formData.get('category'),
            precio: parseFloat(formData.get('price')),
            ubicacion: formData.get('location'),
            descripcion: formData.get('description'),
            url_portada: coverImageUrl,
            user_id: user.id // Assign user.id here
        };

        const { data: newAd, error: adError } = await supabaseClient
            .from('anuncios')
            .insert([adData])
            .select('id') // ¡Pedimos que nos devuelva el ID!
            .single();

        if (adError || !newAd) {
            console.error('Error al publicar el anuncio:', adError);
            alert('No se pudo publicar el anuncio.');
            formButton.disabled = false;
            formButton.textContent = 'Publicar Anuncio';
            return;
        }

        const newAdId = newAd.id;

        // 3. SUBIR IMÁGENES DE GALERÍA Y GUARDARLAS EN LA TABLA 'imagenes'
        if (galleryFiles.length > 0) {
            const galleryImageObjects = [];

            for (const file of galleryFiles) {
                const filePath = `public/${Date.now()}_gallery_${file.name}`;
                await supabaseClient.storage.from('imagenes_anuncios').upload(filePath, file);
                const { data } = supabaseClient.storage.from('imagenes_anuncios').getPublicUrl(filePath);
                
                // Preparamos el objeto para la tabla 'imagenes'
                galleryImageObjects.push({
                    anuncio_id: newAdId,
                    url_imagen: data.publicUrl
                });
            }

            // Insertamos todas las imágenes de la galería de una sola vez
            const { error: imagesError } = await supabaseClient
                .from('imagenes')
                .insert(galleryImageObjects);

            if (imagesError) {
                console.error('Error guardando imágenes de galería:', imagesError);
                // El anuncio principal se creó, pero las imágenes fallaron.
                // Se podría añadir lógica para manejar este caso.
            }
        }

        alert('¡Anuncio publicado con éxito!');
        window.location.href = `detalle-producto.html?id=${newAdId}`;
    });
});