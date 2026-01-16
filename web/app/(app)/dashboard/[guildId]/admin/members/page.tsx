import { UserOverseer } from "@/components/admin/UserOverseer"
import { createClient } from "@/utils/supabase/server"

import { createAdminClient } from "@/utils/supabase/admin"

async function getMembersData(guildId: string) {
    const supabase = await createClient()
    const adminDb = createAdminClient()

    // 1. Get member UUIDs from server_members (Users who have logged into the app and are in this guild)
    // Use adminDb to bypass potential RLS policies that hide other members
    const { data: members } = await (adminDb || supabase as any)
        .from('server_members')
        .select('user_id')
        .eq('guild_id', guildId)

    const memberUuids = members?.map((m: any) => m.user_id) || []

    if (memberUuids.length === 0) {
        return { players: [], bannedIds: [] }
    }

    // 2. Get player details using UUIDs
    // players table is public read, so standard client is fine
    const { data: players } = await supabase
        .from('players')
        .select('*')
        .in('uuid_link', memberUuids)

    // 3. Fetch banned users for this guild
    // Use adminDb for bans as well to ensure visibility
    const { data: bans } = await (adminDb || supabase as any)
        .from('guild_bans')
        .select('user_id')
        .eq('guild_id', guildId)

    const bannedIds = bans?.map((b: any) => b.user_id) || []

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
