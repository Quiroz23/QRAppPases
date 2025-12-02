import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        '❌ Error: Falta configurar las credenciales de Supabase.\n' +
        'Asegúrate de tener un archivo .env con:\n' +
        '  EXPO_PUBLIC_SUPABASE_URL=tu_url\n' +
        '  EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_key'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});
