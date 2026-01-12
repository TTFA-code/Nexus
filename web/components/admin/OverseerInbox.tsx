'use client'

import { useState } from 'react'
import { resolveReport } from '@/actions/resolveReport'
import { ShieldAlert, ShieldCheck, Inbox, AlertTriangle, XCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface Report {
    id: string
    created_at: string
    reason: string
    status: 'PENDING' | 'RESOLVED' | 'DISMISSED'
    reporter_id: string
    reported_id: string
    // Joined fields (if fetched via relation, but for now we might need to fetch profiles separately or rely on props)
    // To keep it simple, we'll assume we get raw IDs and maybe a profiles map or we display IDs.
    // Ideally, we fetch profiles. Let's assume we pass in a lookup or profiles list.
}

interface Player {
    user_id: string
    username: string | null
    avatar_url: string | null
}

interface OverseerInboxProps {
    reports: Report[]
    players: Player[]
    guildId: string
}

export function OverseerInbox({ reports, players, guildId }: OverseerInboxProps) {
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const selectedReport = reports.find(r => r.id === selectedReportId)
    const pendingReports = reports.filter(r => r.status === 'PENDING')

    const getPlayer = (userId: string) => players.find(p => p.user_id === userId)

    const handleAction = async (action: 'BAN' | 'DISMISS') => {
        if (!selectedReport) return
        setIsProcessing(true)
        try {
            await resolveReport(selectedReport.id, action)
            setSelectedReportId(null) // Clear selection
        } catch (error) {
            console.error('Action failed:', error)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="h-full grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Panel: The Queue */}
            <div className="md:col-span-5 flex flex-col bg-black/40 border border-white/10 backdrop-blur-md rounded-lg overflow-hidden h-full">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                        <Inbox className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-sm font-bold text-white font-orbitron tracking-wide">
                            INBOX // PENDING
                        </h3>
                    </div>
                    <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">
                        {pendingReports.length}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {pendingReports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
                            <ShieldCheck className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-xs font-mono uppercase tracking-widest">All Clear</p>
                        </div>
                    ) : (
                        pendingReports.map(report => {
                            const reportedUser = getPlayer(report.reported_id)
                            return (
                                <button
                                    key={report.id}
                                    onClick={() => setSelectedReportId(report.id)}
                                    className={cn(
                                        "w-full text-left p-3 rounded border transition-all duration-200 group relative",
                                        selectedReportId === report.id
                                            ? "bg-cyan-500/10 border-cyan-500/50"
                                            : "bg-black/20 border-white/5 hover:border-white/20"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-zinc-500 font-mono">
                                            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                                        </span>
                                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                                    </div>
                                    <div className="text-sm font-bold text-white truncate font-orbitron">
                                        {reportedUser?.username || report.reported_id}
                                    </div>
                                    <div className="text-xs text-zinc-400 truncate mt-1 pl-2 border-l-2 border-white/10 group-hover:border-cyan-500/50 transition-colors">
                                        {report.reason}
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Right Panel: The Evidence */}
            <div className="md:col-span-7 flex flex-col bg-black/40 border border-white/10 backdrop-blur-md rounded-lg overflow-hidden h-full">
                {selectedReport ? (
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-red-950/20 to-transparent">
                            <h2 className="text-xl font-bold text-white font-orbitron tracking-widest flex items-center gap-3">
                                <ShieldAlert className="w-6 h-6 text-red-500" />
                                CASE FILE #{selectedReport.id.substring(0, 8)}
                            </h2>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                            {/* Suspect Profile */}
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded border border-white/10 bg-black/50 overflow-hidden">
                                    <img
                                        src={getPlayer(selectedReport.reported_id)?.avatar_url || ''}
                                        className="w-full h-full object-cover opacity-80"
                                        alt=""
                                    />
                                </div>
                                <div>
                                    <div className="text-xs text-red-400 font-mono uppercase tracking-widest mb-1">Suspect</div>
                                    <div className="text-2xl font-bold text-white font-orbitron">
                                        {getPlayer(selectedReport.reported_id)?.username || 'Unknown User'}
                                    </div>
                                    <div className="text-xs text-zinc-600 font-mono">ID: {selectedReport.reported_id}</div>
                                </div>
                            </div>

                            <hr className="border-white/10 border-dashed" />

                            {/* Report Details */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-xs text-zinc-500 font-mono uppercase tracking-widest mb-2">Reporter</div>
                                    <div className="flex items-center gap-2 text-zinc-300">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        {getPlayer(selectedReport.reporter_id)?.username || selectedReport.reporter_id}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-zinc-500 font-mono uppercase tracking-widest mb-2">Timestamp</div>
                                    <div className="text-zinc-300 font-mono">
                                        {new Date(selectedReport.created_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-red-500/5 border border-red-500/10 p-4 rounded">
                                <div className="text-xs text-red-400 font-mono uppercase tracking-widest mb-2">Allegation</div>
                                <p className="text-zinc-200 leading-relaxed">
                                    "{selectedReport.reason}"
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-white/10 bg-white/5 flex gap-4">
                            <button
                                onClick={() => handleAction('DISMISS')}
                                disabled={isProcessing}
                                className="flex-1 py-3 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold tracking-wide transition-all border border-transparent hover:border-zinc-500 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <XCircle className="w-4 h-4" />
                                DISMISS REPORT
                            </button>
                            <button
                                onClick={() => handleAction('BAN')}
                                disabled={isProcessing}
                                className="flex-1 py-3 rounded bg-red-600 hover:bg-red-500 text-white font-bold tracking-wide transition-all shadow-[0_0_20px_-5px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <ShieldAlert className="w-4 h-4" />
                                BAN & RESOLVE
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                        <Inbox className="w-16 h-16 mb-4 opacity-20" />
                        <p className="font-mono uppercase tracking-widest text-sm">Select a report to review</p>
                    </div>
                )}
            </div>
        </div>
    )
}
