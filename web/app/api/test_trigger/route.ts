import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();

    // Dump the trigger function definition
    const { data: triggerStr, error: trError } = await (supabase as any).rpc('exec_sql', {
        sql_string: "SELECT pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid = 'public.lobbies'::regclass;"
    });

    const { data: lobbies, error: lError } = await supabase.from('lobbies').select('*').order('created_at', { ascending: false }).limit(2);
    const { data: players, error: pError } = await supabase.from('lobby_players').select('*').eq('lobby_id', lobbies?.[0]?.id || '');

    return NextResponse.json({
        trigger: triggerStr, trError,
        lobbies, lError,
        players, pError
    });
}
