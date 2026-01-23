import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, Gamepad2, Activity } from 'lucide-react'

export default async function Dashboard() {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // 2. Fetch Guilds via server_members
    // We select guilds that the user is a member of
    const { data: members } = await supabase
        .from('server_members')
        .select(`
            role,
            guild_id,
            guilds (
                name,
                guild_id
            )
        `)
        .eq('user_id', user.id)

    // Extract guilds from the relationship
    const guilds = members?.map(m => m.guilds).filter(Boolean) || []

    // 3. Fallback UI: No Guilds Linked
    if (guilds.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8 animate-in fade-in duration-700">
                <div className="bg-yellow-500/10 p-6 rounded-full border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                    <ShieldAlert className="w-16 h-16 text-yellow-500" />
                </div>
                <h2 className="text-3xl font-orbitron font-bold text-white mt-4">No Guilds Linked</h2>
                <p className="text-zinc-400 max-w-md text-lg leading-relaxed">
                    We couldn't find any Discord servers linked to your account.
                    <span className="block mt-2 text-zinc-500 text-sm">
                        Ensure the Guild Sync bot is running on Railway and you are in a supported server.
                    </span>
                </p>
                <div className="pt-8 w-full max-w-sm">
                    <Link
                        href="/dashboard/discovery"
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-cyber-purple/20 border border-cyber-purple/50 rounded-lg hover:bg-cyber-purple/40 hover:scale-105 active:scale-95 transition-all text-cyber-purple font-bold tracking-wide shadow-[0_0_20px_rgba(188,19,254,0.3)]"
                    >
                        <Gamepad2 className="w-5 h-5" />
                        BROWSE COMMUNITIES
                    </Link>
                </div>
            </div>
        )
    }

    // 4. Render Guild Selection
    // If guilds exist, let the user pick one to enter the main dashboard flow
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-orbitron font-black text-white tracking-tight">
                    WELCOME, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan to-cyber-purple">{user.user_metadata.full_name?.toUpperCase()}</span>
                </h1>
                <p className="text-zinc-400 text-lg font-light tracking-wide">
                    Select a neural network node to establish connection.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {guilds.map((guild: any) => (
                    <Link
                        key={guild.guild_id}
                        href={`/dashboard/${guild.guild_id}/play`}
                        className="group relative bg-black/40 border border-white/10 p-8 rounded-2xl hover:border-cyber-cyan/50 hover:bg-cyber-cyan/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                    >
                        {/* Hover Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyber-cyan/0 via-transparent to-cyber-purple/0 group-hover:from-cyber-cyan/10 group-hover:to-cyber-purple/10 transition-all duration-500 opacity-0 group-hover:opacity-100" />

                        <div className="relative flex flex-col gap-6 z-10">
                            <div className="flex items-start justify-between">
                                <div className="w-16 h-16 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center text-2xl font-black font-orbitron text-white group-hover:scale-110 group-hover:border-cyber-cyan/50 transition-all shadow-xl">
                                    {guild.name?.[0]?.toUpperCase()}
                                </div>
                                <Activity className="w-6 h-6 text-zinc-700 group-hover:text-cyber-cyan transition-colors" />
                            </div>

                            <div>
                                <h3 className="font-bold text-xl text-white group-hover:text-cyber-cyan transition-colors tracking-wide truncate">
                                    {guild.name}
                                </h3>
                                <p className="text-xs text-zinc-500 font-mono mt-1 group-hover:text-zinc-400">
                                    ID: {guild.guild_id}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-zinc-500 group-hover:text-cyber-cyan/70">
                                <span>STATUS: ONLINE</span>
                                <span className="group-hover:translate-x-1 transition-transform">CONNECT &rarr;</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}

