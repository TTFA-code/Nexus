"use client"

import { cn } from "@/lib/utils"

interface WinRateRingProps {
    percentage: number
    size?: number
    strokeWidth?: number
    className?: string
}

export function WinRateRing({ percentage, size = 120, strokeWidth = 10, className }: WinRateRingProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    return (
        <div className={cn("relative flex items-center justify-center", className)}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-zinc-800"
                />
                {/* Progress Ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="text-primary drop-shadow-[0_0_10px_rgba(204,255,0,0.5)] transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold font-heading neon-text-gradient">{percentage}%</span>
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Win Rate</span>
            </div>
        </div>
    )
}
