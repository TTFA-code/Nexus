"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useParams } from "next/navigation"
import { Home, Trophy, Activity, Settings, ShieldAlert, Radio } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"

export function MobileNav() {
    const pathname = usePathname()
    const params = useParams()
    const activeGuildId = (params?.guildId as string) || "547362530826125313";
    const supabase = createClient()
    const [isAdmin, setIsAdmin] = React.useState(false)

    React.useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get Discord ID to match server_members.user_id
            const discordIdentity = user.identities?.find(i => i.provider === 'discord');
            const discordId = discordIdentity?.id;

            if (!discordId) return;

            // Check DB
            const { data: member } = await supabase
                .from('server_members')
                .select('role')
                .eq('user_id', discordId) // Use Discord ID, not UUID
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

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-black/40 backdrop-blur-xl border-t border-white/10 lg:hidden flex items-center justify-around px-2 pb-safe">
            <MobileNavItem
                href="/dashboard/play"
                icon={Home}
                label="Home"
                active={pathname === '/dashboard/play'}
            />
            <MobileNavItem
                href="/dashboard/leaderboard"
                icon={Trophy}
                label="Leaderboard"
                active={pathname?.includes('/leaderboard')}
            />
            <MobileNavItem
                href="/dashboard/discovery"
                icon={Radio}
                label="Command"
                active={pathname === '/dashboard/discovery'}
            />

            <MobileNavItem
                href="/settings"
                icon={Settings}
                label="Settings"
                active={pathname === '/settings'}
            />

            {isAdmin && (
                <MobileNavItem
                    href={`/dashboard/${activeGuildId}/admin`}
                    icon={ShieldAlert}
                    label="Admin"
                    active={pathname?.includes('/admin')}
                    className="text-pink-500 hover:text-pink-400"
                />
            )}
        </div>
    )
}

function MobileNavItem({
    href,
    icon: Icon,
    label,
    active,
    className
}: {
    href: string
    icon: any
    label: string
    active?: boolean
    className?: string
}) {
    return (
        <Link
            href={href}
            className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                active ? "text-cyber-cyan" : "text-zinc-500 hover:text-zinc-300",
                className && active ? "text-pink-500" : "",
                className
            )}
        >
            <Icon className={cn("w-5 h-5", active && "animate-pulse")} />
            <span className="text-[10px] font-mono uppercase tracking-wider">{label}</span>
        </Link>
    )
}
