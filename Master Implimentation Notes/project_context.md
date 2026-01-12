- ### **PROJECT NEXUS: COMPETITIVE ECOSYSTEM ENGINE**

  **Manifest Updated:** December 22, 2025 **Architecture Type:** Multi-Tenant SaaS (Software as a Service) **Current Client:** TTFA (Trinidad & Tobago eFootball Association)

  ------

  ### **CORE IDENTITY (The Product)**

  Nexus is a standalone, competitive operations bot designed for any eSports organization or "In-House" league. It supports both "Standard" (Global) games and "Custom" (Guild-Specific) modes.

  **CORE SUPPORTED TITLES:**

  - League of Legends
  - Rocket League
  - Valorant
  - EA FC / FIFA
  - *(Extensible to any title via the `games` table)*

  ------

  ### **TECH STACK**

  - **Backend Logic:**
    - Node.js (v20) + Discord.js (v14)
    - **Next.js Server Actions:** Primary method for data mutation (secure, typed).
    - **Service Agents:** Dedicated singletons for complex orchestrations (`web/services/*.ts`).
  - **Frontend:** React / Next.js 14 (App Router) + Tailwind CSS + Framer Motion.
  - **Database:** PostgreSQL (via Supabase).

  ------

  ### **SYSTEM ARCHITECTURE & MODULES**

  #### **A. SERVICE AGENTS (The Brains)**

  *Located in `web/services/`*

  - **`MatchmakerAgent`:**
    - Monitors lobby capacity.
    - Triggers "Ready Checks" when full.
    - Transitions lobbies to "LIVE" status.
  - **`BroadcasterAgent`:**
    - Handles external notifications (Discord Webhooks/Bot Messages).
    - Announces "Match Started" events with rich embeds.
  - **`UplinkAgent`:**
    - Bridges the gap between Web and Discord.
    - Verifies voice channel presence (`verifyUserVoice`).

  #### **B. SERVER ACTIONS (The Muscle)**

  *Located in `web/actions/`*

  - **`getAdminIntel`:** Fetches live data for the Admin Dashboard/OpsCenter.
  - **`lobbyActions`:** Handles Join/Leave/Kick/Ready logic.
    - *Update:* `toggleReady` supports `'created'`, `'waiting'`, and `'open'` statuses.
    - *Update:* `joinLobby` includes password validation for Private Sectors.
  - **`resolveReport` & `manageBans`:** Moderation tools.

  #### **C. KEY COMPONENTS**

  - **`OpsCenter` (`web/components/admin/ActiveOps.tsx`):** Real-time lobby monitoring interface.
  - **`LobbyWorkspace`:** The main player interface. Features dynamic "Ready" buttons (Purple/Blue/Lime) and tactical "Ghost" UI elements.
  - **`LobbyCard`:** Dashboard card with "Smart Navigation" (re-entry logic) and "Access Denied" shake animations.

  ------

  ### **DATABASE SCHEMA (Nexus Manifest)**

  *Global Standard: All Primary Keys are UUIDs (`gen_random_uuid()`) unless specified otherwise. User IDs: TEXT (Discord Snowflakes).*

  #### **1. GAMES (Top Level Parent)**

  SQL

  ```
  CREATE TABLE games (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,          -- e.g. "valorant"
      icon_url TEXT,
      cover_image_url TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

  #### **2. CLUBS (Multi-Tenancy)**

  SQL

  ```
  CREATE TABLE clubs (
      guild_id TEXT PRIMARY KEY, -- Discord Server ID
      name VARCHAR(100),
      premium_tier INTEGER DEFAULT 0,
      announcement_channel_id TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

  #### **3. GAME MODES (The "Data-Driven" Magic)**

  SQL

  ```
  CREATE TABLE game_modes (
      id UUID PRIMARY KEY,
      game_id UUID REFERENCES games(id),
      guild_id TEXT REFERENCES clubs(guild_id), -- NULL for Global, Value for Custom
      name TEXT NOT NULL,
      team_size INTEGER DEFAULT 5,
      picking_method TEXT DEFAULT 'RANDOM',     -- 'RANDOM', 'CAPTAINS'
      voice_enabled BOOLEAN DEFAULT TRUE,
      json_settings JSONB DEFAULT '{}',
      is_active BOOLEAN DEFAULT TRUE,
      description TEXT,                         -- AKA "Rules" or "Protocols"
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

  #### **4. LOBBIES (Live Game Containers)**

  SQL

  ```
  CREATE TABLE lobbies (
      id UUID PRIMARY KEY,
      creator_id TEXT REFERENCES players(user_id), -- Admin or Player ID (Explicit FK)
      game_mode_id UUID REFERENCES game_modes(id),
      guild_id TEXT REFERENCES clubs(guild_id),
      region TEXT DEFAULT 'NA',
      status TEXT DEFAULT 'waiting',               -- 'created', 'waiting', 'open', 'live'
      type TEXT DEFAULT 'public',                  -- 'public', 'private', 'tournament'
      password TEXT,                               -- For Private Sectors
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

  #### **5. LOBBY PLAYERS**

  SQL

  ```
  CREATE TABLE lobby_players (
      lobby_id UUID REFERENCES lobbies(id),
      user_id TEXT REFERENCES players(user_id), -- Explicit FK required for Joins
      team INTEGER DEFAULT 1,
      is_ready BOOLEAN DEFAULT FALSE,
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      PRIMARY KEY (lobby_id, user_id)
  );
  ```

  #### **6. PLAYERS & QUEUES**

  SQL

  ```
  CREATE TABLE players (
      user_id TEXT PRIMARY KEY, -- Discord Snowflake
      uuid_link UUID DEFAULT gen_random_uuid(), -- Internal Nexus ID
      username VARCHAR(100),
      avatar_url TEXT
  );
  
  CREATE TABLE queues (
      id UUID PRIMARY KEY,
      game_mode_id UUID REFERENCES game_modes(id),
      user_id TEXT REFERENCES players(user_id),
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

  #### **7. MATCH HISTORY & MODERATION**

  *(Standard Tables: `matches`, `match_players`, `match_reports`, `reports`, `guild_bans`)*

  ------

  ### **LOGIC & WORKFLOWS**

  **LOBBY CREATION LOGIC**

  - **Admin Created:** Initializes with 0 PLAYERS. Empty container.
  - **Player Created:** Initializes with 1 PLAYER (Creator). Creator auto-joined.

  **READY CHECK LOGIC**

  1. **Status Check:** Allowed in `'created'`, `'waiting'`, and `'open'` states.
  2. **Visuals:**
     - **Not Ready:** Color coded by role (Purple=Tournament, Blue=Creator, Lime=Player).
     - **Ready:** Turns Emerald Green ("READY (PRESS TO CANCEL)").
  3. **Match Start:**
     - When `ALL` players are ready -> Commander sees "INITIALIZE MATCH".
     - Click -> Starts 10s Countdown -> Match Created -> Redirect.

  **SECURITY & UI LOGIC**

  - **Private Sectors:**
    - Joining requires a password match.
    - **Failure:** Triggers "Access Denied" modal with CSS `animate-shake-rapid`.
  - **RLS Policies:**
    - `lobbies`, `game_modes`, `players`, `lobby_players`: Public Read Access enabled to ensure joiners can see lobby details and member lists.

  ------

  ### **DOCUMENTATION PROTOCOLS**

  - **Logic Changes:** Save to "Master Implementation Notes/".
  - **Naming Convention:** `YYYY-MM-DD_FeatureName.md`.
  - **Task Log:** Update `TASK_LOG.md` upon completion.
