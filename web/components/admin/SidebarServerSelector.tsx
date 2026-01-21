'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { cn } from "@/lib/utils"
import { Shield, Plus, Activity } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface Guild {
    guild_id: string
    name: string | null
    premium_tier: number | null
}

interface SidebarServerSelectorProps {
    guilds: Guild[] | null
}

export function SidebarServerSelector({ guilds }: SidebarServerSelectorProps) {
    const params = useParams()
    const activeGuildId = params.guildId as string

    if (!guilds || guilds.length === 0) return null

    return (
        <div className="flex flex-col py-4 w-20 hover:w-64 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] bg-black/40 border-r border-white/5 h-screen sticky top-0 backdrop-blur-md z-50 group overflow-hidden">
            {/* Glass Gleam Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:animate-gleam" />

            <TooltipProvider delayDuration={0}>
                <div className="mb-2 px-0 flex justify-center w-full group-hover:justify-start group-hover:px-4 transition-all">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.5)] z-10 relative">
                                    <Shield className="h-5 w-5 text-white" />
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden hidden group-hover:block">
                                    <span className="font-orbitron font-bold text-sm tracking-wider text-white">NEXUS CMD</span>
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="group-hover:hidden">
                            <p>Nexus Command</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                <div className="my-2 mx-auto w-10 h-px bg-white/10 group-hover:w-full group-hover:px-4 transition-all" />

                <div className="flex flex-col gap-3 w-full px-4 items-center group-hover:items-stretch">
                    {guilds.map((guild) => {
                        const isActive = activeGuildId === guild.guild_id
                        const initials = guild.name
                            ? guild.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                            : 'S'

                        return (
                            <Tooltip key={guild.guild_id}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={`/dashboard/${guild.guild_id}/admin`}
                                        className="relative flex items-center gap-3 group/item"
                                    >
                                        {/* Active Indicator Strip (Collapsed) */}
                                        <div className={cn(
                                            "absolute -left-4 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-pink-500 transition-all duration-300",
                                            isActive ? "h-8 opacity-100" : "h-4 opacity-0 group-hover/item:opacity-50",
                                            "group-hover:hidden" // Hide local strip when sidebar expanded, we'll use a dot
                                        )} />

                                        {/* Icon */}
                                        <div className={cn(
                                            "relative h-12 w-12 shrink-0 flex items-center justify-center rounded-[24px] transition-all duration-300 overflow-hidden z-10",
                                            isActive
                                                ? "bg-white text-black rounded-[16px] shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                                : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white hover:rounded-[16px]"
                                        )}>
                                            <span className="font-bold text-sm select-none">
                                                {initials}
                                            </span>
                                        </div>

                                        {/* Expanded Text Content */}
                                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden flex flex-col justify-center hidden group-hover:flex flex-1">
                                            <span className={cn(
                                                "text-sm font-medium truncate w-[140px]",
                                                isActive ? "text-white" : "text-zinc-400 group-hover/item:text-white"
                                            )}>
                                                {guild.name || `Server ${guild.guild_id}`}
                                            </span>
                                            {isActive && (
                                                <span className="text-[10px] text-pink-500 flex items-center gap-1">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-black/90 border-white/10 group-hover:hidden">
                                    <p>{guild.name || `Server ${guild.guild_id}`}</p>
                                    {isActive && <span className="text-pink-500 text-xs">Active Workspace</span>}
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </div>

                <div className="mt-auto mb-2 mx-auto w-10 h-px bg-white/10 group-hover:w-full transition-all" />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link href="/dashboard/discovery" className="px-0 flex justify-center w-full group-hover:justify-start group-hover:px-4 cursor-pointer">
                            <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-[24px] hover:rounded-[16px] bg-white/5 hover:bg-green-500/20 text-green-500 transition-all duration-300">
                                <Plus className="h-6 w-6" />
                            </div>
                            <div className="ml-3 opacity-0 group-hover:opacity-100 transition-all duration-300 hidden group-hover:flex items-center">
                                <span className="text-sm font-medium text-zinc-400">Scan Sectors</span>
                            </div>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-black/90 border-white/10 group-hover:hidden">
                        <p>Add Server</p>
                    </TooltipContent>
                </Tooltip>

            </TooltipProvider>
        </div>
    )
}
