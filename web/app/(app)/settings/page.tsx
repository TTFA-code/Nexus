'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { PageHeader } from "@/components/ui/PageHeader";
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f]/50 backdrop-blur-md text-white">
            <PageHeader title="Settings" subtitle="USER PREFERENCES" />

            <div className="p-8 max-w-2xl">
                <div className="space-y-6">
                    {/* Account Section */}
                    <div className="rounded-lg border border-white/10 bg-black/20 p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-cyber-cyan" />
                            Account
                        </h3>

                        <div className="space-y-4">
                            <p className="text-zinc-400 text-sm">
                                Manage your account session and settings.
                            </p>

                            <Button
                                variant="destructive"
                                onClick={handleLogout}
                                className="w-full sm:w-auto gap-2 font-bold tracking-wide"
                            >
                                <LogOut className="w-4 h-4" />
                                SIGN OUT
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
