// editar-anuncio-logic.js (VERSIÓN FINAL CON PREVISUALIZACIÓN COMPLETA)

document.addEventListener('DOMContentLoaded', async () => {
    // =============================================================
    // --- 1. DECLARACIONES Y REFERENCIAS ---
    // =============================================================
    const form = document.getElementById('publish-form');
    if (!form) { console.error("Formulario #publish-form no encontrado."); return; }

    const titleInput = document.getElementById('ad-title');
    const categorySelect = document.getElementById('ad-category');
    const priceInput = document.getElementById('ad-price');
    const locationInput = document.getElementById('ad-location');
    const descriptionInput = document.getElementById('ad-description');
    const coverImageInput = document.getElementById('ad-cover-image');
    const coverFileNameDisplay = document.getElementById('cover-file-name');
    const dropArea = document.getElementById('gallery-drop-area');
    const galleryInput = document.getElementById('ad-gallery-images');
    const galleryPreview = document.getElementById('gallery-preview');

    const params = new URLSearchParams(window.location.search);
    const adId = params.get('id');
    if (!adId) { document.body.innerHTML = '<h1>Error: ID de anuncio no proporcionado.</h1>'; return; }

    let imagesToDelete = [];
    let newGalleryFiles = [];

    // =============================================================
    // --- 2. LÓGICA DE CARGA DE DATOS EXISTENTES ---
    // =============================================================
    async function loadAdForEditing() {
        const { data: ad, error: adError } = await supabaseClient.from('anuncios').select('*').eq('id', adId).single();
        const { data: images, error: imagesError } = await supabaseClient.from('imagenes').select('url_imagen').eq('anuncio_id', adId);

        if (adError || !ad) { console.error("Error al cargar anuncio:", adError); return; }

        document.querySelector('h1').textContent = 'Editar Anuncio';
        form.querySelector('button[type="submit"]').textContent = 'Guardar Cambios';

        titleInput.value = ad.titulo;
        priceInput.value = ad.precio;
        locationInput.value = ad.ubicacion;
        descriptionInput.value = ad.descripcion;
        coverFileNameDisplay.textContent = ad.url_portada ? `Portada actual: ${ad.url_portada.split('/').pop()}` : 'Ninguna portada seleccionada';
        
        if (images) {
            galleryPreview.innerHTML = '';
            images.forEach(({ url_imagen }) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'preview-image-wrapper';
                wrapper.innerHTML = `<img src="${url_imagen}" class="preview-image"><button type="button" class="remove-image-btn" data-url="${url_imagen}">&times;</button>`;
                galleryPreview.appendChild(wrapper);
            });
        }
    }

    // =============================================================
    // --- 3. LÓGICA DE INTERACCIÓN DEL USUARIO (NUEVAS IMÁGENES) ---
    // =============================================================
    
    // --- Previsualización de NUEVA portada ---
    coverImageInput.addEventListener('change', () => {
        if (coverImageInput.files.length > 0) {
            coverFileNameDisplay.textContent = `Nueva portada: ${coverImageInput.files[0].name}`;
        }
    });
    
    // --- Previsualización de NUEVAS imágenes de galería (Drag & Drop) ---
    const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => dropArea.addEventListener(eventName, preventDefaults));
    ['dragenter', 'dragover'].forEach(eventName => dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight')));
    ['dragleave', 'drop'].forEach(eventName => dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight')));
    
    dropArea.addEventListener('drop', (e) => handleNewFiles(e.dataTransfer.files));
    galleryInput.addEventListener('change', () => handleNewFiles(galleryInput.files));

    function handleNewFiles(files) {
        [...files].forEach(file => {
            if (galleryPreview.children.length < 10) {
                newGalleryFiles.push(file);
                previewNewFile(file);
            }
        });
    }

    function previewNewFile(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const wrapper = document.createElement('div');
            wrapper.className = 'preview-image-wrapper';
            wrapper.innerHTML = `<img src="${reader.result}" class="preview-image"><button type="button" class="remove-image-btn new-file" data-filename="${file.name}">&times;</button>`;
            galleryPreview.appendChild(wrapper);
        };
    }

    galleryPreview.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-image-btn')) {
            const wrapper = e.target.closest('.preview-image-wrapper');
            if (e.target.dataset.url) { // Es una imagen existente
                imagesToDelete.push(e.target.dataset.url);
                console.log("Imágenes marcadas para eliminar:", imagesToDelete);
            } else { // Es una imagen nueva
                const fileName = e.target.dataset.filename;
                newGalleryFiles = newGalleryFiles.filter(f => f.name !== fileName);
            }
            wrapper.remove();
        }
    });

    // =============================================================
    // --- 4. LÓGICA DE ENVÍO DEL FORMULARIO ---
    // =============================================================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formButton = form.querySelector('button[type="submit"]');
        formButton.disabled = true;
        formButton.textContent = 'Guardando...';

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) throw new Error("Sesión de usuario no encontrada.");

            // 1. ELIMINAR IMÁGENES MARCADAS (DB y Storage)
            if (imagesToDelete.length > 0) {
                const fileNamesToDelete = imagesToDelete.map(url => url.substring(url.lastIndexOf('/') + 1));
                await supabaseClient.storage.from('imagenes_anuncios').remove(fileNamesToDelete);
                await supabaseClient.from('imagenes').delete().in('url_imagen', imagesToDelete);
                console.log(`${imagesToDelete.length} imágenes existentes eliminadas.`);
            }

            // 2. SUBIR NUEVAS IMÁGENES DE GALERÍA
            if (newGalleryFiles.length > 0) {
                const uploadPromises = newGalleryFiles.map(async file => {
                    const filePath = `${user.id}/${Date.now()}_gallery_${file.name}`;
                    await supabaseClient.storage.from('imagenes_anuncios').upload(filePath, file);
                    const { data } = supabaseClient.storage.from('imagenes_anuncios').getPublicUrl(filePath);
                    return { url_imagen: data.publicUrl, anuncio_id: adId };
                });
                const newImageObjects = await Promise.all(uploadPromises);
                await supabaseClient.from('imagenes').insert(newImageObjects);
                console.log(`${newGalleryFiles.length} nuevas imágenes de galería subidas.`);
            }

            // 3. ACTUALIZAR DATOS DEL ANUNCIO (incluyendo nueva portada si la hay)
            const updatedAdData = {
                titulo: titleInput.value,
                precio: parseFloat(priceInput.value),
                ubicacion: locationInput.value,
                descripcion: descriptionInput.value,
                categoria: categorySelect.value,
            };

            if (coverImageInput.files.length > 0) {
                const file = coverImageInput.files[0];
                const filePath = `${user.id}/${Date.now()}_cover_${file.name}`;
                await supabaseClient.storage.from('imagenes_anuncios').upload(filePath, file);
                const { data } = supabaseClient.storage.from('imagenes_anuncios').getPublicUrl(filePath);
                updatedAdData.url_portada = data.publicUrl;
            }

            await supabaseClient.from('anuncios').update(updatedAdData).eq('id', adId);
            console.log("Datos del anuncio actualizados.");

            alert('¡Anuncio actualizado con éxito!');
            window.location.href = `detalle-producto.html?id=${adId}`;

        } catch (error) {
            console.error("Error al guardar los cambios:", error);
            alert(`Hubo un error al guardar: ${error.message}`);
            formButton.disabled = false;
            formButton.textContent = 'Guardar Cambios';
        }
    });

    // =============================================================
    // --- 5. INICIO DE LA EJECUCIÓN ---
    // =============================================================
    await loadAdForEditing();
});
