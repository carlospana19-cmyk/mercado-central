import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Configuración del proyecto Supabase
const supabaseUrl = 'https://ldtomnicwnwituyensmn.supabase.co'
const supabaseAnonKey = 'sb_publishable_IhsU4XOQCR8R83oZEXhVAA_W_8v6Fik'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
