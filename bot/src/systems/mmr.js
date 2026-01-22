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
        // 1. Fetch Match Data with Players and Ratings
        const { data: match, error } = await this.supabase
            .from('matches')
            .select(`
                *,
                game_modes(*),
                match_players(
                    team, 
                    user_id, 
                    player_ratings(mmr, wins, losses, win_streak)
                )
            `)
            .eq('id', matchId)
            .single();

        if (error || !match) {
            console.error('Error fetching match for Elo sizing:', error);
            return;
        }

        // 2. Separate Teams
        const team1 = match.match_players.filter(p => p.team === 1);
        const team2 = match.match_players.filter(p => p.team === 2);

        // 3. Calculate Team Average MMR
        const getAvg = (team) => {
            const sum = team.reduce((acc, p) => {
                // Handle cases where player has no rating entry yet (default 1200)
                const rating = p.player_ratings?.[0]?.mmr || 1200;
                return acc + rating;
            }, 0);
            return sum / team.length;
        };

        const team1Avg = getAvg(team1);
        const team2Avg = getAvg(team2);

        console.log(`Processing Match #${match.id} | T1 Avg: ${team1Avg} | T2 Avg: ${team2Avg}`);

        // 4. Update Each Player
        for (const player of match.match_players) {
            const isWinner = player.team === match.winner_team;
            const actualScore = isWinner ? 1 : 0;
            const opponentAvg = player.team === 1 ? team2Avg : team1Avg;

            // Default stats if new
            const currentStats = player.player_ratings?.[0] || { mmr: 1200, wins: 0, losses: 0, win_streak: 0 };

            // Calculate Change
            const eloChange = this.calculateEloChange(currentStats.mmr, opponentAvg, actualScore);
            const newMmr = currentStats.mmr + eloChange;

            // Prepare Update Data
            const updates = {
                mmr: newMmr,
                wins: isWinner ? currentStats.wins + 1 : currentStats.wins,
                losses: !isWinner ? currentStats.losses + 1 : currentStats.losses,
                win_streak: isWinner ? currentStats.win_streak + 1 : 0
            };

            // Upsert Rating
            await this.supabase
                .from('player_ratings')
                .upsert({
                    user_id: player.user_id,
                    game_mode_id: match.game_mode_id,
                    ...updates
                }, { onConflict: 'user_id, game_mode_id' }); // Composite key

            // 5. Bounty Logic
            // If winner ended a streak of > 3, give bonus?
            // For now, simplicity: just log it.
        }

        // 6. Announce Results via Announcer (Update the 'Mission Complete' embed with Elo changes?)
        // Ideally we pass the changes to the announcer.
    }
}

module.exports = MMRSystem;
