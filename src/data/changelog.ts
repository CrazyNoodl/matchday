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
