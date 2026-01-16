"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"

interface Game {
    id: string
    name: string
}

interface GameFilterProps {
    games: Game[]
}

export function GameFilter({ games }: GameFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentGame = searchParams.get("game") || "all"

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value === "all") {
            params.delete("game")
        } else {
            params.set("game", value)
        }
        router.push(`/leaderboard?${params.toString()}`)
    }

    return (
        <Select value={currentGame} onValueChange={handleValueChange}>
            <SelectTrigger className="w-[200px] border-white/10 bg-black/40 text-zinc-100 focus:ring-cyan-500/50">
                <SelectValue placeholder="Filter by Game" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-black/90 backdrop-blur-xl text-zinc-100">
                <SelectItem value="all" className="focus:bg-cyan-900/20 focus:text-cyan-400">All Games</SelectItem>
                {games.map((game) => (
                    <SelectItem key={game.id} value={game.id} className="focus:bg-cyan-900/20 focus:text-cyan-400">
                        {game.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
