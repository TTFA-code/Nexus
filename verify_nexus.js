require('dotenv').config({ path: './bot/.env' });
const { createClient } = require('@supabase/supabase-js');
const ReadyCheckManager = require('./bot/systems/readyCheck');
const Matchmaker = require('./bot/systems/matchmaker');
const AnnouncementManager = require('./bot/systems/announcer');
const MMRSystem = require('./bot/systems/mmr');

// Mock Discord Client
const mockChannel = {
    id: 'MOCK_CHANNEL_ID',
    send: (msg) => console.log('\n[DISCORD MOCK] Channel Send:', msg.embeds?.[0]?.data?.title || msg),
    messages: {
        fetch: async () => ({
            edit: (msg) => console.log('[DISCORD MOCK] Message Edited:', msg.embeds?.[0]?.data?.title),
            delete: () => console.log('[DISCORD MOCK] Message Deleted')
        })
    }
};

const mockGuild = {
    id: 'MOCK_GUILD_ID',
    systemChannelId: 'MOCK_CHANNEL_ID',
    channels: {
        cache: {
            get: (id) => mockChannel
        },
        fetch: async (id) => mockChannel
    },
    systemChannel: mockChannel
};

const mockClient = {
    user: { id: 'MOCK_BOT' },
    guilds: {
        cache: {
            get: (id) => mockGuild
        }
    },
    channels: {
        fetch: async (id) => mockChannel
    },
    emit: (event, ...args) => console.log(`[EVENT EMIT] ${event}`, args[0]?.id || ''),
    systems: {}
};

async function runVerification() {
    console.log('🔹 STARTING NEXUS SYSTEM VERIFICATION 🔹');

    // 1. Setup Supabase
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    mockClient.supabase = supabase;

    // 2. Initialize Systems
    mockClient.systems.announcer = new AnnouncementManager(mockClient);
    mockClient.systems.matchmaker = new Matchmaker(mockClient);
    mockClient.systems.readyCheck = new ReadyCheckManager(mockClient);
    mockClient.systems.mmr = new MMRSystem(mockClient);

    // 3. Setup Test Data
    const guildId = 'TEST_GUILD_' + Date.now();
    const modeName = 'Verif_Mode_' + Date.now();

    // Create Guild
    await supabase.from('guilds').insert({ guild_id: guildId, name: 'Verification Guild' });

    // Create Game Mode
    const { data: mode } = await supabase.from('game_modes').insert({
        guild_id: guildId, name: modeName, team_size: 1 // 1v1 for speed
    }).select().single();

    console.log(`✅ Environment Setup: Mode #${mode.id} (${modeName})`);

    // Create Players
    const p1 = `USER_A_${Date.now()}`;
    const p2 = `USER_B_${Date.now()}`;
    await supabase.from('players').insert([{ user_id: p1, username: 'Alpha' }, { user_id: p2, username: 'Bravo' }]);

    // 4. Simulate Queue Join
    console.log('\n--- Step 1: Queueing ---');
    await supabase.from('queues').insert([
        { game_mode_id: mode.id, user_id: p1 },
        { game_mode_id: mode.id, user_id: p2 }
    ]);

    // Use the Matchmaker to check queue
    await mockClient.systems.matchmaker.checkQueue(mode);

    // Validate Lobby Created
    // Give it a moment as checkQueue might be async in DB ops
    await new Promise(r => setTimeout(r, 1000));

    const { data: lobby } = await supabase.from('lobbies').select('*').eq('game_mode_id', mode.id).single();
    if (lobby && lobby.status === 'ready_check') {
        console.log(`✅ Lobby Created: #${lobby.id} | Status: ${lobby.status}`);
    } else {
        console.error('❌ Lobby creation failed');
        // Check Queues
        const { count } = await supabase.from('queues').select('*', { count: 'exact', head: true }).eq('game_mode_id', mode.id);
        console.log('Queue Count:', count);
        return;
    }

    // 5. Simulate Ready Acceptance
    console.log('\n--- Step 2: Ready Check ---');
    // Manually accept for players
    // Mock Interactions
    const mockInteraction = (userId) => ({
        user: { id: userId },
        reply: () => { },
        deferUpdate: () => { },
        message: { embeds: [{}], edit: () => { } },
        client: mockClient
    });

    await mockClient.systems.readyCheck.handleResponse(mockInteraction(p1), lobby.id, 'accept');
    await mockClient.systems.readyCheck.handleResponse(mockInteraction(p2), lobby.id, 'accept');

    // Wait for match creation
    await new Promise(r => setTimeout(r, 1000));

    // Check if Match Created
    const { data: match } = await supabase.from('matches').select('*').eq('game_mode_id', mode.id).order('id', { ascending: false }).limit(1).single();
    if (match && match.status === 'ongoing') {
        console.log(`✅ Match Started: #${match.id} | Status: ${match.status}`);
    } else {
        console.error('❌ Match start failed');
        return;
    }

    // 6. Simulate Reporting
    console.log('\n--- Step 3: Reporting ---');
    // Call the logic directly (mimicking API)
    await supabase.from('matches').update({
        winner_team: 1,
        evidence_url: 'http://evidence.com/img.png',
        status: 'finished',
        approval_status: 'pending',
        finished_at: new Date().toISOString()
    }).eq('id', match.id);
    console.log('✅ Match Reported (Pending Approval)');

    // 7. Simulate Admin Approval
    console.log('\n--- Step 4: Admin Approval & MMR ---');
    // Update DB to trigger Realtime Listener
    await supabase.from('matches').update({ approval_status: 'approved' }).eq('id', match.id);

    // Wait for listener to process (Supabase Realtime might take a sec)
    console.log('⏳ Waiting for MMR System (5s)...');
    await new Promise(r => setTimeout(r, 5000));

    // Check Ratings
    const { data: ratings } = await supabase.from('player_ratings').select('*').eq('game_mode_id', mode.id);
    const r1 = ratings.find(r => r.user_id === p1);
    const r2 = ratings.find(r => r.user_id === p2);

    if (r1 && r2) {
        console.log(`Stats for Alpha (Winner): MMR ${r1.mmr} (Wins: ${r1.wins})`);
        console.log(`Stats for Bravo (Loser):  MMR ${r2.mmr} (Wins: ${r2.wins})`);

        if (r1.mmr > 1200 && r1.wins === 1) {
            console.log('✅ MMR Logic Verified');
        } else {
            console.error('❌ MMR Logic Failed (Stats not updated)');
        }
    } else {
        console.error('❌ Ratings not found');
    }

    console.log('\n🔹 VERIFICATION COMPLETE 🔹');
    process.exit(0);
}

runVerification();
