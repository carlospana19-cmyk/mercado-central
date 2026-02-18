// =====================================================
// ADMIN LOGIC - Panel Vercel Ultra-Wide
// =====================================================

import { supabase } from './supabase-client.js';

let currentAdminUser = null;
let inventarioData = [];

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando Panel Admin...');
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
        mostrarAccessDenied();
        return;
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, email')
        .eq('id', user.id)
        .single();

    if (profileError || !profile || !profile.is_admin) {
        mostrarAccessDenied();
        return;
    }

    currentAdminUser = user;
    console.log('Admin:', profile.email);

    inicializarNavegacion();
    await cargarDashboard();
    await cargarTokens();
    await cargarUsuarios();
});

function inicializarNavegacion() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', async () => {
            // Verificar sesión antes de cambiar de pestaña
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert('Sesion expirada. Redirigiendo al login...');
                window.location.href = '/login.html';
                return;
            }
            
            const sectionId = item.dataset.section;
            if (!sectionId) return;
            
            // Verificar que sigue siendo admin
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', session.user.id)
                .single();
            
            if (!profile || !profile.is_admin) {
                alert('No tienes permisos de administrador');
                window.location.href = '/index.html';
                return;
            }
            
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            const sections = document.querySelectorAll('.section');
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById('section-' + sectionId).classList.add('active');
            
            if (sectionId === 'inventario') cargarInventario();
            else if (sectionId === 'tokens') cargarTokens();
            else if (sectionId === 'usuarios') cargarUsuarios();
            else if (sectionId === 'ganancias') cargarGanancias();
        });
    });

    document.getElementById('form-generar-token').addEventListener('submit', async (e) => {
        e.preventDefault();
        await generarToken();
    });

    document.getElementById('filter-categoria').addEventListener('change', filtrarInventario);
    document.getElementById('filter-estado').addEventListener('change', filtrarInventario);
    document.getElementById('filter-buscar').addEventListener('input', filtrarInventario);
}

function mostrarAccessDenied() {
    document.getElementById('access-denied').classList.add('show');
    setTimeout(() => { window.location.href = '/index.html'; }, 3000);
}

// DASHBOARD
async function cargarDashboard() {
    try {
        const { count: totalAnuncios } = await supabase
            .from('anuncios')
            .select('*', { count: 'exact', head: true });

        const { count: totalUsuarios } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        const now = new Date();
        const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        let { data: planesMes } = await supabase
            .from('user_plans')
            .select('plan_tipo, monto')
            .gte('created_at', inicioMes);
        
        let facturacionMes = 0;
        const precios = { top: 20, destacado: 15, premium: 10, basico: 5 };
        
        if (planesMes && planesMes.length > 0) {
            planesMes.forEach(v => facturacionMes += v.monto || precios[v.plan_tipo] || 0);
        } else {
            const { data: planesActivos } = await supabase
                .from('user_plans')
                .select('plan_tipo')
                .eq('activo', true);
            
            if (planesActivos) {
                planesActivos.forEach(p => facturacionMes += precios[p.plan_tipo] || 20);
            }
        }

        const inicioAno = new Date(now.getFullYear(), 0, 1).toISOString();
        
        let { data: planesAno } = await supabase
            .from('user_plans')
            .select('plan_tipo, monto')
            .gte('created_at', inicioAno);
        
        let facturacionAno = 0;
        
        if (planesAno && planesAno.length > 0) {
            planesAno.forEach(v => facturacionAno += v.monto || precios[v.plan_tipo] || 0);
        } else {
            const { data: todosPlanes } = await supabase.from('user_plans').select('plan_tipo');
            if (todosPlanes) {
                todosPlanes.forEach(p => facturacionAno += precios[p.plan_tipo] || 20);
            }
        }

        document.getElementById('stat-anuncios').textContent = totalAnuncios || 0;
        document.getElementById('stat-usuarios').textContent = totalUsuarios || 0;
        document.getElementById('stat-mensual').textContent = '$' + facturacionMes;
        document.getElementById('stat-anual').textContent = '$' + facturacionAno;

        generarGrafico(facturacionMes);

    } catch (error) {
        console.error('Error dashboard:', error);
    }
}

