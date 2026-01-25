'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteLobby(lobbyId: string) {
    const supabase = await createClient();

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Unauthorized');
    }

    // 2. Security: Verify Ownership
    // Get Discord ID to match lobbies.creator_id (TEXT)
    const discordIdentity = user.identities?.find(i => i.provider === 'discord');
    const discordId = discordIdentity?.id;

    if (!discordId) {
        throw new Error('No Discord identity found');
    }

    const { data: lobby, error: fetchError } = await supabase
        .from('lobbies')
        .select('creator_id')
        .eq('id', lobbyId)
        .single();

    if (fetchError || !lobby) {
        throw new Error('Lobby not found');
    }

    if (lobby.creator_id !== discordId) { // Use Discord ID, not UUID
        throw new Error('Unauthorized: You are not the Commander of this sector.');
    }

    // 3. Delete Lobby
    const { error: deleteError } = await supabase
        .from('lobbies')
        .delete()
        .eq('id', lobbyId);

    if (deleteError) {
        console.error("Delete Lobby Error:", deleteError);
        throw new Error('Failed to dissolve sector.');
    }

    // 4. Redirect
    revalidatePath('/dashboard/play');
    // redirect('/dashboard/play');
    // We cannot return JSX here as this is a server action returning void/promise
    // But we can throw an error or just stop the redirect.
    console.log("DEBUG: deleteLobby redirect blocked");
}
