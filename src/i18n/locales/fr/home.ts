const home = {
  sports: {
    football: 'Football',
    tennis: 'Tennis',
    basketball: 'Basketball',
  },
  liveTournament: 'Tournoi en direct',
  progressRounds: '{{done}} / {{total}} tours classés',
  currentLeader: 'Leader actuel',
  noLeaderTie: 'Aucun leader — égalité',
  noActiveTournament: 'Aucun tournoi actif',
  noActiveTournamentDesc:
    "Commencez un nouveau tournoi pour suivre les classements et l'historique",
  startNewTournament: 'Nouveau tournoi',
  newMatchDay: 'Nouvelle journée',
  continueMatchDay: 'Continuer',
  roundSubtitle: 'Tour {{round}} · {{name}}',
  stats: 'Stats',
  gamesCount: '{{count}} matchs',
  archive: 'Archives',
  archiveTournaments: '{{count}} tournoi',
  archiveTournamentsPlural: '{{count}} tournois',
  sheet: {
    title: 'Nouvelle journée',
    subtitle: '{{name}} · Tour {{round}}',
    ranked: 'Classé · résultats comptent dans le tournoi',
    friendly: 'Amical · non comptabilisé dans les stats',
    startRound: 'Démarrer le tour',
  },
} as const;

export default home;
