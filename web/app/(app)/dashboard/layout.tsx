'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Swords, FileText } from 'lucide-react';
import { PageHeader } from "@/components/ui/PageHeader";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const tabs = [
        { name: 'The Arena', href: '/dashboard/play', icon: Swords },
        { name: 'Profile', href: '/dashboard/profile/me', icon: FileText },
    ];

    const showHeader = !pathname.includes('/admin') && !pathname.includes('/leaderboard') && !pathname.includes('/discovery');

    return (
        <div className="min-h-screen bg-[#0a0a0f]/50 backdrop-blur-md text-white">
            {/* Shared Header - Only show if valid dashboard area */}
            {showHeader && (
                <PageHeader
                    title="Dashboard"
                    subtitle="PLAYER CONTROLS"
                >
                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-4 border-b border-white/10">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = pathname.startsWith(tab.href);

                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={`
                                    flex items-center gap-2 px-6 py-4 text-sm font-bold tracking-widest uppercase transition-all relative
                                    ${isActive ? 'text-[#ccff00]' : 'text-zinc-500 hover:text-zinc-300'}
                                `}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.name}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#ccff00] shadow-[0_0_10px_#ccff00]" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </PageHeader>
            )}

            {/* Content Area */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