function generarGrafico(facturacionMes) {
    const container = document.getElementById('chart-ganancias');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const valores = [facturacionMes || 1200, 1900, 1500, 2200, 1800, facturacionMes || 2400];
    const max = Math.max(...valores);

    container.innerHTML = valores.map((v, i) => {
        const height = (v / max) * 100;
        return '<div class="chart-bar" style="height: ' + height + '%" title="' + meses[i] + ': $' + v + '"></div>';
    }).join('');
}

// GANANCIAS
async function cargarGanancias() {
    const tbody = document.getElementById('ganancias-tbody');
    tbody.innerHTML = '<tr><td colspan="5" class="loading"><div class="loading-spinner"></div></td></tr>';

    try {
        const { data: cortesias } = await supabase
            .from('cortesias_aplicadas')
            .select('*, user:profiles(email)')
            .order('created_at', { ascending: false })
            .limit(50);

        const userIds = [...new Set(cortesias?.map(c => c.user_id).filter(Boolean) || [])];
        let usuariosMap = {};
        
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, email, nombre_negocio')
                .in('id', userIds);
            if (profiles) profiles.forEach(p => usuariosMap[p.id] = p);
        }

        const precios = { top: 20, destacado: 15, premium: 10, basico: 5 };
        let tokensUsados = 0;
        let cortesiasActivas = 0;
        let gananciaMes = 0;
        let gananciaAno = 0;

        const now = new Date();
        const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
        const inicioAno = new Date(now.getFullYear(), 0, 1);

        tbody.innerHTML = '';
        
        if (!cortesias || cortesias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #555;">No hay registros</td></tr>';
        } else {
            cortesias.forEach(c => {
                const usuario = usuariosMap[c.user_id];
                const fecha = new Date(c.fecha_inicio);
                const monto = precios[c.plan_tipo] || 0;

                if (c.usado || c.activo) tokensUsados++;
                if (c.activo && new Date(c.fecha_fin) > now) cortesiasActivas++;
                if (fecha >= inicioMes) gananciaMes += monto;
                if (fecha >= inicioAno) gananciaAno += monto;

                tbody.innerHTML += '<tr>' +
                    '<td>' + (usuario?.email || 'N/A') + '</td>' +
                    '<td>' + c.plan_tipo.toUpperCase() + '</td>' +
                    '<td>$' + monto + '</td>' +
                    '<td>' + formatearFecha(c.fecha_inicio) + '</td>' +
                    '<td>' + (c.metodo === 'codigo' ? 'Codigo' : 'Manual') + '</td>' +
                    '</tr>';
            });
        }

        document.getElementById('ganancia-mensual').textContent = '$' + gananciaMes;
        document.getElementById('ganancia-anual').textContent = '$' + gananciaAno;
        document.getElementById('ganancia-tokens').textContent = tokensUsados;
        document.getElementById('ganancia-cortesias').textContent = cortesiasActivas;

    } catch (error) {
        console.error('Error ganancias:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ff4444;">Error</td></tr>';
    }
}

// INVENTARIO
async function cargarInventario() {
    const loadingEl = document.getElementById('loading-inventario');
    const containerEl = document.getElementById('inventario-list');

    loadingEl.style.display = 'block';
    containerEl.style.display = 'none';

    try {
        const { data, error } = await supabase
            .from('anuncios')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        inventarioData = data || [];

        const userIds = [...new Set(inventarioData.map(a => a.user_id).filter(Boolean))];
        let usuariosMap = {};
        
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, email, nombre_negocio')
                .in('id', userIds);
            if (profiles) profiles.forEach(p => usuariosMap[p.id] = p);
        }

        inventarioData = inventarioData.map(a => Object.assign({}, a, { usuario: usuariosMap[a.user_id] }));

        filtrarInventario();

        loadingEl.style.display = 'none';
        containerEl.style.display = 'block';

    } catch (error) {
        console.error('Error inventario:', error);
        loadingEl.innerHTML = '<p style="color: #ff4444;">Error</p>';
    }
}

