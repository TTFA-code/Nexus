'use client'

import { useState } from 'react'
import { toggleGuildBan } from '@/actions/manageBans'
import { AlertTriangle, Ban, User, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Player {
    username: string | null
    avatar_url: string | null
    user_id: string
}

interface Report {
    id: string
    reason: string
    details: string | null
    status: string
    created_at: string
    reporter_id: string
    reported_id: string
    reporter: Player | null
    reported: Player | null
}

interface IncidentReportsProps {
    reports: Report[]
    guildId: string
}

export function IncidentReports({ reports, guildId }: IncidentReportsProps) {
    const [processingId, setProcessingId] = useState<string | null>(null)

    const handleBan = async (userId: string, reportId: string) => {
        if (!confirm('WARNING: confirming this action will blacklist the operative from all sector operations. Proceed?')) return

        setProcessingId(reportId)
        try {
            await toggleGuildBan(guildId, userId, "Result of Incident Report")
            alert('Target has been blacklisted.')
            // Ideally we also update report status to RESOLVED here, but that action wasn't provided in the prompt.
            // I'll stick to the requested "BAN" button. 
        } catch (error) {
            console.error('Ban failed:', error)
            alert('Failed to execute ban order.')
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <div className="space-y-4 mt-8">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/10 rounded border border-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white font-orbitron tracking-wide">
                        INCIDENT REPORTS
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest">
                        COMMAND DESK INBOX
                    </p>
                </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                            <th className="p-4 font-normal">Reporter</th>
                            <th className="p-4 font-normal">Reported Entity</th>
                            <th className="p-4 font-normal">Reason / Details</th>
                            <th className="p-4 font-normal text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {reports.map((report) => (
                            <tr key={report.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 overflow-hidden flex items-center justify-center">
                                            {report.reporter?.avatar_url ? (
                                                <img src={report.reporter.avatar_url} alt="Reporter" />
                                            ) : (
                                                <User className="w-4 h-4 text-zinc-500" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">{report.reporter?.username || 'Unknown'}</div>
                                            <div className="text-[10px] text-zinc-500 font-mono">{report.reporter_id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 overflow-hidden flex items-center justify-center">
                                            {report.reported?.avatar_url ? (
                                                <img src={report.reported.avatar_url} alt="Reported" />
                                            ) : (
                                                <User className="w-4 h-4 text-red-500" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-red-400">{report.reported?.username || 'Unknown'}</div>
                                            <div className="text-[10px] text-red-500/50 font-mono">{report.reported_id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-bold text-white badge badge-outline">{report.reason}</span>
                                        {report.details && (
                                            <span className="text-xs text-zinc-400 line-clamp-2">{report.details}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => handleBan(report.reported_id, report.id)}
                                        disabled={!!processingId}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/60 text-red-500 text-[10px] font-bold tracking-widest uppercase rounded transition-all"
                                    >
                                        {processingId === report.id ? (
                                            <span className="animate-pulse">EXEC...</span>
                                        ) : (
                                            <>
                                                <Ban className="w-3 h-3" />
                                                BAN
                                            </>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {reports.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-zinc-500 font-mono text-xs uppercase tracking-widest">
                                    No active incidents reported.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
