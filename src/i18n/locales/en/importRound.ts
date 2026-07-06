const importRound = {
  title: 'Import Round',
  noOpenRound: {
    title: 'No open round',
    noTournament: 'Start a tournament first, then open a round before importing.',
    hasTournament: 'Open a new round in the match day screen before importing.',
  },
  roundIsOpen: 'Round is open',
  supportedFormats: 'Supported formats',
  sheetsFormat: 'Google Sheets paste (7 cols):',
  csvFormat: 'Full CSV (6 cols):',
  simpleCsvFormat: 'Simple CSV (4 cols):',
  logoNote: 'Team logos are empty when pasted from Sheets — player default teams are used.',
  pasteData: 'Paste data',
  clear: 'Clear',
  preview: 'Preview',
  parsingIssue: '⚠️  {{count}} parsing issue',
  parsingIssuePlural: '⚠️  {{count}} parsing issues',
  newPlayers: '👤  {{count}} new player will be created',
  newPlayersPlural: '👤  {{count}} new players will be created',
  unknownTeams: '🛡  Unknown team codes — player defaults used',
  matchesReady: '✅  {{count}} match ready to import',
  matchesReadyPlural: '✅  {{count}} matches ready to import',
  importBtn: 'Import {{count}} matches',
  importBtnEmpty: 'Import',
} as const;

export default importRound;
