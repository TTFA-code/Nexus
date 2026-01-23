import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard/play'

    if (code) {
        const supabase = await createClient()

        // Debug logging
        const cookies = request.headers.get('cookie')
        console.log('--- Auth Callback Debug ---')
        console.log('Request URL:', request.url)
        console.log('All Cookies:', cookies)
        const verifierCookie = cookies?.split(';').find(c => c.trim().startsWith('sb-') && c.includes('code-verifier'))
        console.log('Verifier Cookie found:', verifierCookie ? 'YES' : 'NO')
        console.log('Verifier Cookie Value:', verifierCookie)
        console.log('---------------------------')

        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && session?.user) {
            const user = session.user
            const discordIdentity = user.identities?.find(i => i.provider === 'discord')
            const discordId = discordIdentity?.id

            // 1. Sync UUID Link (Existing)
            if (discordId) {
                const { error: syncError } = await supabase
                    .from('players')
                    .upsert({
                        user_id: discordId, // PK (Discord ID)
                        username: user.user_metadata.full_name || 'Unknown',
                        avatar_url: user.user_metadata.avatar_url
                    }, { onConflict: 'user_id' })

                if (syncError) {
                    console.error('Auth Sync Error:', syncError)
                }

                // 2. Sync Discord Roles (New)
                const providerToken = session.provider_token
                console.log('[Auth Debug] Provider Token Exists:', !!providerToken, providerToken ? `Length: ${providerToken.length}` : '');

                if (providerToken) {
                    try {
                        console.log('[Auth] Syncing Discord Roles...')

                        // Fetch Guilds
                        const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
                            headers: {
                                Authorization: `Bearer ${providerToken}`
                            }
                        })

                        console.log('[Auth Debug] Guilds Fetch Status:', guildsRes.status, guildsRes.statusText);

                        if (guildsRes.ok) {
                            const guilds = await guildsRes.json()
                            console.log(`[Auth Debug] Fetched ${guilds.length} guilds from Discord.`);

                            const updates = []

                            // Initialize Admin Client for Service Role Clearance
                            const adminDb = createAdminClient()

                            if (adminDb) {
                                for (const guild of guilds) {
                                    // ... logic
                                    let role = null

                                    // PURE BADGE PROTOCOL: 
                                    // We do NOT sync Owner status here anymore.
                                    // 'nexus-admin' roles are synced via the Dashboard Layout (actions/authActions.ts).
                                    // This prevents "Owner" role from overriding "nexus-admin" or granting false access.

                                    /* 
                                    if (guild.owner) {
                                        role = 'owner'
                                    }
                                    */

                                    if (role) {
                                        updates.push({
                                            user_id: user.id, // Supabase UUID
                                            guild_id: guild.id,
                                            role: role
                                        })
                                    }
                                }

                                if (updates.length > 0) {
                                    console.log(`[Auth] Syncing ${updates.length} owner roles...`)
                                    // Use Service Role for Clearance
                                    const { error: roleError } = await (adminDb as any)
                                        .from('server_members')
                                        .upsert(updates, { onConflict: 'user_id,guild_id' })

                                    if (roleError) console.error('Role Sync Error:', roleError)
                                }
                            } else {
                                console.warn('[Auth] Service Role Key missing. Skipping owner sync.');
                            }
                        } else {
                            console.error('[Auth] Failed to fetch Discord guilds:', guildsRes.statusText)
                        }
                    } catch (err) {
                        console.error('[Auth] Role Sync Exception:', err)
                    }
                }

                return NextResponse.redirect(`${origin}${next}`)
            } else {
                console.error('Auth Callback Error:', error)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
