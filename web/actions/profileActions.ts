'use server';

import { createClient } from '@/utils/supabase/server';

export interface ProfileStats {
    totalMatches: number;
    wins: number;
    winRate: number;
    reputation: string;
}

export interface MatchHistoryItem {
    id: string;
    gameName: string;
    modeName: string;
    result: 'Victory' | 'Defeat' | 'Draw';
    timeAgo: string;
    finishedAt: string;
}

export async function getUserProfileData(userId: string) {
    const supabase = await createClient();

    try {
        // 1. Fetch Match History
        // We need matches where this user played.
        const { data: matchHistoryData, error: historyError } = await supabase
            .from('match_players')
            .select(`
                team,
                matches!inner (
                    id,
                    winner_team,
                    finished_at,
                    status,
                    game_modes!fk_game_mode (
                        name,
                        games (
                            name
                        )
                    )
                )
            `)
            .eq('user_id', userId)
            .eq('matches.status', 'finished')
            .order('matches(finished_at)', { ascending: false });
        // Note: ordering on joined table might start being tricky in Supabase logic, 
        // usually we sort the parent or use a dedicated RPC/View if complex. 
        // For now, let's try the simple join sort or sort in JS if needed. 
        // Actually, Supabase supports ordering by joined column: .order('finished_at', { foreignTable: 'matches', ascending: false })

        if (historyError) {
            console.error('Error fetching match history:', historyError);
            // Fallback to empty if error
            return { stats: null, history: [] };
        }

        // 2. Process Data for Stats & History
        let wins = 0;
        let draws = 0;
        const totalMatches = matchHistoryData.length;

        const history: MatchHistoryItem[] = matchHistoryData.map((record: any) => {
            const match = record.matches;
            const playerTeam = record.team;
            const winnerTeam = match.winner_team;

            let result: 'Victory' | 'Defeat' | 'Draw' = 'Draw';

            // Normalize winnerTeam (handle potential null or string)
            const wTeam = Number(winnerTeam);

            if (wTeam === 0) {
                result = 'Draw';
                draws++;
            } else if (wTeam === playerTeam) {
                result = 'Victory';
                wins++;
            } else {
                result = 'Defeat';
            }

            const gameName = match.game_modes?.games?.name || 'Unknown Game';
            const modeName = match.game_modes?.name || 'Unknown Mode';

            // Calculate time ago
            const finishedAt = new Date(match.finished_at);
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - finishedAt.getTime()) / 1000);

            let timeAgo = '';
            if (diffInSeconds < 60) timeAgo = 'Just now';
            else if (diffInSeconds < 3600) timeAgo = `${Math.floor(diffInSeconds / 60)}m ago`;
            else if (diffInSeconds < 86400) timeAgo = `${Math.floor(diffInSeconds / 3600)}h ago`;
            else timeAgo = `${Math.floor(diffInSeconds / 86400)}d ago`;

            return {
                id: match.id,
                gameName,
                modeName,
                result,
                timeAgo,
                finishedAt: match.finished_at
            };
        });

        // Sort JS side to be safe/consistent since nested ordering can be finicky
        history.sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime());

        // 3. Calculate Win Rate
        const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100) : 0;

        const stats: ProfileStats = {
            totalMatches,
            wins,
            winRate: parseFloat(winRate.toFixed(1)),
            reputation: 'Exemplary' // Placeholder logic
        };

        return { stats, history };

    } catch (error) {
        console.error('Profile Data Error:', error);
        return { stats: null, history: [] };
    }
}
