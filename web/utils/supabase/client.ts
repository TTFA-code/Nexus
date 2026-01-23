import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("CRITICAL: Supabase Environment Variables are missing. Check Vercel Settings.");
}

// Browser-only log
if (typeof window !== 'undefined') {
    console.log('[Nexus-Auth] Client initialized. Key length:', supabaseKey.length);
}

export const supabase = createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey
)

export function createClient() {
    return supabase;
}
