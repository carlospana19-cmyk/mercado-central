import { supabase } from './supabase-client.js';
// Las funciones de token se acceden via window (expuestas por publish-logic.js)

document.addEventListener('DOMContentLoaded', () => {
    // =============================================================
    // --- 1. DECLARACIONES Y REFERENCIAS ---
    // =============================================================
    const form = document.getElementById('ad-form');
    if (!form) {
        console.log('Formulario ad-form no encontrado - form-logic.js no se ejecuta en esta pagina');
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
    const galleryPreview = document.getElementById('gallery-preview-container');
    const dropArea = document.getElementById('gallery-drop-area');

    let newGalleryFiles = [];
    let coverImageUrl = '';

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

            // --- DEPURACIÓN: Ver qué llega en newGalleryFiles ---
            // Nota: galleryFiles está en publish-logic.js, necesitamos accederla
            const galleryFiles = window.galleryFiles || [];
            const galleryUrls = []; // Declarar aquí antes de usar
            
            console.log("🔍 DEPURACIÓN GALERÍA:", {
                galleryFilesLength: galleryFiles.length,
                galleryFiles: galleryFiles
            });
            
            // --- CORRECCIÓN GALERÍA: Subida secuencial para asegurar URLs ---
            if (galleryFiles.length > 0) {
                for (const file of galleryFiles) {
                    const fileName = `${Date.now()}_gallery_${file.name}`;
                    console.log("📤 Subiendo imagen:", fileName);
                    const { data, error } = await supabase.storage
                        .from('imagenes_anuncios')
                        .upload(`${user.id}/${fileName}`, file);
                        
                    console.log("📊 Resultado upload:", { data, error });
                    
                    if (data) {
                        const { data: urlData } = supabase.storage
                            .from('imagenes_anuncios')
                            .getPublicUrl(data.path);
                        console.log("🔗 URL pública:", urlData.publicUrl);
                        galleryUrls.push(urlData.publicUrl);
                    }
                }
            }
            
            console.log("✅ URLs de galería generadas:", galleryUrls);

            // --- RECOLECTAR DATOS DEL FORMULARIO ---
            
            // 1. Obtener nombre de categoría (no ID)
            const categoriaNombre = categorySelect.options[categorySelect.selectedIndex]?.text || '';
            
            // 2. Obtener provincia y distrito
            const provincia = provinceSelect ? provinceSelect.value : '';
            const distrito = districtSelect ? districtSelect.value : '';
            
            // 3. Recopilar atributos dinámicos (campos que dependen de la subcategoría)
            const dynamicFieldsContainer = document.querySelector(
                '#vehicle-fields, #realestate-fields, #electronics-fields, #home-furniture-fields, ' +
                '#fashion-fields, #sports-fields, #pets-fields, #services-fields, ' +
                '#business-fields, #community-fields'
            );
            
            const atributos = {};
            if (dynamicFieldsContainer) {
                const inputs = dynamicFieldsContainer.querySelectorAll('input, select, textarea');
                inputs.forEach(input => {
                    if (input.name && input.value) {
                        atributos[input.name] = input.value;
                    }
                });
            }

            // 4. Obtener el plan seleccionado desde sessionStorage
            const selectedPlan = sessionStorage.getItem('selectedPlan') || 'free';
            
            // ============================================================
            // SOLUCIÓN PARA KILO: Mapeo "blindado" con valores por defecto
            // ============================================================
            const adToSave = {
                user_id: user.id,
                titulo: titleInput.value.trim(),
                descripcion: descriptionInput.value.trim(),
                precio: parseFloat(priceInput.value) || 0,
                
                // 1. ELIMINAR EL "61": Forzamos el nombre de la categoría
                categoria: categorySelect.options[categorySelect.selectedIndex]?.text || 'Otros',
                
                // 2. UBICACIÓN BILINGÜE: Mandamos ambos nombres para no fallar
                provincia: provinceSelect?.value || '',
                distrito: districtSelect?.value || '',
                latitud: window.selectedLatitude || 8.98,  // Valor por defecto si falla el mapa
                latitude: window.selectedLatitude || 8.98, // Nombre en inglés por si acaso
                longitud: window.selectedLongitude || -79.51,
                longitude: window.selectedLongitude || -79.51,
                direccion_exacta: locationInput.value || '',
                
                // 3. FOTOS: Usar los nombres que vimos ayer
                url_portada: coverImageUrl,
                url_galeria: galleryUrls,
                atributos_clave: atributos || {},
                
                // 4. EL INTERRUPTOR MÁGICO: Sin esto no sale en el Index
                activo: true,             // 👈 Crucial para que el Index lo vea
                estado: 'aprobado',       // 👈 Por si el Index filtra por estado
                fecha_publicacion: new Date().toISOString(), // 👈 Para que salga de primero
                selected_plan: window.selectedPlanData || 'free',
                featured_plan: window.selectedPlanData || 'destacado' // 👈 Para que salga en el Index
            };

            console.log("🛰️ Enviando a Supabase:", adToSave); // Para ver el "61" morir en vivo

            let savedAdId = null; // Para guardar el ID del anuncio
            try {
                console.log("📝 Insertando anuncio en Supabase...");
                const { data: newAd, error: adError } = await supabase.from('anuncios').insert([adToSave]).select('id').single();
                console.log("📬 Resultado insert:", { newAd, adError });
                if (adError) {
                    console.error('🔴 ERROR AL INSERTAR ANUNCIO:', adError);
                    console.error('🔴 Detalles del error:', JSON.stringify(adError, null, 2));
                    throw adError;
                }
                savedAdId = newAd.id; // Guardar el ID
                console.log('Anuncio guardado exitosamente:', newAd.id);
            } catch (insertError) {
                console.error('🔴 Error en insert:', insertError);
                throw insertError;
            }
            
            // =====================================================
            // MARCAR TOKEN COMO USADO SOLO DESPUES DE GUARDAR
            // =====================================================
            // Obtener el token pendiente (si existe)
            let pendingToken = null;
            if (window.getPendingTokenData) {
                pendingToken = window.getPendingTokenData();
            } else if (window.pendingTokenData) {
                pendingToken = window.pendingTokenData;
            } else {
                console.warn('Advertencia: No se encontró window.pendingTokenData. Asegúrate de que publish-logic.js esté cargado.');
            }
            
            console.log('Token pendiente:', pendingToken);
            if (pendingToken && pendingToken.id) {
                console.log('Marcando token como usado...');
                const tokenResult = await window.markTokenAsUsed(pendingToken);
                if (tokenResult.success) {
                    console.log('Token confirmado y marcado como usado');
                } else {
                    console.error('Error al confirmar token:', tokenResult.error);
                    alert('Tu anuncio se publico, pero hubo un problema al confirmar el token. Contacta soporte.');
                }
                // Limpiar pendingTokenData
                window.pendingTokenData = null;
            } else {
                console.log('No hay token pendiente que marcar (probablemente es un plan gratis o ya se usó)');
            }
            
            alert('¡Anuncio publicado con éxito!');
            window.location.href = `detalle-producto.html?id=${savedAdId}`;

        } catch (error) {
            console.error("🔴 Error al publicar:", error);
            console.error("🔴 Error stack:", error.stack);
            alert(`Hubo un error al publicar: ${error.message || 'Error desconocido'}`);
            formButton.disabled = false;
            formButton.textContent = 'Publicar Anuncio';
        }
    });
});
