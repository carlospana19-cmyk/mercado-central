// =====================================================
// DELEGACIÓN DE EVENTOS - BOTÓN IA
// =====================================================

// Función para actualizar el contador de chances
function actualizarContadorChances() {
    const chancesSpan = document.getElementById('ia-chances') || document.getElementById('ia-credits-counter');
    if (!chancesSpan) return;
    
    const planSeleccionado = document.querySelector('input[name="plan"]:checked');
    const plan = planSeleccionado ? planSeleccionado.value : 'free';
    const tokenInput = document.querySelector(`.input-token[data-plan="${plan}"]`);
    const token_id = tokenInput ? tokenInput.value.trim() : '';
    
    const chancesPorPlan = {
        'free': 0,
        'basico': 1,
        'premium': 3,
        'destacado': 5
    };
    
    const maxChances = chancesPorPlan[plan] || 0;
    
    if (maxChances === 0) {
        chancesSpan.innerText = "💡 Plan gratuito - Sin optimizar con IA";
        chancesSpan.style.color = "#999";
    } else if (!token_id) {
        chancesSpan.innerText = "💡 Ingresa el token de tu plan";
        chancesSpan.style.color = "#999";
    } else {
        chancesSpan.innerText = `💡 Optimizar con IA disponible`;
        chancesSpan.style.color = "#666";
    }
}

// Actualizar contador al cargar la página
document.addEventListener('DOMContentLoaded', actualizarContadorChances);

// Actualizar contador y LIMPIAR ABSOLUTAMENTE TODO cuando cambie el plan
document.addEventListener('change', function(e) {
    if (e.target && e.target.name === 'plan') {
        // 1. Actualiza el mensaje de los chances
        actualizarContadorChances();

        console.log('--- Iniciando Limpieza Total del Formulario ---');

        // --- 2. MATAR AL FANTASMA DE LOS TEXTOS Y DATOS (Todos) ---
        // Selecciona todos los inputs relevantes (excepto los radios de plan y el submit)
        const allInputs = document.querySelectorAll(
            'form input:not([name="plan"]):not([type="submit"]), form textarea, form select'
        );
        allInputs.forEach(input => {
            input.value = '';
            // Disparar evento para resetear el contador de letras si existe
            input.dispatchEvent(new Event('input')); 
        });

        // Limpiar mensajes de estado
        const status = document.getElementById('ia-status');
        const btnIA = document.getElementById('btn-optimizar-ia');
        if (status) {
            status.innerText = '';
            status.style.display = 'none';
        }
        if (btnIA) {
            btnIA.disabled = false; // Reactivar el botón
        }

        // --- 3. NUEVO Y MEJORADO: MATAR AL FANTASMA DE LAS IMÁGENES (Incluso la portada y miniaturas) ---
        // Borrar la memoria de los botones de "Subir foto" (input file)
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.value = ''; // Borra el archivo seleccionado
        });

        // Borrar TODAS las fotos y previsualizaciones (miniaturas y portada)
        // Nota para Kilo: He añadido selectores específicos para abarcar todos los contenedores visuales comunes.
        const previews = document.querySelectorAll(
            '.image-preview, .preview-container, #preview, .fotos-container, .main-cover-preview, #cover-preview, .image-box, .photo-uploader-box, [id^="img-preview"]'
        );
        previews.forEach(preview => {
            // Si es un elemento <img>, lo resetea. Si es un contenedor, lo vacía.
            if (preview.tagName === 'IMG') {
                preview.src = ''; // Limpia la imagen directa
            } else {
                preview.innerHTML = ''; // Vacía el contenido del contenedor (otras imágenes)
            }
        });

        console.log('--- Limpieza Total Completada con Éxito ---');
    }
});