function filtrarInventario() {
    const categoria = document.getElementById('filter-categoria').value;
    const estado = document.getElementById('filter-estado').value;
    const buscar = document.getElementById('filter-buscar').value.toLowerCase();

    let filtered = inventarioData;

    if (categoria) filtered = filtered.filter(i => i.categoria === categoria);
    if (estado === 'activo') filtered = filtered.filter(i => i.activo);
    else if (estado === 'inactivo') filtered = filtered.filter(i => !i.activo);
    if (buscar) filtered = filtered.filter(i => 
        (i.titulo && i.titulo.toLowerCase().includes(buscar)) ||
        (i.usuario && i.usuario.email && i.usuario.email.toLowerCase().includes(buscar))
    );

    renderizarInventario(filtered);
}

function renderizarInventario(data) {
    const container = document.getElementById('inventario-list');
    
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="loading">No hay anuncios</div>';
        return;
    }

    container.innerHTML = data.map(anuncio => {
        let imagenes = [];
        try { if (anuncio.imagenes) imagenes = JSON.parse(anuncio.imagenes); } catch(e) {}
        
        const imgUrl = imagenes.length > 0 ? imagenes[0] : '/imgx-logopng.jpeg';
        const visitas = anuncio.visitas || 0;
        const vendedor = anuncio.usuario ? (anuncio.usuario.nombre_negocio || anuncio.usuario.email) : 'Desconocido';
        
        return '<div class="inventario-item">' +
            '<img src="' + imgUrl + '" alt="" class="inventario-img" onerror="this.src=\'/imgx-logopng.jpeg\'">' +
            '<div class="inventario-info">' +
            '<h4>' + (anuncio.titulo || 'Sin titulo') + '</h4>' +
            '<div class="inventario-meta">' +
            '<span><strong>Vendedor:</strong> ' + vendedor + '</span>' +
            '<span>' + (anuncio.categoria || 'Sin categoria') + '</span>' +
            '<span>$' + (anuncio.precio || 0) + '</span>' +
            '<span>' + formatearFecha(anuncio.created_at) + '</span>' +
            '<span class="badge ' + (anuncio.activo ? 'badge-active' : '') + '">' + (anuncio.activo ? 'Activo' : 'Inactivo') + '</span>' +
            '</div></div>' +
            '<div class="inventario-stats">' +
            '<div class="number">' + visitas + '</div>' +
            '<div class="label">visitas</div>' +
            '</div></div>';
    }).join('');
}

// USUARIOS
async function cargarUsuarios() {
    const loadingEl = document.getElementById('loading-usuarios');
    const tableEl = document.getElementById('usuarios-table');
    const tbodyEl = document.getElementById('usuarios-tbody');

    loadingEl.style.display = 'block';
    tableEl.style.display = 'none';

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const usuarios = data || [];

        const userIds = usuarios.map(u => u.id);
        let anunciosCount = {};
        let planesActivos = {};
        
        if (userIds.length > 0) {
            const { data: counts } = await supabase
                .from('anuncios')
                .select('user_id')
                .in('user_id', userIds);
            if (counts) counts.forEach(c => anunciosCount[c.user_id] = (anunciosCount[c.user_id] || 0) + 1);
            
            // Obtener usuarios con planes activos
            const { data: planes } = await supabase
                .from('user_plans')
                .select('user_id')
                .in('user_id', userIds)
                .eq('activo', true);
            if (planes) planes.forEach(p => planesActivos[p.user_id] = true);
        }

        tbodyEl.innerHTML = '';
        
        if (usuarios.length === 0) {
            tbodyEl.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #555;">No hay usuarios</td></tr>';
        } else {
            usuarios.forEach(usuario => {
                const tienePlan = planesActivos[usuario.id];
                const vipBadge = tienePlan ? '<span style="background:#1a3d1a;color:#4ade80;padding:2px 8px;border-radius:4px;font-size:11px;margin-left:8px;">VIP</span>' : '';
                tbodyEl.innerHTML += '<tr>' +
                    '<td>' + (usuario.email || 'N/A') + '</td>' +
                    '<td>' + (usuario.nombre_negocio || usuario.full_name || '-') + vipBadge + '</td>' +
                    '<td>' + formatearFecha(usuario.created_at) + '</td>' +
                    '<td>' + (anunciosCount[usuario.id] || 0) + '</td>' +
                    '<td><button class="btn btn-sm" onclick="asignarRapido(\'' + usuario.email + '\')">Dar TOP</button></td>' +
                    '</tr>';
            });
        }

        loadingEl.style.display = 'none';
        tableEl.style.display = 'table';

    } catch (error) {
        console.error('Error usuarios:', error);
        loadingEl.innerHTML = '<p style="color: #ff4444;">Error</p>';
    }
}

