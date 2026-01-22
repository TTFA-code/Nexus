'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Mail, Check, X } from 'lucide-react';
import Link from 'next/link';

// ... imports
import { useParams } from 'next/navigation';

export function AdminFloatingHub() {
    const [pendingCount, setPendingCount] = useState(0);
    const [topReports, setTopReports] = useState<any[]>([]);
    const [visible, setVisible] = useState(false);
    const params = useParams(); // Get params if available

    const supabase = createClient();

    useEffect(() => {
        // ... (existing poll logic)
        const checkInbox = async () => {
            // ... auth check ...
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, count } = await supabase
                .from('match_reports')
                .select('*', { count: 'exact' })
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(3);

            if (count !== null) setPendingCount(count);
            if (data) setTopReports(data);
            setVisible(true);
        };
        // ...
        checkInbox();
        const interval = setInterval(checkInbox, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!visible) return null;

    // Determine Link Target
    // 1. If we are in a guild dashboard, use that guild.
    // 2. If we have reports, use the guild_id from the most recent report.
    // 3. Fallback to Home (since /dashboard/admin is gone) or a default.
    let linkTarget = '/dashboard/play';
    if (typeof params?.guildId === 'string') {
        linkTarget = `/dashboard/${params.guildId}/admin`;
    } else if (topReports.length > 0 && topReports[0].guild_id) {
        linkTarget = `/dashboard/${topReports[0].guild_id}/admin`;
    }

    return (
        <div className="hidden lg:block fixed top-6 right-6 z-[100] group">
            {/* The Orb */}
            <div className="animate-bob">
                <Link href={linkTarget}>
                    <div className={`
                        w-[50px] h-[50px] rounded-full 
                        bg-black/40 backdrop-blur-md 
                        flex items-center justify-center
                        transition-all duration-300
                        hover:scale-110 hover:bg-cyan-950/30
                        ${pendingCount > 0
                            ? 'shadow-[0_0_20px_rgba(6,182,212,0.6)] border border-cyan-500/80 bg-cyan-500/10'
                            : 'shadow-[0_0_15px_rgba(6,182,212,0.2)] border border-cyan-500/30'}
                    `}>
                        {/* ... icon ... */}
                        <Mail className={`w-5 h-5 transition-colors ${pendingCount > 0 ? 'text-cyan-200' : 'text-cyan-400'}`} />

                        {/* Badge */}
                        {pendingCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center text-[10px] font-bold text-black border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]">
                                {pendingCount > 9 ? '9+' : pendingCount}
                            </div>
                        )}
                    </div>
                </Link>
            </div>

            {/* Hover Preview Panel */}
            <div className="absolute top-14 right-0 w-64 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl">
                    <div className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider flex justify-between">
                        <span>Incoming Transmission</span>
                        <span className={pendingCount > 0 ? 'text-cyan-400' : 'text-zinc-600'}>{pendingCount} PENDING</span>
                    </div>

                    {topReports.length === 0 ? (
                        <div className="text-center py-4 text-zinc-600 text-xs italic">
                            All quiet on the front.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {topReports.map(report => (
                                <div key={report.id} className="flex justify-between items-center text-xs p-2 bg-white/5 rounded border border-white/5">
                                    <span className="text-zinc-300 truncate max-w-[100px]">{report.result_data?.outcome?.toUpperCase()}</span>
                                    <span className="font-mono text-cyan-400">{report.result_data?.score}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {pendingCount > 3 && (
                        <div className="text-center mt-2 text-[10px] text-zinc-500">
                            + {pendingCount - 3} more
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
