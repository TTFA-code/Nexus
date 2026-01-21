const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'web/.env.local' });

const DRY_RUN = process.argv.includes('--dry-run');

if (DRY_RUN) {
    console.log('🚧 RUNNING IN DRY RUN MODE - NO CHANGES WILL BE WRITTEN 🚧');
}

// --- CONFIGURATION ---
// OLD Project (Source)
const OLD_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rkiplzdlprguefewxcil.supabase.co';
const OLD_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must be in .env.local

// NEW Project (Target)
const NEW_URL = 'https://wuluaotvnbvliysghepp.supabase.co';
const NEW_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bHVhb3R2bmJ2bGl5c2doZXBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk1MjQ1OCwiZXhwIjoyMDg0NTI4NDU4fQ.iYwtdy-6iQ9AV6vPAjIFy0rLz0EZYf8X7xMthu-cST8';

if (!OLD_SERVICE_KEY || NEW_SERVICE_KEY.includes('PLACEHOLDER')) {
    console.error('❌ Missing Service Role Keys.');
}

const sourceSupabase = createClient(OLD_URL, OLD_SERVICE_KEY);
const targetSupabase = createClient(NEW_URL, NEW_SERVICE_KEY);

const TABLES_TO_MIGRATE = [
    { old: 'clubs', new: 'guilds' }, // Map clubs to guilds
    'game_modes',
    'lobbies',
    'matches',
    'match_players',
    'mmr_history',
    'guild_bans'
];

async function migrateAuthUsers() {
    console.log('--- Migrating Auth Users ---');
    const { data: { users }, error } = await sourceSupabase.auth.admin.listUsers();
    if (error) throw error;

    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        try {
            const { data: existingUser } = await targetSupabase.auth.admin.getUserById(user.id);
            if (existingUser && existingUser.user) {
                console.log(`User ${user.email} already exists. Skipping.`);
                continue;
            }
        } catch (e) { /* Ignore not found */ }

        if (DRY_RUN) {
            console.log(`[DRY RUN] Would create user: ${user.email} (ID: ${user.id})`);
            continue;
        }

        const { error: createError } = await targetSupabase.auth.admin.createUser({
            id: user.id,
            email: user.email,
            email_confirm: user.email_confirmed_at ? true : false,
            user_metadata: user.user_metadata,
            password: 'TemporaryPassword123!'
        });

        if (createError) console.error(`Failed to create user ${user.email}:`, createError.message);
        else console.log(`Migrated user: ${user.email} (ID: ${user.id})`);
    }
}

async function migrateTable(tableConfig) {
    const oldName = typeof tableConfig === 'string' ? tableConfig : tableConfig.old;
    const newName = typeof tableConfig === 'string' ? tableConfig : tableConfig.new;

    // Determine the conflict column (usually 'id', but 'guild_id' for guilds)
    const conflictColumn = newName === 'guilds' ? 'guild_id' : 'id';

    console.log(`--- Migrating Table: ${oldName} -> ${newName} ---`);

    const { data: rows, error: fetchError } = await sourceSupabase.from(oldName).select('*');
    if (fetchError) {
        console.error(`Error fetching ${oldName}:`, fetchError.message);
        return;
    }

    if (!rows || rows.length === 0) {
        console.log(`No data in ${oldName}.`);
        return;
    }

    console.log(`Migrating ${rows.length} rows for ${newName}...`);

    if (DRY_RUN) {
        console.log(`[DRY RUN] Would upsert ${rows.length} rows into ${newName} (Conflict on: ${conflictColumn})`);
        return;
    }

    // Pass the correct onConflict column
    const { error: insertError } = await targetSupabase
        .from(newName)
        .upsert(rows, { onConflict: conflictColumn });

    if (insertError) console.error(`Error inserting into ${newName}:`, insertError.message);
    else console.log(`✅ Successfully migrated ${newName}`);
}

async function runMigration() {
    try {
        await migrateAuthUsers();

        for (const table of TABLES_TO_MIGRATE) {
            await migrateTable(table);
        }

        console.log(DRY_RUN ? '🚧 Dry Run Complete' : '🎉 Migration Complete!');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

runMigration();
