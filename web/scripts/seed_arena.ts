
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from bot .env (assuming it has higher privileges or is the source of truth)
dotenv.config({ path: path.resolve(__dirname, '../../bot/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables from bot/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedArena() {
    console.log('Seeding Arena Game Modes...');

    // 1. Clear existing game modes (optional, but good for cleanup as requested)
    // We will delete all game modes to ensure a clean state
    const { error: deleteError } = await supabase
        .from('game_modes')
        .delete()
        .neq('id', 0); // Delete all

    if (deleteError) {
        console.error('Error clearing game modes:', deleteError);
        return;
    }

    console.log('Cleared existing game modes.');

    // 2. Insert new game modes
    const modes = [
        // League of Legends
        { name: 'League of Legends - Scrim (5v5)', team_size: 5, picking_method: 'CAPTAINS', voice_enabled: true, is_active: true },
        { name: 'League of Legends - 1v1', team_size: 1, picking_method: 'RANDOM', voice_enabled: false, is_active: true },

        // Rocket League
        { name: 'Rocket League - 1v1', team_size: 1, picking_method: 'RANDOM', voice_enabled: false, is_active: true },
        { name: 'Rocket League - 2v2', team_size: 2, picking_method: 'RANDOM', voice_enabled: true, is_active: true },

        // FIFA
        { name: 'FIFA - 1v1', team_size: 1, picking_method: 'RANDOM', voice_enabled: false, is_active: true },
        { name: 'FIFA - 2v2', team_size: 2, picking_method: 'RANDOM', voice_enabled: true, is_active: true },
    ];

    const { data, error } = await supabase
        .from('game_modes')
        .insert(modes)
        .select();

    if (error) {
        console.error('Error inserting game modes:', error);
    } else {
        console.log('Successfully seeded Game Modes:', data);
    }
}

seedArena();
