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

**Before calling `finish-feature.sh`, update `docs/CONTEXT.md` in the main repo** (not the worktree) with what was built: add the feature to the "What is fully implemented" table, remove it from "What is NOT implemented" if it was listed there, update the open GitHub issues list if any were closed, and note any non-obvious implementation details discovered. The worktree is deleted after `finish-feature.sh` — update CONTEXT.md first.

**Before any `git push` to `main` or `dev`, run through this checklist:**

1. `docs/CONTEXT.md` is up to date
2. `npm test` is green
3. `npm run e2e:smoke` is green
4. Version was bumped
5. Changelog was updated
6. Resolved GitHub issues are closed

**Never run `finish-feature.sh` (or otherwise merge a feature/fix/test branch into `dev`) without the user explicitly confirming first.** Finishing work in a worktree and merging it are separate steps — wait for direct approval before merging, even if the work appears complete.

**When implementation in a worktree is done, automatically start the local dev server and open it in a browser for testing** — don't wait to be asked. Set the browser tab title to the GitHub issue number being worked on (e.g. `#23 — media slider`) so the user can tell which tab corresponds to which issue/worktree when several are open at once. This title is a transient local-testing aid only (e.g. set via `document.title` in the test session) — it must never be committed or written into `app.config.js`'s permanent `web.name`/`shortName`.

**Before declaring a worktree feature done, cover it with tests and run the suite (`npm test`).** Add/update Jest tests for the new behavior (see `src/store/__tests__/` for the existing pattern), then run `npm test` and make sure it's green — don't just type-check and eyeball the browser. Only after tests pass and the browser smoke-test looks right should you tell the user it's ready for merge review.

**List active worktrees:**

```bash
git worktree list
```

Worktrees live at `../matchday-wt-<name>` (sibling of this directory). Each has its own `node_modules` and Metro cache.

## Commands

```bash
# Start dev server (Metro bundler) — QR code for phone on same WiFi shown by default
npx expo start

# Type-check
npx tsc --noEmit

# Open on specific platform
npx expo start --ios
npx expo start --android
```

```bash
# Run tests
npm test

# Run tests in CI mode with coverage
npm run test:ci
```

Jest is configured (`jest-expo` preset). Tests live alongside the code they cover, e.g. `src/store/__tests__/`.

```bash
# E2E tests (Playwright)
npm run e2e              # all 17 tests headless
npm run e2e:smoke        # 7 smoke tests headless
npm run e2e:smoke:watch  # 7 smoke tests with live browser (SLOWMO=1500)
npm run e2e:ui           # Playwright UI mode
```

```bash
# Release build — installs standalone .app directly on device (no Metro needed)
# Use this to test offline, on the street, or like a real App Store build.
# DO NOT use bare xcodebuild — it produces an incomplete bundle.
npx expo run:ios --configuration Release --device <udid>

# Find device UDID
xcrun xctrace list devices
# Artem's iPhone 16e: 00008140-000E225C0EF2801C
```

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

| Action                       | Condition                  |
| ---------------------------- | -------------------------- |
| Edit score (header button)   | `isEditableMatch`          |
| Delete match (header button) | `isCurrentRoundMatch` only |
| Edit stats                   | `isEditableMatch`          |
| Add / delete media           | `isEditableMatch`          |
| Edit commentary              | `isEditableMatch`          |

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

## Known Pitfalls

See `docs/pitfalls.md` for details. Read it before: adding/editing i18n locale keys, or building a bottom sheet with scrollable content (`Sheet` + `snapToMax`).
