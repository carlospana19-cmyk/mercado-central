// =====================================================
// DELEGACIÓN DE EVENTOS - BOTÓN IA
// =====================================================
document.addEventListener('click', async function(e) {
    // Verificar si el clic fue exactamente en el botón de IA
    if (e.target && e.target.id === 'btn-optimizar-ia') {
        e.preventDefault();
        console.log("CLIC DETECTADO VIA DELEGACION");
        
        const tituloInput = document.getElementById('title');
        const descInput = document.getElementById('description');
        const status = document.getElementById('ia-status');

        if (!tituloInput || !descInput) {
            console.error("ERROR: No se encuentran los inputs ad-title o ad-description");
            return;
        }

        if (!tituloInput.value || !descInput.value) {
            alert("Por favor, escribe un titulo y descripcion primero.");
            return;
        }

        status.innerText = "Optimizando...";
        status.style.display = "inline-block";
        e.target.disabled = true;

        try {
            console.log("Conectando con Python...");
            const response = await fetch('http://127.0.0.1:5000/optimizar', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    titulo: tituloInput.value, 
                    descripcion: descInput.value 
                })
            });
            
            const resData = await response.json();
            console.log("Respuesta IA:", resData);

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
                
                // Disparar evento 'input' por si hay contadores de caracteres que deban actualizarse
                tituloInput.dispatchEvent(new Event('input'));
                descInput.dispatchEvent(new Event('input'));
            } else {
                status.innerText = "Error: Formato de IA no reconocido.";
            }
        } catch (err) {
            console.error("Error de conexion:", err);
            status.innerText = "Error con el servidor Python.";
        } finally {
            e.target.disabled = false;
        }
    }
});
