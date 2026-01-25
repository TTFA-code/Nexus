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
    const [adminGuildId, setAdminGuildId] = React.useState<string | null>(null)

    React.useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get Discord ID to match server_members.user_id
            const discordIdentity = user.identities?.find(i => i.provider === 'discord');
            const discordId = discordIdentity?.id;

            if (!discordId) return;

            // Check DB for ANY admin role
            const { data: members } = await supabase
                .from('server_members')
                .select('guild_id, role')
                .eq('user_id', discordId)
                .eq('role', 'nexus-admin')
                .limit(1);

            if (members && members.length > 0) {
                setIsAdmin(true);
                // Store the guild ID where they are admin to use as fallback
                setAdminGuildId(members[0].guild_id);
            } else {
                setIsAdmin(false);
            }
        }

        checkAdmin();
    }, [supabase]);

    // Use current guild if available, otherwise fallback to the one found in DB, otherwise discovery
    const adminLink = params?.guildId
        ? `/dashboard/${params.guildId}/admin`
        : adminGuildId
            ? `/dashboard/${adminGuildId}/admin`
            : `/dashboard/discovery`;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-black/40 backdrop-blur-xl border-t border-white/10 lg:hidden flex items-center justify-around px-4 pb-safe">
            <MobileNavItem
                href="/dashboard/play"
                icon={Home}
                active={pathname === '/dashboard/play'}
            />
            <MobileNavItem
                href="/dashboard/leaderboard"
                icon={Trophy}
                active={pathname?.includes('/leaderboard')}
            />

            <MobileNavItem
                href="/settings"
                icon={Settings}
                active={pathname === '/settings'}
            />

            {isAdmin && (
                <MobileNavItem
                    href={adminLink}
                    icon={ShieldAlert}
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
    active,
    className
}: {
    href: string
    icon: any
    active?: boolean
    className?: string
}) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200",
                active ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5",
                className && active ? "bg-pink-500/10 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.2)]" : "",
                className
            )}
        >
            <Icon className={cn("w-6 h-6", active && "scale-110 transition-transform")} />
        </Link>
    )
}
