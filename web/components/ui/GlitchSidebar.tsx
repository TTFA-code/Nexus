"use client"

import * as React from "react"
import { Home, Trophy, Settings, ShieldAlert, ChevronLeft, ChevronRight, Menu, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter, useParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export function GlitchSidebar() {
    const [isOpen, setIsOpen] = React.useState(false)
    const [isGlitching, setIsGlitching] = React.useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const params = useParams()
    // Fallback to Main Server if no Guild ID is present (e.g. on /play)
    const activeGuildId = (params?.guildId as string) || "547362530826125313";
    const supabase = createClient()
    const [isAdmin, setIsAdmin] = React.useState(false)

    React.useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Emergency Local Bypass (Matches Gatekeeper)
            if (activeGuildId === "547362530826125313") {
                // We can either bypass or strict check. 
                // User request: "filter... check server_members".
                // However, for consistency with gatekeeper, we might want to allow it if strict mode isn't enforced for main server?
                // But valid roles are synced now. So strict checking is PREFERRED.
                // "Ensure gatekeeper.ts rejects any request... without... 'owner', 'admin', 'nexus-admin'".
                // So we should strictly check here too.
            }

            // Check DB
            const { data: member } = await (supabase as any)
                .from('server_members')
                .select('role')
                .eq('user_id', user.id)
                .eq('guild_id', activeGuildId)
                .single();

            if (member && member.role === 'nexus-admin') {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        }

        checkAdmin();
    }, [activeGuildId, supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    // Hover handlers
    const handleMouseEnter = () => {
        setIsGlitching(true)
        setIsOpen(true)
        setTimeout(() => setIsGlitching(false), 300)
    }

    const handleMouseLeave = () => {
        setIsOpen(false)
    }

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "relative h-screen z-50 flex flex-col border-r border-white/10 bg-black/40 backdrop-blur-xl transition-all duration-300 ease-out",
                isOpen ? "w-64" : "w-20",
                isGlitching && "border-cyber-cyan/50" // Glitch effect on border
            )}
        >
            {/* Render Overlay when glitching */}
            {isGlitching && <GlitchOverlay />}

            {/* Header */}
            <div className="flex items-center justify-between p-4 mb-8 border-b border-white/5 relative h-[65px]">
                {isOpen && (
                    <h1 className={cn(
                        "font-heading font-black text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 animate-in fade-in transition-all",
                        isGlitching && "text-cyber-cyan tracking-[0.2em] skew-x-12"
                    )}>
                        NEXUS
                    </h1>
                )}
                {!isOpen && (
                    <div className="w-full flex justify-center">
                        <Menu className="w-6 h-6 text-zinc-400" />
                    </div>
                )}
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-2 px-2">
                <NavItem icon={Home} label="HOME" href="/dashboard/play" active={pathname === '/dashboard/play'} isOpen={isOpen} />

                {/* Dynamic Leaderboard Link */}
                <NavItem
                    icon={Trophy}
                    label="LEADERBOARDS"
                    href="/leaderboard"
                    active={pathname?.includes('/leaderboard') || false}
                    isOpen={isOpen}
                />

                <NavItem icon={Settings} label="SETTINGS" href="/settings" active={pathname === '/settings'} isOpen={isOpen} />

                {/* Visual Divider */}
                <div className="my-6 mx-2 border-t border-white/10" />

                {/* Admin Section - Always visible with fallback */}
                <NavItem
                    icon={ShieldAlert}
                    label="COMMAND CENTER"
                    href={isAdmin ? `/dashboard/${activeGuildId}/admin` : "/dashboard/discovery"}
                    active={pathname?.includes('/admin') || pathname?.includes('/discovery') || false}
                    isOpen={isOpen}
                    className="text-pink-500 hover:text-pink-400 hover:bg-pink-500/10 active:bg-pink-500/20 border-pink-500/50"
                />
            </nav>

            {/* Footer / User */}
            {/* Footer / User */}
            <div className="p-4 border-t border-white/5 bg-black/20">
                <div className={cn("flex items-center justify-between gap-2", !isOpen && "flex-col justify-center")}>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-cyber-purple/20 border border-cyber-purple/50 flex items-center justify-center shrink-0">
                            <span className="text-cyber-purple font-bold">L</span>
                        </div>
                        {isOpen && (
                            <div className="overflow-hidden animate-in fade-in duration-300">
                                <p className="text-sm font-bold text-white truncate">Loki</p>
                                <p className="text-xs text-cyber-cyan truncate">Admin Access</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

const NavItem = ({ icon: Icon, label, href, active, isOpen, className }: { icon: any, label: string, href: string, active?: boolean, isOpen: boolean, className?: string }) => (
    <Link
        href={href}
        className={cn(
            "group flex items-center gap-3 p-3 rounded-r-lg border-l-2 transition-all duration-200 hover:bg-white/5",
            active
                ? "border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan shadow-[0_0_15px_-5px_rgba(0,243,255,0.5)]"
                : "border-transparent text-zinc-400 hover:text-white",
            className && active ? "border-pink-500 bg-pink-500/10 text-pink-500 shadow-[0_0_15px_-5px_rgba(236,72,153,0.5)]" : "",
            className && !active ? "hover:text-pink-400" : ""
        )}
    >
        <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active && "animate-pulse")} />
        {isOpen && (
            <span className="font-sans tracking-wide text-sm font-medium animate-in fade-in duration-300">
                {label}
            </span>
        )}
    </Link>
)

// Overlay component for intense glitch effect
const GlitchOverlay = () => (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {/* 1. RGB Split Layers */}
        <div className="absolute inset-0 bg-transparent animate-glitch-1 opacity-50 mix-blend-screen"
            style={{ textShadow: '2px 0 #00f3ff, -2px 0 #ff00ff' }} />
        <div className="absolute inset-0 bg-transparent animate-glitch-2 opacity-50 mix-blend-multiply"
            style={{ textShadow: '-2px 0 #00f3ff, 2px 0 #ff00ff' }} />

        {/* 2. Color Particles / Digital Noise */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyber-cyan animate-pulse" />
        <div className="absolute top-3/4 left-2/3 w-1 h-3 bg-cyber-purple animate-ping" />
        <div className="absolute top-1/3 right-10 w-4 h-[1px] bg-white animate-beam-h-fast" />

        {/* 3. Flash */}
        <div className="absolute inset-0 bg-white/10 animate-[glitch-flash_0.2s_infinite]" />
    </div>
)
