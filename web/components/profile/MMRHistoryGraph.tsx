'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from 'react';

interface MMRHistoryGraphProps {
    data: { date: string; mmr: number; change: number; gameName: string }[];
}

export function MMRHistoryGraph({ data }: MMRHistoryGraphProps) {
    // 1. Extract Unique Games
    const uniqueGames = useMemo(() => {
        if (!data) return [];
        const games = new Set(data.map(d => d.gameName));
        return Array.from(games);
    }, [data]);

    // 2. State for Selected Game
    // Default to the most recent game played (last item in data) or the first in list
    const [selectedGame, setSelectedGame] = useState<string>(() => {
        if (!data || data.length === 0) return '';
        // Most recent is likely last in array (sorted by date)
        return data[data.length - 1].gameName;
    });

    // 3. Filter Data
    const filteredData = useMemo(() => {
        if (!data) return [];
        return data.filter(d => d.gameName === selectedGame);
    }, [data, selectedGame]);

    if (!data || data.length < 2) {
        return null;
    }

    // Format Data for Graph
    const chartData = filteredData.map((d, i) => ({
        ...d,
        index: i + 1,
        formattedDate: new Date(d.date).toLocaleDateString()
    }));

    if (filteredData.length < 2 && uniqueGames.length > 0) {
        // Show something even if only 1 match for this specific game?
        // Or maybe show empty state. For now let's just render what we can.
        // If 1 point, AreaChart might look weird but works.
    }

    const minMMR = chartData.length > 0 ? Math.min(...chartData.map(d => d.mmr)) : 0;
    const maxMMR = chartData.length > 0 ? Math.max(...chartData.map(d => d.mmr)) : 1000;
    const padding = 50;

    return (
        <Card className="bg-black/20 backdrop-blur-xl border-white/10 text-white shadow-lg col-span-1 lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-zinc-400">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Performance Trajectory
                </CardTitle>

                {/* Game Selector */}
                {uniqueGames.length > 0 && (
                    <Select value={selectedGame} onValueChange={setSelectedGame}>
                        <SelectTrigger className="w-[180px] bg-zinc-900/50 border-zinc-700 text-zinc-300 h-8 text-xs font-mono">
                            <SelectValue placeholder="Select Game" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-300">
                            {uniqueGames.map(game => (
                                <SelectItem key={game} value={game} className="focus:bg-zinc-800 focus:text-white cursor-pointer font-mono text-xs">
                                    {game}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full mt-4">
                    {filteredData.length > 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorMmr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="index"
                                    stroke="#52525b"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 10, fill: '#71717a' }}
                                    tickFormatter={(val) => `${val}`}
                                />
                                <YAxis
                                    domain={[minMMR - padding, maxMMR + padding]}
                                    stroke="#52525b"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 10, fill: '#71717a' }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff' }}
                                    itemStyle={{ color: '#60a5fa' }}
                                    labelStyle={{ display: 'none' }}
                                    formatter={(value: number) => [`${value} MMR`, 'Rating']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="mmr"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorMmr)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-zinc-500 font-mono text-sm">
                            Not enough data to display graph for {selectedGame}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
