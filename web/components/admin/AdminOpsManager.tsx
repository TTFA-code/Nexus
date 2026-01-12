'use client'

import React, { useState, useEffect } from 'react'
import { TournamentCreator } from './TournamentCreator'
import { ActiveOps } from './ActiveOps'
import { getActiveLobbies } from '@/actions/getAdminIntel'
import { createClient } from '@/utils/supabase/client'

interface AdminOpsManagerProps {
    initialLobbies: any[]
    guildId: string
    gameModes: any[]
    customModes: any[]
    children?: React.ReactNode;
}

export function AdminOpsManager({ initialLobbies, guildId, gameModes, customModes }: AdminOpsManagerProps) {
    const [lobbies, setLobbies] = useState(initialLobbies)
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase
            .channel('admin-ops-manager')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'lobbies'
                },
                async () => {
                    // Refresh data on any lobby change
                    const freshData = await getActiveLobbies(guildId)
                    setLobbies(freshData)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [guildId])

    const handleLobbyCreated = (newLobby: any) => {
        // Immediate optimisitic update (or distinct update locally)
        // Since we are creating a tournament, we want it to show up instantly.
        // The API returns the lobby object. We might need to ensure it matches the shape of ActiveLobby.
        // For now, let's assume it does or is close enough, or we re-fetch if needed.
        // But the prompt specifically asked for: setLobbies(prev => [data[0], ...prev])
        setLobbies(prev => [newLobby, ...prev])
    }

    const handleForceClose = (lobbyId: string) => {
        setLobbies(prev => prev.filter(l => l.id !== lobbyId))
    }

    const allModes = [...gameModes, ...customModes]

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
            <div className="md:col-span-5 h-full">
                <TournamentCreator
                    gameModes={allModes}
                    guildId={guildId}
                    onCreated={handleLobbyCreated}
                />
            </div>
            <div className="md:col-span-7 h-full flex flex-col gap-6">
                <ActiveOps
                    lobbies={lobbies}
                    guildId={guildId}
                    onForceClose={handleForceClose}
                />
            </div>
        </div>
    )
}
