import { AdminOpsManager } from "@/components/admin/AdminOpsManager"
import { createClient } from "@/utils/supabase/server"
import { getActiveLobbies } from "@/actions/getAdminIntel"

export default async function OperationsPage({ params }: { params: Promise<{ guildId: string }> }) {
    const { guildId } = await params
    const supabase = await createClient()

    // Fetch Game Modes for this Guild AND Global Modes
    const { data: gameModes } = await supabase
        .from('game_modes')
        .select('*, games(id, name, icon_url)')
        .or(`guild_id.eq.${guildId},guild_id.is.null`)
        .eq('is_active', true)
        .order('name')

    // Fetch All Active Games (For Custom Creation)
    const { data: allGames } = await supabase
        .from('games')
        .select('id, name, icon_url')
        .order('name')

    // Fetch Active Lobbies
    const activeLobbies = await getActiveLobbies(guildId)

    const validatedModes = (gameModes || []) as any[]

    return (
        <div className="h-full p-4 overflow-y-auto">
            <AdminOpsManager
                initialLobbies={activeLobbies}
                gameModes={validatedModes}
                allGames={allGames || []}
                guildId={guildId}
            />
        </div>
    )
}
