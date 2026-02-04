// =====================================================
// ADMIN LOGIC - Panel de Administrador
// Gestión de tokens de cortesía y planes gratis
// =====================================================

import { supabase } from './supabase-client.js';

// =====================================================
// VARIABLES GLOBALES
// =====================================================
let currentAdminUser = null;
let tokensData = [];
let cortesiasData = [];
let usuariosData = [];

// =====================================================
// INICIALIZACIÓN
// =====================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔐 Iniciando Panel Admin...');
    
    // Verificar autenticación
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
        alert('⛔ Debes iniciar sesión para acceder al panel de administrador');
        window.location.href = '/login.html';
        return;
    }

    // Verificar que sea admin
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, email')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        alert('⛔ Error verificando permisos');
        window.location.href = '/index.html';
        return;
    }

    if (!profile.is_admin) {
        alert('⛔ Acceso denegado. Solo administradores pueden acceder a este panel.');
        window.location.href = '/index.html';
        return;
    }

    currentAdminUser = user;

    // Inicializar panel
    initializeAdminPanel();
    loadDashboardStats();
});
    console.log('✅ Admin autenticado:', profile.email);

    // Inicializar tabs
    initializeTabs();

    // Cargar estadísticas iniciales
    await cargarEstadisticas();

    // Cargar tokens
    await cargarTokens();

    // Event listeners
    setupEventListeners();
});

// =====================================================
// TABS
// =====================================================
function initializeTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            // Remover active de todos
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // Activar el seleccionado
            tab.classList.add('active');
            document.getElementById(`tab-${tabName}`).classList.add('active');

            // Cargar datos según tab
            if (tabName === 'tokens') {
                cargarTokens();
            } else if (tabName === 'cortesias') {
                cargarCortesias();
            } else if (tabName === 'usuarios') {
                cargarUsuarios();
            }
        });
    });
}

// =====================================================
// EVENT LISTENERS
// =====================================================
function setupEventListeners() {
    // Form generar token
    document.getElementById('form-generar-token').addEventListener('submit', async (e) => {
        e.preventDefault();
        await generarToken();
    });

    // Form asignar manual
    document.getElementById('form-asignar-manual').addEventListener('submit', async (e) => {
        e.preventDefault();
        await asignarPlanManual();
    });
}

