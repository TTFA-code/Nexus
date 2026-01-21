import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarServerSelector } from '@/components/admin/SidebarServerSelector'

export const revalidate = 0

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: guilds } = await supabase
        .from('guilds')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="flex min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-pink-500/30">
            <SidebarServerSelector guilds={guilds} />
            <main className="flex-1 overflow-y-auto overflow-x-hidden relative h-screen">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
                <div className="relative z-10 p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
