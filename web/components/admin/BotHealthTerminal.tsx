'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Terminal, Activity, Wifi } from 'lucide-react'

export function BotHealthTerminal() {
    const [logs, setLogs] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        // Initial Fetch
        const fetchInitial = async () => {
            const { data } = await supabase
                .from('lobbies')
                .select('id, game_modes:game_mode_id(name), creator:creator_id(username)')
                .order('created_at', { ascending: false })
                .limit(5)

            if (data) {
                const initLogs = data.map((l: any) => ({
                    type: 'event',
                    msg: `[Lobby] Created ID #${l.id.slice(0, 8)} (${l.game_modes?.name})`,
                    time: new Date().toLocaleTimeString()
                }))
                setLogs(prev => [...initLogs, ...prev])
            }
        }

        fetchInitial()

        // Realtime Subscription
        const channel = supabase
            .channel('lobby_monitor')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'lobbies' },
                async (payload) => {
                    // Fetch details for the new lobby (need game mode name)
                    const { data: details } = await supabase
                        .from('lobbies')
                        .select('game_modes:game_mode_id(name))')
                        .eq('id', payload.new.id)
                        .single()

                    const gameName = details?.game_modes?.name || 'Unknown Protocol'
                    const uuidShort = payload.new.id.slice(0, 8)

                    const newLog = {
                        type: 'event',
                        msg: `[Lobby] Created ID #${uuidShort} (${gameName})`,
                        time: new Date().toLocaleTimeString()
                    }
                    setLogs(prev => [...prev.slice(-8), newLog])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return (
        <Card className="bg-black/90 border-green-500/20 backdrop-blur-md h-full flex flex-col font-mono">
            <CardHeader className="py-3 border-b border-white/5 flex flex-row items-start justify-between pb-2">
                <div className="flex flex-col gap-1">
                    <CardTitle className="flex items-center gap-2 text-green-500 text-sm tracking-widest uppercase">
                        <Terminal className="h-4 w-4" />
                        NEXUS_TERMINAL_V2.0
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            ONLINE
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-zinc-600 text-xs text-[10px] font-mono">LIVE FEED</span>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <div className="absolute inset-0 p-4 font-mono text-xs overflow-y-auto custom-scrollbar space-y-1">
                    {logs.map((log, i) => (
                        <div key={i} className="flex gap-3">
                            <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                            <span className={
                                log.type === 'success' ? 'text-green-400' :
                                    log.type === 'event' ? 'text-blue-400' :
                                        'text-zinc-300'
                            }>
                                {log.type === 'event' && '> '}
                                {log.msg}
                            </span>
                        </div>
                    ))}
                    <div className="animate-pulse text-green-500">_</div>
                </div>
            </CardContent>
        </Card>
    )
}
