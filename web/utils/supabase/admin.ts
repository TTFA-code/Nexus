import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

export function getAdminClient() {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("CRITICAL: process.env.SUPABASE_SERVICE_ROLE_KEY is undefined. Admin operations will fail.");
        return null;
    }

    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}

// Alias for backward compatibility if needed, or we refactor all calls
export const createAdminClient = getAdminClient;
