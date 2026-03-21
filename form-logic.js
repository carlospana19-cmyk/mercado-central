import { supabase } from './supabase-client.js';
// Las funciones de token se acceden via window (expuestas por publish-logic.js)

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('ad-form');
    if (!form) {
        console.log('Formulario ad-form no encontrado');
        return;
    }

    const titleInput = document.getElementById('title');
    const priceInput = document.getElementById('price');
    const locationInput = document.getElementById('location-search');
    const descriptionInput = document.getElementById('description');
    const categorySelect = document.getElementById('categoria-step4');
    const provinceSelect = document.getElementById('province-step4');
    const districtSelect = document.getElementById('district-step4');
    const coverImageInput = document.getElementById('cover-image-input');
    const galleryInput = document.getElementById('gallery-images-input');

    // ⭐ VISIBILIDAD CAMPOS DINÁMICOS (mejorada)
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            const selectedText = this.options[this.selectedIndex].text; // ⭐ NOMBRE no ID
            const selectedId = this.value; // ID numérico
            
            console.log('🔍 Categoría TEXT:', selectedText, 'ID:', selectedId);
            
            // Ocultar TODAS las secciones
            const sections = [
                'realestate-details', 'vehicle-details', 'electronics-details',
                'home-furniture-details', 'fashion-details', 'sports-details',
                'pets-details', 'services-details', 'business-details', 'community-details'
            ];
            
            sections.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });

            // ⭐ MOSTRAR seccción correcta por NOMBRE (text)
            const showSection = (sectionId) => {
                const el = document.getElementById(sectionId);
                if (el) {
                    el.style.display = 'block';
                    console.log('✅ Mostrando sección:', sectionId);
                }
            };

            if (selectedText.includes('Inmuebles') || selectedId === '2') showSection('realestate-details');
            else if (selectedText.includes('Vehículos') || selectedId === '1') showSection('vehicle-details');
            else if (selectedText.includes('Electrónica') || selectedId === '3') showSection('electronics-details');
            else if (selectedText.includes('Hogar') || selectedText.includes('Muebles') || selectedId === '4') showSection('home-furniture-details');
            else if (selectedText.includes('Moda') || selectedId === '5') showSection('fashion-details');
            else if (selectedText.includes('Deportes') || selectedId === '6') showSection('sports-details');
            else if (selectedText.includes('Mascotas') || selectedId === '7') showSection('pets-details');
            else if (selectedText.includes('Servicios') || selectedId === '8') showSection('services-details');
            else if (selectedText.includes('Negocios') || selectedId === '9') showSection('business-details');
            else if (selectedText.includes('Comunidad') || selectedId === '10') showSection('community-details');
        });
    }

    // SUBMIT FORM - ⭐ CAPTURA MEJORADA ATRIBUTOS
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formButton = form.querySelector('button[type="submit"]');
        formButton.disabled = true;
        formButton.textContent = 'Publicando...';

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario no autenticado");

            // SUBIR IMÁGENES (sin cambios)
            let coverImageUrl = '';
            const coverImageFile = coverImageInput.files[0];
            if (coverImageFile) {
                const filePath = `${user.id}/${Date.now()}_cover_${coverImageFile.name}`;
                await supabase.storage.from('imagenes_anuncios').upload(filePath, coverImageFile);
                const { data } = supabase.storage.from('imagenes_anuncios').getPublicUrl(filePath);
                coverImageUrl = data.publicUrl;
            }

            const galleryFiles = window.galleryFiles || [];
            const galleryUrls = [];
            for (const file of galleryFiles) {
                const fileName = `${Date.now()}_gallery_${file.name}`;
                const { data } = await supabase.storage.from('imagenes_anuncios').upload(`${user.id}/${fileName}`, file);
                if (data) {
                    const { data: urlData } = supabase.storage.from('imagenes_anuncios').getPublicUrl(data.path);
                    galleryUrls.push(urlData.publicUrl);
                }
            }

            // ⭐ CAPTURA ATRIBUTOS MEJORADA - NUNCA VACÍO
            const categoriaNombre = categorySelect.options[categorySelect.selectedIndex].text;
            console.log('📦 Publicando categoría:', categoriaNombre);
            
            let atributos = {};

          // 📦 MÉTODO ESCÁNER 2.0: Busca con o sin prefijo "attr-"
            atributos = {}; // Usamos la variable directa
            
            const camposClave = [
                'anio', 'combustible', 'kilometraje', 'm2', 'habitaciones', 'banos', 'piso', 'estacionamiento',
                'marca', 'modelo', 'almacenamiento', 'memoria_ram', 'procesador', 'condicion', 
                'tipo_electrodomestico', 'tipo_mueble', 'tipo_articulo', 'tipo_decoracion', 'material', 'color', 
                'talla', 'edad', 'tipo_bicicleta', 'tipo_instrumento', 'aro', 'raza', 'genero', 'edad_mascota', 
                'tipo_anuncio', 'tipo_servicio', 'modalidad', 'experiencia', 'tipo_negocio', 'razon_venta', 
                'tipo_evento', 'tipo_actividad', 'tipo_clase', 'nivel', 'fecha_evento'
            ];

            camposClave.forEach(clave => {
                // 🔍 LA MAGIA AQUÍ: Buscamos el ID normal O el ID con "attr-"
                const el = document.getElementById(clave) || document.getElementById('attr-' + clave);
                
                // Además, filtramos si el usuario dejó la opción por defecto "Seleccionar"
                if (el && el.value && el.value.trim() !== '' && el.value !== '0' && el.value.toLowerCase() !== 'seleccionar') {
                    let valor = el.value.trim();
                    
                    // Si es un campo numérico (como m2 o km), lo convertimos a número
                    if (['kilometraje', 'm2', 'anio', 'habitaciones', 'banos'].includes(clave)) {
                        valor = parseFloat(valor.replace(/,/g, '')) || 0;
                    }
                    
                    // Lo guardamos siempre con la clave limpia (ej: "raza")
                    atributos[clave] = valor;
                }
            });

            console.log('✅ Atributos empacados para Supabase:', atributos);

            // ⭐ DEBUG: Siempre mostrar qué se capturó
            console.log('✅ Atributos capturados:', atributos);

            // Datos finales para Supabase
            const adData = {
                user_id: user.id,
                titulo: titleInput.value.trim(),
                descripcion: descriptionInput.value.trim(),
                precio: parseFloat(priceInput.value) || 0,
                categoria: categoriaNombre, // ⭐ NOMBRE correcto
                provincia: provinceSelect?.value || '',
                distrito: districtSelect?.value || '',
                direccion_exacta: locationInput.value || '',url_portada: coverImageUrl,
                url_galeria: galleryUrls,
                
                // ⭐ EL CAMBIO VITAL: Sin JSON.stringify, solo la variable limpia
                atributos_clave: atributos, 
                
                activo: true,
                fecha_publicacion: new Date().toISOString()
            };

            // Plan logic (sin cambios)
            const selectedPlan = sessionStorage.getItem('selectedPlan') || 'free';
            adData.selected_plan = selectedPlan;
            adData.featured_plan = selectedPlan;

            console.log('🚀 Enviando a Supabase:', adData);

            // INSERTAR
            const { data: newAd, error } = await supabase.from('anuncios').insert([adData]).select('id').single();
            if (error) throw error;

            console.log('✅ Anuncio publicado ID:', newAd.id);

            // Tokens (sin cambios)
            const pendingToken = window.pendingTokenData;
            if (pendingToken && pendingToken.id) {
                await window.markTokenAsUsed(pendingToken);
            }

            sessionStorage.removeItem('selectedPlan');
            sessionStorage.removeItem('tokenApplied');
            
            alert('✅ ¡Anuncio publicado exitosamente!');
            window.location.href = `detalle-producto.html?id=${newAd.id}`;

        } catch (error) {
            console.error('❌ Error publicación:', error);
            alert(`Error: ${error.message}`);
            formButton.disabled = false;
            formButton.textContent = 'Publicar Anuncio';
        }
    });
});

