-- Create Report Status Enum
DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id text NOT NULL,
  reporter_id VARCHAR(20) REFERENCES players(user_id),
  reported_id VARCHAR(20) REFERENCES players(user_id),
  reason text NOT NULL, -- "Toxic", "Cheating", etc.
  details text, -- Optional user description
  status report_status DEFAULT 'PENDING',
  created_at timestamptz DEFAULT now()
);
