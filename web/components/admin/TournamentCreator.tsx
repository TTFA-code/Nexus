'use client'

import { useRef, useState, useMemo } from 'react'
import { useFormStatus } from 'react-dom'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select"
import { Trophy, Calendar as CalendarIcon, Loader2, Rocket, FileText } from 'lucide-react'
import { createTournament } from '@/actions/createTournament'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'

interface GameMode {
    id: string
    name: string // Variant Name
    guild_id: string | null
    games: {
        name: string // Game Title
        slug: string
    }
}

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            disabled={pending}
            className="w-full h-14 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold tracking-widest text-lg font-orbitron transition-all border border-fuchsia-400/50 shadow-[0_0_20px_rgba(192,38,211,0.3)] hover:shadow-[0_0_30px_rgba(192,38,211,0.5)] skew-x-[-10deg] hover:skew-x-[-5deg]"
        >
            <div className="flex items-center gap-3 skew-x-[10deg] hover:skew-x-[5deg]">
                {pending ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        INITIALIZING UPLINK...
                    </>
                ) : (
                    <>
                        <Rocket className="h-5 w-5" />
                        DEPLOY OPERATION
                    </>
                )}
            </div>
        </Button>
    )
}

export function TournamentCreator({ gameModes, guildId, onCreated }: { gameModes: GameMode[], guildId: string, onCreated?: (lobby: any) => void }) {
    const formRef = useRef<HTMLFormElement>(null)
    const [selectedGame, setSelectedGame] = useState<string>("")

    // Group modes by Game Title
    const groupedModes = useMemo(() => {
        const groups: Record<string, GameMode[]> = {}

        gameModes.forEach(mode => {
            const gameName = mode.games?.name || "Unknown Protocol"
            if (!groups[gameName]) {
                groups[gameName] = []
            }
            groups[gameName].push(mode)
        })

        return groups
    }, [gameModes])

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
    }, [groupedModes])

    // Get variants for the selected game
    const currentVariants = useMemo(() => {
        return selectedGame ? groupedModes[selectedGame] : []
    }, [selectedGame, groupedModes])

    async function clientAction(formData: FormData) {
        const result = await createTournament(formData)
        if (result.success) {
            toast.success("OPERATION DEPLOYED", {
                description: result.message,
                className: "border-fuchsia-500 bg-black text-white"
            })
            formRef.current?.reset()
            setSelectedGame("") // Reset selection

            // Immediate UI Update
            if (onCreated && result.lobby) {
                onCreated(result.lobby)
            }
        } else {
            toast.error("DEPLOYMENT FAILED", {
                description: result.message
            })
        }
    }

    return (
        <Card className="bg-black/60 border-fuchsia-500/30 backdrop-blur-xl overflow-hidden relative group h-full flex flex-col shadow-2xl">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Trophy className="h-32 w-32 text-fuchsia-500" />
            </div>

            <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="flex items-center gap-3 text-fuchsia-400 font-orbitron tracking-widest text-xl">
                    <div className="p-2 bg-fuchsia-500/10 rounded border border-fuchsia-500/20">
                        <Trophy className="h-5 w-5" />
                    </div>
                    OFFICIAL TOURNAMENT
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pt-6">
                <form ref={formRef} action={clientAction} className="space-y-6 h-full flex flex-col">
                    <input type="hidden" name="guildId" value={guildId} />

                    {/* Section 1: Protocol Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-mono text-fuchsia-500/70 uppercase tracking-widest border-b border-fuchsia-500/10 pb-1">
                            <Rocket className="w-3 h-3" /> Mission Parameters
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs uppercase font-bold">Game Protocol</Label>
                                <Select onValueChange={setSelectedGame} value={selectedGame}>
                                    <SelectTrigger className="bg-black/40 border-fuchsia-500/20 text-white focus:ring-fuchsia-500/50 h-11">
                                        <SelectValue placeholder="Select Game" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-fuchsia-900 text-white">
                                        {(() => {
                                            const standardGames = gameNames.filter(name =>
                                                groupedModes[name].some(m => m.guild_id === null)
                                            );
                                            const customGames = gameNames.filter(name =>
                                                !groupedModes[name].some(m => m.guild_id === null)
                                            );

                                            return (
                                                <>
                                                    <SelectGroup>
                                                        <SelectLabel className="text-fuchsia-400 px-2 py-1.5 text-xs font-semibold">Standard Protocols</SelectLabel>
                                                        {standardGames.map((name) => (
                                                            <SelectItem key={name} value={name}>🌐 {name}</SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                    {customGames.length > 0 && (
                                                        <>
                                                            <SelectSeparator className="bg-white/10" />
                                                            <SelectGroup>
                                                                <SelectLabel className="text-cyan-400 px-2 py-1.5 text-xs font-semibold">Sector Customs</SelectLabel>
                                                                {customGames.map((name) => (
                                                                    <SelectItem key={name} value={name}>🏠 {name}</SelectItem>
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
                                <Label className="text-zinc-400 text-xs uppercase font-bold">Variant</Label>
                                <Select name="game_mode_id" required disabled={!selectedGame}>
                                    <SelectTrigger className="bg-black/40 border-fuchsia-500/20 text-white focus:ring-fuchsia-500/50 h-11">
                                        <SelectValue placeholder={selectedGame ? "Select Variant" : "Wait..."} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-fuchsia-900 text-white">
                                        {currentVariants.map((variant) => (
                                            <SelectItem key={variant.id} value={variant.id}>{variant.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Timing */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-mono text-fuchsia-500/70 uppercase tracking-widest border-b border-fuchsia-500/10 pb-1">
                            <CalendarIcon className="w-3 h-3" /> Timing & Logistics
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-400 text-xs uppercase font-bold">Scheduled Start (Optional)</Label>
                            <div className="relative">
                                <Input
                                    type="datetime-local"
                                    name="start_time"
                                    className="bg-black/40 border-fuchsia-500/20 pl-10 text-white h-11 calendar-picker-indicator:filter calendar-picker-indicator:invert focus:border-fuchsia-500 transition-colors"
                                />
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fuchsia-500" />
                            </div>
                            <p className="text-[10px] text-zinc-500">Leaving this blank launches in &quot;WAITING&quot; mode immediately.</p>
                        </div>
                    </div>

                    {/* Section 3: Briefing */}
                    <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-2 text-xs font-mono text-fuchsia-500/70 uppercase tracking-widest border-b border-fuchsia-500/10 pb-1">
                            <FileText className="w-3 h-3" /> Tactical Briefing
                        </div>
                        <div className="space-y-2 h-full">
                            <Label className="text-zinc-400 text-xs uppercase font-bold">Mission Directive</Label>
                            <Textarea
                                name="notes"
                                placeholder="Enter mission critical details, rules, or prize pool info..."
                                className="bg-black/40 border-fuchsia-500/20 text-white placeholder:text-zinc-600 min-h-[100px] focus:border-fuchsia-500 transition-colors resize-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 mt-auto">
                        <SubmitButton />
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
