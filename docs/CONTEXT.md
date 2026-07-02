# Project Context — Matchday

> Read this first at the start of every session. Updated manually when features land or the picture changes.

## What the app is

1-vs-1 football/FIFA tournament tracker for small groups. Players compete in round-robin rounds, stats are recorded per match, standings are calculated with H2H tiebreaker. Cloud sync via Supabase.

Platforms: iOS, Android, Web. Expo SDK 56, React Native 0.85.3, React 19.2.3.

---

## Delete round — implementation detail

- **Open round** (`roundOpen = true`): `···` button in `/round` header opens a small anchored `DropdownMenu` (`src/components/DropdownMenu/`) with Finish / Stats / Delete Round. `deleteRound()` clears `matches`, `roundPlayers`, sets `roundOpen = false`.
- **Archived round** (inside still-open tournament): `···` button in `/archive-day` header opens the same dropdown pattern (also used by the match stats menu — three near-identical inline copies existed before `DropdownMenu` was extracted). `deleteArchivedRound(id)` removes the round from `archivedRounds`.
- Delete is only available while `hasTournament = true`. Closed tournaments are fully read-only.

**Fixed bug ([#55](https://github.com/CrazyNoodl/matchday/issues/55), 2026-07-02):** the round options menu used to be a `Sheet` (bottom sheet). The sequence `···` → `FINISH` → (equal-games-rule blocks it) → "EVEN OUT THE GAMES" dialog → `Got it` left it stuck open, covering the `+ ADD MATCH` FAB. Root cause: a guard deep in `@gorhom/bottom-sheet` (`isLayoutCalculated`) silently no-ops `close()` when it's called in the same render as another overlay opening or the sheet's own content resetting — confirmed via direct library source inspection, not just app-code timing. No prop-memoization or delay/defer fix worked around it. **Fix:** replaced the Sheet with `DropdownMenu`, the same reliable `Modal`-based anchored-popup pattern already used elsewhere — sidesteps the library bug entirely rather than working around it. `AddMatchSheet` (`src/screens/round/AddMatchSheet.tsx`) still uses `Sheet` and can hit the same underlying bug (e.g. a small leftover sliver after `SAVE MATCH`) — not yet migrated.

**Partially fixed ([#51](https://github.com/CrazyNoodl/matchday/issues/51), 2026-07-02):** the `···` kebab menu above already solved the original overflow (Stats/Finish/Delete moved off the header row). Remaining piece: `headerTitle` Text in `app/round.tsx` had no `numberOfLines`/`ellipsizeMode`, so a long tournament name wrapped to a second line instead of truncating — fixed by adding `numberOfLines={1} ellipsizeMode="tail"`. **Not addressed:** the issue's acceptance criteria also asked for FINISH to stay visible as a standalone primary CTA outside the menu — it currently lives inside the `···` dropdown only. Left as-is; flag if that's still wanted.

---

## Round numbering — implementation detail

**Fixed bug ([#52](https://github.com/CrazyNoodl/matchday/issues/52), 2026-07-02):** round ordinals used to count every archived round including friendly ones (`startRound()` computed `round: archivedRounds.length + 1`), so a friendly round consumed a number in the sequence and later ranked rounds looked off (e.g. 4, 5=friendly, 6, 7… instead of 4, friendly, 5, 6…).

- `startRound()` now computes the ordinal from `archivedRounds.filter(r => r.ranked).length + 1` — friendly rounds no longer consume a slot going forward.
- Already-archived rounds still carry a stale `ArchivedRound.n` from before this fix (no data migration was run). Display code does **not** read `.n` directly anymore — `src/utils/roundOrdinals.ts` (`getRankedRoundOrdinals`) recomputes the ranked-only ordinal live from the rounds array every render, so historical data self-corrects without a migration. `.n` is still written on `finishRound()` for now but is otherwise unused for display.
- Friendly rounds show `–` in the numeric badge instead of a number: `RoundCard` (both `card` and `row` variants), the `/round` header (shows "FRIENDLY" instead of "Round N" when `!tournamentRanked`), and `app/season-stats.tsx`'s round header follow the same rule.
- `ShareRoundModal` takes an explicit `roundNumber` prop (computed by the caller via `getRankedRoundOrdinals`) instead of reading `round.n` — used for the shared image's footer text, filename, and share-sheet title.

---

## String-literal types — implementation detail

**Partially addressed ([#56](https://github.com/CrazyNoodl/matchday/issues/56), 2026-07-02):** audited `src/` and `app/` for de-facto enums typed as raw `string`. Fixed the small/mechanical candidates:

- `MediaType = 'image' | 'video'` now exported from `src/store/types.ts` and reused by `src/supabase/storage.ts`, `src/components/MediaThumbnail/`, `src/components/MediaSlider/`, `src/screens/match/useMatchDetail.ts` — previously redeclared inline in each.
- `MatchResult = 'W' | 'D' | 'L'` now exported from `src/store/types.ts` and reused by `src/utils/standings.ts` (`getFormChips` return type) and `src/components/FormChip/` (component + styles) — previously three independent local declarations.
- `TournamentSyncStatus`/`RoundSyncStatus` now exported from `src/supabase/types.ts` instead of inline unions on the `Database` table rows.
- `settingsSlice.language` now typed as the existing (previously unused) `Language` union from `src/i18n/index.ts` instead of raw `string`.
- `useAddMatchFlow.ts`'s OCR confidence ranking helper now uses `ExtractedStat['confidence']` instead of `string` — closes a real typo hole (a bad literal like `'hi'` used to typecheck silently).

**Not addressed — left for a follow-up:** the biggest candidate, the 23 match-stat keys (`possession`, `shots`, etc., defined in `src/utils/statDefinitions.ts`), is still `string` across `matchStats.ts`, `mergedStats.ts`, `extractStats.ts`, `statsOverride`. Needs a design decision first: OCR (`extractStats.ts`) can legitimately produce keys outside the known set, so a fully closed union would need an escape hatch (e.g. `StatKey | (string & {})`) rather than a strict enum. `src/supabase/sync.ts`'s repeated `'active'/'closed'/'open'/'archived'` string literals were left as-is — already type-checked transitively via the typed `Database` schema in `.eq()` calls, so no safety gap there.

---

## Persistent auth session — implementation detail

**Fixed bug ([#54](https://github.com/CrazyNoodl/matchday/issues/54), 2026-07-02):** every cold app restart dropped the user back to the login screen. Root cause: `src/supabase/client.ts` set `persistSession: true` on the Supabase client but never supplied a `storage` adapter — on native, Supabase defaults to `@react-native-async-storage/async-storage`, which isn't installed in this project, so the session only ever lived in memory.

**Fix:** `src/supabase/client.ts` now builds an MMKV-backed storage adapter (`createMMKV({ id: 'supabase-auth' })`, a separate MMKV instance from the main store's `matchday-store`) and passes it as `auth.storage` — native only. On web, `storage` is left `undefined` so Supabase's default `localStorage` adapter (which already worked) keeps handling it. Mirrors the lazy-require + in-memory-fallback pattern already used for the main store's adapter in `src/store/index.ts` (falls back gracefully in Jest, where the native module isn't linked).

Covered by `src/supabase/__tests__/client.test.ts` (adapter wiring, web vs native branching, in-memory fallback) — but the actual cold-restart behavior can only be verified on a real device/simulator, not in Jest.

---

## State model (non-obvious)

```
matches          — current open round only (cleared on finishRound)
archivedRounds   — past rounds of the current active tournament
closedTournaments — fully finished tournaments (hasTournament = false after closeTournament())
```

- Once `closeTournament()` fires, `hasTournament` → false, matches move into `closedTournaments`, all edit UI disappears.
- Stats screen (`app/stats.tsx`) aggregates ALL three layers: `closedTournaments` + `archivedRounds` + `matches`.
- Modal system is a discriminated union in `src/store/types.ts`; all modals rendered inline in their screen, driven by `store.setModal('name')`.

---

## What is fully implemented

| Feature | Where |
|---|---|
| Tournament create/close/archive | `app/setup.tsx`, `app/tournament.tsx` |
| Round management (add match, finish, archive, delete) | `app/round.tsx`, `app/archive-day.tsx` |
| Match detail + 23-type stat entry | `app/match/[id].tsx` |
| Standings with H2H tiebreaker | `src/utils/standings.ts` |
| Form chips W/D/L (last 3) | `standings.ts → getFormChips` |
| Share Round as image | `src/components/ShareRoundModal/` |
| Share Standings as image | `src/components/ShareStandingsModal/` |
| Stats screen — Ranking (all-time) + H2H pairs | `app/stats.tsx` |
| Season stats | `app/season-stats.tsx` |
| Archive (closed tournaments accordion) | `app/archive.tsx`, `app/archive-day.tsx` |
| Match media: multi-select (up to 5), optimistic upload, full-screen swipeable viewer | `src/screens/match/useMatchDetail.ts`, `src/components/MediaSlider/` |
| OCR stat import (AI, dev-only) | `app/settings/(developer)/ocr-lab.tsx` |
| Player/team management | `app/settings/(data)/` |
| Supabase sync (selective, debounced 300ms) | `src/store/` |
| Persistent auth session (survives app restart) | `src/supabase/client.ts` |
| Demo mode | store flag |
| i18n (uk / en / fr) | `src/i18n/locales/` |
| Dark + light theme | `src/theme/` |
| Playwright E2E tests (17 tests, 7 smoke) | `e2e/` — `npm run e2e`, `npm run e2e:smoke` |

## Media upload — implementation detail

### Multi-select & slot cap

Both `handleAddMedia` (match detail, `src/screens/match/useMatchDetail.ts`) and `handlePickMedia` (add-match flow, `src/screens/round/useAddMatchFlow.ts`) enforce a **5-item cap** per match. The picker's `selectionLimit` is set dynamically to `5 - currentMediaCount` so the OS enforces the cap in the picker itself. If slots are full the button is disabled (`isMediaFull`).

### Optimistic upload

`handleAddMedia` saves items to the store **immediately** with `{ uri: localUri, type, uploading: true }` before the upload starts. The FlatList thumbnail shows a green spinner. Upload runs in the background; navigation away does not interrupt it. On completion the item is replaced:

- Upload OK → `{ uri: remoteUrl, type }` (remote URL, no flag)
- Upload failed → `{ uri: localUri, type, pendingUpload: true }` (retry overlay with ⚠)

`uploading: true` items are **stripped on store rehydration** (same as `pendingUpload`) so a crash during upload does not leave stuck spinners on next app launch. Implemented in `onRehydrateStorage` in `src/store/index.ts`.

UI rules for `uploading: true` thumbnails: no delete button, tap is disabled (can't view or retry something still in flight).

---

## Media cleanup on delete — implementation detail

When any delete action removes matches, the associated Supabase Storage files are cleaned up automatically:

- `deleteMatch(id)` — deletes media of the removed match
- `deleteRound()` — deletes media of all current-round matches
- `deleteArchivedRound(id)` — deletes media of all matches in that round
- `deleteClosedTournament(id)` — deletes media across all rounds of a closed tournament (new action, no UI yet)
- `resetStore()` — already handled full cleanup (unchanged)

Pattern: fire-and-forget. Local state updates synchronously; `deleteMediaItem()` runs in the background without blocking the UI. Items with `pendingUpload=true` are skipped (they were never uploaded). Implemented in `scheduleMediaCleanup()` helper at the top of `tournamentSlice.ts`.

---

## Storage folder structure — implementation detail

New uploads go into a hierarchical path inside the `match-media` bucket:

```
{userId}/{tournamentId}/{matchId}/{timestamp}-{randomId}.{ext}
```

`uploadMediaItem(localUri, type, context?)` and `uploadMediaItems(items, context?)` accept an optional `context: { tournamentId, matchId }`. When omitted, falls back to flat `{userId}/{filename}` (used for team logos and any call site that doesn't have tournament context).

- `useAddMatchFlow` generates `matchId` before calling upload so the folder exists at write time.
- `useMatchDetail` reads `store.tournamentId` (always correct for editable matches — closed tournaments are read-only).
- `deleteMediaItem` extracts the full path from the public URL, so deletion works for both old (flat) and new (structured) paths without changes.
- Old files in the flat structure remain valid; their URLs in the store keep working.

---

### Share cards — implementation detail

Both `ShareRoundModal` and `ShareStandingsModal` use:
- Native: `react-native-view-shot` (`captureRef`) → save to Photos or `expo-sharing`
- Web: `html2canvas` → download PNG or `navigator.share`

Both modules are **dynamic imports** (`import('react-native-view-shot')`) so the web bundle doesn't crash. The pattern must be preserved when editing these components.

`ShareRoundModal` has toggles: **Include standings** and **Include all matches** — switches that grow the card before capture.

---

## What is NOT implemented (gaps)

### 1. Match stats not aggregated in season view — biggest gap

23 stat types are collected per match (`src/utils/statDefinitions.ts`): possession, shots, xG, passes, tackles, interceptions, saves, fouls, cards, dribbles, accuracy, etc.

**None of these appear in the season/tournament summary.** The stats screen shows only W/D/L/GF/GA/PTS. All the rich `statsOverride` data on each match is collected but never surfaced in aggregate.

### 2. Records / milestones

No biggest win, longest unbeaten streak, best xG match, etc. anywhere in the UI.

### 3. Share single match result

Share round (all matches) and share standings exist. Share for one specific match (e.g. "3:1 vs Петро") does not exist.

### 4. Streak display

`getFormChips` returns W/D/L but consecutive-win streaks are never counted or displayed on home or stats screen.

---

## Open GitHub issues

Status drifts too fast to keep a manual table in sync (a closed issue was still listed as open here more than once) — run `gh issue list --repo CrazyNoodl/matchday --state open` for the current list instead.

Notable non-obvious resolution: #52 (round screen ordinal numbering) was resolved incidentally by the #42 tour-grouping change, which removed sequential per-match numbering entirely — closed 2026-07-02.

---

## MediaSlider — implementation detail

`src/components/MediaSlider/MediaSlider.tsx` — full-screen photo/video viewer opened from the match detail screen via `Modal`.

**Touch architecture (do not regress):**

```
Pressable overlay (onPress=onClose)   ← closes on tap outside slide
  └── FlatList (horizontal, pagingEnabled)
        └── Pressable slide (onPress=onClose)   ← closes on tap on image
```

- `FlatList` is a **direct child of the outer Pressable**, never wrapped inside another Pressable. Wrapping FlatList in a Pressable kills swipe gestures — the Pressable claims the touch responder before FlatList's pan handler can negotiate.
- Each slide is a `Pressable` **inside** FlatList (standard RN pattern). FlatList steals the responder for horizontal pans via `onMoveShouldSetResponderCapture`; simple taps reach the slide Pressable and fire `onClose`.
- Slide dimensions: `width × height` (full screen), not square. Image uses `resizeMode="contain"` so portrait and landscape photos are centred correctly.
- `FlatList` has `style={{ height: screenHeight, flexGrow: 0 }}` to prevent vertical stretch in the flex container.

---

## Keyboard avoidance in bottom sheets — implementation detail

`Sheet` component (`src/components/Sheet/Sheet.tsx`) has an `avoidKeyboard` prop. When set:
- Registers `Keyboard.addListener('keyboardWillShow/Hide')` via `useKeyboardHeight(enabled)` hook (`src/hooks/useKeyboardHeight.ts`)
- Adds keyboard height to the snap point so the sheet expands exactly to keep content above the keyboard
- Sets `keyboardBehavior='extend'` on the underlying BottomSheet

Any sheet with a `TextInput` must: pass `avoidKeyboard` to `<Sheet>` and use `BottomSheetTextInput` from `@gorhom/bottom-sheet` instead of the native `TextInput`.

Currently applied to: match commentary, add-match commentary step, edit round date, rename tournament.

---

## Key file locations

```
src/utils/statDefinitions.ts   — all 23 stat keys + labels
src/utils/standings.ts         — standings calc + H2H tiebreaker + getFormChips
src/utils/shareCard.ts         — shared column config for share cards
src/components/ShareRoundModal/    — share round image modal
src/components/ShareStandingsModal/ — share standings image modal
app/stats.tsx                  — Ranking + H2H tabs (all-time aggregation)
app/season-stats.tsx           — season-level stats screen
src/store/types.ts             — all types incl. modal discriminated union
src/store/index.ts             — Zustand store, MMKV/localStorage adapter
docs/pitfalls.md               — read before touching i18n or Sheet+scroll
```

---

## Worktree workflow reminder

```bash
./scripts/new-feature.sh <name> [fix|feature|test]   # creates ../matchday-wt-<name>
cp .env ../matchday-wt-<name>/.env                    # always — Supabase won't work without it
./scripts/finish-feature.sh <name>                    # only after explicit user confirmation
```

Never commit to `dev` directly. Never merge without the user explicitly saying so.
