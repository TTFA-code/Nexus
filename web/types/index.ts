export type LobbyStatus = 'WAITING' | 'READY_CHECK' | 'LIVE'
export type ReadyStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'

export interface Lobby {
    id: string
    created_at: string
    creator_id: string
    game_mode_id: string | null
    guild_id: string
    status: LobbyStatus
    require_vc: boolean
    voice_channel_id: string | null

    is_private: boolean
    description: string | null

    game_modes?: {
        name: string
        team_size: number
    } | null

    creator?: {
        username: string | null
        avatar_url: string | null
    } | null
    players?: {
        username: string | null
        avatar_url: string | null
    } | null
}

export interface ReadyCheck {
    id: string
    lobby_id: string
    user_id: string
    status: ReadyStatus
    created_at: string
}
