# Matchday

A 1-vs-1 football/FIFA tournament tracker for small groups. Built with Expo (iOS, Android, Web).

Players compete in round-robin match days, results and per-match stats are recorded, and standings are calculated automatically with a head-to-head tiebreaker. Data syncs to the cloud (Supabase) so it's available across devices.

## Features

- **Tournaments & match days** — create a tournament, run round-robin rounds ("match days"), finish/archive them, close the tournament to crown a champion.
- **No-repeat pairings** — within a round, players who've already faced each other are disabled when adding a new match.
- **Standings** — points (W=3/D=1/L=0), sorted by Pts → Goal Difference → Goals For → Name, with a head-to-head tiebreaker and recent-form (W/D/L) chips. Table or card view, optional goals-per-game columns.
- **Match detail & stats** — 23 stat types per match (possession, shots, xG, passes, tackles, cards, etc.), plus photos/short clips attached to a match.
- **AI stat import (OCR)** — scan a screenshot of an in-game stats screen and auto-fill the 23 stat fields (dev-only lab screen, uses an LLM behind a proxy).
- **Ranking & head-to-head stats** — an all-time leaderboard across every tournament, plus per-pair H2H breakdowns.
- **Season stats** — stats scoped to a single tournament, with a ranked/friendly round filter.
- **Archive** — browse every closed tournament and its rounds.
- **Share as image** — export a round's results or the current standings as a shareable image card.
- **Cloud sync** — Supabase-backed sync across devices, with offline support (local-first, retries on reconnect) and a local JSON backup/restore as a second safety net.
- **Demo mode** — explore the app with sample data without touching your real tournament/cloud data.
- **Player & team management** — add/edit players and teams (colors, logos), with i18n (Ukrainian, English, French) and dark/light/auto theming throughout.

## Tech stack

- [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/) / React Native 0.85 / React 19
- [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- [Zustand](https://github.com/pmndrs/zustand) for state, persisted via MMKV (native) / `localStorage` (web)
- [Supabase](https://supabase.com/) for auth, database sync, and media storage
- [Jest](https://jestjs.io/) (unit) + [Playwright](https://playwright.dev/) (E2E) for tests
- [Storybook](https://storybook.js.org/) for component development
- [Sentry](https://sentry.io/) (error tracking) and [Aptabase](https://aptabase.com/) (product analytics), both optional and no-op without config

## Getting started

```bash
npm install
cp .env.example .env   # fill in your own Supabase project (and optionally Anthropic/Sentry/Aptabase) keys
npx expo start
```

Then press `i` / `a` for iOS/Android simulator, `w` for web, or scan the QR code with Expo Go on a phone on the same WiFi.

### Environment variables (`.env`, not committed)

| Variable | Required | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Cloud sync, auth, media storage |
| `EXPO_PUBLIC_ANTHROPIC_API_KEY` | No | OCR stat import (dev-only Lab screen) |
| `EXPO_PUBLIC_ANTHROPIC_PROXY_URL` | No | Only for production web builds — see `cloudflare-worker/` |
| `EXPO_PUBLIC_APTABASE_APP_KEY` | No | Product analytics; no-ops if unset |
| `EXPO_PUBLIC_SENTRY_DSN` | No | Error reporting; no-ops if unset |

## Commands

```bash
npx tsc --noEmit          # type-check
npm test                  # unit tests (Jest)
npm run test:ci           # unit tests with coverage
npm run e2e               # full E2E suite (Playwright)
npm run e2e:smoke         # smoke subset, headless
npm run e2e:smoke:watch   # smoke subset, live browser
npm run lint               # ESLint
npm run format             # Prettier
npm run storybook:dev      # Storybook on :6006
```

## Project structure

```
app/            file-based routes (Expo Router) — screens
src/
  components/   reusable UI components
  store/        Zustand store (single source of truth), persisted via MMKV/localStorage
  supabase/     sync layer (push/pull, storage, auth)
  screens/      per-screen logic/hooks/modals kept out of the route file
  utils/        pure business logic (standings, stats aggregation, etc.)
  theme/        design tokens (colors, typography, spacing)
  i18n/         translations (uk / en / fr)
docs/
  CONTEXT.md    detailed architecture notes, what's implemented, known gaps
  pitfalls.md   i18n and bottom-sheet gotchas
e2e/            Playwright E2E specs
```

For a deep dive into the state model, storage layout, and non-obvious implementation details, see [`docs/CONTEXT.md`](docs/CONTEXT.md).

## Contributing / development workflow

All work happens in isolated git worktrees branched from `dev` (never `main` directly):

```bash
./scripts/new-feature.sh <name> [fix|feature|test]   # creates ../matchday-wt-<name>
./scripts/finish-feature.sh <name>                     # merges into dev, cleans up
```

See [`CLAUDE.md`](CLAUDE.md) for the full workflow, coding conventions, and pre-push checklist.

## License

MIT — see [`LICENSE`](LICENSE).
