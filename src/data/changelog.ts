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
    version: '1.5.0',
    added: [
      'Sign in with email/password and sync your data across devices',
      'Extract match stats from a photo automatically',
      'Share round results and standings as an image',
      'Demo mode — explore the app with sample data',
    ],
  },
];
