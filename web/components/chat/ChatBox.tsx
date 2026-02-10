"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Track unread messages
    useEffect(() => {
        if (!isOpen && messages.length > 0) {
            // Simple logic: if closed and messages exist/update, show dot.
            // Ideally track last read timestamp, but for now just toggle on new message if closed.
            setHasUnread(true);
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen) setHasUnread(false);
    }, [isOpen]);


    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage.trim();
        setNewMessage(""); // Optimistic clear

        const { error } = await (supabase as any)
            .from("messages")
            .insert({
                [type === "lobby" ? "lobby_id" : "match_id"]: channelId,
                user_id: currentUserId, // This should be the player.user_id (Discord ID)
                content: content,
            });

        if (error) {
            console.error("Failed to send message:", error);
            toast.error("Transmission Failed");
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "bg-black/80 backdrop-blur-md border border-white/20 text-white rounded-full h-12 w-12 p-0 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all hover:scale-110",
                    hasUnread ? "border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]" : "",
                    className
                )}
            >
                <div className="relative">
                    <MessageSquare className={cn("w-5 h-5", hasUnread ? "text-green-400" : "text-zinc-400")} />
                    {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]" />
                    )}
                </div>
            </Button>
        );
    }

    return (
        <div className={cn(
            "flex flex-col bg-black/90 border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-300",
            // Mobile: Full screen or large bottom sheet. Desktop: Fixed widget.
            "fixed bottom-0 right-0 w-full h-[50vh] md:h-[400px] md:w-96 md:bottom-20 md:right-6 md:rounded-2xl rounded-t-2xl z-50",
            className
        )}>
            {/* Header */}
            <div
                className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between cursor-pointer"
                onClick={() => setIsOpen(false)}
            >
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-zinc-400" />
                    <span className="text-[10px] font-bold text-zinc-300 tracking-widest uppercase font-orbitron">
                        {type === "lobby" ? "SQUAD COMMS" : "MATCH COMMS"}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)] animate-pulse" />
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-500 hover:text-white" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                        <span className="sr-only">Close</span>
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.1929 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.1929 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent bg-black/50"
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
                            <Avatar className="w-6 h-6 border border-white/10 shrink-0">
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
                                        "px-3 py-2 rounded-lg text-sm break-words shadow-sm",
                                        isMe
                                            ? "bg-blue-600 text-blue-100 border border-blue-500/30 rounded-tr-none"
                                            : "bg-zinc-800 text-zinc-300 border border-white/5 rounded-tl-none"
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
                className="p-3 border-t border-white/10 bg-black/40 flex gap-2 items-center"
            >
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Transmitting..."
                    className="bg-zinc-900/50 border-white/10 text-zinc-200 focus:border-blue-500/50 h-10 text-sm font-mono"
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim()}
                    className="h-10 w-10 shrink-0 bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.2)]"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </form>
        </div>
    );
}
