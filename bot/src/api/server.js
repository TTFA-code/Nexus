const express = require('express');
const cors = require('cors');
const { prefix } = require('../config');

function startServer(client) {
    const app = express();
    const PORT = process.env.API_PORT || 3001;

    app.use(cors());
    app.use(express.json());

    // Health check
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', bot_status: client.isReady() ? 'online' : 'offline' });
    });

    // Get all active queues (Game Modes + Player Counts)
    app.get('/queues', async (req, res) => {
        try {
            // Fetch active game modes and count players in queue for each
            const { data: gameModes, error } = await client.supabase
                .from('game_modes')
                .select(`
                    id, 
                    guild_id, 
                    name, 
                    team_size, 
                    queues (count)
                `)
                .eq('is_active', true);

            if (error) throw error;

            // Format response
            const response = gameModes.map(mode => ({
                id: mode.id,
                guildId: mode.guild_id,
                name: mode.name,
                teamSize: mode.team_size,
                currentPlayers: mode.queues[0]?.count || 0,
                maxPlayers: mode.team_size * 2
            }));

            res.json(response);
        } catch (error) {
            console.error('Error fetching queues:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Join a queue
    app.post('/queues/join', async (req, res) => {
        const { userId, guildId, gameModeName } = req.body;

        if (!userId || !guildId || !gameModeName) {
            return res.status(400).json({ error: 'Missing userId, guildId, or gameModeName' });
        }

        try {
            if (!client.systems.matchmaker) {
                return res.status(503).json({ error: 'Matchmaker system not ready' });
            }

            const result = await client.systems.matchmaker.addPlayerToQueue(guildId, userId, gameModeName);

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error joining queue:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Leave queue(s)
    app.post('/queues/leave', async (req, res) => {
        const { userId, guildId } = req.body;

        if (!userId || !guildId) {
            return res.status(400).json({ error: 'Missing userId or guildId' });
        }

        try {
            const result = await client.systems.matchmaker.removePlayerFromQueue(userId, guildId);
            res.json(result);
        } catch (error) {
            console.error('Error leaving queue:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Get user's guilds (where both User and Bot are present)
    app.get('/user/:userId/guilds', async (req, res) => {
        const { userId } = req.params;
        try {
            const checks = client.guilds.cache.map(async (guild) => {
                try {
                    // Check if user is member of this guild
                    const member = await guild.members.fetch(userId).catch(() => null);
                    return member ? guild.id : null;
                } catch (e) {
                    return null;
                }
            });

            const results = await Promise.all(checks);
            const guilds = results.filter(id => id !== null);

            res.json({ guilds });
        } catch (error) {
            console.error('Error fetching user guilds:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });


    app.listen(PORT, () => {
        console.log(`API Server listening on port ${PORT}`);
    });

    return app;
}

module.exports = { startServer };
