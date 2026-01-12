'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface PageHeaderProps {
    title: string;
    subtitle: string;
    backHref?: string;
    children?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, subtitle, backHref, children, action, className }: PageHeaderProps) {
    const router = useRouter();

    const handleBack = () => {
        if (backHref) {
            router.push(backHref);
        } else {
            router.back();
        }
    };

    return (
        <div className={cn("p-8 pb-0", className)}>
            <div className="flex items-center gap-6 mb-8">
                <button
                    onClick={handleBack}
                    className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all group"
                >
                    <ArrowLeft className="w-5 h-5 text-zinc-400 group-hover:text-white" />
                </button>
                <div>
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                        {title}
                    </h1>
                    <p className="text-zinc-500 text-sm font-light tracking-wide uppercase">{subtitle}</p>
                </div>
                {action && <div className="ml-auto">{action}</div>}
            </div>
            {children}
        </div>
    );
}
