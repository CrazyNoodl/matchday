const settings = {
  title: 'Settings',
  account: {
    signedIn: 'Signed in',
    signOut: 'Sign Out',
    signOutDesc: 'You will be signed out on this device.',
  },
  developer: {
    section: 'Developer',
    devModeOn: '🛠  Developer mode on',
    tapsToUnlock: '{{count}} more taps to unlock dev menu',
    menuLabel: 'Developer Menu',
    menuSub: 'Import tools and internal options',
  },
  play: {
    section: 'Play',
  },
  personalize: {
    section: 'Personalize',
  },
  more: {
    section: 'More',
  },
  tournament: {
    label: 'Tournaments',
    noActive: 'No active tournament',
  },
  data: {
    players: 'Players',
    playersCount: '{{count}} players',
    teams: 'Teams',
    teamsCount: '{{count}} teams',
    backup: 'Backup & Restore',
    backupSub: 'Export or import a local snapshot of your data',
  },
  display: {
    section: 'Display',
    theme: 'Theme',
    themeDark: 'Dark',
    themeLight: 'Light',
    themeAuto: 'Auto',
    showNicknames: 'Show nicknames',
    showNicknamesDesc: 'Display player nicknames instead of full names',
    showTeamLogos: 'Show team logos',
    showTeamLogosDesc: 'Display team badges on match cards',
    nicknamesOn: 'Nicknames on',
    nicknamesOff: 'Nicknames off',
    matches: 'Matches',
    groupByTours: 'Group matches by tours',
    groupByToursDesc: 'Split round matches into blocks by round-robin cycle',
    upcoming: 'Coming soon',
    inDevelopment: 'In development',
  },
  language: {
    section: 'Language',
    label: 'Language',
  },
  about: {
    appName: 'Matchday',
    version: 'Version {{version}}',
  },
  changelog: {
    title: "What's new",
    added: 'Added',
    changed: 'Changed',
    fixed: 'Fixed',
    internal: 'Internal',
    empty: 'No changelog entries yet.',
  },
  danger: {
    section: 'Danger Zone',
    resetAll: 'Reset All Data',
    resetTitle: 'Reset All Data?',
    resetDesc:
      'This will permanently delete all tournaments, matches, rounds, and reset to the default players and teams.',
    backupFirst: 'Backup My Data First',
    cancel: 'Cancel',
    reset: 'Reset',
  },
} as const;

export default settings;
