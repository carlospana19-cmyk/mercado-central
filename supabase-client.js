// supabase-client.js - CONFIGURACIÓN CORREGIDA

// Importar con versión específica
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm';

// Credenciales de Supabase
const supabaseUrl = 'https://tinjpodtyydloleepbmb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpbmpwb2R0eXlkbG9sZWVwYm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTUxMTMsImV4cCI6MjA3NDEzMTExM30.OJmuyJW3MfQ3JtAtBApZ32jks2qc1UzTBY_hbnFksYk';

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

export { supabase };
