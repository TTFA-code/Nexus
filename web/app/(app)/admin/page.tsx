import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardRedirect } from '@/components/admin/DashboardRedirect'

export const revalidate = 0

export default async function AdminPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: guilds } = await supabase
        .from('guilds')
        .select('guild_id')
        .order('created_at', { ascending: false })
        .limit(1)

    if (guilds && guilds.length > 0) {
        return <DashboardRedirect to={`/admin/${guilds[0].guild_id}`} />
    }

    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center">
            <div className="p-12 border border-white/5 bg-white/5 backdrop-blur-md rounded-2xl max-w-md w-full">
                <h1 className="text-2xl font-bold mb-4 font-orbitron">No Servers Found</h1>
                <p className="text-zinc-400 mb-6">You are not an administrator of any active server, or the bot has not been deployed yet.</p>
                <div className="px-4 py-2 bg-pink-500/10 text-pink-500 rounded border border-pink-500/20 text-sm font-mono">
                    DEPLOY NEXUS BOT
                </div>
            </div>
        </div>
    )
}
