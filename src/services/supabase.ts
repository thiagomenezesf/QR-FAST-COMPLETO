import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// O Expo busca automaticamente do arquivo .env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// --- ADICIONE AQUI ---
// console.log("DEBUG SUPABASE URL:", supabaseUrl);
// console.log("DEBUG SUPABASE KEY:", supabaseAnonKey ? "Carregada ✅" : "Vazia ❌");
// ---------------------

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});