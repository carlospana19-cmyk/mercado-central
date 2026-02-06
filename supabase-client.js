// supabase-client.js - CONFIGURACIÓN CORREGIDA

// Importar con versión específica
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm';

// Credenciales de Supabase
const supabaseUrl = 'https://ldtomnicwnwituyensmn.supabase.co';
const supabaseAnonKey = 'sb_publishable_IhsU4XOQCR8R83oZEXhVAA_W_8v6Fik';

// Validar credenciales
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: Credenciales de Supabase no configuradas');
}

// Crear cliente
let supabase;

try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storage: window.localStorage
        }
    });
    console.log('✅ Supabase client inicializado correctamente');
} catch (error) {
    console.error('❌ Error al inicializar Supabase:', error);
}

// Hacer disponible globalmente para debugging
if (typeof window !== 'undefined') {
    window.supabase = supabase;
}

export { supabase };