// TOKENS
async function cargarTokens() {
    const loadingEl = document.getElementById('loading-tokens');
    const tableEl = document.getElementById('tokens-table');
    const tbodyEl = document.getElementById('tokens-tbody');

    loadingEl.style.display = 'block';
    tableEl.style.display = 'none';

    try {
        const { data, error } = await supabase
            .from('plan_tokens')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tokens = data || [];

        tbodyEl.innerHTML = '';
        
        if (tokens.length === 0) {
            tbodyEl.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #555;">No hay tokens</td></tr>';
        } else {
            tokens.forEach(token => {
                let estado = 'Disponible';
                let badgeClass = '';
                
                if (token.usado) estado = 'Usado';
                else if (token.expira_en && new Date(token.expira_en) < new Date()) estado = 'Expirado';
                else if (!token.activo) estado = 'Inactivo';
                else badgeClass = 'badge-active';

                tbodyEl.innerHTML += '<tr>' +
                    '<td><strong>' + token.codigo + '</strong></td>' +
                    '<td>' + token.plan_tipo.toUpperCase() + '</td>' +
                    '<td>' + token.duracion_dias + '</td>' +
                    '<td><span class="badge ' + badgeClass + '">' + estado + '</span></td>' +
                    '<td>' + formatearFecha(token.created_at) + '</td>' +
                    '<td>' + 
                    (!token.usado && token.activo ? '<button class="btn btn-danger btn-sm" onclick="desactivarToken(\'' + token.id + '\')">X</button>' : '') +
                    '</td></tr>';
            });
        }

        loadingEl.style.display = 'none';
        tableEl.style.display = 'table';

    } catch (error) {
        console.error('Error tokens:', error);
        loadingEl.innerHTML = '<p style="color: #ff4444;">Error</p>';
    }
}

async function generarToken() {
    const planTipo = document.getElementById('plan-tipo').value;
    const duracionDias = parseInt(document.getElementById('duracion-dias').value);
    const categoriaEspecifica = document.getElementById('categoria-especifica').value || null;
    const expiraEn = document.getElementById('expira-en').value || null;
    const notas = document.getElementById('notas').value || null;

    try {
        const codigo = await generarCodigoUnico();

        const { error } = await supabase.from('plan_tokens').insert([{
            codigo: codigo,
            plan_tipo: planTipo,
            duracion_dias: duracionDias,
            categoria_especifica: categoriaEspecifica,
            expira_en: expiraEn ? new Date(expiraEn).toISOString() : null,
            notas: notas,
            creado_por: currentAdminUser.id,
            activo: true
        }]);

        if (error) throw error;

        document.getElementById('codigo-value').textContent = codigo;
        document.getElementById('codigo-generado').style.display = 'block';
        document.getElementById('form-generar-token').reset();
        
        await cargarTokens();

    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
}

async function generarCodigoUnico() {
    let codigo;
    let existe = true;
    
    while (existe) {
        const random1 = Math.random().toString(36).substring(2, 5).toUpperCase();
        const random2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        codigo = 'MC-' + random1 + '-' + random2;
        
        const { data } = await supabase
            .from('plan_tokens')
            .select('codigo')
            .eq('codigo', codigo)
            .single();
        
        existe = data !== null;
    }
    
    return codigo;
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

window.copiarCodigo = function() {
    const codigo = document.getElementById('codigo-value').textContent;
    navigator.clipboard.writeText(codigo).then(() => alert('Copiado: ' + codigo));
};

window.desactivarToken = async function(tokenId) {
    if (!confirm('Desactivar token?')) return;
    try {
        await supabase.from('plan_tokens').update({ activo: false }).eq('id', tokenId);
        await cargarTokens();
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

window.asignarRapido = function(email) {
    document.querySelector('[data-section="tokens"]').click();
    document.getElementById('email-usuario').value = email;
    document.getElementById('plan-manual').value = 'top';
};

window.cerrarSesion = async function() {
    if (!confirm('Cerrar sesion?')) return;
    try {
        await supabase.auth.signOut();
        window.location.href = '/index.html';
    } catch (error) {
        alert('Error: ' + error.message);
    }
};
