# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: Expo Version

**Always read the exact versioned Expo docs before writing any code:**
`https://docs.expo.dev/versions/v56.0.0/`

This project uses Expo SDK 56, React Native 0.85.3, React 19.2.3. APIs and component props differ from older versions.

## Branch & Worktree Workflow

All feature and bugfix work is isolated in git worktrees, branched from `dev`. Never branch from `main` directly.

```
main  ← stable releases only
  └── dev  ← integration branch
        ├── feature/<name>
        ├── fix/<name>
        └── test/<name>
```

**Start new work:**
```bash
./scripts/new-feature.sh <name> [fix|feature|test]
# Creates ../matchday-wt-<name> with a fresh branch from dev + npm install
# Open that directory in a new Claude Code tab — fully isolated
```

**Finish and merge:**
```bash
./scripts/finish-feature.sh <name>
# Merges branch into dev, removes worktree, deletes local branch
```

**List active worktrees:**
```bash
git worktree list
```

Worktrees live at `../matchday-wt-<name>` (sibling of this directory). Each has its own `node_modules` and Metro cache.

## Commands

```bash
# Start dev server (Metro bundler)
npx expo start

# Start with QR code accessible from phone on same WiFi
npx expo start

# Type-check
npx tsc --noEmit

# Open on specific platform
npx expo start --ios
npx expo start --android
```

No test suite is configured.

## Architecture

### Routing

File-based routing via `expo-router`. All screens live in `app/`. The router is a `Stack` with `headerShown: false` throughout — all headers are custom-built per screen.

```
app/
  _layout.tsx          # Root: font loading, GestureHandlerRootView, Stack config
  index.tsx            # Home
  setup.tsx            # Create tournament (multi-step modal-like flow)
  matchday.tsx         # Active match day (standings + match list + ADD MATCH modal)
  tournament.tsx       # Tournament overview
  stats.tsx            # Stats (Ranking + H2H tabs)
  archive.tsx          # Archive (closed tournaments accordion)
  archive-day.tsx      # Single archived round
  season-stats.tsx     # Season-level stats
  match/[id].tsx       # Match detail
  settings/
    index.tsx          # Settings menu
    players.tsx        # Player management
    teams.tsx          # Team management
    tournaments.tsx    # Closed tournaments list
    display.tsx        # Display preferences
    developer.tsx      # Developer tools (debug/reset)
    import-round.tsx   # Import round from external data
```

### State Management

Single Zustand store at `src/store/index.ts`, persisted via MMKV on native and `localStorage` on web. The store has two layers:

- **Persisted state**: tournament data, players, teams, display settings
- **UI state** (not persisted, resets on app restart): `modal`, `selectedMatchId`, `editingPlayerId`, `editingTeamCode`, `winnerPlayerId`, `viewingRound`, `viewingTournament`

The `modal` field drives all bottom sheets and overlays — it's a discriminated union in `src/store/types.ts`. Every modal is rendered inline in the screen that owns it, controlled by `store.setModal('name')` / `store.setModal(null)`.

### Business Logic

- **Standings** (`src/utils/standings.ts`): W=3 D=1 L=0, sorted Pts → GD → GF → Name
- **Equal games rule**: before `finishRound()`, all `tournamentPlayers` must have the same `played` count — guard this in the UI before calling
- **Ranked vs friendly**: `tournamentRanked` flag on each round. Only ranked rounds count toward `closeTournament()` champion calculation
- **Delete guards**: `deletePlayer` and `deleteTeam` silently no-op if the entity appears in current `matches`; callers show `cannotDelete` modal before calling

### Match Editing Rules (`app/match/[id].tsx`)

Two flags control what's editable on the match detail screen:

- `isCurrentRoundMatch` — match is in `matches` (the currently open round, not yet archived)
- `isEditableMatch` — match is in `matches` OR in `archivedRounds` while `hasTournament` is true

| Action | Condition |
|---|---|
| Edit score (header button) | `isEditableMatch` |
| Delete match (header button) | `isCurrentRoundMatch` only |
| Edit stats | `isEditableMatch` |
| Add / delete media | `isEditableMatch` |
| Edit commentary | `isEditableMatch` |

Once `closeTournament()` is called, `hasTournament` becomes false and matches move into `closedTournaments` — all edit UI disappears and the match is read-only.

All four store update actions (`updateMatchScore`, `updateMatchStats`, `updateMatchMedia`, `updateMatchNote`) update both `matches` and `archivedRounds`. Only `deleteMatch` touches `matches` exclusively — deleting from an archived round is not supported.

### Path Alias

`@/` maps to `src/`. Use it for all imports from `src/`:
```ts
import { useStore } from '@/store';
import { Colors } from '@/theme';
import { Avatar } from '@/components/Avatar';
```

### Design System

All design tokens are in `src/theme/`:
- `colors.ts` — `Colors.bg.*`, `Colors.text.*`, `Colors.accent.*`, `Colors.border.*`, `Colors.player[]`, `Colors.team[]`
- `typography.ts` — `FontFamily.*` (SairaCondensed for display/numbers, Sora for body), `FontSize.*`
- `spacing.ts` — `Spacing.*` (4–32), `Radius.*` (5–999)

Fonts are loaded once in `_layout.tsx` via `useFonts`. The app shows a spinner until fonts are ready.

### Component Library

Reusable components in `src/components/`:
- `Avatar` — colored circle with player initials or photo
- `StandingCard` — standings table row (rank, avatar, name, form chips, pts)
- `MatchCard` — match result card (team badges, score, player names)
- `StatsRow` — horizontal stat bar (label + two colored bars)
- `ScoreCounter` — tap +/- score input used in Add Match flow
- `NavHeader` — back button + title + optional right action
- `TeamBadge` — team color swatch + short code
- `StatusBadge` — W/D/L pill
- `FormChip` — single W/D/L chip (colored square)
- `MediaThumbnail` — photo/video thumbnail with delete option
- `SectionLabel` — uppercase muted section header
- `EmptyState` — centered icon + message placeholder

### Storage

MMKV (`react-native-mmkv`) on native, `localStorage` on web. The adapter is built inside `src/store/index.ts` using a platform check — never import MMKV directly outside the store.
