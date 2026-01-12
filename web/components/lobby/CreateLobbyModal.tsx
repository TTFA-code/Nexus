'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2, Key, CheckCircle, Copy, Mic, Lock } from 'lucide-react';
import { createLobby } from '@/actions/matchActions';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
    SelectSeparator,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface GameMode {
    id: string
    name: string
    description?: string
    rules?: string
    guild_id: string | null
    games: {
        name: string
        slug: string
    }
}

export function CreateLobbyModal({ onLobbyCreated }: { onLobbyCreated?: (lobby: any) => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [gameModeId, setGameModeId] = useState('');
    const [selectedGame, setSelectedGame] = useState<string>("");
    const [availableModes, setAvailableModes] = useState<GameMode[]>([]);

    // New State Fields
    const [voiceRequired, setVoiceRequired] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [sectorKey, setSectorKey] = useState('');
    const [description, setDescription] = useState(''); // This acts as 'notes'
    const [scheduledStart, setScheduledStart] = useState('');

    // Success State
    const [createdLobby, setCreatedLobby] = useState<{ id: string, sectorKey?: string } | null>(null);

    // Fetch Game Modes
    useEffect(() => {
        if (open) {
            setLoading(true);
            fetch('/api/queue/status')
                .then(res => res.json())
                .then(data => {
                    if (data.game_modes) {
                        console.log("Modal Game Modes:", data.game_modes);
                        setAvailableModes(data.game_modes);
                    }
                })
                .catch(err => console.error("Failed to fetch modes", err))
                .finally(() => setLoading(false));
        }
    }, [open]);

    // Group modes by Game Name
    const groupedModes = useMemo(() => {
        const groups: Record<string, GameMode[]> = {};

        availableModes.forEach(mode => {
            const gameName = mode.games?.name || "Unknown Protocol";
            if (!groups[gameName]) {
                groups[gameName] = [];
            }
            groups[gameName].push(mode);
        });

        return groups;
    }, [availableModes]);

    // Get unique game names for the first dropdown
    const gameNames = useMemo(() => {
        return Object.keys(groupedModes).sort((a, b) => {
            // Priority: Standard (Global) > Custom
            const aIsStandard = groupedModes[a].some(m => m.guild_id === null);
            const bIsStandard = groupedModes[b].some(m => m.guild_id === null);

            if (aIsStandard && !bIsStandard) return -1;
            if (!aIsStandard && bIsStandard) return 1;
            return a.localeCompare(b);
        });
    }, [groupedModes]);

    // Get variants for the selected game
    const currentVariants = useMemo(() => {
        return selectedGame ? groupedModes[selectedGame] || [] : [];
    }, [selectedGame, groupedModes]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            // Import the action dynamically or assume it's imported at top level (I will add import via separate edit if needed, or assume I can't add imports with this tool easily in one go if I don't see top of file.
            // Wait, I need to add the import first or this will fail compilation.
            // But I can't see top of file here. 
            // I'll assume I need to do 2 steps or just use the tool capability to insert imports if I had access to top.
            // Since I am editing the function body, I will use `createLobby` variable. 
            // I will add the import in a previous or subsequent step? 
            // Better: I'll use multi_step to add import and update body. 

            // Actually, I'll update the body here and then immediately fix the import.
            const response = await createLobby({
                game_mode_id: gameModeId,
                notes: description,
                is_private: isPrivate,
                voice_required: voiceRequired,
                scheduled_start: scheduledStart || undefined,
                is_tournament: false,
                sector_key: isPrivate ? sectorKey : undefined
            });

            if (response.error) {
                console.error('Lobby creation failed:', response.error);
                toast.error(response.error);
                return;
            }

            const { lobby, lobbyId, sectorKey: returnedKey } = response as any; // Cast to any to avoid strict type issues if inference is slow, or fix inference.
            // Actually, better to let inference work if possible, but for speed 'as any' is safe here since we know the return.
            // But wait, I defined createLobby. It should infer.
            // Let's just do the fix for sectorKey type mismatch.
            console.log('Lobby Created:', lobby);

            // Optimistic Update
            if (onLobbyCreated && lobby) {
                onLobbyCreated(lobby);
            }

            // Show Success Screen
            setCreatedLobby({
                id: lobbyId,
                sectorKey: returnedKey || undefined
            });

        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error("Error submitting form");
        } finally {
            setLoading(false);
        }
    }

    function resetForm() {
        setOpen(false);
        setTimeout(() => {
            setCreatedLobby(null);
            setGameModeId('');
            setSelectedGame('');
            setDescription('');
            setScheduledStart('');
            setIsPrivate(false);
            setVoiceRequired(false);
            setSectorKey('');
        }, 300);
    }

    // Success View
    if (createdLobby) {
        return (
            <Dialog open={open} onOpenChange={(val) => !val && resetForm()}>
                <DialogContent className={`sm:max-w-[425px] bg-black/90 backdrop-blur-xl border ${createdLobby.sectorKey ? 'border-orange-500/30 shadow-[0_0_50px_rgba(249,115,22,0.2)]' : 'border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.2)]'} text-white`}>
                    <DialogHeader>
                        <DialogTitle className={`${createdLobby.sectorKey ? 'text-orange-500' : 'text-green-400'} flex items-center gap-2 font-orbitron tracking-widest`}>
                            <CheckCircle className="w-5 h-5" />
                            {createdLobby.sectorKey ? 'SECTOR SIGNAL ESTABLISHED' : 'DEPLOYMENT SUCCESSFUL'}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            {createdLobby.sectorKey ? "ENCRYPTED SIGNAL: PRIVATE ACCESS ONLY" : "BROADCASTING TO PUBLIC TACTICAL FEED"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-8 flex flex-col items-center justify-center space-y-6">
                        {createdLobby.sectorKey ? (
                            <div className="text-center w-full space-y-3">
                                <Label className="text-orange-500 uppercase tracking-widest text-[10px] font-bold">Secure Access Key</Label>
                                <div className="flex items-center gap-2 w-full">
                                    <div className="flex-1 bg-black border border-orange-500/30 p-4 rounded-lg flex items-center justify-center font-mono text-2xl font-bold text-orange-400 tracking-[0.2em]">
                                        {createdLobby.sectorKey}
                                    </div>
                                    <Button
                                        onClick={() => {
                                            navigator.clipboard.writeText(createdLobby.sectorKey!);
                                            toast.success("Sector Key copied");
                                        }}
                                        className="h-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/50 text-orange-500 font-bold uppercase tracking-wider"
                                    >
                                        <Copy className="w-4 h-4 mr-2" />
                                        COPY KEY
                                    </Button>
                                </div>
                                <p className="text-[10px] text-zinc-500 mt-2">
                                    Copy and transmit this key to authorized personnel only.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center p-6 bg-green-500/5 rounded-xl border border-green-500/20 w-full animate-pulse">
                                <p className="text-green-400 font-bold tracking-widest text-sm">PUBLIC BROADCAST ACTIVE</p>
                                <p className="text-xs text-zinc-500 mt-2">All available pilots can now see your signal.</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-col gap-3 sm:flex-col">
                        <Button
                            className={`w-full ${createdLobby.sectorKey ? 'bg-orange-500 hover:bg-orange-600 text-black' : 'bg-green-500 hover:bg-green-600 text-black'} font-bold h-12 tracking-widest font-orbitron shadow-lg`}
                            onClick={() => window.location.href = `/dashboard/play/lobby/${createdLobby.id}`}
                        >
                            SYNC TO SECTOR
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-zinc-500 hover:text-white hover:bg-white/5 tracking-widest text-xs uppercase"
                            onClick={resetForm}
                        >
                            RETURN TO ARENA
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#ccff00] hover:bg-[#b3e600] text-black font-bold h-12 rounded-full px-8 shadow-[0_0_20px_#ccff0030] border border-[#ccff00]/50 hover:scale-105 transition-transform">
                    <Plus className="w-5 h-5 mr-2" />
                    CREATE CUSTOM LOBBY
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-black/60 backdrop-blur-xl border-white/10 text-white shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-[#ccff00]">Initialize Lobby</DialogTitle>
                    <DialogDescription>
                        Configure operations parameters for your new lobby.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-6 py-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Game Protocol</Label>
                            <Select onValueChange={(val) => {
                                setSelectedGame(val);
                                setGameModeId(''); // Reset variant when game changes
                            }} value={selectedGame}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select Game" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0a0a0f] border-white/10 text-white">
                                    {(() => {
                                        // Filter games into Standard (has global variants) and Custom
                                        const standardGames = gameNames.filter(name =>
                                            groupedModes[name].some(m => m.guild_id === null)
                                        );
                                        const customGames = gameNames.filter(name =>
                                            !groupedModes[name].some(m => m.guild_id === null)
                                        );

                                        return (
                                            <>
                                                <SelectGroup>
                                                    <SelectLabel className="text-[#ffd700] px-2 py-1.5 text-xs font-semibold">Standard Protocols</SelectLabel>
                                                    {standardGames.map((name) => (
                                                        <SelectItem key={name} value={name}>
                                                            🌐 {name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>

                                                {customGames.length > 0 && (
                                                    <>
                                                        <SelectSeparator className="bg-white/10" />
                                                        <SelectGroup>
                                                            <SelectLabel className="text-cyan-400 px-2 py-1.5 text-xs font-semibold">Sector Customs</SelectLabel>
                                                            {customGames.map((name) => (
                                                                <SelectItem key={name} value={name}>
                                                                    🏠 {name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    </>
                                                )}
                                            </>
                                        )
                                    })()}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-400">Mode Variant</Label>
                            <Select onValueChange={setGameModeId} value={gameModeId} disabled={!selectedGame}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder={selectedGame ? "Select Variant" : "Wait for Game..."} />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0a0a0f] border-white/10 text-white">
                                    {currentVariants.map((variant) => (
                                        <SelectItem key={variant.id} value={variant.id.toString()}>
                                            {variant.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Game Mode Description */}
                    {gameModeId && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-zinc-300 font-mono">
                            <div className="text-[10px] uppercase text-[#ccff00] font-bold mb-1 tracking-widest">Protocol Details</div>
                            {(() => {
                                const m = availableModes.find(m => m.id.toString() === gameModeId);
                                return m?.description || m?.rules || "No tactical briefing available.";
                            })()}
                        </div>
                    )}

                    {/* Toggles Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Voice Chat Toggle */}
                        <button
                            type="button"
                            className={`flex flex-col gap-2 rounded-xl border p-4 transition-all duration-300 cursor-pointer group/toggle text-left ${voiceRequired ? 'bg-[#ccff00]/20 border-[#ccff00] shadow-[0_0_20px_rgba(204,255,0,0.2)]' : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30'}`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setVoiceRequired(prev => !prev);
                            }}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${voiceRequired ? 'bg-[#ccff00]/20 text-[#ccff00]' : 'bg-black/40 text-zinc-400 group-hover/toggle:text-white'}`}>
                                        <Mic className={`w-4 h-4 ${voiceRequired ? 'animate-pulse' : ''}`} />
                                    </div>
                                    <span className={`text-sm font-bold cursor-pointer pointer-events-none ${voiceRequired ? 'text-[#ccff00]' : 'text-zinc-300 group-hover/toggle:text-white'}`}>Voice Comms</span>
                                </div>
                                {/* Visual-only Switch */}
                                <div className={`h-6 w-11 shrink-0 rounded-full border-2 transition-colors duration-200 flex items-center ${voiceRequired ? 'bg-[#ccff00] border-transparent shadow-[0_0_10px_#ccff00]' : 'bg-black/60 border-zinc-700'}`}>
                                    <div className={`block h-5 w-5 rounded-full bg-black shadow-sm transition-transform duration-200 ${voiceRequired ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </div>
                            <p className={`text-[10px] uppercase tracking-wider font-medium pl-11 ${voiceRequired ? 'text-[#ccff00]/70' : 'text-zinc-500'}`}>
                                Mic Required
                            </p>
                        </button>

                        {/* Private Lobby Toggle */}
                        <button
                            type="button"
                            className={`flex flex-col gap-2 rounded-xl border p-4 transition-all duration-300 cursor-pointer group/toggle text-left ${isPrivate ? 'bg-[#ccff00]/20 border-[#ccff00] shadow-[0_0_20px_rgba(204,255,0,0.2)]' : 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30'}`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsPrivate(prev => {
                                    const newVal = !prev;
                                    if (newVal && !sectorKey) {
                                        const prefixes = ['ALPHA', 'NEON', 'DELTA', 'OMEGA'];
                                        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
                                        const randomNum = Math.floor(Math.random() * 90) + 10;
                                        setSectorKey(`${prefix}-${randomNum}`);
                                    }
                                    return newVal;
                                });
                            }}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${isPrivate ? 'bg-[#ccff00]/20 text-[#ccff00]' : 'bg-black/40 text-zinc-400 group-hover/toggle:text-white'}`}>
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <span className={`text-sm font-bold cursor-pointer pointer-events-none ${isPrivate ? 'text-[#ccff00]' : 'text-zinc-300 group-hover/toggle:text-white'}`}>Private Sector</span>
                                </div>
                                {/* Visual-only Switch */}
                                <div className={`h-6 w-11 shrink-0 rounded-full border-2 transition-colors duration-200 flex items-center ${isPrivate ? 'bg-[#ccff00] border-transparent shadow-[0_0_10px_#ccff00]' : 'bg-black/60 border-zinc-700'}`}>
                                    <div className={`block h-5 w-5 rounded-full bg-black shadow-sm transition-transform duration-200 ${isPrivate ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </div>
                            <p className={`text-[10px] uppercase tracking-wider font-medium pl-11 ${isPrivate ? 'text-[#ccff00]/70' : 'text-zinc-500'}`}>
                                Secure Entry
                            </p>
                        </button>
                    </div>

                    {/* Custom Sector Key Input */}
                    {isPrivate && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-[#ccff00] text-xs uppercase tracking-widest font-bold">Custom Sector Key</Label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ccff00]" />
                                <Input
                                    value={sectorKey}
                                    onChange={(e) => setSectorKey(e.target.value.toUpperCase().slice(0, 8))}
                                    className="bg-[#ccff00]/5 border-[#ccff00]/30 text-[#ccff00] pl-10 font-mono tracking-widest placeholder:text-[#ccff00]/20"
                                    placeholder="ENTER KEY (e.g. ALPHA1)"
                                />
                            </div>
                        </div>
                    )}

                    {/* Scheduled Start */}
                    <div className="grid gap-2">
                        <Label htmlFor="scheduled-start" className="text-zinc-400">Scheduled Deployment (Optional)</Label>
                        <Input
                            id="scheduled-start"
                            type="datetime-local"
                            value={scheduledStart}
                            onChange={(e) => setScheduledStart(e.target.value)}
                            className="bg-white/5 border-white/10 text-white calendar-picker-indicator:filter calendar-picker-indicator:invert"
                        />
                    </div>

                    {/* Description */}
                    <div className="grid gap-2">
                        <Label htmlFor="description" className="text-zinc-400">Mission Notes</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Gold+ Only, chill games"
                            className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading || !gameModeId} className="w-full bg-[#ccff00] text-black font-bold hover:bg-[#b3e600]">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            INITIALIZE LOBBY
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
