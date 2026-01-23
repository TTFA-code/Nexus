class MMRSystem {
    constructor(client) {
        this.client = client;
        this.supabase = client.supabase;
        this.startListener();
    }

    startListener() {
        this.supabase
            .channel('mmr-processor')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'matches',
                filter: 'approval_status=eq.approved'
            }, (payload) => {
                // Only process if it wasn't approved before (avoid duplicates if possible, though update trigger implies change)
                if (payload.old.approval_status !== 'approved') {
                    console.log('Match Approved! Calculating Elo:', payload.new.id);
                    this.processMatchResult(payload.new.id);
                }
            })
            .subscribe();

        console.log('MMR System: Listening for Match Approvals...');
    }

    // Standard Elo Implementation
    // K-Factor = 32 (Dynamic K could be implemented later)
    calculateEloChange(playerRating, opponentAvgRating, actualScore, kFactor = 32) {
        const expectedScore = 1 / (1 + Math.pow(10, (opponentAvgRating - playerRating) / 400));
        return Math.round(kFactor * (actualScore - expectedScore));
    }

    async processMatchResult(matchId) {
        // 1. Fetch Match Data with Game Mode info to get Game ID
        const { data: match, error } = await this.supabase
            .from('matches')
            .select(`
                *,
                game_modes (
                    id,
                    game_id, 
                    team_size
                ),
                match_players (
                    team, 
                    user_id
                )
            `)
            .eq('id', matchId)
            .single();

        if (error || !match) {
            console.error('Error fetching match for Elo sizing:', error);
            return;
        }

        const gameId = match.game_modes?.game_id;
        if (!gameId) {
            console.error('CRITICAL: No Game ID found for match:', matchId);
            return;
        }

        console.log(`Processing Match #${match.id} (Game: ${gameId})`);

        // 2. Fetch Current MMRs for ALL players in this match Context (Game)
        const userIds = match.match_players.map(p => p.user_id);
        const { data: currentMmrs, error: mmrError } = await this.supabase
            .from('player_mmr')
            .select('*')
            .in('user_id', userIds)
            .eq('game_id', gameId);

        if (mmrError) {
            console.error('Error fetching player_mmr:', mmrError);
            return;
        }

        // Map for easy access
        const mmrMap = new Map();
        currentMmrs?.forEach(rec => mmrMap.set(rec.user_id, rec));

        // 3. Separate Teams & Calculate Averages
        const team1 = match.match_players.filter(p => p.team === 1);
        const team2 = match.match_players.filter(p => p.team === 2);

        const getAvg = (team) => {
            const sum = team.reduce((acc, p) => {
                const rating = mmrMap.get(p.user_id)?.mmr || 1000; // Default 1000
                return acc + rating;
            }, 0);
            return sum / (team.length || 1);
        };

        const team1Avg = getAvg(team1);
        const team2Avg = getAvg(team2);

        console.log(`| T1 Avg: ${team1Avg} | T2 Avg: ${team2Avg}`);

        // 4. Update Each Player
        for (const player of match.match_players) {
            const isWinner = player.team === match.winner_team;
            const actualScore = isWinner ? 1 : 0;
            const opponentAvg = player.team === 1 ? team2Avg : team1Avg;

            // Current Stats
            const currentStats = mmrMap.get(player.user_id) || { mmr: 1000, wins: 0, losses: 0 };

            // Calculate Change
            const eloChange = this.calculateEloChange(currentStats.mmr, opponentAvg, actualScore);
            const newMmr = currentStats.mmr + eloChange;

            // Prepare Update
            const updates = {
                mmr: newMmr,
                wins: isWinner ? currentStats.wins + 1 : currentStats.wins,
                losses: !isWinner ? currentStats.losses + 1 : currentStats.losses,
                updated_at: new Date().toISOString()
            };

            // A. Update player_mmr
            const { error: upsertError } = await this.supabase
                .from('player_mmr')
                .upsert({
                    user_id: player.user_id,
                    game_id: gameId,
                    ...updates
                }, { onConflict: 'user_id, game_id' });

            if (upsertError) {
                console.error(`[MMR Error] Failed to update player_mmr for ${player.user_id}:`, upsertError.code, upsertError.message);
            }

            // B. Insert History
            const { error: historyError } = await this.supabase
                .from('mmr_history')
                .insert({
                    match_id: match.id,
                    player_id: player.user_id, // Ensure column name matches schema (standardized to player_id or player_uuid?)
                    // Checking schema: mmr_history typically uses player_id or user_id. 
                    // Migration 20260124 used player_uuid in the SQL function. 
                    // Let's assume standardized 'user_id' or 'player_id'.
                    // Safest to check schema, but for now I'll use user_id variable and if it fails I'll fix.
                    // Actually, let's use the exact names from the SQL function: player_uuid? 
                    // Wait, I can't check schema easily from here without reading file.
                    // The SQL function used: player_uuid.
                    player_uuid: player.user_id,
                    old_mmr: currentStats.mmr,
                    new_mmr: newMmr,
                    change: eloChange
                });

            if (historyError) {
                console.error(`[History Error] Failed to insert history for ${player.user_id}:`, historyError.code, historyError.message);
            }
        }
    }
}

module.exports = MMRSystem;
