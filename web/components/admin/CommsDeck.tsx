'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Megaphone, Radio, Loader2, Send, Hash } from 'lucide-react'
import { sendBroadcast } from '@/actions/sendBroadcast'
import { toast } from 'sonner'

interface Channel {
    id: string;
    name: string;
}

export function CommsDeck({ guildId, channels }: { guildId: string; channels: Channel[] }) {
    const [isLoading, setIsLoading] = useState(false)
    const [channelId, setChannelId] = useState('')
    const [title, setTitle] = useState('')
    const [message, setMessage] = useState('')

    // Default to first channel if available and not set
    useEffect(() => {
        if (channels.length > 0 && !channelId) {
            setChannelId(channels[0].id)
        }
    }, [channels, channelId])

    async function handleTransmit() {
        if (!channelId || !title || !message) {
            toast.error("All fields are required.")
            return
        }

        setIsLoading(true)

        try {
            const res = await sendBroadcast({ guildId, channelId, title, message })

            if (res.success) {
                toast.success("Transmission Sent Successfully")
                // Clear form but keep channel
                setTitle('')
                setMessage('')
            }
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : "Transmission Failed")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="bg-black/40 border-purple-500/20 backdrop-blur-md h-full flex flex-col relative overflow-hidden group">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                <Radio className="w-24 h-24 text-purple-500" />
            </div>

            <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="flex items-center gap-3 text-purple-400 font-orbitron tracking-wider text-xl">
                    <Megaphone className="h-6 w-6" />
                    COMMS DECK // BROADCAST
                </CardTitle>
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">
                    Authorized Personnel Only
                </p>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-6 pt-6">

                {/* Channel Selector */}
                <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-widest">Target Frequency</Label>
                    <Select value={channelId} onValueChange={setChannelId}>
                        <SelectTrigger className="bg-black/40 border-purple-500/30 text-purple-100 font-mono focus:ring-purple-500/50">
                            <SelectValue placeholder="Select Frequency..." />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-purple-500/20 text-zinc-300">
                            {channels.map((ch) => (
                                <SelectItem key={ch.id} value={ch.id} className="focus:bg-purple-500/20 focus:text-purple-100 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <Hash className="w-3 h-3 text-zinc-500" />
                                        {ch.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Content Payload */}
                <div className="space-y-4 flex-1">
                    <div className="space-y-2">
                        <Label className="text-zinc-400 text-xs uppercase tracking-widest">Headline (Title)</Label>
                        <Input
                            className="bg-white/5 border-white/10 text-white font-bold tracking-wide focus:border-purple-400 transition-all"
                            placeholder="IMPORTANT ANNOUNCEMENT"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 flex-1 flex flex-col h-full">
                        <Label className="text-zinc-400 text-xs uppercase tracking-widest">Message Body</Label>
                        <Textarea
                            className="flex-1 min-h-[150px] bg-white/5 border-white/10 text-zinc-300 resize-none focus:border-purple-400 transition-all"
                            placeholder="Enter transmission content..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                </div>

            </CardContent>

            <CardFooter className="pt-4 border-t border-white/5">
                <Button
                    onClick={handleTransmit}
                    disabled={isLoading || !channelId || !title || !message}
                    className={`w-full h-12 text-lg font-bold tracking-widest transition-all duration-300 ${isLoading
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)] hover:shadow-[0_0_30px_-5px_rgba(147,51,234,0.7)]'
                        }`}
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            TRANSMITTING...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Send className="w-5 h-5" />
                            TRANSMIT BROADCAST
                        </span>
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
