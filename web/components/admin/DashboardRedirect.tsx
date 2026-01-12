'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Disc } from 'lucide-react'

export function DashboardRedirect({ to }: { to: string }) {
    const router = useRouter()

    useEffect(() => {
        router.replace(to)
    }, [to, router])

    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
            <div className="flex flex-col items-center gap-4 text-zinc-500 animate-pulse">
                <Disc className="h-8 w-8 animate-spin" />
                <p className="text-sm font-mono tracking-widest uppercase">Redirecting to Dashboard...</p>
            </div>
        </div>
    )
}
