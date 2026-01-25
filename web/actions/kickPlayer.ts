'use server';

import { createClient } from '@/utils/supabase/server';

export async function kickPlayer(lobbyId: string, targetUserId: string): Promise<{ success: boolean; message: string }> {
    const supabase = await createClient();

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, message: 'Unauthorized' };
    }

    // Get Discord ID
    const discordIdentity = user.identities?.find(i => i.provider === 'discord');
    const discordId = discordIdentity?.id;

    if (!discordId) {
        return { success: false, message: 'No Discord identity found' };
    }

    // 2. Verify Commander Status
    const { data: lobby, error: lobbyError } = await supabase
        .from('lobbies')
        .select('creator_id')
        .eq('id', lobbyId)
        .single();

    if (lobbyError || !lobby) {
        return { success: false, message: 'Lobby not found' };
    }

    if (lobby.creator_id !== discordId) {
        return { success: false, message: 'Only the commander can kick players' };
    }

    // 3. Prevent self-kick
    if (targetUserId === discordId) {
        return { success: false, message: 'Cannot kick yourself' };
    }

    // 4. Remove player from lobby
    const { error: deleteError } = await supabase
        .from('lobby_players')
        .delete()
        .eq('lobby_id', lobbyId)
        .eq('user_id', targetUserId);

    if (deleteError) {
        console.error('[kickPlayer] Error:', deleteError);
        return { success: false, message: 'Failed to remove player' };
    }

    return { success: true, message: 'Player removed from lobby' };
}
