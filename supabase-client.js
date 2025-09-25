// supabase-client.js

const SUPABASE_URL = 'https://tinjpodtyydloleepbmb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpbmpwb2R0eXlkbG9sZWVwYm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTUxMTMsImV4cCI6MjA3NDEzMTExM30.OJmuyJW3MfQ3JtAtBApZ32jks2qc1UzTBY_hbnFksYk';

// Creamos y exportamos el cliente para que otros scripts puedan usarlo
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
