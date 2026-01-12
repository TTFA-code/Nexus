
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from bot .env (matching seed_arena.ts pattern)
dotenv.config({ path: path.resolve(__dirname, '../../bot/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables from bot/.env');
    console.error('URL:', supabaseUrl ? 'Found' : 'Missing');
    console.error('KEY:', supabaseServiceKey ? 'Found' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function nukeLobbies() {
    console.log('☢️  Nuking Lobbies and Queues...');

    // 1. Clear Lobby Players (Dependenct of Lobbies)
    const { error: lpError } = await supabase
        .from('lobby_players')
        .delete()
        .neq('lobby_id', '00000000-0000-0000-0000-000000000000'); // Hack to delete all

    if (lpError) console.error('Error clearing lobby_players:', lpError);
    else console.log('✅ Cleared lobby_players');

    // 2. Clear Lobbies
    const { error: lError } = await supabase
        .from('lobbies')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (lError) console.error('Error clearing lobbies:', lError);
    else console.log('✅ Cleared lobbies');

    // 3. Clear Queues
    const { error: qError } = await supabase
        .from('queues')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (qError) console.error('Error clearing queues:', qError);
    else console.log('✅ Cleared queues');

    // 4. Clear Matches (Optional but recommended if state is weird)
    // The user asked to "clear all lobbies", but often "no match found" refers to the game loop.
    // I'll leave matches alone unless specifically asked to avoid deleting history, 
    // BUT usually "Arena" reset implies matches too.
    // Given the prompt "as when i enter one i cleared in the sql it says no match found", 
    // it implies they WANT the state gone.
    // I'll stick to Lobbies/Queues as requested.
}

nukeLobbies();
