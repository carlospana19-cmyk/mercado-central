// =====================================================
// ADMIN LOGIC - VERSIÓN MAESTRA INTEGRAL (RESTABLECIDA)
// =====================================================
import { supabase } from './supabase-client.js';

// --- ESTADO GLOBAL ---
let currentAdminUser = null;
let inventarioData = [];

// Diccionario Estético
const displayNames = {
    'inmuebles': 'Inmuebles', 'vehiculos': 'Vehículos', 'hogar': 'Hogar', 'moda': 'Moda',
    'electronica': 'Electrónica', 'servicios': 'Servicios', 'comunidad': 'Comunidad',
    'empleos': 'Empleos', 'otros': 'Otros', 'basico': 'Básico', 'premium': 'Premium',
    'destacado': 'Destacado', 'top': 'Top'
};

// ==========================================
// 1. INICIALIZACIÓN Y SEGURIDAD
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🛰️ Iniciando Sistema Administrativo...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) { window.location.href = '/index.html'; return; }

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, email')
        .eq('id', user.id)
        .single();

    if (!profile || !profile.is_admin) {
        alert('Acceso no autorizado');
        window.location.href = '/index.html';
        return;
    }

    currentAdminUser = user;
    inicializarNavegacion();
    
    // Carga inicial masiva de datos
    await Promise.all([
        cargarDashboard(),
        cargarTokens(),
        cargarUsuarios()
    ]);
});

function inicializarNavegacion() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', async () => {
            const sectionId = item.dataset.section;
            if (!sectionId) return;

            // UI de Navegación
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById('section-' + sectionId)?.classList.add('active');

            // Cargas por Sección
            if (sectionId === 'inventario') await cargarInventario();
            if (sectionId === 'tokens') await cargarTokens();
            if (sectionId === 'usuarios') await cargarUsuarios();
            if (sectionId === 'ganancias') await cargarGanancias();
        });
    });

    // Filtros
    document.getElementById('filter-categoria')?.addEventListener('change', (e) => {
        cargarInventario(e.target.value);
    });
    document.getElementById('filter-estado')?.addEventListener('change', () => {
        const load = document.getElementById('loading-inventario');
        const container = document.getElementById('inventario-list');
        if (load) load.style.display = 'block';
        if (container) container.style.display = 'none';
        setTimeout(() => {
            filtrarInventario();
            if (load) load.style.display = 'none';
            if (container) container.style.display = 'block';
        }, 100);
    });
    document.getElementById('filter-buscar')?.addEventListener('input', () => {
        const load = document.getElementById('loading-inventario');
        const container = document.getElementById('inventario-list');
        if (load) load.style.display = 'block';
        if (container) container.style.display = 'none';
        setTimeout(() => {
            filtrarInventario();
            if (load) load.style.display = 'none';
            if (container) container.style.display = 'block';
        }, 100);
    });

    // Formulario de Tokens
    document.getElementById('form-generar-token')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await generarToken();
    });
}

// ==========================================
// 2. DASHBOARD (ESTADÍSTICAS GLOBALES)
// ==========================================
async function cargarDashboard() {
    try {
        const { count: totalAds } = await supabase.from('anuncios').select('*', { count: 'exact', head: true });
        const { count: totalUsr } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        
        // Dinero Real (Facturación)
        const { data: pagos } = await supabase.from('user_plans').select('amount_paid').gt('amount_paid', 0);
        let totalDinero = 0;
        pagos?.forEach(p => totalDinero += Number(p.amount_paid));

        document.getElementById('stat-anuncios').textContent = totalAds || 0;
        document.getElementById('stat-usuarios').textContent = totalUsr || 0;
        document.getElementById('stat-mensual').textContent = '$' + totalDinero;
    } catch (e) { console.error('Dashboard:', e); }
}

