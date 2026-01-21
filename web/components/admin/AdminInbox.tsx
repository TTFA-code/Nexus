
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, X, ExternalLink, Loader2, Clock, CheckCircle } from 'lucide-react';
import { approveMatchAction, approveAllMatchesAction } from '@/actions/adminActions';

import { Database } from '@/types/supabase';

interface AdminInboxProps {
    guildId: string;
}

export const AdminInbox: React.FC<AdminInboxProps> = ({ guildId }) => {

    // type AdminMatchReview = Database['public']['Views']['admin_match_review']['Row'];

    interface AdminMatchReview {
        match_id: string;
        status: string;
        guild_id: string;
        game_mode_name: string;
        reporter_name: string;
        winner_team: number | null;
        finished_at: string | null;
        game_mode_id: string;
    }

    const [reports, setReports] = useState<AdminMatchReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const supabase = createClient();

    const fetchReports = async () => {
        if (!guildId) return;

        setLoading(true);
        try {
            // Updated Query using View
            const { data, error } = await supabase
                .from('admin_match_review')
                .select('*')
                .eq('status', 'pending_approval')
                .eq('guild_id', guildId) // Filter by Guild - Explicitly using URL param
                .order('finished_at', { ascending: false });

            if (error) {
                console.error('Fetch Error:', error.message);
                throw new Error(error.message);
            }

            setReports((data || []) as unknown as AdminMatchReview[]);
        } catch (error: any) {
            console.error('AdminInbox Fetch Error:', error);
            toast.error(error.message || 'Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (guildId) {
            fetchReports();
        }
    }, [guildId]);

    const [batchLoading, setBatchLoading] = useState(false);

    const handleApproveAll = async () => {
        if (!confirm(`Are you sure you want to approve all ${reports.length} pending matches? This will update MMR for everyone.`)) return;

        setBatchLoading(true);
        try {
            const res = await approveAllMatchesAction(guildId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`Approved ${res.count} matches successfully.`);
                fetchReports(); // Refresh
            }
        } catch (e) {
            toast.error('Batch approval failed');
        } finally {
            setBatchLoading(false);
        }
    };

    const handleAction = async (matchId: string, action: 'approve' | 'reject') => {
        setActionLoading(matchId);
        try {
            if (action === 'approve') {
                const result = await approveMatchAction(matchId);
                if (result.error) {
                    toast.error(result.error);
                    return; // Stop if error, keeping item in list
                }
                toast.success('Match Approved. MMR recalculation complete.');
            } else {
                // Reject logic
                const { error } = await supabase.from('matches').update({ status: 'voided' }).eq('id', matchId);
                if (error) throw error;
                toast.success('Match Voided');
            }

            setReports(prev => prev.filter(r => r.match_id !== matchId));
        } catch (error: any) {
            toast.error(error.message || 'Failed to process request');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;
    }

    if (reports.length === 0) {
        return (
            <div className="p-10 text-center text-zinc-500 border border-white/10 rounded-xl bg-black/20">
                <div className="flex justify-center mb-3">
                    <Check className="w-10 h-10 text-green-500/20" />
                </div>
                INBOX CLEARED
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header Actions */}
            {reports.length > 0 && (
                <div className="flex justify-end mb-4">
                    <Button
                        onClick={handleApproveAll}
                        disabled={batchLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                        {batchLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        Approve All ({reports.length})
                    </Button>
                </div>
            )}

            {reports.map((match) => (
                <Card key={match.match_id ?? 'unknown'} className="p-4 bg-black/40 backdrop-blur-md border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between group hover:border-cyan-500/30 transition-all">

                    {/* Reporter Info */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                        <div>
                            <div className="text-sm text-zinc-400">Reporter</div>
                            <div className="text-white font-bold">{match.reporter_name || 'Unknown'}</div>
                        </div>
                    </div>

                    {/* Match Details */}
                    <div className="flex-1 grid grid-cols-3 gap-4 font-mono text-sm">
                        <div>
                            <div className="text-xs text-zinc-500 uppercase">Game</div>
                            <div className="text-cyan-400">{match.game_mode_name || 'Unknown'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-500 uppercase">Winner Team</div>
                            <div className="text-white">
                                {match.winner_team}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-500 uppercase">Time</div>
                            <div className="text-zinc-400">{match.finished_at ? new Date(match.finished_at).toLocaleTimeString() : 'N/A'}</div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={() => match.match_id && handleAction(match.match_id, 'approve')}
                            disabled={actionLoading === match.match_id || !match.match_id}
                            className="bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/40 font-bold"
                        >
                            {actionLoading === match.match_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </Button>

                        <Button
                            size="sm"
                            onClick={() => match.match_id && handleAction(match.match_id, 'reject')}
                            disabled={actionLoading === match.match_id || !match.match_id}
                            className="bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/40 font-bold"
                        >
                            {actionLoading === match.match_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
}
