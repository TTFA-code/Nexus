import Link from 'next/link';
import { Hand } from 'lucide-react';

export default function AccessDeniedPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-red-500 p-4">
            <div className="flex flex-col items-center space-y-6 text-center animate-pulse">
                <Hand className="w-32 h-32" />
                <h1 className="text-4xl md:text-6xl font-black tracking-widest uppercase glitch-effect">
                    Access Denied
                </h1>
                <p className="text-xl md:text-2xl font-mono border-t-2 border-b-2 border-red-500 py-2">
                    SECTOR COMMANDERS ONLY
                </p>
            </div>

            <div className="mt-12">
                <Link
                    href="/dashboard"
                    style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
                    className="px-8 py-3 bg-red-900/20 border border-red-500 text-red-400 hover:bg-red-500 hover:text-black transition-all duration-300 font-bold uppercase tracking-wider"
                >
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
}
