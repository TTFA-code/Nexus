# Project Nexus Implementation Plan - Phase 4.5 (Missing Capabilities)

## Goal Description
Implement missing capabilities identified in the inventory stockcheck to improve data collection and Quality of Life (QoL) for admins and players. Key focus areas: Club Management, Match Management, MVP Tracking, and Leaderboards.

## User Review Required
> [!NOTE]
> **User Profile**: Excluded as requested. Profile stats will remain website-exclusive.

## Proposed Changes

### Bot Commands
#### [NEW] [bot/commands/admin/club.js]
- **Subcommands**:
    - `info`: View current club settings.
    - `set-premium`: (Admin) Set premium tier.

#### [NEW] [bot/commands/game/leaderboard.js]
- **Functionality**: Display top 10 MMR leaderboard for a game mode.
- **Arguments**: `game_mode_id` (Optional).

#### [NEW] [bot/commands/game/match.js]
- **Subcommands**:
    - `list`: Show recent matches for the server.
    - `info`: Show detailed stats for a specific match.
    - `void`: (Admin Only) Void a match, reverting MMR changes (Advanced).

#### [MODIFY] [bot/commands/game/report.js]
- **Changes**: Add optional `mvp` user argument.

#### [MODIFY] [bot/commands/admin/gamemode.js]
- **Changes**: Add `update` subcommand to modify existing modes (voice, team size, etc.).

### Bot Systems
#### [MODIFY] [bot/systems/mmr.js]
- **Changes**:
    - Handle `mvp` argument in `processMatchResult`.
    - Trigger voice channel cleanup on match report.

#### [MODIFY] [bot/systems/voice.js]
- **Changes**:
    - Add `deleteMatchChannels` method to clean up channels after reporting.

## Verification Plan
### Manual Verification
- **Commands**: Test `/club`, `/leaderboard`, and `/match` in Discord.
- **Flow**: Run a full match cycle:
    1.  Create Game Mode (Voice Enabled).
    2.  Queue & Match Pop.
    3.  Verify Voice Channels created.
    4.  Report Match with MVP.
    5.  Verify Voice Channels deleted.
    6.  Check `/match info` for MVP data.
