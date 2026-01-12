require('dotenv').config({ path: './bot/.env' });
const { createClient } = require('@supabase/supabase-js');

async function listGameModes() {
    console.log('--- Listing Game Modes ---');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

    const { data, error } = await supabase
        .from('game_modes')
        .select('id, name, guild_id, is_active');

    if (error) {
        console.error('Error:', error);
    } else {
        console.table(data);
    }
}

listGameModes();
