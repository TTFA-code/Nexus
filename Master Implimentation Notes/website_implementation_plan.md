# Nexus Web Dashboard Implementation Plan

## Goal Description
Develop the full-featured web dashboard for "Nexus", enabling players to view their stats and admins to manage the bot, queues, and game modes. This plan focuses exclusively on the web application (`/web` directory).

## User Review Required
> [!IMPORTANT]
> **Supabase URL & Key**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `web/.env.local`.
> **Discord OAuth**: You must configure the Discord OAuth provider in your Supabase Project Settings and add the callback URL (`<your-domain>/auth/callback`).

## Proposed Changes

### Phase 1: Foundation & UI Setup
Initialize the core UI components and layout structure.

#### [NEW] [web/components/ui]
- Install Shadcn UI components: `button`, `card`, `input`, `table`, `dialog`, `dropdown-menu`, `avatar`, `badge`, `switch`.
- *Action*: Run `npx shadcn@latest add ...`

#### [NEW] [web/components/layout/AppSidebar.tsx]
- Create a responsive sidebar navigation using Shadcn components.
- Links: Dashboard, Leaderboard, Admin (conditional).

#### [NEW] [web/app/layout.tsx]
- Update root layout to include the `AppSidebar` and `ThemeProvider` (Dark mode).

### Phase 2: Authentication & Database Connection
Implement Discord Login and Supabase client.

#### [NEW] [web/utils/supabase/server.ts]
- Helper to create Supabase client in Server Components (using cookies).

#### [NEW] [web/utils/supabase/client.ts]
- Helper to create Supabase client in Client Components.

#### [NEW] [web/app/auth/callback/route.ts]
- API route to handle the OAuth callback from Discord and exchange the code for a session.

#### [NEW] [web/app/login/page.tsx]
- A dedicated login page with a "Sign in with Discord" button.

### Phase 3: Player Dashboard
Features for authenticated players.

#### [NEW] [web/app/dashboard/page.tsx]
- **Overview**: Fetch user's `player_ratings` and display summary cards (MMR, Wins, Losses).
- **Recent Matches**: Fetch last 5 matches from `matches` table.

#### [NEW] [web/app/leaderboard/page.tsx]
- **Global Leaderboard**: Table displaying top players sorted by MMR.
- Filter dropdown for `Game Mode`.

### Phase 4: Admin Dashboard
Tools for server administrators.

#### [NEW] [web/app/admin/page.tsx]
- **Overview**: List of servers the user has admin rights in (requires Discord API check or database mapping).

#### [NEW] [web/app/admin/[guildId]/queues/page.tsx]
- **Queue Management**:
    - List all `game_modes` for the guild.
    - Toggle switches for `is_active` (Realtime updates).
    - "Edit" button to modify team size, picking method.

#### [NEW] [web/app/admin/[guildId]/matches/page.tsx]
- **Match Management**:
    - Table of recent matches.
    - "Void" button to cancel a match and revert MMR (requires backend logic or API call).

## Verification Plan

### Automated Tests
- **Build Check**: Run `npm run build` to ensure type safety and build success.
- **Lint Check**: Run `npm run lint` to catch code style issues.

### Manual Verification
1.  **Auth Flow**:
    - Click "Login with Discord".
    - Verify redirection to Discord and back to `/dashboard`.
    - Verify session cookie is set.
2.  **Data Display**:
    - Check if "My Stats" matches the data in the database.
    - Check if Leaderboard sorts correctly.
3.  **Admin Actions**:
    - Toggle a queue "Off" in the Admin panel.
    - Verify in the Database (and Bot if running) that the queue is actually closed.
