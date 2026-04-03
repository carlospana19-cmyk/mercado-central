// ia-button.js - VERSIÓN DEFINITIVA SIN LÍMITES (CEO FINAL)
// Botón IA ilimitado durante redacción. Cobro ÚNICAMENTE al publicar.

// =====================================================
// 🎯 FIX: Ocultar botón en modo edición (URL contiene 'edit' o ?id=)
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const isEditMode = window.location.href.includes('edit') || new URLSearchParams(window.location.search).has('id');
        if (isEditMode) {
            const btnIA = document.getElementById('btn-optimizar-ia');
            if (btnIA) {
                btnIA.style.display = 'none';
                console.log('🔒 Botón IA oculto - Modo edición detectado:', window.location.href);
            }
        }
    }, 500); // Margen para carga dinámica
});

// =====================================================
// LÓGICA SIMPLE DEL BOTÓN IA
// =====================================================
document.addEventListener('click', async function(e) {
    // Solo el botón correcto
    if (e.target.id !== 'btn-optimizar-ia') return;
    
    e.preventDefault();
    console.log("🪙 Botón IA clickeado - Sin límites");
    
    // Elementos esenciales
    const tituloInput = document.getElementById('title');
    const descInput = document.getElementById('description');
    const status = document.getElementById('ia-status');
    
    if (!tituloInput || !descInput || !status) {
        console.error('❌ Faltan elementos DOM');
        return;
    }
    

    // Validación básica
    if (!tituloInput.value || !descInput.value) {
        status.textContent = "Escribe título y descripción primero";
        status.style.color = "orange";
        status.style.display = "block";
        return;
    }
    
    // 🚀 RESTRICCIÓN PLAN FREE (CEO RULE)
    const planRadio = document.querySelector('input[name="plan"]:checked');
    const planActual = planRadio ? planRadio.value : 'free';
    
    if (planActual === 'free') {
        status.textContent = "🚀 ¡Sube a un plan de pago para optimizar tu texto con Inteligencia Artificial!";
        status.style.color = "#d97706"; // Naranja llamativo
        status.style.display = "block";
        return;
    }
    
    console.log(`✅ Plan ${planActual.toUpperCase()} autorizado para IA`);

    
    // UI carga
    status.textContent = "Optimizando con IA...";
    status.style.color = "#667eea";
    status.style.display = "block";
    
    try {
        const response = await fetch('http://127.0.0.1:5001/optimizar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                titulo: tituloInput.value, 
                descripcion: descInput.value 
            })
        });
        
        if (!response.ok) throw new Error(`Error ${response.status}`);
        
        const resData = await response.json();
        
        if (resData.error) throw new Error(resData.error);
        

        // ✅ ÉXITO - SINCROMIZACIÓN COMPLETA
        // 1. Aplicar optimización + eventos
        tituloInput.value = resData.titulo || resData.titulo_optimizado || '';
        tituloInput.dispatchEvent(new Event('input', { bubbles: true }));
        tituloInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        descInput.value = resData.descripcion || resData.descripcion_optimizada || '';
        descInput.dispatchEvent(new Event('input', { bubbles: true }));
        descInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        // 2. CRUCIAL: Marcar FLAG cobro
        const inputIaUsada = document.getElementById('ia_usada_al_publicar');
        if (inputIaUsada) {
            inputIaUsada.value = "1";
            console.log("✅ FLAG IA marcado");
        }
        
        // 3. UI éxito
        status.textContent = "✨ ¡Optimizado!";
        status.style.color = "green";
        
        console.log("✅ IA completada + eventos disparados");

        
    } catch (error) {
        console.error("❌ Error IA:", error);
        status.textContent = `Error: ${error.message}`;
        status.style.color = "red";
        status.style.display = "block";
    }
});

// =====================================================
// LIMPIEZA AL CAMBIAR PLAN (RESET FLAG)
// =====================================================
document.addEventListener('change', function(e) {
    if (e.target.name === 'plan') {
        // Resetear flag de IA usada
        const inputIaUsada = document.getElementById('ia_usada_al_publicar');
        if (inputIaUsada) inputIaUsada.value = "0";
        
        // Limpiar estado
        const status = document.getElementById('ia-status');
        if (status) {
            status.textContent = "";
            status.style.display = "none";
        }
        
        // Limpieza formulario existente...
        console.log("🔄 Plan cambiado - IA reseteada");
    }
});

