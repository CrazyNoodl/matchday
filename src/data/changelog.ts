export interface ChangelogEntry {
  version: string;
  date?: string;
  added?: string[];
  fixed?: string[];
  notes?: string[];
}

// Newest first. Add a new entry here whenever package.json's version is bumped.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.8.1',
    fixed: [
      'Matches within a round are now grouped into tour blocks — a tour is complete when every player has faced every other player once (N×(N-1)/2 matches); with 2 players each match is its own tour (#42)',
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
    notes: [
      'Add-match flow now has 26 dedicated tests covering every edge case of the OCR, media, and save paths — 274 total (#48)',
    ],
  },
  {
    version: '1.6.9',
    notes: [
      'Internal stability pass: match detail and settings screens split into focused hook + modal files (#45)',
      'AI stats import now has a 30-second timeout — no more infinite spinner if the network stalls (#45)',
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
    notes: [
      'Internal cleanup: extracted screen styles into dedicated .styles.ts files, split the global store into per-domain slices, and broke the round screen down into smaller focused files (add-match flow, dialogs)',
    ],
  },
  {
    version: '1.6.6',
    added: [
      'Light theme — toggle between dark and light appearance in Settings → Display',
    ],
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
    fixed: [
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
    added: [
      "A 'What's New' screen — tap the app version 3 times in Settings to see it",
    ],
    notes: [
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
