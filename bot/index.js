require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

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
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// 3. Load Commands dynamically
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    // Ensure it's a directory
    if (fs.statSync(commandsPath).isDirectory()) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
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
// We use the existing event handler to keep code modular and support all events (ready, interactionCreate, guildCreate)
require('./handlers/eventHandler')(client);

// 6. Login
client.login(process.env.DISCORD_TOKEN).then(() => {
    // 7. Start API Server
    const { startServer } = require('./api/server');
    startServer(client);
});
