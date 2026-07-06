const importRound = {
  title: 'Importer un tour',
  noOpenRound: {
    title: 'Aucun tour ouvert',
    noTournament: 'Démarrez d\'abord un tournoi, puis ouvrez un tour avant d\'importer.',
    hasTournament: 'Ouvrez un nouveau tour sur l\'écran de journée avant d\'importer.',
  },
  roundIsOpen: 'Le tour est ouvert',
  supportedFormats: 'Formats pris en charge',
  sheetsFormat: 'Collage Google Sheets (7 col.) :',
  csvFormat: 'CSV complet (6 col.) :',
  simpleCsvFormat: 'CSV simple (4 col.) :',
  logoNote: 'Les logos d\'équipe sont vides lors d\'un collage depuis Sheets — les équipes par défaut des joueurs sont utilisées.',
  pasteData: 'Coller les données',
  clear: 'Effacer',
  preview: 'Aperçu',
  parsingIssue: '⚠️  {{count}} erreur d\'analyse',
  parsingIssuePlural: '⚠️  {{count}} erreurs d\'analyse',
  newPlayers: '👤  {{count}} nouveau joueur sera créé',
  newPlayersPlural: '👤  {{count}} nouveaux joueurs seront créés',
  unknownTeams: '🛡  Codes d\'équipe inconnus — équipes par défaut des joueurs utilisées',
  matchesReady: '✅  {{count}} match prêt à importer',
  matchesReadyPlural: '✅  {{count}} matchs prêts à importer',
  importBtn: 'Importer {{count}} matchs',
  importBtnEmpty: 'Importer',
} as const;

export default importRound;
