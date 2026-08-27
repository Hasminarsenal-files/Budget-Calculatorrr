import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-supabase-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = () => {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== '' &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder-supabase-url') &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== '' &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('placeholder-anon-key')
  );
};

export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createClient();