// =====================================================
// ESTADÍSTICAS
// =====================================================
async function cargarEstadisticas() {
    try {
        // Total tokens
        const { count: totalTokens } = await supabase
            .from('plan_tokens')
            .select('*', { count: 'exact', head: true });

        // Tokens disponibles
        const { count: disponibles } = await supabase
            .from('plan_tokens')
            .select('*', { count: 'exact', head: true })
            .eq('usado', false)
            .eq('activo', true);

        // Tokens usados
        const { count: usados } = await supabase
            .from('plan_tokens')
            .select('*', { count: 'exact', head: true })
            .eq('usado', true);

        // Cortesías activas
        const { count: cortesiasActivas } = await supabase
            .from('cortesias_aplicadas')
            .select('*', { count: 'exact', head: true })
            .eq('activo', true)
            .gt('fecha_fin', new Date().toISOString());

        document.getElementById('stat-total-tokens').textContent = totalTokens || 0;
        document.getElementById('stat-disponibles').textContent = disponibles || 0;
        document.getElementById('stat-usados').textContent = usados || 0;
        document.getElementById('stat-cortesias-activas').textContent = cortesiasActivas || 0;

    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// =====================================================
// GENERAR TOKEN
// =====================================================
async function generarToken() {
    const planTipo = document.getElementById('plan-tipo').value;
    const duracionDias = parseInt(document.getElementById('duracion-dias').value);
    const categoriaEspecifica = document.getElementById('categoria-especifica').value || null;
    const expiraEn = document.getElementById('expira-en').value || null;
    const notas = document.getElementById('notas').value || null;

    try {
        // Generar código único
        const codigo = await generarCodigoUnico();

        // Insertar en BD
        const { data, error } = await supabase
            .from('plan_tokens')
            .insert([{
                codigo: codigo,
                plan_tipo: planTipo,
                duracion_dias: duracionDias,
                categoria_especifica: categoriaEspecifica,
                expira_en: expiraEn ? new Date(expiraEn).toISOString() : null,
                notas: notas,
                creado_por: currentAdminUser.id,
                activo: true
            }])
            .select()
            .single();

        if (error) throw error;

        // Mostrar código generado
        document.getElementById('codigo-value').textContent = codigo;
        document.getElementById('codigo-generado').style.display = 'block';

        // Limpiar formulario
        document.getElementById('form-generar-token').reset();

        // Actualizar estadísticas
        await cargarEstadisticas();

        // Mostrar alerta de éxito
        mostrarAlerta('alert-generar', `✅ Código generado: ${codigo}`, 'success');

        // Scroll al código
        document.getElementById('codigo-generado').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error generando token:', error);
        mostrarAlerta('alert-generar', '❌ Error generando código: ' + error.message, 'error');
    }
}

// =====================================================
// GENERAR CÓDIGO ÚNICO
// =====================================================
async function generarCodigoUnico() {
    let codigo;
    let existe = true;

    while (existe) {
        // Generar código: TOP-ABC-1234
        const random1 = Math.random().toString(36).substring(2, 5).toUpperCase();
        const random2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        codigo = `TOP-${random1}-${random2}`;

        // Verificar si existe
        const { data } = await supabase
            .from('plan_tokens')
            .select('codigo')
            .eq('codigo', codigo)
            .single();

        existe = data !== null;
    }

    return codigo;
}

// =====================================================
// CARGAR TOKENS
// =====================================================
async function cargarTokens() {
    const loadingEl = document.getElementById('loading-tokens');
    const containerEl = document.getElementById('tokens-container');
    const tbodyEl = document.getElementById('tokens-tbody');

    loadingEl.style.display = 'block';
    containerEl.style.display = 'none';

    try {
        const { data, error } = await supabase
            .from('plan_tokens')
            .select(`
                *,
                usado_por_profile:profiles!plan_tokens_usado_por_fkey(email)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        tokensData = data || [];

        // Renderizar tabla
        tbodyEl.innerHTML = '';

        if (tokensData.length === 0) {
            tbodyEl.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">No hay tokens generados</td></tr>';
        } else {
            tokensData.forEach(token => {
                const tr = document.createElement('tr');
                
                let estado = 'Disponible';
                let badgeClass = 'badge-success';
                
                if (token.usado) {
                    estado = 'Usado';
                    badgeClass = 'badge-info';
                } else if (token.expira_en && new Date(token.expira_en) < new Date()) {
                    estado = 'Expirado';
                    badgeClass = 'badge-danger';
                } else if (!token.activo) {
                    estado = 'Inactivo';
                    badgeClass = 'badge-warning';
                }

                tr.innerHTML = `
                    <td><strong>${token.codigo}</strong></td>
                    <td>${token.plan_tipo.toUpperCase()}</td>
                    <td>${token.duracion_dias}</td>
                    <td>${token.categoria_especifica || 'Todas'}</td>
                    <td><span class="badge ${badgeClass}">${estado}</span></td>
                    <td>${token.usado_por_profile?.email || '-'}</td>
                    <td>${formatearFecha(token.created_at)}</td>
                    <td>
                        <div class="action-buttons">
                            ${!token.usado ? `<button class="btn btn-danger btn-sm" onclick="desactivarToken('${token.id}')">Desactivar</button>` : ''}
                        </div>
                    </td>
                `;

                tbodyEl.appendChild(tr);
            });
        }

        loadingEl.style.display = 'none';
        containerEl.style.display = 'block';

    } catch (error) {
        console.error('Error cargando tokens:', error);
        loadingEl.innerHTML = '<p style="color: red;">Error cargando tokens</p>';
    }
}

// =====================================================
// CARGAR CORTESÍAS
// =====================================================
async function cargarCortesias() {
    const loadingEl = document.getElementById('loading-cortesias');
    const containerEl = document.getElementById('cortesias-container');
    const tbodyEl = document.getElementById('cortesias-tbody');

    loadingEl.style.display = 'block';
    containerEl.style.display = 'none';

    try {
        const { data, error } = await supabase
            .from('cortesias_aplicadas')
            .select(`
                *,
                usuario:profiles!cortesias_aplicadas_user_id_fkey(email, nombre_negocio)
            `)
            .order('fecha_inicio', { ascending: false });

        if (error) throw error;

        cortesiasData = data || [];

        // Renderizar tabla
        tbodyEl.innerHTML = '';

        if (cortesiasData.length === 0) {
            tbodyEl.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #999;">No hay cortesías aplicadas</td></tr>';
        } else {
            cortesiasData.forEach(cortesia => {
                const tr = document.createElement('tr');
                
                const fechaFin = new Date(cortesia.fecha_fin);
                const ahora = new Date();
                const diasRestantes = Math.ceil((fechaFin - ahora) / (1000 * 60 * 60 * 24));
                
                let estado = 'Activo';
                let badgeClass = 'badge-success';
                
                if (fechaFin < ahora) {
                    estado = 'Expirado';
                    badgeClass = 'badge-danger';
                } else if (!cortesia.activo) {
                    estado = 'Inactivo';
                    badgeClass = 'badge-warning';
                }

                tr.innerHTML = `
                    <td>${cortesia.usuario?.email || 'N/A'}</td>
                    <td>${cortesia.usuario?.nombre_negocio || '-'}</td>
                    <td>${cortesia.plan_tipo.toUpperCase()}</td>
                    <td>${formatearFecha(cortesia.fecha_inicio)}</td>
                    <td>${formatearFecha(cortesia.fecha_fin)}</td>
                    <td>${diasRestantes > 0 ? diasRestantes : 0}</td>
                    <td><span class="badge ${badgeClass}">${estado}</span></td>
                    <td>${cortesia.metodo === 'codigo' ? '🎟️ Código' : '✋ Manual'}</td>
                    <td>
                        <div class="action-buttons">
                            ${cortesia.activo ? `<button class="btn btn-danger btn-sm" onclick="desactivarCortesia('${cortesia.id}')">Cancelar</button>` : ''}
                        </div>
                    </td>
                `;

                tbodyEl.appendChild(tr);
            });
        }

        loadingEl.style.display = 'none';
        containerEl.style.display = 'block';

    } catch (error) {
        console.error('Error cargando cortesías:', error);
        loadingEl.innerHTML = '<p style="color: red;">Error cargando cortesías</p>';
    }
}

// =====================================================
// CARGAR USUARIOS
// =====================================================
async function cargarUsuarios() {
    const loadingEl = document.getElementById('loading-usuarios');
    const containerEl = document.getElementById('usuarios-container');
    const tbodyEl = document.getElementById('usuarios-tbody');

    loadingEl.style.display = 'block';
    containerEl.style.display = 'none';

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                anuncios(count)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        usuariosData = data || [];

        // Renderizar tabla
        tbodyEl.innerHTML = '';

        if (usuariosData.length === 0) {
            tbodyEl.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">No hay usuarios registrados</td></tr>';
        } else {
            usuariosData.forEach(usuario => {
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td>${usuario.email || 'N/A'}</td>
                    <td>${usuario.nombre_negocio || usuario.full_name || '-'}</td>
                    <td>${formatearFecha(usuario.created_at)}</td>
                    <td>${usuario.anuncios?.[0]?.count || 0}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="asignarRapido('${usuario.email}')">
                            Dar Plan TOP
                        </button>
                    </td>
                `;

                tbodyEl.appendChild(tr);
            });
        }

        loadingEl.style.display = 'none';
        containerEl.style.display = 'block';

    } catch (error) {
        console.error('Error cargando usuarios:', error);
        loadingEl.innerHTML = '<p style="color: red;">Error cargando usuarios</p>';
    }
}

