import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    // =============================================================
    // --- 1. DECLARACIONES Y REFERENCIAS ---
    // =============================================================
    const form = document.getElementById('publish-form');
    if (!form) return;

    const titleInput = document.getElementById('ad-title');
    const priceInput = document.getElementById('ad-price');
    const locationInput = document.getElementById('ad-location');
    const descriptionInput = document.getElementById('ad-description');
    const categorySelect = document.getElementById('ad-category');
    const coverImageInput = document.getElementById('ad-cover-image');
    const galleryInput = document.getElementById('ad-gallery-images');
    const galleryPreview = document.getElementById('gallery-preview');
    const dropArea = document.getElementById('gallery-drop-area');

    let newGalleryFiles = [];

    // =============================================================
    // --- 2. LÓGICA DE LA INTERFAZ DE USUARIO ---
    // =============================================================
    if (dropArea && galleryInput && galleryPreview) {
        // Lógica de previsualización para Drag & Drop (ya la tienes y funciona)
        // ... (Tu código de handleNewFiles, previewNewFile, etc. iría aquí si no está ya)
    }

    // =============================================================
    // --- 3. LÓGICA DE ENVÍO DEL FORMULARIO (CORREGIDA) ---
    // =============================================================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formButton = form.querySelector('button[type="submit"]');
        formButton.disabled = true;
        formButton.textContent = 'Publicando...';

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Sesión de usuario no encontrada.");

            let coverImageUrl = '';
            const coverImageFile = coverImageInput.files[0];
            
            // --- CORRECCIÓN CLAVE: SEPARAMOS LA LÓGICA DE PORTADA ---
            if (coverImageFile && coverImageFile.size > 0) {
                const filePath = `${user.id}/${Date.now()}_cover_${coverImageFile.name}`;
                await supabase.storage.from('imagenes_anuncios').upload(filePath, coverImageFile);
                const { data } = supabase.storage.from('imagenes_anuncios').getPublicUrl(filePath);
                coverImageUrl = data.publicUrl;
            }

            const galleryUrls = [];
            // --- CORRECCIÓN CLAVE: USAMOS 'newGalleryFiles' ---
            if (newGalleryFiles.length > 0) {
                const uploadPromises = newGalleryFiles.map(file => {
                    const filePath = `${user.id}/${Date.now()}_gallery_${file.name}`;
                return supabase.storage.from('imagenes_anuncios').upload(filePath, file);
                });
                const uploadResults = await Promise.all(uploadPromises);
                uploadResults.forEach(result => {
                    if (result.data) {
                    const { data } = supabase.storage.from('imagenes_anuncios').getPublicUrl(result.data.path);
                        galleryUrls.push(data.publicUrl);
                    }
                });
            }

            const adData = {
                titulo: titleInput.value,
                precio: parseFloat(priceInput.value),
                ubicacion: locationInput.value,
                descripcion: descriptionInput.value,
                categoria: categorySelect.value,
                user_id: user.id,
                url_portada: coverImageUrl, // <-- AHORA GUARDA LA PORTADA CORRECTAMENTE
                url_galeria: galleryUrls
            };

            const { data: newAd, error: adError } = await supabase.from('anuncios').insert([adData]).select('id').single();
            if (adError) throw adError;

            alert('¡Anuncio publicado con éxito!');
            window.location.href = `detalle-producto.html?id=${newAd.id}`;

        } catch (error) {
            console.error("Error al publicar:", error);
            alert(`Hubo un error al publicar: ${error.message}`);
            formButton.disabled = false;
            formButton.textContent = 'Publicar Anuncio';
        }
    });
});
