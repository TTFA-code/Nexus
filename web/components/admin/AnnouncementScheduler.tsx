'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar as CalendarIcon, Megaphone, Clock } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function AnnouncementScheduler({ guildId }: { guildId: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')

    async function handleSchedule() {
        if (!message) return
        setIsLoading(true)

        // Mock API call to bot
        console.log("Scheduling announcement for guild", guildId, message)
        await new Promise(resolve => setTimeout(resolve, 1000))

        setIsLoading(false)
        setMessage('')
        alert("Announcement Scheduled!")
    }

    return (
        <Card className="bg-black/40 border-purple-500/20 backdrop-blur-md h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-400 font-orbitron tracking-wider">
                    <Megaphone className="h-5 w-5" />
                    DISCORD UPLINK
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
                <div className="flex-1">
                    <Label className="mb-2 block">Announcement Message</Label>
                    <textarea
                        className="w-full h-32 bg-white/5 border border-white/10 rounded-md p-3 text-sm focus:ring-1 focus:ring-purple-500 outline-none resize-none text-white placeholder:text-zinc-500"
                        placeholder="Type your message here... (@everyone not recommmended)"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Schedule</Label>
                        <div className="relative">
                            <Input
                                type="datetime-local"
                                className="bg-white/5 border-white/10 pl-10 text-white"
                            />
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        </div>
                    </div>
                    <div className="space-y-2 flex flex-col justify-end">
                        <Button
                            onClick={handleSchedule}
                            disabled={isLoading || !message}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {isLoading ? "UPLOADING..." : "SCHEDULE SEND"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
