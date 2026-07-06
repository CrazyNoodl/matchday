const archive = {
  title: 'Archives',
  season: 'Saison {{year1}} / {{year2}} · {{count}} journées',
  roundMatches: '{{count}} matchs',
  noRoundData: 'Aucune donnée disponible.',
  dayWinner: 'Vainqueur du jour',
  matchCount: '{{count}} matchs',
  draw: 'Match nul',
  noArchive: 'Aucun tournoi terminé',
  noArchiveDesc: 'Les tournois terminés apparaîtront ici',
  live: 'En direct',
  allMatches: 'Tous les matchs · appuyer pour les stats',
  noMatchesRecorded: 'Aucun match enregistré.',
  editDate: {
    title: 'Modifier la date',
    placeholder: 'JJ/MM/AAAA',
    invalid: 'Saisissez une date valide',
    cancel: 'Annuler',
    save: 'Enregistrer',
  },
  deleteRoundTitle: 'Supprimer le tour ?',
  deleteRoundDesc: 'Tous les matchs de ce tour seront définitivement supprimés.',
  deleteRoundConfirm: 'Supprimer le tour',
  championDaysWon: 'champion · {{count}} journées gagnées',
} as const;

export default archive;
