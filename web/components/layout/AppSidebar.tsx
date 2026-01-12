'use client';

import { Home, Trophy, Settings, Shield, User, LogOut } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
    {
        title: "Home",
        url: "/dashboard",
        icon: Home,
    },
    {
        title: "Leaderboard",
        url: "/leaderboard",
        icon: Trophy,
    },
    {
        title: "Settings", // Added as typical for dashboards
        url: "/settings",
        icon: Settings,
    },
    {
        title: "Admin",
        url: "/admin",
        icon: Shield,
    },
]

export function AppSidebar() {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <Sidebar className="border-r border-white/5 bg-transparent w-64 pt-8" collapsible="none">
            <SidebarContent className="bg-transparent px-4">
                {/* Logo Area */}
                <div className="mb-12 px-4">
                    <h1 className="text-2xl font-bold text-white tracking-widest font-heading">NEXUS</h1>
                </div>

                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-2">
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild className="hover:bg-white/5 hover:text-white transition-all duration-200 data-[active=true]:text-[#ccff00] data-[active=true]:bg-transparent rounded-lg p-0 h-auto group">
                                        <a href={item.url} className="flex items-center gap-4 py-3 px-4">
                                            <item.icon className="w-5 h-5 text-zinc-500 group-hover:text-white group-data-[active=true]:text-[#ccff00] transition-colors" />
                                            <span className="font-medium text-sm tracking-wide font-sans text-zinc-400 group-hover:text-white group-data-[active=true]:text-[#ccff00] transition-colors">{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-6 border-t border-white/5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-white border border-white/10">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white leading-none">Reference</span>
                            <span className="text-xs text-zinc-500 mt-1">Online</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Sign Out"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
