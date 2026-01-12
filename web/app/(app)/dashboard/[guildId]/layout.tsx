import { ReactNode } from 'react';
import { syncUserPermissions } from '@/actions/authActions';

interface GuildLayoutProps {
    children: ReactNode;
    params: Promise<{ guildId: string }>;
}

export default async function GuildLayout({ children, params }: GuildLayoutProps) {
    const resolvedParams = await params;
    const { guildId } = resolvedParams;

    // Sync Permissions on Navigation
    // This ensures that if a user is given a role in Discord, 
    // simply refreshing the page (or navigating to a guild page) updates their DB status.
    try {
        await syncUserPermissions(guildId);
    } catch (error) {
        console.warn('[GuildLayout] Permission sync failed (non-critical):', error);
    }

    return (
        <>
            {children}
        </>
    );
}
