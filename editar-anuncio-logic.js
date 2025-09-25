// editar-anuncio-logic.js (VERSIÓN FINAL Y 100% CORREGIDA)



const form = document.getElementById('publish-form');
let currentAdId = null;

// Función para rellenar las categorías
function fillCategorySelect() {
    const categorySelect = document.getElementById('ad-category');
    const categoriesHTML = `
        <option value="" disabled>-- Selecciona una categoría --</option>
        <optgroup label="Bienes Raíces"><option value="venta-inmuebles">Venta de Inmuebles</option><option value="alquiler-inmuebles">Alquiler de Inmuebles</option></optgroup>
        <optgroup label="Vehículos"><option value="autos">Autos</option><option value="motos">Motos</option></optgroup>
        <optgroup label="Marketplace"><option value="electronica">Electrónica</option><option value="hogar-muebles">Hogar y Muebles</option></optgroup>
        <optgroup label="Empleos y Servicios"><option value="ofertas-empleo">Ofertas de Empleo</option><option value="servicios-profesionales">Servicios Profesionales</option></optgroup>
    `;
    categorySelect.innerHTML = categoriesHTML;
}

// Función para cargar los datos del anuncio
async function loadAdForEditing() {
    const params = new URLSearchParams(window.location.search);
    currentAdId = params.get('id');

    if (!currentAdId) {
        alert('ID de anuncio no válido.');
        window.location.href = 'dashboard.html';
        return;
    }

    fillCategorySelect();

    const { data: ad, error } = await supabaseClient.from('anuncios').select('*').eq('id', currentAdId).single();

    if (error || !ad) {
        alert('No se pudo cargar el anuncio para editar.');
        window.location.href = 'dashboard.html';
    } else {
        // Rellenamos el formulario usando los 'name' de los inputs para más robustez
        form.elements['title'].value = ad.titulo;
        form.elements['price'].value = ad.precio;
        form.elements['location'].value = ad.ubicacion;
        form.elements['description'].value = ad.descripcion;
        setTimeout(() => { form.elements['category'].value = ad.categoria; }, 1);
    }
}

// Lógica para manejar el envío del formulario
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formButton = form.querySelector('button[type="submit"]');
    formButton.disabled = true;
    formButton.textContent = 'Guardando...';

    const formData = new FormData(form);
    const newCoverImage = formData.get('coverImage');
    const newGalleryImages = formData.getAll('galleryImages').filter(f => f.size > 0);

    const updatedAd = {
        titulo: formData.get('title'),
        categoria: formData.get('category'),
        precio: formData.get('price'),
        ubicacion: formData.get('location'),
        descripcion: formData.get('description'),
    };

    // --- LÓGICA DE ACTUALIZACIÓN DE IMAGEN DE PORTADA ---
    if (newCoverImage && newCoverImage.size > 0) {
        const fileName = `${Date.now()}_cover_${newCoverImage.name}`;
        await supabaseClient.storage.from('imagenes_anuncios').upload(fileName, newCoverImage);
        updatedAd.url_portada = supabaseClient.storage.from('imagenes_anuncios').getPublicUrl(fileName).data.publicUrl;
    }

    // --- LÓGICA DE ACTUALIZACIÓN DE GALERÍA (Más compleja: borra las viejas, sube las nuevas) ---
    if (newGalleryImages.length > 0) {
        // Primero, borramos las imágenes antiguas de la galería
        await supabaseClient.from('imagenes').delete().eq('anuncio_id', currentAdId);

        // Luego, subimos las nuevas
        const uploadPromises = newGalleryImages.map(file => {
            const fileName = `${Date.now()}_gallery_${file.name}`;
            return supabaseClient.storage.from('imagenes_anuncios').upload(fileName, file);
        });
        const uploadResults = await Promise.all(uploadPromises);
        const imageUrls = uploadResults.map(res => res.data ? supabaseClient.storage.from('imagenes_anuncios').getPublicUrl(res.data.path).data.publicUrl : null).filter(Boolean);
        
        if (imageUrls.length > 0) {
            const imagesToInsert = imageUrls.map(url => ({ anuncio_id: currentAdId, url_imagen: url }));
            await supabaseClient.from('imagenes').insert(imagesToInsert);
        }
    }

    // Actualizamos el anuncio con los datos de texto y la nueva URL de portada si la hay
    const { error: updateError } = await supabaseClient.from('anuncios').update(updatedAd).eq('id', currentAdId);

    if (updateError) {
        alert('Hubo un error al guardar los cambios.');
    } else {
        alert('¡Anuncio actualizado con éxito!');
        window.location.href = 'dashboard.html';
    }
    formButton.disabled = false;
    formButton.textContent = 'Guardar Cambios';
});

// Punto de entrada principal
document.addEventListener('DOMContentLoaded', loadAdForEditing);
