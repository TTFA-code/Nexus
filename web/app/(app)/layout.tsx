import { CircuitBoardBackground } from "@/components/ui/CircuitBoardBackground"
import { GlitchSidebar } from "@/components/ui/GlitchSidebar"
import { AdminFloatingHub } from "@/components/admin/AdminFloatingHub"

export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="relative min-h-screen w-full font-sans text-white bg-transparent flex">
            {/* Background Layer */}
            <CircuitBoardBackground />

            {/* Glitch Sidebar (Navigation) */}
            <GlitchSidebar />

            {/* Main Content Area */}
            <main className="flex-1 h-screen overflow-y-auto relative z-10 p-4 md:p-8">
                {children}
            </main>

            {/* Global Admin Hub */}
            <AdminFloatingHub />
        </div>
    );
}
