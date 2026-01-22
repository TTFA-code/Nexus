const { EmbedBuilder } = require('discord.js');

class Matchmaker {
    constructor(client) {
        this.client = client;
        this.supabase = client.supabase;
    }

    async getGameMode(guildId, gameModeName) {
        const { data, error } = await this.supabase
            .from('game_modes')
            .select('*')
            .eq('guild_id', guildId)
            .ilike('name', gameModeName)
            .single();

        if (error) return null;
        return data;
    }

    async addPlayerToQueue(guildId, userId, gameModeName) {
        // 0. Ensure Club Exists (Safety Check)
        const guild = this.client.guilds.cache.get(guildId);
        if (guild) {
            const { error: clubError } = await this.supabase.rpc('ensure_guild_exists', {
                gid: guild.id,
                gname: guild.name
            });
            if (clubError) console.error('Auto-registration failed:', clubError);
        }

        // 1. Get Game Mode
        const gameMode = await this.getGameMode(guildId, gameModeName);
        if (!gameMode) return { success: false, message: `Game mode "${gameModeName}" not found.` };

        // 2. Ensure Player exists
        const { error: playerError } = await this.supabase
            .from('players')
            .upsert({ user_id: userId }, { onConflict: 'user_id' });

        if (playerError) {
            console.error('Error upserting player:', playerError);
            return { success: false, message: 'Failed to register player profile.' };
        }

        // 3. Add to Queue
        const { error: queueError } = await this.supabase
            .from('queues')
            .insert({ game_mode_id: gameMode.id, user_id: userId });

        if (queueError) {
            if (queueError.code === '23505') { // Unique violation
                return { success: false, message: 'You are already in this queue.' };
            }
            console.error('Error adding to queue:', queueError);
            return { success: false, message: 'Failed to join queue.' };
        }

        // 4. Check if Queue is Full
        this.checkQueue(gameMode);

        return { success: true, message: `Joined queue for **${gameMode.name}**.` };
    }

    async removePlayerFromQueue(userId, guildId) {
        // We need to find which queue they are in for this guild
        // For simplicity, let's just remove them from ALL queues in this guild (or just all queues for now)
        // A more specific approach would be better, but "Leave Queue" usually implies the current one.

        // Find queues the user is in, linked to game modes of this guild
        const { data: queues, error } = await this.supabase
            .from('queues')
            .select('*, game_modes!inner(*)')
            .eq('user_id', userId)
            .eq('game_modes.guild_id', guildId);

        if (error || !queues.length) {
            return { success: false, message: 'You are not in any queues.' };
        }

        const { error: deleteError } = await this.supabase
            .from('queues')
            .delete()
            .eq('user_id', userId)
            .in('game_mode_id', queues.map(q => q.game_mode_id));

        if (deleteError) {
            return { success: false, message: 'Failed to leave queue.' };
        }

        return { success: true, message: 'Left all queues.' };
    }

    async checkQueue(gameMode) {
        const { count, error } = await this.supabase
            .from('queues')
            .select('*', { count: 'exact', head: true })
            .eq('game_mode_id', gameMode.id);

        if (error) {
            console.error('Error checking queue:', error);
            return;
        }

        const requiredPlayers = gameMode.team_size * 2;
        if (count >= requiredPlayers) {
            // Trigger Ready Check instead of instant match
            // We need to fetch the next N players
            const { data: queueEntries } = await this.supabase
                .from('queues')
                .select('user_id')
                .eq('game_mode_id', gameMode.id)
                .order('joined_at', { ascending: true })
                .limit(requiredPlayers);

            const playerIds = queueEntries.map(q => q.user_id);

            // Remove them from queue TEMPORARILY to prevent double allocation? 
            // Or just lock them? For now, let's keep them in queue but maybe mark them?
            // If they decline, we remove them. If they accept, we remove them after match start.
            // Simpler: Remove from queue immediately. If failed, user must rejoin. 
            // Better UX: Keep in queue, but ignore them if in lobby.

            // Let's go with: Remove from queue immediately. 
            // If match fails, ReadyCheckManager should stick them back at the front (Future feature).
            await this.supabase
                .from('queues')
                .delete()
                .in('user_id', playerIds)
                .eq('game_mode_id', gameMode.id);

            // Start Ready Check
            this.client.systems.readyCheck.createLobby(gameMode, playerIds);
        }
    }

