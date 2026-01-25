import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { verifyNexusAdmin } from '@/utils/discord/gatekeeper';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { createClient } from '@/utils/supabase/server';
import { SidebarServerSelector } from '@/components/admin/SidebarServerSelector';
import { MobileAdminHeader } from '@/components/admin/MobileAdminHeader';

interface AdminLayoutProps {
    children: ReactNode;
    params: Promise<{ guildId: string }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
    const { guildId } = await params;

    // IRON CLAD SECURITY CHECK
    const { isAuthorized, reason } = await verifyNexusAdmin(guildId);

    if (!isAuthorized) {
        console.error(`[SECURITY] Access Denied for Guild ${guildId}: ${reason}`);
        console.error(`[SECURITY] Access Denied for Guild ${guildId}: ${reason}`);
        redirect('/dashboard/discovery');
    }

    // Fetch Admin Sectors for Bubble Selector
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let guilds: any[] = [];
    if (user) {
        // Get Discord ID to match server_members.user_id (TEXT)
        const discordIdentity = user.identities?.find(i => i.provider === 'discord');
        const discordId = discordIdentity?.id;

        if (discordId) {
            const { data: members } = await (supabase as any)
                .from('server_members')
                .select('guild_id')
                .eq('user_id', discordId) // Use Discord ID, not UUID
                .eq('role', 'nexus-admin');

            if (members && members.length > 0) {
                const guildIds = members.map((m: any) => m.guild_id);
                const { data: guildsData } = await supabase
                    .from('guilds')
                    .select('guild_id, name, premium_tier')
                    .in('guild_id', guildIds);
                guilds = guildsData || [];
            }
        }
    }

    return (
        <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-100px)]">
            {/* Mobile Header */}
            <MobileAdminHeader guildId={guildId} guilds={guilds} />

            {/* Desktop Sidebars (Hidden on Mobile) */}
            <div className="hidden md:block">
                <SidebarServerSelector guilds={guilds} />
            </div>
            <div className="hidden md:block h-full">
                <AdminSidebar guildId={guildId} />
            </div>

            {/* Main Content */}
            <div className="flex-1 p-0 md:p-6 overflow-y-auto">
                <div className="p-4 md:p-0"> {/* Inner padding container for mobile */}
                    {children}
                </div>
            </div>
        </div>
    );
}
