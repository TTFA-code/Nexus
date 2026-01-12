
import { LobbyWorkspace } from '@/components/lobby/LobbyWorkspace';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function LobbyPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div className="p-10 bg-red-900 text-white">REDIRECT BLOCKED IN: LobbyPage</div>;
        // redirect('/login');
    }

    const { id } = await params; // Next.js 15+ convention for param access

    return (
        <div className="p-8 h-[calc(100vh-4rem)] max-w-7xl mx-auto">
            <LobbyWorkspace
                lobbyId={id}
                currentUserId={user.id}
            />
        </div>
    );
}
