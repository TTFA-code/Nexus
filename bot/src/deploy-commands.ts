import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';

// This line is vital: it tells TS this is an isolated module, fixing the "Redeclare" error.
export { };

const commands: any[] = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);

    // Ensure we are only looking inside directories
    if (fs.statSync(commandsPath).isDirectory()) {
        // Explicitly type 'file' as a string to satisfy the 'strict' compiler
        const commandFiles = fs.readdirSync(commandsPath).filter((file: string) =>
            file.endsWith('.ts') || file.endsWith('.js')
        );

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing "data" or "execute" at ${filePath}`);
            }
        }
    }
}

// Ensure your CLIENT_ID and GUILD_ID are in your Railway variables!
const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // Switch to Routes.applicationCommands(process.env.CLIENT_ID!) for global deployment
        const data: any = await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID!,
                process.env.GUILD_ID!
            ),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Deployment Error:', error);
    }
})();