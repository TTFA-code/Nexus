'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import { ShieldAlert, Radio, FileText, Settings, Users, Inbox } from 'lucide-react'

interface AdminSidebarProps {
    guildId: string
}

export function AdminSidebar({ guildId }: AdminSidebarProps) {
    const pathname = usePathname()

    const links = [
        {
            label: "INBOX",
            href: `/dashboard/${guildId}/admin`, // The root admin page is the inbox
            icon: Inbox,
            exact: true
        },
        {
            label: "COMMS",
            href: `/dashboard/${guildId}/admin/comms`,
            icon: Radio
        },
        {
            label: "INTEL",
            href: `/dashboard/${guildId}/admin/intel`,
            icon: FileText
        },
        {
            label: "MEMBERS",
            href: `/dashboard/${guildId}/admin/members`,
            icon: Users
        },
        {
            label: "SETTINGS",
            href: `/dashboard/${guildId}/admin/settings`,
            icon: Settings
        }
    ]

    return (
        <div className="w-64 border-r border-white/10 bg-black/20 flex flex-col p-4 gap-2">
            <div className="mb-6 px-2">
                <h2 className="font-orbitron font-bold text-lg text-white tracking-widest">
                    CMD CENTER
                </h2>
                <div className="h-0.5 w-12 bg-pink-500 mt-1" />
            </div>

            <nav className="space-y-1">
                {links.map((link) => {
                    const isActive = link.exact
                        ? pathname === link.href
                        : pathname?.startsWith(link.href)

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded transition-all duration-200 group border border-transparent",
                                isActive
                                    ? "bg-pink-500/10 text-pink-400 border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.1)]"
                                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <link.icon className={cn(
                                "w-4 h-4 transition-colors",
                                isActive ? "text-pink-400" : "text-zinc-500 group-hover:text-zinc-300"
                            )} />
                            <span className="font-mono text-sm tracking-wide uppercase">
                                {link.label}
                            </span>
                            {isActive && (
                                <div className="ml-auto w-1 h-1 rounded-full bg-pink-500 animate-pulse" />
                            )}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
