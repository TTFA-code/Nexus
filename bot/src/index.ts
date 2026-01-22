import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { createClient } from '@supabase/supabase-js';

declare module 'discord.js' {
    export interface Client {
        commands: Collection<string, any>;
        supabase: any;
        systems: any;
    }
}

// 1. Setup Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

// 2. Setup Supabase
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
);

// 3. Load Commands dynamically
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders as string[]) {
    const commandsPath = path.join(foldersPath, folder);
    // Ensure it's a directory
    if (fs.statSync(commandsPath).isDirectory()) {
        const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('.ts') || file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            // Dynamic require is needed here for loading command files dynamically
            // We cast to any to avoid "require" implicit any issues if not allowed, 
            // but in Node/CommonJS environment this is standard pattern.
            /* eslint-disable-next-line @typescript-eslint/no-var-requires */
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }
}

// 4. Load Systems
client.supabase = supabase;
client.systems = {};

// Initialize systems if they exist
try {
    const Matchmaker = require('./systems/matchmaker');
    client.systems.matchmaker = new Matchmaker(client);

    const VoiceSystem = require('./systems/voice');
    client.systems.voice = new VoiceSystem(client);

    const MMRSystem = require('./systems/mmr');
    client.systems.mmr = new MMRSystem(client);

    const ReadyCheckManager = require('./systems/readyCheck');
    client.systems.readyCheck = new ReadyCheckManager(client);

    const AnnouncementManager = require('./systems/announcer');
    client.systems.announcer = new AnnouncementManager(client);
} catch (error) {
    console.error('Error loading systems:', error);
}

// 5. Load Events
console.log('Current directory:', __dirname);
try {
    console.log('Files in current directory:', fs.readdirSync(__dirname));
} catch (e) {
    console.log('Could not read current directory');
}
require('./handlers/eventHandler')(client);

// 6. Login
client.login(process.env.DISCORD_TOKEN).then(() => {
    // 7. Start API Server
    const { startServer } = require('./api/server');
    startServer(client);
});
