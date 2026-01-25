# PROJECT NEXUS: CAPABILITIES & TECHNICAL SHOWCASE

**Date:** January 25, 2026
**Version:** 1.0.0
**Status:** Alpha / Pre-Production
**Classification:** Official Technical Documentation

---

## 1. Executive Summary

**Nexus** is a high-performance, multi-tenant competitive operations engine designed to bridge the gap between community "In-House" leagues and professional eSports orchestration. By fusing real-time web technologies with deep Discord integration, Nexus offers a seamless "Click-to-Compete" experience for players while providing organizers with military-grade command and control capabilities.

The system is built on a **Cyberpunk/Sci-Fi** aesthetic philosophy (`High-Contrast / Low-Latency`), ensuring that every interaction feels premium, responsive, and immersive.

---

## 2. Core Capabilities (Operational)

The following metrics and modules are currently fully operational and provisioned for live deployment.

### A. The "Lobby" Ecosystem
*The heart of the Nexus experience.*
- **Universal Game Architecture:** Agnostic support for *League of Legends, Rocket League, Valorant, and EA FC*, with an extensible schema for adding new titles instantly.
- **Dynamic State Management:** Real-time transitioning of lobbies through `Created` -> `Waiting` -> `Ready Check` -> `Live` lifecycles.
- **"Ghost" UI/UX:** Context-aware interfaces that reveal buttons (Join, Ready, Start) only when actionable, reducing cognitive load.
- **Private Sectors:** Password-protected lobbies for scrims or VIP matches, secured by hashed comparisons.

### B. Intelligent Matchmaking & Queues
- **Role-Based Ready Checks:** Visual indicators for Captains (Blue), Players (Lime), and Tournament Officials (Purple).
- **Auto-Balancing:** Logic to assign players to Team 1 / Team 2 based on arrival or MMR (provisioned).
- **Global & Custom Queues:** Support for both "Ranked" global matchmaking and "Guild-Specific" custom game modes.

### C. Agency & Automation (The "Brains")
Nexus employs a triad of **Singleton Service Agents** running on the backend to automate complex flows:
1.  **`MatchmakerAgent`:** Monitors lobby capacities and automatically triggers Ready Checks.
2.  **`BroadcasterAgent`:** Handles cross-platform notifications, announcing match starts with rich embeds to Discord.
3.  **`UplinkAgent`:** Verifies user presence in specific Discord Voice Channels before allowing them to check-in (Anti-Smurf / Reliability Protocol).

### D. The OpsCenter (Admin Command)
A dedicated dashboard for League Operators (`admin/ActiveOps.tsx`) providing:
- **God-View Monitoring:** Real-time visibility of every active lobby across all guilds.
- **Intervention Tools:** Force-Kick, Force-Start, and Disband capabilities.
- **Live Telemetry:** Streaming updates via Supabase Realtime using PostgreSQL Replication events.

---

## 3. Provisioned Architectures (Non-Operational / Beta)

*These features utilize fully defined Database Schemas and Backend Logic but currently lack complete Public UI surfaces.*

| Feature | Status | Description |
| :--- | :--- | :--- |
| **MMR & Elo History** | *Database Ready* | The `player_mmr`, `mmr_history`, and `submit_match_report` SQL functions are written and tested. However, the frontend "Career Profile" graph and detailed match history views are strictly MVP. |
| **Tournament Brackets** | *Schema Ready* | `is_tournament` flags exist on all lobbies. The automated bracket generation and progression UI is scheduled for Phase 2. |
| **Guild Management** | *Backend Ready* | Multi-tenancy through the `clubs` table is fully supported. The "Create Your Own Guild" self-serve portal is not yet exposed to users; onboarding is currently manual (White-Glove). |
| **Dispute Resolution** | *Logic Ready* | The Reporting System (`reports` table) and Ban System (`guild_bans`) are provisioned with RLS policies, but the "Tribunal" UI for reviewing evidence is internal-only. |

---

## 4. Security & Integrity Measures

Nexus treats competitive integrity as a first-class citizen.

### A. Row Level Security (RLS)
We utilize **PostgreSQL RLS** policies on *every single table*.
- **Principle:** "Users can only see what they need to see."
- **Implementation:** Validates `auth.uid()` against record owners or guild membership for every SELECT/INSERT/UPDATE.
- **Effect:** Even if the frontend is compromised, the data layer remains impermeable to horizontal privilege escalation.

### B. Server-Side Validation
All critical mutations (Joining Lobbies, Reporting Scores) utilize **Next.js Server Actions**.
- Inputs are validated on the server, never trusted from the client.
- Prevents "inspect element" hacking or API replay attacks.

### C. Voice Verification (The "Uplink")
To prevent "Ghost Lobbies" (where users ready up but aren't actually present), the `UplinkAgent` performs a handshake with Discord's API to verify physical voice channel presence before a match can go Live.

---

## 5. Future Roadmap & Potential

### Phase 2: The "Ecosystem" Update
- **Data Visualization:** deeply integrated charts for Win Rates, Hero/Agent performance, and "Head-to-Head" rivalries.
- **Automated Payouts:** Smart-contract or Ledger-based integration for prize pool distribution.

### Phase 3: The "Sentinels"
- **AI Moderation:** Training the `SchemaSentinel` to detect match-fixing patterns or toxicity in chat logs.
- **Replay Parsing:** Integration with Riot API / Psyonix API to auto-report match results (removing the need for manual reporting).

---

*This document certifies the current capabilities of the Nexus Engine as of Jan 2026.*