// ==========================================
// 3. GANANCIAS (SEPARACIÓN DINERO VS REGALÍAS)
// ==========================================
async function cargarGanancias() {
    const tbody = document.getElementById('ganancias-tbody');
    if (!tbody) return;

    try {
        const { data: pagos } = await supabase.from('user_plans').select('*').gt('amount_paid', 0);
        
        const now = new Date();
        let hoy = 0, mes = 0, ano = 0;

        pagos?.forEach(p => {
            const fecha = new Date(p.created_at);
            const monto = Number(p.amount_paid);

            // 1. Suma Año
            if (fecha.getFullYear() === now.getFullYear()) {
                ano += monto;
                // 2. Suma Mes
                if (fecha.getMonth() === now.getMonth()) {
                    mes += monto;
                    // 3. Suma Día
                    if (fecha.getDate() === now.getDate()) {
                        hoy += monto;
                    }
                }
            }
        });

        // Inyectar en los cuadros
        document.getElementById('ganancia-hoy').textContent = '$' + hoy;
        document.getElementById('ganancia-mensual').textContent = '$' + mes;
        document.getElementById('ganancia-anual').textContent = '$' + ano;

        // Llenar la tabla de historial de pagos (ordenado descendente)
        const pagosOrdenados = (pagos || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        tbody.innerHTML = pagosOrdenados.map(p => `
            <tr>
                <td>ID: ${p.user_id.substring(0,8)}</td>
                <td>${(p.plan_type || 'PLAN').toUpperCase()}</td>
                <td style="color:#4ade80; font-weight:bold;">$${p.amount_paid}</td>
                <td>${new Date(p.created_at).toLocaleDateString()}</td>
                <td><span class="status-pill active">EFECTIVO</span></td>
            </tr>`).join('');

    } catch (e) {
        console.error("Error en Ganancias Reales:", e);
    }
}

// ==========================================
// 4. INVENTARIO (CUADROS CON LÍNEAS - image_5029e0)
// ==========================================
async function cargarInventario(categoriaSeleccionada = '') {
    const load = document.getElementById('loading-inventario');
    const container = document.getElementById('inventario-list');
    if (load) load.style.display = 'block';
    if (container) container.style.display = 'none';

    try {
        let query;
        
        if (categoriaSeleccionada) {
            console.log("🔍 Buscando categoria:", categoriaSeleccionada);
            query = supabase.from('anuncios')
                .select('*')
                .ilike('categoria', `${categoriaSeleccionada}`)
                .order('created_at', { ascending: false });
        } else {
            console.log("🔍 Buscando en Supabase -> todas las categorías");
            query = supabase.from('anuncios')
                .select('*')
                .order('created_at', { ascending: false });
        }

        const { data } = await query;
        const uIds = [...new Set((data || []).map(a => a.user_id).filter(Boolean))];
        const { data: profs } = await supabase.from('profiles').select('id, email, nombre_negocio').in('id', uIds);
        const uMap = {}; profs?.forEach(p => uMap[p.id] = p);
        
        inventarioData = (data || []).map(a => ({ ...a, usuario: uMap[a.user_id] }));
        
        // Limpiar y renderizar
        if (container) {
            container.innerHTML = '';
            if (data.length === 0) {
                container.innerHTML = '<div class="loading">No hay anuncios en esta categoría</div>';
            } else {
                renderizarInventario(inventarioData);
            }
        }
    } catch (e) { 
        console.error(e);
        const container = document.getElementById('inventario-list');
        if (container) {
            container.innerHTML = '<div class="loading">Error al cargar los anuncios</div>';
        }
    } finally {
        if (load) load.style.display = 'none';
        if (container) container.style.display = 'block';
    }
}

function filtrarInventario() {
    const cat = document.getElementById('filter-categoria')?.value;
    const est = document.getElementById('filter-estado')?.value;
    const bus = document.getElementById('filter-buscar')?.value.toLowerCase();
    
    let filtered = [...inventarioData];
    console.log('Categoría filtrada:', cat);
    if (cat) {
        filtered = filtered.filter(i => (i.categoria || '').toLowerCase() === cat.toLowerCase());
    }
    if (est === 'activo') filtered = filtered.filter(i => i.activo);
    if (est === 'inactivo') filtered = filtered.filter(i => !i.activo);
    if (bus) {
        filtered = filtered.filter(i => 
            i.titulo?.toLowerCase().includes(bus) || i.usuario?.email?.toLowerCase().includes(bus)
        );
    }
    
    const container = document.getElementById('inventario-list');
    if (container) {
        container.innerHTML = '';
        if (filtered.length === 0) {
            container.innerHTML = '<div class="loading">No hay anuncios en esta categoría</div>';
        } else {
            renderizarInventario(filtered);
        }
    }
}

function renderizarInventario(data) {
    const container = document.getElementById('inventario-list');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="loading">No hay anuncios registrados.</div>';
        return;
    }
    
    container.innerHTML = data.map(anuncio => {
        let imagenes = [];
        try { if(anuncio.imagenes) imagenes = JSON.parse(anuncio.imagenes); } catch(e){}
        const imgUrl = imagenes.length > 0 ? imagenes[0] : '/imgx-logopng.jpeg';
        const vendedor = anuncio.usuario ? (anuncio.usuario.nombre_negocio || anuncio.usuario.email) : 'Desconocido';

        return `
            <div class="inventario-item">
                <img src="${imgUrl}" class="inventario-img" onerror="this.src='/imgx-logopng.jpeg'">
                <div class="inventario-info">
                    <h4>${anuncio.titulo || 'Sin título'}</h4>
                    <div class="inventario-meta">
                        <span><strong>Vendedor:</strong> ${vendedor}</span>
                        <span><strong>Categoría:</strong> ${displayNames[anuncio.categoria?.toLowerCase()] || anuncio.categoria}</span>
                        <span><strong>Precio:</strong> $${anuncio.precio || 0}</span>
                        <span><strong>Fecha:</strong> ${formatearFecha(anuncio.created_at)}</span>
                        <span class="badge ${anuncio.activo ? 'badge-active' : ''}">${anuncio.activo ? 'Activo' : 'Inactivo'}</span>
                    </div>
                </div>
                <div class="inventario-stats">
                    <div class="number">${anuncio.visitas || 0}</div>
                    <div class="label">visitas</div>
                </div>
            </div>`;
    }).join('');
}