// =====================================================
// ASIGNAR PLAN MANUAL
// =====================================================
async function asignarPlanManual() {
    const email = document.getElementById('email-usuario').value;
    const planTipo = document.getElementById('plan-manual').value;
    const duracionDias = parseInt(document.getElementById('duracion-manual').value);
    const notas = document.getElementById('notas-manual').value;

    try {
        // Buscar usuario por email
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (profileError || !profile) {
            mostrarAlerta('alert-asignar', '❌ Usuario no encontrado con ese email', 'error');
            return;
        }

        // Calcular fecha fin
        const fechaFin = new Date();
        fechaFin.setDate(fechaFin.getDate() + duracionDias);

        // Insertar cortesía
        const { error } = await supabase
            .from('cortesias_aplicadas')
            .insert([{
                user_id: profile.id,
                plan_tipo: planTipo,
                fecha_fin: fechaFin.toISOString(),
                asignado_por: currentAdminUser.id,
                metodo: 'manual',
                notas: notas,
                activo: true
            }]);

        if (error) throw error;

        // Limpiar formulario
        document.getElementById('form-asignar-manual').reset();

        // Actualizar estadísticas
        await cargarEstadisticas();

        // Mostrar alerta
        mostrarAlerta('alert-asignar', `✅ Plan ${planTipo.toUpperCase()} asignado a ${email} por ${duracionDias} días`, 'success');

        // Recargar cortesías
        await cargarCortesias();

    } catch (error) {
        console.error('Error asignando plan:', error);
        mostrarAlerta('alert-asignar', '❌ Error: ' + error.message, 'error');
    }
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================
function mostrarAlerta(containerId, mensaje, tipo) {
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="alert alert-${tipo}">${mensaje}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
}

// =====================================================
// FUNCIONES GLOBALES (llamadas desde onclick)
// =====================================================
window.copiarCodigo = function() {
    const codigo = document.getElementById('codigo-value').textContent;
    navigator.clipboard.writeText(codigo).then(() => {
        alert('✅ Código copiado: ' + codigo);
    });
};

window.desactivarToken = async function(tokenId) {
    if (!confirm('¿Desactivar este token? No podrá ser usado.')) return;

    try {
        const { error } = await supabase
            .from('plan_tokens')
            .update({ activo: false })
            .eq('id', tokenId);

        if (error) throw error;

        alert('✅ Token desactivado');
        await cargarTokens();
        await cargarEstadisticas();

    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
};

window.desactivarCortesia = async function(cortesiaId) {
    if (!confirm('¿Cancelar esta cortesía? El usuario perderá el plan gratis.')) return;

    try {
        const { error } = await supabase
            .from('cortesias_aplicadas')
            .update({ activo: false })
            .eq('id', cortesiaId);

        if (error) throw error;

        alert('✅ Cortesía cancelada');
        await cargarCortesias();
        await cargarEstadisticas();

    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
};

window.asignarRapido = function(email) {
    document.getElementById('email-usuario').value = email;
    document.getElementById('plan-manual').value = 'top';
    document.getElementById('duracion-manual').value = 30;

    // Cambiar a tab de asignar
    document.querySelector('[data-tab="usuarios"]').click();

    // Scroll al formulario
    document.getElementById('form-asignar-manual').scrollIntoView({ behavior: 'smooth' });
};

// =====================================================
// NUEVAS FUNCIONES PARA DASHBOARD Y GESTIÓN
// =====================================================

// Inicializar panel de administración
function initializeAdminPanel() {
    // Configurar tabs
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remover clase active de todos
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

            // Agregar clase active al seleccionado
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
}

// Cargar estadísticas del dashboard
async function loadDashboardStats() {
    try {
        // Estadísticas de anuncios
        const { count: totalAnuncios, error: errorAnuncios } = await supabase
            .from('anuncios')
            .select('*', { count: 'exact', head: true });

        // Estadísticas de usuarios
        const { count: totalUsuarios, error: errorUsuarios } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // Anuncios activos (no vendidos y no expirados)
        const { count: anunciosActivos, error: errorActivos } = await supabase
            .from('anuncios')
            .select('*', { count: 'exact', head: true })
            .neq('is_sold', true);

        // Cortesías activas
        const { count: cortesiasActivas, error: errorCortesias } = await supabase
            .from('cortesias')
            .select('*', { count: 'exact', head: true })
            .eq('activa', true);

        if (!errorAnuncios) document.getElementById('stat-total-anuncios').textContent = totalAnuncios || 0;
        if (!errorUsuarios) document.getElementById('stat-total-usuarios').textContent = totalUsuarios || 0;
        if (!errorActivos) document.getElementById('stat-anuncios-activos').textContent = anunciosActivos || 0;
        if (!errorCortesias) document.getElementById('stat-cortesias-activas').textContent = cortesiasActivas || 0;

        // Cargar contenido detallado del dashboard
        loadDashboardContent();

    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Cargar contenido detallado del dashboard
async function loadDashboardContent() {
    const container = document.getElementById('dashboard-content');

    try {
        // Anuncios por categoría
        const { data: anunciosPorCategoria, error: errorCategoria } = await supabase
            .from('anuncios')
            .select('categoria')
            .neq('is_sold', true);

        // Anuncios por plan
        const { data: anunciosPorPlan, error: errorPlan } = await supabase
            .from('anuncios')
            .select('featured_plan')
            .neq('is_sold', true);

        // Usuarios recientes
        const { data: usuariosRecientes, error: errorUsuarios } = await supabase
            .from('profiles')
            .select('email, created_at, nombre_negocio')
            .order('created_at', { ascending: false })
            .limit(5);

        let html = '<div class="stats-grid">';

        // Estadísticas por categoría
        if (!errorCategoria && anunciosPorCategoria) {
            const categorias = {};
            anunciosPorCategoria.forEach(anuncio => {
                categorias[anuncio.categoria] = (categorias[anuncio.categoria] || 0) + 1;
            });

            html += '<div class="stat-card"><h4>Anuncios por Categoría</h4>';
            Object.entries(categorias).forEach(([cat, count]) => {
                html += `<p>${cat}: ${count}</p>`;
            });
            html += '</div>';
        }

        // Estadísticas por plan
        if (!errorPlan && anunciosPorPlan) {
            const planes = {};
            anunciosPorPlan.forEach(anuncio => {
                planes[anuncio.featured_plan || 'basico'] = (planes[anuncio.featured_plan || 'basico'] || 0) + 1;
            });

            html += '<div class="stat-card"><h4>Anuncios por Plan</h4>';
            Object.entries(planes).forEach(([plan, count]) => {
                html += `<p>${plan}: ${count}</p>`;
            });
            html += '</div>';
        }

        // Usuarios recientes
        if (!errorUsuarios && usuariosRecientes) {
            html += '<div class="stat-card"><h4>Usuarios Recientes</h4>';
            usuariosRecientes.forEach(user => {
                const fecha = new Date(user.created_at).toLocaleDateString('es-ES');
                html += `<p>${user.nombre_negocio || user.email} (${fecha})</p>`;
            });
            html += '</div>';
        }

        html += '</div>';
        container.innerHTML = html;

    } catch (error) {
        container.innerHTML = '<div class="alert alert-error">Error cargando datos del dashboard</div>';
        console.error('Error en dashboard:', error);
    }
}

// Función global para cargar anuncios
window.cargarAnuncios = async function() {
    const container = document.getElementById('anuncios-container');
    const estadoFilter = document.getElementById('filter-estado').value;
    const planFilter = document.getElementById('filter-plan').value;

    container.innerHTML = '<div class="loading">Cargando anuncios...</div>';

    try {
        let query = supabase.from('anuncios').select('*, profiles(nombre_negocio, email)');

        if (estadoFilter === 'activo') {
            query = query.neq('is_sold', true);
        } else if (estadoFilter === 'vendido') {
            query = query.eq('is_sold', true);
        }

        if (planFilter) {
            query = query.eq('featured_plan', planFilter);
        }

        const { data: anuncios, error } = await query.order('fecha_publicacion', { ascending: false }).limit(50);

        if (error) throw error;

        if (!anuncios || anuncios.length === 0) {
            container.innerHTML = '<p>No se encontraron anuncios con los filtros seleccionados.</p>';
            return;
        }

        let html = '<table class="tokens-table"><thead><tr>';
        html += '<th>ID</th><th>Título</th><th>Vendedor</th><th>Plan</th><th>Estado</th><th>Fecha</th><th>Acciones</th>';
        html += '</tr></thead><tbody>';

        anuncios.forEach(anuncio => {
            const fecha = new Date(anuncio.fecha_publicacion).toLocaleDateString('es-ES');
            const estado = anuncio.is_sold ? 'Vendido' : 'Activo';
            const estadoClass = anuncio.is_sold ? 'badge-danger' : 'badge-success';

            html += `<tr>
                <td>${anuncio.id}</td>
                <td>${anuncio.titulo.substring(0, 30)}...</td>
                <td>${anuncio.profiles?.nombre_negocio || anuncio.profiles?.email || 'N/A'}</td>
                <td>${anuncio.featured_plan || 'basico'}</td>
                <td><span class="badge ${estadoClass}">${estado}</span></td>
                <td>${fecha}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="verAnuncio(${anuncio.id})">Ver</button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarAnuncio(${anuncio.id})">Eliminar</button>
                </td>
            </tr>`;
        });

        html += '</tbody></table>';
        container.innerHTML = html;

    } catch (error) {
        container.innerHTML = '<div class="alert alert-error">Error cargando anuncios: ' + error.message + '</div>';
        console.error('Error cargando anuncios:', error);
    }
};

// Función global para cargar usuarios
window.cargarUsuarios = async function() {
    const container = document.getElementById('usuarios-container');
    container.innerHTML = '<div class="loading">Cargando usuarios...</div>';

    try {
        const { data: usuarios, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!usuarios || usuarios.length === 0) {
            container.innerHTML = '<p>No se encontraron usuarios.</p>';
            return;
        }

        let html = '<table class="usuarios-table"><thead><tr>';
        html += '<th>ID</th><th>Email</th><th>Nombre</th><th>Admin</th><th>Fecha Registro</th><th>Anuncios</th><th>Acciones</th>';
        html += '</tr></thead><tbody>';

        for (const usuario of usuarios) {
            const fecha = new Date(usuario.created_at).toLocaleDateString('es-ES');

            // Contar anuncios del usuario
            const { count: numAnuncios } = await supabase
                .from('anuncios')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', usuario.id);

            const adminBadge = usuario.is_admin ? '<span class="badge badge-warning">Admin</span>' : '';

            html += `<tr>
                <td>${usuario.id.substring(0, 8)}...</td>
                <td>${usuario.email}</td>
                <td>${usuario.nombre_negocio || 'N/A'}</td>
                <td>${adminBadge}</td>
                <td>${fecha}</td>
                <td>${numAnuncios || 0}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="verUsuario('${usuario.id}')">Ver</button>
                    <button class="btn btn-sm btn-warning" onclick="toggleAdmin('${usuario.id}', ${usuario.is_admin})">${usuario.is_admin ? 'Quitar' : 'Hacer'} Admin</button>
                </td>
            </tr>`;
        }

        html += '</tbody></table>';
        container.innerHTML = html;

    } catch (error) {
        container.innerHTML = '<div class="alert alert-error">Error cargando usuarios: ' + error.message + '</div>';
        console.error('Error cargando usuarios:', error);
    }
};

// Funciones de acciones
window.verAnuncio = function(id) {
    window.open(`detalle-producto.html?id=${id}`, '_blank');
};

window.eliminarAnuncio = async function(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este anuncio? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('anuncios')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('Anuncio eliminado correctamente');
        window.cargarAnuncios();

    } catch (error) {
        alert('Error eliminando anuncio: ' + error.message);
    }
};

window.verUsuario = function(id) {
    alert('Función de ver usuario detallado - próximamente');
};

window.toggleAdmin = async function(id, currentStatus) {
    const action = currentStatus ? 'quitar' : 'dar';
    if (!confirm(`¿Estás seguro de que quieres ${action} permisos de administrador a este usuario?`)) {
        return;
    }

    try {
        const { error } = await supabase
            .from('profiles')
            .update({ is_admin: !currentStatus })
            .eq('id', id);

        if (error) throw error;

        alert(`Permisos de administrador ${currentStatus ? 'removidos' : 'otorgados'} correctamente`);
        window.cargarUsuarios();

    } catch (error) {
        alert('Error cambiando permisos: ' + error.message);
    }
};

// Funciones de búsqueda
window.buscarAnuncio = async function() {
    const id = document.getElementById('search-anuncio-id').value.trim();
    const resultsDiv = document.getElementById('search-results');

    if (!id) {
        resultsDiv.innerHTML = '<div class="alert alert-error">Ingresa un ID de anuncio</div>';
        return;
    }

    resultsDiv.innerHTML = '<div class="loading">Buscando...</div>';

    try {
        const { data: anuncio, error } = await supabase
            .from('anuncios')
            .select('*, profiles(nombre_negocio, email)')
            .eq('id', parseInt(id))
            .single();

        if (error || !anuncio) {
            resultsDiv.innerHTML = '<div class="alert alert-error">Anuncio no encontrado</div>';
            return;
        }

        const fecha = new Date(anuncio.fecha_publicacion).toLocaleDateString('es-ES');
        resultsDiv.innerHTML = `
            <div class="admin-card">
                <h3>Anuncio encontrado: ${anuncio.titulo}</h3>
                <p><strong>ID:</strong> ${anuncio.id}</p>
                <p><strong>Vendedor:</strong> ${anuncio.profiles?.nombre_negocio || anuncio.profiles?.email || 'N/A'}</p>
                <p><strong>Plan:</strong> ${anuncio.featured_plan || 'basico'}</p>
                <p><strong>Estado:</strong> ${anuncio.is_sold ? 'Vendido' : 'Activo'}</p>
                <p><strong>Fecha:</strong> ${fecha}</p>
                <p><strong>Precio:</strong> $${anuncio.precio}</p>
                <button class="btn btn-primary" onclick="verAnuncio(${anuncio.id})">Ver Anuncio Completo</button>
            </div>
        `;

    } catch (error) {
        resultsDiv.innerHTML = '<div class="alert alert-error">Error en la búsqueda: ' + error.message + '</div>';
    }
};

window.buscarUsuario = async function() {
    const email = document.getElementById('search-user-email').value.trim();
    const resultsDiv = document.getElementById('search-results');

    if (!email) {
        resultsDiv.innerHTML = '<div class="alert alert-error">Ingresa un email de usuario</div>';
        return;
    }

    resultsDiv.innerHTML = '<div class="loading">Buscando...</div>';

    try {
        const { data: usuario, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !usuario) {
            resultsDiv.innerHTML = '<div class="alert alert-error">Usuario no encontrado</div>';
            return;
        }

        const fecha = new Date(usuario.created_at).toLocaleDateString('es-ES');

        // Contar anuncios
        const { count: numAnuncios } = await supabase
            .from('anuncios')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', usuario.id);

        resultsDiv.innerHTML = `
            <div class="admin-card">
                <h3>Usuario encontrado: ${usuario.nombre_negocio || usuario.email}</h3>
                <p><strong>ID:</strong> ${usuario.id}</p>
                <p><strong>Email:</strong> ${usuario.email}</p>
                <p><strong>Nombre:</strong> ${usuario.nombre_negocio || 'N/A'}</p>
                <p><strong>Admin:</strong> ${usuario.is_admin ? 'Sí' : 'No'}</p>
                <p><strong>Fecha registro:</strong> ${fecha}</p>
                <p><strong>Total anuncios:</strong> ${numAnuncios || 0}</p>
                <button class="btn btn-primary" onclick="verUsuario('${usuario.id}')">Ver Perfil Completo</button>
            </div>
        `;

    } catch (error) {
        resultsDiv.innerHTML = '<div class="alert alert-error">Error en la búsqueda: ' + error.message + '</div>';
    }
};
