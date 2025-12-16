// ============================================
// LÓGICA DEL PERFIL DE USUARIO
// ============================================

let currentUserId = null;

// Al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUserId = user.id;

    // Cargar perfil del usuario
    await loadUserProfile();

    // Iniciar event listeners
    initializeEventListeners();

    // Cargar opciones de provincias/distritos
    await loadLocationOptions();
});

// Cargar datos del perfil del usuario
async function loadUserProfile() {
    try {
        // Obtener perfil de la tabla 'perfiles'
        const { data: profile, error } = await supabase
            .from('perfiles')
            .select('*')
            .eq('user_id', currentUserId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Error al cargar perfil:', error);
            return;
        }

        // Obtener email del usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        document.getElementById('email').value = user.email || '';

        if (profile) {
            // Rellenar formulario con datos existentes
            document.getElementById('full-name').value = profile.nombre_completo || '';
            document.getElementById('phone').value = profile.telefono || '';
            document.getElementById('whatsapp').value = profile.whatsapp || '';
            document.getElementById('business-name').value = profile.nombre_negocio || '';
            document.getElementById('business-type').value = profile.tipo_negocio || '';
            document.getElementById('description').value = profile.descripcion || '';
            document.getElementById('location-province').value = profile.provincia || '';
            document.getElementById('location-address').value = profile.direccion || '';

            // Cargar foto de perfil si existe
            if (profile.url_foto_perfil) {
                document.getElementById('profile-photo').src = profile.url_foto_perfil;
            }

            // Actualizar distrito
            if (profile.provincia) {
                await updateDistricts(profile.provincia);
                document.getElementById('location-district').value = profile.distrito || '';
            }

            // Actualizar contadores de caracteres
            updateCharCounts();
        }
    } catch (err) {
        console.error('Error en loadUserProfile:', err);
    }
}

// Inicializar event listeners
function initializeEventListeners() {
    // Botón de subir foto
    document.getElementById('upload-photo-btn').addEventListener('click', () => {
        document.getElementById('profile-photo-input').click();
    });

    // Input de foto
    document.getElementById('profile-photo-input').addEventListener('change', handlePhotoUpload);

    // Contador de caracteres
    const fields = ['full-name', 'phone', 'whatsapp', 'business-name', 'description', 'location-address'];
    fields.forEach(fieldId => {
        document.getElementById(fieldId).addEventListener('input', updateCharCounts);
    });

    // Cambio de provincia
    document.getElementById('location-province').addEventListener('change', async (e) => {
        await updateDistricts(e.target.value);
    });

    // Envío del formulario
    document.getElementById('profile-form').addEventListener('submit', saveProfile);

    // Botón cancelar
    document.getElementById('cancel-profile-btn').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    // Botón logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });
}

// Manejar subida de foto de perfil
async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen válida');
        return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe pesar más de 5MB');
        return;
    }

    try {
        const uploadButton = document.getElementById('upload-photo-btn');
        uploadButton.disabled = true;

        // Generar nombre único para la foto
        const fileName = `${currentUserId}/profile-${Date.now()}.${file.type.split('/')[1]}`;

        // Subir a Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('imagenes_anuncios')
            .upload(fileName, file);

        if (uploadError) {
            console.error('Error al subir foto:', uploadError);
            alert('Error al subir la foto. Intenta de nuevo.');
            uploadButton.disabled = false;
            return;
        }

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('imagenes_anuncios')
            .getPublicUrl(fileName);

        // Mostrar preview
        document.getElementById('profile-photo').src = publicUrl;

        // Guardar URL en la tabla de perfiles
        const { error: dbError } = await supabase
            .from('perfiles')
            .upsert({
                user_id: currentUserId,
                url_foto_perfil: publicUrl,
                updated_at: new Date()
            });

        if (dbError) {
            console.error('Error al guardar URL de foto:', dbError);
        } else {
            alert('¡Foto de perfil actualizada correctamente!');
        }

        uploadButton.disabled = false;
    } catch (err) {
        console.error('Error en handlePhotoUpload:', err);
        alert('Error al procesar la foto');
        document.getElementById('upload-photo-btn').disabled = false;
    }
}

