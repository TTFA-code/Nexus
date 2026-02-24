import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = envFile.split('\n').reduce((acc: any, line) => {
    const [key, ...val] = line.split('=');
    if (key) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
    return acc;
}, {});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: lobbies } = await supabase.from('lobbies').select('*').order('created_at', { ascending: false }).limit(2);
    const { data: players } = await supabase.from('lobby_players').select('*').eq('lobby_id', lobbies[0].id);

    console.log('Lobby Creator ID:', lobbies[0].creator_id);
    console.log('Lobby Players:', JSON.stringify(players, null, 2));

    // Get trigger info
    const { data: trigger } = await supabase.rpc('exec_sql', { sql_string: 'select 1' }).catch(() => ({ data: 'no exec_sql' }));
}
check();
