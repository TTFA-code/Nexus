import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

export function OverseerPlaceholder() {
    return (
        <Card className="h-full min-h-[500px] border-zinc-800 bg-zinc-950/50 backdrop-blur flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    <Eye className="w-12 h-12 text-blue-400 animate-pulse" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold font-orbitron tracking-wider text-blue-100">THE OVERSEER</h2>
                    <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/5">
                        INTEL MODULE
                    </Badge>
                </div>

                <p className="max-w-md text-zinc-400 text-sm leading-relaxed">
                    Advanced analytics and surveillance systems are currently offline for maintenance.
                    Initialize connection to access operative data streams.
                </p>

                <div className="mt-8 font-mono text-xs text-blue-500/50">
                    SYSTEM_STATUS: <span className="text-yellow-500/70">PENDING_ACTIVATION</span>
                </div>
            </div>
        </Card>
    );
}
