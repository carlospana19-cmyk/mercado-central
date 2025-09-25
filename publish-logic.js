// publish-logic.js (VERSIÓN FINAL)

document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DEL DOM ---
    const categorySelect = document.getElementById('ad-category');
    const coverImageInput = document.getElementById('ad-cover-image');
    const galleryImageInput = document.getElementById('ad-gallery-images');
    const coverFileNameDisplay = document.getElementById('cover-file-name');
    const galleryFilesNameDisplay = document.getElementById('gallery-files-name');
    const publishForm = document.getElementById('publish-form');
    const galleryDropArea = document.getElementById('gallery-drop-area');
    const galleryPreview = document.getElementById('gallery-preview');

    let galleryFiles = []; // Array para gestionar los archivos de la galería

    // --- LÓGICA DE LA INTERFAZ (UI) ---

    // Rellenar categorías
    if (categorySelect) {
        const categoriesHTML = `
            <option value="" disabled selected>-- Selecciona una categoría --</option>
            <optgroup label="Bienes Raíces"><option value="venta-inmuebles">Venta de Inmuebles</option><option value="alquiler-inmuebles">Alquiler de Inmuebles</option></optgroup>
            <optgroup label="Vehículos"><option value="autos">Autos</option><option value="motos">Motos</option></optgroup>
            <optgroup label="Marketplace"><option value="electronica">Electrónica</option><option value="hogar-muebles">Hogar y Muebles</option></optgroup>
            <optgroup label="Empleos y Servicios"><option value="ofertas-empleo">Ofertas de Empleo</option><option value="servicios-profesionales">Servicios Profesionales</option></optgroup>
        `;
        categorySelect.innerHTML = categoriesHTML;
    }

    // Lógica para el botón de portada
    if (coverImageInput) {
        coverImageInput.addEventListener('change', () => {
            coverFileNameDisplay.textContent = coverImageInput.files.length > 0 ? coverImageInput.files[0].name : 'Ningún archivo seleccionado';
        });
    }

    // --- LÓGICA AVANZADA PARA DRAG & DROP ---
    
    // Función para prevenir el comportamiento por defecto del navegador
    const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
    
    // Prevenir que el navegador abra archivos arrastrados accidentalmente EN TODA LA VENTANA
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        window.addEventListener(eventName, preventDefaults);
    });

    // Resaltar el área de drop
    ['dragenter', 'dragover'].forEach(eventName => {
        galleryDropArea.addEventListener(eventName, () => galleryDropArea.classList.add('highlight'));
    });
    ['dragleave', 'drop'].forEach(eventName => {
        galleryDropArea.addEventListener(eventName, () => galleryDropArea.classList.remove('highlight'));
    });

    // Manejar los archivos
    galleryDropArea.addEventListener('drop', (e) => addFilesToGallery(e.dataTransfer.files));
    galleryImageInput.addEventListener('change', (e) => addFilesToGallery(e.target.files));

    function addFilesToGallery(newFiles) {
        for (let file of newFiles) {
            if (galleryFiles.length < 10) { galleryFiles.push(file); }
        }
        updateFileInputAndPreview();
    }

    function updateFileInputAndPreview() {
        galleryPreview.innerHTML = '';
        const dataTransfer = new DataTransfer();
        galleryFiles.forEach((file, index) => {
            dataTransfer.items.add(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                galleryPreview.innerHTML += `
                    <div class="preview-image-wrapper">
                        <img src="${e.target.result}" class="preview-image" title="${file.name}">
                        <button type="button" class="remove-image-btn" data-index="${index}">&times;</button>
                    </div>`;
            };
            reader.readAsDataURL(file);
        });
        galleryImageInput.files = dataTransfer.files;
        galleryFilesNameDisplay.textContent = galleryFiles.length > 0 ? `${galleryFiles.length} archivos seleccionados` : 'Ningún archivo seleccionado';
    }

    galleryPreview.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-image-btn')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            galleryFiles.splice(index, 1);
            updateFileInputAndPreview();
        }
    });


    // --- LÓGICA DE ENVÍO DEL FORMULARIO ---
    if (publishForm) {
        publishForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formButton = publishForm.querySelector('button[type="submit"]');
            formButton.disabled = true;
            formButton.textContent = 'Procesando...';

            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) {
                alert('Necesitas iniciar sesión para publicar.');
                window.location.href = 'login.html';
                return;
            }

            const formData = new FormData(publishForm);
            const coverImageFile = formData.get('coverImage');
            const galleryImageFiles = formData.getAll('galleryImages');

            if (!coverImageFile || coverImageFile.size === 0) {
                alert('Por favor, selecciona una imagen de portada.');
                formButton.disabled = false; formButton.textContent = 'Publicar Anuncio';
                return;
            }

            // Subir la imagen de portada
            const coverFileName = `${Date.now()}_cover_${coverImageFile.name}`;
            const { data: coverUpload, error: coverError } = await supabaseClient.storage.from('imagenes_anuncios').upload(coverFileName, coverImageFile);
            if (coverError) {
                alert('Hubo un error al subir la imagen de portada.');
                formButton.disabled = false; formButton.textContent = 'Publicar Anuncio';
                return;
            }
            const coverImageUrl = supabaseClient.storage.from('imagenes_anuncios').getPublicUrl(coverFileName).data.publicUrl;

            // Insertar el anuncio en la tabla 'anuncios' CON la url_portada
            const adData = {
                titulo: formData.get('title'),
                descripcion: formData.get('description'),
                precio: formData.get('price'),
                categoria: formData.get('category'),
                ubicacion: formData.get('location'),
                user_id: user.id,
                url_portada: coverImageUrl // Nueva columna
            };
            const { data: adInsertData, error: adInsertError } = await supabaseClient.from('anuncios').insert([adData]).select().single();

            if (adInsertError || !adInsertData) {
                alert('Hubo un error al guardar tu anuncio.');
                formButton.disabled = false; formButton.textContent = 'Publicar Anuncio';
                return;
            }

            const newAdId = adInsertData.id;

            // Subir las imágenes de la galería (si las hay)
            if (galleryImageFiles.length > 0 && galleryImageFiles[0].size > 0) {
                const uploadPromises = galleryImageFiles.map(file => {
                    const fileName = `${Date.now()}_gallery_${file.name}`;
                    return supabaseClient.storage.from('imagenes_anuncios').upload(fileName, file);
                });
                const uploadResults = await Promise.all(uploadPromises);

                const imageUrls = uploadResults.map(result => {
                    if (result.data) {
                        return supabaseClient.storage.from('imagenes_anuncios').getPublicUrl(result.data.path).data.publicUrl;
                    }
                    return null;
                }).filter(url => url !== null);

                const imagesToInsert = imageUrls.map(url => ({ anuncio_id: newAdId, url_imagen: url }));
                await supabaseClient.from('imagenes').insert(imagesToInsert);
            }

            alert('¡Tu anuncio ha sido publicado con éxito!');
            window.location.href = `detalle-producto.html?id=${newAdId}`;
        });
    }
});