document.addEventListener('click', async function(e) {
    // Verificar si el clic fue exactamente en el botón de IA
    if (e.target.id === 'btn-optimizar-ia' || e.target.id === 'btn-ia-optimize') {
        e.preventDefault();
        console.log("CLIC DETECTADO VIA DELEGACION");
        
        // === VERIFICACIÓN DE ELEMENTOS: Buscar DE NUEVO cada vez ===
        const tituloInput = document.getElementById('title');
        const descInput = document.getElementById('description');
        const status = document.getElementById('ia-status');
        const chancesSpan = document.getElementById('ia-chances');
        const btnIA = document.getElementById('btn-optimizar-ia');
        
        // === LOGS DE DIAGNÓSTICO ===
        console.log('--- DIAGNÓSTICO BOTÓN IA ---');
        console.log('1. Título input:', tituloInput ? '✓ Encontrado' : '✗ NO ENCONTRADO');
        console.log('2. Descripción input:', descInput ? '✓ Encontrado' : '✗ NO ENCONTRADO');
        console.log('3. Status element:', status ? '✓ Encontrado' : '✗ NO ENCONTRADO');
        console.log('4. Chances span:', chancesSpan ? '✓ Encontrado' : '✗ NO ENCONTRADO');
        console.log('5. Botón IA:', btnIA ? '✓ Encontrado' : '✗ NO ENCONTRADO');
        
        // === VERIFICAR QUE EXISTAN LOS ELEMENTOS BÁSICOS ===
        if (!tituloInput || !descInput || !status) {
            console.error('ERROR: Faltan elementos esenciales del DOM');
            alert('Error: La página no está completamente cargada. Intenta de nuevo.');
            return;
        }
        
        // === CAPTURA DE PLAN: Primero sessionStorage, luego radio button ===
        // El plan se guarda en sessionStorage cuando el usuario selecciona un plan o paga
        let plan = sessionStorage.getItem('selectedPlan');
        
        // Si no está en sessionStorage, buscar el radio button
        if (!plan) {
            const planSeleccionado = document.querySelector('input[name="plan"]:checked');
            plan = planSeleccionado ? planSeleccionado.value : 'free';
        }
        
        console.log('6. Plan detectado:', plan);
        
        // === CAPTURA DE TOKEN: Solo si es necesario (plan sin validar) ===
        // Si el usuario ya tiene un plan aplicado (sessionStorage), no necesita token
        const tokenApplied = sessionStorage.getItem('tokenApplied');
        let token_id = '';
        
        // Solo buscar token input si NO hay token aplicado
        if (!tokenApplied) {
            const tokenInput = document.querySelector(`.input-token[data-plan="${plan}"]`);
            token_id = tokenInput ? tokenInput.value.trim() : '';
        } else {
            console.log('7. Token: ✓ Token aplicado previamente (no requiere input)');
        }
        
        console.log('7. Token ID:', token_id ? `✓ Encontrado (${token_id.substring(0, 10)}...)` : (tokenApplied ? '✓ No necesario (ya aplicado)' : '✗ VACÍO'));
        
        // Definir chances según el plan
        const chancesPorPlan = {
            'free': 0,
            'basico': 1,
            'premium': 3,
            'destacado': 5  // Destacado tiene 5 optimizaciones
        };
        
        const maxChances = chancesPorPlan[plan] || 0;
        console.log('8. Chances disponibles:', maxChances);
        
        // === VALIDACIONES ===
        if (!tituloInput.value || !descInput.value) {
            status.innerText = "Por favor, escribe un título y descripción primero.";
            status.style.color = "orange";
            status.style.display = "inline-block";
            console.log('ERROR: Título o descripción vacíos');
            return;
        }
        
        // Si hay token, verificar con el servidor
        if (!token_id && !tokenApplied && maxChances > 0) {
            status.innerText = "Ingresa el token de tu plan para usar la IA";
            status.style.color = "red";
            status.style.display = "inline-block";
            console.log('ERROR: Token no proporcionado y no aplicado');
            return;
        }
        
        // Verificar si tiene chances disponibles
        if (maxChances === 0) {
            status.innerText = "¡Sube a un plan de pago para usar la IA!";
            status.style.color = "red";
            status.style.display = "inline-block";
            console.log('ERROR: Plan gratuito sin chances');
            return;
        }
        
        // === PROCESO DE OPTIMIZACIÓN ===
        status.innerText = "Optimizando...";
        status.style.display = "inline-block";
        status.style.color = "#667eea";
        
        // Habilitar siempre el botón antes de empezar (prevenir bloqueo)
        if (btnIA) btnIA.disabled = false;
        
        try {
            console.log("Conectando con Python...");
            const response = await fetch('http://127.0.0.1:5000/optimizar', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    titulo: tituloInput.value, 
                    descripcion: descInput.value,
                    plan: plan,
                    token_id: token_id
                })
            });
            
            const resData = await response.json();
            console.log("Respuesta IA:", resData);
            
            // Verificar si el servidor bloqueó por límite alcanzado
            if (response.status === 403) {
                status.innerText = resData.error || "Has agotado tu límite";
                status.style.color = "red";
                if (btnIA) btnIA.disabled = true;
                console.log('ERROR: Límite alcanzado');
                return;
            }
            
            // Verificar si hay error
            if (resData.error) {
                status.innerText = resData.error;
                status.style.color = "red";
                // Habilitar el botón si hay error
                if (btnIA) btnIA.disabled = false;
                console.log('ERROR del servidor:', resData.error);
                return;
            }

            // Filtro de limpieza en el cliente (segunda línea de defensa)
            function limpiarTexto(texto) {
                if (!texto) return "";
                // Solo permite letras, números, espacios y puntuación básica
                return texto.replace(/[^a-zA-Z0-9\s.,!?;:\-áéíóúñÁÉÍÓÚ]/g, '');
            }

            // Ajuste para leer las claves correctas que envía Python
            if(resData.titulo_optimizado || resData.titulo) {
                tituloInput.value = limpiarTexto(resData.titulo_optimizado || resData.titulo);
                descInput.value = limpiarTexto(resData.descripcion_optimizada || resData.descripcion);
                status.innerText = "Anuncio Optimizado!";
                status.style.color = "green";
                
                // Actualizar contador con datos del servidor
                const usados = resData.usados || 0;
                const limite = resData.limite || maxChances;
                const restantes = limite - usados;
                
                if (chancesSpan) {
                    if (restantes > 0) {
                        chancesSpan.innerText = `💡 Optimizar con IA: ${restantes}/${limite}`;
                    } else {
                        chancesSpan.innerText = "💡 Has agotado tu límite";
                        if (btnIA) btnIA.disabled = true;
                    }
                }
                
                // Bloquear si se agotaron
                if (restantes <= 0) {
                    status.innerText = "Has agotado tu límite. ¡Sube a un plan superior para más!";
                    status.style.color = "red";
                }
                
                // Disparar evento 'input' por si hay contadores de caracteres que deban actualizarse
                tituloInput.dispatchEvent(new Event('input'));
                descInput.dispatchEvent(new Event('input'));
                
                console.log('✓ Optimización completada con éxito');
            } else {
                status.innerText = "Error: Formato de IA no reconocido.";
                status.style.color = "red";
                // Habilitar el botón si hay error
                if (btnIA) btnIA.disabled = false;
            }
        } catch (err) {
            console.error("Error de conexión:", err);
            status.innerText = "Error con el servidor Python. Intenta de nuevo.";
            status.style.color = "red";
            // Habilitar el botón si hay error de red
            if (btnIA) btnIA.disabled = false;
        }
    }
});
