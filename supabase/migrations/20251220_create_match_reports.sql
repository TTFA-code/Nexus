
-- 14. MATCH REPORTS (Text-Only Admin Inbox)
CREATE TABLE IF NOT EXISTS match_reports (
    id SERIAL PRIMARY KEY,
    reporter_id VARCHAR(20) REFERENCES players(user_id),
    game_mode_id INT REFERENCES game_modes(id),
    result_data JSONB, -- { score: string, opponent_username: string, outcome: 'win' | 'loss' }
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    discord_thread_id VARCHAR(30),
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
