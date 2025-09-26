// form-logic.js (Controla AMBAS páginas: publicar y editar)

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
    let imagesToDeleteFromStorage = [];

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
        updateFileInputAndPreview();
    }

    function updateFileInputAndPreview() {
        galleryPreview.innerHTML = '';
        const dataTransfer = new DataTransfer();
        existingGalleryImages.forEach(url => {
            galleryPreview.innerHTML += `<div class="preview-image-wrapper"><img src="${url}" class="preview-image"><button type="button" class="remove-image-btn" data-url="${url}">&times;</button></div>`;
        });
        newGalleryFiles.forEach((file, index) => {
            dataTransfer.items.add(file);
            const reader = new FileReader();
            reader.onload = e => {
                galleryPreview.innerHTML += `<div class="preview-image-wrapper"><img src="${e.target.result}" class="preview-image"><button type="button" class="remove-image-btn" data-index="${index}">&times;</button></div>`;
            };
            reader.readAsDataURL(file);
        });
        galleryImageInput.files = dataTransfer.files;
        galleryFilesNameDisplay.textContent = `${existingGalleryImages.length + newGalleryFiles.length} imágenes en galería`;
    }

    galleryPreview.addEventListener('click', e => {
        if (e.target.classList.contains('remove-image-btn')) {
            if (e.target.dataset.url) {
                const url = e.target.dataset.url;
                imagesToDeleteFromStorage.push(url);
                existingGalleryImages = existingGalleryImages.filter(imgUrl => imgUrl !== url);
            } else {
                const index = parseInt(e.target.dataset.index);
                newGalleryFiles.splice(index, 1);
            }
            updateFileInputAndPreview();
        }
    });

    // --- LÓGICA PRINCIPAL DE LA PÁGINA ---
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
        const { data: ad, error } = await supabaseClient.from('anuncios').select('*').eq('id', id).single();
        if (ad) {
            titleInput.value = ad.titulo;
            priceInput.value = ad.precio;
            locationInput.value = ad.ubicacion;
            descriptionInput.value = ad.descripcion;
            setTimeout(() => { categorySelect.value = ad.categoria; }, 1);

            const { data: images } = await supabaseClient.from('imagenes').select('url_imagen').eq('anuncio_id', id);
            if (images) { existingGalleryImages = images.map(i => i.url_imagen); }
            updateFileInputAndPreview();
        }
    }

    async function handleFormSubmit(event, existingAdId = null) {
        event.preventDefault();
        const formButton = form.querySelector('button[type="submit"]');
        formButton.disabled = true;
        formButton.textContent = 'Procesando...';

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) { window.location.href = 'login.html'; return; }

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

        if (coverFile && coverFile.size > 0) {
            const fileName = `${Date.now()}_cover_${coverFile.name}`;
            await supabaseClient.storage.from('imagenes_anuncios').upload(fileName, coverFile);
            adData.url_portada = supabaseClient.storage.from('imagenes_anuncios').getPublicUrl(fileName).data.publicUrl;
        }

        let adIdToRedirect = existingAdId;

        if (isEditMode) {
            await supabaseClient.from('anuncios').update(adData).eq('id', existingAdId);
        } else {
            const { data } = await supabaseClient.from('anuncios').insert(adData).select().single();
            if (data) { adIdToRedirect = data.id; }
        }

        if (!adIdToRedirect) { alert('Error al guardar el anuncio.'); return; }

        if (isEditMode && imagesToDeleteFromStorage.length > 0) {
            const fileNames = imagesToDeleteFromStorage.map(url => url.split('/').pop());
            await supabaseClient.storage.from('imagenes_anuncios').remove(fileNames);
            await supabaseClient.from('imagenes').delete().in('url_imagen', imagesToDeleteFromStorage);
        }

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

        alert(isEditMode ? '¡Anuncio actualizado!' : '¡Anuncio publicado!');
        window.location.href = `detalle-producto.html?id=${adIdToRedirect}`;
    }
});
