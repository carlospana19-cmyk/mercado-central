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

            // FLEXIBLE IMAGE VALIDATION & UPLOAD - MIN 1 IMAGE, NO MAX BLOCK
            let coverImageUrl = '';
            const coverImageFile = coverImageInput.files[0];
            if (coverImageFile) {
                const cleanName = coverImageFile.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.]/g, '');
                const filePath = `${user.id}/${Date.now()}_cover_${cleanName}`;
                await supabase.storage.from('imagenes_anuncios').upload(filePath, coverImageFile);
                const { data } = supabase.storage.from('imagenes_anuncios').getPublicUrl(filePath);
                coverImageUrl = data.publicUrl;
            }

            const galleryFiles = window.galleryFiles || [];
            const galleryUrls = [];
            for (const file of galleryFiles) {
                const cleanName = file.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.]/g, '');
                const fileName = `${Date.now()}_gallery_${cleanName}`;
                const { data } = await supabase.storage.from('imagenes_anuncios').upload(`${user.id}/${fileName}`, file);
                if (data) {
                    const { data: urlData } = supabase.storage.from('imagenes_anuncios').getPublicUrl(data.path);
                    galleryUrls.push(urlData.publicUrl);
                }
            }

            // ✅ LIMPIEZA: Filtrar URLs vacías/nulas
            const cleanGalleryUrls = galleryUrls.filter(url => url && url.trim() !== '');

            // ✅ VALIDACIÓN FLEXIBLE: Mínimo 1 imagen total (portada O galería)
            const totalImages = (coverImageUrl ? 1 : 0) + cleanGalleryUrls.length;
            if (totalImages === 0) {
                alert("Por favor, sube al menos una imagen (portada o galería).");
                formButton.disabled = false;
                formButton.textContent = 'Publicar Anuncio';
                return;
            }

            console.log(`📸 Imágenes validadas: Portada=${!!coverImageUrl}, Galería=${cleanGalleryUrls.length}, Total=${totalImages}`);


            // ⭐ CAPTURA ATRIBUTOS MEJORADA - NUNCA VACÍO (VEHÍCULOS + MÁS)
            const categoriaNombre = categorySelect.options[categorySelect.selectedIndex].text;
            console.log('📦 Publicando categoría:', categoriaNombre);
            
            let atributos = {};

          // 📦 MÉTODO ESCÁNER VEHÍCULOS + MÁS: Busca con o sin prefijo "attr-"
            const camposClave = [
                // Vehículos
                'marca', 'modelo', 'anio', 'kilometraje', 'transmision', 'combustible', 
                'color', 'puertas', 'vidrios', 'rines', 'tapiz', 'direccion', 'frenos', 'airbags', 'estado',
                // Inmuebles
                'm2', 'superficie', 'habitaciones', 'banos', 'piso', 'estacionamiento', 
                'amueblado', 'ascensor', 'jardin', 'piscina', 'tipo_propiedad',
                // Electrónica / Tecnología
                'memoria_ram', 'almacenamiento', 'procesador', 'condicion',
                // Mascotas
                'raza', 'genero', 'edad_mascota',
                // Moda, Hogar, Deportes, Servicios, Negocios, Comunidad
                'talla', 'material', 'tipo_electrodomestico', 'tipo_mueble', 'tipo_articulo', 
                'tipo_decoracion', 'edad', 'tipo_bicicleta', 'tipo_instrumento', 'aro', 
                'tipo_anuncio', 'tipo_servicio', 'modalidad', 'experiencia', 'tipo_negocio', 
                'razon_venta', 'tipo_evento', 'tipo_actividad', 'tipo_clase', 'nivel', 'fecha_evento'
            ];

            camposClave.forEach(clave => {
                // 🔍 Buscamos el ID normal O "attr-" + clave
                const el = document.getElementById(clave) || document.getElementById('attr-' + clave);
                
                if (el && el.value && el.value.trim() !== '' && el.value !== '0' && el.value.toLowerCase() !== 'seleccionar') {
                    let valor = el.value.trim();
                    
                    // Conversión numérica selectiva
                    if (['kilometraje', 'm2', 'anio', 'habitaciones', 'banos'].includes(clave)) {
                        valor = parseFloat(valor.replace(/,/g, '')) || 0;
                    }
                    
                    atributos[clave] = valor;
                }
            });

            console.log('✅ Atributos capturados (Vehículos+Inmuebles+Genéricos):', atributos);
            console.log('🔍 Total atributos para Supabase:', Object.keys(atributos).length);

            // ⭐ DEBUG: Siempre mostrar qué se capturó
            console.log('✅ Atributos capturados:', atributos);


            // ✅ CRÉDITOS ELIMINADOS: Cobro ya se hace en ia-button.js inmediatamente
            console.log("🚀 VERIFICACIÓN PRE-ENVÍO: Créditos manejados en ia-button.js");


            // Datos finales para Supabase
            const subcategorySelect = document.getElementById('subcategoria-step4') || document.getElementById('subcategory');
            const subcategoriaValue = subcategorySelect ? subcategorySelect.value.trim() : '';

            const adData = {
                user_id: user.id,
                titulo: titleInput.value.trim(),
                descripcion: descriptionInput.value.trim(),
                precio: parseInt(priceInput.value.replace(/[^0-9]/g, '')) || 0,
                categoria: categoriaNombre, // ⭐ NOMBRE correcto
                subcategoria: subcategoriaValue, // ⭐ COLUMNA DEDICADA EN RAÍZ
                provincia: provinceSelect?.value || '',
                distrito: districtSelect?.value || '',
                direccion_exacta: locationInput.value || '',
                url_portada: coverImageUrl,
                url_galeria: cleanGalleryUrls,

                

                // ✅ REMOVIDO: No incluir creditos en adData (cobro ya hecho en ia-button.js)

                
                // ⭐ atributos_clave SIN subcategoria (solo campos dinámicos marca/modelo/etc)
                atributos_clave: atributos, 
                
                activo: true,
                fecha_publicacion: new Date().toISOString()
            };

            console.log('📤 INSERT PAYLOAD - subcategoria (root):', subcategoriaValue);
            console.log('📤 INSERT PAYLOAD - categoria (root):', categoriaNombre);

            // 🎯 FIX selectedPlan: Obtener del sessionStorage o radio (patrón de publish-logic.js)
            let selectedPlan = sessionStorage.getItem('selectedPlan');
            if (!selectedPlan) {
                selectedPlan = document.querySelector('input[name="plan"]:checked')?.value || 'free';
            }
            if (!selectedPlan) {
                throw new Error('No hay plan seleccionado. Por favor, selecciona un plan antes de publicar.');
            }
            console.log('✅ Plan seleccionado:', selectedPlan);

            // Plan logic (CORREGIDO: jerarquía planes - 60d pagos / 30d free)
            adData.selected_plan = selectedPlan;
            adData.featured_plan = selectedPlan;
            
            // ✅ LÓGICA EXACTA: Pagos (destacado/premium/basico)=60d, Free=30d
            const isPaid = ['destacado', 'premium', 'basico'].includes(selectedPlan);
            const diasVigencia = isPaid ? 60 : 30;
            const hoy = new Date();
            adData.fecha_eliminacion = new Date(hoy.getTime() + (diasVigencia * 24 * 60 * 60 * 1000)).toISOString();

            console.log('🚀 Enviando a Supabase (fecha_eliminacion):', {
                selectedPlan,
                diasVigencia,
                fecha_eliminacion: adData.fecha_eliminacion
            });

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
            // DEPURACIÓN COMPLETA
            console.log("❌ DETALLE DEL ERROR:", JSON.stringify(error, null, 2));
            console.dir(error);
            let adDataForLog = typeof adData !== 'undefined' ? adData : 'adData no definida (alcance)';
            console.log("Payload completo:", JSON.stringify(adDataForLog, null, 2));
            alert(`Error: ${error.message || 'Error desconocido'}`);
            formButton.disabled = false;
            formButton.textContent = 'Publicar Anuncio';
        }

    });
});
