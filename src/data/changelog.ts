export interface ChangelogEntry {
  version: string;
  date?: string;
  added?: string[];
  changed?: string[];
  fixed?: string[];
  internal?: string[];
}

// Newest first. Add a new entry here whenever package.json's version is bumped.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.9.33',
    fixed: [
      '"Reset All Data" is now disabled while offline, since it would wipe local data without being able to also wipe the cloud copy',
    ],
  },
  {
    version: '1.9.32',
    fixed: [
      'Confirm dialogs with a single button (e.g. "Cannot Delete") rendered with an invisible label — the button collapsed to a sliver instead of showing its text',
      '"Reset All Data" is now disabled while Demo Mode is active, preventing it from wiping real data',
    ],
    internal: [
      'Internal: removed an unused per-player color field',
    ],
  },
  {
    version: '1.9.31',
    internal: [
      'Internal: added Prettier and stricter ESLint rules (type-aware promise checks, banned Alert.alert/react-native-mmkv outside their allowed spots, theme-token/inline-style checks) — no visible change',
    ],
  },
  {
    version: '1.9.30',
    fixed: [
      'Fixed a sync bug where matches added while offline could vanish — a second edit landing while an earlier sync push was still mid-flight could race it, and the stale push then deleted the newer match from the cloud, which then got wiped locally too on the next app relaunch',
    ],
  },
  {
    version: '1.9.29',
    added: [
      'Display settings: "Group matches by tours" switch (default on) — turn it off to see a round\'s matches as one flat list instead of TOUR N blocks',
    ],
  },
  {
    version: '1.9.28',
    added: [
      'Tournament screen: a sort toggle next to "Played rounds" switches the list between newest-first (default) and oldest-first',
    ],
  },
  {
    version: '1.9.27',
    fixed: [
      'Match detail → Edit stats: a low-confidence (AI-flagged) stat can now be confirmed correct by tapping its label — previously the only way to clear the flag was nudging the value with +/-, even when it was already right',
    ],
  },
  {
    version: '1.9.26',
    internal: [
      'Internal: added e2e coverage for match detail editing, the Reset All Data safety cooldown, and local backup/restore; e2e fixtures now block all real Supabase network calls (Metro was inlining the live project URL/key into the test bundle regardless of playwright.config.ts overrides) — no visible change',
    ],
  },
  {
    version: '1.9.25',
    internal: [
      'Internal: added ESLint (eslint-config-expo + eslint-plugin-storybook) and cleaned up dead imports/vars, redundant Storybook story names, and stale eslint-disable comments — no visible change',
    ],
  },
  {
    version: '1.9.24',
    changed: [
      'Home screen: removed the "Round X / Y · Today" line from the live tournament card — it duplicated the progress bar below it and always said "Today" regardless of the actual date',
    ],
    fixed: [
      'Fixed "NEW MATCH DAY" button subtitle showing the wrong next round number when the most recently played round was a friendly one',
    ],
  },
  {
    version: '1.9.23',
    changed: [
      'Settings screen reordered: Personalize now comes first, Backup & Restore moved under More (after Demo Mode, before the version row), and Reset All Data moved into its own red "Danger Zone" card with a compact button instead of a full-width one',
      'Settings → Tournament: the button that opens the rename sheet now says "Rename" instead of "Save" (the sheet\'s own confirm button still says "Save")',
    ],
    internal: [
      'Internal: extracted the repeated title+card+divider section markup on the Settings screen into a shared `SettingsSection` component, and the Danger Zone block into `DangerZoneCard` — no visible change',
    ],
  },
  {
    version: '1.9.22',
    internal: [
      'Internal: replaced ~10 hand-rolled confirm/alert dialog implementations and repeated bottom-sheet header/footer markup with shared ConfirmDialog/SheetHeader/SheetFooter components, and consolidated two duplicate context-menu implementations onto the existing DropdownMenu — no visible change',
      'Fixed a latent bug where the tournament rename/close dialogs had two competing implementations (Tournament screen and Settings → Tournament) that could both react to the same state at once',
    ],
  },
  {
    version: '1.9.21',
    changed: [
      'Settings screen redesigned: account card up top (email + Sign Out), tournament/players/teams/backup grouped under "Play," display/language under "Personalize," and about/demo mode/developer tools under a plain "More" list',
      '"Show nicknames" and "Show team logos" moved to their own "Coming soon" section on Display settings and disabled, since neither is fully wired up yet',
    ],
  },
  {
    version: '1.9.20',
    added: [
      'Reset All Data confirmation now has a "Backup My Data First" shortcut straight to the backup screen',
    ],
    changed: [
      'Reset All Data confirmation now has a 5-second cooldown before the Reset button becomes tappable, shown as a countdown next to the title',
    ],
  },
  {
    version: '1.9.19',
    changed: [
      'Restoring a backup now pushes to the cloud automatically right after the confirmation — no separate "Push to Cloud" step to remember. A full-screen loader covers the restore, and a "Retry Cloud Sync" button appears if the cloud push fails',
      'Backups no longer include player photos, team logos, or match photos/videos, even as links — those can go stale if cloud data is ever reset',
    ],
  },
  {
    version: '1.9.18',
    fixed: [
      'Add Match: a photo that fails to upload is now flagged for retry (via the existing match-detail retry overlay) instead of silently staying local and never reaching Storage (#68)',
      "Add Match and OCR Lab: adding a new stat photo no longer re-scans every already-scanned photo, and removing a photo no longer wipes its siblings' already-extracted stats (#71)",
    ],
  },
  {
    version: '1.9.17',
    internal: [
      "What's New screen now splits entries into four categories (Added, Changed, Fixed, Internal) instead of three — separates real user-facing improvements from purely internal cleanup, each with its own color",
    ],
  },
  {
    version: '1.9.16',
    added: [
      "Add Match now dims and disables any opponent who already played the picked player this round-robin tour, so the same pairing can't repeat until a full tour completes",
    ],
  },
  {
    version: '1.9.15',
    internal: [
      'Internal: translation files (en/uk/fr) split into one file per screen instead of one 680-line file per language, and removed 12 unused translation keys — no visible change',
    ],
  },
  {
    version: '1.9.14',
    fixed: [
      'Fixed a crash when tapping "Import from file" in Backup settings on a physical device — a missing native module link is now handled gracefully with an error message instead of crashing the app',
    ],
  },
  {
    version: '1.9.13',
    fixed: [
      'Fixed a sync timing bug where a team or player added right after another change could vanish a moment later (its photo/logo still uploaded, but the record itself disappeared) — cloud sync no longer overwrites a just-made local change with a stale snapshot',
      'Clearing local data (sign-out) is now guaranteed to only ever affect this device, never cloud-synced data; "Reset All Data" in Settings now explicitly and reliably wipes cloud data too, as intended',
    ],
  },
  {
    version: '1.9.12',
    fixed: [
      "Team logos now load instantly offline once seen before, and fall back to the colored initials badge instead of a blank box when a logo can't load",
      'AI stat scan no longer surfaces a "goals" row that just duplicates the match score; any other stray stat outside the normal 23 can now be deleted individually (#72)',
    ],
  },
  {
    version: '1.9.11',
    added: [
      "Offline handling, phase 1: a banner appears when you lose connection, and any action that needs the network (adding photos, importing stats, team logos) is disabled until you're back online instead of failing silently (#73)",
    ],
    fixed: [
      'Local changes made right before the app is killed or crashes could be lost instead of syncing on next launch — pending changes are now saved and retried automatically on reconnect',
    ],
  },
  {
    version: '1.9.10',
    fixed: [
      'Several screens (Teams edit sheet, Players/Teams "cannot delete" dialogs, and others) always showed English text regardless of the selected language — hardcoded strings replaced with proper uk/en/fr translations',
    ],
  },
  {
    version: '1.9.9',
    internal: [
      'Settings → Players and Settings → Teams screens split into smaller files — the edit sheet and confirmation dialogs now live in their own components, mirroring the existing pattern used by the main Settings screen — no user-visible change',
    ],
  },
  {
    version: '1.9.8',
    changed: [
      'Photos are now downscaled before upload instead of only JPEG-compressed at the original camera resolution — regular match media and team logos cap to a smaller max dimension, and stat photos get a lighter downscale for the AI OCR pass plus a more aggressive one for the copy kept in Storage, cutting bandwidth/storage/OCR latency with no visible quality loss (#62)',
    ],
    internal: [
      'Added a "Resize Lab" developer tool (Settings → Developer Menu) to inspect before/after size and dimensions for any photo run through each of the new resize presets',
    ],
  },
  {
    version: '1.9.7',
    fixed: [
      'Media added from the match detail screen could land in a different Supabase Storage folder than media added when the match was first created, for matches whose round predated the per-round/per-match folder layout — both flows now always agree on the same folder (#67 follow-up)',
    ],
  },
  {
    version: '1.9.6',
    added: [
      'Pinch-to-zoom for photos in the full-screen media viewer — pinch and pan to zoom in, double-tap or release to reset; swiping to the next/previous photo is disabled while zoomed in (#64)',
      'Theme picker now offers an "Auto" option that follows your phone\'s system dark/light appearance live, in addition to Dark and Light (#60)',
    ],
    changed: [
      'Match media storage reorganized into per-round/per-match folders (e.g. matchday-2026-07-03_1430/match_2-1_2026-07-03_1432) — deleting a match, round, or tournament now removes its media in a single batch instead of one file at a time (#67)',
    ],
    internal: [
      'Match-stat keys now use a typed escape-hatch union internally for better autocomplete and typo protection — no user-visible change (#57)',
    ],
  },
  {
    version: '1.9.5',
    added: [
      "Match stats edit screen now always shows all 23 tracked params in a fixed order — ones the AI didn't recognize show as a muted placeholder instead of being hidden, and a small dot marks values the AI wasn't fully confident about (#63)",
      'Expected Goals (xG) now steps by 0.1 in the stats editor instead of whole numbers; percentage stats (possession, dribbles, accuracy) are capped at 100 on each side (#63)',
      "Stat photos that don't look like a real stats screen are now rejected automatically during import/re-scan — they're no longer added to the match or applied as stats, and you're asked to upload a clearer photo instead (#63)",
    ],
    fixed: [
      'Re-scanning stats or adding new photos now shows a visible loading indicator for the entire upload + AI-read duration, including the wait for photos not yet downloaded from iCloud — previously the app could look frozen with no feedback (#65)',
      'Video upload and playback were both broken — video capture/selection is temporarily disabled and existing video attachments are hidden from the match screen until the underlying issue is investigated (#59)',
    ],
  },
  {
    version: '1.9.4',
    fixed: [
      'You no longer have to log in again every time the app is closed and reopened — the session is now stored on-device and restored automatically on launch (#54)',
    ],
  },
  {
    version: '1.9.3',
    internal: [
      'Added Playwright E2E test suite (13 tests, 5 smoke) covering home, teams, players, setup, and full tournament flow — runs automatically on every PR via GitHub Actions',
    ],
  },
  {
    version: '1.9.2',
    added: [
      'Select up to 5 photos/videos at once when adding media to a match — multi-select is always available; the picker limit adjusts automatically based on how many items are already attached',
    ],
    changed: [
      'Photos appear instantly after picking — upload happens in the background while you continue using the app; each thumbnail shows a spinner while uploading and switches to a retry indicator if the upload fails',
      'Media viewer now supports swipe gestures to move between photos — previously only the navigation arrows worked',
      'Media viewer closes by tapping anywhere on the image or on the dark background — no longer requires tapping the ✕ button',
    ],
    fixed: [
      'Media viewer now uses full screen height for each slide — portrait photos are centred correctly instead of being cropped to a square',
    ],
  },
  {
    version: '1.9.1',
    fixed: [
      'Re-scan in the stats context menu now reliably opens the photo picker on iOS — the picker was silently blocked when the stats dropdown modal had not yet fully dismissed',
      'Deleting a match, round, or tournament now also removes its associated photos and videos from Supabase Storage — no more orphaned files left behind',
    ],
    internal: [
      'Uploaded media is now stored in a structured folder path (userId/tournamentId/matchId) instead of a flat bucket root — makes media easier to manage and clean up',
    ],
  },
  {
    version: '1.9.0',
    fixed: [
      'Keyboard no longer covers text inputs in the commentary editor, add-match commentary step, edit round date, and rename tournament sheets — the sheet now lifts above the keyboard automatically (#36)',
      'Delete round modal no longer disappears after a few seconds — the sheet close animation no longer resets modal state when a dialog is shown on top (#52)',
      'Navigating back after deleting a round no longer returns to the deleted round screen — navigation stack is replaced on delete (#52)',
      'Add-match discard and save-error alerts replaced with in-app dialogs matching the rest of the app — no more native Alert popups in the add-match flow',
      'Max-photos warning in OCR lab replaced with in-app dialog',
    ],
    internal: [
      'Selective sync: only table groups with local changes are pushed to Supabase — reduces unnecessary writes on every autosave',
    ],
  },
  {
    version: '1.8.1',
    changed: [
      'Matches within a round are now grouped into tour blocks — a tour is complete when every player has faced every other player once (N×(N-1)/2 matches); with 2 players each match is its own tour (#42)',
    ],
    fixed: [
      'Round date chip in archived round view now scrolls with the content instead of staying fixed above it (#41)',
      'Standings table rows now have correct horizontal padding — cells no longer touch the card edge (#39)',
      'Keyboard no longer covers text inputs on the tournament name and add-match screens (#36)',
      'Demo mode banner no longer overlaps the primary CTA button (#40)',
      'All hardcoded colours replaced with theme tokens — light theme is now fully consistent across standings cards, share modals, and score display (#37, #38)',
      '"Save to Photos" button now shows a success/failure response and works correctly on iOS (#35)',
      'App no longer crashes during sync when a match has malformed JSON in its media or statsOverride fields (#15)',
      'OCR stats extraction now runs even when the Supabase upload fails — stats are not lost on connectivity issues (#49)',
      'Upload and OCR error messages now use in-app dialogs instead of native Alert — fixes broken file picker on web (#50)',
    ],
  },
  {
    version: '1.8.0',
    added: [
      'Closing the add-match sheet with unsaved progress (photos, score, or players selected) now shows a confirmation dialog — accidental swipe-to-dismiss no longer silently discards your match (#48)',
    ],
    fixed: [
      'Cancelling an in-flight OCR scan when the sheet is reset — no longer processes photos for a match that was already discarded (#48)',
      '"Import Stats" and "Add Media" buttons in match detail are now cross-blocked — starting one disables the other to prevent race conditions (#48)',
      'Sheet no longer fires its onClose callback when disableClose is active — prevents double-close side effects',
    ],
  },
  {
    version: '1.7.0',
    fixed: [
      'Removing a photo now correctly clears OCR stats — removing a video leaves stats intact (#48)',
      'A failed media upload now shows an error alert instead of silently discarding the match (#48)',
      'Picking photos in multiple batches now scans all of them together and correctly merges stats by confidence (#48)',
      'Add Media button and Back/Cancel are disabled while photo stats are being read — prevents overlapping scans (#48)',
      'Back/Cancel is blocked while the match is saving — prevents navigating away mid-save (#48)',
      'Cancel from step 1 closes the modal exactly once, even on devices where React runs effects twice in development (#48)',
      'Tapping Save Match twice rapidly no longer creates duplicate match entries (#48)',
      'Selecting more photos than the 7-item limit now caps both the gallery and OCR processing — no phantom scans on over-limit items (#48)',
      'After choosing Skip on stats, picking more photos no longer re-triggers scanning and potentially re-blocks the Next button (#48)',
      'Stats from a previous successful scan no longer survive into a failed state and get silently saved when the user taps Skip (#48)',
    ],
    internal: [
      'Add-match flow now has 26 dedicated tests covering every edge case of the OCR, media, and save paths — 274 total (#48)',
    ],
  },
  {
    version: '1.6.9',
    fixed: [
      'AI stats import now has a 30-second timeout — no more infinite spinner if the network stalls (#45)',
    ],
    internal: [
      'Internal stability pass: match detail and settings screens split into focused hook + modal files (#45)',
      'Match lookup wrapped in useMemo to avoid redundant scans on every render (#45)',
      'Supabase client fully typed — removed all `as any` casts from storage and sync layers (#44)',
      'i18n guard: duplicate locale keys now caught in CI before they reach users (#44)',
      'Added 40 new tests covering store slices, utils, and screen hooks — 248 total (#43, #44, #45)',
    ],
  },
  {
    version: '1.6.8',
    added: [
      'Match media viewer is now a swipeable slider — tap any thumbnail to open fullscreen and swipe between photos and videos',
      'Round date on the archive screen can now be edited while the tournament is open — tap the date to change it',
      'Teams screen now shows a small color swatch next to each team logo so you can see the fallback color at a glance',
    ],
    fixed: [
      'Home tournament card no longer hides the leader section when the top of the standings is tied — now shows "No leader — tie" instead',
    ],
  },
  {
    version: '1.6.7',
    internal: [
      'Internal cleanup: extracted screen styles into dedicated .styles.ts files, split the global store into per-domain slices, and broke the round screen down into smaller focused files (add-match flow, dialogs)',
    ],
  },
  {
    version: '1.6.6',
    added: ['Light theme — toggle between dark and light appearance in Settings → Display'],
    fixed: [
      'Stats screen showed raw translation keys instead of text due to a duplicate locale block (#27)',
      'Edit stats sheet now scrolls fully instead of clipping the stat list at the bottom (#32)',
    ],
  },
  {
    version: '1.6.5',
    fixed: [
      'Demo mode toggle in Settings now responds to tapping directly on the switch (was silently ignored)',
      'Demo mode confirmation replaced with an in-app dialog matching the player/team delete style',
      'Keyboard no longer pops up automatically when opening the tournament screen',
    ],
  },
  {
    version: '1.6.4',
    added: [
      'Swap match sides in stats import — flips home/away teams and scores with one tap',
      'Context menu (⋯) on imported stats: Re-scan, Edit, or Clear without leaving the sheet',
      'Stat photos are automatically saved to the match media gallery when the match has no photos yet (#13)',
    ],
    fixed: [
      'Stats import sheet no longer closes when scrolling through long stat lists',
      'Sheet height no longer clips content on devices with a home indicator',
      'Archived round screen now reflects swaps and edits immediately without navigating away',
    ],
  },
  {
    version: '1.6.3',
    changed: [
      'Bottom sheets (New Match Day, Add Match, Edit Score/Stats, etc.) now swipe down to dismiss and size themselves to fit their content',
      'Standings tables (current round, tournament overview, archived rounds) keep the player column fixed in place while the stats scroll horizontally',
    ],
  },
  {
    version: '1.6.2',
    fixed: [
      'Deleting a player no longer leaves dangling references in closed tournament standings',
      'Newest match now consistently shows first across all round/tournament screens, and round order stays stable after sync',
      "Add Match's Save button now shows a loading state instead of appearing frozen",
    ],
  },
  {
    version: '1.6.1',
    fixed: [
      'A failed sync no longer gets mistaken for an empty cloud — fixes a rare case where real data could be wiped during sync',
    ],
  },
  {
    version: '1.6.0',
    added: ["A 'What's New' screen — tap the app version 3 times in Settings to see it"],
    internal: [
      'Internal cleanup: deduplicated store logic, memoized standings calculations, and moved every component into its own folder with tests/stories alongside it',
    ],
  },
  {
    version: '1.5.0',
    added: [
      'Sign in with email/password and sync your data across devices',
      'Extract match stats from a photo automatically',
      'Share round results and standings as an image',
      'Demo mode — explore the app with sample data',
    ],
  },
];
