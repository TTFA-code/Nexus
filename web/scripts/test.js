const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = envFile.split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
    return acc;
}, {});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: lobbies } = await supabase.from('lobbies').select('*').order('created_at', { ascending: false }).limit(1);
    const { data: players } = await supabase.from('lobby_players').select('*').eq('lobby_id', lobbies[0].id);

    console.log('Lobby Creator ID:', lobbies[0].creator_id);
    console.log('Lobby Players:', players);
}
check();
