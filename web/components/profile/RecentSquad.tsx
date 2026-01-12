
"use client"

import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Button } from "@/components/ui/button"

const MOCK_SQUAD = [
    { username: "Viper", rank: 42, avatar: "https://github.com/shadcn.png" },
    { username: "Ghost", rank: 15, avatar: "https://avatar.vercel.sh/ghost" },
    { username: "Spectre", rank: 8, avatar: "https://avatar.vercel.sh/spectre" },
    { username: "Phantom", rank: 156, avatar: "https://avatar.vercel.sh/phantom" },
    { username: "Wraith", rank: 3, avatar: "https://avatar.vercel.sh/wraith" },
]

export function RecentSquad() {
    return (
        <div className="w-full pt-6 border-t border-white/10">
            <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-4">Recent Squad</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {MOCK_SQUAD.map((op) => (
                    <HoverCard key={op.username}>
                        <HoverCardTrigger asChild>
                            <div className="cursor-pointer group relative">
                                <Avatar className="h-10 w-10 border border-white/10 transition-all duration-300 group-hover:scale-110 group-hover:border-[#ccff00]/50 group-hover:shadow-[0_0_15px_rgba(204,255,0,0.3)]">
                                    <AvatarImage src={op.avatar} alt={op.username} />
                                    <AvatarFallback className="text-[10px] bg-zinc-900 text-zinc-400">{op.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                {/* Status Indicator Dot */}
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-black" />
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64 backdrop-blur-xl bg-black/80 border-white/10 text-white shadow-2xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <Avatar className="h-10 w-10 border border-white/10">
                                    <AvatarImage src={op.avatar} />
                                    <AvatarFallback>{op.username[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="text-sm font-bold text-white">@{op.username}</h4>
                                    <div className="text-xs text-[#ccff00]">Online</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="bg-white/5 rounded p-2 text-center">
                                    <div className="text-[10px] text-zinc-500 uppercase">Rank</div>
                                    <div className="font-mono font-bold">#{op.rank}</div>
                                </div>
                                <div className="bg-white/5 rounded p-2 text-center">
                                    <div className="text-[10px] text-zinc-500 uppercase">Win Rate</div>
                                    <div className="font-mono font-bold text-green-400">58%</div>
                                </div>
                            </div>

                            <Link href={`/dashboard/profile/${op.username}`} className="w-full block">
                                <Button variant="secondary" size="sm" className="w-full h-8 text-xs bg-white/10 hover:bg-white/20 text-white border border-white/5">
                                    VIEW DOSSIER
                                </Button>
                            </Link>
                        </HoverCardContent>
                    </HoverCard>
                ))}
            </div>
        </div>
    )
}
