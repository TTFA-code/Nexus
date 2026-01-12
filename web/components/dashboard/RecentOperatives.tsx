"use client"

import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Button } from "@/components/ui/button"

const MOCK_OPERATIVES = [
    { username: "Viper", rank: 42, avatar: "https://github.com/shadcn.png" },
    { username: "Ghost", rank: 15, avatar: "https://avatar.vercel.sh/ghost" },
    { username: "Spectre", rank: 8, avatar: "https://avatar.vercel.sh/spectre" },
    { username: "Phantom", rank: 156, avatar: "https://avatar.vercel.sh/phantom" },
    { username: "Wraith", rank: 3, avatar: "https://avatar.vercel.sh/wraith" },
    { username: "Omen", rank: 89, avatar: "https://avatar.vercel.sh/omen" },
    { username: "Jett", rank: 1, avatar: "https://avatar.vercel.sh/jett" },
    { username: "Phoenix", rank: 24, avatar: "https://avatar.vercel.sh/phoenix" },
    { username: "Sage", rank: 12, avatar: "https://avatar.vercel.sh/sage" },
    { username: "Cypher", rank: 55, avatar: "https://avatar.vercel.sh/cypher" },
]

export function RecentOperatives() {
    return (
        <div className="w-full space-y-4 py-6">
            <h2 className="text-xl font-semibold tracking-tight text-foreground/80">Recent Operatives</h2>
            <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
                <div className="flex gap-6 px-2">
                    {MOCK_OPERATIVES.map((op) => (
                        <HoverCard key={op.username}>
                            <HoverCardTrigger asChild>
                                <div className="group cursor-pointer">
                                    <Avatar className="h-16 w-16 border-2 border-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:border-primary/60 group-hover:shadow-[0_0_20px_rgba(var(--primary),0.5)]">
                                        <AvatarImage src={op.avatar} alt={op.username} />
                                        <AvatarFallback>{op.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80 backdrop-blur-xl bg-black/40 border-white/10 text-white shadow-2xl">
                                <div className="flex justify-between space-x-4">
                                    <Avatar className="h-12 w-12 border border-white/10">
                                        <AvatarImage src={op.avatar} />
                                        <AvatarFallback>{op.username[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-semibold">@{op.username}</h4>
                                        <p className="text-xs text-gray-400">Global Rank: <span className="text-primary font-mono">#{op.rank}</span></p>
                                        <div className="flex items-center pt-2">
                                            <span className="text-xs text-muted-foreground mr-auto">
                                                Joined December 2025
                                            </span>
                                        </div>
                                        <div className="pt-2">
                                            <Link href={`/dashboard/profile/${op.username}`} className="w-full block">
                                                <Button variant="secondary" size="sm" className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/5 hover:border-white/20 transition-all">
                                                    VIEW DOSSIER
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    ))}
                </div>
            </div>
        </div>
    )
}
