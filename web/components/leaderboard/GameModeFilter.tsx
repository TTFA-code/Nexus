"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"

interface GameMode {
    id: number
    name: string
}

interface GameModeFilterProps {
    modes: GameMode[]
}

export function GameModeFilter({ modes }: GameModeFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentMode = searchParams.get("mode") || "all"

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value === "all") {
            params.delete("mode")
        } else {
            params.set("mode", value)
        }
        router.push(`/leaderboard?${params.toString()}`)
    }

    return (
        <Select value={currentMode} onValueChange={handleValueChange}>
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Game Mode" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                {modes.map((mode) => (
                    <SelectItem key={mode.id} value={mode.id.toString()}>
                        {mode.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
