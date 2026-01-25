'use server';

import { createClient } from '@/utils/supabase/server';

export interface ProfileStats {
    totalMatches: number;
    wins: number;
    winRate: number;
    reputation: string;
    mmrList?: { gameName: string; value: number }[];
    mmrTrend?: { date: string; mmr: number; change: number; gameName: string }[];
}

export interface MatchHistoryItem {
    id: string;
    gameName: string;
    modeName: string;
    result: 'Victory' | 'Defeat' | 'Draw';
    timeAgo: string;
    finishedAt: string;
}

export async function getUserProfileData(userUuid: string) {
    const supabase = await createClient();

    try {
        // 0. Resolve Discord ID from UUID (required for Match History link)
        const { data: playerRecord, error: playerError } = await supabase
            .from('players')
            .select('user_id, username')
            .eq('uuid_link', userUuid)
            .single();

        if (playerError || !playerRecord) {
            console.error("Profile Error: Could not resolve player from UUID", userUuid);
            return { stats: null, history: [] };
        }

        const discordId = playerRecord.user_id;

        // 1. Fetch Match History (Uses Discord ID)
        const { data: matchHistoryData, error: historyError } = await supabase
            .from('match_players')
            .select(`
                team,
                matches!inner (
                    id,
                    winner_team,
                    finished_at,
                    status,
                    game_modes (
                        name,
                        games (
                            name
                        )
                    )
                )
            `)
            .eq('user_id', discordId)
            .eq('matches.status', 'finished')
            .order('matches(finished_at)', { ascending: false });

        if (historyError) {
            console.error('Error fetching match history:', historyError);
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

        history.sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime());

        // 3. Calculate Win Rate
        const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100) : 0;

        // 4. Fetch MMRs (Uses UUID)
        const { data: mmrData } = await supabase
            .from('player_mmr')
            .select(`
                mmr,
                game_id,
                games (
                    name
                )
            `)
            .eq('user_id', userUuid);

        // Map to a cleaner structure
        const mmrs = (mmrData as any[])?.map((m: any) => ({
            gameName: m.games?.name || 'Unknown Game',
            value: m.mmr
        })) || [];


        // 5. Fetch MMR History trend (Uses UUID or Discord ID? Schema says player_uuid NOT NULL. 
        // Need to check how 'submit_match_report' inserts it.
        // It inserts p_record.uuid_link::uuid. So it uses UUID!
        const { data: rawTrendData } = await supabase
            .from('mmr_history')
            .select('new_mmr, created_at, match_id, change')
            .eq('player_uuid', userUuid)
            .order('created_at', { ascending: true });

        // Enrich with Game Names manually to avoid deep join issues
        let mmrHistoryGraph: { date: string; mmr: number; change: number; gameName: string }[] = [];
        if (rawTrendData && rawTrendData.length > 0) {
            const matchIds = rawTrendData.map(t => t.match_id).filter((id): id is string => !!id); // filter nulls and ensure string type

            // Fetch game info for these matches
            const { data: matchGameData } = await supabase
                .from('matches')
                .select(`
                    id, 
                    game_modes (
                        games (
                            name
                        )
                    )
                `)
                .in('id', matchIds);

            // Create a lookup map
            const matchGameMap = new Map();
            matchGameData?.forEach((m: any) => {
                matchGameMap.set(m.id, m.game_modes?.games?.name || 'Unknown Game');
            });

            mmrHistoryGraph = rawTrendData.map(t => ({
                date: t.created_at || new Date().toISOString(),
                mmr: t.new_mmr ?? 0,
                change: t.change ?? 0,
                gameName: matchGameMap.get(t.match_id) || 'Unknown Game'
            }));
        }

        const stats: ProfileStats = {
            totalMatches,
            wins,
            winRate: parseFloat(winRate.toFixed(1)),
            reputation: 'Exemplary', // Placeholder logic
            mmrList: mmrs,
            mmrTrend: mmrHistoryGraph
        };

        return { stats, history };

    } catch (error) {
        console.error('Profile Data Error:', error);
        return { stats: null, history: [] };
    }
}
