// form-logic.js (Controla AMBAS páginas: publicar y editar)

document.addEventListener('DOMContentLoaded', () => {
    // Si no estamos en una página con el formulario, no hacemos nada.
    const form = document.getElementById('publish-form');
    if (!form) return;

    // --- INICIALIZACIÓN DE ELEMENTOS DEL DOM ---
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
    
    let galleryFiles = []; // Nuestro array para gestionar los archivos de la galería

    // --- LÓGICA DE LA INTERFAZ (UI) ---

    // 1. Rellenar el selector de categorías
    const categoriesHTML = `
        <option value="" disabled selected>-- Selecciona una categoría --</option>
        <optgroup label="Bienes Raíces"><option value="venta-inmuebles">Venta de Inmuebles</option><option value="alquiler-inmuebles">Alquiler de Inmuebles</option></optgroup>
        <optgroup label="Vehículos"><option value="autos">Autos</option><option value="motos">Motos</option></optgroup>
        <optgroup label="Marketplace"><option value="electronica">Electrónica</option><option value="hogar-muebles">Hogar y Muebles</option></optgroup>
        <optgroup label="Empleos y Servicios"><option value="ofertas-empleo">Ofertas de Empleo</option><option value="servicios-profesionales">Servicios Profesionales</option></optgroup>
    `;
    categorySelect.innerHTML = categoriesHTML;

    // 2. Lógica para mostrar nombre de archivo de portada
    coverImageInput.addEventListener('change', () => {
        coverFileNameDisplay.textContent = coverImageInput.files.length > 0 ? coverImageInput.files[0].name : 'Ningún archivo seleccionado';
    });

    // 3. Lógica completa y robusta para Drag & Drop
    const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => window.addEventListener(eventName, preventDefaults));
    ['dragenter', 'dragover'].forEach(eventName => galleryDropArea.addEventListener(eventName, () => galleryDropArea.classList.add('highlight')));
    ['dragleave', 'drop'].forEach(eventName => galleryDropArea.addEventListener(eventName, () => galleryDropArea.classList.remove('highlight')));
    
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
                galleryPreview.innerHTML += `<div class="preview-image-wrapper"><img src="${e.target.result}" class="preview-image" title="${file.name}"><button type="button" class="remove-image-btn" data-index="${index}">&times;</button></div>`;
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

    // --- LÓGICA PRINCIPAL DE LA PÁGINA ---
    const params = new URLSearchParams(window.location.search);
    const adId = params.get('id');
    const isEditMode = !!adId;

    if (isEditMode) {
        // MODO EDICIÓN
        document.querySelector('h1').textContent = 'Editar tu Anuncio';
        form.querySelector('button[type="submit"]').textContent = 'Guardar Cambios';
        loadAdForEditing(adId);
        form.addEventListener('submit', (event) => handleFormSubmit(event, adId));
    } else {
        // MODO PUBLICACIÓN
        form.addEventListener('submit', handleFormSubmit);
    }

    async function loadAdForEditing(id) {
        const { data: ad, error } = await supabaseClient.from('anuncios').select('*').eq('id', id).single();
        if (error || !ad) {
            alert('No se pudo cargar el anuncio para editar.');
            window.location.href = 'dashboard.html';
        } else {
            titleInput.value = ad.titulo;
            priceInput.value = ad.precio;
            locationInput.value = ad.ubicacion;
            descriptionInput.value = ad.descripcion;
            setTimeout(() => { categorySelect.value = ad.categoria; }, 1);
        }
    }

    async function handleFormSubmit(event, existingAdId = null) {
        event.preventDefault();
        const formButton = form.querySelector('button[type="submit"]');
        formButton.disabled = true;
        formButton.textContent = 'Procesando...';

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            alert('Necesitas iniciar sesión.');
            window.location.href = 'login.html';
            return;
        }

        const formData = new FormData(form);
        const coverFile = formData.get('coverImage');
        const galleryFiles = formData.getAll('galleryImages').filter(f => f.size > 0);

        const adData = {
            titulo: formData.get('title'),
            descripcion: formData.get('description'),
            precio: formData.get('price'),
            categoria: formData.get('category'),
            ubicacion: formData.get('location'),
            user_id: user.id
        };

        // Lógica para subir/actualizar portada
        if (coverFile && coverFile.size > 0) {
            const fileName = `${Date.now()}_cover_${coverFile.name}`;
            await supabaseClient.storage.from('imagenes_anuncios').upload(fileName, coverFile);
            adData.url_portada = supabaseClient.storage.from('imagenes_anuncios').getPublicUrl(fileName).data.publicUrl;
        }

        let adIdToRedirect = existingAdId;

        if (isEditMode) {
            // MODO UPDATE
            const { error } = await supabaseClient.from('anuncios').update(adData).eq('id', existingAdId);
            if (error) { /* manejo de error */ }
        } else {
            // MODO INSERT
            const { data, error } = await supabaseClient.from('anuncios').insert([adData]).select().single();
            if (error) { /* manejo de error */ } else { adIdToRedirect = data.id; }
        }
        
        // Lógica para subir/actualizar galería (si hay nuevas imágenes)
        if (galleryFiles.length > 0 && adIdToRedirect) {
            if (isEditMode) { await supabaseClient.from('imagenes').delete().eq('anuncio_id', adIdToRedirect); }
            
            const uploadPromises = galleryFiles.map(file => {
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

        alert(isEditMode ? '¡Anuncio actualizado!' : '¡Anuncio publicado!');
        window.location.href = `detalle-producto.html?id=${adIdToRedirect}`;
    }
});
