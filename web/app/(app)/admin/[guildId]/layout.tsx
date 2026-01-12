import { verifyNexusAdmin } from '@/utils/discord/gatekeeper';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

interface LayoutProps {
    children: ReactNode;
    params: Promise<{ guildId: string }>;
}

export default async function AdminLayout({ children, params }: LayoutProps) {
    const { guildId } = await params;

    const { isAuthorized } = await verifyNexusAdmin(guildId);

    if (!isAuthorized) {
        redirect('/access-denied');
    }

    return (
        <>
            {children}
        </>
    );
}
