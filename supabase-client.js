// supabase-client.js - VERSIÓN CREADA DESDE CERO

// 1. Importar la función necesaria desde la librería de Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// 2. Definir tus credenciales de Supabase
const supabaseUrl = 'https://tinjpodtyydloleepbmb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpbmpwb2R0eXlkbG9sZWVwYm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTUxMTMsImV4cCI6MjA3NDEzMTExM30.OJmuyJW3MfQ3JtAtBApZ32jks2qc1UzTBY_hbnFksYk';

// 3. Crear y EXPORTAR el cliente de Supabase para que otros archivos puedan usarlo
export const supabase = createClient(supabaseUrl, supabaseKey);
