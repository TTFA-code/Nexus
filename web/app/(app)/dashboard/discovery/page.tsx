
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DiscoveryInterface } from './DiscoveryInterface';

export default async function DiscoveryPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser(); // Fixed security warning
    const { data: { session } } = await supabase.auth.getSession(); // Still need for provider_token

    if (!user || !session?.provider_token) {
        redirect('/login');
    }

    // Get Discord ID from identities
    const discordIdentity = user.identities?.find(i => i.provider === 'discord');
    const discordId = discordIdentity?.id;

    if (!discordId) {
        redirect('/login');
    }

    // Fetch User's Guilds directly from Discord
    const res = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: {
            Authorization: `Bearer ${session.provider_token}`
        },
        next: { revalidate: 60 } // Cache for 1 min
    });

    let guilds = [];
    if (res.ok) {
        guilds = await res.json();
    } else {
        console.error("Failed to fetch guilds for discovery:", res.statusText);
    }

    // Fetch Active Connections to determine state
    let connectedGuildIds: string[] = [];
    const { data: members } = await supabase
        .from('server_members')
        .select('guild_id')
        .eq('user_id', discordId) // ← Use Discord ID (TEXT), not UUID
        .eq('role', 'nexus-admin');

    if (members) {
        connectedGuildIds = members.map((m: any) => m.guild_id);
    }

    return (
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-sm p-8 text-white animate-in fade-in">
            <h1 className="text-3xl font-black font-heading tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-2">
                SECTOR SCANNER
            </h1>
            <p className="text-zinc-400 mb-8 max-w-2xl">
                Identify and synchronize command nodes. If you have granted yourself the <span className="text-pink-500 font-mono text-sm">@nexus-admin</span> role in a server, scan it below to activate your Command Center access.
            </p>

            <DiscoveryInterface guilds={guilds} connectedGuildIds={connectedGuildIds} />
        </div>
    );
}
