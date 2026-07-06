const importRound = {
  title: 'Імпорт раунду',
  noOpenRound: {
    title: 'Немає відкритого раунду',
    noTournament: 'Спочатку розпочніть турнір, потім відкрийте раунд перед імпортом.',
    hasTournament: 'Відкрийте новий раунд на екрані ігрового дня перед імпортом.',
  },
  roundIsOpen: 'Раунд відкрито',
  supportedFormats: 'Підтримувані формати',
  sheetsFormat: 'Вставка з Google Таблиць (7 стовпців):',
  csvFormat: 'Повний CSV (6 стовпців):',
  simpleCsvFormat: 'Простий CSV (4 стовпці):',
  logoNote: 'Логотипи команд порожні при вставці з Таблиць — використовуються команди гравців за замовчуванням.',
  pasteData: 'Вставити дані',
  clear: 'Очистити',
  preview: 'Перегляд',
  parsingIssue: '⚠️  {{count}} помилка розбору',
  parsingIssuePlural: '⚠️  {{count}} помилок розбору',
  newPlayers: '👤  Буде створено {{count}} нового гравця',
  newPlayersPlural: '👤  Буде створено {{count}} нових гравців',
  unknownTeams: '🛡  Невідомі коди команд — використано команди гравців за замовчуванням',
  matchesReady: '✅  {{count}} матч готовий до імпорту',
  matchesReadyPlural: '✅  {{count}} матчів готові до імпорту',
  importBtn: 'Імпортувати {{count}} матчів',
  importBtnEmpty: 'Імпортувати',
} as const;

export default importRound;