    async createMatchFromList(gameMode, playerIds) {
        console.log(`Creating match for ${gameMode.name} with ${playerIds.length} players...`);

        // Shuffle players for random teams
        for (let i = playerIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
        }

        const team1Ids = playerIds.slice(0, gameMode.team_size);
        const team2Ids = playerIds.slice(gameMode.team_size);

        // 2. Create Match Record
        const { data: match, error: matchError } = await this.supabase
            .from('matches')
            .insert({ game_mode_id: gameMode.id, status: 'ongoing' })
            .select()
            .single();

        if (matchError) {
            console.error('Error creating match:', matchError);
            return;
        }

        // 2.5 Insert Match Players
        const matchPlayers = [
            ...team1Ids.map(id => ({ match_id: match.id, user_id: id, team: 1 })),
            ...team2Ids.map(id => ({ match_id: match.id, user_id: id, team: 2 }))
        ];

        const { error: playersError } = await this.supabase
            .from('match_players')
            .insert(matchPlayers);

        if (playersError) console.error('Error adding players:', playersError);

        // 3. (Skipped) Remove from Queue (Already done before ready check)

        // 4. Create Voice Channels
        if (gameMode.voice_enabled && this.client.systems.voice) {
            const guild = this.client.guilds.cache.get(gameMode.guild_id);
            if (guild) {
                await this.client.systems.voice.createMatchChannels(guild, match, team1Ids, team2Ids);
            }
        }

        // 5. Notify Players
        this.client.emit('matchCreated', match, { team1: team1Ids, team2: team2Ids }, gameMode);

        // 6. Broadcast Announcement
        if (this.client.systems.announcer) {
            this.client.systems.announcer.announceMatchStarted(match, gameMode, team1Ids, team2Ids);
        }
    }

    // Deprecated direct createMatch, kept for fallback or admin force start
    async createMatch(gameMode) {
        console.log(`Creating match for ${gameMode.name}...`);

        // 1. Get Players
        const { data: queueEntries, error } = await this.supabase
            .from('queues')
            .select('user_id')
            .eq('game_mode_id', gameMode.id)
            .order('joined_at', { ascending: true })
            .limit(gameMode.team_size * 2);

        if (error || queueEntries.length < gameMode.team_size * 2) return;

        const playerIds = queueEntries.map(q => q.user_id);

        // Shuffle players for random teams
        for (let i = playerIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
        }

        const team1Ids = playerIds.slice(0, gameMode.team_size);
        const team2Ids = playerIds.slice(gameMode.team_size);

        // 2. Create Match Record
        const { data: match, error: matchError } = await this.supabase
            .from('matches')
            .insert({ game_mode_id: gameMode.id })
            .select()
            .single();

        if (matchError) {
            console.error('Error creating match:', matchError);
            return;
        }

        // 2.5 Insert Match Players
        const matchPlayers = [
            ...team1Ids.map(id => ({ match_id: match.id, user_id: id, team: 1 })),
            ...team2Ids.map(id => ({ match_id: match.id, user_id: id, team: 2 }))
        ];

        const { error: playersError } = await this.supabase
            .from('match_players')
            .insert(matchPlayers);

        if (playersError) {
            console.error('Error adding players to match:', playersError);
            // We might want to rollback here in a real app, but for now just log it.
        }

        // 3. Remove Players from Queue
        await this.supabase
            .from('queues')
            .delete()
            .in('user_id', playerIds)
            .eq('game_mode_id', gameMode.id);

        // 4. Create Voice Channels
        if (gameMode.voice_enabled && this.client.systems.voice) {
            // We need the guild object. We can get it from the client cache using guild_id from gameMode
            const guild = this.client.guilds.cache.get(gameMode.guild_id);
            if (guild) {
                await this.client.systems.voice.createMatchChannels(guild, match, team1Ids, team2Ids);
            }
        }

        // 5. Notify Players (Emit event)
        this.client.emit('matchCreated', match, { team1: team1Ids, team2: team2Ids }, gameMode);
    }
}

module.exports = Matchmaker;
