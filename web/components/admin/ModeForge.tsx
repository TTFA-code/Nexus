'use client'

import { useState } from 'react'
import { createGameMode, deleteGameMode } from '@/actions/createGameMode'
import { Rocket, Trash2, Lock, Plus, Gamepad2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface GameMode {
    id: string
    name: string
    guild_id: string | null
    games?: {
        name: string
    }
}

interface ModeForgeProps {
    globalModes: GameMode[]
    customModes: GameMode[]
    guildId: string
}

interface GroupedMode {
    gameName: string
    variants: {
        id: string
        name: string // Variant Name
        fullMode: GameMode
    }[]
}

function groupModes(modes: GameMode[]): GroupedMode[] {
    const groups: Record<string, GroupedMode> = {}

    modes.forEach(mode => {
        // Use joined game name or fallback
        const gameName = mode.games?.name || "Unknown Protocol"

        if (!groups[gameName]) {
            groups[gameName] = { gameName, variants: [] }
        }
        groups[gameName].variants.push({ id: mode.id, name: mode.name, fullMode: mode })
    })

    return Object.values(groups).sort((a, b) => a.gameName.localeCompare(b.gameName))
}

export function ModeForge({ globalModes = [], customModes = [], guildId }: ModeForgeProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    const groupedGlobal = groupModes(globalModes)
    const groupedCustom = groupModes(customModes)

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-orbitron tracking-widest text-zinc-100 flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-cyan-400" />
                    PROTOCOL REGISTRY
                </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">

                {/* SECTION 1: NEXUS STANDARD (GLOBAL) */}
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    <h3 className="text-xs font-mono text-cyan-500/80 uppercase tracking-widest pl-1 border-b border-cyan-500/20 pb-1 sticky top-0 bg-zinc-950/80 backdrop-blur z-10">
                        Nexus Standard // Global
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        {groupedGlobal.map((group) => (
                            <div key={group.gameName} className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg p-3 relative group overflow-hidden">
                                <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none" />
                                <div className="flex flex-col gap-2 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Gamepad2 className="w-4 h-4 text-cyan-400" />
                                            <span className="font-orbitron text-sm text-zinc-100">{group.gameName}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-cyan-600 bg-cyan-900/20 px-1.5 py-0.5 rounded">
                                            {group.variants.length} VARIANTS
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {group.variants.map((variant) => (
                                            <Badge key={variant.id} variant="outline" className="border-cyan-500/20 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/10 transition-colors gap-1 pr-2">
                                                {variant.name}
                                                <Lock className="w-3 h-3 text-cyan-600" />
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {groupedGlobal.length === 0 && (
                            <div className="text-zinc-600 font-mono text-xs italic p-2">No global protocols active.</div>
                        )}
                    </div>
                </div>

                {/* SECTION 2: SECTOR CUSTOM (LOCAL) */}
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex items-center justify-between pl-1 border-b border-purple-500/20 pb-1 sticky top-0 bg-zinc-950/80 backdrop-blur z-10">
                        <h3 className="text-xs font-mono text-purple-500/80 uppercase tracking-widest">
                            Sector Custom // Local
                        </h3>
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px] font-mono border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300">
                                    <Plus className="w-3 h-3 mr-1" />
                                    CREATE
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 font-mono">
                                <DialogHeader>
                                    <DialogTitle className="font-orbitron tracking-widest text-purple-400">INITIATE NEW PROTOCOL</DialogTitle>
                                </DialogHeader>
                                <form action={async (formData) => {
                                    await createGameMode(formData)
                                    setIsCreateOpen(false)
                                }} className="space-y-4 pt-4">
                                    <input type="hidden" name="guildId" value={guildId} />

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase text-zinc-500">Target Game ID (Temp)</Label>
                                        <Input
                                            name="game_id"
                                            placeholder="UUID of the parent game"
                                            className="bg-black/50 border-zinc-800 focus:border-purple-500/50 text-white"
                                            required
                                        />
                                        <p className="text-[10px] text-zinc-600">Temporary: Use ID from database (e.g. LoL UUID)</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase text-zinc-500">Variant Name</Label>
                                        <Input
                                            name="name"
                                            placeholder="e.g. 1v1 Mid Only"
                                            className="bg-black/50 border-zinc-800 focus:border-purple-500/50 text-white"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase text-zinc-500">Team Size</Label>
                                        <Input
                                            name="team_size"
                                            type="number"
                                            defaultValue={5}
                                            className="bg-black/50 border-zinc-800 focus:border-purple-500/50 text-white"
                                        />
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs">
                                            ESTABLISH PROTOCOL
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {groupedCustom.map((group) => (
                            <div key={group.gameName} className="bg-black/40 backdrop-blur-md border border-purple-500/30 rounded-lg p-3 relative group overflow-hidden">
                                <div className="absolute inset-0 bg-purple-500/5 pointer-events-none" />
                                <div className="flex flex-col gap-2 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Gamepad2 className="w-4 h-4 text-purple-400" />
                                            <span className="font-orbitron text-sm text-zinc-100">{group.gameName}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-purple-400 bg-purple-900/20 px-1.5 py-0.5 rounded">
                                            {group.variants.length} VARIANTS
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {group.variants.map((variant) => (
                                            <div key={variant.id} className="relative group/badge">
                                                <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20 transition-colors pr-7 relative">
                                                    {variant.name}
                                                </Badge>
                                                <form action={async (formData) => {
                                                    await deleteGameMode(formData)
                                                }} className="absolute right-1 top-1/2 -translate-y-1/2 z-20">
                                                    <input type="hidden" name="modeId" value={variant.id.toString()} />
                                                    <input type="hidden" name="guildId" value={guildId} />
                                                    <button type="submit" className="text-purple-400/50 hover:text-red-400 transition-colors flex items-center justify-center">
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </form>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {groupedCustom.length === 0 && (
                            <div className="text-zinc-600 font-mono text-xs italic p-2">No custom sectoral protocols established.</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
