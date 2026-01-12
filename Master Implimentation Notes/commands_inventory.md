# Bot Commands Inventory

## Overview
This document provides a comprehensive stockcheck of all currently installed Discord bot commands, their database interactions, and their visibility on the Nexus Web Dashboard.

## Installed Commands

### 1. Game Mode Management (`/gamemode`)
**Path**: `bot/commands/admin/gamemode.js`
**Permission**: Administrator
**Subcommands**:
- **`create`**: Creates a new game mode.
  - *Arguments*: `name` (String), `team_size` (Integer)
- **`update`**: Updates an existing game mode.
  - *Arguments*: `id` (Integer), `voice_enabled` (Boolean, Optional), `team_size` (Integer, Optional)
- **`list`**: Lists all active game modes for the server.
- **`delete`**: Deletes a game mode.
  - *Arguments*: `id` (Integer)
**Database Functionality**:
- **Writes**: `game_modes` (Insert, Update, Delete)
- **Reads**: `game_modes` (Select)
**Website Display**: Defines categories for MMR tracking and Queues on the dashboard.

### 2. Club Management (`/club`)
**Path**: `bot/commands/admin/club.js`
**Permission**: Administrator
**Subcommands**:
- **`info`**: View current club settings and verification status.
- **`set-premium`**: Set the premium tier for the club.
  - *Arguments*: `tier` (Integer: 0=Free, 1=Pro)
**Database Functionality**:
- **Reads/Writes**: `clubs` table.

### 3. Lobby Setup (`/setup`)
**Path**: `bot/commands/admin/setup.js`
**Permission**: Administrator
**Arguments**: `game_mode_id` (Optional)
**Functionality**:
- Fetches the game mode (or defaults to the first one).
- Sends a persistent "Lobby" message with interactive buttons:
  - `Join Queue` (⚔️)
  - `Leave Queue` (Destructive)
  - `My Stats` (📊)
**Database Functionality**:
- **Reads**: `game_modes` table.

### 4. Queue Management (`/queue`)
**Path**: `bot/commands/game/queue.js`
**Subcommands**:
- **`join`**: Joins a queue manually.
  - *Arguments*: `mode` (String)
- **`leave`**: Leaves current queue.
- **`status`**: Displays active queues and current player counts.
**Database Functionality**:
- **Writes**: `queues` table (Insert/Delete)
- **Reads**: `queues` table (Count)

### 5. Match Management (`/match`)
**Path**: `bot/commands/game/match.js`
**Subcommands**:
- **`list`**: Lists the last 10 matches.
- **`info`**: Get details about a specific match (Teams, Status, MVP).
  - *Arguments*: `id` (Integer)
- **`void`**: Void a match (Admin Only). Deletes the record.
  - *Arguments*: `id` (Integer), `reason` (String)
**Database Functionality**:
- **Reads**: `matches`, `match_players`, `game_modes`
- **Writes**: `matches` (Delete on void)

### 6. Leaderboard (`/leaderboard`)
**Path**: `bot/commands/game/leaderboard.js`
**Arguments**: `game_mode_id` (Optional)
**Functionality**:
- Displays the top 10 players by MMR for a specific game mode.
**Database Functionality**:
- **Reads**: `player_ratings`, `players`

### 7. Match Reporting (`/report`)
**Path**: `bot/commands/game/report.js`
**Arguments**:
- `match_id` (Integer)
- `winner` (Integer: 1 or 2)
- `mvp` (User, Optional)
**Functionality**:
- Finalizes a match, updates stats, and calculates MMR changes.
**Database Functionality**:
- Updates `matches` (winner, status).
- Updates `player_ratings` (MMR, Wins/Losses).

### 8. Utility (`/ping`)
**Path**: `bot/commands/utility/ping.js`
**Functionality**: Replies with "Pong!".

## Gap Analysis & Recommendations

### Missing Capabilities
1. **Player Profile Command**: There is no `/profile` command to see a user's stats across all modes.
2. **Detailed Match History**: `/match list` only shows the last 10. A pagination system or web link would be better.
3. **Admin Force End**: `/match void` deletes the record. A `/match force-end` that calculates results manually might be useful.
4. **Team Picking**: Currently defaults to 'RANDOM'. 'CAPTAINS' logic is supported in DB but not implemented in commands.

### Website Integration Notes
- **Queues**: Exposed via `GET /queues` API (implemented).
- **Match History**: Exposed via Supabase directly on Dashboard.
- **Leaderboard**: Exposed via Supabase directly on Dashboard.
