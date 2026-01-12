
import { SchemaSentinel } from './web/services/SchemaSentinel';

async function testSentinel() {
    console.log("Testing generateMigrationPatch...");

    // Test Case 1: No missing columns
    const patch1 = SchemaSentinel.generateMigrationPatch([]);
    console.log("Case 1 (Empty):", patch1 === "-- No missing columns detected." ? "PASS" : "FAIL");

    // Test Case 2: Missing 'status' in 'lobby_players'
    const missing2 = ['lobby_players.status'];
    const patch2 = SchemaSentinel.generateMigrationPatch(missing2);
    console.log("Case 2 (status):");
    console.log(patch2);
    if (patch2.includes("ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'")) {
        console.log("PASS");
    } else {
        console.log("FAIL");
    }

    // Test Case 3: Missing multiple columns
    const missing3 = ['lobbies.scheduled_start', 'lobbies.notes', 'lobbies.sector_key'];
    const patch3 = SchemaSentinel.generateMigrationPatch(missing3);
    console.log("Case 3 (Multiple):");
    console.log(patch3);
    const pass3 = patch3.includes("scheduled_start TIMESTAMPTZ") &&
        patch3.includes("notes TEXT") &&
        patch3.includes("sector_key TEXT");
    console.log(pass3 ? "PASS" : "FAIL");

    console.log("Done.");
}

testSentinel();
