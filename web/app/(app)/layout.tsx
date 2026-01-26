import { CircuitBoardBackground } from "@/components/ui/CircuitBoardBackground"
import { GlitchSidebar } from "@/components/ui/GlitchSidebar"
import { MobileNav } from "@/components/ui/MobileNav"
import { AdminFloatingHub } from "@/components/admin/AdminFloatingHub"

import { QueueProvider } from "@/components/lobby/QueueSystem";

export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <QueueProvider>
            <div className="relative min-h-screen w-full font-sans text-white bg-transparent flex flex-col lg:flex-row">
                {/* Background Layer */}
                <CircuitBoardBackground />

                {/* Glitch Sidebar (Desktop Navigation) */}
                <GlitchSidebar />

                {/* Mobile Navigation (Bottom Bar) */}
                <MobileNav />

                {/* Main Content Area */}
                <main className="flex-1 h-screen overflow-y-auto relative z-10 p-4 md:p-8 pb-20 lg:pb-8">
                    {children}
                </main>

                {/* Global Admin Hub */}
                <AdminFloatingHub />
            </div>
        </QueueProvider>
    );
}
