require('dotenv').config({ path: './bot/.env' });
const { createClient } = require('@supabase/supabase-js');

async function checkSchema() {
    console.log('Checking Lobbies Table Schema...');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

    // Try to insert a row with the new columns
    // We use a non-existent ID to fail constraint but check column existence first?
    // Better: Attempt to insert with explicit columns. If column doesn't exist, it will error.

    // We'll try to insert a fake lobby with the new fields.
    // If it fails with "column does not exist", we know we need to migrate.

    const testData = {
        // game_mode_id: 1, // Need a valid one...
        status: 'test',
        type: 'ranked',          // <--- New
        description: 'test',     // <--- New
        host_id: 'test'          // <--- New
    };

    // We can't insert easily without valid FKs (game_mode_id, host_id).
    // So let's just use `rpc` or just rely on the error from a bad select?
    // `select type, description from lobbies limit 1`

    const { data, error } = await supabase
        .from('lobbies')
        .select('type, description')
        .limit(1);

    if (error) {
        console.error('Schema Check Failed:', error);
        if (error.message.includes('create column') || error.message.includes('does not exist')) {
            console.log('MISSING COLUMNS DETECTED.');
        }
    } else {
        console.log('Columns exist. Schema is good.');
    }
}

checkSchema();
