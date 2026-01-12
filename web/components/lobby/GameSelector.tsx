'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Gamepad2, Users, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the type for GameMode
type GameMode = {
    id: number;
    name: string;
    team_size: number;
    picking_method: string;
};

interface GameSelectorProps {
    onSelect: (gameMode: GameMode) => void;
    selectedId?: number;
}

export function GameSelector({ onSelect, selectedId }: GameSelectorProps) {
    const [gameModes, setGameModes] = useState<GameMode[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchModes() {
            const { data } = await supabase.from('game_modes').select('*, games(name)').eq('is_active', true);
            if (data) setGameModes(data);
            setLoading(false);
        }
        fetchModes();
    }, []);

    if (loading) return <div className="text-zinc-500 animate-pulse">Loading Game Modes...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {gameModes.map((mode: any) => (
                <button
                    key={mode.id}
                    onClick={() => onSelect(mode)}
                    className={cn(
                        "flex flex-col items-start p-6 rounded-2xl border transition-all duration-200 group relative overflow-hidden",
                        selectedId === mode.id
                            ? "bg-white/10 border-[#ccff00] text-white"
                            : "bg-black/40 border-white/10 text-zinc-400 hover:bg-white/5 hover:border-white/20"
                    )}
                >
                    <div className="mb-4 p-3 rounded-full bg-white/5 group-hover:bg-[#ccff00]/20 transition-colors">
                        <Gamepad2 className={cn("w-6 h-6", selectedId === mode.id ? "text-[#ccff00]" : "text-zinc-400 group-hover:text-[#ccff00]")} />
                    </div>

                    <h3 className="font-bold text-lg mb-1">{mode.games?.name}</h3>
                    <div className="text-sm font-medium text-zinc-500 mb-1">{mode.name}</div>

                    <div className="flex items-center gap-4 text-xs font-mono mt-2 opacity-80">
                        <div className="flex items-center gap-1">
                            <Users size={12} />
                            <span>{mode.team_size}v{mode.team_size}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Trophy size={12} />
                            <span>{mode.picking_method}</span>
                        </div>
                    </div>

                    {selectedId === mode.id && (
                        <div className="absolute inset-0 border-2 border-[#ccff00] rounded-2xl pointer-events-none shadow-[0_0_20px_rgba(204,255,0,0.2)]" />
                    )}
                </button>
            ))}
        </div>
    );
}
