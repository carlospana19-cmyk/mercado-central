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
