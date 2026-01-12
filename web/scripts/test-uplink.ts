
import { verifyUserVoice } from '../services/UplinkAgent';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

async function main() {
    const guildId = process.argv[2];
    const userId = process.argv[3];

    if (!guildId || !userId) {
        console.error('Usage: npx tsx web/scripts/test-uplink.ts <guildId> <userId>');
        process.exit(1);
    }

    console.log(`Checking voice status for User: ${userId} in Guild: ${guildId}...`);
    const result = await verifyUserVoice(guildId, userId);
    console.log(`Result: ${result}`);
}

main();
