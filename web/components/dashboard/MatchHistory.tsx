import React from 'react';
import { Swords, Trophy, XCircle } from 'lucide-react';
import { FrostedCard } from '@/components/ui/FrostedCard';
import { cn } from '@/lib/utils';

export function MatchHistory() {
    // Mock Data
    const matches = [
        { id: 1, opponent: "Team Echo", result: "WIN", score: "3 - 1", map: "Ascent", date: "2h ago", mmr: "+24" },
        { id: 2, opponent: "Vortex Gaming", result: "LOSS", score: "0 - 3", map: "Haven", date: "5h ago", mmr: "-18" },
        { id: 3, opponent: "NullSector", result: "WIN", score: "3 - 2", map: "Split", date: "1d ago", mmr: "+21" },
        { id: 4, opponent: "ShadowCorp", result: "WIN", score: "3 - 0", map: "Bind", date: "2d ago", mmr: "+25" },
    ];

    return (
        <FrostedCard className="p-0 h-full">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-heading font-bold text-xl flex items-center gap-2">
                    <Swords className="w-5 h-5 text-cyber-cyan" />
                    Recent Operations
                </h3>
                <button className="text-xs text-zinc-400 hover:text-white transition-colors uppercase tracking-widest font-bold">
                    View All
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-zinc-400 font-mono text-xs uppercase">
                        <tr>
                            <th className="p-4 font-normal">Result</th>
                            <th className="p-4 font-normal">Opponent</th>
                            <th className="p-4 font-normal">Map</th>
                            <th className="p-4 font-normal text-right">MMR</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {matches.map((match) => (
                            <tr key={match.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                                <td className="p-4">
                                    <div className={cn(
                                        "inline-flex items-center gap-2 font-bold",
                                        match.result === "WIN" ? "text-cyber-cyan" : "text-cyber-pink"
                                    )}>
                                        {match.result === "WIN" ? <Trophy size={14} /> : <XCircle size={14} />}
                                        {match.result}
                                    </div>
                                    <div className="text-zinc-500 text-xs font-mono mt-0.5">{match.score}</div>
                                </td>
                                <td className="p-4 font-medium text-white group-hover:text-cyber-cyan transition-colors">
                                    {match.opponent}
                                    <div className="text-zinc-500 text-xs font-normal mt-0.5">{match.date}</div>
                                </td>
                                <td className="p-4 text-zinc-300">
                                    {match.map}
                                </td>
                                <td className={cn("p-4 text-right font-mono font-bold", match.result === "WIN" ? "text-cyber-cyan" : "text-cyber-pink")}>
                                    {match.mmr}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </FrostedCard>
    );
}
