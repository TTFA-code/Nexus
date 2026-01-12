'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { joinLobby, leaveLobby } from '@/actions/lobbyActions'
import { Loader2, UserPlus, LogOut, Ban, Lock } from 'lucide-react'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'

interface JoinButtonProps {
    lobbyId: string
    currentPlayers: number
    maxPlayers: number
    isUserJoined: boolean
    onJoin?: (lobbyId: string) => void
    isPrivate?: boolean
    onPrivateAccess?: () => void
}

export function JoinButton({ lobbyId, currentPlayers, maxPlayers, isUserJoined, isAuthenticated, onJoin, isPrivate, onPrivateAccess }: JoinButtonProps & { isAuthenticated: boolean }) {
    const [isPending, startTransition] = useTransition()
    const [showLoginDialog, setShowLoginDialog] = useState(false)

    const isFull = currentPlayers >= maxPlayers

    const handleAction = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()

        if (!isAuthenticated) {
            setShowLoginDialog(true)
            return
        }

        // Private Sector Interception
        if (isPrivate && !isUserJoined && onPrivateAccess) {
            onPrivateAccess()
            return
        }

        startTransition(async () => {
            try {
                const result = isUserJoined
                    ? await leaveLobby(lobbyId)
                    : await joinLobby(lobbyId)

                if (!result?.success) {
                    throw new Error(result?.message || 'Operation failed')
                }

                toast.success(isUserJoined ? "Left Lobby" : "Joined Lobby", {
                    description: isUserJoined ? "You have aborted the mission." : "You have joined the operation.",
                })

                if (!isUserJoined && onJoin) {
                    onJoin(lobbyId.toString());
                }

            } catch (error: any) {
                toast.error("Action Failed", {
                    description: error.message || "Something went wrong.",
                })
            }
        })
    }

    if (showLoginDialog) {
        return (
            <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                {/* Trigger is handled manually */}
                <div onClick={(e) => e.stopPropagation()}>
                    <DialogContent className="bg-black/90 border-red-500/30 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-red-500 flex items-center gap-2">
                                <Lock className="w-5 h-5" />
                                ACCESS DENIED
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-4 text-zinc-400">
                            Authentication required to join operations. Please log in to proceed.
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setShowLoginDialog(false)} variant="ghost" className="text-zinc-500 hover:text-white">
                                DISMISS
                            </Button>
                            {/* Redirect to login? For now just simple close */}
                            <Button
                                onClick={() => window.location.href = '/login'} // Assuming /login exists or handled elsewhere
                                className="bg-red-500 text-white hover:bg-red-600 font-bold"
                            >
                                LOGIN
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </div>
                {/* Render the button underneath normally */}
                <Button
                    onClick={handleAction}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-orbitron font-bold tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-500/20"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>ENTER SECTOR</span>
                </Button>
            </Dialog>
        )
    }

    if (isUserJoined) {
        return (
            <Button
                onClick={handleAction}
                disabled={isPending}
                className="w-full bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500/10 font-bold transition-all flex items-center justify-center gap-2"
            >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                <span>{isPending ? 'PROCESSING...' : 'ABORT / LEAVE'}</span>
            </Button>
        )
    }

    if (isFull && !isUserJoined) {
        return (
            <Button
                disabled
                className="w-full bg-zinc-800 text-zinc-500 border border-zinc-700 font-bold flex items-center justify-center gap-2 cursor-not-allowed"
            >
                <Ban className="w-4 h-4" />
                <span>FULL CAPACITY</span>
            </Button>
        )
    }

    return (
        <>
            <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <DialogContent className="bg-black/90 border-red-500/30 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-500 flex items-center gap-2 font-orbitron tracking-wider">
                            <Lock className="w-5 h-5" />
                            SECURITY PROTOCOL
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 text-zinc-400 font-mono text-sm leading-relaxed">
                        <p className="mb-2 text-white font-bold">UNAUTHORIZED ACCESS ATTEMPT DETECTED.</p>
                        <p>You must establish a secure uplink (Login) before joining tactical operations.</p>
                    </div>
                    <DialogFooter className="flex gap-2 sm:justify-end">
                        <Button onClick={() => setShowLoginDialog(false)} variant="ghost" className="text-zinc-500 hover:text-white font-mono text-xs">
                            ACKNOWLEDGE
                        </Button>
                        {/* Link to login is usually external or a specific route. I'll assume /login for now or just a generic prompt */}
                        <a href="/login" className="w-full sm:w-auto">
                            <Button className="w-full bg-red-500 text-black hover:bg-red-400 font-bold font-orbitron tracking-wide">
                                ESTABLISH UPLINK
                            </Button>
                        </a>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Button
                onClick={handleAction}
                disabled={isPending}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-orbitron font-bold tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] border border-blue-500/20"
            >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>{isPending ? 'CONNECTING...' : 'ENTER SECTOR'}</span>
            </Button>
        </>
    )
}
