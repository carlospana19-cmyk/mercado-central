// supabase-client.js - CONFIGURACIÓN CORRECTA

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Credenciales de Supabase (proyecto activo)
const supabaseUrl = 'https://ldtomnicwnwituyensmn.supabase.co';
const supabaseAnonKey = 'sb_publishable_IhsU4XOQCR8R83oZEXhVAA_W_8v6Fik';

// Crear cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});
