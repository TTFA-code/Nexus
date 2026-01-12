import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Book, Plus } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #0f172a 0%, #020617 50%, #000000 100%)' }}>

      {/* Optional: Ambient Glare */}
      <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-slate-800/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-screen" />

      {/* Main Content */}
      <div className="z-10 flex flex-col items-center text-center space-y-4">
        {/* Title */}
        <h1 className="text-7xl md:text-9xl font-extrabold tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-in fade-in zoom-in duration-1000 ease-out font-sans">
          NEXUS
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-slate-400 font-light tracking-wide animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          The Ultimate Competitive Companion
        </p>

        {/* Buttons */}
        <div className="flex flex-col md:flex-row gap-4 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <Button asChild className="rounded-full px-8 py-7 text-lg bg-[#5865F2] hover:bg-[#4752C4] shadow-[0_0_20px_rgba(88,101,242,0.4)] transition-all hover:scale-105 active:scale-95 text-white">
            <Link href="/login">
              Login with Discord
            </Link>
          </Button>

          <Button asChild variant="outline" className="rounded-full px-8 py-7 text-lg border-white/20 text-white hover:bg-white/10 hover:border-white/50 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all bg-transparent">
            <Link href="#">
              <Plus className="mr-2 h-5 w-5" />
              Invite Bot
            </Link>
          </Button>

          <Button asChild variant="ghost" className="rounded-full px-8 py-7 text-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <Link href="#">
              <Book className="mr-2 h-5 w-5" />
              Documentation
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
