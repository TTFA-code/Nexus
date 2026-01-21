'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, User } from 'lucide-react';

interface QueueDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    queueData: any; // The specific game mode and its current queue entries
}

export function QueueDetailsModal({ isOpen, onClose, queueData }: QueueDetailsModalProps) {
    if (!queueData) return null;

    const { mode, players } = queueData;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-black/60 backdrop-blur-xl border-white/10 text-white shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-bold">{mode.name}</DialogTitle>
                        <Badge variant="outline" className="border-[#ccff00]/50 text-[#ccff00]">
                            {players.length} / {mode.team_size * 2}
                        </Badge>
                    </div>
                    <DialogDescription className="text-zinc-400">
                        Current players in queue for this protocol.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-4">
                    {/* Map Info (Placeholder) */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm">
                        <span className="text-zinc-500">Map Rotation:</span> <span className="text-white font-medium">Standard Competitive</span>
                    </div>

                    {/* Player List */}
                    <div>
                        <h4 className="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Active Players
                        </h4>
                        <div className="grid gap-2">
                            {players.length === 0 ? (
                                <div className="text-center py-8 text-zinc-600 italic">
                                    No players currently in queue.
                                </div>
                            ) : (
                                players.map((player: any) => (
                                    <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10">
                                        <Avatar className="h-8 w-8 border border-white/10">
                                            {/* Note: In a real scenario we'd need to fetch player details (avatar/name) from the players table based on user_id in queue */}
                                            {/* For now, we might not have that data joined in the queue status API. We should probably update the API to return player details. */}
                                            {/* Placeholder for now since the API only returns raw queue rows */}
                                            <AvatarFallback className="bg-zinc-800 text-zinc-400">
                                                <User className="w-4 h-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-sm font-medium text-white">
                                            {/* Logic to show name would go here. For now, showing masked ID */}
                                            Player {player.user_id.slice(0, 4)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