// ==========================================
// 5. TOKENS (GESTIÓN Y TABLA)
// ==========================================
async function cargarTokens() {
    const loading = document.getElementById('loading-tokens');
    const table = document.getElementById('tokens-table');
    const tbody = document.getElementById('tokens-tbody');

    if (loading) loading.style.display = 'block';
    
    try {
        const { data: tks } = await supabase.from('plan_tokens').select('*').order('created_at', { ascending: false });
        
        // Estadísticas de Pestaña Tokens
        if(document.getElementById('stat-tokens-total')) document.getElementById('stat-tokens-total').textContent = tks?.length || 0;
        if(document.getElementById('stat-tokens-usados')) document.getElementById('stat-tokens-usados').textContent = tks?.filter(t => t.usado).length || 0;
        if(document.getElementById('stat-tokens-disponibles')) document.getElementById('stat-tokens-disponibles').textContent = tks?.filter(t => !t.usado && t.activo).length || 0;

        if (tbody) {
            tbody.innerHTML = (tks || []).map(t => `
                <tr>
                    <td><strong>${t.codigo}</strong></td>
                    <td>${(t.plan_tipo || '').toUpperCase()}</td>
                    <td>${t.duracion_dias}</td>
                    <td><span class="badge ${!t.usado && t.activo ? 'badge-active' : ''}">${t.usado ? 'Usado' : (t.activo ? 'Disponible' : 'Inactivo')}</span></td>
                    <td>${formatearFecha(t.created_at)}</td>
                    <td>${!t.usado && t.activo ? `<button class="btn btn-danger btn-sm" onclick="window.desactivarToken('${t.id}')">X</button>` : '-'}</td>
                </tr>`).join('');
        }
        
        if (loading) loading.style.display = 'none';
        if (table) table.style.display = 'table';
    } catch (e) { console.error(e); }
}

