import Link from 'next/link'
import { AlertTriangle, Home, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AccessDeniedPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">

            {/* Red Alert Background Effects */}
            <div className="absolute inset-0 bg-red-950/20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000000_100%)]" />
            <div className="absolute w-full h-[2px] bg-red-500/20 top-1/2 -translate-y-1/2 animate-pulse" />

            <div className="relative z-10 max-w-lg w-full text-center space-y-8 p-8 border border-red-500/30 bg-black/80 backdrop-blur-xl rounded-2xl shadow-[0_0_100px_rgba(220,38,38,0.2)]">

                {/* Icon */}
                <div className="mx-auto w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.4)] animate-pulse">
                    <ShieldAlert className="w-12 h-12 text-red-500" />
                </div>

                {/* Text */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-white font-orbitron tracking-wider">
                        ACCESS DENIED
                    </h1>
                    <div className="h-0.5 w-24 bg-red-500 mx-auto" />
                    <p className="text-red-400 font-mono text-sm tracking-wide uppercase">
                        UNAUTHORIZED ACCESS DETECTED
                    </p>
                    <p className="text-zinc-500 text-sm">
                        This terminal is restricted to Nexus Administrators for this sector.
                        Your credentials have been logged and reported.
                    </p>
                </div>

                {/* Action */}
                <div className="pt-4">
                    <Link href="/dashboard/play">
                        <Button className="w-full h-12 bg-red-600 hover:bg-red-500 text-white font-bold tracking-widest font-orbitron shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:scale-105">
                            <Home className="w-4 h-4 mr-2" />
                            RETURN TO ARENA
                        </Button>
                    </Link>
                </div>

                {/* Decor */}
                <div className="absolute top-4 left-4">
                    <AlertTriangle className="w-4 h-4 text-red-900/50" />
                </div>
                <div className="absolute bottom-4 right-4">
                    <AlertTriangle className="w-4 h-4 text-red-900/50" />
                </div>
            </div>
        </div>
    )
}
