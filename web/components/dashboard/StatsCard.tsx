import React from 'react';
import { LucideIcon } from 'lucide-react';
import { FrostedCard } from '@/components/ui/FrostedCard';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    color?: 'peach' | 'pink' | 'blue'; // Variants
}

export function StatsCard({ title, value, icon: Icon, trend, color = 'blue' }: StatsCardProps) {
    const colorStyles = {
        peach: "bg-[#FFDAC1]/20 border-[#FFDAC1]/20 text-[#FFDAC1]",
        pink: "bg-[#E2CBF0]/20 border-[#E2CBF0]/20 text-[#E2CBF0]",
        blue: "bg-[#C7D9F0]/20 border-[#C7D9F0]/20 text-[#C7D9F0]",
    }

    return (
        <FrostedCard className={cn("p-6 flex flex-col justify-between h-40", colorStyles[color])}>
            <div className="flex justify-between items-start">
                <div className={cn("p-3 rounded-xl bg-white/5 backdrop-blur-sm")}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <span className="text-xs font-mono font-bold px-2 py-1 rounded-full bg-black/30 border border-white/10">
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1 block">
                    {title}
                </span>
                <div className="text-4xl font-heading font-bold tracking-tight">
                    {value}
                </div>
            </div>
        </FrostedCard>
    );
}
