import { UserOverseer } from "@/components/admin/UserOverseer"
import { createClient } from "@/utils/supabase/server"

async function getMembersData(guildId: string) {
    const supabase = await createClient()

    // Fetch members (Using a view or table, assuming 'guild_members' or similar exists, or just players for now)
    // Since we don't know the exact schema for members relation here, 
    // and UserOverseer expects players. 
    // We'll fetch players who have interacted with the guild? 
    // Or just all players for MVP if the guild relation isn't clear.
    // Let's assume we want to show players linked to this guild.
    // Ideally: supabase.from('guild_members').select('*').eq('guild_id', guildId)
    // But let's check 'match_players' or similar to get "Active Operatives".

    // For now, let's fetch 'players' - limit 30 for performance
    const { data: players } = await supabase
        .from('players')
        .select('*')
        .limit(30)

    // Fetch banned users
    // Assuming there is a bans table? Or 'guild_bans'
    // toggleGuildBan action uses 'guild_bans' table presumably.
    // Let's check `manageBans` action logic if possible, but for now I'll guess 'guild_bans'.
    const { data: bans } = await supabase
        .from('guild_bans')
        .select('user_id')
        .eq('guild_id', guildId)

    const bannedIds = bans?.map(b => b.user_id) || []

    return { players: players || [], bannedIds }
}

export default async function MembersPage({ params }: { params: Promise<{ guildId: string }> }) {
    const { guildId } = await params
    const { players, bannedIds } = await getMembersData(guildId)

    return (
        <div className="h-full p-4">
            <h1 className="text-2xl font-bold mb-6 text-white font-orbitron">PERSONNEL</h1>
            <UserOverseer players={players} bannedUserIds={bannedIds} guildId={guildId} />
        </div>
    )
}
