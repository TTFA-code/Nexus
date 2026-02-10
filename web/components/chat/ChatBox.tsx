"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatBoxProps {
    channelId: string; // The Lobby ID or Match ID
    type: "lobby" | "match";
    currentUserId: string; // Discord ID
    className?: string;
}

interface Message {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    sender?: {
        username: string;
        avatar_url: string | null;
    };
}

export function ChatBox({ channelId, type, currentUserId, className }: ChatBoxProps) {
    const supabase = createClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch initial messages
    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await (supabase as any)
                .from("messages")
                .select(`
                    id, content, created_at, user_id,
                    sender:players!messages_user_id_fkey(username, avatar_url)
                `)
                .eq(type === "lobby" ? "lobby_id" : "match_id", channelId)
                .order("created_at", { ascending: true })
                .limit(50); // Initial load limit

            if (data) {
                // Determine sender structure (array or single object depending on relation)
                // Assuming One-to-One FK resolution returns object, but TS might need help
                const formatted = data.map((d: any) => ({
                    ...d,
                    sender: Array.isArray(d.sender) ? d.sender[0] : d.sender
                }));
                setMessages(formatted);
            }
            setLoading(false);
        };

        fetchMessages();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`chat:${channelId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `${type === "lobby" ? "lobby_id" : "match_id"}=eq.${channelId}`,
                },
                async (payload) => {
                    // Fetch sender info for the new message
                    const { data: senderData } = await supabase
                        .from("players")
                        .select("username, avatar_url")
                        .eq("user_id", payload.new.user_id)
                        .single();

                    const newMsg: Message = {
                        id: payload.new.id,
                        content: payload.new.content,
                        created_at: payload.new.created_at,
                        user_id: payload.new.user_id,
                        sender: {
                            username: senderData?.username || "Unknown",
                            avatar_url: senderData?.avatar_url || null
                        },
                    };

                    setMessages((prev) => [...prev, newMsg]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [channelId, type, supabase]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage.trim();
        setNewMessage(""); // Optimistic clear

        // Optimistic UI update (optional, but real-time covers it fast)
        // ...

        const { error } = await (supabase as any)
            .from("messages")
            .insert({
                [type === "lobby" ? "lobby_id" : "match_id"]: channelId,
                user_id: currentUserId,
                content: content,
            });

        if (error) {
            console.error("Failed to send message:", error);
            // Ideally show toast or revert optimistic update
        }
    };

    return (
        <div className={cn("flex flex-col bg-black/80 border border-white/10 rounded-xl backdrop-blur-md overflow-hidden shadow-2xl", className)}>
            {/* Header */}
            <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-zinc-400" />
                    <span className="text-[10px] font-bold text-zinc-300 tracking-widest uppercase font-orbitron">
                        {type === "lobby" ? "SQUAD COMMS" : "MATCH COMMS"}
                    </span>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)] animate-pulse" />
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent min-h-[200px]"
            >
                {loading && (
                    <div className="text-center text-[10px] text-zinc-500 animate-pulse mt-4 font-mono">
                        ESTABLISHING SECURE UPLINK...
                    </div>
                )}

                {!loading && messages.length === 0 && (
                    <div className="text-center text-[10px] text-zinc-600 italic mt-4">
                        Channel clear. Minimize chatter.
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.user_id === currentUserId;
                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex gap-2 max-w-[90%]",
                                isMe ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            <Avatar className="w-6 h-6 border border-white/10">
                                <AvatarImage src={msg.sender?.avatar_url || ""} />
                                <AvatarFallback className="bg-zinc-800 text-[8px] text-zinc-500">
                                    {msg.sender?.username?.substring(0, 2).toUpperCase() || "??"}
                                </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                                "flex flex-col",
                                isMe ? "items-end" : "items-start"
                            )}>
                                <span className="text-[9px] text-zinc-500 mb-0.5 px-1">
                                    {msg.sender?.username || "Unknown"}
                                </span>
                                <div
                                    className={cn(
                                        "px-2 py-1.5 rounded-lg text-xs break-words shadow-sm",
                                        isMe
                                            ? "bg-blue-600/30 text-blue-100 border border-blue-500/30 rounded-tr-none"
                                            : "bg-zinc-800/80 text-zinc-300 border border-white/5 rounded-tl-none"
                                    )}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <form
                onSubmit={handleSendMessage}
                className="p-2 border-t border-white/5 bg-black/20 flex gap-2 items-center"
            >
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Transmitting..."
                    className="bg-zinc-900/50 border-white/10 text-zinc-200 focus:border-blue-500/50 h-8 text-xs font-mono"
                />
                <Button
                    type="submit"
                    size="sm"
                    disabled={!newMessage.trim()}
                    className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.2)]"
                >
                    <Send className="w-3 h-3" />
                </Button>
            </form>
        </div>
    );
}
