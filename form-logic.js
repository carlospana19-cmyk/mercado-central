// form-logic.js (VERSIÓN PREMIUM FINAL)
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('publish-form');
    if (!form) return;

    // --- INICIALIZACIÓN DE ELEMENTOS ---
    const titleInput = document.getElementById('ad-title');
    const categorySelect = document.getElementById('ad-category');
    const priceInput = document.getElementById('ad-price');
    const locationInput = document.getElementById('ad-location');
    const descriptionInput = document.getElementById('ad-description');
    const coverImageInput = document.getElementById('ad-cover-image');
    const coverFileNameDisplay = document.getElementById('cover-file-name');
    const galleryDropArea = document.getElementById('gallery-drop-area');
    const galleryImageInput = document.getElementById('ad-gallery-images');
    const galleryPreview = document.getElementById('gallery-preview');
    const galleryFilesNameDisplay = document.getElementById('gallery-files-name');
    
    let existingGalleryImages = [];
    let newGalleryFiles = [];
    let imagenesAEliminar = [];

    // --- LÓGICA DE UI ---
    const categoriesHTML = `
    <option value="" disabled selected>-- Selecciona una categoría --</option>
    <optgroup label="Bienes Raíces">
        <option value="venta-inmuebles">Venta de Inmuebles</option>
        <option value="alquiler-inmuebles">Alquiler de Inmuebles</option>
        <option value="proyectos-nuevos">Proyectos Nuevos</option>
    </optgroup>
    <optgroup label="Vehículos">
        <option value="autos">Autos</option>
        <option value="motos">Motos</option>
        <option value="vehiculos-pesados">Vehículos Pesados</option>
        <option value="piezas-accesorios">Piezas y Accesorios</option>
    </optgroup>
    <optgroup label="Marketplace">
        <option value="electronica">Electrónica</option>
        <option value="hogar-muebles">Hogar y Muebles</option>
        <option value="moda-belleza">Moda y Belleza</option>
        <option value="mascotas">Mascotas y Animales</option>
        <option value="deportes-ocio">Deportes y Ocio</option>
    </optgroup>
    <optgroup label="Empleos y Servicios">
        <option value="ofertas-empleo">Ofertas de Empleo</option>
        <option value="servicios-profesionales">Servicios Profesionales</option>
        <option value="cursos-educacion">Cursos y Educación</option>
    </optgroup>
`;
    categorySelect.innerHTML = categoriesHTML;

    coverImageInput.addEventListener('change', () => {
        coverFileNameDisplay.textContent = coverImageInput.files.length > 0 ? coverImageInput.files[0].name : 'Ningún archivo seleccionado';
    });

    const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => window.addEventListener(eventName, preventDefaults));
    ['dragenter', 'dragover'].forEach(eventName => galleryDropArea.addEventListener(eventName, () => galleryDropArea.classList.add('highlight')));
    ['dragleave', 'drop'].forEach(eventName => galleryDropArea.addEventListener(eventName, () => galleryDropArea.classList.remove('highlight')));
    
    galleryDropArea.addEventListener('drop', (e) => addFilesToGallery(e.dataTransfer.files));
    galleryImageInput.addEventListener('change', (e) => addFilesToGallery(e.target.files));

    function addFilesToGallery(files) {
        for (let file of files) {
            if ((existingGalleryImages.length + newGalleryFiles.length) < 10) newGalleryFiles.push(file);
        }
        renderGalleryPreview();
    }

    function renderGalleryPreview() {
        galleryPreview.innerHTML = '';
        const allImages = [...existingGalleryImages, ...newGalleryFiles];
        galleryFilesNameDisplay.textContent = `${allImages.length} imágenes seleccionadas`;

        existingGalleryImages.forEach(url => {
            galleryPreview.innerHTML += `<div class="preview-image-wrapper"><img src="${url}" class="preview-image"><button type="button" class="remove-image-btn" data-url="${url}">&times;</button></div>`;
        });
        newGalleryFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = e => {
                galleryPreview.innerHTML += `<div class="preview-image-wrapper"><img src="${e.target.result}" class="preview-image"><button type="button" class="remove-image-btn" data-index="${index}">&times;</button></div>`;
            };
            reader.readAsDataURL(file);
        });
    }

    galleryPreview.addEventListener('click', e => {
        if (e.target.classList.contains('remove-image-btn')) {
            if (e.target.dataset.url) {
                const url = e.target.dataset.url;
                imagenesAEliminar.push(url);
                // --- AÑADIR ESTE LOG ---
                console.log('Imagen añadida a la lista de borrado:', url);
                console.log('Lista de borrado actual:', imagenesAEliminar);
                // ----------------------
                existingGalleryImages = existingGalleryImages.filter(imgUrl => imgUrl !== url);
            } else {
                const index = parseInt(e.target.dataset.index);
                newGalleryFiles.splice(index, 1);
            }
            renderGalleryPreview();
        }
    });

    // --- LÓGICA PRINCIPAL ---
    const params = new URLSearchParams(window.location.search);
    const adId = params.get('id');
    const isEditMode = !!adId;

    if (isEditMode) {
        document.querySelector('h1').textContent = 'Editar tu Anuncio';
        form.querySelector('button[type="submit"]').textContent = 'Guardar Cambios';
        loadAdForEditing(adId);
        form.addEventListener('submit', (event) => handleFormSubmit(event, adId));
    } else {
        form.addEventListener('submit', (event) => handleFormSubmit(event));
    }

    async function loadAdForEditing(id) {
        const { data: ad } = await supabaseClient.from('anuncios').select('*').eq('id', id).single();
        if (!ad) {
            alert('No se pudo cargar el anuncio.');
            window.location.href = 'dashboard.html';
            return;
        }
        titleInput.value = ad.titulo;
        priceInput.value = ad.precio;
        locationInput.value = ad.ubicacion;
        descriptionInput.value = ad.descripcion;
        setTimeout(() => { categorySelect.value = ad.categoria; }, 1);

        const { data: images } = await supabaseClient.from('imagenes').select('url_imagen').eq('anuncio_id', id);
        if (images) { existingGalleryImages = images.map(i => i.url_imagen); }
        renderGalleryPreview();
    }

    async function handleFormSubmit(event, existingAdId = null) {
        event.preventDefault();
        const formButton = form.querySelector('button[type="submit"]');
        formButton.disabled = true;
        formButton.textContent = 'Procesando...';

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) { /* ... manejo de usuario no logueado ... */ return; }

        const formData = new FormData(form);
        const coverFile = formData.get('coverImage');

        const adData = {
            titulo: formData.get('title'),
            descripcion: formData.get('description'),
            precio: formData.get('price'),
            categoria: formData.get('category'),
            ubicacion: formData.get('location'),
            user_id: user.id
        };

        // --- LÓGICA DE SUBIDA/ACTUALIZACIÓN ---

        // 1. Manejar la imagen de portada (si se subió una nueva)
        if (coverFile && coverFile.size > 0) {
            const fileName = `${Date.now()}_cover_${coverFile.name}`;
            await supabaseClient.storage.from('imagenes_anuncios').upload(fileName, coverFile);
            adData.url_portada = supabaseClient.storage.from('imagenes_anuncios').getPublicUrl(fileName).data.publicUrl;
        }

        let adIdToRedirect = existingAdId;

        if (isEditMode) {
            // MODO UPDATE: Actualizamos los datos de texto del anuncio
            await supabaseClient.from('anuncios').update(adData).eq('id', existingAdId);
        } else {
            // MODO INSERT: Creamos el anuncio
            const { data } = await supabaseClient.from('anuncios').insert(adData).select().single();
            if (data) { adIdToRedirect = data.id; }
        }

        if (!adIdToRedirect) {
            alert('Hubo un error crítico al guardar el anuncio.');
            formButton.disabled = false; formButton.textContent = 'Guardar';
            return;
        }

        // --- LÓGICA DE GALERÍA INTELIGENTE ---

        // 2. Borrar imágenes de la galería marcadas para eliminar
        if (isEditMode && imagenesAEliminar.length > 0) {
            // --- AÑADIR ESTOS LOGS ---
            console.log('Intentando borrar estas URLs de la base de datos:', imagenesAEliminar);
            // -------------------------

            // Borramos las referencias de la base de datos.
            const { error: deleteError } = await supabaseClient
                .from('imagenes')
                .delete()
                .in('url_imagen', imagenesAEliminar);

            // --- AÑADIR ESTE LOG ---
            if (deleteError) {
                console.error('Error devuelto por Supabase al borrar imágenes:', deleteError);
            } else {
                console.log('Petición de borrado a Supabase enviada con éxito.');
            }
            // ----------------------

            // Borrar archivos de Supabase Storage explícitamente
            for (const url of imagenesAEliminar) {
                // Extraer la ruta del archivo desde la URL pública
                const path = url.split('/object/public/imagenes_anuncios/')[1];
                if (path) {
                    const { error: storageError } = await supabaseClient
                        .storage
                        .from('imagenes_anuncios')
                        .remove([path]);
                    if (storageError) {
                        console.error('Error al borrar archivo de Storage:', storageError, 'para URL:', url);
                    } else {
                        console.log('Archivo borrado de Storage exitosamente:', path);
                    }
                }
            }
        }

        // 3. Subir las nuevas imágenes de la galería
        if (newGalleryFiles.length > 0) {
            const uploadPromises = newGalleryFiles.map(file => {
                const fileName = `${Date.now()}_gallery_${file.name}`;
                return supabaseClient.storage.from('imagenes_anuncios').upload(fileName, file);
            });
            const results = await Promise.all(uploadPromises);
            const urls = results.map(res => res.data ? supabaseClient.storage.from('imagenes_anuncios').getPublicUrl(res.data.path).data.publicUrl : null).filter(Boolean);

            if (urls.length > 0) {
                const imagesToInsert = urls.map(url => ({ anuncio_id: adIdToRedirect, url_imagen: url }));
                await supabaseClient.from('imagenes').insert(imagesToInsert);
            }
        }

        alert(isEditMode ? '¡Anuncio actualizado con éxito!' : '¡Anuncio publicado con éxito!');
        window.location.href = `detalle-producto.html?id=${adIdToRedirect}`;
    }
});