// Actualizar contador de caracteres
function updateCharCounts() {
    const fields = {
        'full-name': 100,
        'phone': 20,
        'whatsapp': 20,
        'business-name': 100,
        'description': 500,
        'location-address': 150
    };

    Object.entries(fields).forEach(([fieldId, maxLength]) => {
        const input = document.getElementById(fieldId);
        const countSpan = document.getElementById(`${fieldId}-count`);
        const length = input.value.length;
        countSpan.textContent = length;

        // Cambiar color si se acerca al límite
        if (length > maxLength * 0.8) {
            countSpan.style.color = '#ff6b6b';
        } else {
            countSpan.style.color = '#999';
        }
    });
}

// Cargar opciones de provincias y distritos
async function loadLocationOptions() {
    try {
        const { data: provincias, error } = await supabase
            .from('provincias')
            .select('id, nombre');

        if (error) {
            console.error('Error al cargar provincias:', error);
            return;
        }

        const provinciaSelect = document.getElementById('location-province');
        provinciaSelect.innerHTML = '<option value="">Selecciona provincia</option>';

        provincias.forEach(prov => {
            const option = document.createElement('option');
            option.value = prov.nombre;
            option.textContent = prov.nombre;
            provinciaSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Error en loadLocationOptions:', err);
    }
}

// Actualizar distritos según provincia
async function updateDistricts(provinciaName) {
    try {
        const { data: distritos, error } = await supabase
            .from('distritos')
            .select('nombre')
            .eq('provincia_nombre', provinciaName);

        if (error) {
            console.error('Error al cargar distritos:', error);
            return;
        }

        const distritoSelect = document.getElementById('location-district');
        distritoSelect.innerHTML = '<option value="">Selecciona distrito</option>';

        if (distritos) {
            distritos.forEach(dist => {
                const option = document.createElement('option');
                option.value = dist.nombre;
                option.textContent = dist.nombre;
                distritoSelect.appendChild(option);
            });
        }
    } catch (err) {
        console.error('Error en updateDistricts:', err);
    }
}

// Guardar perfil
async function saveProfile(e) {
    e.preventDefault();

    try {
        const saveButton = document.getElementById('save-profile-btn');
        saveButton.disabled = true;
        saveButton.textContent = 'Guardando...';

        const profileData = {
            user_id: currentUserId,
            nombre_completo: document.getElementById('full-name').value,
            telefono: document.getElementById('phone').value,
            whatsapp: document.getElementById('whatsapp').value,
            nombre_negocio: document.getElementById('business-name').value,
            tipo_negocio: document.getElementById('business-type').value,
            descripcion: document.getElementById('description').value,
            provincia: document.getElementById('location-province').value,
            distrito: document.getElementById('location-district').value,
            direccion: document.getElementById('location-address').value,
            updated_at: new Date()
        };

        // Validaciones
        if (!profileData.nombre_completo.trim()) {
            alert('Por favor ingresa tu nombre completo');
            saveButton.disabled = false;
            saveButton.textContent = 'Guardar Perfil';
            return;
        }

        // Upsert en la tabla 'perfiles'
        const { error } = await supabase
            .from('perfiles')
            .upsert(profileData);

        if (error) {
            console.error('Error al guardar perfil:', error);
            alert('Error al guardar el perfil. Intenta de nuevo.');
            saveButton.disabled = false;
            saveButton.textContent = 'Guardar Perfil';
            return;
        }

        alert('¡Perfil guardado correctamente!');
        saveButton.disabled = false;
        saveButton.textContent = 'Guardar Perfil';

        // Redirigir al dashboard después de 1 segundo
        setTimeout(() => {
            window.location.href = 'panel-unificado.html';
        }, 1000);

    } catch (err) {
        console.error('Error en saveProfile:', err);
        alert('Error al guardar el perfil');
        document.getElementById('save-profile-btn').disabled = false;
        document.getElementById('save-profile-btn').textContent = 'Guardar Perfil';
    }
}
