const setup = {
  title: 'Новий турнір',
  subtitle: 'FC / FIFA · налаштування',
  tournamentNameLabel: 'Назва турніру',
  tournamentNamePlaceholder: 'напр. FC26 · Раунд 10',
  roundsLabel: 'Кількість раундів',
  roundsDesc: 'Кількість рейтингових раундів (0 = необмежено)',
  roundsUnlimited: '∞',
  playersLabel: 'Гравці й команди · {{count}} обрано',
  addPlayer: 'Додати гравця',
  manageTeams: 'Управління командами',
  startTournament: 'Розпочати турнір',
  newPlayer: 'Новий гравець',
  form: {
    name: "Ім'я",
    nickname: "Нікнейм (необов'язково)",
    defaultTeam: 'Команда за замовчуванням',
    color: 'Колір',
    playerNamePlaceholder: "Ім'я гравця",
    nicknamePlaceholder: 'напр. Fox',
  },
  addPlayerBtn: 'Додати гравця',
  teamFor: 'Команда для {{name}}',
  manageTeamsTitle: 'Управління командами',
  teamNamePlaceholder: 'Назва команди',
} as const;

export default setup;