// ==========================================
// 6. USUARIOS Y FUNCIONES GLOBALES
// ==========================================
async function cargarUsuarios() {
    const loading = document.getElementById('loading-usuarios');
    const table = document.getElementById('usuarios-table');
    const tbody = document.getElementById('usuarios-tbody');

    // Mostrar spinner al iniciar
    if (loading) loading.style.display = 'block';
    if (table) table.style.display = 'none';

    try {
        const { data: usrs } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        
        if (tbody) {
            tbody.innerHTML = (usrs || []).map(u => {
                try {
                    const nombre = u.nombre_negocio || u.nombre_completo || u.email.split('@')[0];
                    const rol = u.is_admin ? '<span class="badge-admin">Admin</span>' : '<span class="badge-user">Usuario</span>';
                    const foto = u.url_foto_perfil || '/imgx-logopng.jpeg';
                    
                    return `
                        <tr>
                            <td><img src="${foto}" class="user-avatar-mini"></td>
                            <td>${nombre}</td>
                            <td>${u.email}</td>
                            <td>${new Date(u.created_at).toLocaleDateString()}</td>
                            <td>${rol}</td>
                            <td><button class="btn-sm btn-gift" onclick="window.asignarTokenDirecto('${u.id}', '${u.whatsapp || u.telefono || ''}')">🎁 Dar Token</button></td>
                        </tr>`;
                } catch (err) {
                    console.error('Error al renderizar usuario:', err);
                    return ''; // Skip corrupted data
                }
            }).join('');
        }
    } catch (e) { 
        console.error('Error al cargar usuarios:', e);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error al cargar usuarios</td></tr>';
        }
    } finally {
        // Ocultar spinner y mostrar tabla al finalizar
        if (loading) loading.style.display = 'none';
        if (table) table.style.display = 'table';
    }
}

async function generarToken() {
    const plan = document.getElementById('plan-tipo').value;
    const dias = parseInt(document.getElementById('duracion-dias').value);
    const cod = 'MC-' + Math.random().toString(36).substring(2, 5).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    await supabase.from('plan_tokens').insert([{ 
        codigo: cod, plan_tipo: plan, duracion_dias: dias, activo: true, creado_por: currentAdminUser.id 
    }]);
    
    document.getElementById('codigo-value').textContent = cod;
    document.getElementById('codigo-generado').style.display = 'block';
    await cargarTokens();
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// EXPOSICIÓN AL OBJETO WINDOW (CRÍTICO PARA type="module")
window.desactivarToken = async (id) => {
    if (!confirm('¿Desactivar token?')) return;
    await supabase.from('plan_tokens').update({ activo: false }).eq('id', id);
    await cargarTokens();
};

window.seleccionarCategoria = (cat, el) => {
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    if (el) el.classList.add('active');
    const filtered = (cat === 'General') ? inventarioData : inventarioData.filter(i => i.categoria === cat);
    renderizarInventario(filtered);
};

window.asignarRapido = (email) => {
    document.querySelector('[data-section="tokens"]').click();
    setTimeout(() => { document.getElementById('email-usuario').value = email; }, 200);
};

window.copiarCodigo = () => {
    const cod = document.getElementById('codigo-value').textContent;
    navigator.clipboard.writeText(cod).then(() => alert('Copiado: ' + cod));
};

window.cerrarSesion = async () => {
    if (!confirm('¿Cerrar sesión?')) return;
    await supabase.auth.signOut();
    window.location.href = '/index.html';
};

window.asignarTokenDirecto = async (userId, phone) => {
    try {
        console.log('Asignar token al usuario:', userId);
        
        // Obtener días de validez
        const diasInput = prompt('¿Cuántos días de validez tendrá este token?', '30');
        const duracionDias = parseInt(diasInput) || 30;
        
        // Generar código aleatorio
        const codigo = 'MC-' + Math.random().toString(36).substring(2, 7).toUpperCase();
        
        // Insertar en la tabla plan_tokens
        await supabase.from('plan_tokens').insert({
            codigo: codigo,
            plan_type: 'premium',
            duracion_dias: duracionDias,
            usado: false,
            activo: true
        });
        
        // Mensaje de éxito con botón WhatsApp
        const mensaje = `¡Token generado: ${codigo}!`;
        const whatsappLink = `https://wa.me/${phone}?text=Hola!+Tu+codigo+de+regalo+para+Mercado+Central+es:+${codigo}`;
        
        // Crear modal o alerta custom
        const confirmacion = confirm(`${mensaje}\n\n¿Deseas enviar el token por WhatsApp?`);
        if (confirmacion && phone) {
            window.open(whatsappLink, '_blank');
        }
        
        // Recargar la lista de tokens
        await cargarTokens();
        
        // Navegar a la sección de tokens
        document.querySelector('[data-section="tokens"]').click();
        
    } catch (error) {
        console.error('Error al generar token:', error);
        alert('Hubo un error al generar el token');
    }
};

// Exponer funciones ocultas
window.cargarGanancias = cargarGanancias;
window.cargarInventario = cargarInventario;
window.cargarTokens = cargarTokens;
window.filtrarInventario = filtrarInventario;