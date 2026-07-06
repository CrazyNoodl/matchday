const home = {
  sports: {
    football: 'Футбол',
    tennis: 'Теніс',
    basketball: 'Баскетбол',
  },
  liveTournament: 'Живий турнір',
  roundInfo: 'Раунд {{round}} / {{total}} · Сьогодні',
  progressRounds: '{{done}} / {{total}} рейтингових раундів',
  currentLeader: 'Поточний лідер',
  noLeaderTie: 'Немає лідера — нічия',
  noActiveTournament: 'Немає активного турніру',
  noActiveTournamentDesc: 'Розпочніть новий турнір для відстеження результатів та матчів',
  startNewTournament: 'Новий турнір',
  newMatchDay: 'Новий ігровий день',
  continueMatchDay: 'Продовжити',
  roundSubtitle: 'Раунд {{round}} · {{name}}',
  stats: 'Статистика',
  gamesCount: '{{count}} ігор',
  archive: 'Архів',
  archiveCount: '{{tournaments}} турнірів · {{games}} ігор',
  sheet: {
    title: 'Новий ігровий день',
    subtitle: '{{name}} · Раунд {{round}}',
    ranked: 'Рейтинговий · результати враховуються',
    friendly: 'Товариський · не враховується',
    startRound: 'Розпочати раунд',
  },
} as const;

export default home;
