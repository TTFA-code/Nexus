'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Trophy, FileText, Medal, User, Swords, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useParams } from 'next/navigation';
import { SharedSectors } from '@/components/profile/SharedSectors';
import { RecentSquad } from '@/components/profile/RecentSquad';
import { getUserProfileData, ProfileStats, MatchHistoryItem } from '@/actions/profileActions';

export default function ProfilePage() {
    const params = useParams();
    const usernameParam = params.username as string; // 'me' or specific ID/Username

    const [user, setUser] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ProfileStats | null>(null);
    const [history, setHistory] = useState<MatchHistoryItem[]>([]);
    const supabase = createClient();

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);

            // 1. Get Current Session
            const { data: { user: sessionUser } } = await supabase.auth.getUser();
            setCurrentUser(sessionUser);

            let targetUserId = null;

            // 2. Determine who to show
            if (usernameParam === 'me' && sessionUser) {
                setUser(sessionUser);
                targetUserId = sessionUser.id;
            } else if (usernameParam !== 'me') {
                // TODO: Fetch specific user by username/ID from public profiles table
                // For now, if it's not 'me', we'll simulate a "Public Profile" fetch
                // In a real app complexity: discord_id vs uuid vs username lookup

                // Simulation for demonstration:
                setUser({
                    id: usernameParam, // Use parameter as ID for fetching sectors
                    user_metadata: {
                        full_name: `Agent ${usernameParam.substring(0, 6)}`,
                        avatar_url: null
                    }
                });
                targetUserId = usernameParam; // Assuming param is ID for now
            }

            // 3. Fetch Stats & History
            if (targetUserId) {
                const { stats: fetchedStats, history: fetchedHistory } = await getUserProfileData(targetUserId);
                setStats(fetchedStats);
                setHistory(fetchedHistory);
            }

            setLoading(false);
        };

        loadProfile();
    }, [usernameParam]);

    if (loading) {
        return <div className="p-8 text-center text-zinc-500 animate-pulse font-mono tracking-widest">INITIALIZING DATA LINK...</div>;
    }

    if (!user) {
        return <div className="p-8 text-center text-red-500 font-bold border border-red-900/50 bg-red-900/10 rounded-xl m-8">IDENTITY NOT FOUND</div>;
    }

    const isOwnProfile = currentUser?.id === user.id || usernameParam === 'me';
    const displayName = user.user_metadata?.full_name || user.user_metadata?.name || 'Unknown Agent';
    const avatarUrl = user.user_metadata?.avatar_url;
    // Pass the correct ID for Shared Sectors (use 'me' if own profile to ensure backend can resolve it efficiently, or pass UUID)
    const sectorsUserId = isOwnProfile ? 'me' : user.id;

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header / Dossier Glass Card */}
            <div className="relative rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 p-8 overflow-hidden shadow-2xl">

                <div className="relative z-10 flex flex-col md:flex-row gap-8">
                    {/* Left Column: Avatar & Actions */}
                    <div className="flex flex-col items-center gap-6">
                        <div className="h-40 w-40 rounded-full p-1 border-2 border-white/10 bg-black relative group">
                            <Avatar className="h-full w-full">
                                <AvatarImage src={avatarUrl} alt={displayName} />
                                <AvatarFallback className="bg-zinc-900 text-zinc-500 text-4xl">
                                    <User className="w-16 h-16" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 rounded-full border border-white/5 group-hover:border-[#ccff00]/30 transition-colors pointer-events-none" />
                        </div>

                        {/* Actions */}
                        <div className="w-full">
                            {isOwnProfile ? (
                                <Button variant="outline" className="w-full border-white/10 hover:bg-white/10 text-zinc-300 font-mono text-xs">
                                    <Edit className="w-4 h-4 mr-2" />
                                    EDIT DATA
                                </Button>
                            ) : (
                                <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold shadow-[0_0_20px_#ef444440] clip-path-polygon cursor-pointer">
                                    <Swords className="w-4 h-4 mr-2" />
                                    CHALLENGE
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Middle Column: Identity & Shared Bridge */}
                    <div className="flex-1 flex flex-col justify-between min-h-[160px]">
                        <div>
                            <div className="text-sm font-mono text-[#ccff00] mb-2 tracking-[0.2em] uppercase">
                                {isOwnProfile ? 'System Identity' : 'Target Identified'}
                            </div>
                            <h1 className="text-5xl font-black text-white mb-4 tracking-tight font-display">{displayName}</h1>

                            {/* Achievement / Title Slot */}
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
                                <Trophy className="w-3 h-3 text-yellow-500" />
                                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Apex Champion 2024</span>
                            </div>
                        </div>

                        {/* Shared Sectors Bridge */}
                        <SharedSectors userId={sectorsUserId} />
                    </div>
                </div>

                {/* Bottom Row: Recent Squad */}
                <RecentSquad />

                {/* BG Deco */}
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
            </div>

            {/* Grid Layout: Trophy Case & History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Trophy Case */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-black/20 backdrop-blur-xl border-white/10 text-white shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-zinc-400">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                Achievements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                    <div key={i} className="aspect-square rounded-lg bg-black/40 border border-white/5 flex items-center justify-center group hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden">
                                        <Medal className="w-5 h-5 text-zinc-800 group-hover:text-yellow-500/50 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="bg-black/20 backdrop-blur-xl border-white/10 text-white shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-zinc-400">
                                <FileText className="w-4 h-4 text-blue-400" />
                                Service Record
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-zinc-500 text-sm">Matches</span>
                                <span className="font-mono font-bold">{stats?.totalMatches || 0}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-zinc-500 text-sm">Win Rate</span>
                                <span className="font-mono font-bold text-white">{stats?.winRate || 0}%</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-zinc-500 text-sm">Reputation</span>
                                <span className="font-mono font-bold text-[#ccff00]">{stats?.reputation || 'Neutral'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Match History */}
                <div className="lg:col-span-2">
                    <Card className="h-full bg-black/20 backdrop-blur-xl border-white/10 text-white shadow-lg">
                        <CardHeader>
                            <CardTitle className="font-mono text-sm uppercase tracking-widest text-zinc-400">Recent Deployments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10 hover:bg-white/5">
                                        <TableHead className="text-zinc-500 font-mono text-xs uppercase">Operation</TableHead>
                                        <TableHead className="text-zinc-500 font-mono text-xs uppercase">Protocol</TableHead>
                                        <TableHead className="text-zinc-500 font-mono text-xs uppercase">Result</TableHead>
                                        <TableHead className="text-zinc-500 font-mono text-xs uppercase text-right">Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.length > 0 ? (
                                        history.map((match) => (
                                            <TableRow key={match.id} className="border-white/10 hover:bg-white/5 transition-colors cursor-pointer group">
                                                <TableCell className="font-mono text-xs text-zinc-400 group-hover:text-white">#{match.id.substring(0, 8)}</TableCell>
                                                <TableCell className="font-medium">
                                                    <div>{match.gameName}</div>
                                                    <div className="text-xs text-zinc-500">{match.modeName}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${match.result === 'Victory' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                            match.result === 'Defeat' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                                        }`}>
                                                        {match.result}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right text-zinc-500 text-xs font-mono">{match.timeAgo}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-zinc-500 font-mono">
                                                NO DEPLOYMENT DATA FOUND
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

