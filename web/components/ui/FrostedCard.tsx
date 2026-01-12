import React from "react";
import { cn } from "@/lib/utils";

interface FrostedCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    isActive?: boolean; // For highlighting active states (e.g. queue)
}

export function FrostedCard({ children, className, isActive, ...props }: FrostedCardProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-3xl transition-all duration-300 group",
                // Base Glass Style
                "bg-black/40 backdrop-blur-md border border-white/10",
                // Depth Shadow
                "shadow-[0_4px_30px_rgba(0,0,0,0.5)]",
                // Active State (Neon Glow)
                isActive && "border-cyber-cyan/30 shadow-[0_0_20px_-5px_rgba(0,243,255,0.3)]",
                className
            )}
            {...props}
        >
            {/* Top Gloss Highlight (Specular Reflection) */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

            {/* Hover Glare Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Content Buffer */}
            <div className="relative z-10 h-full">
                {children}
            </div>
        </div>
    );
}
