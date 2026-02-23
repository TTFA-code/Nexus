-- Migration for 2v2 System Updates
-- Run this in your Supabase SQL Editor

-- 1. Add `team` to `lobby_players` (to track team selection before match starts)
ALTER TABLE "public"."lobby_players" 
ADD COLUMN IF NOT EXISTS "team" integer DEFAULT 1;

-- 2. Add `rematch_status` to `match_players` (to track individual votes for a multi-player rematch)
ALTER TABLE "public"."match_players"
ADD COLUMN IF NOT EXISTS "rematch_status" varchar DEFAULT 'pending';

-- 3. We also need a way for the realtime subscription to listen to these changes securely.
-- If RLS is enabled, ensure players can update their own rematch status.
-- This assumes policies exist, but just in case, here are safe permissive policies for testing if needed.
-- (Usually, the backend service role or existing RLS handles this, so we will rely on your server actions).
