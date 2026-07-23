const home = {
  sports: {
    football: 'Football',
    tennis: 'Tennis',
    basketball: 'Basketball',
  },
  liveTournament: 'Live tournament',
  progressRounds: '{{done}} / {{total}} ranked rounds',
  currentLeader: 'Current leader',
  noLeaderTie: 'No leader — tie',
  noActiveTournament: 'No active tournament',
  noActiveTournamentDesc: 'Start a new tournament to track standings and match history',
  startNewTournament: 'Start new tournament',
  newMatchDay: 'New match day',
  continueMatchDay: 'Continue match day',
  roundSubtitle: 'Round {{round}} · {{name}}',
  stats: 'Stats',
  gamesCount: '{{count}} games',
  archive: 'Archive',
  archiveTournaments: '{{count}} tournament',
  archiveTournamentsPlural: '{{count}} tournaments',
  sheet: {
    title: 'New match day',
    subtitle: '{{name}} · Round {{round}}',
    ranked: 'Ranked · results count in tournament',
    friendly: 'Friendly · not counted in stats',
    startRound: 'Start round',
  },
} as const;

export default home;
