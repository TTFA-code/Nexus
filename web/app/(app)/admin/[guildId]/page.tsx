import { createClient } from '@/utils/supabase/server'
import { PageHeader } from "@/components/ui/PageHeader"
import { AdminOpsManager } from "@/components/admin/AdminOpsManager"
import { CommsDeck } from "@/components/admin/CommsDeck"
import { ModeForge } from "@/components/admin/ModeForge"
import { BotHealthTerminal } from "@/components/admin/BotHealthTerminal"
import { OverseerInbox } from "@/components/admin/OverseerInbox"
import { IncidentReports } from "@/components/admin/IncidentReports"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getGuildChannels } from '@/utils/discord/fetchChannels'
import { getActiveLobbies, getRecentReports } from '@/actions/getAdminIntel'

export const revalidate = 0

export default async function AdminDashboardPage({ params }: { params: Promise<{ guildId: string }> }) {
    const { guildId } = await params
    const supabase = await createClient()

    // Fetch Guild Info
    const { data: guild } = await supabase
        .from('guilds')
        .select('*')
        .eq('guild_id', guildId)
        .single()

    // Fetch All Games (For Tournament Creator)
    const { data: allGames } = await supabase
        .from('games')
        .select('*')
        .order('name')

    // Fetch Global Game Modes (Nexus Standard)
    const { data: globalModes } = await supabase
        .from('game_modes')
        .select('*, games(*)')
        .is('guild_id', null)
        .order('id')

    // Fetch Custom Game Modes (Sector Specific)
    const { data: customModes } = await supabase
        .from('game_modes')
        .select('*, games(*)')
        .eq('guild_id', guildId)
        .order('id')

    // Fetch Active Lobbies (Intel)
    const activeLobbies = await getActiveLobbies(guildId)

    // Fetch Reports (Intel)
    const reports = await getRecentReports(guildId)

    // Fetch Profiles (The Overseer) - Still needed for UserOverseer if used
    const { data: players } = await supabase
        .from('players')
        .select('user_id, username, avatar_url')
        .limit(50)

    // Fetch Discord Channels (Comms v2)
    const channels = await getGuildChannels(guildId);

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col">
            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                <div className="flex flex-col gap-4">
                    <PageHeader
                        title={guild?.name || "Server Dashboard"}
                        subtitle={`COMMAND CENTER // ${guildId}`}
                    />
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-zinc-500 font-mono tracking-widest uppercase">System Status</div>
                        <div className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/20 inline-block">
                            OPERATIONAL
                        </div>
                    </div>
                </div>

                <div className="hidden md:block flex-1 max-w-[50%] h-[160px]">
                    <BotHealthTerminal />
                </div>
            </div>

            <Tabs defaultValue="ops" className="w-full flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-1">
                    <TabsList className="bg-transparent h-auto p-0 gap-8 justify-start w-full">
                        {["OPS", "COMMS", "INTEL", "SYS"].map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab.toLowerCase()}
                                className="relative bg-transparent rounded-none border-b-2 border-transparent px-2 pb-4 pt-2 font-orbitron tracking-widest text-zinc-500 hover:text-zinc-300 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-400 data-[state=active]:shadow-[0_10px_30px_-10px_rgba(6,182,212,0.5)] transition-all duration-300"
                            >
                                {tab}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-10">
                    {/* OPS TAB - Tournament Creator & Active Ops & Reports */}
                    <TabsContent value="ops" className="h-full mt-0 focus-visible:ring-0 focus-visible:outline-none">
                        <AdminOpsManager
                            initialLobbies={activeLobbies}
                            guildId={guildId}
                            gameModes={globalModes || []}
                            customModes={customModes || []}
                            allGames={allGames || []}
                        >
                            <IncidentReports reports={reports} guildId={guildId} />
                        </AdminOpsManager>
                    </TabsContent>

                    {/* COMMS TAB - Comms Deck */}
                    <TabsContent value="comms" className="h-full mt-0 focus-visible:ring-0 focus-visible:outline-none">
                        <div className="h-full max-w-4xl mx-auto">
                            <CommsDeck guildId={guildId} channels={channels} />
                        </div>
                    </TabsContent>

                    {/* INTEL TAB - The Overseer */}
                    <TabsContent value="intel" className="h-full mt-0 focus-visible:ring-0 focus-visible:outline-none">
                        <OverseerInbox
                            reports={reports}
                            players={players || []}
                            guildId={guildId}
                        />
                    </TabsContent>

                    {/* SYS TAB - Mode Forge (Full Width) */}
                    <TabsContent value="sys" className="h-full mt-0 focus-visible:ring-0 focus-visible:outline-none">
                        <div className="h-full">
                            <ModeForge
                                globalModes={(globalModes || []) as any}
                                customModes={(customModes || []) as any}
                                guildId={guildId}
                            />
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
