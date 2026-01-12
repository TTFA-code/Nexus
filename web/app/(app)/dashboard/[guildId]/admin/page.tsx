'use client';

import { Suspense } from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AdminInbox } from '@/components/admin/AdminInbox';
import { useParams } from 'next/navigation';

export default function AdminDashboardPage() {
    const params = useParams();
    const guildId = params.guildId as string;

    return (
        <div className="p-8 min-h-screen text-white relative z-10">
            <div className="flex items-center gap-6 mb-12">
                <Link href={`/dashboard`} className="h-10 w-10 text-zinc-400 hover:text-white flex items-center justify-center">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">
                        Admin Command
                    </h1>
                    <p className="text-zinc-500 text-sm font-light tracking-wide">SECURE SECTOR • {guildId}</p>
                </div>
            </div>

            <div className="space-y-6">
                <Suspense fallback={<div>Loading Inbox...</div>}>
                    <AdminInbox guildId={guildId} />
                </Suspense>
            </div>
        </div>
    )
}


