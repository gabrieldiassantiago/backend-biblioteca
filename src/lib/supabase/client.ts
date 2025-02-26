import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kexfmzgscbwkhzrswidl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtleGZtemdzY2J3a2h6cnN3aWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1MzQ5NjEsImV4cCI6MjA1NjExMDk2MX0.pvRKu88mqEAP7S7SZZWy_h3YSfrhvZB9k66AP_FTzug';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Garante que a sessão persiste no navegador
    autoRefreshToken: true, // Atualiza automaticamente o token, se necessário
  },
});